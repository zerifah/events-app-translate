import { IReactionDisposer, action, computed, makeObservable, observable, override, reaction } from 'mobx';
import { EventAudience, Event as EventProps, EventState, JoiEvent, JoiMessages, TeachingAffected } from '../api/event';
import { EventStore } from '../stores/EventStore';
import { ApiAction } from '../stores/iStore';
import ApiModel, { UpdateableProps } from './ApiModel';
import { toLocalDate, formatTime, formatDate, getKW, DAYS, toGlobalDate, DAY_2_MS, HOUR_2_MS, MINUTE_2_MS, WEEK_2_MS, getLastMonday, DAYS_LONG, dateBetween } from './helpers/time';
import Klass from './Untis/Klass';
import Lesson from './Untis/Lesson';
import User from './User';
import Joi from 'joi';
import _ from 'lodash';
import { KlassName } from './helpers/klassNames';
import humanize from 'humanize-duration';
import Department from './Department';

export interface iEvent {
    weekOffsetMS_start: number;
    weekOffsetMS_end: number;
    year: number;
}

interface DepartmentState {
    someDepartments: boolean;
    allDepartments: boolean;
    someDepartmentsDe: boolean;
    allDepartmentsDe: boolean;
    someDepartmentsFr: boolean;
    allDepartmentsFr: boolean;
}

export default class Event extends ApiModel<EventProps, ApiAction> implements iEvent {
    readonly store: EventStore;
    readonly _pristine: EventProps;
    readonly UPDATEABLE_PROPS: UpdateableProps<EventProps>[] = [
        'description',
        'descriptionLong',
        { attr: 'start', transform: (val) => toLocalDate(new Date(val)) },
        { attr: 'end', transform: (val) => toLocalDate(new Date(val)) },
        'location',
        'audience',
        'classGroups',
        'classes',
        'departmentIds',
        'userGroupId',
        'subjects',
        'teachingAffected'
    ];
    readonly id: string;
    readonly authorId: string;
    readonly createdAt: Date;
    readonly jobId: string;
    readonly state: EventState;
    readonly _pristine_end: Date;
    readonly _pristine_start: Date;
    readonly parentId: string | null;
    readonly cloned: boolean;
    readonly versionIds: string[];

    
    @observable
    userGroupId: string | null;

    @observable.ref
    updatedAt: Date;

    /**
     * These are **only** the departments, which are added as a whole.
     * Notice: this is not the same as the departments, which are all deparments affected by this event,
     *         which is the **union** of this and the departments of the classes
     */
    departmentIds = observable.set<string>([]);
    classes = observable.set<KlassName>([]);
    subjects = observable.set<string>([]);
    classGroups = observable.set<string>([]);

    @observable
    description: string;

    @observable
    descriptionLong: string;

    @observable
    location: string;

    @observable
    end: Date;

    @observable
    affectsCurrent: boolean;

    @observable
    deletedAt?: Date;

    @observable
    start: Date;

    @observable
    allLPs: boolean;

    @observable
    audience: EventAudience;

    @observable
    allDayType: boolean;

    @observable
    teachingAffected: TeachingAffected;

    @observable
    versionsLoaded: boolean = false;

    @observable
    selected: boolean = false;

    @observable.ref
    _errors?: Joi.ValidationError

    validationDisposer: IReactionDisposer;

