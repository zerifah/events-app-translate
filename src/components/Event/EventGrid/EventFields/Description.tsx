import React, { type ReactNode } from 'react';
import clsx from 'clsx';

import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { Props } from './iEventField';
import TextArea from '@site/src/components/shared/TextArea';

const Description = observer((props: Props) => {

    if (props.isEditable && props.event.editing) {
        return (
            <div 
                style={{gridColumn: 'description'}} 
                className={clsx(styles.description, props.className)}
            >
                <TextArea
                    text={props.event.description}
                    onChange={(text) => props.event.update({description: text})}
                />
            </div>
        )
    }
    return (
        <div 
            style={{gridColumn: 'description'}} 
            className={clsx(styles.description, props.className)}
            onClick={() => props.event.setExpanded(true)}
        >
            {props.event.description}
        </div>
    )
});

export default Description;