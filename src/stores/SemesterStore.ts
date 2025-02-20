import { action, computed, makeObservable, observable, override } from 'mobx';
import _ from 'lodash';
import { RootStore } from './stores';
import iStore from './iStore';
import {Semester as SemesterProps} from '../api/semester';
import Semester from '../models/Semester';
import {syncUntis as apiStartSyncJob} from '../api/semester';

export class SemesterStore extends iStore<SemesterProps, `sync-untis-semester-${string}`> {
    readonly API_ENDPOINT = 'semester';
    readonly root: RootStore;
    models = observable<Semester>([]);
    loadedSemesters = observable.set<string>();

    constructor(root: RootStore) {
        super();
        this.root = root;
        makeObservable(this);
    }

    createModel(data: SemesterProps): Semester {
        return new Semester(data, this);
    }

    @computed
    get semesters() {
        return this.models.slice().sort((a, b) => b.start.getTime() - a.start.getTime());
    }

    eventsBySemester(semester: Semester) {
        return this.root.eventStore.byDateRange(semester.start, semester.end);
    }

    lessonsBySemester(semester: Semester) {
        return this.root.untisStore.findLessonsBySemester(semester.id);
    }

    jobsBySemester(semester: Semester) {
        return this.root.jobStore.bySemester(semester.id);
    }

    @computed
    get currentSemester(): Semester | undefined {
        return this.semesters.find(s => s.isCurrent);
    }

    @override
    reset() {
        this.models.clear();
        this.loadedSemesters.clear();
    }

    nextSemester(currentId: string, offset: number) {
        const currentIdx = this.semesters.findIndex(s => s.id === currentId);
        if (currentIdx === -1) {
            return;
        }
        const idx = (currentIdx + offset) % this.semesters.length;
        return this.semesters[idx < 0 ? this.semesters.length - 1 : idx];
    }

    @action
    syncUntis(semester: Semester) {
        return this.withAbortController(`sync-untis-semester-${semester.id}`, (sig) => {
            return apiStartSyncJob(semester.id, sig.signal)
                .then(({ data }) => {
                    this.root.jobStore.addToStore(data);
                })
        });
    }
}
