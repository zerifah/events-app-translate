import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/hooks';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import Event from '../models/Event';

moment.locale('de-CH');
import "react-big-calendar/lib/css/react-big-calendar.css";
import Layout from '@theme/Layout';
import { translate } from '@docusaurus/Translate';
const localizer = momentLocalizer(moment)

const Calendar = observer(() => {
    const viewStore = useStore('viewStore');
    const eventStore = useStore('eventStore');
    const tasks = (viewStore.semester?.events || []).map((e, idx) => {
        return {
            start: e.start,
            end: e.end,
            title: e.description,
            description: e.descriptionLong,
            id: e.id
        }
    });
    const { defaultDate } = React.useMemo(
        () => ({
          defaultDate: moment().toDate(),
        }),
        []
      )
    const eventStyleGetter = (event, start, end, isSelected) => {
        const e = eventStore.find<Event>(event.id);
        if (!e) {
            return {};
        }
        if (e.departmentNames.length === 1) {
            return {
                style: {
                    backgroundColor: e.affectedDepartments.length === 1 ? e.affectedDepartments[0].color : undefined,
                }
            }
        }
        return {}
    };
    return (
        <Layout>
            <div>
                {tasks.length > 0 && (
                    <BigCalendar
                        defaultDate={defaultDate}
                        localizer={localizer}
                        events={tasks}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '95vh' }}
                        onSelectEvent={(record) => {
                            viewStore.setEventModalId(record.id)
                        }}
                        eventPropGetter={eventStyleGetter}
                        popup
                        messages={{
                            next: translate({message : "Nächste", id:'calendar.button.nextWeek' , description:'button to show the next week on the calendar'}),
                            previous: translate({message : "Vorherige", id:'calendar.button.previousWeek' , description:'button to show the previous week on the calendar'}),
                            today: translate({message : "Heute", id:'calendar.button.today' , description:'button to show today on the calendar'}),
                            month: translate({message : "Monat", id:'calendar.button.month' , description:'button to show the calendar by month'}),
                            week: translate({message : "Woche", id:'calendar.button.week' , description:'button to show the calendar by week'}),
                            day: translate({message : "Tag", id:'calendar.button.day' , description:'button to show the calendar by day'}),
                            agenda: translate({message : "Agenda", id:'calendar.button.agenda' , description:'button to show the calendar as list'}),
                            date: translate({message : "Datum", id:'calendar.field.date' , description:'title of the table for the date'}),
                            time: translate({message : "Zeit", id:'calendar.field.time' , description:'title of the table for the time'}),
                            event: translate({message : "Event", id:'calendar.field.event' , description:'title of the table for the event'}),
                            noEventsInRange: translate({message : "Keine Events in diesem Zeitraum", id:'calendar.message.noevent' , description:'message if no event in time range'}),
                            tomorrow: translate({message : "Morgen", id:'calendar.tomorrow' , description:''}),
                            work_week: translate({message : "Arbeitswoche", id:'calendar.workWeek' , description:''}),
                            yesterday: translate({message : "Gestern", id:'calendar.yesterday' , description:''}),
                            allDay: translate({message : "Ganzer Tag", id:'calendar.allDay' , description:''}),
                            showMore: total => translate({message : `+${total} weitere`, id:'calendar.plus' , description:'show more'})
                        }}
                    />
                )}
            </div>
        </Layout>
    )
});

export default Calendar;