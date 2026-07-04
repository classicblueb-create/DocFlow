import { ChevronLeft, ChevronRight, BarChartHorizontal, CalendarDays, Link2 } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, subWeeks, addMonths as addM, isBefore, isAfter } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface Task {
  id: string | number;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  assignee?: string;
  priority?: string;
  categoryId?: string | number;
  customer?: string;
}

interface ViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

interface GoogleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  htmlLink?: string;
  allDay?: boolean;
}

function getTaskColor(task: Task, today: string): string {
  const s = task.status || '';
  if (s === 'Done' || s.includes('เสร็จ')) return 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30';
  if (task.endDate && task.endDate < today && s !== 'Done' && !s.includes('เสร็จ')) return 'bg-rose-500/20 text-rose-800 border-rose-500/30';
  if (s === 'In Progress' || s.includes('กำลัง') || s === 'Waiting' || s.includes('รอ')) return 'bg-indigo-500/20 text-indigo-800 border-indigo-500/30';
  return 'bg-slate-500/20 text-slate-700 border-slate-400/30';
}

function getTaskBarColor(task: Task, today: string): string {
  const s = task.status || '';
  if (s === 'Done' || s.includes('เสร็จ')) return 'bg-emerald-500/40 border border-emerald-500/60 text-emerald-900';
  if (task.endDate && task.endDate < today && s !== 'Done' && !s.includes('เสร็จ')) return 'bg-rose-500/40 border border-rose-500/60 text-rose-900';
  if (s === 'In Progress' || s.includes('กำลัง') || s === 'Waiting' || s.includes('รอ')) return 'bg-indigo-500/40 border border-indigo-500/60 text-indigo-900';
  return 'bg-slate-400/40 border border-slate-400/60 text-slate-800';
}

