
import React from "react";
import { makeObservable, observable, runInAction } from "mobx";
import { MSALStore } from "./MSALStore";
import { UserStore } from "./UserStore";
import { EventStore } from "./EventStore";
import { UntisStore } from './UntisStore';
import { SocketDataStore } from "./SocketDataStore";

export class RootStore {
  stores = observable([]);
  @observable 
  initialized = false;

  msalStore: MSALStore;
  untisStore: UntisStore;
  userStore: UserStore;
  eventStore: EventStore;
  socketStore: SocketDataStore;
  constructor() {
    makeObservable(this);
    this.msalStore = new MSALStore();
    this.untisStore = new UntisStore(this);
    this.userStore = new UserStore(this);
    this.eventStore = new EventStore(this);
    this.socketStore = new SocketDataStore(this);
    runInAction(() => {
      this.initialized = true;
    })
  }
}


export const rootStore = Object.freeze(new RootStore());
export const storesContext = React.createContext(rootStore);
export const StoresProvider = storesContext.Provider;
