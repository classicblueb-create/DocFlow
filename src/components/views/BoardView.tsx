import React from 'react';
import { Task } from '../../types';
import { cn } from '../../lib/utils';

interface BoardViewProps {
  tasks: Task[];
  onTaskDrop: (taskId: string, targetStatus: string) => void;
  onTaskClick: (task: Task) => void;
}

const COLUMNS = [
  { id: 'To Do',       label: 'To Do',      dot: 'bg-slate-400' },
  { id: 'In Progress', label: 'In Progress', dot: 'bg-indigo-400' },
  { id: 'Waiting',     label: 'รอข้อมูล',    dot: 'bg-amber-400' },
  { id: 'Done',        label: 'เสร็จสิ้น',    dot: 'bg-emerald-400' },
];

function deadlineStyle(task: Task): React.CSSProperties {
  if (!task.endDate) return { background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.45)' };
  const today = new Date().toISOString().split('T')[0];
  const daysLeft = Math.round((new Date(task.endDate).getTime() - new Date(today).getTime()) / 86400000);
  if (task.endDate < today) return { background: 'rgba(254, 242, 242, 0.45)', border: '1px solid rgba(239, 68, 68, 0.25)' };
  if (daysLeft <= 2)        return { background: 'rgba(255, 247, 237, 0.45)', border: '1px solid rgba(249, 115, 22, 0.25)' };
  if (daysLeft <= 7)        return { background: 'rgba(240, 253, 250, 0.45)', border: '1px solid rgba(13, 148, 136, 0.25)' };
  return { background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.45)' };
}

function AssigneeBadge({ assignee }: { assignee?: 'Fan' | 'Mod' }) {
  if (!assignee) return null;
  return (
    <span className={cn(
      'text-[9px] font-black px-1.5 py-0.5 rounded-full border shrink-0',
      assignee === 'Fan'
        ? 'bg-violet-500/10 text-violet-750 border-violet-500/20'
        : 'bg-emerald-500/10 text-emerald-750 border-emerald-500/20'
    )}>
      {assignee}
    </span>
  );
}

export function BoardView({ tasks, onTaskDrop, onTaskClick }: BoardViewProps) {
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    onTaskDrop(id, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar p-4 md:p-6 flex">
      <div className="flex gap-4 h-full items-start w-max min-w-full">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => {
            if (col.id === 'To Do') return t.status === 'To Do' || t.status === 'รอดำเนินการ' || !t.status;
            if (col.id === 'Done') return t.status === 'Done' || t.status === 'เสร็จสิ้น';
            return t.status === col.id;
          });

          return (
            <div
              key={col.id}
              className="rounded-2xl w-72 flex flex-col max-h-full"
              style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}
              onDrop={e => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              <div className="p-3.5 flex justify-between items-center rounded-t-2xl shrink-0 border-b border-white/20">
                <h2 className="font-bold text-xs text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <span className={cn('w-2 h-2 rounded-full', col.dot)} />
                  {col.label}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/60 text-slate-600 border border-white/40">
                  {colTasks.length}
                </span>
              </div>

              <div className="p-3 overflow-y-auto hide-scrollbar flex-1 flex flex-col gap-2.5 kanban-column">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => handleDragStart(e, task.id.toString())}
                    onClick={() => onTaskClick(task)}
                    className="rounded-xl p-3.5 shadow-sm cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
                    style={{ ...deadlineStyle(task), backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        {task.priority && (
                          <span className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase self-start',
                            task.priority.includes('ด่วน') || task.priority.includes('Urgent')
                              ? 'bg-red-100 text-red-600'
                              : task.priority.includes('สูง') || task.priority.includes('High')
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-slate-100 text-slate-500'
                          )}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <AssigneeBadge assignee={task.assignee} />
                        {task.price ? (
                          <span className="text-[10px] font-bold text-emerald-700">฿{Number(task.price).toLocaleString()}</span>
                        ) : null}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 leading-snug mb-1">{task.name}</h3>
                    {task.customer && (
                      <p className="text-[10px] text-slate-400 font-medium truncate">{task.customer}</p>
                    )}
                    {task.endDate && (
                      <p className={cn(
                        'text-[10px] font-semibold mt-1.5',
                        task.endDate < new Date().toISOString().split('T')[0] ? 'text-rose-600' : 'text-slate-400'
                      )}>
                        {task.endDate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