    constructor(props: EventProps, store: EventStore) {
        super();
        this._pristine = props;
        this.store = store;
        this.id = props.id;
        this.jobId = props.jobId;
        this.state = props.state;
        this.authorId = props.authorId;
        this.departmentIds.replace(props.departmentIds);
        this.classes.replace(props.classes);
        this.classGroups.replace(props.classGroups);
        this.description = props.description;
        this.descriptionLong = props.descriptionLong;
        this.location = props.location;
        this.audience = props.audience;
        this.subjects.replace(props.subjects);
        this.allLPs = this.departmentIds.size > 0 && props.classes.length === 0;
        this.teachingAffected = props.teachingAffected;
        this.cloned = props.cloned;
        this.versionIds = props.versionIds;

        this.parentId = props.parentId;
        this.userGroupId = props.userGroupId;

        this.start = toLocalDate(new Date(props.start));
        this.end = toLocalDate(new Date(props.end));
        this.deletedAt = props.deletedAt ? toLocalDate(new Date(props.deletedAt)) : null;

        this._pristine_start = toLocalDate(new Date(props.start));
        this._pristine_end = toLocalDate(new Date(props.end));


        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
        makeObservable(this);
        if (this.state !== EventState.Published && !this.deletedAt) {
            this.validate();
        }
        this.validationDisposer = reaction(
            () => this.props,
            () => {
                this.validate();
            }
        );
    }

    @action
    validate() {
        const result = JoiEvent.validate(
            this.props, 
            { 
                abortEarly: false,
                messages: JoiMessages
            }
        );
        if (result.error) {
            this._errors = result.error;
        } else {
            this._errors = undefined;
        }
    }

    @override
    get isValid() {
        return this._errors === undefined || this._errors.details.length === 0;
    }

    errorFor(attr: keyof EventProps) {
        if (this._errors) {
            const error = this._errors.details.find((e) => e.context?.key === attr);
            return error;
        }
        return undefined;
    }

    @action
    setAllLPs(allLPs: boolean) {
        this.allLPs = allLPs;
    }

    @computed
    get author() {
        return this.store.root.userStore.find<User>(this.authorId);
    }

    @computed
    get hasParent() {
        return !!this.parentId;
    }

    @computed
    get parent() {
        return this.store.find<Event>(this.parentId);
    }

    @computed
    get publishedParent(): Event | undefined {
        let root: Event = this.parent;
        while (root?.hasParent) {
            root = root.parent;
        }
        return root;
    }

    @computed
    get parents() {
        if (!this.parentId) {
            return []
        }
        return [this.parent, ...this.parent.parents];
    }

    @computed
    get allVersions() {
        const root = this.publishedParent || this;
        const all = [root, ...root.descendants];
        return _.orderBy(all, ['createdAt'], ['asc']);
    }

    @computed
    get descendants() {
        return this.children.map(c => [c, ...c.descendants]).flat();
    }

    @computed
    get children() {
        return this.store.events.filter(e => e.parentId === this.id);
    }

    @computed
    get hasChildren() {
        return this.children.length > 0;
    }

    @computed
    get isAllDay() {
        return this.start.getHours() === 0 && this.start.getMinutes() === 0 && this.end.getHours() === 23 && this.end.getMinutes() === 59;
    }

    @computed
    get isOnOneDay() {
        return this.fStartDate === this.fEndDate;
    }

    @computed
    get canChangeState() {
        if (!this.isEditable) {
            return false;
        }
        switch (this.state) {
            case EventState.Draft:
                return true;
            case EventState.Review:
                return this.store.root.userStore.current?.isAdmin;
        }
        return false;
    }

    @computed
    get possibleStates(): EventState[] {
        if (!this.canChangeState) {
            return [];
        }
        switch (this.state) {
            case EventState.Draft:
                return [EventState.Review];
            case EventState.Review:
                return [EventState.Published, EventState.Refused];
            default:
                return [];
        }
    }

    @action
    requestState(state: EventState) {
        this.store.requestState([this.id], state);
    }

    @action
    toggleClass(klass: KlassName) {
        this.setClass(klass, !this.affectedClassNames.has(klass));
    }

