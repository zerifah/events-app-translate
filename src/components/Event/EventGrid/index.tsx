import React from 'react';
import clsx from 'clsx';
import Event from './Event';
import {default as EventModel} from '@site/src/models/Event';
import styles from './styles.module.scss';
import gDefault from './gridConfigs/default.module.scss';
import gSelect from './gridConfigs/selectable.module.scss';
import gSelectAuthor from './gridConfigs/select_author.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@site/src/stores/hooks';
import EventHeader from './EventHeader';
import { action, reaction } from 'mobx';
import Filter from '../Filter';
import EventGroup from './EventGroup';
import { EventState } from '@site/src/api/event';
import { formatDate } from '@site/src/models/helpers/time';


interface Props {
    events: EventModel[];
    showFullscreenButton?: boolean;
    gridConfig?: string;
    selectable?: boolean;
    showAuthor?: boolean;
    groupBy?: 'kw';
    showFilter?: boolean;
}

const EventGrid = observer((props: Props) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const viewStore = useStore('viewStore');

    React.useEffect(() => {
        const current = viewStore.fullscreen;
        viewStore.setShowFullscreenButton(props.showFullscreenButton ?? true);
        return () => viewStore.setShowFullscreenButton(current);
    }, []);
    
    React.useEffect(
        () =>
            reaction(
                () => viewStore.fullscreen,
                (fullscreen) => {
                    if (fullscreen) {
                        ref.current?.requestFullscreen();
                    } else if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                }
            ),
        []
    );
    // Watch for fullscreenchange
    React.useEffect(() => {
        const onFullscreenChange = () => {
            if (!!document.fullscreenElement !== viewStore.fullscreen) {
                viewStore.setFullscreen(!!document.fullscreenElement);
            }
        }
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const grouped = props.events.reduce((acc, event) => {
        const key = event.kw;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(event);
        return acc;
    }, {} as {[key: string]: EventModel[]});

    let gridConfig = props.gridConfig ?? gDefault.grid;
    if (!props.gridConfig) {
        if (props.selectable && props.showAuthor) {
            gridConfig = gSelectAuthor.grid;
        } else if (props.selectable) {
            gridConfig = gSelect.grid;
        } else if (props.showAuthor) {
            gridConfig = gSelectAuthor.grid;
        }
    }

    const editable = props.events.some(e => e.isEditable);

    return (
        <div className={clsx(styles.scroll, editable && styles.editable, 'event-grid')} ref={ref}>
            {props.showFilter && <Filter />}
            <div className={clsx(styles.grid, gridConfig, (props.groupBy && viewStore.eventTable.activeGroup) && styles.overview, props.selectable && styles.selectable, props.showAuthor && styles.showAuthor)}>
                <EventHeader 
                    onSelectAll={props.selectable ? action((v) => props.events.forEach(e => e.setSelected(v))) : undefined}
                    checked={props.events.length > 0 && props.events.every(e => e.selected)} 
                    partialChecked={props.events.some(e => e.selected)}
                />
                {props.groupBy ? (
                    Object.entries(grouped).map(([kw, events]) => (
                        <EventGroup events={events} key={kw} selectable={props.selectable} id={`KW ${kw}`} content={<><span>KW {kw}</span><span style={{textAlign: 'center'}}>{formatDate(events[0].weekStart)} - {formatDate(events[0].weekEnd)}</span></>} />
                    ))
                ) : (props.events.map((event, idx) => (
                    <Event 
                        key={event.id} 
                        rowIndex={idx}
                        event={event}
                        onSelect={props.selectable ? 
                            action((selected: boolean, shiftKey: boolean) => {
                                if (shiftKey) {
                                    const topIdx = props.events.slice(0, idx).findLastIndex(e => e.selected);
                                    if (topIdx > -1) {
                                        props.events.slice(topIdx, idx).forEach(e => e.setSelected(selected));
                                    }
                                }
                                event.setSelected(selected);
                            }) : undefined
                        }
                    />
                )))}
            </div>
        </div>
    )
});

export default EventGrid;