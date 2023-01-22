import api from './base';
import { AxiosPromise, CancelTokenSource } from 'axios';

export enum Role {
    admin = 'ADMIN',
    user = 'USER',
}

export interface Subject {
    id: number;
    name: string;
    alternate_name: string;
    long_name: string;
    active: boolean;
}
export interface Schoolyear {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
}

export interface Teacher {
    id: number;
    name: string;
    longName: string;
    title: string;
    active: boolean;
}

export interface Department {
    id: number;
    name: string;
    longName: string;
}

export interface Klass {
    id: number;
    name: string;
    longName: string;
    active: boolean;
    did: number;
    teacher1: number;
}

export interface Lesson {
    id: number;
    lesson_id: number;
    lesson_number: number;
    start_time: number;
    end_time: number;
    class_ids: number[];
    teacher_ids: number[];
    subject_id: number;
}

export interface Untis {
    subjects: Subject[];
    schoolyear: Schoolyear;
    teachers: Teacher[];
    departments: Department[];
    classes: Klass[];
    lessons: Lesson[];
}
export function teachers(cancelToken: CancelTokenSource): AxiosPromise<Teacher[]> {
    return api.get('untis/teachers', { cancelToken: cancelToken.token });
}
export function sync(cancelToken: CancelTokenSource): AxiosPromise<any> {
    return api.post('untis/sync', { cancelToken: cancelToken.token });
}
