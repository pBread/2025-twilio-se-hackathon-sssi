import type { EventRecord, OrderRecord, UserRecord } from "./entities";

const DEVELOPERS_PHONE_NUMBER =
  process.env.DEVELOPERS_PHONE_NUMBER ??
  process.env.NEXT_PUBLIC_DEVELOPERS_PHONE_NUMBER ??
  "+15556667777";

export const mockDatabase: {
  users: UserRecord[];
  orders: OrderRecord[];
  events: EventRecord[];
} = {
  users: [
    // Claire Dunphy has 3 kids.
    // only books "family-friendly" events
    // rarely buys options, never anything premium
    // always buys 5 tickets
    {
      id: "us-100001",
      firstName: "Claire",
      lastName: "Dunphy",
      email: "cdunphy@gmail.com",
      mobilePhone: "+12223334444",
      city: "Evanston",
      state: "IL",
      age: "34",
      membership: "none",
      paymentMethods: [{ type: "card", lastFour: "1234" }],
    },

    // Jerry Maguire is an affluent guy who likes basketball & edm concerts
    // attends 21-over
    // often buys premium options
    // has a gold membership
    {
      id: "us-100002",
      firstName: "Jerry",
      lastName: "Maguire",
      email: "jerry.maguire@gmail.com",
      mobilePhone: DEVELOPERS_PHONE_NUMBER ?? "+15556667777",
      city: "Chicago",
      state: "IL",
      age: "26",
      membership: "gold",
      paymentMethods: [{ type: "card", lastFour: "1234" }],
    },
  ],
  orders: [
    // Claire Dunphy's orders

    {
      id: "or-100001",
      eventId: "ev-100001",
      userId: "us-100001",

      confirmationNumber: "CR-24-12-01",
      createdDateTime: "2024-11-15 10:30",

      eventDate: "2024-12-21",
      eventTime: "14:00",

      eventName: "Disney's The Lion King",
      eventDescription:
        "Disney's The Lion King returns to Chicago! Experience the phenomenon of Disney's THE LION KING, Broadway's award-winning best musical.",
      city: "Chicago",
      state: "IL",

      category: "theater",
      options: [],
      tags: ["theater", "musicals", "family-friendly"],
      talent: ["Puleng March", "Nick Cordileone", "Darian Sanders"],
      venue: "Cadillac Palace Theatre",

      quantity: 5,
      unitPrice: 89,

      optionUnitPrice: 0,
      totalPrice: 445,
    },
    {
      id: "or-100002",
      eventId: "ev-100004",
      userId: "us-100001",
      confirmationNumber: "CR-23-12-02",
      createdDateTime: "2023-11-20 15:45",
      eventDate: "2023-12-10",
      eventTime: "15:00",
      eventName: "A Christmas Carol",
      eventDescription:
        "Experience the magic of the holiday season with this timeless classic",
      city: "Chicago",
      state: "IL",
      category: "theater",
      talent: ["Larry Yando", "Paris Strickland"],
      tags: ["theater", "plays", "family-friendly"],
      quantity: 5,
      unitPrice: 65,
      options: [
        {
          id: "eo-100004",
          eventId: "ev-100004",
          description: "Holiday themed pre-show dining experience",
          name: "Festive Dining Package",
          special: "none",
          price: 40,
          tags: ["meal", "family-friendly"],
        },
      ],
      optionUnitPrice: 40,
      totalPrice: 525,
      venue: "Chicago Shakespeare Theater",
    },
    {
      id: "or-100003",
      eventId: "ev-100006",
      userId: "us-100001",
      confirmationNumber: "CR-23-07-03",
      createdDateTime: "2023-06-01 09:15",
      eventDate: "2023-07-15",
      eventTime: "14:00",
      eventName: "Pinocchio",
      eventDescription:
        "The beloved tale of a wooden puppet who dreams of becoming a real boy",
      city: "Chicago",
      state: "IL",
      category: "theater",
      talent: ["Chicago Youth Theater Ensemble"],
      tags: ["theater", "plays", "family-friendly"],
      quantity: 5,
      unitPrice: 45,
      options: [],
      optionUnitPrice: 0,
      totalPrice: 225,
      venue: "Mercury Theater Chicago",
    },
    {
      id: "or-100004",
      eventId: "ev-100008",
      userId: "us-100001",
      confirmationNumber: "CR-23-05-04",
      createdDateTime: "2023-04-15 11:30",
      eventDate: "2023-05-20",
      eventTime: "19:00",
      eventName: "The Very Hungry Caterpillar Show",
      eventDescription:
        "Interactive musical adventure perfect for the whole family",
      city: "Chicago",
      state: "IL",
      category: "theater",
      talent: ["Chicago Children's Theatre Company"],
      tags: ["theater", "family-friendly"],
      quantity: 5,
      unitPrice: 35,
      options: [],
      optionUnitPrice: 0,
      totalPrice: 175,
      venue: "Chicago Children's Theatre",
    },
    {
      id: "or-100005",
      eventId: "ev-100010",
      userId: "us-100001",
      confirmationNumber: "CR-22-12-05",
      createdDateTime: "2022-12-01 14:20",
      eventDate: "2022-12-30",
      eventTime: "20:00",
      eventName: "Noon Year's Eve",
      eventDescription: "Chicago Children's Museum New Year's Eve Celebration",
      city: "Chicago",
      state: "IL",
      category: "theater",
      talent: ["Chicago Children's Museum Staff"],
      tags: ["family-friendly"],
      quantity: 5,
      unitPrice: 50,
      options: [],
      optionUnitPrice: 0,
      totalPrice: 250,
      venue: "Navy Pier",
    },

    // Jerry Maguire's orders
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
      talent: ["Swedish House Mafia", "Martin Garrix", "David Guetta"],
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
      eventDescription: "Chicago Bulls vs Boston Celtics - Regular Season Game",
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
          description: "Meet & Greet with Deadmau5 + Exclusive Merch Bundle",
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
          description: "All-Session Premium Seating with Hospitality Access",
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
  events: [
    {
      id: "ev-100001",
      date: "2024-12-21",
      time: "14:00",
      city: "Chicago",
      state: "IL",
      venue: "Cadillac Palace Theatre",
      category: "theater",
      description:
        "Disney's The Lion King returns to Chicago! Experience the phenomenon of Disney's THE LION KING, Broadway's award-winning best musical.",
      name: "Disney's The Lion King",
      options: [
        {
          id: "eo-100001",
          eventId: "ev-100001",
          description: "Pre-show behind the scenes tour with costume display",
          name: "Behind the Scenes Experience",
          special: "discount-gold",
          price: 45,
          tags: ["premium", "family-friendly"],
        },
      ],
      talent: ["Puleng March", "Nick Cordileone", "Darian Sanders"],
      tags: ["theater", "musicals", "family-friendly"],
      unitPrice: 89,
    },
    {
      id: "ev-100002",
      date: "2024-02-15",
      time: "19:00",
      city: "Chicago",
      state: "IL",
      venue: "United Center",
      category: "sports",
      description: "Chicago Bulls vs Boston Celtics - Regular Season Game",
      name: "Bulls vs Celtics",
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
      talent: ["Chicago Bulls", "Boston Celtics"],
      tags: ["basketball", "nba", "pro-sports"],
      unitPrice: 125,
    },
    {
      id: "ev-100003",
      date: "2023-08-12",
      time: "20:00",
      city: "Chicago",
      state: "IL",
      venue: "Radius Chicago",
      description: "Deadmau5 Presents: We Are Friends Tour",
      name: "Deadmau5 Live",
      category: "concerts",
      options: [
        {
          id: "eo-100003",
          eventId: "ev-100003",
          description: "Meet & Greet with Deadmau5 + Exclusive Merch Bundle",
          name: "VIP Package",
          special: "discount-gold",
          price: 200,
          tags: ["premium"],
        },
      ],
      talent: ["Deadmau5", "NERO", "Kasablanca"],
      tags: ["edm-music", "21-over"],
      unitPrice: 85,
    },
    {
      id: "ev-100004",
      date: "2023-12-10",
      time: "15:00",
      city: "Chicago",
      state: "IL",
      venue: "Chicago Shakespeare Theater",
      category: "theater",
      description:
        "Experience the magic of the holiday season with this timeless classic",
      name: "A Christmas Carol",
      options: [
        {
          id: "eo-100004",
          eventId: "ev-100004",
          description: "Holiday themed pre-show dining experience",
          name: "Festive Dining Package",
          special: "discount-silver",
          price: 40,
          tags: ["meal", "family-friendly"],
        },
      ],
      talent: ["Larry Yando", "Paris Strickland"],
      tags: ["theater", "plays", "family-friendly"],
      unitPrice: 65,
    },
    {
      id: "ev-100005",
      date: "2023-03-18",
      time: "19:30",
      city: "Las Vegas",
      state: "NV",
      venue: "T-Mobile Arena",
      category: "sports",
      description: "NCAA March Madness Second Round",
      name: "NCAA Tournament - Second Round",
      options: [
        {
          id: "eo-100005",
          eventId: "ev-100005",
          description: "All-Session Premium Seating with Hospitality Access",
          name: "Premium Package",
          special: "discount-gold",
          price: 250,
          tags: ["premium", "good-seats", "meal"],
        },
      ],
      talent: ["Arizona Wildcats", "Gonzaga Bulldogs"],
      tags: ["basketball", "ncaa-basketball", "college-sports"],
      unitPrice: 150,
    },
    {
      id: "ev-100006",
      date: "2023-07-15",
      time: "14:00",
      city: "Chicago",
      state: "IL",
      venue: "Mercury Theater Chicago",
      category: "theater",
      description:
        "The beloved tale of a wooden puppet who dreams of becoming a real boy",
      name: "Pinocchio",
      options: [
        {
          id: "eo-100006",
          eventId: "ev-100006",
          description: "Meet the cast after the show + Photo opportunity",
          name: "Cast Meet & Greet",
          special: "discount-silver",
          price: 30,
          tags: ["premium", "family-friendly"],
        },
      ],
      talent: ["Chicago Youth Theater Ensemble"],
      tags: ["theater", "plays", "family-friendly"],
      unitPrice: 45,
    },
    {
      id: "ev-100007",
      date: "2024-03-22",
      time: "21:00",
      city: "Miami",
      state: "FL",
      venue: "Ultra Music Festival",
      category: "concerts",
      description: "Ultra Music Festival 2024 - 3 Day Pass",
      name: "Ultra Music Festival 2024",
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
      talent: ["Swedish House Mafia", "Martin Garrix", "David Guetta"],
      tags: ["edm-music", "21-over"],
      unitPrice: 399,
    },
    {
      id: "ev-100008",
      date: "2023-05-20",
      time: "19:00",
      city: "Chicago",
      state: "IL",
      venue: "Chicago Children's Theatre",
      category: "theater",
      description: "Interactive musical adventure perfect for the whole family",
      name: "The Very Hungry Caterpillar Show",
      options: [
        {
          id: "eo-100008",
          eventId: "ev-100008",
          description: "Interactive pre-show workshop for kids",
          name: "Kids Workshop",
          special: "discount-silver",
          price: 25,
          tags: ["family-friendly"],
        },
      ],
      talent: ["Chicago Children's Theatre Company"],
      tags: ["theater", "family-friendly"],
      unitPrice: 35,
    },
    {
      id: "ev-100009",
      date: "2023-01-28",
      time: "19:30",
      city: "Chicago",
      state: "IL",
      venue: "United Center",
      category: "sports",
      description: "Chicago Bulls vs Milwaukee Bucks - Regular Season Game",
      name: "Bulls vs Bucks",
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
      talent: ["Chicago Bulls", "Milwaukee Bucks"],
      tags: ["basketball", "nba", "pro-sports"],
      unitPrice: 110,
    },
    {
      id: "ev-100010",
      date: "2022-12-30",
      time: "20:00",
      city: "Chicago",
      state: "IL",
      venue: "Navy Pier",
      category: "theater",
      description: "Chicago Children's Museum New Year's Eve Celebration",
      name: "Noon Year's Eve",
      options: [
        {
          id: "eo-100010",
          eventId: "ev-100010",
          description: "Special family photo package and party favors",
          name: "Celebration Package",
          special: "discount-silver",
          price: 35,
          tags: ["family-friendly"],
        },
      ],
      talent: ["Chicago Children's Museum Staff"],
      tags: ["family-friendly"],
      unitPrice: 50,
    },
  ],
};

function makeDate(daysToAdd: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysToAdd);

  const year = dt.getFullYear();
  const mo = `${dt.getMonth() + 1}`.padStart(2, "0");
  const da = `${dt.getDate()}`.padStart(2, "0");

  return `${year}-${mo}-${da}`;
}

for (const order of mockDatabase.orders) {
  const event = mockDatabase.events.find((ev) => ev.id === order.eventId);
  if (!event) throw Error("no event");

  order.city = event.city;
  order.state = event.state;

  order.eventDate = event.date;
  order.eventDescription = event.description;
  order.eventTime = event.time;
  order.talent = event.talent;
  order.venue = event.venue;
}
