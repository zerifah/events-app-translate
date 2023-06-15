import { EventState } from "../api/event";
import { rootStore } from "./stores";

export enum IoEvent {
    NEW_RECORD = 'NEW_RECORD',
    CHANGED_RECORD = 'CHANGED_RECORD',
    DELETED_RECORD = 'DELETED_RECORD',
    CHANGED_STATE = 'CHANGED_STATE',
}


export type RecordTypes = 'EVENT' | 'USER' | 'JOB' | 'DEPARTMENT' | 'SEMESTER' | 'REGISTRATION_PERIOD' | 'USER_EVENT_GROUP';

export const RecordStoreMap: {[key in RecordTypes]: keyof typeof rootStore} = {
    EVENT: 'eventStore',
    USER: 'userStore',
    JOB: 'jobStore',
    DEPARTMENT: 'departmentStore',
    SEMESTER: 'semesterStore',
    REGISTRATION_PERIOD: 'registrationPeriodStore',
    USER_EVENT_GROUP: 'userEventGroupStore'
};


export interface NewRecord {
    record: RecordTypes;
    id: string;
}

export interface ChangedRecord {
    record: RecordTypes;
    id: string;
}

export interface ChangedState {
    state: EventState;
    ids: string[];
}
