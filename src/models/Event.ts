import { action, computed, makeObservable, observable, override } from 'mobx';
import { Event as EventProps, EventState } from '../api/event';
import { EventStore } from '../stores/EventStore';
import { ApiAction } from '../stores/iStore';
import ApiModel, { UpdateableProps } from './ApiModel';
import { toLocalDate, formatTime, formatDate, getWeekdayOffsetMS, getKW, DAYS, toGlobalDate, DAY_2_MS, HOUR_2_MS, MINUTE_2_MS, WEEK_2_MS } from './helpers/time';
import Klass from './Untis/Klass';
import Lesson from './Untis/Lesson';

export interface iEvent {
    weekOffsetMS_start: number;
    weekOffsetMS_end: number;
    year: number;
}
export default class Event extends ApiModel<EventProps, ApiAction> implements iEvent {
    readonly store: EventStore;
    readonly _pristine: EventProps;
    readonly UPDATEABLE_PROPS: UpdateableProps<EventProps>[] = [
        'description', 
        'descriptionLong', 
        {start: (val) => toLocalDate(new Date(val))}, 
        {end: (val) => toLocalDate(new Date(val))}, 
        'location',
        'classes',
        'departmentIds'
    ];
    readonly id: string;
    readonly authorId: string;
    readonly createdAt: Date;
    readonly jobId: string;
    readonly state: EventState;
    readonly _pristine_end: Date;
    readonly _pristine_start: Date;

    @observable.ref
    updatedAt: Date;

    departmentIds = observable.set<string>([]);
    classes = observable<string>([]);

    @observable
    description: string;

    @observable
    descriptionLong: string;

    @observable
    location: string;

    @observable
    end: Date;

    @observable
    start: Date;


    @observable
    allDay: boolean;

    @observable
    selected: boolean = false;

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
        this.description = props.description;
        this.descriptionLong = props.descriptionLong;
        this.location = props.location;
        
        this.start = toLocalDate(new Date(props.start));
        this.end = toLocalDate(new Date(props.end));

