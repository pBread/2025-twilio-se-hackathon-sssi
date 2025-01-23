import EventEmitter from "events";
import OpenAI from "openai";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources";
import type { Stream } from "openai/streaming";
import type {
  AddBotText,
  AddBotTool,
  BotMessage,
  BotMessageParams,
  BotText,
  BotTool,
  StoreMessage,
  ToolCall,
} from "../../shared/entities";
import bot, { type ToolFnName } from "../bot/conscious";
import { OPENAI_API_KEY } from "../env";
import log from "../logger";
import { makeId } from "../utils/misc";
import type { ConversationStore } from "./conversation-store";
import type { DatabaseService } from "./database-service";
import type { RelayService } from "./relay-service";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export class LLMService extends EventEmitter {
  constructor(
    public store: ConversationStore,
    private relay: RelayService,
    private db: DatabaseService
  ) {
    super();
  }

  stream?: Stream<ChatCompletionChunk>;

  /**
   * Triggers an LLM completion to begin. The conversation history is extracted from the store and sent to an llm for processing. The LLM may return a tool requests or a text completion. Tool requests will trigger a local execution of said tool, add the result to the store, then another completion will be triggered with the results.
   */
  doCompletion = async (): Promise<undefined | Promise<any>> => {
    // inject the "parking lot" into system messages. this is to ensure human messages are injected into the conscious bot before the next completion so it's top of mind
    if (this.store.parkingLot.length) {
      while (this.store.parkingLot.length) {
        const content = this.store.parkingLot.shift() as string;
        this.store.addSystemMessage({ content });
      }
      this.store.addHumanText({
        content: "What did the human agent tell you?",
        flag: "no-display",
      });
    }

    const messages = this.getMessageParams();

    // There should only be one completion stream open at a time. The stream will be aborted if the user interrupts.
    if (this.stream) {
      log.warn(
        "llm.comp",
        `completion started while another is ongoing. cancelled original completion.`
      );
      this.abort(); // aborts old completion so another can be started
    }

    try {
      this.stream = await openai.chat.completions.create({
        model: bot.model,
        messages,
        stream: true,
        tools: bot.tools,
      });
    } catch (error) {
      log.debug(
        "llm",
        "error when creating completion",
        JSON.stringify(
          { messages, storeMsgs: this.store.getMessages() },
          null,
          2
        )
      );
      throw error; // to do: stability. only enable this in development
    }

    // One completion may generate multiple store messages, e.g. one text completion saying "Hold on while I check" and one tool execution to query a database.
    let botText: BotText | undefined;
    let botTool: BotTool | undefined;

    let finish_reason: Finish_Reason | null = null;
    let idx = -1;

    for await (const chunk of this.stream) {
      idx++;
      const choice = chunk.choices[0];
      const delta = choice.delta;

      // deltas will be either text or tool requests
      const isTextDelta = "content" in delta && delta.content !== null;
      const isToolDelta = "tool_calls" in delta;

      const isFirstTextDelta = isTextDelta && !botText;
      const isFirstToolDelta = isToolDelta && !botTool;
      const isNewTool = isToolDelta && !!delta?.tool_calls?.[0].id; // One completion may have multiple tools, but the position in the tool_call array will always be 0. "id" is only emitted during the first delta of a new tool. There is also an "index" property on the tool_call object, that can also track this.

      if (!finish_reason) finish_reason = choice.finish_reason;

      let params: AddBotText | AddBotTool | undefined;

      // todo: add dtmf logic

      // handle the first text chunk of a completion
      if (isFirstTextDelta) {
        params = {
          content: delta.content,
          id: chunk.id,
          type: "text",
        } as AddBotText;

        botText = this.store.addBotText(params);
      }

      // handle subsequent chunks of botText completion
      if (isTextDelta && !isFirstTextDelta) {
        if (botText?.type !== "text") throw Error("Expected text"); // type guard
        botText.content += delta.content; // mutate the store record

        this.emit(
          "text-chunk",
          delta.content as string,
          false, // last chunk emitted after loop
          botText.content
        );
      }

      // handle the first chunk of the first tool of a completion
      if (isFirstToolDelta) {
        params = {
          id: chunk.id,
          tool_calls: delta.tool_calls,
          type: "tool",
        } as AddBotTool;
        botTool = this.store.addBotTool(params);
      }

      // handles the first chunk of subsequent tools of a completion w/multiple tools
      if (isToolDelta && !isFirstToolDelta && isNewTool) {
        const deltaTool = delta?.tool_calls?.[0];
        if (!botTool?.tool_calls) throw `No tool_calls on tool delta`; // should be unreachable
        botTool.tool_calls[deltaTool?.index as number] = deltaTool as ToolCall;
      }

      // handles subsequent chunks of all tool completions
      if (isToolDelta && !isFirstToolDelta && !isNewTool) {
        const toolDelta = delta?.tool_calls?.[0] as ToolCall;
        const tool = botTool?.tool_calls[toolDelta.index];
        if (!tool) throw Error("Expected tool_calls"); // should be unreachable

        // mutate the tool_call record of the store message
        tool.function.name += toolDelta.function.name ?? "";
        tool.function.arguments += toolDelta.function.arguments ?? "";
      }

      // emit an event for the first iteration
      if (idx === 0) {
        if (params) this.emit("completion.started", params);
        else {
          // this is an active bug. this should be unreachable but it's not. it seems to fire when completions include some combination of parallel text / tool requests
          log.error(
            "llm.comp",
            "No params created on first iteration",
            JSON.stringify({ params, botText, botTool, chunk }, null, 2)
          );
          this.abort();
        }
      }
    }

    if (botText) this.store.forceSync(botText.id); // update the store message to send it to sync
    if (botTool) this.store.forceSync(botTool.id); // update the store message to send it to sync

    // emits the final text chunk
    if (botText && finish_reason === "stop") {
      this.emit("text-chunk", "", true, botText.content);
    }

    if (botTool && finish_reason === "tool_calls") {
      if (botTool.type !== "tool") throw `Expected tool`; // type guard
      this.store.msgMap.set(botTool.id, botTool); // update the store message to send it to sync

      const fillerTimer = setTimeout(() => this.sayFiller(botTool), 500); // say filler phrase after 500ms

      // todo: add abort logic, i.e. these tools should not add records to the store if the completion is aborted while they are executing
      await Promise.allSettled(
        botTool.tool_calls.map((tool) => this.executeTool(botTool, tool))
      );

      clearTimeout(fillerTimer); // clear filler phrase if tools resolved before timer
    }

    this.stream = undefined;
    this.emit(
      "completion.finished",
      botText || botTool,
      finish_reason as Finish_Reason
    );

    // tools require another completion to generate text
    if (botTool && finish_reason === "tool_calls") return this.doCompletion();
  };

  executeTool = async (msg: BotTool, tool: ToolCall) => {
    const fnName = tool.function.name;
    let args: any; // should be a json object but validation is left to the function itself so it can be debugged in the bot/tools/ function rather than here.
    try {
      args = JSON.parse(tool.function.arguments);
    } catch (error) {
      log.debug(
        `llm`,
        "error parsing tool arguments",
        JSON.stringify({ tool, msg }, null, 2)
      );
      args = tool.function.arguments;
    }

    // ensure the function the bot is attempting to execute exists
    if (!(fnName in bot.fns)) {
      log.error("llm.tool", `missing function: ${fnName}`);
      throw Error(`Function not found: ${fnName}`);
    }

    const fn = bot.fns[fnName as ToolFnName];
    let result:
      | { status: "success"; data: any }
      | { status: "error"; error: any };

    try {
      log.info(
        "llm.tool",
        "tool execution starting",
        `${fnName}(${JSON.stringify(args)})`
      );

      this.emit("tool.starting", msg, tool);

      const data = await fn(args, this.fnContext);

      log.info(
        "llm.tool",
        "tool execution finished",
        `${fnName}(${JSON.stringify(args)}), result: ${JSON.stringify(data)}`
      );

      result = { status: "success", data };
      this.store.setBotToolResult(tool.id, result);
      this.store.forceSync(msg.id);
    } catch (error) {
      log.warn(
        "llm.tool",
        `tool execution error`,
        `${fnName}(${JSON.stringify(args)})`,
        error
      );
      result = { status: "error", error };
      this.store.setBotToolResult(tool.id, result);
      this.store.forceSync(msg.id);
      this.emit("tool.error", msg, tool, error);
    }

    return result;
  };

  /**
   * Bot tool functions can inject a filler phrase by defining a function "getFillerPhrase" as a property on the function.
   *
   * @example
   * function myToolFunc(){ ... }
   *
   * myToolFunc.getFillerPhrase = (args, svcs) => {
   *  return "Hold on partner while I call a function."
   * }
   */
  sayFiller = (msg: BotTool) => {
    let phrase: string | undefined;

    for (const tool of msg.tool_calls) {
      let args: any;
      try {
        args = JSON.parse(tool.function.arguments);
      } catch (error) {
        args = tool.function.arguments;
      }

      if (!(tool.function.name in bot.fns)) continue;

      const fn = bot.fns[tool.function.name as ToolFnName];
      if (!("getFillerPhrase" in fn)) continue;

      const prompt = fn?.getFillerPhrase(args, this.fnContext);
      if (prompt) {
        phrase = prompt;
        break; // the first tool with a filler phrase will be used in the event of a multi-tool request
      }
    }

    if (phrase) {
      log.info("llm", `saying filler phrase: "${phrase}"`);
      this.store.addBotText({
        content: phrase,
        id: makeId("filler"),
      });
      this.relay.sendTextToken(phrase, true);
    }

    return phrase;
  };

  /**
   * Converts the store's messages into the OpenAI schema
   */

  getMessageParams = () =>
    this.store
      .getMessages()
      .flatMap(this.translateStoreMsgToLLMParam)
      .map((msg) => {
        return msg.role === "tool" && !msg.content
          ? {
              ...msg,
              content: JSON.stringify({
                status: "unknown",
                message:
                  "The API request may still be open or it may have errored out.",
              }),
            }
          : msg;
      });

  /**
   * Converts the store's message schema to the OpenAI schema
   */
  translateStoreMsgToLLMParam = (
    msg: StoreMessage
  ): ChatCompletionMessageParam | ChatCompletionMessageParam[] => {
    if (msg.role === "bot" && (msg.type === "dtmf" || msg.type === "text"))
      return { role: "assistant", content: msg.content };

    if (msg.role === "bot" && msg.type === "tool") {
      // openAI expects the tool result as a message after the tool call. hence, bot tool message return an array that includes the initiation message and then each resulting tool call.
      let msgs: ChatCompletionMessageParam[] = [
        {
          role: "assistant",
          tool_calls: msg.tool_calls.map(({ result, ...tool }) => tool),
        },
      ];

      for (const tool of msg.tool_calls) {
        try {
          if (tool?.result === null) {
            log.debug(
              "llm",
              "Tool result is null. This should never happen. ",
              { tool, msg, allMsgs: this.store.getMessages() }
            );
          }
        } catch (error) {}

        let content: string;
        try {
          content = JSON.stringify(tool.result);
        } catch (err) {
          log.warn("llm", "error parsing tool result", msg);
          content = `{"status": "error", "error": "unknown" }`;
        }
        msgs.push({ role: "tool", content, tool_call_id: tool.id });
      }
      return msgs;
    }

    if (msg.role === "human") return { role: "user", content: msg.content };
    if (msg.role === "system") return { role: "system", content: msg.content };

    // this should be unreachable
    log.error("llm", `error translating store message to llm param`, msg);
    throw new Error(
      `error translating store msg to llm param. msg: ${JSON.stringify(msg)}`
    );
  };

  /**
   * Constructs an object to be passed to functions executions.
   */
  get fnContext() {
    return {
      ctx: this.store.call.callContext,
      db: this.db,
      llm: this,
      relay: this.relay,
      store: this.store,
    };
  }

  /**
   * Abort the current stream.
   */
  abort = () => {
    this.stream?.controller.abort();
    this.stream = undefined;
  };

  /****************************************************
   Event Typing
  ****************************************************/
  emit = <K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) =>
    super.emit(event, ...args);
  on = <K extends keyof Events>(event: K, listener: Events[K]): this =>
    super.on(event, listener);
}

interface Events {
  "completion.started": (msg: BotMessageParams) => void;
  "completion.finished": (msg?: BotMessage, reason?: Finish_Reason) => void;

  dtmf: (digits: string) => void; // dtmf digits the bot wants to send
  "text-chunk": (text: string, last: boolean, fullText?: string) => void; // chunk of text the LLM wants to say

  "tool.starting": (msg: BotTool, params: ToolCall) => void;
  "tool.finished": (msg: BotTool, params: ToolCall, result: any) => void;
  "tool.error": (msg: BotTool, param: ToolCall, error: any) => boolean;
}

type Finish_Reason =
  | "content_filter"
  | "function_call"
  | "length"
  | "stop"
  | "tool_calls";
