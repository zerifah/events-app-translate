import { action, computed, makeObservable, observable, reaction } from 'mobx';
import { computedFn } from 'mobx-utils';
import { users as fetchUsers } from '../api/user';
import { RootStore } from './stores';
import User from '../models/User';
import _ from 'lodash';
import axios from 'axios';
import Teacher from '../models/Untis/Teacher';

export class UserStore {
    private readonly root: RootStore;
    @observable
    initialized = false;
    users = observable<User>([]);

    cancelToken = axios.CancelToken.source();
    constructor(root: RootStore) {
        this.root = root;

        reaction(
            () => this.root.sessionStore.account,
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
        return this.users.find((u) => u.email.toLowerCase() === this.root.sessionStore.account?.username.toLowerCase());
    }

    findUntisUser(shortName: string): Teacher | undefined {
        return this.root.untisStore.findTeacherByShortName(shortName);
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
        if (this.root.sessionStore.account) {
            this.cancelToken.cancel();
            this.cancelToken = axios.CancelToken.source();
            fetchUsers(this.cancelToken)
                .then(
                    action(({ data }) => {
                        const users = data.map((u) => new User(u, this));
                        this.users.replace(users);
                        this.initialized = true;
                    })
                )
        }
    }

}
