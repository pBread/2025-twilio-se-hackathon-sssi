import {
  CallContext,
  CallRecord,
  DemoConfiguration,
  LogRecord,
  StoreMessage,
} from "./entities";
import { mockDatabase } from "./mock-database";

const DEVELOPERS_PHONE_NUMBER =
  process.env.DEVELOPERS_PHONE_NUMBER ??
  process.env.NEXT_PUBLIC_DEVELOPERS_PHONE_NUMBER ??
  "+15556667777";

const callContext: CallContext = {
  today: new Date().toLocaleString(),
  similarCalls: [
    {
      id: "dsfw252",
      callSid: "CA00000000000000000000000000000002",
      score: 0.92,
    },
  ],
  waitTime: 6,
  callingFromPhoneNumber: DEVELOPERS_PHONE_NUMBER,
  user: mockDatabase.users[0],
  suggestions: [
    "Avoid having customers repeat themselves by calling your tools to verify information whenever possible",
  ],
  governance: {
    modify_order: [
      {
        id: "identify_user",
        status: "missed",
      },
      {
        id: "get_order",
        status: "complete",
      },
      {
        id: "ask_agent",
        status: "in-progress",
      },
      {
        id: "send_modification_confirmation",
        status: "not-started",
      },
      {
        id: "process_payment",
        status: "not-started",
      },
      {
        id: "issue_refund",
        status: "not-started",
      },
    ],

    provide_order_information: [
      {
        id: "identify_user",
        status: "missed",
      },
      {
        id: "retrieve_user_orders",
        status: "not-started",
      },
      {
        id: "get_order_details",
        status: "not-started",
      },
    ],
  },
};

const config: DemoConfiguration = {
  relayConfig: {
    sttProvider: "deepgram",
    ttsProvider: "google",
    ttsVoice: "en-US-Journey-D",
  },
  segment: { isFetchProfileEnabled: true },
  isRecordingEnabled: false,
  consciousModel: "gpt-4o",
  isGovernanceEnabled: true,
  isRecallEnabled: true,
};

const calls: CallRecord[] = [
  {
    id: "CA00000000000000000000000000000001",
    callSid: "CA00000000000000000000000000000001",
    callStatus: "completed",
    from: DEVELOPERS_PHONE_NUMBER,
    to: "+18444405503",
    createdAt: new Date().toString(),
    summary: "Customer called in to modify an order.",
    callContext,
    feedback: [
      {
        id: "sd92kd923",
        polarity: "good",
        target: [0, 3],
        comment:
          "Reference the Segment Profile to make recommendations are relevant as possible.",
      },
    ],
    config: {
      relayConfig: {
        sttProvider: "deepgram",
        ttsProvider: "google",
        ttsVoice: "en-US-Journey-D",
      },
      segment: { isFetchProfileEnabled: true },
      isRecordingEnabled: false,
      consciousModel: "gpt-4o",

      isGovernanceEnabled: true,
      isRecallEnabled: true,
    },
  },
  {
    id: "CA00000000000000000000000000000002",
    callSid: "CA00000000000000000000000000000002",
    callStatus: "completed",
    from: DEVELOPERS_PHONE_NUMBER,
    to: "+18444405503",
    summary: "Customer called in to modify an order.",
    createdAt: new Date().toString(),
    callContext: {
      today: new Date().toLocaleString(),
      similarCalls: [
        {
          id: "92kd92s",
          callSid: "CA00000000000000000000000000000001",
          score: 0.89,
        },
      ],
      waitTime: 10,
      callingFromPhoneNumber: DEVELOPERS_PHONE_NUMBER,
      user: mockDatabase.users[0],
      suggestions: [
        "Reference the Segment Profile to make recommendations are relevant as possible.",
      ],
      governance: {
        modify_order: [
          {
            id: "identify_user",
            status: "missed",
          },
          {
            id: "get_order",
            status: "complete",
          },
          {
            id: "ask_agent",
            status: "in-progress",
          },
          {
            id: "send_modification_confirmation",
            status: "not-started",
          },
          {
            id: "process_payment",
            status: "not-started",
          },
          {
            id: "issue_refund",
            status: "not-started",
          },
        ],

        provide_order_information: [
          {
            id: "identify_user",
            status: "missed",
          },
          {
            id: "retrieve_user_orders",
            status: "not-started",
          },
          {
            id: "get_order_details",
            status: "not-started",
          },
        ],
      },
    },
    feedback: [
      {
        id: "asid832s",
        polarity: "good",
        target: [0, 3],
        comment:
          "Avoid having customers repeat themselves by calling your tools to verify information whenever possible",
      },
    ],
    config: {
      relayConfig: {
        sttProvider: "deepgram",
        ttsProvider: "google",
        ttsVoice: "en-US-Journey-D",
      },
      segment: { isFetchProfileEnabled: true },
      isRecordingEnabled: false,
      consciousModel: "gpt-4o",

      isGovernanceEnabled: true,
      isRecallEnabled: true,
    },
  },
];

