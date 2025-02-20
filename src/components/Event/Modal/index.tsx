import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@site/src/stores/hooks';
import Modal from '../../shared/Modal';
import {default as EventModel} from '@site/src/models/Event';
import Event from '..';
import Button from '../../shared/Button';
import { mdiClose, mdiContentDuplicate, mdiShareCircle } from '@mdi/js';
import { DeleteIcon, DiscardIcon, EditIcon, SaveIcon } from '../../shared/icons';
import EventActions from '../EventActions';
import EventBody from '../EventBody';
import useResizeObserver from '../../shared/hooks/useResizeObserver';
import { translate } from '@docusaurus/Translate';


interface Props {
}

const EventModal = observer((props: Props) => {
    const viewStore = useStore('viewStore');
    const eventStore = useStore('eventStore');
    const [buttonsWithText, setButtonsWithText] = React.useState(4);
    const { openEventModalId } = viewStore;
    const event = eventStore.find<EventModel>(openEventModalId);
    const onResize = React.useCallback((target: HTMLDivElement) => {
        const currentWidth = target.getBoundingClientRect().width;
        // 2 buttons --> 260px
        // 3 buttons --> 360px
        // 4 buttons --> 460px
        if (currentWidth > 460) {
            setButtonsWithText(4);
        } else if (currentWidth > 360) {
            setButtonsWithText(3);
        } else if (currentWidth > 260) {
            setButtonsWithText(2);
        } else {
            setButtonsWithText(1);
        }
    }, [openEventModalId]);
    
    const ref = useResizeObserver(onResize);

    return (
        <Modal
            open={!!event}
            onClose={() => viewStore.setEventModalId()}
        >
            <div className={clsx(styles.card, 'card')} ref={ref}>
                <div className={clsx(styles.header, 'card__header')}>
                    <h3>{event?.description}</h3>
                </div>
                <div className={clsx(styles.body, 'card__body')}>
                    {event && (
                        <EventBody event={event} inModal/>
                    )}
                </div>
                <div className={clsx(styles.footer, 'card__footer')}>
                    <div className={clsx('button-group button-group--block')}>
                        {event?.isEditing ? (
                            <EventActions 
                                event={event}
                                onDiscard={() => viewStore.setEventModalId()}
                                buttonsWithText={buttonsWithText}
                            />
                        ) : (
                            <>
                                <Button
                                    color="secondary"
                                    title={translate({message: 'Fenster Schliessen', id: 'button.close.title', description: 'Button title to close a modal'})}
                                    text={
                                        buttonsWithText > 2 ? 
                                            translate({message: 'Schliessen', id: 'button.close', description: 'Button text to close a modal'}) : 
                                            undefined
                                    } 
                                    icon={mdiClose} 
                                    iconSide='left' 
                                    onClick={() => {
                                        viewStore.setEventModalId()
                                    }} 
                                />
                                <EventActions event={event} buttonsWithText={buttonsWithText - 2} />
                                <Button 
                                    color="blue"
                                    text={
                                        buttonsWithText > 2 ? 
                                            translate({message: 'Öffnen', id: 'button.open', description: 'Button text for open button'}) : 
                                            undefined
                                    }
                                    icon={mdiShareCircle}
                                    href={event?.shareUrl}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
});

export default EventModal;