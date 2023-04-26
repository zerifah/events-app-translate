import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';


interface Props {
    label?: string;
    checked: boolean;
    partialChecked?: boolean;
    className?: string;
    onChange?: (checked: boolean, shiftKey?: boolean) => void;
}

const Checkbox = observer((props: Props) => {
    return (
        <div className={clsx(styles.checkbox, props.checked && styles.checked, props.partialChecked && styles.partialChecked, props.className)}>
            <label className={clsx(styles.label)}>
                <input
                    className={styles.checkbox}
                    type='checkbox' 
                    onChange={action((e) => {
                        props.onChange(!props.checked, (e.nativeEvent as any).shiftKey);
                    })} 
                    checked={props.checked}
                />
                {props.label}
            </label>
        </div>
    )
});

export default Checkbox;