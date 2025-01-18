import twilio from "twilio";
import type { SyncMapContext } from "twilio/lib/rest/sync/v1/service/syncMap";
import type {
  EventRecord,
  OrderRecord,
  UserRecord,
} from "../../shared/entities";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SYNC_SVC_SID,
} from "../env";
import log from "../logger";
import { makeId } from "../utils/misc";

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export class DatabaseService {
  constructor() {
    this.eventSvc = new MockEntityService<EventRecord, AddEvent>(
      "events",
      (param) => ({ id: makeId("ev"), ...param })
    );

    this.orderSvc = new MockEntityService<OrderRecord, AddOrder>(
      "orders",
      (param) => ({ id: makeId("or"), ...param })
    );

    this.userSvc = new MockEntityService<UserRecord, AddUser>(
      "users",
      (param) => ({
        id: makeId("us"),
        membership: "none",
        paymentMethods: [],
        ...param,
      })
    );
  }

  init = async () => {
    console.log("initializing database services");
    await Promise.all([
      this.eventSvc.init(),
      this.orderSvc.init(),
      this.userSvc.init(),
    ]);

    return this;
  };

  /****************************************************
   Event Methods
  ****************************************************/
  eventSvc: EntityService<EventRecord, AddEvent>;
  events = {
    add: async (doc: AddEvent) => {
      const result = await this.eventSvc.add(doc);
      return result;
    },
    getById: async (id: string) => {
      const result = await this.eventSvc.getById(id);
      return result;
    },
    list: async () => {
      const result = await this.eventSvc.list();
      return result;
    },
    remove: async (id: string) => {
      const result = await this.eventSvc.remove(id);
      return result;
    },
    set: async (id: string, doc: EventRecord) => {
      const result = await this.eventSvc.set(id, doc);
      return result;
    },
    setIn: async (id: string, update: Partial<EventRecord>) => {
      const result = await this.eventSvc.setIn(id, update);
      return result;
    },
  };

  /****************************************************
   Order Methods
  ****************************************************/
  orderSvc: EntityService<OrderRecord, AddOrder>;
  orders = {
    add: async (doc: AddOrder) => {
      log.warn(
        `db.orders`,
        `order.add was invoked but database is not connected`,
        doc
      );
      return doc;
    },

    getById: async (id: string) => {
      const result = await this.orderSvc.getById(id);
      return result;
    },
    list: async () => {
      const result = await this.orderSvc.list();
      return result;
    },
    remove: async (id: string) => {
      const result = await this.orderSvc.remove(id);
      return result;
    },
    set: async (id: string, doc: OrderRecord) => {
      const result = await this.orderSvc.set(id, doc);
      return result;
    },

    setIn: async (id: string, update: Partial<OrderRecord>) => {
      const result = await this.orderSvc.setIn(id, update);
      return result;
    },
  };

  /****************************************************
   User Methods
  ****************************************************/
  userSvc: EntityService<UserRecord, AddUser>;
  users = {
    add: async (doc: AddUser) => {
      const result = await this.userSvc.add(doc);
      return result;
    },

    getById: async (id: string) => {
      const result = await this.userSvc.getById(id);
      return result;
    },
    list: async () => {
      const result = await this.userSvc.list();
      return result;
    },
    remove: async (id: string) => {
      const result = await this.userSvc.remove(id);
      return result;
    },
    set: async (id: string, doc: UserRecord) => {
      const result = await this.userSvc.set(id, doc);
      return result;
    },

    setIn: async (id: string, update: Partial<UserRecord>) => {
      const result = await this.userSvc.setIn(id, update);
      return result;
    },

    getByChannel: async (phoneOrEmail: string) => {
      const users = await this.userSvc.list();

      return users.find(
        (user) =>
          user.mobilePhone?.includes(phoneOrEmail) ||
          user.email?.includes(phoneOrEmail)
      );
    },
  };
}

type AddEvent = Omit<EventRecord, "id"> & { id?: string };
type AddOrder = Omit<OrderRecord, "id"> & { id?: string };
type AddUser = Partial<UserRecord> & { firstName: string; lastName: string };

/****************************************************
 Mock Entity Service
****************************************************/
export interface EntityService<
  T extends { id: string },
  ADD extends Partial<T>
> {
  add: (partial: ADD) => Promise<T>;
  getById: (id: string) => Promise<T | undefined>;
  init: () => Promise<void>;
  list: () => Promise<T[]>;
  remove: (id: string) => Promise<boolean>;
  set: (id: string, doc: T) => Promise<T>;
  setIn: (id: string, update: Partial<T>) => Promise<T>;
}

class MockEntityService<T extends { id: string }, ADD extends Partial<T>>
  implements EntityService<T, ADD>
{
  docs: T[];
  constructor(public name: string, private creator: (param: ADD) => T) {
    this.docs = [];
  }

  init = async () => {
    const mockDatabase = await import("../../shared/mock-database").then(
      (it) => it.mockDatabase
    );
    // @ts-ignore
    this.docs = mockDatabase[name] as T[];
    log.warn(
      `mock.${this.name}`,
      `initializing mock ${this.name} service. insert operations will not function.`
    );
  };

  add = async (partial: ADD) => {
    const doc = this.creator(partial);
    log.warn(
      `mock.${this.name}`,
      `attempted to add ${this.name}, but this entity is using the mockdatabase`,
      doc
    );

    return doc;
  };

  getById = async (id: string) => this.docs.find((doc) => doc.id === id);

  list = async () => [...this.docs];
  remove = async (id: string) => {
    log.warn(
      `mock.${this.name}`,
      `attempted to remove ${this.name} with id ${id}, but this entity is using the mockdatabase`
    );

    return true;
  };
  set = async (id: string, doc: T) => {
    log.warn(
      `mock.${this.name}`,
      `attempted to set ${this.name}, but this entity is using the mockdatabase`,
      id,
      doc
    );

    return doc;
  };

  setIn = async (id: string, update: Partial<T>) => {
    const cur = await this.getById(id);
    if (!cur) {
      const msg = `attempted to update ${this.name} but could not find id ${id}`;
      log.error(`mock.${this.name}`, msg);
      throw Error(msg);
    }

    const next = { ...cur, ...update };

    log.warn(
      `mock.${this.name}`,
      `attempted to setIn ${this.name}, but this entity is using the mockdatabase`,

      next
    );

    return next;
  };
}

/****************************************************
 Sync Service Entity
****************************************************/
