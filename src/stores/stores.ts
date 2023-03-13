
import React from "react";
import { action, makeObservable, observable, reaction, runInAction } from "mobx";
import { SessionStore } from "./SessionStore";
import { UserStore } from "./UserStore";
import { EventStore } from "./EventStore";
import { UntisStore } from './UntisStore';
import { SocketDataStore } from "./SocketDataStore";
import { LoadeableStore, ResettableStore } from "./iStore";
import { JobStore } from "./JobStore";
import { ViewStore } from "./ViewStore";
import { DepartmentStore } from "./DepartmentStore";
import { RegistrationPeriodStore } from "./RegistrationPeriodStore";
import { SemesterStore } from "./SemesterStore";

export class RootStore {
  loadableStores = observable<LoadeableStore<any>>([]);
  resettableStores = observable<ResettableStore>([]);

  @observable 
  initialized = false;

  sessionStore: SessionStore;
  untisStore: UntisStore;
  userStore: UserStore;
  eventStore: EventStore;
  socketStore: SocketDataStore;
  jobStore: JobStore;
  departmentStore: DepartmentStore;
  semesterStore: SemesterStore;
  registrationPeriodStore: RegistrationPeriodStore;

  viewStore: ViewStore;
  constructor() {
    makeObservable(this);
    this.sessionStore = new SessionStore(this);

    this.userStore = new UserStore(this);
    this.subscribeTo(this.userStore, ['load', 'reset']);

    this.untisStore = new UntisStore(this);
    this.subscribeTo(this.untisStore, ['load', 'reset']);

    this.eventStore = new EventStore(this);
    this.subscribeTo(this.eventStore, ['load', 'reset']);

    this.socketStore = new SocketDataStore(this);
    this.subscribeTo(this.socketStore, ['load', 'reset']);

    this.jobStore = new JobStore(this);
    this.subscribeTo(this.jobStore, ['load', 'reset']);

    this.departmentStore = new DepartmentStore(this);
    this.subscribeTo(this.departmentStore, ['load', 'reset']);

    this.semesterStore = new SemesterStore(this);
    this.subscribeTo(this.semesterStore, ['load', 'reset']);

    this.registrationPeriodStore = new RegistrationPeriodStore(this);
    this.subscribeTo(this.registrationPeriodStore, ['load', 'reset']);

    this.viewStore = new ViewStore(this);

    runInAction(() => {
      this.initialized = true;
    });

    this.loadableStores.forEach((store) => store.load());

    reaction(
      () => this.sessionStore.account,
      (account) => {
        if (account) {
          this.loadableStores.forEach((store) => store.load());
        } else {
          this.resettableStores.forEach((store) => store.reset());
          this.loadableStores.forEach((store) => store.load());
        }
      }
    )
  }

  
  subscribeTo(store: ResettableStore, events: ['reset'])
  subscribeTo(store: LoadeableStore<any>, events: ['load'])
  subscribeTo(store: ResettableStore & LoadeableStore<any>, events: ['load', 'reset'])
  @action
  subscribeTo(store: any, events: any) {
    if (events.includes('load')) {
      this.loadableStores.push(store);
    }
    if (events.includes('reset')) {
      this.resettableStores.push(store);
    }
  }
}


export const rootStore = Object.freeze(new RootStore());
export const storesContext = React.createContext(rootStore);
export const StoresProvider = storesContext.Provider;
