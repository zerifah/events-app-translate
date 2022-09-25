import { action, computed, makeObservable, observable, reaction } from 'mobx';
import { computedFn } from 'mobx-utils';
import { users as fetchUsers } from '../api/user';
import User from '../models/User';
import { RootStore } from './stores';
import _ from 'lodash';
import axios from 'axios';

export class UserStore {
    private readonly root: RootStore;
    users = observable<User>([]);

    cancelToken = axios.CancelToken.source();

    @observable initialized: boolean = false;
    constructor(root: RootStore) {
        this.root = root;

        reaction(
            () => this.root.msalStore.account,
            (account) => {
                this.reload();
            }
        );
        makeObservable(this);
    }

    cancelRequest() {
        this.cancelToken.cancel();
        this.cancelToken = axios.CancelToken.source();
    }


    @computed
    get current(): User | undefined {
        return this.users.find((u) => u.email.toLowerCase() === this.root.msalStore.account?.username.toLowerCase());
    }



    find = computedFn(
        function (this: UserStore, shortName?: string): User | undefined {
            if (!shortName) {
                return;
            }
            return this.users.find((user) => user.shortName === shortName);
        },
        { keepAlive: true }
    );


    @action
    reload() {
        this.users.replace([]);
        if (this.root.msalStore.account) {
            this.root.msalStore.withToken().then((ok) => {
                if (ok) {
                    fetchUsers(this.cancelToken)
                        .then(
                            action(({ data }) => {
                                const users = data.map((u) => new User(u));
                                this.users.replace(users);
                            })
                        )
                        .catch((err) => {
                            if (err.message?.startsWith('Network Error')) {
                                this.root.msalStore.setApiOfflineState(true);
                            } else {
                                return;
                            }
                        });
                }
            });
        }
    }

}
