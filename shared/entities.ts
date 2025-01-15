import type { ChatCompletionTool } from "openai/resources";

/****************************************************
 Sync
****************************************************/
export interface CallRecord {
  id: string; // callSid

  callSid: string;
  callStatus: string;
  createdAt: string; // datetime
  from: string;
  to: string;
  summary: string;

  callContext: CallContext;
  config: DemoConfiguration;
  feedback: Annotation[];
}

export interface CallContext {
  today: Date | string; // today's date
  waitTime?: number;

  callingFromPhoneNumber?: string;
  user?: UserRecord;
  similarCalls: SimilarCall[];
  suggestions: string[];
  governance: Record<
    string,
    Record<string, "not-started" | "in-progress" | "complete" | "missed">
  >;
}

interface SimilarCall {
  callSid: string;
  id: string;
  similarity: number;
}

export interface Annotation {
  id: string;
  target: [number, number]; // message indexes this annoation is targeting
  comment: string;
  polarity: "bad" | "neutral" | "good";
}

export interface DemoConfiguration {
  isRecordingEnabled: boolean;

  conscious: {
    instructions: string;
    model: string;
  };
  subconscious: {
    isGovernanceEnabled: boolean;
    governanceInstructions: string;

    isRecallEnabled: boolean;
  };

  relayConfig: { sttProvider: string; ttsProvider: string; ttsVoice: string };

  segment: { isFetchProfileEnabled: boolean };
}

export interface LogRecord {
  _index?: number;
  id: string;
  callSid: string;
  createdAt: string | Date;
  description: string;

  source: LogSources;
  actions: LogActions[];
}

type LogSources = "Agent" | "Governance" | "Recall" | "Segment";

export type LogActions =
  | "Approval"
  | "Rejection"
  | "Added System Message"
  | "Updated Context"
  | "Updated Instructions";

/****************************************************
 Conversation State
****************************************************/
export type StoreMessage =
  | BotDTMF
  | BotText
  | BotTool
  | HumanDTMF
  | HumanText
  | SystemMessage;

export type BotMessage = BotDTMF | BotText | BotTool;
export type BotMessageParams = AddBotDTMF | AddBotText | AddBotTool;
export type HumanMessage = HumanDTMF | HumanText;

interface StoreRecord {
  _index?: number; // added dynamically by getMessages
  callSid: string;
  createdAt: string;
  id: string;
  seq: number; // sequence tracks the order in which messages were added. seq is not guaranteed to be the index of a message, only that it is greater than the last message
}

// represents DTMF tones from the bot
export interface BotDTMF extends StoreRecord {
  content: string;
  interrupted?: boolean;
  role: "bot";
  type: "dtmf";
}

export type AddBotDTMF = Omit<
  BotDTMF,
  "callSid" | "createdAt" | "id" | "seq" | "role" | "type"
> & {
  id?: string;
};

// represents a text from LLM that will be spoken
export interface BotText extends StoreRecord {
  content: string;
  interrupted?: boolean;
  role: "bot";
  type: "text";
}

export type AddBotText = Omit<
  BotText,
  "callSid" | "createdAt" | "id" | "seq" | "role" | "type"
> & {
  id?: string;
};

//represents the LLM requesting a FN tool be executed
export interface BotTool extends StoreRecord {
  role: "bot";
  tool_calls: ToolCall[];
  type: "tool";
}

export interface ToolCall {
  function: { name: string; arguments: any };
  id: string;
  index: number;
  result?: object;
  type: "function";
}

export type AddBotTool = Omit<
  BotTool,
  "callSid" | "createdAt" | "seq" | "role" | "type"
> & {
  id?: string;
};

// represents DTMF tones entered by a human
export interface HumanDTMF extends StoreRecord {
  content: string;
  role: "human";
  type: "dtmf";
}

export type AddHumanDTMF = Omit<
  HumanDTMF,
  "callSid" | "createdAt" | "id" | "seq" | "role" | "type"
> & {
  id?: string;
};

// represents transcribed speech from a human
export interface HumanText extends StoreRecord {
  content: string;
  role: "human";
  type: "text";
}

export type AddHumanText = Omit<
  HumanText,
  "callSid" | "createdAt" | "id" | "seq" | "role" | "type"
> & {
  id?: string;
};

// system messages include the initial instructions and subconscious guidance
export interface SystemMessage extends StoreRecord {
  content: string;
  role: "system";
}
export type AddSystemMessage = Omit<
  SystemMessage,
  "callSid" | "createdAt" | "id" | "seq" | "role" | "type"
> & { id?: string };

/****************************************************
 Database Entities
****************************************************/
export interface UserRecord {
  id: string; // us-123456

  firstName: string;
  lastName: string;

  email?: string;
  mobilePhone?: string;

  city?: string;
  state?: string;

  age?: string;

  membership: "none" | "silver" | "gold";

  paymentMethods: { lastFour: string; type: "card" }[];
}

export interface OrderRecord {
  id: string; // or-123456
  eventId: string;
  userId: string;

  confirmationNumber: string; // CR-00-00-00
  createdDateTime: string; // 2024-12-15 19:30

  eventDate: string; // format: 2024-12-15
  eventTime: string; // format: 19:30

  eventName: string;
  eventDescription: string;
  city: string;
  state: string;

  category: EventCategories;
  options: EventOption[];
  tags: EventTags[];
  talent: string[];
  venue: string;

  quantity: number;
  unitPrice: number; // unit price of ticket
  optionUnitPrice: number;
  totalPrice: number; // quantity * linePrice + quantity * optionUnitPrice
}

export interface EventRecord {
  id: string; // ev-123456
  date: string; // 2024-12-25
  time: string; // 19:30

  city: string;
  state: string; // CA, NY, TX, etc.
  venue: string;

  category: "concerts" | "sports" | "theater";
  description: string;
  name: string;
  options: EventOption[];
  talent: string[]; // array of the artists, performers, etc.
  tags: EventTags[];
  unitPrice: number;
}

interface EventOption {
  id: string; // eo-123456
  eventId: string;

  description: string;
  name: string;
  tags: OptionTags[];

  special: "none" | "discount-silver" | "discount-gold";
  price: number;
}

type OptionTags =
  | "alcohol"
  | "family-friendly"
  | "good-seats"
  | "meal"
  | "premium";

type EventCategories = "concerts" | "sports" | "theater";

type EventTags =
  // "concerts"
  | "country-music"
  | "edm-music"
  | "rap-music"
  | "pop-music"
  | "rock-music"

  // sports
  | "college-sports"
  | "pro-sports"
  | "playoffs"

  // baseball
  | "baseball"
  | "mlb"
  | "ncaa-baseball"

  // basketball
  | "basketball"
  | "nba"
  | "ncaa-basketball"

  // football
  | "football"
  | "nfl"
  | "ncaa-football"

  // theater
  | "theater"
  | "comedy"
  | "dance"
  | "musicals"
  | "plays"
  | "speaking-tour"

  // misc
  | "21-over"
  | "family-friendly"
  | "free-parking"
  | "handicap-accessible";

/****************************************************
 Human in Loop Schemas
****************************************************/
export interface AgentAssistRequest {
  id: string; // ar-123456
  callSid: string;

  order: OrderRecord;
  user: UserRecord;
  event: EventRecord;
  conversationSummary: string;

  questions: AIQuestion[];
}

export interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  status: "new" | "accepted" | "answered"; // new = initial; accepted = once agent accepts task; answered = agent answered question
}
