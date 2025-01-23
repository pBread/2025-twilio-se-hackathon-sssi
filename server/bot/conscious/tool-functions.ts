import { Twilio } from "twilio";
import { AIQuestion, HandoffData, OrderRecord } from "../../../shared/entities";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_DEFAULT_NUMBER,
} from "../../env";
import log from "../../logger";
import {
  addSyncQuestion,
  addSyncQuestionListener,
} from "../../services/sync-service";
import { getMonthName } from "../../utils/dictionary-dates";
import { getStateName } from "../../utils/dictionary-regions";
import { parseE164 } from "../../utils/e164";
import { makeId } from "../../utils/misc";
import { type FunctionServices } from "../helpers";
import { createFlexTask } from "../../services/twilio-flex";

const twilio = new Twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

/****************************************************
 Find Events
****************************************************/

interface FindEvents {
  category?: "concerts" | "sports" | "theater";
  city?: string;
  dateRange?: [string, string];
  state?: string;
  tags?: string[];
  timeRange?: [string, string];
}

export async function findEvents(
  { category, city, dateRange, state, tags, timeRange }: FindEvents,
  svcs: FunctionServices
) {
  const events = await svcs.db.events.list();
  const now = new Date();

  const _category = category?.toLowerCase();
  const _city = city?.toLowerCase();
  const _state = state?.toLowerCase();

  return events.filter((event) => {
    // Filter by date range if provided
    if (dateRange) {
      const eventDate = new Date(event.date);
      const [startDate, endDate] = dateRange;

      const start = startDate === "infinity" ? now : new Date(startDate);
      const end =
        endDate === "infinity" ? new Date("9999-12-31") : new Date(endDate);

      if (eventDate < start || eventDate > end) return false;
    }

    // Filter by time range if provided
    if (timeRange) {
      const [startTime, endTime] = timeRange;
      if (event.time < startTime || event.time > endTime) return false;
    }

    // Filter by city
    if (_city && event.city.toLowerCase() !== _city) return false;

    // Filter by state
    if (_state && event.state.toLowerCase() !== _state.toLowerCase())
      return false;

    // Filter by category
    if (_category && event.category !== _category) return false;

    // Filter by tags
    if (tags && tags.length > 0) {
      const hasMatchingTag = tags
        .map((tag) => tag.toLowerCase())
        .every((tag) =>
          event.tags.some((eventTag) => eventTag.toLowerCase().includes(tag))
        );
      if (!hasMatchingTag) return false;
    }

    return true;
  });
}

