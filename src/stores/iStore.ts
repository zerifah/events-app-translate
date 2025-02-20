import { action, IObservableArray, observable } from "mobx";
import ApiModel from "../models/ApiModel";
import { all as apiAll, find as apiFind, create as apiCreate, destroy as apiDestroy, update as apiUpdat } from '../api/api_model';
import { RootStore } from "./stores";
import { computedFn } from "mobx-utils";
import axios from "axios";

type ApiModelInst = ApiModel<any, any>;
export class ResettableStore {
    reset() {
        /**
         * Reset the store to its initial state
         */
        throw new Error('Not implemented');
    }
}

export class LoadeableStore<T> {
    load(semesterId?: string): Promise<T | T[]> {
        /**
         * Load the data from the api
         */
        throw new Error('Not implemented');
    }
}

export type ApiAction = 'loadAll' | 'create' | `load-${string}` | `save-${string}` | `destroy-${string}`;
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
    abstract models: IObservableArray<ApiModel<Model, Api | ApiAction>>;

    abortControllers = new Map<Api | ApiAction, AbortController>();
    apiState = observable.map<Api | ApiAction, ApiState>();
    @observable
    loaded = false;

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

    abstract createModel(data: Model, state?: 'load' | 'create'): ApiModel<Model, Api | ApiAction>;

    apiStateFor = computedFn(
        function (this: iStore<Model, Api>, sigId?: Api | ApiAction): ApiState {
            if (!sigId) {
                return ApiState.IDLE;
            }
            return this.apiState.get(sigId) || ApiState.IDLE;
        },
        {keepAlive: true}
    );
    
    // function <V extends ApiModel<Model, Api | ApiAction>>(this: iStore<Model, Api>, id?: string): V {
    find = computedFn(        
        function <T>(this: iStore<Model, Api>, id?: string): T & ApiModel<any> {
            if (!id) {
                return;
            }
            return this.models.find((d) => d.id === id) as T & ApiModel<any>;
        },
        {keepAlive: true}
    );

    @action
    addToStore(data: Model, state?: 'load' | 'create'): ApiModel<Model, Api | ApiAction> {
        /**
         * Adds a new model to the store. Existing models with the same id are replaced.
         */
        if (!data) {
            return;
        }
        const model = this.createModel(data, state);
        this.removeFromStore(model.id);
        this.models.push(model);
        return model;
    }

    @action
    removeFromStore(id: string): ApiModel<Model, Api | ApiAction> | undefined {
        /**
         * Removes the model to the store
         */
        const old = this.find<ApiModel<Model, Api | ApiAction>>(id);
        if (old) {
            this.models.remove(old);
            old.cleanup();
        }
        return old;
    }


    @action
    load(semesterId?: string): Promise<any> {
        return this.withAbortController('loadAll', (sig) => {
            const endPoint = semesterId ?
                `${this.API_ENDPOINT}/all?semesterId=${semesterId}` :
                `${this.API_ENDPOINT}/all`;
            return apiAll<Model>(endPoint, sig.signal)
                .then(
                    action(({ data }) => {
                        if (data) {
                            data.map((d) => this.addToStore(d));
                        }
                        this.loaded = true;
                        return this.models;
                    })
                ).catch((err) => {
                    console.warn(err);
                });
        });

    }


    @action
    reset() {
        this.models.clear();
        this.loaded = false;
    }


    @action
    loadModel(id: string) {
        if (!id) {
            return Promise.resolve(undefined);
        }
        return this.withAbortController(`load-${id}`, (sig) => {
            return apiFind<Model>(`${this.API_ENDPOINT}/${id}`, sig.signal);
        }).then(action(({ data }) => {
            if (data && Object.keys(data).length > 0) {
                return this.addToStore(data, 'load');
            } else {
                /** apparently the model is not present anymore - remove it from the store */
                return this.removeFromStore(id);
            }
        })).catch((err) => {
            if (axios.isCancel(err)) {
                return;
            } else {
                /** apparently the model is not present anymore - remove it from the store */
                this.removeFromStore(id);
                return;
            }
        });
    }

    @action
    save(model: ApiModel<Model, Api | ApiAction>): Promise<ApiModel<Model, Api | ApiAction> | undefined> {
        if (model.isDirty) {
            const { id } = model;
            return this.withAbortController(`save-${id}`, (sig) => {
                return apiUpdat<Model>(`${this.API_ENDPOINT}/${id}`, model.props, sig.signal);
            }).then(action(({ data }) => {
                if (data) {
                    return this.addToStore(data);
                }
                return undefined
            }));
        }
        return Promise.resolve(undefined);
    }

    @action
    destroy(model: ApiModel<Model, Api | ApiAction>) {
        const { id } = model;
        this.withAbortController(`destroy-${id}`, (sig) => {
            return apiDestroy<Model>(`${this.API_ENDPOINT}/${id}`, sig.signal);
        }).then(action(() => {
            // this.removeFromStore(id);
            this.loadModel(id);
        }));
    }

    @action
    create(model: Partial<Model>) {
        /**
         * Save the model to the api
         */
        return this.withAbortController('create', (sig) => {
            return apiCreate<Model>(this.API_ENDPOINT, model, sig.signal);
        }).then(action(({ data }) => {
            return this.addToStore(data, 'create');
        }));
    }
}

export default iStore;