    @action
    setClass(klass: KlassName, value: boolean) {
        if (!klass || klass.length !== 4) {
            return;
        }
        const currentActive = this.classes.has(klass);
        if (!currentActive && value) {
            this.classes.add(klass);
        } else if (currentActive && !value) {
            this.classes.delete(klass);
        }
        if (!value) {
            const classGroupName = klass.slice(0, 3);
            if (this.classGroups.has(classGroupName)) {
                this.classGroups.delete(classGroupName);
                const allOfGroup = this.store.root.untisStore.findClassesByGroupName(classGroupName);
                allOfGroup.forEach(c => {
                    if (c.name !== klass) {
                        this.classes.add(c.name);
                    }
                })
            }
            const department = this.departments.find(d => d.classes.some(c => c.name === klass));
            if (department) {
                this.departmentIds.delete(department.id);
                department.classes.forEach(c => {
                    if (c.name !== klass) {
                        this.setClass(c.name, true);
                    }
                })
            }
        }

        this.normalizeAffectedClasses();
    }

    @action
    setSubjects(subjects: string[]) {
        this.subjects.replace(subjects);
    }

    @action
    toggleClassGroup(groupName: string) {
        const current = this.untisStore.classesGroupedByGroupNames.get(groupName);
        const isActive = this.classGroups.has(groupName) || current?.every(c => this.affectedClassNames.has(c.name));
        this.setClassGroup(groupName, !isActive);
    }

    @action
    setClassGroup(klassGroup: string, value: boolean) {
        if (!klassGroup || klassGroup.length !== 3) {
            return;
        }
        const currentActive = this.classGroups.has(klassGroup);

        if (!currentActive && value) {
            this.classGroups.add(klassGroup);
        } else if (currentActive && !value) {
            this.classGroups.delete(klassGroup);
        }

        if (!value) {
            const affectedDeps = this.departments.filter(d => d.classGroups.has(klassGroup));
            if (affectedDeps.length > 0) {
                affectedDeps.forEach(dep => {
                    this.departmentIds.delete(dep.id);
                    dep.classes.forEach(c => {
                        if (!c.name.startsWith(klassGroup)) {
                            this.classes.add(c.name);
                        }
                    })
                })
            }
        }
        this.normalizeAffectedClasses();
    }

    /**
     * @returns all the class names, including
     * - known (untis) class names
     * - unknown (untis) class names
     * - class names included by classGroup
     * - class names included by department
     */
    @computed
    get affectedClassNames(): Set<string> {
        const classNames = new Set<string>(this.classes);
        [...this.classGroups].forEach(cg => {
            this.store.root.untisStore.findClassesByGroupName(cg).forEach(c => {
                classNames.add(c.name);
            });
        })
        this.departments.forEach(d => {
            d.classes.forEach(c => {
                classNames.add(c.name);
            })
        })
        return classNames;
    }

    /**
     * @returns all known classes, including
     * - known (untis) class
     * - classes included by classGroup
     * - classes included by department
     * 
     * unknwon classes are **not** included
     */
    @computed
    get affectedKnownClasses(): Set<Klass> {
        const klasses = new Set<Klass>(this._selectedClasses);
        [...this.classGroups].forEach(cg => {
            this.store.root.untisStore.findClassesByGroupName(cg).forEach(c => {
                klasses.add(c);
            });
        })
        this.departments.forEach(d => {
            d.classes.forEach(c => {
                klasses.add(c);
            })
        })
        return klasses;
    }

    @action
    normalizeAffectedClasses() {
        const cNames = new Set<string>(this.affectedClassNames);
        const classes = new Set<KlassName>();
        const classGroups = new Set<string>();
        const departmentIds = new Set<string>();
        this.departmentStore.departments.forEach(d => {
            if (d.classes.length > 0 && d.classes.every(c => cNames.has(c.name))) {
                d.classes.forEach(c => cNames.delete(c.name));
                departmentIds.add(d.id);
            }
        });
        this.untisStore.classesGroupedByGroupNames.forEach((classes, group) => {
            if (classes.every(c => cNames.has(c.name))) {
                classes.forEach(c => cNames.delete(c.name));
                classGroups.add(group);
            }
        });
        this._unknownClassGroups.forEach((cg) => {
            classGroups.add(cg);
            cNames.forEach(c => {
                if (c.startsWith(cg)) {
                    cNames.delete(c);
                }
            })
        });
        cNames.forEach((c) => {
            if (c.length === 4) {
                classes.add(c as KlassName);
            }
        });
        this.classes.replace(classes);
        this.classGroups.replace(classGroups);
        this.departmentIds.replace(departmentIds);
    }