findEvents.getFillerPhrase = (
  { category, city, dateRange, state, tags, timeRange }: FindEvents,
  svcs?: FunctionServices
) => {
  const _category = category?.toLowerCase();
  const _city = city?.toLowerCase();
  const _state = state ? getStateName(state) : state;

  const phraseBases = [
    "I'm searching for events {{CONTEXT}}.",
    "Let me look for events {{CONTEXT}}.",
    "I'll find some events {{CONTEXT}}.",
    "Checking for events {{CONTEXT}}. ",
    "Searching our database for events {{CONTEXT}}.",
    "Looking up events {{CONTEXT}}.",
  ];

  const buildSearchContext = () => {
    const contextParts = [];

    // Location part
    if (_city && _state) {
      const locationParts = [
        `in ${_city}, ${_state}`,
        `in the city of ${_city}, ${_state}`,
        `happening in ${_city}, ${_state}`,
        `taking place in ${_city}, ${_state}`,
      ];
      contextParts.push(
        locationParts[Math.floor(Math.random() * locationParts.length)]
      );
    } else if (_city) {
      const locationParts = [
        `happening in ${_city}`,
        `in ${_city}`,
        `in the city of ${_city}`,
        `taking place in ${_city}`,
      ];
      contextParts.push(
        locationParts[Math.floor(Math.random() * locationParts.length)]
      );
    }

    // Date part
    if (dateRange) {
      const fromStr = dateRange?.[0]?.toLowerCase();
      const toStr = dateRange?.[1]?.toLowerCase();

      let dateParts: string[] | undefined;

      if (fromStr === "infinity" && toStr === "infinity") {
        // do nothing
      } else if (fromStr === toStr) {
        dateParts = [`on ${toStr}`];
      } else if (fromStr === "infinity" && toStr) {
        dateParts = [`before ${toStr}`];
      } else if (toStr === "infinity" && fromStr) {
        dateParts = [`after ${fromStr}`];
      } else if (fromStr && toStr) {
        dateParts = [
          `between ${fromStr} and ${toStr}`,
          `from ${fromStr} to ${toStr}`,
          `scheduled between ${fromStr} and ${toStr}`,
        ];
      }

      if (dateParts?.length)
        contextParts.push(
          dateParts[Math.floor(Math.random() * dateParts.length)]
        );
    }

    // Category part
    if (_category) {
      const categoryParts = [
        `in the ${_category} category`,
        `classified as ${_category}`,
        `listed under ${_category}`,
      ];
      contextParts.push(
        categoryParts[Math.floor(Math.random() * categoryParts.length)]
      );
    }

    // Tags part
    if (tags && tags.length > 0) {
      const tagParts = [
        `tagged as ${tags.join(" and ")}`,
        `with tags ${tags.join(" and ")}`,
        `labeled as ${tags.join(" and ")}`,
      ];
      contextParts.push(tagParts[Math.floor(Math.random() * tagParts.length)]);
    }

    // Time part
    if (timeRange) {
      const [start, end] = timeRange;
      const timeParts = [
        `starting between ${start} and ${end}`,
        `scheduled between ${start} and ${end}`,
        `with start times from ${start} to ${end}`,
      ];
      contextParts.push(
        timeParts[Math.floor(Math.random() * timeParts.length)]
      );
    }

    // Default if no parameters
    if (contextParts.length === 0) {
      const defaultParts = [
        "matching your criteria",
        "that might interest you",
        "available in our system",
      ];
      return defaultParts[Math.floor(Math.random() * defaultParts.length)];
    }

    // Join all parts with appropriate conjunctions
    return contextParts.reduce((acc, part, index) => {
      if (index === 0) return part;
      if (index === contextParts.length - 1) return `${acc} and ${part}`;
      return `${acc}, ${part}`;
    });
  };

  const selectedBase =
    phraseBases[Math.floor(Math.random() * phraseBases.length)];
  const selectedContext = buildSearchContext();

  const finalPhrase = selectedBase.replace("{{CONTEXT}}", selectedContext);

  return formatTextForSpeech(finalPhrase);
};

/****************************************************
 Find Events By Fuzzy Search
****************************************************/

interface FindEventsByFuzzySearch {
  query: string;
}

export async function findEventsByFuzzySearch(
  args: FindEventsByFuzzySearch,
  svcs: FunctionServices
) {
  // Placeholder for fuzzy search implementation
  log.info("bot.fn", "findEventsByFuzzySearch placeholder called");
  return [];
}

findEventsByFuzzySearch.getFillerPhrase = (
  args: FindEventsByFuzzySearch,
  svcs: FunctionServices
) => {
  return "Looking up events that match your description. Just a moment.";
};

/****************************************************
 Find User
****************************************************/

interface FindUser {
  email?: string;
  mobilePhone?: string;
}

export async function findUser(args: FindUser, svcs: FunctionServices) {
  if (!args.email && !args.mobilePhone) return;

  const users = await svcs.db.users.list();

  const _email = args.email?.toLowerCase();
  const _phone = args.mobilePhone?.replace(/\D/g, "");

  const user = users.find((user) => {
    if (_email && user.email?.toLowerCase() === _email) return true;
    if (_phone && _phone === user.mobilePhone?.replace(/\D/g, "")) return true;

    return false;
  });

  if (user) {
    // if the ctx already has some user properties defined, add the additional user details
    if (svcs.ctx.user)
      svcs.store.setContext({ user: { ...svcs.ctx.user, ...user } });
    // otherwise just set the user
    else svcs.store.setContext({ user });
  }

  return user;
}

/****************************************************
 Get Order By Confirmation Number
****************************************************/

interface GetOrderByConfirmationNumber {
  confirmationNumber: string;
}

export async function getOrderByConfirmationNumber(
  args: GetOrderByConfirmationNumber,
  svcs: FunctionServices
) {
  const cleanConfirmationNumber = args.confirmationNumber
    .replace(/\-/g, "")
    .toLowerCase();

  const orders = await svcs.db.orders.list();
  const order = orders.find(
    (order) =>
      order.confirmationNumber.replace(/\-/g, "").toLowerCase() ===
      cleanConfirmationNumber
  );

  return order;
}

