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
                            next: "Nächste",
                            previous: "Vorherige",
                            today: "Heute",
                            month: "Monat",
                            week: "Woche",
                            day: "Tag",
                            agenda: "Agenda",
                            date: "Datum",
                            time: "Zeit",
                            event: "Event",
                            noEventsInRange: "Keine Events in diesem Zeitraum",
                            tomorrow: "Morgen",
                            work_week: "Arbeitswoche",
                            yesterday: "Gestern",
                            allDay: "Ganzer Tag",
                            showMore: total => `+${total} weitere`
                        }}
                    />
                )}
            </div>
        </Layout>
    )
});

export default Calendar;