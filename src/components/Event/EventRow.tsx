import SchoolEvent from '@site/src/models/SchoolEvent';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DescriptionCell from '../shared/DescriptionCell';
import DatePicker from 'react-date-picker';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import styles from './EventRow.module.scss';
import { action } from 'mobx';

interface RowProps {
    event: SchoolEvent;
    onChange: (event: any, eventId: string) => void;
    locked: boolean;
}

const EventRow = observer((props: RowProps) => {
    const { event } = props;
    return (
        <tr>
            <td>{event.kw}</td>
            <td>{event.weekday}</td>
            <DescriptionCell
                id={event.id}
                name="description"
                description={event.description}
                onChange={props.onChange}
                locked={props.locked}
            />
            <td style={{marginRight: '15px'}}>
                {event.isEditable ? (
                    <DateTimeRangePicker 
                        className={clsx(styles.datePicker)}
                        onChange={(e) => {
                            event.setDateRange(e[0], e[1]);
                            event.save()
                            console.log(e)
                        }}
                        disableClock={true}
                        showLeadingZeros={true}
                        format='dd.MM.yyyy HH:mm'
                        clearIcon={null}
                        data-testid="datePicker"
                        value={[event.localStart, event.localEnd]}
                        locale='gsw-u-sd-chzh' 
                    />
                ) : (
                    <span>{event.startDate}</span>
                )}
            </td>
            <td>{event.location}</td>
            <td>
                {event.departements.map((c, idx) => (
                    <span
                        key={idx}
                        className={clsx(
                            'badge',
                            'badge--primary',
                            styles.badge,
                            styles[c.toLowerCase()]
                        )}
                    >
                        {c}
                    </span>
                ))}
            </td>
            <td>
                {event.classes.map((c, idx) => (
                    <span
                        key={idx}
                        className={clsx(
                            'badge',
                            'badge--secondary'
                        )}
                    >
                        {c}
                    </span>
                ))}
            </td>
            <DescriptionCell
                id={event.id}
                name="descriptionLong"
                description={event.descriptionLong}
                onChange={props.onChange}
                locked={props.locked}
            />
        </tr>
    );
});

export default EventRow;