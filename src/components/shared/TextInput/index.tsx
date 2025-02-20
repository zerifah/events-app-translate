import React, { type ReactNode } from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@site/src/stores/hooks';


interface Props {
    text: string;
    onChange: (text: string) => void;
    search?: boolean;
    className?: string;
    placeholder?: string;
}

const TextInput = (props: Props) => {
    return (
        <div className={clsx(props.className, styles.textInput)}>
            <input
                type={props.search ? 'search' : 'text'}
                value={props.text}
                placeholder={props.placeholder}
                onChange={(e) => {
                    props.onChange(e.currentTarget.value);
                }}
            />
        </div>
    )
};

export default TextInput;