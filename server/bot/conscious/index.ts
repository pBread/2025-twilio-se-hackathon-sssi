import { LLM_MODEL } from "../../env";
import { getInstructions } from "./instructions";
import * as fns from "./tool-functions";
import tools from "./tool-manifest";

export type ToolFnName = keyof typeof fns;

export default {
  fns,
  tools,
  model: LLM_MODEL ?? "gpt-4o",
  getInstructions,
};
