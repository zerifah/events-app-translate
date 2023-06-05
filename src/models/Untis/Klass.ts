import { UntisStore } from '@site/src/stores/UntisStore';
import { computed, makeObservable } from 'mobx';
import { UntisClassWithTeacher } from '../../api/untis';
import Department from '../Department';
import { KlassName } from '../helpers/klassNames';
import { toDepartmentName } from '../helpers/departmentNames';
import Teacher from './Teacher';
import { DepartmentLetter } from '@site/src/api/department';
import _ from 'lodash';

export default class Klass {
    readonly id: number
    readonly name: KlassName;
    readonly legacyName?: string
    readonly sf: string
    readonly year: number
    readonly departmentId: string
    readonly teacherIds: number[]
    readonly lessonIds: number[]
    private readonly store: UntisStore;

    constructor(props: UntisClassWithTeacher, store: UntisStore) {
        this.store = store;
        this.id = props.id;
        this.name = props.name;
        this.legacyName = props.legacyName;

        this.sf = props.sf;
        this.year = props.year;
        this.departmentId = props.departmentId ?? '';
        this.teacherIds = props.teachers.map(t => t.id);
        this.lessonIds = props.lessons.map(t => t.id);

        makeObservable(this);
    }

    static ClassNamesGroupedByYear(classes: Klass[], threshold: number = 3): {[name: string]: string} {        
        const klGroupsRaw = _.groupBy(_.uniqBy(classes, c => c.id), c => c?.year);
        const klGroup: {[key: string]: string} = {};
        console.log(klGroupsRaw);
        Object.keys(klGroupsRaw).forEach((year) => {
            if (klGroupsRaw[year].length > threshold) {
                klGroup[year] = `${year.slice(2)}`;
            } else {
                klGroup[year] = klGroupsRaw[year].map(c => c?.displayName).join(', ');
            }
        });
        return klGroup;
    }

    @computed
    get departmentLetter(): DepartmentLetter {
        return this.name.slice(2, 3) as DepartmentLetter;
    }

    @computed
    get displayName() {
        return this.legacyName || this.name;
    }

    @computed
    get letter() {
        if (this.year > 2026) {
            return this.name.slice(3);
        }
        return this.displayName.slice(2);
    }

    @computed
    get departmentName(): string {
        if (this.department?.name) {
            return this.department.name;
        }
        return toDepartmentName(this.name);
    }

    @computed
    get teachers() {
        return this.teacherIds.map(t => this.store.findTeacher(t));
    }

    @computed
    get klp(): Teacher | undefined {
        const ks = this.lessons.find(l => l.subject==='KS' || l.subject==='MC');
        return ks?.teachers && ks.teachers[0];
    }

    @computed
    get lessons() {
        const current = this.store.currentSemester;
        return this.lessonIds.map(t => this.store.findLesson(t)).filter(l => l?.semesterId === current?.id);
    }

    @computed
    get department(): Department | undefined {
        return this.store.findDepartment(this.departmentId);
    }

}