        this._pristine_start = toLocalDate(new Date(props.start));
        this._pristine_end = toLocalDate(new Date(props.end));

        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
        this.allDay = props.allDay;
        makeObservable(this);
    }

    /**
     * class descriptors containing an asterisk are treated as wildcards
     */
    @computed
    get wildcardClasses() {
        return this.classes.slice().filter((c) => c.endsWith('*')).map((c) => c.replaceAll('*', ''));
    }

    /**
     * @example isAudience('25h')
     * @example isAudience('25*')
     * @example isAudience('27G*')
     */
    isAudience(klasse: string): boolean {
        if (this.classes.includes(klasse)) {
            return true;
        }
        if (this.wildcardClasses.some((c) => klasse.startsWith(c))) {
            return true;
        }
        return false;
    }

    @action
    requestState(state: EventState) {
        this.store.requestState([this.id], state);
    }

    @action
    toggleClass(klass: string) {
        const wildcards = this.wildcardClasses.filter(c => klass.startsWith(c));
        const preAudience = new Set(this.untisClasses.map(c => c.departmentId));
        if (this.isAudience(klass)) {
            if (!klass.endsWith('*') && wildcards.length > 0) {
                const add = this.store.root.untisStore.classes.map(c => c.name).filter(c => c !== klass && wildcards.some(wk => c.startsWith(wk)));
                wildcards.forEach(c => this.classes.remove(`${c}*`));
                this.classes.push(...add);
            } else {
                this.classes.remove(klass);
            }
        } else {
            if (klass.endsWith('*')) {
                const group = klass.replaceAll('*', '');
                const klasses = this.classes.slice().filter((c) => !c.startsWith(group));
                this.classes.replace(klasses);
            }
            this.classes.push(klass);
        }
        const currendAudience = new Set(this.untisClasses.map(c => c.departmentId));
        const add = new Set([...currendAudience].filter(x => !preAudience.has(x)));
        const remove = new Set([...preAudience].filter(x => !currendAudience.has(x)));
        console.log([...add], [...remove]);
        [...remove].forEach(d => this.departmentIds.delete(d));
        [...add].forEach(d => this.departmentIds.add(d));
    }

    @action
    setExpanded(expanded: boolean) {
        this.store.root.viewStore.setEventExpanded(this.id, expanded);
    }

    @action
    setSelected(selected: boolean) {
        this.selected = selected;
    }

    @computed
    get isExpanded() {
        return this.store.root.viewStore.expandedEventIds.has(this.id);
    }

    @computed
    get invalid(): boolean {
        return this.durationMS <= 0
    }

    @computed
    get isEditable() {
        return this.store.canEdit(this);
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

    @computed
    get deparments() {
        return this.store.getDepartments([...this.departmentIds]);
    }

    @computed
    get departmentNames() {
        return this.deparments.map(d => d.name);
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
    get fClasses(): string[] {
        const kls: {[year: string]: string[]} = {};
        this.classes.slice().sort().forEach(c => {
            const year = c.slice(0, 2);
            if (!kls[year]) {
                kls[year] = [];
            }
            kls[year].push(c.slice(2));
        });
        return Object.keys(kls).map(year => `${year}${kls[year].sort().join('')}`);
    }

    @computed
    get weekOffsetMS_start() {
        const hours = Math.floor(this.startHHMM / 100);
        const minute = this.startHHMM % 100;
        return this.start.getDay() * DAY_2_MS + hours * HOUR_2_MS + minute * MINUTE_2_MS;
    }

    @computed
    get weekOffsetMS_end() {
        // const hours = Math.floor(this.endHHMM / 100);
        // const minute = this.endHHMM % 100;
        // return this.weekDay * DAY_2_MS + hours * HOUR_2_MS + minute * MINUTE_2_MS;
        return this.weekOffsetMS_start + this.durationMS;
    }

    @computed
    get kw() {
        return getKW(this.start);
    }

    @computed
    get day() {
        return DAYS[this.start.getDay()];
    }

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

    affectsClass(klass: Klass) {
        return this.classes.some(c => c === klass.name);
    }

    @computed
    get untisClasses() {
        return this.store.getUntisClasses(this.classes);
    }

    @computed
    get affectedLessons(): {class: string, lessons: Lesson[]}[] {
        return this.untisClasses.map(c => ({class: c.name, lessons: c.lessons.slice().filter(l => this.hasOverlap(l)).sort((a, b) => a.weekOffsetMS_start - b.weekOffsetMS_start)}));
    }

    @computed
    get isPublic() {
        return this.state === EventState.Published;
    }

    @computed
    get queryParam() {
        return `id=${this.id}`;
    }

    @computed
    get shareUrl() {
        return `/event?${this.queryParam}`;
    }

    @override
    get props(): EventProps {
        return {
            id: this.id,
            jobId: this.jobId,
            state: this.state,
            authorId: this.authorId,
            departmentIds: [...this.departmentIds],
            classes: this.classes.slice(),
            description: this.description,
            descriptionLong: this.descriptionLong,
            location: this.location,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            start: toGlobalDate(this.start).toISOString(),
            end: toGlobalDate(this.end).toISOString(),
            allDay: this.allDay
        }
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
    get weekDay() {
        return this.start.getDay();
    }

    hasOverlap(lesson: Lesson) {
        const {weeks, minutes} = this.duration;
        const dayOffset = (lesson.weekDay + weeks * 7 - this.weekDay) % 7;
        const startOffset = dayOffset * 24 * 60 + Math.floor(lesson.startHHMM / 100) * 60 + lesson.startHHMM % 100;
        const endOffset = dayOffset * 24 * 60 + Math.floor(lesson.endHHMM / 100) * 60 + lesson.endHHMM % 100;
        const eventStartOffset = this.start.getHours() * 60 + this.start.getMinutes();

        return startOffset < (eventStartOffset + minutes) && endOffset > eventStartOffset;
    }
}
