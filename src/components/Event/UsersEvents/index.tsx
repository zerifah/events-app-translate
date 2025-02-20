import React from 'react';
import { observer } from 'mobx-react-lite';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { useStore } from '@site/src/stores/hooks';
import User from '@site/src/models/User';
import { EventState } from '@site/src/api/event';
import { Role } from '@site/src/api/user';
import clsx from 'clsx';
import AddButton from '../AddButton';
import BulkActions from '../BulkActions';
import LazyDetails from '../../shared/Details';
import Delete from '../../shared/Button/Delete';
import styles from './styles.module.scss';
import EventGrid, { ColumnConfig } from '../EventGrid';
const COLUMN_CONFIG: ColumnConfig = [
    'isValid',
    ['state', {sortable: false, width: undefined}],
    'select',
    'kw',
    'day',
    'description', 
    'start',
    'end',
    ['userGroup', {sortable: true}],
    ['location', {sortable: true}],
    ['departmens', {}],
    ['classes', {}],
    'descriptionLong',
    ['actions', {fixed: {right: 0}}]
];
const COLUMN_CONFIG_ADMIN: ColumnConfig = [...COLUMN_CONFIG.slice(0, 3), 'author', ...COLUMN_CONFIG.slice(3)]

interface Props {
    user: User;
}

const UsersEvents = observer((props: Props) => {
    const { user } = props;
    const eventStore = useStore('eventStore');
    const jobStore = useStore('jobStore');
    const viewStore = useStore('viewStore');
    if (!user) {
        return null;
    }
    const drafts = viewStore.usersEvents({ignoreImported: true, ignoreDeleted: true, states: [EventState.Draft]});
    const reviewed = viewStore.usersEvents({ignoreImported: true, ignoreDeleted: true, states: [EventState.Review, EventState.Refused]});
    const adminReview = user?.isAdmin ? viewStore.allEvents({states: [EventState.Review]}) : [];
    const published = viewStore.usersEvents({ignoreImported: true, states: [EventState.Published]});
    const deleted = viewStore.usersEvents({onlyDeleted: true});

    return (
        <Tabs lazy>
            <TabItem value='my-events' label='Unveröffentlicht'>
                <AddButton />
                {drafts.length > 0 && (
                    <div className={clsx(styles.card, 'card')}>
                        <div className={clsx('card__header')}>
                            <h3>Unveröffentlicht</h3>
                            <BulkActions events={drafts.filter(e => e.selected)} />
                        </div>
                        <div className={clsx('card__body')}>
                            <EventGrid events={drafts} columns={COLUMN_CONFIG} />
                        </div>
                    </div>
                )}
            </TabItem>
            {reviewed.length > 0 && (
                <TabItem value='reviewed' label='Review'>
                    <div className={clsx(styles.card, 'card')}>
                        <div className={clsx('card__header')}>
                            <h3>Im Review</h3>
                            <BulkActions events={reviewed.filter(e => e.selected)} />
                        </div>
                        <div className={clsx('card__body')}>
                            <EventGrid events={reviewed}  columns={COLUMN_CONFIG} />
                        </div>
                    </div>
                </TabItem>
            )}
            {adminReview.length > 0 && (
                <TabItem value='admin-review' label='Admin'>
                    <div className={clsx(styles.card, 'card')}>
                        <div className={clsx('card__header')}>
                            <h3>Review Anfragen für Admin</h3>
                            <BulkActions events={adminReview.filter(e => e.selected)} />
                        </div>
                        <div className={clsx('card__body')}>
                            <EventGrid events={adminReview}  columns={COLUMN_CONFIG_ADMIN}/>
                        </div>
                    </div>
                </TabItem>
            )}
            {published.length > 0 && (
                <TabItem value='published' label='Veröffentlicht'>
                    <div className={clsx(styles.card, 'card')}>
                        <div className={clsx('card__header')}>
                            <h3>Veröffentlicht</h3>
                            <BulkActions events={published.filter(e => e.selected)} />
                        </div>
                        <div className={clsx('card__body')}>
                            <EventGrid events={published} columns={COLUMN_CONFIG} />
                        </div>
                    </div>
                </TabItem>
            )}
            {deleted.length > 0 && (
                <TabItem value='deleted' label='Gelöscht'>
                    <div className={clsx(styles.card, 'card')}>
                        <div className={clsx('card__header')}>
                            <h3>Gelöscht</h3>
                        </div>
                        <div className={clsx('card__body')}>
                            <EventGrid events={deleted}  columns={COLUMN_CONFIG}/>
                        </div>
                    </div>
                </TabItem>
            )}
            {jobStore.importJobs.length > 0 && (
                <TabItem value='import' label='Import'>
                    {jobStore.importJobs.map((job, idx) => {
                        const events = viewStore.allEvents({ jobId: job.id, orderBy: 'isValid-asc' });
                        return (
                            <LazyDetails
                                key={idx}
                                summary={
                                    <summary>
                                        {(job.user as User)?.email} - {job.filename || '|'} - {job.state} - {events.length}
                                    </summary>
                                }
                            >
                                <div>
                                    <Delete
                                        onClick={() => {
                                            jobStore.destroy(job);
                                        }}
                                        text="Job Löschen"
                                        flyoutSide='right'
                                        iconSide='right'
                                        apiState={jobStore.apiStateFor(`destroy-${job.id}`)}
                                    />
                                    <BulkActions events={events.filter(e => e.selected)} />
                                    <EventGrid events={events}  columns={COLUMN_CONFIG} />
                                </div>
                            </LazyDetails>
                        )
                    })}
                </TabItem>
            )}
        </Tabs>
    );
});

export default UsersEvents;
