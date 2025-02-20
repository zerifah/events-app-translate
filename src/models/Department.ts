import { action, computed, makeObservable, observable, override } from "mobx";
import { DepartmentLetter, Department as DepartmentProps } from "../api/department";
import { DepartmentStore } from "../stores/DepartmentStore";
import Event from '../models/Event';
import ApiModel, { UpdateableProps } from "./ApiModel";
import _ from "lodash";
import { ApiAction } from "../stores/iStore";
import Klass from "./Untis/Klass";

export const ALPHABET_CAPITAL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ALPHABET_SMALL = 'abcdefghijklmnopqrstuvwxyz';


export default class Department extends ApiModel<DepartmentProps, ApiAction> {
    readonly UPDATEABLE_PROPS: UpdateableProps<DepartmentProps>[] = [
        'name', 
        'description', 
        'color', 
        {
            attr: 'letter', 
            transform: (val) => {
                const isCapital = val.toUpperCase() === val;
                if (val !== this.letter && this.isCapitalLetter !== isCapital) {
                    /** sid-effect: flip the class letters too */
                    this.update({classLetters: [...this.classLetters].map((l) => isCapital ? l.toLowerCase() : l.toUpperCase())});
                }
                return val
            }
        },
        {
            attr: 'classLetters', 
            update: action((val: string[]) => {
                this.classLetters.replace([...val].sort())
            })
        }
    ];
    readonly store: DepartmentStore;
    readonly _pristine: DepartmentProps;
    readonly id: string;
    readonly createdAt: Date;
    @observable
    name: string;
    @observable.ref
    updatedAt: Date;

    @observable
    color: string;
    
    @observable
    letter: string;
    
    classLetters = observable.set<string>([]);

    @observable
    description: string;

    constructor(props: DepartmentProps, store: DepartmentStore) {
        super();
        this.store = store;
        this._pristine = props;
        this.id = props.id;
        this.name = props.name;
        this.color = props.color;
        this.letter = props.letter;
        this.description = props.description;
        this.classLetters.replace(props.classLetters.sort());
        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
        makeObservable(this);

    }

    /**
     * Example: GBSL/GBJB -> GBSL
     */
    @computed
    get shortName() {
        return this.name?.split(/-|\//)[0] || '-';
    }

    @computed
    get events(): Event[] {
        return this.store.getEvents(this);
    }

    @computed
    get classes(): Klass[] {
        return this.store.getClasses(this);
    }


    @computed
    get classGroups(): Set<string> {
        return new Set<string>(this.classes.map(c => c.name.slice(0, 3)));
    }

    @computed
    get isCapitalLetter() {
        return this.letter === this.letter.toUpperCase();
    }

    @action
    toggleClassLetter(letter: string) {
        this.setClassLetter(letter, !this.classLetters.has(letter));
    }

    @action
    setClassLetter(letter: string, value: boolean) {
        if (value) {
            this.classLetters.add(letter);
        } else {
            this.classLetters.delete(letter);
        }
    }

    @computed
    get validClassLetters() {
        if (this.isCapitalLetter) {
            return ALPHABET_SMALL.split('');
        }
        return ALPHABET_CAPITAL.split('');
    }

    @computed
    get lang(): 'de' | 'fr' {
        return this.isCapitalLetter ? 'de' : 'fr';
    }

    @override
    get props(): DepartmentProps {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            letter: this.letter as DepartmentLetter,
            classLetters: [...this.classLetters],
            description: this.description,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }
}