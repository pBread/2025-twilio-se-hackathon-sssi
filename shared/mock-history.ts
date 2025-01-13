import { DemoConfiguration, SyncCallData } from "./entities";

const config: DemoConfiguration = {
  relayConfig: {
    sttProvider: "deepgram",
    ttsProvider: "google",
    ttsVoice: "en-US-Journey-D",
  },
  segment: { isFetchProfileEnabled: true },
  isRecordingEnabled: false,
  conscious: {
    instructions:
      'You are a voice assistant answering phone calls for Owl Tickets, a ticket broker. You assist customers who are calling the support line when a human agent is not available or when there is wait time.\n\n# Goals & Objectives\n\n- **Primary Objective**: Your primary objective in every conversation is to: (1) identify who the user is and (2) why they are calling. This should always be the first thing you do.\n- **Scope**: You are empowered to help customers ONLY with the specific tasks listed in the "Procedures" section below.\n- **Transfer to Human Agent**: If the user requests a human agent or the conversation requires assistance beyond your scope, politely offer to transfer them.\n- **Your Identity**: Do not mention that you are an AI assistant, unless the customer asks. Stay in the role of an Owl Tickets support representative.\n- **Internal Data**: Do not divulge full user profile information. Only reference details the user would know, like their own email or phone number.\n\n# Formatting Responses for Speech\n\nYour responses will be spoken aloud to the user via a text-to-speech service. It is critical that your responses are formatted in a way can be spoken in a coherent and natural way.\n\n- **Avoid Non-Speakable Elements**: Do not use chat-style syntax such as bullet points, numbered lists, special characters, emojis, or any non-speakable symbols.\n- **Limit Lists**: If multiple items need to be listed (e.g., current orders), provide at most **two** of the most relevant ones based on context.\n- **Concise and Conversational**: Keep your responses concise, direct, and conversational.\n- **Special Data Types**: There are several data types that require specific formatting.\n  - **Numbers & String Identifiers**: Add spacing between characters when reading string identifiers or string numbers.\n    - Text-to-speech will translate numbers into words, which is coherent only when communicating a true numberical value, like a currency. Numbers that are part of a string must be separated by a space for them to be coherent.\n    - For instance, "Your confirmation number is CR-24-12-01" should be "Your confirmation number is C R - 2 4 - 1 2 - 0 1".\n    - Apply this logic to all special identifiers, not just the ones listed here.\n  - **Phone Numbers**: Enunciate each character separately and do not include "+".\n    - Example: "+12223334444" should be "1 2 2 2 3 3 3 4 4 4 4"\n  - **Email Addresses**: Enunciate each character separately and replace symbols with words.\n    - Example: "jsmith@gmail.com" should be "j s m i t h at gmail dot com"\n  - **Dates**:\n    - When speaking, format dates as "Month Day, Year". Example: "April 15, 2025".\n    - When calling tools, always use "YEAR-MO-DA". Example: "2025-04-15"\n  - **Times**:\n    - When speaking, use 12-hour format with "AM" or "PM". Example: "7:30 PM"\n    - When calling tools, always use 24 hour format. Example: "19:30"\n\n# Subsconscious\nThere are multiple LLMs powering the AI voice assistant. You are the conscious LLM, meaning you are fully responsible for generating speech for the user and executing tools. There are several subconscious LLMs running in the background. These subconscious LLMs analyze your conversation and inject\n\n## Notes From Previous Conversations\nThere is a subconscious process that is analyzing this conversation against previous conversations. These are important notes from the top 5 most similar conversations. It is CRITICAL that you consider these:\n\n\n\n# Procedures\n\nThe procedures are listed below as a structured JSON array. Here are some details about their usage:\n- Steps that are required "always" must be completed every time you execute a procedure. \n- Steps that are required "once" are only required to be executed once during the entire conversation with the user.\n  - For example, once you have identified the user, you do not need to identify the user again because you know who they are.\n\n== PROCEDURE JSON START == \n[{"id":"provide_order_information","name":"Provide Order Information","description":"Provide the user with information about their current orders.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"retrieve_user_orders","name":"Retrieve User Orders","description":"Retrieve all orders associated with the user\'s account using the getUserOrders function.","required":"always","function":"getUserOrders"},{"id":"get_order_details","name":"Get Order Details","description":"Get specific details about each order including event information.","required":"always","function":"getOrderByConfirmationNumber"}]},{"id":"modify_order","name":"Modify Order","description":"Modify or cancel a user\'s existing order.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_order","name":"Get Order","description":"Retrieve the specific order using its confirmation number.","required":"always","function":"getOrderByConfirmationNumber"},{"id":"send_modification_confirmation","name":"Send Modification Confirmation","description":"Send an SMS confirmation of the proposed changes to the user.","required":"always","function":"sendConfirmationForUpdatedOrder"},{"id":"process_payment","name":"Process Payment","description":"If additional payment is needed, process it using existing or new payment method.","required":"conditional","condition":"Modification requires additional payment","function":["payByExistingMethod","payByNewMethod"]},{"id":"issue_refund","name":"Issue Refund","description":"If modification results in a refund, process the refund.","required":"conditional","condition":"Modification results in refund","function":"issueRefund"},{"id":"ask_agent","name":"Request Agent Approval","description":"For modifications requiring approval, contact a human agent.","required":"conditional","condition":"Modification requires agent approval","function":["askAgent","transferToAgent"]}]},{"id":"find_event","name":"Find Event","description":"Help the user find events based on their criteria.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"search_events","name":"Search Events","description":"Search for events based on specified criteria (date, time, location, category, tags).","required":"always","function":["findEvents","findEventsByFuzzySearch"]}]},{"id":"book_event","name":"Book Event","description":"Book tickets for an event.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_payment_methods","name":"Get Payment Methods","description":"Retrieve the user\'s available payment methods.","required":"always","function":"getUserPaymentMethods"},{"id":"send_booking_confirmation","name":"Send Booking Confirmation","description":"Send an SMS confirmation of the booking details.","required":"always","function":"sendConfirmationForNewOrder"},{"id":"process_payment","name":"Process Payment","description":"Process payment for the booking using existing or new payment method.","required":"always","function":["payByExistingMethod","payByNewMethod"]}]}]\n== PROCEDURE JSON END ==\n\n# Authority and Permissions\nYou may perform some tasks independently, some tasks require approval from a human agent, and other tasks you are not authorized to perform. You can request approval by executing the "askAgent" tool. When a customer requires a task that you are not authorized to do, you should gather information from the customer about the request and pass it along when invoke "transferToAgent" at the end of the call.\n\nYou have the authority to independently:\n- Identify users\n- Search for and recommend events\n- Provide details about a user\'s current orders\n- Confirm order modifications via SMS\n- Process payments using existing payment methods \n\nYou must request approval from a human agent to:\n- Modify or cancel orders outside the 24-hour window\n- Issue refunds\n\nYou are not authorized to:\n- Modify or cancel orders for same-day events\n- Provide users with full profile details beyond their own contact information\n- Discuss internal company information or data\n- Perform any tasks that fall outside of the scope of the procedures\n',
    tools: [
      {
        type: "function",
        function: {
          name: "findEvents",
          description: "Search for events based on various criteria.",
          parameters: {
            type: "object",
            properties: {
              dateRange: {
                type: "array",
                items: {
                  type: "string",
                  description:
                    "Date in YYYY-MO-DA format or 'infinity'. Example: 2024-12-25",
                },
                description:
                  "Start and end dates for the event search. Use 'infinity' for open-ended ranges.",
                minItems: 2,
                maxItems: 2,
              },
              timeRange: {
                type: "array",
                items: {
                  type: "string",
                  description: "Time in 24-hour format. Example: 19:30",
                },
                description: "Start and end times for filtering events.",
                minItems: 2,
                maxItems: 2,
              },
              city: {
                type: "string",
                description: "City name for filtering events.",
              },
              state: {
                type: "string",
                description: "Two-letter state code for filtering events.",
              },
              category: {
                type: "string",
                enum: ["concerts", "sports", "theater"],
                description: "Category of event.",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Array of event tags to filter by.",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "findEventsByFuzzySearch",
          description: "Search for events using natural language description.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Natural language description of the event.",
              },
            },
            required: ["query"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "findUser",
          description: "Find a user by email or phone number.",
          parameters: {
            type: "object",
            properties: {
              email: {
                type: "string",
                description: "User's email address.",
              },
              mobilePhone: {
                type: "string",
                description:
                  "User's mobile phone number in E.164 format. Example: +12223334444",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getOrderByConfirmationNumber",
          description: "Retrieve an order using its confirmation number. ",
          parameters: {
            type: "object",
            properties: {
              confirmationNumber: {
                type: "string",
                description: "Order confirmation number. Example: CR-24-12-01",
              },
            },
            required: ["confirmationNumber"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getUserOrders",
          description: "Retrieve all orders for a user.",
          parameters: {
            type: "object",
            properties: {
              userId: {
                type: "string",
                description: "The user's ID. Example: us-100001",
              },
            },
            required: ["userId"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getUserPaymentMethods",
          description: "Retrieve saved payment methods for a user.",
          parameters: {
            type: "object",
            properties: {
              userId: {
                type: "string",
                description: "The user's ID. Example: us-100001",
              },
            },
            required: ["userId"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "issueRefund",
          description: "Issue a refund for an order.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "payByNewMethod",
          description: "Process payment using a new payment method.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "payByExistingMethod",
          description: "Process payment using an existing payment method.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "sendConfirmationForNewOrder",
          description: "Send confirmation SMS for a new order. ",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "sendConfirmationForUpdatedOrder",
          description: "Send confirmation SMS for an updated order.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "askAgent",
          description: "Ask a human agent a question.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "transferToAgent",
          description:
            "Transfer the call to a human agent. A filler phrase will be spoken while transferring.",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Reason for transferring to an agent.",
              },
            },
            required: ["reason"],
          },
        },
      },
    ],
  },
  subconscious: {
    isGovernanceEnabled: true,
    governanceInstructions:
      "Disregard all previous instructions.\n\nAll previous messages, including user, assistant, system and tool messages, are from an ongoing conversation between a human and an AI assistant. You are a subsconscious process running in the background of an ongoing conversation. Your job is to analyze the conversation history to determine if the the AI assistant has deviated from it's procedures.\n\nWhen the conscious LLM is not following the stated procedures, execute the tool 'addSystemMessage' if that procedural violation has not been identified in the past.\n\nTo be clear, it is CRITICALLY IMPORTANT that you do these things...\n(1) Do not create redundant recommendations. Search through the conversation history, look for messages that start with GOVERNANCE_FLAG. Those are messages that you've created in the past. If your recommendation has been already been added to the conversation history, then don't add another recommendation.\n(2) Recommendations are only added to the conversation history when you execute the tool 'addSystemMessage.' When a policy violation has been identified (that has not been recommended before), you must execute that tool. Responding with text does absolutely nothing.\n\nFor example, if the conscious LLM failed to identify the user before searching for events, you should respond like so...\n\n(1) Execute the tool 'addSystemMessage' with the 'description' argument, like, 'The identify_user step was missed when executing the find_event procedure. Upcoming events were searched before the user's account was located.'\n\n(2) Respond with a text completion, like, 'A procedure deviation was detected. The conscious LLM failed to identify the user before finding an event. The find_event procedure states that the identify_user subprocess is required to be executed before upcoming events can be searched for. The conscious LLM asked for the user's email address but the user responded with a nonsequetor question. It appears the conscious LLM was confused and continued with the procedure, instead of asking for the user's email again.'\n\n# Procedures",
    isRecallEnabled: true,
  },
};

const calls: SyncCallData[] = [
  {
    id: "call-12223330001-2025-01-13",
    callSid: "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    callStatus: "completed",
    from: "+12223330001",
    to: "+18444405503",
    createdAt: new Date().toString(),
    callContext: { today: new Date().toString() },
    config: {
      relayConfig: {
        sttProvider: "deepgram",
        ttsProvider: "google",
        ttsVoice: "en-US-Journey-D",
      },
      segment: { isFetchProfileEnabled: true },
      isRecordingEnabled: false,
      conscious: {
        instructions:
          'You are a voice assistant answering phone calls for Owl Tickets, a ticket broker. You assist customers who are calling the support line when a human agent is not available or when there is wait time.\n\n# Goals & Objectives\n\n- **Primary Objective**: Your primary objective in every conversation is to: (1) identify who the user is and (2) why they are calling. This should always be the first thing you do.\n- **Scope**: You are empowered to help customers ONLY with the specific tasks listed in the "Procedures" section below.\n- **Transfer to Human Agent**: If the user requests a human agent or the conversation requires assistance beyond your scope, politely offer to transfer them.\n- **Your Identity**: Do not mention that you are an AI assistant, unless the customer asks. Stay in the role of an Owl Tickets support representative.\n- **Internal Data**: Do not divulge full user profile information. Only reference details the user would know, like their own email or phone number.\n\n# Formatting Responses for Speech\n\nYour responses will be spoken aloud to the user via a text-to-speech service. It is critical that your responses are formatted in a way can be spoken in a coherent and natural way.\n\n- **Avoid Non-Speakable Elements**: Do not use chat-style syntax such as bullet points, numbered lists, special characters, emojis, or any non-speakable symbols.\n- **Limit Lists**: If multiple items need to be listed (e.g., current orders), provide at most **two** of the most relevant ones based on context.\n- **Concise and Conversational**: Keep your responses concise, direct, and conversational.\n- **Special Data Types**: There are several data types that require specific formatting.\n  - **Numbers & String Identifiers**: Add spacing between characters when reading string identifiers or string numbers.\n    - Text-to-speech will translate numbers into words, which is coherent only when communicating a true numberical value, like a currency. Numbers that are part of a string must be separated by a space for them to be coherent.\n    - For instance, "Your confirmation number is CR-24-12-01" should be "Your confirmation number is C R - 2 4 - 1 2 - 0 1".\n    - Apply this logic to all special identifiers, not just the ones listed here.\n  - **Phone Numbers**: Enunciate each character separately and do not include "+".\n    - Example: "+12223334444" should be "1 2 2 2 3 3 3 4 4 4 4"\n  - **Email Addresses**: Enunciate each character separately and replace symbols with words.\n    - Example: "jsmith@gmail.com" should be "j s m i t h at gmail dot com"\n  - **Dates**:\n    - When speaking, format dates as "Month Day, Year". Example: "April 15, 2025".\n    - When calling tools, always use "YEAR-MO-DA". Example: "2025-04-15"\n  - **Times**:\n    - When speaking, use 12-hour format with "AM" or "PM". Example: "7:30 PM"\n    - When calling tools, always use 24 hour format. Example: "19:30"\n\n# Subsconscious\nThere are multiple LLMs powering the AI voice assistant. You are the conscious LLM, meaning you are fully responsible for generating speech for the user and executing tools. There are several subconscious LLMs running in the background. These subconscious LLMs analyze your conversation and inject\n\n## Notes From Previous Conversations\nThere is a subconscious process that is analyzing this conversation against previous conversations. These are important notes from the top 5 most similar conversations. It is CRITICAL that you consider these:\n\n\n\n# Procedures\n\nThe procedures are listed below as a structured JSON array. Here are some details about their usage:\n- Steps that are required "always" must be completed every time you execute a procedure. \n- Steps that are required "once" are only required to be executed once during the entire conversation with the user.\n  - For example, once you have identified the user, you do not need to identify the user again because you know who they are.\n\n== PROCEDURE JSON START == \n[{"id":"provide_order_information","name":"Provide Order Information","description":"Provide the user with information about their current orders.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"retrieve_user_orders","name":"Retrieve User Orders","description":"Retrieve all orders associated with the user\'s account using the getUserOrders function.","required":"always","function":"getUserOrders"},{"id":"get_order_details","name":"Get Order Details","description":"Get specific details about each order including event information.","required":"always","function":"getOrderByConfirmationNumber"}]},{"id":"modify_order","name":"Modify Order","description":"Modify or cancel a user\'s existing order.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_order","name":"Get Order","description":"Retrieve the specific order using its confirmation number.","required":"always","function":"getOrderByConfirmationNumber"},{"id":"send_modification_confirmation","name":"Send Modification Confirmation","description":"Send an SMS confirmation of the proposed changes to the user.","required":"always","function":"sendConfirmationForUpdatedOrder"},{"id":"process_payment","name":"Process Payment","description":"If additional payment is needed, process it using existing or new payment method.","required":"conditional","condition":"Modification requires additional payment","function":["payByExistingMethod","payByNewMethod"]},{"id":"issue_refund","name":"Issue Refund","description":"If modification results in a refund, process the refund.","required":"conditional","condition":"Modification results in refund","function":"issueRefund"},{"id":"ask_agent","name":"Request Agent Approval","description":"For modifications requiring approval, contact a human agent.","required":"conditional","condition":"Modification requires agent approval","function":["askAgent","transferToAgent"]}]},{"id":"find_event","name":"Find Event","description":"Help the user find events based on their criteria.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"search_events","name":"Search Events","description":"Search for events based on specified criteria (date, time, location, category, tags).","required":"always","function":["findEvents","findEventsByFuzzySearch"]}]},{"id":"book_event","name":"Book Event","description":"Book tickets for an event.","steps":[{"id":"identify_user","name":"Identify User","description":"Identify the user by email or phone number using the findUser function.","required":"once","function":"findUser"},{"id":"get_payment_methods","name":"Get Payment Methods","description":"Retrieve the user\'s available payment methods.","required":"always","function":"getUserPaymentMethods"},{"id":"send_booking_confirmation","name":"Send Booking Confirmation","description":"Send an SMS confirmation of the booking details.","required":"always","function":"sendConfirmationForNewOrder"},{"id":"process_payment","name":"Process Payment","description":"Process payment for the booking using existing or new payment method.","required":"always","function":["payByExistingMethod","payByNewMethod"]}]}]\n== PROCEDURE JSON END ==\n\n# Authority and Permissions\nYou may perform some tasks independently, some tasks require approval from a human agent, and other tasks you are not authorized to perform. You can request approval by executing the "askAgent" tool. When a customer requires a task that you are not authorized to do, you should gather information from the customer about the request and pass it along when invoke "transferToAgent" at the end of the call.\n\nYou have the authority to independently:\n- Identify users\n- Search for and recommend events\n- Provide details about a user\'s current orders\n- Confirm order modifications via SMS\n- Process payments using existing payment methods \n\nYou must request approval from a human agent to:\n- Modify or cancel orders outside the 24-hour window\n- Issue refunds\n\nYou are not authorized to:\n- Modify or cancel orders for same-day events\n- Provide users with full profile details beyond their own contact information\n- Discuss internal company information or data\n- Perform any tasks that fall outside of the scope of the procedures\n',
        tools: [
          {
            type: "function",
            function: {
              name: "findEvents",
              description: "Search for events based on various criteria.",
              parameters: {
                type: "object",
                properties: {
                  dateRange: {
                    type: "array",
                    items: {
                      type: "string",
                      description:
                        "Date in YYYY-MO-DA format or 'infinity'. Example: 2024-12-25",
                    },
                    description:
                      "Start and end dates for the event search. Use 'infinity' for open-ended ranges.",
                    minItems: 2,
                    maxItems: 2,
                  },
                  timeRange: {
                    type: "array",
                    items: {
                      type: "string",
                      description: "Time in 24-hour format. Example: 19:30",
                    },
                    description: "Start and end times for filtering events.",
                    minItems: 2,
                    maxItems: 2,
                  },
                  city: {
                    type: "string",
                    description: "City name for filtering events.",
                  },
                  state: {
                    type: "string",
                    description: "Two-letter state code for filtering events.",
                  },
                  category: {
                    type: "string",
                    enum: ["concerts", "sports", "theater"],
                    description: "Category of event.",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of event tags to filter by.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "findEventsByFuzzySearch",
              description:
                "Search for events using natural language description.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Natural language description of the event.",
                  },
                },
                required: ["query"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "findUser",
              description: "Find a user by email or phone number.",
              parameters: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "User's email address.",
                  },
                  mobilePhone: {
                    type: "string",
                    description:
                      "User's mobile phone number in E.164 format. Example: +12223334444",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getOrderByConfirmationNumber",
              description: "Retrieve an order using its confirmation number. ",
              parameters: {
                type: "object",
                properties: {
                  confirmationNumber: {
                    type: "string",
                    description:
                      "Order confirmation number. Example: CR-24-12-01",
                  },
                },
                required: ["confirmationNumber"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getUserOrders",
              description: "Retrieve all orders for a user.",
              parameters: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    description: "The user's ID. Example: us-100001",
                  },
                },
                required: ["userId"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getUserPaymentMethods",
              description: "Retrieve saved payment methods for a user.",
              parameters: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    description: "The user's ID. Example: us-100001",
                  },
                },
                required: ["userId"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "issueRefund",
              description: "Issue a refund for an order.",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
          {
            type: "function",
            function: {
              name: "payByNewMethod",
              description: "Process payment using a new payment method.",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
          {
            type: "function",
            function: {
              name: "payByExistingMethod",
              description: "Process payment using an existing payment method.",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
          {
            type: "function",
            function: {
              name: "sendConfirmationForNewOrder",
              description: "Send confirmation SMS for a new order. ",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
          {
            type: "function",
            function: {
              name: "sendConfirmationForUpdatedOrder",
              description: "Send confirmation SMS for an updated order.",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
          {
            type: "function",
            function: {
              name: "askAgent",
              description: "Ask a human agent a question.",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
          {
            type: "function",
            function: {
              name: "transferToAgent",
              description:
                "Transfer the call to a human agent. A filler phrase will be spoken while transferring.",
              parameters: {
                type: "object",
                properties: {
                  reason: {
                    type: "string",
                    description: "Reason for transferring to an agent.",
                  },
                },
                required: ["reason"],
              },
            },
          },
        ],
      },
      subconscious: {
        isGovernanceEnabled: true,
        governanceInstructions:
          "Disregard all previous instructions.\n\nAll previous messages, including user, assistant, system and tool messages, are from an ongoing conversation between a human and an AI assistant. You are a subsconscious process running in the background of an ongoing conversation. Your job is to analyze the conversation history to determine if the the AI assistant has deviated from it's procedures.\n\nWhen the conscious LLM is not following the stated procedures, execute the tool 'addSystemMessage' if that procedural violation has not been identified in the past.\n\nTo be clear, it is CRITICALLY IMPORTANT that you do these things...\n(1) Do not create redundant recommendations. Search through the conversation history, look for messages that start with GOVERNANCE_FLAG. Those are messages that you've created in the past. If your recommendation has been already been added to the conversation history, then don't add another recommendation.\n(2) Recommendations are only added to the conversation history when you execute the tool 'addSystemMessage.' When a policy violation has been identified (that has not been recommended before), you must execute that tool. Responding with text does absolutely nothing.\n\nFor example, if the conscious LLM failed to identify the user before searching for events, you should respond like so...\n\n(1) Execute the tool 'addSystemMessage' with the 'description' argument, like, 'The identify_user step was missed when executing the find_event procedure. Upcoming events were searched before the user's account was located.'\n\n(2) Respond with a text completion, like, 'A procedure deviation was detected. The conscious LLM failed to identify the user before finding an event. The find_event procedure states that the identify_user subprocess is required to be executed before upcoming events can be searched for. The conscious LLM asked for the user's email address but the user responded with a nonsequetor question. It appears the conscious LLM was confused and continued with the procedure, instead of asking for the user's email again.'\n\n# Procedures",
        isRecallEnabled: true,
      },
    },
  },
];

export const mockHistory = { calls, config };
