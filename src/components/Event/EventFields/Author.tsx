import React, { type ReactNode } from 'react';
import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import { useStore } from '@site/src/stores/hooks';
import { ReadonlyProps } from './iEventField';
import Badge from '@site/src/components/shared/Badge';

const Author = observer((props: ReadonlyProps) => {
    const { styles } = props;
    return (
        <div 
            style={{gridColumn: 'author'}} 
            className={clsx('author', styles.author, props.className, 'grid-author')}
            onClick={() => props.event.setExpanded(true)}
        >
            <Badge text={(props.event.author?.shortName || props.event.author?.email) ?? '-'}/>
        </div>
    )
});

export default Author;