export function CalendarView({ tasks, onTaskClick }: ViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [gcalEvents, setGcalEvents] = useState<GoogleEvent[]>([]);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(true);

  const fetchGcalEvents = () => {
    fetch('/api/google/events')
      .then(r => r.json())
      .then(data => {
        setGcalConnected(data.connected);
        setGcalEvents(data.events || []);
      })
      .catch(() => {})
      .finally(() => setGcalLoading(false));
  };

  useEffect(() => {
    fetchGcalEvents();
    const onMessage = (e: MessageEvent) => {
      if (e.data === 'gcal_connected') fetchGcalEvents();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const eventsOnDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return gcalEvents.filter(e => (e.start || '').startsWith(dateStr));
  };

  const tasksOnDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return tasks.filter(t => t.endDate === dateStr);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const MAX_CHIPS = 3;

  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-2 md:p-6 flex bg-transparent">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col h-full glass-card rounded-xl">
        <div className="p-3 md:p-4 border-b border-white/20 flex justify-between items-center bg-white/25 rounded-t-xl gap-3">
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={prevMonth} className="p-1 md:p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /></button>
            <h2 className="text-xs md:text-base font-bold text-slate-800">{format(currentDate, 'MMMM yyyy')}</h2>
            <button onClick={nextMonth} className="p-1 md:p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 md:w-5 md:h-5" /></button>
          </div>
          <div className="flex items-center gap-2">
            {!gcalLoading && !gcalConnected && (
              <button onClick={() => window.open('/api/google/auth', 'gcal_oauth', 'width=500,height=600,left=200,top=100')}
                className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-white/30 hover:bg-white/50 rounded-lg text-[9px] md:text-xs font-bold text-slate-700 border border-white/40 transition-colors cursor-pointer">
                <CalendarDays className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500" />
                <span className="hidden xs:inline">เชื่อม Google Calendar</span>
                <span className="xs:hidden">Google Cal</span>
              </button>
            )}
            {gcalConnected && (
              <span className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-green-500/20 rounded-lg text-[9px] md:text-xs font-bold text-green-700 border border-green-500/30">
                <CalendarDays className="w-3 md:w-3.5 h-3 md:h-3.5" />
                Google ✓
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col p-2 md:p-4 bg-transparent rounded-b-xl">
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-[10px] md:text-xs font-bold text-slate-400">
            <div className="text-rose-500"><span className="hidden sm:inline">Sun</span><span className="sm:hidden">S</span></div>
            <div><span className="hidden sm:inline">Mon</span><span className="sm:hidden">M</span></div>
            <div><span className="hidden sm:inline">Tue</span><span className="sm:hidden">T</span></div>
            <div><span className="hidden sm:inline">Wed</span><span className="sm:hidden">W</span></div>
            <div><span className="hidden sm:inline">Thu</span><span className="sm:hidden">T</span></div>
            <div><span className="hidden sm:inline">Fri</span><span className="sm:hidden">F</span></div>
            <div className="text-indigo-500"><span className="hidden sm:inline">Sat</span><span className="sm:hidden">S</span></div>
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1 overflow-y-auto auto-rows-[minmax(50px,1fr)] md:auto-rows-[minmax(80px,1fr)]">
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
              <div key={`pad-${i}`} className="border border-white/10 p-1 md:p-2 rounded-lg bg-white/5 min-h-[50px] md:min-h-[80px]"></div>
            ))}
            {daysInMonth.map((day, i) => {
              const dayTasks = tasksOnDay(day);
              const dayEvents = eventsOnDay(day);
              const allChips = [
                ...dayTasks.map(t => ({ type: 'task' as const, task: t, label: t.name, color: getTaskColor(t, todayStr) })),
                ...dayEvents.map(ev => ({ type: 'event' as const, ev, label: (ev.allDay ? '' : '') + ev.title, color: 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30' })),
              ];
              const shown = allChips.slice(0, MAX_CHIPS);
              const overflow = allChips.length - MAX_CHIPS;
              return (
                <div key={i} className={`border border-white/15 p-1 md:p-2 rounded-lg text-xs md:text-sm flex flex-col min-h-[50px] md:min-h-[80px] ${isToday(day) ? 'bg-indigo-500/15 border-indigo-500/30' : 'bg-white/20'}`}>
                  <span className={`font-bold text-[10px] md:text-xs ${isToday(day) ? 'text-indigo-700' : 'text-slate-600'}`}>{format(day, 'd')}</span>
                  <div className="mt-0.5 md:mt-1 space-y-0.5">
                    {shown.map((chip, idx) => {
                      if (chip.type === 'task') {
                        return (
                          <button key={idx} onClick={() => onTaskClick && onTaskClick(chip.task)}
                            className={cn('block w-full text-left text-[7px] md:text-[9px] px-0.5 py-0.5 md:px-1 rounded truncate border font-bold hover:opacity-80 transition-opacity cursor-pointer', chip.color)}>
                            {chip.label}
                          </button>
                        );
                      }
                      return (
                        <a key={idx} href={chip.ev.htmlLink || '#'} target="_blank" rel="noopener noreferrer"
                          className={cn('block text-[7px] md:text-[9px] px-0.5 py-0.5 md:px-1 rounded truncate border font-bold hover:opacity-80 transition-opacity', chip.color)}>
                          📅 {chip.label}
                        </a>
                      );
                    })}
                    {overflow > 0 && (
                      <div className="text-[7px] md:text-[9px] text-slate-500 font-bold px-0.5">+{overflow} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's meetings panel */}
          {gcalConnected && gcalEvents.filter(e => (e.start || '').startsWith(format(new Date(), 'yyyy-MM-dd'))).length > 0 && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />การประชุมวันนี้</p>
              <div className="space-y-1.5">
                {gcalEvents.filter(e => (e.start || '').startsWith(format(new Date(), 'yyyy-MM-dd'))).map(ev => (
                  <a key={ev.id} href={ev.htmlLink || '#'} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-emerald-800 hover:text-emerald-600 transition-colors">
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="font-semibold">{ev.allDay ? 'ทั้งวัน' : format(new Date(ev.start), 'HH:mm')}</span>
                    <span>{ev.title}</span>
                    {ev.location && <span className="text-emerald-500 text-[10px] truncate">• {ev.location}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GanttView({ tasks, onTaskClick }: ViewProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Time range: 3 months starting 6 weeks ago
  const rangeStart = subWeeks(today, 6);
  const rangeEnd = addM(rangeStart, 3);

  // Build list of days in range
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const totalDays = days.length;

  const DAY_PX = 32; // pixels per day
  const LABEL_W = 150; // px for task name column

  // Sort tasks: those with endDate asc, then those without at bottom
  const withDate = tasks.filter(t => t.startDate || t.endDate).sort((a, b) => {
    const da = a.endDate || a.startDate || '';
    const db = b.endDate || b.startDate || '';
    return da.localeCompare(db);
  });
  const withoutDate = tasks.filter(t => !t.startDate && !t.endDate);

  const sortedTasks = [...withDate, ...withoutDate];

  // Today offset
  const todayOffset = days.findIndex(d => format(d, 'yyyy-MM-dd') === todayStr);

  // Month labels for header
  const monthLabels: { label: string; startIdx: number; span: number }[] = [];
  let i = 0;
  while (i < days.length) {
    const m = format(days[i], 'yyyy-MM');
    let j = i;
    while (j < days.length && format(days[j], 'yyyy-MM') === m) j++;
    monthLabels.push({ label: format(days[i], 'MMM yyyy'), startIdx: i, span: j - i });
    i = j;
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current && todayOffset >= 0) {
      scrollRef.current.scrollLeft = Math.max(0, todayOffset * DAY_PX - 200);
    }
  }, [todayOffset]);

  const getBarStyle = (task: Task): { left: number; width: number } | null => {
    if (!task.startDate && !task.endDate) return null;
    const start = task.startDate ? new Date(task.startDate) : new Date(task.endDate!);
    const end = task.endDate ? new Date(task.endDate) : new Date(task.startDate!);
    const endStr = format(end, 'yyyy-MM-dd');

    // Clamp to range
    const clampedStart = isBefore(start, rangeStart) ? rangeStart : start;
    const clampedEnd = isAfter(end, rangeEnd) ? rangeEnd : end;

    if (isAfter(clampedStart, rangeEnd) || isBefore(clampedEnd, rangeStart)) return null;

    const startIdx = days.findIndex(d => format(d, 'yyyy-MM-dd') >= format(clampedStart, 'yyyy-MM-dd'));
    const endIdx = days.findIndex(d => format(d, 'yyyy-MM-dd') >= endStr);

    const left = (startIdx < 0 ? 0 : startIdx) * DAY_PX;
    const rightIdx = endIdx < 0 ? totalDays : endIdx + 1;
    const width = Math.max(DAY_PX, (rightIdx - (startIdx < 0 ? 0 : startIdx)) * DAY_PX - 2);

    return { left, width };
  };

  return (
    <div className="flex-1 flex-col overflow-hidden p-4 md:p-6 flex bg-transparent">
      <div className="max-w-[1400px] w-full mx-auto flex-1 flex flex-col glass-card rounded-xl overflow-hidden">
        {/* Header bar */}
        <div className="p-4 border-b border-white/20 flex items-center gap-2 bg-white/25 rounded-t-xl shrink-0">
          <BarChartHorizontal className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-800">Timeline (Gantt)</h2>
          <span className="ml-auto text-xs text-slate-500">{sortedTasks.length} งาน • 3 เดือน</span>
        </div>

        {/* Gantt body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Scrollable area */}
          <div className="flex-1 overflow-auto" ref={scrollRef}>
            <div style={{ width: LABEL_W + totalDays * DAY_PX }} className="min-h-full relative">
              {/* Sticky top header */}
              <div className="sticky top-0 z-20 flex bg-white/30 backdrop-blur-md border-b border-white/20">
                <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="shrink-0 border-r border-white/20 p-2 text-xs font-bold text-slate-600">ชื่องาน</div>
                <div className="flex relative">
                  {/* Month labels row */}
                  <div className="absolute top-0 left-0 right-0 flex h-5 border-b border-white/20">
                    {monthLabels.map((m, idx) => (
                      <div key={idx} style={{ width: m.span * DAY_PX }} className="shrink-0 text-[9px] font-bold text-slate-600 px-1 flex items-center border-r border-white/20 bg-white/10">
                        {m.label}
                      </div>
                    ))}
                  </div>
                  {/* Day numbers row */}
                  <div className="flex mt-5">
                    {days.map((d, idx) => {
                      const isT = format(d, 'yyyy-MM-dd') === todayStr;
                      return (
                        <div key={idx} style={{ width: DAY_PX, minWidth: DAY_PX }}
                          className={cn('text-center text-[8px] border-r border-white/10 py-0.5', isT ? 'font-bold text-indigo-700 bg-indigo-200/30' : 'text-slate-400')}>
                          {format(d, 'd')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Task rows */}
              <div className="relative">
                {/* Vertical grid lines */}
                <div className="absolute inset-0 flex pointer-events-none" style={{ marginLeft: LABEL_W }}>
                  {days.map((d, idx) => {
                    const isT = format(d, 'yyyy-MM-dd') === todayStr;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <div key={idx} style={{ width: DAY_PX, minWidth: DAY_PX }}
                        className={cn('h-full border-r border-white/10', isT ? 'bg-red-500/10' : isWeekend ? 'bg-slate-500/5' : '')} />
                    );
                  })}
                </div>

                {/* Today vertical line */}
                {todayOffset >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500/70 z-10 pointer-events-none"
                    style={{ left: LABEL_W + todayOffset * DAY_PX + DAY_PX / 2 }}
                  />
                )}

                {/* No-date tasks section */}
                {withoutDate.length > 0 && (
                  <div className="border-b border-white/20 bg-slate-500/5">
                    <div className="flex items-center py-1 px-2" style={{ marginLeft: 0 }}>
                      <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="shrink-0 text-[9px] font-bold text-slate-400 border-r border-white/10 pr-2">
                        ไม่มีวันที่
                      </div>
                      <div className="flex flex-wrap gap-1 px-2">
                        {withoutDate.map((task, idx) => (
                          <button key={idx} onClick={() => onTaskClick && onTaskClick(task)}
                            className={cn('text-[8px] px-1.5 py-0.5 rounded border font-semibold hover:opacity-80 cursor-pointer', getTaskBarColor(task, todayStr))}>
                            {task.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dated tasks */}
                {withDate.map((task, idx) => {
                  const barStyle = getBarStyle(task);
                  return (
                    <div key={task.id} className={cn('flex border-b border-white/10 hover:bg-white/10 transition-colors', idx % 2 === 0 ? 'bg-white/5' : 'bg-transparent')}>
                      <div style={{ width: LABEL_W, minWidth: LABEL_W }}
                        className="shrink-0 text-xs text-slate-700 border-r border-white/10 px-2 py-1.5 font-semibold truncate flex items-center">
                        <span className="truncate" title={task.name}>{task.name}</span>
                      </div>
                      <div className="relative flex-1 py-1" style={{ height: 36 }}>
                        {barStyle && (
                          <button
                            onClick={() => onTaskClick && onTaskClick(task)}
                            className={cn('absolute h-6 rounded shadow-sm opacity-90 hover:opacity-100 cursor-pointer flex items-center px-2 top-1', getTaskBarColor(task, todayStr))}
                            style={{ left: barStyle.left, width: barStyle.width }}
                            title={`${task.name}${task.startDate ? ' • ' + task.startDate : ''}${task.endDate ? ' → ' + task.endDate : ''}`}
                          >
                            <span className="text-[9px] font-bold truncate">{task.name}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
