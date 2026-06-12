import { ChevronLeft, ChevronRight, BarChartHorizontal } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useState } from 'react';

interface ViewProps {
  tasks: any[];
}

export function CalendarView({ tasks }: ViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded transition"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold text-gray-800">{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded transition"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex flex-col p-4 bg-white rounded-b-xl">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-500">
            <div className="text-red-500">Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-indigo-500">Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto auto-rows-[minmax(80px,1fr)]">
            {/* simple padding for start of month */}
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="border p-2 rounded-lg bg-gray-50 min-h-[80px]"></div>
            ))}
            {daysInMonth.map((day, i) => (
              <div key={i} className={`border p-2 rounded-lg text-sm flex flex-col min-h-[80px] ${isToday(day) ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                <span className={`font-bold ${isToday(day) ? 'text-indigo-600' : 'text-gray-700'}`}>{format(day, 'd')}</span>
                {/* Tasks for the day */}
                <div className="mt-1 space-y-1">
                    {tasks.filter(t => t.endDate === format(day, 'yyyy-MM-dd')).map((task, idx) => (
                        <div key={idx} className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded truncate border border-red-200">
                             {task.name}
                        </div>
                    ))}
                    {tasks.filter(t => t.startDate === format(day, 'yyyy-MM-dd')).map((task, idx) => (
                        <div key={idx} className="text-[10px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded truncate border border-indigo-200">
                             Starts: {task.name}
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GanttView({ tasks }: ViewProps) {
  const days = Array.from({length: 30}, (_, i) => i + 1);
  const colors = ['bg-emerald-400', 'bg-indigo-400', 'bg-clickup-purple', 'bg-amber-400', 'bg-blue-400', 'bg-rose-400'];
  
  const displayTasks = tasks.map((t, i) => {
      // Calculate start day relative to today or current month start
      // For simplicity, let's just pick a random start/duration if not set, or parse dates
      let start = (i % 10) + 1;
      let duration = 3;
      
      if (t.startDate) {
          const startD = new Date(t.startDate);
          start = startD.getDate();
      }
      if (t.endDate && t.startDate) {
          const startD = new Date(t.startDate);
          const endD = new Date(t.endDate);
          duration = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)));
      }

      return {
          title: t.name,
          start,
          duration,
          color: colors[i % colors.length]
      };
  });

  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50">
      <div className="max-w-[1400px] w-full mx-auto flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50 rounded-t-xl">
          <BarChartHorizontal className="w-5 h-5 text-clickup-purple" />
          <h2 className="text-lg font-bold text-gray-800">Timeline (Gantt)</h2>
        </div>
        <div className="flex-1 overflow-auto bg-white rounded-b-xl relative">
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10 w-max min-w-full">
            <div className="p-3 border-r border-gray-200 w-[200px] md:w-[250px] shrink-0 font-bold text-sm text-gray-600">ชื่องาน</div>
            <div className="flex">
                {days.map(d => (
                    <div key={d} className="w-12 md:w-16 p-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
                        Day {d}
                    </div>
                ))}
            </div>
          </div>
          <div className="w-max min-w-full relative">
             {/* Grid lines background */}
             <div className="absolute inset-0 flex ml-[200px] md:ml-[250px] pointer-events-none">
                 {days.map(d => (
                     <div key={d} className="w-12 md:w-16 border-r border-gray-100 last:border-r-0 h-full"></div>
                 ))}
             </div>
             {/* Rows */}
             {displayTasks.map((task, i) => (
                 <div key={i} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors relative z-10">
                     <div className="p-3 w-[200px] md:w-[250px] shrink-0 text-sm text-gray-800 border-r border-gray-100">{task.title}</div>
                     <div className="relative flex-1 py-1 bg-gray-50/20">
                        <div 
                          className={`h-7 rounded-md shadow-sm opacity-90 hover:opacity-100 cursor-pointer ${task.color} mt-1`}
                          style={{
                              marginLeft: `calc(${(task.start - 1)} * var(--w-day))`,
                              width: `calc(${task.duration} * var(--w-day) - 4px)`,
                          }}
                        >
                            <span className="text-[10px] text-white font-bold px-2 truncate leading-7 block">{task.title}</span>
                        </div>
                     </div>
                 </div>
             ))}
          </div>
          <style>{`
            :root {
                --w-day: 48px;
            }
            @media (min-width: 768px) {
                :root { --w-day: 64px; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