getOrderByConfirmationNumber.getFillerPhrase = (
  { confirmationNumber }: GetOrderByConfirmationNumber,
  svcs: FunctionServices
) => {
  const phrases = [
    `Retrieving your order with confirmation number ${confirmationNumber}. One moment please.`,
    `Looking up the details for order ${confirmationNumber}. Just a second.`,
    `Let me find that order for you. The confirmation number is ${confirmationNumber}. Please wait.`,
    `Searching our system for order ${confirmationNumber}. Give me a moment.`,
  ];

  return formatTextForSpeech(
    phrases[Math.floor(Math.random() * phrases.length)]
  );
};

/****************************************************
 Get User Orders
****************************************************/

interface GetUserOrders {
  userId: string;
}

export async function getUserOrders(
  { userId }: GetUserOrders,
  svcs: FunctionServices
) {
  const orders = await svcs.db.orders.list();
  const userOrders = orders.filter((order) => order.userId === userId);

  return userOrders;
}

getUserOrders.getFillerPhrase = (
  args: GetUserOrders,
  svcs: FunctionServices
) => {
  const phrases = [
    `Pulling up all your current orders. Just a moment please.`,
    `Let me retrieve your complete order history. This will take a second.`,
    `Checking our system for all orders associated with your account. One moment.`,
    `Gathering information about your orders. Please wait while I fetch those details.`,
  ];

  return formatTextForSpeech(
    phrases[Math.floor(Math.random() * phrases.length)]
  );
};

/****************************************************
 Get User Payment Methods
****************************************************/
interface GetUserPaymentMethods {
  userId: string;
}

export async function getUserPaymentMethods(
  { userId }: GetUserPaymentMethods,
  svcs: FunctionServices
) {
  const user = await svcs.db.users.getById(userId);
  if (!user) return "User not found."; // @todo: This should probably throw an error. There needs to be a formalized and documented way of handling function errors.

  return user.paymentMethods;
}

getUserPaymentMethods.getFillerPhrase = (
  { userId }: GetUserPaymentMethods,
  svcs: FunctionServices
) => {
  const phrases = [
    "I'm checking to see if you have any payment methods on file.",
    "Let me see if you have any payment methods on file.",
  ];

  return formatTextForSpeech(
    phrases[Math.floor(Math.random() * phrases.length)]
  );
};

/****************************************************
 Issue Refund
****************************************************/

interface IssueRefund {
  orderId: string;
}

export async function issueRefund(args: IssueRefund, svcs: FunctionServices) {
  // Placeholder for refund implementation
  log.info("bot.fn", "issueRefund placeholder called");
  return "refund-initiated";
}

issueRefund.getFillerPhrase = (args: IssueRefund, svcs: FunctionServices) => {
  return "One moment while I attempt to process your refund.";
};

/****************************************************
 Pay By New Method
****************************************************/

interface PayByNewMethod {
  amount: number;
}

export async function payByNewMethod(
  args: PayByNewMethod,
  svcs: FunctionServices
) {
  // Placeholder for new payment method implementation
  log.info("bot.fn", "payByNewMethod placeholder called");
  return "payment-initiated";
}

payByNewMethod.getFillerPhrase = (
  { amount }: PayByNewMethod,
  svcs: FunctionServices
) => {
  return `You will now be transferred to a secure payment line. One moment.`;
};

/****************************************************
 Pay By Existing Method
****************************************************/
interface PayByExistingMethod {
  amount: number;
}

export async function payByExistingMethod(
  args: PayByExistingMethod,
  svcs: FunctionServices
) {
  // Placeholder for existing payment method implementation
  log.info("bot.fn", "payByExistingMethod placeholder called");
  return "payment-initiated";
}

payByExistingMethod.getFillerPhrase = (
  { amount }: PayByExistingMethod,
  svcs: FunctionServices
) => {
  return `I am processing the payment for ${amount} now.`;
};

/****************************************************
 Send Confirmation for New Order
****************************************************/
interface SendConfirmationForNewOrder {
  orderId: string;
  phoneNumber: string;
}

