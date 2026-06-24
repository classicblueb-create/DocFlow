import { ChevronLeft, ChevronRight, BarChartHorizontal } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useState } from 'react';
import { cn } from '../../lib/utils';

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
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-transparent">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col h-full glass-card rounded-xl">
        <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/25 rounded-t-xl">
          <button onClick={prevMonth} className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-base font-bold text-slate-800">{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex flex-col p-4 bg-transparent rounded-b-xl">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
            <div className="text-rose-500">Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-indigo-500">Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto auto-rows-[minmax(80px,1fr)]">
            {/* simple padding for start of month */}
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="border border-white/10 p-2 rounded-lg bg-white/5 min-h-[80px]"></div>
            ))}
            {daysInMonth.map((day, i) => (
              <div key={i} className={`border border-white/15 p-2 rounded-lg text-sm flex flex-col min-h-[80px] ${isToday(day) ? 'bg-indigo-500/15 border-indigo-500/30' : 'bg-white/20'}`}>
                <span className={`font-bold ${isToday(day) ? 'text-indigo-700' : 'text-slate-600'}`}>{format(day, 'd')}</span>
                {/* Tasks for the day */}
                <div className="mt-1 space-y-1">
                    {tasks.filter(t => t.endDate === format(day, 'yyyy-MM-dd')).map((task, idx) => (
                        <div key={idx} className="text-[9px] bg-red-500/15 text-red-700 px-1 py-0.5 rounded truncate border border-red-500/20 font-bold">
                             {task.name}
                        </div>
                    ))}
                    {tasks.filter(t => t.startDate === format(day, 'yyyy-MM-dd')).map((task, idx) => (
                        <div key={idx} className="text-[9px] bg-indigo-500/15 text-indigo-700 px-1 py-0.5 rounded truncate border border-indigo-500/20 font-bold">
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const days = Array.from({length: 30}, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(i + 1);
    return d;
  });
  const colors = [
    'bg-emerald-500/30 border border-emerald-500/40 text-emerald-800',
    'bg-indigo-500/30 border border-indigo-500/40 text-indigo-800',
    'bg-purple-500/30 border border-purple-500/40 text-purple-800',
    'bg-amber-500/30 border border-amber-500/40 text-amber-800',
    'bg-blue-500/30 border border-blue-500/40 text-blue-800',
    'bg-rose-500/30 border border-rose-500/40 text-rose-800'
  ];
  
  const filteredTasks = tasks.filter(t => {
    const isCompleted = t.status === 'Done' || t.status === 'เสร็จสิ้น';
    const isInProgress = t.status === 'In Progress' || t.status === 'กำลังดำเนินการ' || t.status === 'กำลังทำ' || t.status === 'Waiting' || t.status === 'รอข้อมูล';
    const isNotStarted = t.status === 'To Do' || t.status === 'รอดำเนินการ' || !t.status;
    
    if (statusFilter === 'completed') return isCompleted;
    if (statusFilter === 'in_progress') return isInProgress;
    if (statusFilter === 'not_started') return isNotStarted;
    return true;
  });

  const displayTasks = filteredTasks.map((t, i) => {
      // Calculate start day relative to today or current month start
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
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-transparent">
      <div className="max-w-[1400px] w-full mx-auto flex-1 flex flex-col glass-card rounded-xl">
        <div className="p-4 border-b border-white/20 flex flex-wrap gap-4 items-center justify-between bg-white/25 rounded-t-xl">
          <div className="flex items-center gap-2">
            <BarChartHorizontal className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-800">Timeline (Gantt)</h2>
          </div>
          
          <div className="flex flex-wrap gap-1 p-0.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
             {(['all', 'completed', 'in_progress', 'not_started'] as const).map(f => (
               <button
                 key={f}
                 onClick={() => setStatusFilter(f)}
                 className={cn(
                   "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                   statusFilter === f 
                     ? "bg-white/70 text-slate-800 shadow-sm" 
                     : "text-slate-500 hover:text-slate-850 hover:bg-white/5"
                 )}
               >
                 {f === 'all' && 'ทั้งหมด'}
                 {f === 'completed' && 'เสร็จสิ้น'}
                 {f === 'in_progress' && 'กำลังทำ'}
                 {f === 'not_started' && 'ยังไม่เริ่ม'}
               </button>
             ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-transparent rounded-b-xl relative">
          <div className="flex border-b border-white/20 bg-white/15 sticky top-0 z-10 w-max min-w-full">
            <div className="p-3 border-r border-white/15 w-[200px] md:w-[250px] shrink-0 font-bold text-xs text-slate-655">ชื่องาน</div>
            <div className="flex">
                {days.map((d, i) => (
                    <div key={i} className="w-12 md:w-16 p-2 text-center text-xs font-medium text-slate-500 border-r border-white/15 last:border-r-0">
                        <div className="font-bold text-slate-700">{d.getDate()}</div>
                        <div className="text-[10px] text-slate-400">{d.toLocaleString('th-TH', { month: 'short' })}</div>
                    </div>
                ))}
            </div>
          </div>
          <div className="w-max min-w-full relative">
             {/* Grid lines background */}
             <div className="absolute inset-0 flex ml-[200px] md:ml-[250px] pointer-events-none">
                 {days.map((_, i) => (
                     <div key={i} className="w-12 md:w-16 border-r border-white/10 last:border-r-0 h-full"></div>
                 ))}
              </div>
             {/* Rows */}
             {displayTasks.map((task, i) => (
                 <div key={i} className="flex border-b border-white/10 hover:bg-white/10 transition-colors relative z-10">
                     <div className="p-3 w-[200px] md:w-[250px] shrink-0 text-xs text-slate-700 border-r border-white/10 font-semibold">{task.title}</div>
                     <div className="relative flex-1 py-1 bg-white/5">
                        <div 
                          className={cn("h-7 rounded-md shadow-sm opacity-90 hover:opacity-100 cursor-pointer mt-1 flex items-center px-2.5", task.color)}
                          style={{
                              marginLeft: `calc(${(task.start - 1)} * var(--w-day))`,
                              width: `calc(${task.duration} * var(--w-day) - 4px)`,
                          }}
                        >
                            <span className="text-[10px] font-bold truncate block">{task.title}</span>
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
