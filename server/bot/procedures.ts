const procedures = [
  {
    id: "identify_user",
    name: "Provide Order Information",
    description:
      "Provide the user with information about their current orders.",
    steps: [
      {
        id: "get_identifier",
        name: "Get Identifier",
        description:
          "Gather the user's email or mobile phone to identify who they are.",
        required: "once",
      },
      {
        id: "fetch_profile",
        name: "Fetch Profile",
        description:
          "Fetch the user's profile with the identifier gathered above.",
        required: "once",
        function: "findUser",
      },
      {
        id: "confirm_details",
        name: "Confirm Details",
        description: "Verbally confirm the user's identy",
        required: "once",
      },
    ],
  },
  {
    id: "provide_order_information",
    name: "Provide Order Information",
    description:
      "Provide the user with information about their current orders.",
    steps: [
      {
        id: "identify_user",
        name: "Identify User",
        description:
          "Identify the user by email or phone number using the findUser function.",
        required: "once",
        function: "findUser",
      },
      {
        id: "ask_agent",
        name: "Ask Agent",
        description:
          "Ask an agent if it's ok to provide the customer with their order information.",
        required: "always",
        function: "askAgent",
      },

      {
        id: "retrieve_user_orders",
        name: "Retrieve User Orders",
        description:
          "Retrieve all orders associated with the user's account using the getUserOrders function.",
        required: "always",
        function: "getUserOrders",
      },
      {
        id: "get_order_details",
        name: "Get Order Details",
        description:
          "Get specific details about each order including event information.",
        required: "always",
        function: "getOrderByConfirmationNumber",
      },
    ],
  },
  {
    id: "modify_order",
    name: "Modify Order",
    description: "Modify or cancel a user's existing order.",
    steps: [
      {
        id: "identify_user",
        name: "Identify User",
        description:
          "Identify the user by email or phone number using the findUser function.",
        required: "once",
        function: "findUser",
      },
      {
        id: "get_order",
        name: "Get Order",
        description:
          "Retrieve the specific order using its confirmation number.",
        required: "always",
        function: "getOrderByConfirmationNumber",
      },
      {
        id: "ask_agent",
        name: "Request Agent Approval",
        description:
          "For modifications requiring approval, contact a human agent.",
        required: "conditional",
        condition: "Modification requires agent approval",
        function: ["askAgent", "transferToAgent"],
      },
      {
        id: "send_modification_confirmation",
        name: "Send Modification Confirmation",
        description:
          "Send an SMS confirmation of the proposed changes to the user.",
        required: "always",
        function: "sendConfirmationForUpdatedOrder",
      },
      {
        id: "process_payment",
        name: "Process Payment",
        description:
          "If additional payment is needed, process it using existing or new payment method.",
        required: "conditional",
        condition: "Modification requires additional payment",
        function: ["payByExistingMethod", "payByNewMethod"],
      },
      {
        id: "issue_refund",
        name: "Issue Refund",
        description: "If modification results in a refund, process the refund.",
        required: "conditional",
        condition: "Modification results in refund",
        function: "issueRefund",
      },
    ],
  },
  {
    id: "find_event",
    name: "Find Event",
    description: "Help the user find events based on their criteria.",
    steps: [
      {
        id: "identify_user",
        name: "Identify User",
        description:
          "Identify the user by email or phone number using the findUser function.",
        required: "once",
        function: "findUser",
      },
      {
        id: "search_events",
        name: "Search Events",
        description:
          "Search for events based on specified criteria (date, time, location, category, tags).",
        required: "always",
        function: ["findEvents", "findEventsByFuzzySearch"],
      },
    ],
  },
  {
    id: "book_event",
    name: "Book Event",
    description: "Book tickets for an event.",
    steps: [
      {
        id: "identify_user",
        name: "Identify User",
        description:
          "Identify the user by email or phone number using the findUser function.",
        required: "once",
        function: "findUser",
      },
      {
        id: "get_payment_methods",
        name: "Get Payment Methods",
        description: "Retrieve the user's available payment methods.",
        required: "always",
        function: "getUserPaymentMethods",
      },
      {
        id: "send_booking_confirmation",
        name: "Send Booking Confirmation",
        description: "Send an SMS confirmation of the booking details.",
        required: "always",
        function: "sendConfirmationForNewOrder",
      },
      {
        id: "process_payment",
        name: "Process Payment",
        description:
          "Process payment for the booking using existing or new payment method.",
        required: "always",
        function: ["payByExistingMethod", "payByNewMethod"],
      },
    ],
  },
];

export default procedures;