export async function sendConfirmationForNewOrder(
  { phoneNumber }: SendConfirmationForNewOrder,
  svcs: FunctionServices
) {
  // Placeholder for new order confirmation implementation
  log.info("bot.fn", "sendConfirmationForNewOrder placeholder called");

  let body =
    "Here are the details of your Owl Events orders. Please ensure these are correct before submitting payment information.";

  const name = svcs?.ctx.user?.firstName;
  if (name) body = `Hello ${name}, ${body}`;

  try {
    await twilio.messages.create({
      body,
      from: TWILIO_DEFAULT_NUMBER,
      to: phoneNumber,
    });

    return "success";
  } catch (error) {
    return "failed to send message";
  }
}

sendConfirmationForNewOrder.getFillerPhrase = (
  { phoneNumber }: SendConfirmationForNewOrder,
  svcs: FunctionServices
) => {
  const phrases = [
    `Sending a confirmation text to ${phoneNumber}. It should arrive in just a moment.`,
    `I'm sending the order details to your phone at ${phoneNumber}. Please watch for that message.`,
    `Your phone at ${phoneNumber} will receive a confirmation text shortly.`,
    `Watch for a text message at ${phoneNumber} with your order details. It's being sent now.`,
  ];

  return formatTextForSpeech(
    phrases[Math.floor(Math.random() * phrases.length)]
  );
};

/****************************************************
 Send Confirmation for Updated Order
****************************************************/

interface SendConfirmationForUpdatedOrder {
  orderId: string;
  phoneNumber: string;
}

export async function sendConfirmationForUpdatedOrder(
  args: SendConfirmationForUpdatedOrder,
  svcs: FunctionServices
) {
  // Placeholder for updated order confirmation implementation
  log.info("bot.fn", "sendConfirmationForUpdatedOrder placeholder called");
  return "confirmation-sent";
}

sendConfirmationForUpdatedOrder.getFillerPhrase = (
  { phoneNumber }: SendConfirmationForUpdatedOrder,
  svcs: FunctionServices
) => {
  const phrases = [
    `Sending the modified order details to ${phoneNumber}. Please check your messages shortly.`,
    `You'll receive a text at ${phoneNumber} with your updated order information. Watch for that.`,
    `A confirmation of your order changes is being sent to ${phoneNumber}. It will arrive momentarily.`,
    `I'm texting the updated order details to ${phoneNumber}. Please verify them when they arrive.`,
  ];

  return formatTextForSpeech(
    phrases[Math.floor(Math.random() * phrases.length)]
  );
};

/****************************************************
 Ask Agent
****************************************************/

interface AskAgent {
  question: string;
  explanation: string;
  recommendation: string;
}

export async function askAgent(args: AskAgent, svcs: FunctionServices) {
  // Placeholder for ask agent implementation
  log.info("bot.fn", "bot is asking an agent");

  const question: AIQuestion = {
    createdAt: new Date().toLocaleString(),
    answer: "",
    callSid: svcs.store.call.callSid,
    id: makeId("ai-question"),
    question: args.question,
    status: "new",
    explanation: args.explanation,
    recommendation: args.recommendation ?? "No recommendation",
  };

  await addSyncQuestion(question);

  addSyncQuestionListener(question.id, (update) => {
    log.debug("fns", "askAgent addSyncQuestionListener", update);

    if (update.status === "new") return;

    const content = `\
IMPORTANT UPDATE: A human agent has responded to your previous question. It is critical that your next response informs the customer. 

They have ${question.status} your request. Here is the comment they provided: 
== Start of Comment ==
${question.answer}.
== End of Comment ==

As a reminder, here is the question you asked: ${question.question}
`;

    svcs.store.setHumanInput(content);
  });

  const handoffData = await makeHandoffData(args.question, svcs);
  await createFlexTask(handoffData, question);

  return "agent-notified";
}

askAgent.getFillerFunction = (args: AskAgent, svcs: FunctionServices) => {
  return "I have sent a request to a human agent.";
};

/****************************************************
 Transfer to Agent
****************************************************/

interface TransferToAgent {
  reason: string;
}

