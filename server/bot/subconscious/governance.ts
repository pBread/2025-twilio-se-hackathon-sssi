import { CallContext } from "../../../shared/entities";
import { injectContext } from "../helpers";

const instructions = `\
Placeholder
`;

function getInstructions(ctx: CallContext) {
  return injectContext(instructions, ctx);
}

const governanceBot = { getInstructions };

export default governanceBot;
