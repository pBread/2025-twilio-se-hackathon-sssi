import { CallContext } from "../../shared/entities";
import { injectContext } from "./util";

const greetings = [
  "You've reached Owl Tickets. A live agent will be available in approximately {{waitTime}} minutes. Can you tell me why you're calling so I can pass it along to the agent?",
  "Hello you've reached Owl Tickets. It will be approximately {{waitTime}} minutes to speak with a live agent. Can I gather a few details from you while we wait?",
];

export function getGreeting(ctx: CallContext) {
  return injectContext(
    greetings[Math.floor(Math.random() * greetings.length)],
    { waitTime: 6, ...ctx }
  );
}