const callMessages: Record<string, StoreMessage[]> = {
  [calls[0].callSid]: [
    {
      callSid: calls[0].callSid,
      id: "instructions",
      content:
        'You are a voice assistant answering phone calls for Owl Tickets, a ticket broker. You assist customers who are calling the support line when a human agent is not available or when there is wait time.\n\n# Goals & Objectives\n\n- **Primary Objective**: Your primary objective in every conversation is to: (1) identify who the user is and (2) why they are calling. This should always be the first thing you do.\n- **Scope**: You are empowered to help customers ONLY with the specific tasks listed in the "Procedures" section below.\n- **Transfer to Human Agent**: If the user requests a human agent or the conversation requires assistance beyond your scope, politely offer to transfer them.\n- **Your Identity**: Do not mention that you are an AI assistant, unless the customer asks. Stay in the role of an Owl Tickets support representative.\n- **Internal Data**: Do not divulge full user profile information. Only reference details the user would know, like their own email or phone number.\n\n# Formatting Responses for Speech\n\nYour responses will be spoken aloud to the user via a text-to-speech service. It is critical that your responses are formatted in a way can be spoken in a coherent and natural way.\n\n- **Avoid Non-Speakable Elements**: Do not use chat-style syntax such as bullet points, numbered lists, special characters, emojis, or any non-speakable symbols.\n- **Limit Lists**: If multiple items need to be listed (e.g., current orders), provide at most **two** of the most relevant ones based on context.\n- **Concise and Conversational**: Keep your responses concise, direct, and conversational.\n- **Special Data Types**: There are several data types that require specific formatting.\n  - **Numbers & String Identifiers**: Add spacing between characters when reading string identifiers or string numbers.\n    - Text-to-speech will translate numbers into words, which is coherent only when communicating a true numberical value, like a currency. Numbers that are part of a string must be separated by a space for them to be coherent.\n    - For instance, "Your confirmation number is CR-24-12-01" should be "Your confirmation number is C R - 2 4 - 1 2 - 0 1".\n    - Apply this logic to all special identifiers, not just the ones listed here.\n  - **Phone Numbers**: Enunciate each character separately and do not include "+".\n    - Example: "+12223334444" should be "1 2 2 2 3 3 3 4 4 4 4"\n  - **Email Addresses**: Enunciate each character separately and replace symbols with words.\n    - Example: "jsmith@gmail.com" should be "j s m i t h at gmail dot com"\n  - **Dates**:\n    - When speaking, format dates as "Month Day, Year". Example: "April 15, 2025".\n    - When calling tools, always use "YEAR-MO-DA". Example: "2025-04-15"\n  - **Times**:\n    - When speaking, use 12-hour format with "AM" or "PM". Example: "7:30 PM"\n    - When calling tools, always use 24 hour format. Example: "19:30"\n\n# Subsconscious\nThere are multiple LLMs powering the AI voice assistant. You are the conscious LLM, meaning you are fully responsible for generating speech for the user and executing tools. There are several subconscious LLMs running in the background. These subconscious LLMs analyze your conversation and inject\n\n## Notes From Previous Conversations\nThere is a subconscious process that is analyzing this conversation against previous conversations. These are important notes from the top 5 most similar conversations. It is CRITICAL that you consider these:\n\n[object Object],[object Object],[object Object],[object Object]\n\n# Procedures\n\nThe procedures are listed below as a structured JSON array. Here are some details about their usage:\n- Steps that are required "always" must be completed every time you execute a procedure. \n- Steps that are required "once" are only required to be executed once during the entire conversation with the user.\n  - For example, once you have identified the user, you do not need to identify the user again because you know who they are.\n\n== PROCEDURE JSON START == \n[{"id":"provide_order_information","name":"Provide Order Information","description":"Provide the user with information about their current orders.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"retrieve_user_orders","name":"Retrieve User Orders","description":"Retrieve all orders associated with the user\'s account using the getUserOrders function.","required":"always","function":"getUserOrders"},{"id":"get_order_details","name":"Get Order Details","description":"Get specific details about each order including event information.","required":"always","function":"getOrderByConfirmationNumber"}]},{"id":"modify_order","name":"Modify Order","description":"Modify or cancel a user\'s existing order.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_order","name":"Get Order","description":"Retrieve the specific order using its confirmation number.","required":"always","function":"getOrderByConfirmationNumber"},{"id":"send_modification_confirmation","name":"Send Modification Confirmation","description":"Send an SMS confirmation of the proposed changes to the user.","required":"always","function":"sendConfirmationForUpdatedOrder"},{"id":"process_payment","name":"Process Payment","description":"If additional payment is needed, process it using existing or new payment method.","required":"conditional","condition":"Modification requires additional payment","function":["payByExistingMethod","payByNewMethod"]},{"id":"issue_refund","name":"Issue Refund","description":"If modification results in a refund, process the refund.","required":"conditional","condition":"Modification results in refund","function":"issueRefund"},{"id":"ask_agent","name":"Request Agent Approval","description":"For modifications requiring approval, contact a human agent.","required":"conditional","condition":"Modification requires agent approval","function":["askAgent","transferToAgent"]}]},{"id":"find_event","name":"Find Event","description":"Help the user find events based on their criteria.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"search_events","name":"Search Events","description":"Search for events based on specified criteria (date, time, location, category, tags).","required":"always","function":["findEvents","findEventsByFuzzySearch"]}]},{"id":"book_event","name":"Book Event","description":"Book tickets for an event.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_payment_methods","name":"Get Payment Methods","description":"Retrieve the user\'s available payment methods.","required":"always","function":"getUserPaymentMethods"},{"id":"send_booking_confirmation","name":"Send Booking Confirmation","description":"Send an SMS confirmation of the booking details.","required":"always","function":"sendConfirmationForNewOrder"},{"id":"process_payment","name":"Process Payment","description":"Process payment for the booking using existing or new payment method.","required":"always","function":["payByExistingMethod","payByNewMethod"]}]}]\n== PROCEDURE JSON END ==\n\n# Authority and Permissions\nYou may perform some tasks independently, some tasks require approval from a human agent, and other tasks you are not authorized to perform. You can request approval by executing the "askAgent" tool. When a customer requires a task that you are not authorized to do, you should gather information from the customer about the request and pass it along when invoke "transferToAgent" at the end of the call.\n\nYou have the authority to independently:\n- Identify users\n- Search for and recommend events\n- Provide details about a user\'s current orders\n- Confirm order modifications via SMS\n- Process payments using existing payment methods \n\nYou must request approval from a human agent to:\n- Modify or cancel orders outside the 24-hour window\n- Issue refunds\n\nYou are not authorized to:\n- Modify or cancel orders for same-day events\n- Provide users with full profile details beyond their own contact information\n- Discuss internal company information or data\n- Perform any tasks that fall outside of the scope of the procedures\n',
      createdAt: "1/10/2025 16:05:14.418",
      seq: 13,
      role: "system",
      _index: 0,
    },
    {
      callSid: calls[0].callSid,
      content:
        "You've reached Owl Tickets. A live agent will be available in approximately 12 minutes. Can you tell me why you're calling so I can pass it along to the agent?",
      id: "greeting",
      createdAt: "1/10/2025 16:04:43.849",
      seq: 2,
      role: "bot",
      type: "text",
      _index: 1,
    },
    {
      callSid: calls[0].callSid,
      id: "context",
      content:
        'Here are details about the session: {"annotations":[{"id":"anno-001","target":[3,5],"comment":"It\'s good to infer the customer’s phone number from the number they’re calling on, but always confirm that it is the correct number.","polarity":"good"},{"id":"anno-002","target":[7,10],"comment":"It’s good that the bot tried to make use of the time while they waited for an agent response.","polarity":"good"},{"id":"anno-001","target":[4,6],"comment":"It\'s good to offer multiple ways to lookup an event for flexibility.","polarity":"good"},{"id":"anno-002","target":[8,10],"comment":"Be brief and clear when a customer mentions being in a hurry.","polarity":"good"}],"callingFromPhoneNumber":"+18475070348","waitTime":12,"user":{"id":"us-100002","firstName":"Jerry","lastName":"Maguire","email":"jerry.maguire@gmail.com","mobilePhone":"+18475070348","city":"Chicago","state":"IL","age":"26","membership":"gold","paymentMethods":[{"type":"card","lastFour":"1234"}]}}',
      createdAt: "1/10/2025 16:04:49.749",
      seq: 3,
      role: "system",
      _index: 2,
    },
    {
      callSid: calls[0].callSid,
      content:
        "Uh, yeah. I've got, uh, tickets to the Bulls Celtics game. Uh, I just need to know what time the event starts.",
      createdAt: "1/10/2025 16:05:05.206",
      id: "human-0000008",
      seq: 8,
      role: "human",
      type: "text",
      _index: 3,
    },
    {
      callSid: calls[0].callSid,
      seq: 9,
      id: "chatcmpl-AoILpkN82jqXnCfoZyqYGmlFNSS2d",
      tool_calls: [
        {
          index: 0,
          id: "call_JJFrigDR8Ontt2zYj7uxsh7O",
          type: "function",
          function: {
            name: "findUser",
            arguments: '{"mobilePhone":"+18475070348"}',
          },
          result: {
            status: "success",
            data: {
              id: "us-100002",
              firstName: "Jerry",
              lastName: "Maguire",
              email: "jerry.maguire@gmail.com",
              mobilePhone: "+18475070348",
              city: "Chicago",
              state: "IL",
              age: "26",
              membership: "gold",
              paymentMethods: [
                {
                  type: "card",
                  lastFour: "1234",
                },
              ],
            },
          },
        },
      ],
      type: "tool",
      createdAt: "1/10/2025 16:05:06.002",
      role: "bot",
      _index: 4,
    },
    {
      callSid: calls[0].callSid,
      seq: 10,
      id: "chatcmpl-AoILqDzUg4p9Oqkqo456UKD1jASiL",
      tool_calls: [
        {
          index: 0,
          id: "call_cTDYrKbq5OQIsxGyvnzzwP7v",
          type: "function",
          function: {
            name: "getUserOrders",
            arguments: '{"userId":"us-100002"}',
          },
          result: {
            status: "success",
            data: [
              {
                id: "or-100006",
                eventId: "ev-100007",
                userId: "us-100002",
                confirmationNumber: "CR-24-03-06",
                createdDateTime: "2023-12-15 09:00",
                eventDate: "2024-03-22",
                eventTime: "21:00",
                eventName: "Ultra Music Festival 2024",
                eventDescription: "Ultra Music Festival 2024 - 3 Day Pass",
                city: "Miami",
                state: "FL",
                category: "concerts",
                talent: [
                  "Swedish House Mafia",
                  "Martin Garrix",
                  "David Guetta",
                ],
                tags: ["edm-music", "21-over"],
                quantity: 2,
                unitPrice: 399,
                options: [
                  {
                    id: "eo-100007",
                    eventId: "ev-100007",
                    description:
                      "VIP Access with Premium Viewing Areas and Exclusive Lounges",
                    name: "VIP Experience",
                    special: "discount-gold",
                    price: 450,
                    tags: ["premium", "good-seats", "alcohol"],
                  },
                ],
                optionUnitPrice: 450,
                totalPrice: 1698,
                venue: "Ultra Music Festival",
              },
              {
                id: "or-100007",
                eventId: "ev-100002",
                userId: "us-100002",
                confirmationNumber: "CR-24-02-07",
                createdDateTime: "2024-01-10 10:15",
                eventDate: "2024-02-15",
                eventTime: "19:00",
                eventName: "Bulls vs Celtics",
                eventDescription:
                  "Chicago Bulls vs Boston Celtics - Regular Season Game",
                city: "Chicago",
                state: "IL",
                category: "sports",
                talent: ["Chicago Bulls", "Boston Celtics"],
                tags: ["basketball", "nba", "pro-sports"],
                quantity: 2,
                unitPrice: 125,
                options: [
                  {
                    id: "eo-100002",
                    eventId: "ev-100002",
                    description:
                      "VIP Courtside Experience with Pre-game Shootaround Access",
                    name: "Courtside VIP",
                    special: "discount-gold",
                    price: 350,
                    tags: ["premium", "good-seats"],
                  },
                ],
                optionUnitPrice: 350,
                totalPrice: 950,
                venue: "United Center",
              },
              {
                id: "or-100008",
                eventId: "ev-100003",
                userId: "us-100002",
                confirmationNumber: "CR-23-08-08",
                createdDateTime: "2023-07-01 16:45",
                eventDate: "2023-08-12",
                eventTime: "20:00",
                eventName: "Deadmau5 Live",
                eventDescription: "Deadmau5 Presents: We Are Friends Tour",
                city: "Chicago",
                state: "IL",
                category: "concerts",
                talent: ["Deadmau5", "NERO", "Kasablanca"],
                tags: ["edm-music", "21-over"],
                quantity: 2,
                unitPrice: 85,
                options: [
                  {
                    id: "eo-100003",
                    eventId: "ev-100003",
                    description:
                      "Meet & Greet with Deadmau5 + Exclusive Merch Bundle",
                    name: "VIP Package",
                    special: "discount-gold",
                    price: 200,
                    tags: ["premium"],
                  },
                ],
                optionUnitPrice: 200,
                totalPrice: 570,
                venue: "Radius Chicago",
              },
              {
                id: "or-100009",
                eventId: "ev-100005",
                userId: "us-100002",
                confirmationNumber: "CR-23-03-09",
                createdDateTime: "2023-02-15 13:30",
                eventDate: "2023-03-18",
                eventTime: "19:30",
                eventName: "NCAA Tournament - Second Round",
                eventDescription: "NCAA March Madness Second Round",
                city: "Las Vegas",
                state: "NV",
                category: "sports",
                talent: ["Arizona Wildcats", "Gonzaga Bulldogs"],
                tags: ["basketball", "ncaa-basketball", "college-sports"],
                quantity: 2,
                unitPrice: 150,
                options: [
                  {
                    id: "eo-100005",
                    eventId: "ev-100005",
                    description:
                      "All-Session Premium Seating with Hospitality Access",
                    name: "Premium Package",
                    special: "discount-gold",
                    price: 250,
                    tags: ["premium", "good-seats", "meal"],
                  },
                ],
                optionUnitPrice: 250,
                totalPrice: 800,
                venue: "T-Mobile Arena",
              },
              {
                id: "or-100010",
                eventId: "ev-100009",
                userId: "us-100002",
                confirmationNumber: "CR-23-01-10",
                createdDateTime: "2023-01-15 11:30",
                eventDate: "2023-01-28",
                eventTime: "19:30",
                eventName: "Bulls vs Bucks",
                eventDescription:
                  "Chicago Bulls vs Milwaukee Bucks - Regular Season Game",
                city: "Chicago",
                state: "IL",
                category: "sports",
                talent: ["Chicago Bulls", "Milwaukee Bucks"],
                tags: ["basketball", "nba", "pro-sports"],
                quantity: 2,
                unitPrice: 110,
                options: [
                  {
                    id: "eo-100009",
                    eventId: "ev-100009",
                    description:
                      "Premium Club Level Access with All-Inclusive Food & Beverage",
                    name: "Club Level VIP",
                    special: "discount-gold",
                    price: 275,
                    tags: ["premium", "good-seats", "meal"],
                  },
                ],
                optionUnitPrice: 275,
                totalPrice: 770,
                venue: "United Center",
              },
            ],
          },
        },
      ],
      type: "tool",
      createdAt: "1/10/2025 16:05:06.685",
      role: "bot",
      _index: 5,
    },
    {
      interrupted: true,
      callSid: calls[0].callSid,
      content:
        "The Bulls versus Celtics game is on February 15, 2024, and it starts at 7 PM. If you have any more questions, ",
      id: "chatcmpl-AoIh2bJZXf9XiqgedsZLpCZ9gRKlj",
      type: "text",
      createdAt: "1/10/2025 16:05:07.715",
      seq: 11,
      role: "bot",
      _index: 6,
    },
    {
      callSid: calls[0].callSid,
      content: "Thanks. Have a good one",
      createdAt: "1/10/2025 16:06:05.206",
      id: "human-0000055xi838",
      seq: 12,
      role: "human",
      type: "text",
      _index: 7,
    },
  ],
  [calls[1].callSid]: [
    {
      callSid: calls[1].callSid,
      id: "instructions-474",
      content:
        'You are a voice assistant answering phone calls for Owl Tickets, a ticket broker. You assist customers who are calling the support line when a human agent is not available or when there is wait time.\n\n# Goals & Objectives\n\n- **Primary Objective**: Your primary objective in every conversation is to: (1) identify who the user is and (2) why they are calling. This should always be the first thing you do.\n- **Scope**: You are empowered to help customers ONLY with the specific tasks listed in the "Procedures" section below.\n- **Transfer to Human Agent**: If the user requests a human agent or the conversation requires assistance beyond your scope, politely offer to transfer them.\n- **Your Identity**: Do not mention that you are an AI assistant, unless the customer asks. Stay in the role of an Owl Tickets support representative.\n- **Internal Data**: Do not divulge full user profile information. Only reference details the user would know, like their own email or phone number.\n\n# Formatting Responses for Speech\n\nYour responses will be spoken aloud to the user via a text-to-speech service. It is critical that your responses are formatted in a way can be spoken in a coherent and natural way.\n\n- **Avoid Non-Speakable Elements**: Do not use chat-style syntax such as bullet points, numbered lists, special characters, emojis, or any non-speakable symbols.\n- **Limit Lists**: If multiple items need to be listed (e.g., current orders), provide at most **two** of the most relevant ones based on context.\n- **Concise and Conversational**: Keep your responses concise, direct, and conversational.\n- **Special Data Types**: There are several data types that require specific formatting.\n  - **Numbers & String Identifiers**: Add spacing between characters when reading string identifiers or string numbers.\n    - Text-to-speech will translate numbers into words, which is coherent only when communicating a true numberical value, like a currency. Numbers that are part of a string must be separated by a space for them to be coherent.\n    - For instance, "Your confirmation number is CR-24-12-01" should be "Your confirmation number is C R - 2 4 - 1 2 - 0 1".\n    - Apply this logic to all special identifiers, not just the ones listed here.\n  - **Phone Numbers**: Enunciate each character separately and do not include "+".\n    - Example: "+12223334444" should be "1 2 2 2 3 3 3 4 4 4 4"\n  - **Email Addresses**: Enunciate each character separately and replace symbols with words.\n    - Example: "jsmith@gmail.com" should be "j s m i t h at gmail dot com"\n  - **Dates**:\n    - When speaking, format dates as "Month Day, Year". Example: "April 15, 2025".\n    - When calling tools, always use "YEAR-MO-DA". Example: "2025-04-15"\n  - **Times**:\n    - When speaking, use 12-hour format with "AM" or "PM". Example: "7:30 PM"\n    - When calling tools, always use 24 hour format. Example: "19:30"\n\n# Subsconscious\nThere are multiple LLMs powering the AI voice assistant. You are the conscious LLM, meaning you are fully responsible for generating speech for the user and executing tools. There are several subconscious LLMs running in the background. These subconscious LLMs analyze your conversation and inject\n\n## Notes From Previous Conversations\nThere is a subconscious process that is analyzing this conversation against previous conversations. These are important notes from the top 5 most similar conversations. It is CRITICAL that you consider these:\n\n[object Object],[object Object],[object Object],[object Object]\n\n# Procedures\n\nThe procedures are listed below as a structured JSON array. Here are some details about their usage:\n- Steps that are required "always" must be completed every time you execute a procedure. \n- Steps that are required "once" are only required to be executed once during the entire conversation with the user.\n  - For example, once you have identified the user, you do not need to identify the user again because you know who they are.\n\n== PROCEDURE JSON START == \n[{"id":"provide_order_information","name":"Provide Order Information","description":"Provide the user with information about their current orders.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"retrieve_user_orders","name":"Retrieve User Orders","description":"Retrieve all orders associated with the user\'s account using the getUserOrders function.","required":"always","function":"getUserOrders"},{"id":"get_order_details","name":"Get Order Details","description":"Get specific details about each order including event information.","required":"always","function":"getOrderByConfirmationNumber"}]},{"id":"modify_order","name":"Modify Order","description":"Modify or cancel a user\'s existing order.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_order","name":"Get Order","description":"Retrieve the specific order using its confirmation number.","required":"always","function":"getOrderByConfirmationNumber"},{"id":"send_modification_confirmation","name":"Send Modification Confirmation","description":"Send an SMS confirmation of the proposed changes to the user.","required":"always","function":"sendConfirmationForUpdatedOrder"},{"id":"process_payment","name":"Process Payment","description":"If additional payment is needed, process it using existing or new payment method.","required":"conditional","condition":"Modification requires additional payment","function":["payByExistingMethod","payByNewMethod"]},{"id":"issue_refund","name":"Issue Refund","description":"If modification results in a refund, process the refund.","required":"conditional","condition":"Modification results in refund","function":"issueRefund"},{"id":"ask_agent","name":"Request Agent Approval","description":"For modifications requiring approval, contact a human agent.","required":"conditional","condition":"Modification requires agent approval","function":["askAgent","transferToAgent"]}]},{"id":"find_event","name":"Find Event","description":"Help the user find events based on their criteria.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"search_events","name":"Search Events","description":"Search for events based on specified criteria (date, time, location, category, tags).","required":"always","function":["findEvents","findEventsByFuzzySearch"]}]},{"id":"book_event","name":"Book Event","description":"Book tickets for an event.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_payment_methods","name":"Get Payment Methods","description":"Retrieve the user\'s available payment methods.","required":"always","function":"getUserPaymentMethods"},{"id":"send_booking_confirmation","name":"Send Booking Confirmation","description":"Send an SMS confirmation of the booking details.","required":"always","function":"sendConfirmationForNewOrder"},{"id":"process_payment","name":"Process Payment","description":"Process payment for the booking using existing or new payment method.","required":"always","function":["payByExistingMethod","payByNewMethod"]}]}]\n== PROCEDURE JSON END ==\n\n# Authority and Permissions\nYou may perform some tasks independently, some tasks require approval from a human agent, and other tasks you are not authorized to perform. You can request approval by executing the "askAgent" tool. When a customer requires a task that you are not authorized to do, you should gather information from the customer about the request and pass it along when invoke "transferToAgent" at the end of the call.\n\nYou have the authority to independently:\n- Identify users\n- Search for and recommend events\n- Provide details about a user\'s current orders\n- Confirm order modifications via SMS\n- Process payments using existing payment methods \n\nYou must request approval from a human agent to:\n- Modify or cancel orders outside the 24-hour window\n- Issue refunds\n\nYou are not authorized to:\n- Modify or cancel orders for same-day events\n- Provide users with full profile details beyond their own contact information\n- Discuss internal company information or data\n- Perform any tasks that fall outside of the scope of the procedures\n',
      createdAt: "1/10/2025 16:05:14.418",
      seq: 13,
      role: "system",
      _index: 0,
    },
    {
      callSid: calls[1].callSid,
      content:
        "You've reached Owl Tickets. A live agent will be available in approximately 12 minutes. Can you tell me why you're calling so I can pass it along to the agent?",
      id: "greeting-7747",
      createdAt: "1/10/2025 16:04:43.849",
      seq: 2,
      role: "bot",
      type: "text",
      _index: 1,
    },
    {
      callSid: calls[1].callSid,
      id: "context-878",
      content:
        'Here are details about the session: {"annotations":[{"id":"anno-001","target":[3,5],"comment":"It\'s good to infer the customer’s phone number from the number they’re calling on, but always confirm that it is the correct number.","polarity":"good"},{"id":"anno-002","target":[7,10],"comment":"It’s good that the bot tried to make use of the time while they waited for an agent response.","polarity":"good"},{"id":"anno-001","target":[4,6],"comment":"It\'s good to offer multiple ways to lookup an event for flexibility.","polarity":"good"},{"id":"anno-002","target":[8,10],"comment":"Be brief and clear when a customer mentions being in a hurry.","polarity":"good"}],"callingFromPhoneNumber":"+18475070348","waitTime":12,"user":{"id":"us-100002","firstName":"Jerry","lastName":"Maguire","email":"jerry.maguire@gmail.com","mobilePhone":"+18475070348","city":"Chicago","state":"IL","age":"26","membership":"gold","paymentMethods":[{"type":"card","lastFour":"1234"}]}}',
      createdAt: "1/10/2025 16:04:49.749",
      seq: 3,
      role: "system",
      _index: 2,
    },
    {
      callSid: calls[1].callSid,
      content:
        "Uh, yeah. I've got, uh, tickets to the Bulls Celtics game. Uh, I just need to know what time the event starts.",
      createdAt: "1/10/2025 16:05:05.206",
      id: "human-000005548",
      seq: 8,
      role: "human",
      type: "text",
      _index: 3,
    },
    {
      callSid: calls[1].callSid,
      seq: 9,
      id: "chatcmpl-AoILpkN82462CfoZyqYGmlFNSS2d",
      tool_calls: [
        {
          index: 0,
          id: "call_JJFrigDR8Ontt2zYj7uxsh7O",
          type: "function",
          function: {
            name: "findUser",
            arguments: '{"mobilePhone":"+18475070348"}',
          },
          result: {
            status: "success",
            data: {
              id: "us-100002",
              firstName: "Jerry",
              lastName: "Maguire",
              email: "jerry.maguire@gmail.com",
              mobilePhone: "+18475070348",
              city: "Chicago",
              state: "IL",
              age: "26",
              membership: "gold",
              paymentMethods: [
                {
                  type: "card",
                  lastFour: "1234",
                },
              ],
            },
          },
        },
      ],
      type: "tool",
      createdAt: "1/10/2025 16:05:06.002",
      role: "bot",
      _index: 4,
    },
    {
      callSid: calls[1].callSid,
      seq: 10,
      id: "chatcmpl-sdfsdfw2525",
      tool_calls: [
        {
          index: 0,
          id: "call_cTDYrKbq5OQIsxGyvnzzwP7v",
          type: "function",
          function: {
            name: "getUserOrders",
            arguments: '{"userId":"us-100002"}',
          },
          result: {
            status: "success",
            data: [
              {
                id: "or-100006",
                eventId: "ev-100007",
                userId: "us-100002",
                confirmationNumber: "CR-24-03-06",
                createdDateTime: "2023-12-15 09:00",
                eventDate: "2024-03-22",
                eventTime: "21:00",
                eventName: "Ultra Music Festival 2024",
                eventDescription: "Ultra Music Festival 2024 - 3 Day Pass",
                city: "Miami",
                state: "FL",
                category: "concerts",
                talent: [
                  "Swedish House Mafia",
                  "Martin Garrix",
                  "David Guetta",
                ],
                tags: ["edm-music", "21-over"],
                quantity: 2,
                unitPrice: 399,
                options: [
                  {
                    id: "eo-100007",
                    eventId: "ev-100007",
                    description:
                      "VIP Access with Premium Viewing Areas and Exclusive Lounges",
                    name: "VIP Experience",
                    special: "discount-gold",
                    price: 450,
                    tags: ["premium", "good-seats", "alcohol"],
                  },
                ],
                optionUnitPrice: 450,
                totalPrice: 1698,
                venue: "Ultra Music Festival",
              },
              {
                id: "or-100007",
                eventId: "ev-100002",
                userId: "us-100002",
                confirmationNumber: "CR-24-02-07",
                createdDateTime: "2024-01-10 10:15",
                eventDate: "2024-02-15",
                eventTime: "19:00",
                eventName: "Bulls vs Celtics",
                eventDescription:
                  "Chicago Bulls vs Boston Celtics - Regular Season Game",
                city: "Chicago",
                state: "IL",
                category: "sports",
                talent: ["Chicago Bulls", "Boston Celtics"],
                tags: ["basketball", "nba", "pro-sports"],
                quantity: 2,
                unitPrice: 125,
                options: [
                  {
                    id: "eo-100002",
                    eventId: "ev-100002",
                    description:
                      "VIP Courtside Experience with Pre-game Shootaround Access",
                    name: "Courtside VIP",
                    special: "discount-gold",
                    price: 350,
                    tags: ["premium", "good-seats"],
                  },
                ],
                optionUnitPrice: 350,
                totalPrice: 950,
                venue: "United Center",
              },
              {
                id: "or-100008",
                eventId: "ev-100003",
                userId: "us-100002",
                confirmationNumber: "CR-23-08-08",
                createdDateTime: "2023-07-01 16:45",
                eventDate: "2023-08-12",
                eventTime: "20:00",
                eventName: "Deadmau5 Live",
                eventDescription: "Deadmau5 Presents: We Are Friends Tour",
                city: "Chicago",
                state: "IL",
                category: "concerts",
                talent: ["Deadmau5", "NERO", "Kasablanca"],
                tags: ["edm-music", "21-over"],
                quantity: 2,
                unitPrice: 85,
                options: [
                  {
                    id: "eo-100003",
                    eventId: "ev-100003",
                    description:
                      "Meet & Greet with Deadmau5 + Exclusive Merch Bundle",
                    name: "VIP Package",
                    special: "discount-gold",
                    price: 200,
                    tags: ["premium"],
                  },
                ],
                optionUnitPrice: 200,
                totalPrice: 570,
                venue: "Radius Chicago",
              },
              {
                id: "or-100009",
                eventId: "ev-100005",
                userId: "us-100002",
                confirmationNumber: "CR-23-03-09",
                createdDateTime: "2023-02-15 13:30",
                eventDate: "2023-03-18",
                eventTime: "19:30",
                eventName: "NCAA Tournament - Second Round",
                eventDescription: "NCAA March Madness Second Round",
                city: "Las Vegas",
                state: "NV",
                category: "sports",
                talent: ["Arizona Wildcats", "Gonzaga Bulldogs"],
                tags: ["basketball", "ncaa-basketball", "college-sports"],
                quantity: 2,
                unitPrice: 150,
                options: [
                  {
                    id: "eo-100005",
                    eventId: "ev-100005",
                    description:
                      "All-Session Premium Seating with Hospitality Access",
                    name: "Premium Package",
                    special: "discount-gold",
                    price: 250,
                    tags: ["premium", "good-seats", "meal"],
                  },
                ],
                optionUnitPrice: 250,
                totalPrice: 800,
                venue: "T-Mobile Arena",
              },
              {
                id: "or-100010",
                eventId: "ev-100009",
                userId: "us-100002",
                confirmationNumber: "CR-23-01-10",
                createdDateTime: "2023-01-15 11:30",
                eventDate: "2023-01-28",
                eventTime: "19:30",
                eventName: "Bulls vs Bucks",
                eventDescription:
                  "Chicago Bulls vs Milwaukee Bucks - Regular Season Game",
                city: "Chicago",
                state: "IL",
                category: "sports",
                talent: ["Chicago Bulls", "Milwaukee Bucks"],
                tags: ["basketball", "nba", "pro-sports"],
                quantity: 2,
                unitPrice: 110,
                options: [
                  {
                    id: "eo-100009",
                    eventId: "ev-100009",
                    description:
                      "Premium Club Level Access with All-Inclusive Food & Beverage",
                    name: "Club Level VIP",
                    special: "discount-gold",
                    price: 275,
                    tags: ["premium", "good-seats", "meal"],
                  },
                ],
                optionUnitPrice: 275,
                totalPrice: 770,
                venue: "United Center",
              },
            ],
          },
        },
      ],
      type: "tool",
      createdAt: "1/10/2025 16:05:06.685",
      role: "bot",
      _index: 5,
    },
    {
      interrupted: true,
      callSid: calls[1].callSid,
      content:
        "The Bulls versus Celtics game is on February 15, 2024, and it starts at 7 PM. If you have any more questions, ",
      id: "chatcmpl-AoILrJZXf9XiqgedsZLpCZ9gRKlj",
      type: "text",
      createdAt: "1/10/2025 16:05:07.715",
      seq: 11,
      role: "bot",
      _index: 6,
    },
    {
      callSid: calls[1].callSid,
      content: "Thanks. Have a good one",
      createdAt: "1/10/2025 16:06:05.206",
      id: "human-00000552938",
      seq: 12,
      role: "human",
      type: "text",
      _index: 7,
    },
  ],
};

