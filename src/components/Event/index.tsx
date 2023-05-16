import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as EventModel } from '@site/src/models/Event';
import DefinitionList from '../shared/DefinitionList';
import Badge from '../shared/Badge';
import { mdiArrowRightBottom, mdiEqual, mdiText } from '@mdi/js';
import { Icon } from '../shared/icons';
import Button from '../shared/Button';
import { useStore } from '@site/src/stores/hooks';
import Lesson from '../Lesson';
import Translate, { translate } from '@docusaurus/Translate';
import Description from './EventFields/Description';
import DescriptionLong from './EventFields/DescriptionLong';
import KW from './EventFields/Kw';
import Day from './EventFields/Day';
import DateTime from './EventFields/DateTime';
import Location from './EventFields/Location';
import Audience from './EventFields/Audience';
import State from './EventFields/State';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Edit from '../shared/Button/Edit';
import Actions from './EventFields/Actions';
interface Props {
    event: EventModel;
}

const Event = observer((props: Props) => {
    const { event } = props;
    const {i18n} = useDocusaurusContext();
    const socketStore = useStore('socketStore');
    const commonProps = { event, styles };
    const commonEditProps = { ...commonProps, isEditable: true };
    return (
        <div className={clsx(styles.eventCard, 'card')}>
            <div className={clsx('card__header')}>
                <h3>{event.description}</h3>
            </div>
            <div className={clsx('card__body')}>
                <DefinitionList>
                    <dt><Translate id="event.description" description='for a single event: description'>Titel</Translate></dt>
                    <dd><Description {...commonEditProps} /></dd>
                    {event.descriptionLong && (
                        <>
                            <dt><Translate id="event.descriptionLong" description='for a single event: description long'>Beschreibung</Translate></dt>
                            <dd><DescriptionLong {...commonEditProps} /></dd>
                        </>
                    )}
                    <dt><Translate id="event.state" description='for a single event: state'>Status</Translate></dt>
                    <dd className={styles.flex}>
                        <State {...commonProps} /> 
                        <Actions {...commonProps} hideShare />
                    </dd>
                    <dt><Translate id="event.kw" description='for a single event: kw'>KW</Translate></dt>
                    <dd><KW {...commonProps} /></dd>
                    <dt><Translate id="event.weekday" description='for a single event: weekday'>Wochentag</Translate></dt>
                    <dd><Day {...commonProps} /></dd>
                    <dt><Translate id="event.date" description='for a single event: date range'>Datum</Translate></dt>
                    <dd className={styles.flex}><DateTime {...commonEditProps} time='start' /></dd>
                    <dd className={styles.flex}><Icon path={mdiArrowRightBottom} /><DateTime {...commonEditProps} time='end' /></dd>
                    <dd className={clsx(styles.duration, styles.flex)}><Icon path={mdiEqual} />{event.fDuration}</dd>
                    <dt><Translate id="event.location" description='for a single event: location'>Ort</Translate></dt>
                    <dd><Location {...commonEditProps} /></dd>
                    {event.isEditing ? (
                        <>
                            <dt><Translate id="event.audience" description='for a single event: class and department picker'>Beteiligte</Translate></dt>
                            <dd><Audience {...commonEditProps} /></dd>
                        </>
                    ) : (
                        <>
                            {event.classes.size > 0 && (
                                <>
                                    <dt><Translate id="event.classes" description='for a single event: classes'>Klassen</Translate></dt>
                                    <dd>{[...event.classes].map((cl, idx) => <Badge key={`cl-${idx}`} text={cl} />)}</dd>
                                </>
                            )}
                            {event.departments.length > 0 && (
                                <>
                                    <dt><Translate id="event.departments" description='for a single event: departments'>Departemente</Translate></dt>
                                    <dd>{event.departments.map((dp, idx) => <Badge key={`gr-${idx}`} text={dp.name} />)}</dd>
                                </>
                            )}
                        </>
                    )}
                    {event.affectedLessonsByClass.length > 0 && (
                        <>
                            <dt><Translate id="event.affectedLessons" description='for a single event: affected lessons'>Betroffene Lektionen</Translate></dt>
                            {event.affectedLessonsByClass.map((kl, idx) => (
                                <React.Fragment key={`kl-${idx}`}>
                                    <dt >{kl.class}</dt>
                                    <dd className={clsx(styles.lessons)}>
                                        {kl.lessons.map((l, idx) => (
                                            <Lesson lesson={l} key={l.id} />
                                        ))}
                                    </dd>
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </DefinitionList>
            </div>
            <div className={clsx('card__footer')}>
                <Button
                    text={translate({ message: "Alle betroffenen Lektionen anzeigen", id: 'event.button.showAllLessons', description: 'for a single event: button to show all affected lessons' })}
                    icon={mdiText}
                    onClick={() => {
                        socketStore.checkUnpersistedEvent(event.props);
                    }}
                />
            </div>
        </div>
    )
});

export default Event;