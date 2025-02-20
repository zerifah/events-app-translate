import { action, computed, makeObservable, observable, override } from 'mobx';
import _ from 'lodash';
import axios from 'axios';
import { RootStore } from './stores';
import iStore from './iStore';
import { JobAndEvents as JobAndEventsProps, Job as JobProps, JobState, JobType as ApiJobType} from '../api/job';
import { importExcel as postExcel } from '../api/event';
import Job, { ImportJob, SyncJob } from '../models/Job';
import User from '../models/User';

export class JobStore extends iStore<JobProps, `postExcel-${string}`> {
    readonly root: RootStore;
    readonly API_ENDPOINT = 'job';

    models = observable<Job>([]);
    cancelToken = axios.CancelToken.source();
    constructor(root: RootStore) {
        super();
        this.root = root;
        makeObservable(this);
    }

    createModel(data: JobProps): SyncJob | ImportJob {
        return Job.create(data, this);
    }

    findUser(id?: string) {
        return this.root.userStore.find<User>(id);
    }

    addToStore(data: JobProps): Job
    @override
    addToStore(data: JobAndEventsProps): Job {
        const job = this.createModel(data);
        if (job.state === JobState.DONE) {
            this.removeFromStore(data.id);
            if (this.loaded && job.type === ApiJobType.SYNC_UNTIS) {
                this.root.departmentStore.reload();
                this.root.untisStore.reload();
            }
            if (data.events) {
                this.root.eventStore.appendEvents(data.events);
            }
        } else {
            this.removeFromStore(data.id);
        }
        this.models.push(job);
        return job;
    }

    @override
    removeFromStore(id?: string) {
        if (!id) {
            return;
        }
        /**
         * remove events created by this job from eventStore
         */
        const eventsToRemove = this.root.eventStore.events.slice().filter((e) => e.jobId === id);
        this.root.eventStore.removeEvents(eventsToRemove);
        /**
         * remove the job from the store
         */
        const job = this.find(id) as Job;
        if (job) {
            this.models.remove(job);
            return job;
        }
    }

    @computed
    get importJobs(): ImportJob[] {
        const models = this.models.slice().filter((j) => j.type === ApiJobType.IMPORT) as ImportJob[];
        return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    @computed
    get syncJobs(): SyncJob[] {
        const models = this.models.slice().filter((j) => j.type === ApiJobType.SYNC_UNTIS) as SyncJob[];
        return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    @computed
    get hasPendingSyncJobs() {
        return this.syncJobs.some((j) => j.state === JobState.PENDING);
    }

    @action
    loadJob(id: string) {
        return this.loadModel(id);
    }

    bySemester(semesterId: string) {
        return this.syncJobs.filter((j) => j.semesterId === semesterId);
    }

    @action
    importExcel(file: File) {
        const formData = new FormData();
        formData.append('terminplan', file);
        return this.withAbortController(`postExcel-${file.name}`, (sig) => {
            return postExcel(formData, sig.signal).then(({ data }) => {
                if (data) {
                    const job = this.addToStore(data);
                    return job;
                }
                return null;
            });
        });
    }

    jobEvents(jobId: string) {
        return this.root.eventStore.byJob(jobId);
    }
}
