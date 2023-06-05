import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@site/src/stores/hooks';
import {default as DepartmentModel} from '@site/src/models/Department';
import { formatDateTime } from '@site/src/models/helpers/time';
import Badge from '../../shared/Badge';
import Save from '../../shared/Button/Save';
import Delete from '../../shared/Button/Delete';
import Discard from '../../shared/Button/Discard';
import TextArea from '../../shared/TextArea';
import TextInput from '../../shared/TextInput';
import Select from 'react-select';
import { DepartmentLetter } from '@site/src/api/department';
import Button from '../../shared/Button';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface Props {
    department: DepartmentModel;
}

const Department = observer((props: Props) => {
    const departmentStore = useStore('departmentStore');
    const {department} = props;
    return (
        <tr className={clsx(styles.department)}>
            <td>
                <TextInput text={department.name} onChange={(txt) => department.update({name: txt})} />
            </td>
            <td className={clsx(styles.description)}>
                <TextArea text={department.description} onChange={(txt) => department.update({description: txt})} rows={2}/>
            </td>
            <td>
                {/* Department Letter */}
                <Select 
                    menuPortalTarget={document.body}
                    styles={{ 
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                    }}
                    value={{value: department.letter, label: department.letter}}
                    options={
                        ALPHABET.split('').map((l) => ({
                            value: l,
                            label: l
                        }))
                    }
                    onChange={(opt) => {
                        department.update({letter: opt?.value as DepartmentLetter});
                    }}
                    isMulti={false}
                    isSearchable={true}
                    isClearable={false}
                />
            </td>
            <td className={clsx(styles.colorData)}>
                <label className={clsx(styles.color)}>
                    <Badge 
                        text={department.color} 
                        color={department.color}
                    />
                    <input 
                        type="color" 
                        value={department.color} 
                        onChange={(e) => department.update({color: e.target.value})} 
                    />
                </label>
            </td>
            <td>
                {/* Class Letters */}
                <div className={clsx(styles.classLetters)}>
                    {department.validClassLetters.map((l) => (
                        <Button 
                            key={l}
                            text={l}
                            className={clsx(styles.classLetter)}
                            color={department.color}
                            active={department.classLetters.has(l)}
                            onClick={() => {
                                department.toggleClassLetter(l);
                            }}
                        />
                    ))}
                </div>
            </td>
            <td>{formatDateTime(department.createdAt)}</td>
            <td>{formatDateTime(department.updatedAt)}</td>
            <td><Badge text={department.id} /></td>
            <td>
                <div className={clsx(styles.actions)}>
                    {department.isDirty && <Discard onClick={() => department.reset()} />}
                    {department.isDirty && <Save onClick={() => departmentStore.save(department)} />}
                    <Delete onClick={() => departmentStore.destroy(department)} disabled={department.events.length > 0 || department.classes.length > 0} />
                </div>
            </td>
        </tr>
    )
});

export default Department;