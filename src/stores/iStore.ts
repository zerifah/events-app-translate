import { action, IObservableArray, observable } from "mobx";
import ApiModel from "../models/ApiModel";
import { all as apiAll, find as apiFind, create as apiCreate, destroy as apiDestroy, update as apiUpdat } from '../api/api_model';
import { RootStore } from "./stores";
import { computedFn } from "mobx-utils";
import axios from "axios";

export class ResettableStore {
    reset() {
        /**
         * Reset the store to its initial state
         */
        throw new Error('Not implemented');
    }
}

export class LoadeableStore<T> {
    load(): Promise<T | T[]> {
        /**
         * Load the data from the api
         */
        throw new Error('Not implemented');
    }
}

type ApiAction = 'loadAll' | `load-${string}` | `save-${string}` | `destroy-${string}`;
export enum ApiState {
    IDLE = 'idle',
    LOADING = 'loading',
    ERROR = 'error',
    SUCCESS = 'success',
}


const API_STATE_RESET_TIMEOUT = 1500;

abstract class iStore<Model extends { id: string }, Api = ''> extends ResettableStore implements LoadeableStore<any> {
    abstract readonly root: RootStore;
    abstract readonly API_ENDPOINT: string;
    abstract models: IObservableArray<ApiModel<Model>>;

    abortControllers = new Map<Api | ApiAction, AbortController>();
    apiState = observable.map<Api | ApiAction, ApiState>();

    withAbortController<T>(sigId: Api | ApiAction, fn: (ct: AbortController) => Promise<T>) {
        const sig = new AbortController();
        if (this.abortControllers.has(sigId)) {
            this.abortControllers.get(sigId).abort();
        }
        this.abortControllers.set(sigId, sig);
        this.apiState.set(sigId, ApiState.LOADING);
        return fn(sig).then(action((res) => {
            this.apiState.set(sigId, ApiState.SUCCESS);
            return res;
        })).catch(action((err) => {
            if (axios.isCancel(err)) {
                return { data: null };
            } else {
                this.apiState.set(sigId, ApiState.ERROR);
            }
            throw err;
        })).finally(() => {
            if (this.abortControllers.get(sigId) === sig) {
                this.abortControllers.delete(sigId);
            }
            setTimeout(action(() => {
                if (this && !this.abortControllers.has(sigId)) {
                    this.apiState.delete(sigId);
                }
            }), API_STATE_RESET_TIMEOUT);
        });
    }

    abstract createModel(data: Model): ApiModel<Model>;

    find = computedFn(
        function <V extends ApiModel<Model>>(this: iStore<Model, Api>, id?: string): V | undefined {
            if (!id) {
                return;
            }
            return this.models.find((d) => d.id === id) as V;
        },
        { keepAlive: true }
    )

    apiStateFor = computedFn(
        function (this: iStore<Model, Api>, sigId?: Api | ApiAction): ApiState {
            if (!sigId) {
                return ApiState.IDLE;
            }
            return this.apiState.get(sigId) || ApiState.IDLE;
        }
    )

    @action
    addToStore(data: Model): ApiModel<Model> {
        /**
         * Adds a new model to the store. Existing models with the same id are replaced.
         */
        const model = this.createModel(data);
        this.removeFromStore(model.id);
        this.models.push(model);
        return model;
    }

    @action
    removeFromStore(id: string): ApiModel<Model> | undefined {
        /**
         * Removes the model to the store
         */
        const old = this.find(id);
        if (old) {
            this.models.remove(old);
        }
        return old as ApiModel<Model>;
    }


    @action
    load(): Promise<any> {
        return this.withAbortController('loadAll', (sig) => {
            return apiAll<Model>(`${this.API_ENDPOINT}/all`, sig.signal)
                .then(
                    action(({ data }) => {
                        if (data) {
                            this.models.replace(data.map((d) => this.createModel(d)));
                        }
                        return this.models;
                    })
                );
        });

    }


    @action
    reset() {
        this.models.clear();
    }


    @action
    loadModel(id: string) {
        return this.withAbortController(`load-${id}`, (sig) => {
            return apiFind<Model>(`${this.API_ENDPOINT}/${id}`, sig.signal);
        }).then(action(({ data }) => {
            if (data) {
                this.addToStore(data);
            }
        }));
    }

    @action
    save(model: ApiModel<Model>) {
        if (model.isDirty) {
            const { id } = model;
            return this.withAbortController(`save-${id}`, (sig) => {
                return apiUpdat<Model>(`${this.API_ENDPOINT}/${id}`, model.props, sig.signal);
            }).then(action(({ data }) => {
                if (data) {
                    this.addToStore(data);
                }
            }));
        }
        return Promise.resolve(undefined);
    }

    @action
    destroy(model: ApiModel<Model>) {
        const { id } = model;
        this.withAbortController(`destroy-${id}`, (sig) => {
            return apiDestroy<Model>(`${this.API_ENDPOINT}/${id}`, sig.signal);
        }).then(action(() => {
            this.removeFromStore(id);
        }));
    }

    @action
    create(model: Partial<Model>) {
        /**
         * Save the model to the api
         */
        const { id } = model;
        this.withAbortController(`destroy-${id}`, (sig) => {
            return apiCreate<Model>(this.API_ENDPOINT, model, sig.signal);
        }).then(action(({ data }) => {
            this.addToStore(data);
        }));
    }

}

export default iStore;