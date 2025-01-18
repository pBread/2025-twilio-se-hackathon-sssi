import type { ChatCompletionTool } from "openai/resources";

const tools: ChatCompletionTool[] = [
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
      description:
        "This tool will submit a question to a human agent. Certain procedures require that you obtain permission from a human, for example. This is an asynchronous process. You question is submitted and the human will respond at their earliest convenience. After asking a question, you should try to helping the customer with other requests while you wait.",
      parameters: {
        type: "object",
        required: ["question", "explanation"],
        properties: {
          question: {
            type: "string",
            description: "The question you are asking a response to.",
          },
          explanation: {
            type: "string",
            description:
              "Provide a detailed explanation of why you are asking the question and useful background information about the request.",
          },
          recommendation: {
            type: "string",
            description:
              "This is a recommendation of what course of action the agent should take.",
          },
        },
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
];

export default tools;
