import React from 'react';
import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import { useStore } from '@site/src/stores/hooks';
import Select, {createFilter} from 'react-select';
import { Props } from './iEventField';
import styles from './styles.module.scss';

const SubjectSelector = observer((props: Props) => {
    const untisStore = useStore('untisStore');
    const { event } = props;
    const affectedDepIds = new Set(event.affectedDepartments.map(d => d.id));
    const subjects = affectedDepIds.size > 0 ? untisStore.subjects.slice().filter(s => s.departmentIds.some(did => affectedDepIds.has(did))) : untisStore.subjects.slice();
    return (
        <div className={clsx(styles.container)}>
            <Select
                menuPortalTarget={document.body}
                styles={{ 
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    valueContainer: (base) => ({...base, flexBasis: '12em'})
                }}
                className={clsx(styles.select)}
                classNamePrefix="select"
                value={[...event.subjects].map((s) => {
                    const subj = untisStore.findSubject(s);
                    const label = subj ? `${subj.name} - ${subj.description}` : s;
                    return {value: s, label: label}
                })}                
                options={
                    subjects.map((s) => ({
                        value: s.name,
                        label: `${s.name} - ${s.description} - ${s.departments.filter(d => affectedDepIds.has(d.id)).map(d => d.shortName).join(', ')}`
                    }))
                }
                onChange={(opt) => {
                    event.setSubjects(opt?.map((o) => o.value));
                }}
                filterOption={createFilter({stringify: (o) => o.label})}
                isMulti
                isSearchable
                isClearable
            />

        </div>
    )
});

export default SubjectSelector;