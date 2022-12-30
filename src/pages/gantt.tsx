import React from 'react';
import clsx from 'clsx';
import { Gantt, Task, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/hooks';

const GanttView = observer(() => {
    const eventStore = useStore('eventStore');
    const tasks: Task[] = eventStore.events.map((e, idx) => {
        return {
          start: e.localStart,
          end: e.localEnd,
          name: e.description,
          id: e.id || `id-${idx}`,
          type: 'task',
          progress: e.progress,
          isDisabled: true,
          styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
        }
    });
    return (
        <div>
            {tasks.length > 0 && (
                <Gantt 
                    tasks={tasks} 
                    viewMode={ViewMode.Day} 
                    listCellWidth={''} 
                    ganttHeight={800} 
                    viewDate={new Date()}
                    rowHeight={20} 
                    locale="gsw"
                />
            )}
        </div>
    )
});

export default GanttView;