async function makeHandoffData(reason: string, svcs: FunctionServices) {
  let user = svcs.ctx.user;
  if (!user)
    user = await svcs.db.users.getByChannel(
      svcs.ctx.callingFromPhoneNumber as string
    );

  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";

  const orders: OrderRecord[] = [];

  const handoffData: HandoffData = {
    reason,

    customerData: {
      userId: user?.id,
      callSid: svcs.store.call.callSid,

      name: firstName + lastName,
      firstName,
      lastName,
      initials: firstName[0] ?? "" + lastName[0] ?? "",

      email: user?.email ?? "placeholder@example.com",

      phoneNumber: user?.mobilePhone,
      phone: user?.mobilePhone,

      loyaltyTier: user?.membership ?? "NA",
      memberType: user?.membership ?? "NA",
      orders,
    },
    conversationSummary:
      svcs.store.call.summary.description ??
      svcs.store.call.summary.title ??
      "Call summary placeholder",
    reasonCode: "live-agent-handoff",
  };

  return handoffData;
}

export async function transferToAgent(
  args: TransferToAgent,
  svcs: FunctionServices
) {
  const handoffData = await makeHandoffData(args.reason, svcs);

  await sleep(4000);

  log.info("bot.fns", `transferring to agent`);

  svcs.relay.end(handoffData);

  return "call-transferred";
}

transferToAgent.getFillerPhrase = (
  args: TransferToAgent,
  svcs: FunctionServices
) => {
  const phrases = [
    `I'm connecting you with a human agent now. Please stay on the line.`,
    `Transferring you to one of our customer service representatives. One moment please.`,
    `Let me get you over to a human agent who can help. Please hold.`,
    `I'm transferring your call to a customer service specialist. They'll be with you shortly.`,
  ];

  return formatTextForSpeech(
    phrases[Math.floor(Math.random() * phrases.length)]
  );
};

/****************************************************
 Utilities
****************************************************/
async function simulateLatency(minMs = 300, maxMs = 3000) {
  const duration = Math.random() * (maxMs - minMs) + minMs;

  log.info("bot.fn", `simulating latency: ${Math.round(duration)}ms`);
  return await sleep(duration);
}

async function sleep(ms = 1000) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve("");
    }, ms)
  );
}

function formatTextForSpeech(text: string) {
  // Replace all email addresses
  const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let formattedText = text.replace(EMAIL_REGEX, (email) => {
    const [username, domain] = email.split("@");
    const formattedUsername = username.split("").join(" ");
    const formattedDomain = domain.replace(/\./g, " dot ");
    return `${formattedUsername} at ${formattedDomain}`;
  });

  // Replace all phone numbers
  const PHONE_REGEX = /\+\d{10,15}/g;
  formattedText = formattedText.replace(PHONE_REGEX, (phoneNumber) => {
    const parsedPn = parseE164(phoneNumber);
    if (!parsedPn) return phoneNumber;

    return parsedPn.formatted.international
      .replace(/[+()]/g, "") // remove +, (, and )
      .replace(/\-/g, " ") // replace "-" with " "
      .split(" ") // split pn into sections, e.g. "44 162 00000001" => ["44", "162", "00000001"]
      .map((section) => section.split("").join(" ")) // add a space between each char, e.g. "44" => "4 4"
      .join(" . "); // add a period between each section, e.g. "4 4 . 1 6 2 . 0 0 0 0 0 0 0 1"
  });

  // Replace all dates (format: YYYY-MM-DD)
  const DATE_REGEX = /\d{4}-\d{2}-\d{2}/g;
  formattedText = formattedText.replace(DATE_REGEX, (date) => {
    const dt = new Date(date);
    return `${getMonthName(dt.getUTCMonth())} ${dt.getUTCDate()}`;
  });

  // Replace all times (format: HH:mm)
  const TIME_REGEX = /\d{2}:\d{2}/g;
  formattedText = formattedText.replace(TIME_REGEX, (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  });

  // Replace all confirmation numbers (format: CR-55-12-34)
  const CONFIRMATION_NUMBER_REGEX = /CR-\d{2}-\d{2}-\d{2}/gi;
  formattedText = formattedText.replace(
    CONFIRMATION_NUMBER_REGEX,
    (confirmationNumber) => {
      return confirmationNumber
        .split("-")
        .map((part) => part.split("").join(" "))
        .join(" . ");
    }
  );

  return formattedText;
}