    @action
    toggleDepartment(department: Department) {
        this.setDepartment(department, !this.departmentIds.has(department.id));
    }

    @action
    setDepartment(department: Department, value: boolean) {
        if (!department) {
            return;
        }
        const currentActive = this.departmentIds.has(department.id);
        if (currentActive && !value) {
            this.departmentIds.delete(department.id);
        } else if (!currentActive && value) {
            this.departmentIds.add(department.id);
        }
        this.normalizeAffectedClasses();
    }



    /**
     * @returns departments of the event which are included through the #departmentIds
     */
    @computed
    get departments() {
        return this.store.getDepartments([...this.departmentIds]);
    }

    /**
     * @returns all departments of the event, inlcuding the departments of the classes
     */
    @computed
    get affectedDepartments() {
        const depIds = new Set([...this.departmentIds, ...this.untisClasses.map(c => c.departmentId)]);
        return this.store.getDepartments([...depIds]);
    }

    /**
     * Returns all department ids of the event and its classes
     */
    @computed
    get departmentIdsAll() {
        return new Set(this.affectedDepartments.map(d => d.id));
    }

    @computed
    get departmentNames() {
        return this.affectedDepartments.map(d => d.name);
    }

    @action
    setAudience(audience: EventAudience) {
        this.audience = audience;
    }

    @action
    setExpanded(expanded: boolean) {
        this.store.root.viewStore.setEventExpanded(this.id, expanded);
    }

    @computed
    get isExpanded() {
        if (this.isDeleted) {
            return false;
        }
        return this.store.root.viewStore.expandedEventIds.has(this.id);
    }

    @action
    setSelected(selected: boolean) {
        this.selected = selected;
    }

    @override
    get isEditable() {
        return !this.isDeleted && this.store.canEdit(this);
    }

    /**
     * Returns the milliseconds since epoche from the pristine start time
     */
    @computed
    get startTimeMs() {
        return toLocalDate(this._pristine_start).getTime();
    }

    /**
     * Returns the milliseconds since epoche from the pristine end time
     */
    @computed
    get endTimeMs() {
        return toLocalDate(this._pristine_end).getTime();
    }

    compare(other: Event) {
        if (this.startTimeMs === other.startTimeMs) {
            if (this.endTimeMs === other.endTimeMs) {
                return this.updatedAt.getTime() - other.updatedAt.getTime();
            }
            return this.endTimeMs - other.endTimeMs;
        }
        return this.startTimeMs - other.startTimeMs;
    }

    static fDate(date: Date): string {
        return formatDate(date);
    }

    @computed
    get fStartTime() {
        return formatTime(this.start);
    }

    @computed
    get fEndTime() {
        return formatTime(this.end);
    }

    @computed
    get startHHMM() {
        return this.start.getHours() * 100 + this.start.getMinutes();
    }
    @computed
    get endHHMM() {
        return this.end.getHours() * 100 + this.end.getMinutes();
    }

    @computed
    get fStartDate() {
        return formatDate(this.start);
    }

    @computed
    get fEndDate() {
        return formatDate(this.end);
    }