const callLogs: Record<string, LogRecord[]> = {
  [calls[0].callSid]: [
    {
      seq: 5,
      callSid: calls[0].callSid,
      createdAt: new Date(),
      source: "Agent",
      description: "Human agent responded to the modify order request.",
      actions: ["Approval"],
      id: "dj893ks",
    },
    {
      seq: 4,
      callSid: calls[0].callSid,
      createdAt: new Date(),
      source: "Agent",
      description: "Human agent responded to refund request.",
      actions: ["Rejection"],
      id: "dkj29kd93",
    },
    {
      seq: 3,
      callSid: calls[0].callSid,
      createdAt: new Date(),
      source: "Recall",
      description:
        "Avoid having customers repeat themselves by calling your tools to verify information whenever possible",
      actions: ["Added System Message", "Updated Instructions"],
      id: "s8j289r",
    },
    {
      seq: 2,
      callSid: calls[0].callSid,
      createdAt: new Date(),
      source: "Governance",
      description:
        "Modify Order Procedure: identify_user, get_order, ask_agent, send_modification_confirmation, process_payment",
      actions: ["Updated Instructions"],
      id: "94k992j",
    },
    {
      seq: 1,
      callSid: calls[0].callSid,
      createdAt: new Date(),
      source: "Segment",
      description: "Fetched the customer's interaction history.",
      actions: ["Updated Context"],
      id: "382j88d",
    },
    {
      seq: 0,
      callSid: calls[0].callSid,
      createdAt: new Date(),
      source: "Segment",
      description: "Fetched the customer's profile",
      actions: ["Updated Context"],
      id: "asd2345",
    },
  ],
};

export const sampleData = {
  callLogs,
  callMessages,
  calls,
  config,
};
