import type { CallContext } from "../../shared/entities";
import log from "../logger";
import type { ConversationStore } from "../services/conversation-store";
import type { DatabaseService } from "../services/database-service";
import type { LLMService } from "../services/llm-service";
import type { RelayService } from "../services/relay-service";

export interface FunctionServices {
  ctx: CallContext;
  db: DatabaseService;
  relay: RelayService;
  store: ConversationStore;
  llm: LLMService;
}

export function injectContext(prompt: string, ctx: CallContext) {
  let _p = prompt;

  // Inject dates
  const dt = ctx.today ? new Date(ctx.today) : new Date();
  _p = _p.replace("{{dateTime}}", dt.toLocaleString());
  _p = _p.replace(
    "{{date}}",
    `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`
  );
  _p = _p.replace("{{dateTime}}", dt.toLocaleTimeString());

  // Inject annotations into the prompt
  _p = _p.replace(
    "{{recallSuggestions}}",
    ctx.suggestions
      .map((suggestion, idx) => `(${idx + 1}) ${suggestion}`)
      .join("\n")
  );

  // Inject context variables
  _p = _p.replace(/{{\s*([\w.]+)\s*}}/g, (match, key: string) => {
    if (key in ctx) {
      const value = ctx[key as keyof CallContext];

      if (value === undefined || value === null) return "";

      return `${value}`;
    } else {
      log.warn(
        `bot\t {{${key}}} included in a prompt, but no variable (${key}) exists in context`
      );
      return "";
    }
  });

  return _p;
}