    @computed
    get fClasses(): ({text: string, classes: Klass[]})[] {
        const kls: { [year: string]: Klass[] } = {};
        [...this.affectedKnownClasses].sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
            const year = c.legacyName ? c.displayName.slice(0, 2) : c.displayName.slice(0, 3);
            if (!kls[year]) {
                kls[year] = [];
            }
            kls[year].push(c);
        });
        const composed = Object.keys(kls).map(year => ({
            text: `${year}${kls[year].map(c => c.displayName.slice(year.length)).sort().join('')}`,
            classes: kls[year]
        }));

        return [...composed, ...this._unknownClassNames.map(c => ({text: c, classes: []}))];
    }

    @computed
    get weekOffsetMS_start() {
        const hours = Math.floor(this.startHHMM / 100);
        const minute = this.startHHMM % 100;
        return this.start.getDay() * DAY_2_MS + hours * HOUR_2_MS + minute * MINUTE_2_MS;
    }

    @computed
    get weekOffsetMS_end() {
        return this.weekOffsetMS_start + this.durationMS;
    }

    /**
     * Calendar week of the events **start** date
     */
    @computed
    get kw() {
        return getKW(this.start);
    }

    /**
     * Year + Calendar week of the event, separated by e '-'
     * **start** date
     * @example 2023-43 => year 2023, KW 43
     */
    @computed
    get yearsKw() {
        return `${this.year}-${this.kw}`;
    }

    /**
     * Calendar week of the events **end** date
     */
    @computed
    get kwEnd() {
        return getKW(this.end);
    }

    /**
     * Date of the first day of the current week
     */
    @computed
    get weekStart() {
        return getLastMonday(this.start);
    }

    /**
     * Date of the last day of the current week
     */
    @computed
    get weekEnd() {
        return new Date(this.weekStart.getTime() + 6 * DAY_2_MS);
    }

    @computed
    get dayStart(): typeof DAYS[number] {
        return DAYS[this.start.getDay()];
    }

    @computed
    get dayEnd(): typeof DAYS[number] {
        return DAYS[this.end.getDay()];
    }

    @computed
    get dayFullStart(): typeof DAYS_LONG[number] {
        return DAYS_LONG[this.start.getDay()];
    }

    @computed
    get dayFullEnd(): typeof DAYS_LONG[number] {
        return DAYS_LONG[this.end.getDay()];
    }

    /**
     * Returns the calendar year of the start of the event
     * @example 2023
     */
    @computed
    get year() {
        return this.start.getFullYear();
    }

    @computed
    get durationMS() {
        return this.end.getTime() - this.start.getTime();
    }

    @computed
    get progress() {
        const prog = Date.now() - this.start.getTime();
        if (prog > this.durationMS) {
            return 100;
        }
        if (prog < 0) {
            return 0;
        }
        if (this.durationMS === 0) {
            return 100;
        }
        return (prog / this.durationMS) * 100;
    }

    /** TODO: Refactor and check for correctness! */
    affectsUser(user: User) {
        if (user.departments.some(d => this.departmentIds.has(d.id))) {
            return true;
        }

        if (
            (this.audience === EventAudience.KLP || this.audience === EventAudience.STUDENTS) 
                && user.untisTeacher 
                && this.untisClasses.some(c => c.klp?.id === user.untisTeacher.id)
            ) {
            return true;
        }
        if (this.audience === EventAudience.LP && user.classes.some(c => this.affectsClass(c))) {
            return true;
        }
        if (user.untisTeacher && this.affectedLessons.some(l => l.teacherIds.includes(user.untisTeacher?.id))) {
            return true;
        }
        return false;
    }

    affectsClass(klass: Klass): boolean {
        return this.untisClasses.some(c => c.id === klass.id);
    }

    hasOverlap(lesson: Lesson) {
        if (!lesson) {
            return false;
        }
        const { weeks, minutes } = this.duration;
        const dayOffset = (lesson.weekDay + weeks * 7 - this.weekDay) % 7;
        const startOffset = dayOffset * 24 * 60 + Math.floor(lesson.startHHMM / 100) * 60 + lesson.startHHMM % 100;
        const endOffset = dayOffset * 24 * 60 + Math.floor(lesson.endHHMM / 100) * 60 + lesson.endHHMM % 100;
        const eventStartOffset = this.start.getHours() * 60 + this.start.getMinutes();
        return startOffset < (eventStartOffset + minutes) && endOffset > eventStartOffset;
    }

    @computed
    get isAffectedByUser() {
        return this.store.affectsUser(this);
    }

    /**
     * all classes that are affected by the className filter
     */
    @computed
    get _selectedClassNames(): KlassName[] {
        return [...this._selectedClasses.map(c => c.name), ...this._unknownClassNames]
    }

    /**
     * returns **only** the classes that are selected through the className filter **and** which
     * are present as a UntisClass
     */
    @computed
    get _selectedClasses(): Klass[] {
        const wildcard = new Set(this._wildcardClasses.map(c => c.id));
        return this.untisClasses.filter(c => !wildcard.has(c.id));
    }

    @computed
    get _unknownClassNames(): KlassName[] {
        const known = new Set(this.untisClasses.map(c => c.name));
        return [...this.classes].filter(c => !known.has(c));
    }

    @computed
    get _unknownClassGroups(): string[] {
        return [...this.classGroups].filter(c => !this.store.hasUntisClassesInClassGroup(c));
    }

    @computed
    get unknownClassIdentifiers(): string[] {
        return [...this._unknownClassNames, ...this._unknownClassGroups];
    }

    /**
     * all classes that are affected by this event, but are 
     * not selected thorugh the className filter
     */
    @computed
    get _wildcardClasses(): Klass[] {
        return this.store.getWildcardUntisClasses(this);
    }

    @computed
    get untisClasses(): Klass[] {
        return this.store.getUntisClasses(this);
    }

    @computed
    get affectedLessons(): Lesson[] {
        const lessons = this.untisClasses.map(c => c.lessons.slice().filter(l => this.hasOverlap(l))).flat();
        return _.uniqBy(lessons, 'id').sort((a, b) => a.weekOffsetMS_start - b.weekOffsetMS_start);
    }

    @computed
    get affectedLessonsGroupedByClass(): { class: string, lessons: Lesson[] }[] {
        const lessons = this.untisClasses.slice().map(c => c.lessons.slice().filter(l => this.hasOverlap(l))).flat();
        const affected: { [kl: string]: Lesson[] } = {};
        const placedLessonIds = new Set<number>();
        lessons.forEach(l => {
            if (placedLessonIds.has(l.id)) {
                return;
            }
            placedLessonIds.add(l.id);
            if (l.classes.length > 1) {
                const letters = l.classes.map(c => c.letter).sort();
                const year = l.classes[0].year;
                const name = `${year % 100}${letters.length > 3 ? 'er' : letters.join('')}`;
                if (!affected[name]) {
                    affected[name] = [];
                }
                affected[name].push(l);
            } else if (l.classes.length === 1) {
                const name = l.classes[0].name;
                if (!affected[name]) {
                    affected[name] = [];
                }
                affected[name].push(l);
            }
        });
        return Object.keys(affected).map(kl => ({ class: kl, lessons: affected[kl] }));
    }

    @computed
    get queryParam() {
        return `id=${this.id}`;
    }

    @computed
    get shareUrl() {
        return `/event?${this.queryParam}`;
    }

    @computed
    get isDeleted() {
        return !!this.deletedAt;
    }

    get departmentStore() {
        return this.store.root.departmentStore;
    }

    get untisStore() {
        return this.store.root.untisStore;
    }

    get departmentState(): DepartmentState {
        const someDepartments = this.departmentStore.departmentsWithClasses.some(d => this.departmentIds.has(d.id));
        const allDepartments = someDepartments && this.departmentStore.departmentsWithClasses.every(d => this.departmentIds.has(d.id));

        const { departmentsDe, departmentsFr } = this.departmentStore;
        const someDepartmentsDe = departmentsDe.some(d => this.departmentIds.has(d.id));
        const allDepartmentsDe = someDepartmentsDe && departmentsDe.every(d => this.departmentIds.has(d.id));
        const someDepartmentsFr = departmentsFr.some(d => this.departmentIds.has(d.id));
        const allDepartmentsFr = someDepartmentsFr && departmentsFr.every(d => this.departmentIds.has(d.id));
        return {
            someDepartments,
            allDepartments,
            allDepartmentsDe,
            allDepartmentsFr,
            someDepartmentsDe,
            someDepartmentsFr
        }

    }

    @override
    get props(): EventProps {
        return {
            id: this.id,
            jobId: this.jobId,
            state: this.state,
            authorId: this.authorId,
            departmentIds: [...this.departmentIds],
            classes: this._selectedClassNames,
            description: this.description,
            descriptionLong: this.descriptionLong,
            location: this.location,
            classGroups: [...this.classGroups],
            audience: this.audience,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            parentId: this.parentId,
            cloned: this.cloned,
            userGroupId: this.userGroupId,
            teachingAffected: this.teachingAffected,
            subjects: this.audience === EventAudience.LP ? [...this.subjects] : [],
            start: toGlobalDate(this.start).toISOString(),
            end: toGlobalDate(this.end).toISOString(),
            versionIds: this.versionIds,
            deletedAt: this.isDeleted ? toGlobalDate(this.deletedAt).toISOString() : null
        }
    }

    @computed
    get versionNumber() {
        return this.allVersions.indexOf(this) + 1;
    }

    @action
    loadVersions() {
        this.store.loadVersions(this).then(action((versions) => {
            this.versionsLoaded = true;
        }));
    }

    @computed
    get versions() {
        return this.versionIds.map(id => this.store.find<Event>(id)).filter(e => !!e).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    @computed
    get _dupCompareString() {
        const exclude: (keyof EventProps)[] = ['id', 'jobId', 'authorId', 'createdAt', 'updatedAt', 'parentId', 'cloned', 'userGroupId', 'state'];

        const props = (Object.keys(this.props) as (keyof EventProps)[]).filter(p => {
            return !exclude.includes(p)
        }).reduce((acc, key) => {
            let val = this.props[key];
            if (Array.isArray(val)) {
                val = val.sort().join(',');
            }
            return {...acc, [key]: val}
        }, {});

        return JSON.stringify(props);
    }

    @computed
    get duplicatedEvents() {
        return this.store.publicEvents.filter(e => e._dupCompareString === this._dupCompareString && e.id !== this.id);
    }

    @computed
    get isDuplicate() {
        return this.duplicatedEvents.length > 0;
    }

    @computed
    get duration() {
        const period = this.durationMS;
        return {
            weeks: Math.ceil(period / WEEK_2_MS),
            days: Math.ceil(period / DAY_2_MS),
            hours: Math.ceil(period / HOUR_2_MS),
            minutes: Math.ceil(period / MINUTE_2_MS)
        }
    }

    @computed
    get hasUserGroup() {
        return !!this.userGroupId;
    }

    @computed
    get userGroup() {
        return this.store.root.userStore.findUserGroup(this.userGroupId);
    }

    @computed
    get fDuration() {
        if (this.store?.root?.sessionStore?.locale === 'fr') {
            return humanize(this.durationMS, { language: 'fr', units: ['w', 'd', 'h', 'm'], round: true });
        }
        return humanize(this.durationMS, { language: 'de', units: ['w', 'd', 'h', 'm'], round: true });
    }

    /**
     * @returns The day of the week of the event
     * @example 0 = Sunday, 1 = Monday, 2 = Tuesday, ...
     */
    @computed
    get weekDay(): number {
        return this.start.getDay();
    }

    get affectedSemesters() {
        return this.store.root.semesterStore.semesters.filter(s => dateBetween(this.start, s.start, s.end) || dateBetween(this.end, s.start, s.end));
    }

    @override
    cleanup() {
        this.validationDisposer();
    }
}
