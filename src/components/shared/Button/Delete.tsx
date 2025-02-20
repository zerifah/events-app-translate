import React, { type ReactNode } from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { DeleteIcon, SIZE_S } from '../icons';
import Button, { Base, extractSharedProps } from '.';

interface Props {
    onClick: () => void;
    flyoutSide?: 'left' | 'right';
    size?: number;
}

type DeleteProps = Props & Base;

const Delete = (props: DeleteProps) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    const [promptDelete, setPromptDelete] = React.useState(false);

    const onBlur = () => {
        setPromptDelete(false);
        document.removeEventListener('click', onBlur);
    };

    React.useEffect(() => {
        return () => {
            document.removeEventListener('click', onBlur);
        }
    }, []);

    React.useEffect(() => {
        if (promptDelete && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [promptDelete, ref])

    const Flyout = promptDelete ? (<Button
        className={clsx(styles.confirm)}
        color='red'
        onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onClick();
        }}
        text="Ja"
    />) : null;

    return (
        <span className={clsx(styles.delete, promptDelete && styles.expanded, props.className)} ref={ref}>
            {(props.flyoutSide ?? 'left') === 'left' && Flyout}
            <Button
                title="Löschen"
                {...extractSharedProps(props)}
                className={clsx(props.className, styles.delete, props.flyoutSide === 'right' && styles.right, props.className)}
                onClick={(e) => {
                    setPromptDelete(!promptDelete);
                    document.addEventListener('click', onBlur);
                    e.stopPropagation();
                    e.preventDefault();
                }}
                color='red'
                icon={<DeleteIcon size={props.size ?? SIZE_S} />}
            />
            {props.flyoutSide === 'right' && Flyout}
        </span>
    )
};

export default Delete;