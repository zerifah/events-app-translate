import React, { type ReactNode } from 'react';
import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import { ReadonlyProps } from './iEventField';
import Button from '@site/src/components/shared/Button';
import { mdiShareCircle } from '@mdi/js';
import { Icon, SIZE_S } from '@site/src/components/shared/icons';
import Discard from '@site/src/components/shared/Button/Discard';
import Save from '@site/src/components/shared/Button/Save';
import Delete from '@site/src/components/shared/Button/Delete';
import Edit from '@site/src/components/shared/Button/Edit';

interface Props extends ReadonlyProps {
}

const Actions = observer((props: Props) => {
    const { event, styles } = props;
    return (
        <div 
            style={{ gridColumn: 'actions' }}
            className={clsx(props.className, styles.actions, 'grid-actions')}
        >
            <Button
                icon={<Icon path={mdiShareCircle} color="blue" size={SIZE_S} />}
                href={event.shareUrl}
                target="_self"
            />
            {
                event.isEditable && !event.editing && (
                    <Edit onClick={() => event.setEditing(true)} />
                )
            }
            {
                event.editing && (
                    <>
                        <Discard onClick={() => event.reset()} />
                        <Save
                            disabled={!event.isDirty}
                            onClick={() => event.save()}
                            apiState={event.apiStateFor(`save-${event.id}`)}
                        />
                        <Delete onClick={() => event.destroy()} apiState={event.apiStateFor(`destroy-${event.id}`)} />
                    </>
                )
            }
        </div>
    )
});

export default Actions;