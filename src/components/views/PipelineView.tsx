import React, { useState } from 'react';
import { Task, Client } from '../../types';
import { Plus, DollarSign, Calendar, User, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type PipelineStage = 'lead' | 'proposal' | 'approve' | 'won';

interface PipelineViewProps {
 tasks: Task[];
 clients: Client[];
 onTaskClick: (task: Task) => void;
 onUpdateTask: (task: Task) => void;
 onNewTask: (stage: PipelineStage) => void;
}

const STAGES: { id: PipelineStage; label: string; color: string; bg: string; border: string; dot: string }[] = [
 { id: 'lead', label: 'Lead', color: 'text-slate-650', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-400' },
 { id: 'proposal', label: 'เสนอราคา', color: 'text-blue-755', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
 { id: 'approve', label: 'รอ Approve', color: 'text-amber-755', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
 { id: 'won', label: 'ได้งาน ', color: 'text-emerald-755', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
];

function fmtMoney(v?: number) {
 if (!v) return '–';
 return v >= 1e6 ? `฿${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v.toLocaleString()}`;
}

function PipelineCard({ task, clients, onClick }: { task: Task; clients: Client[]; onClick: () => void }) {
 const client = clients.find(c => c.id === task.clientId);
 const price = task.dealValue ?? task.price ?? 0;

 return (
 <div
 onClick={onClick}
 draggable
 onDragStart={e => e.dataTransfer.setData('taskId', task.id.toString())}
 className="glass-card rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
 >
 <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2 mb-2">{task.name}</p>

 <div className="flex flex-col gap-1.5">
 {(task.customer || client) && (
 <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
 <User className="w-3 h-3 shrink-0" />
 <span className="truncate">{task.customer || client?.name}</span>
 </div>
 )}
 {price > 0 && (
 <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
 <DollarSign className="w-3 h-3 shrink-0" />
 {fmtMoney(price)}
 </div>
 )}
 {task.endDate && (
 <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
 <Calendar className="w-3 h-3 shrink-0" />
 {task.endDate}
 </div>
 )}
 </div>

 {task.tags && (
 <div className="flex flex-wrap gap-1 mt-2">
 {task.tags.split(',').slice(0, 3).map(tag => (
 <span key={tag} className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md">
 {tag.trim()}
 </span>
 ))}
 </div>
 )}
 </div>
 );
}

export function PipelineView({ tasks, clients, onTaskClick, onUpdateTask, onNewTask }: PipelineViewProps) {
 const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

 const pipelineTasks = tasks.filter(t => t.pipelineStage);

 const stageTotal = (stage: PipelineStage) =>
 pipelineTasks.filter(t => t.pipelineStage === stage).reduce((s, t) => s + (t.dealValue ?? t.price ?? 0), 0);

 const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
 e.preventDefault();
 const taskId = e.dataTransfer.getData('taskId');
 const task = tasks.find(t => t.id.toString() === taskId);
 if (!task) return;

 if (targetStage === 'won') {
 // Move to board: remove pipelineStage, set status = 'To Do'
 onUpdateTask({ ...task, pipelineStage: undefined, status: 'To Do' });
 } else {
 onUpdateTask({ ...task, pipelineStage: targetStage });
 }
 setDragOverStage(null);
 };

 const forecastTotal = pipelineTasks.reduce((s, t) => s + (t.dealValue ?? t.price ?? 0), 0);

 return (
 <div className="flex flex-col h-full overflow-hidden">
 {/* Header */}
 <div className="shrink-0 px-6 py-4 border-b border-white/20 flex items-center justify-between">
 <div>
 <h2 className="text-base font-black text-slate-800">Sales Pipeline</h2>
 <p className="text-xs text-slate-450 font-medium mt-0.5">
 {pipelineTasks.length} deals · Forecast: <span className="font-bold text-emerald-600">{fmtMoney(forecastTotal)}</span>
 </p>
 </div>
 <button
 onClick={() => onNewTask('lead')}
 className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
 >
 <Plus className="w-4 h-4" /> เพิ่ม Lead
 </button>
 </div>

 {/* Conversion path indicator */}
 <div className="shrink-0 px-6 py-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
 {STAGES.map((s, i) => (
 <React.Fragment key={s.id}>
 <span className={cn('flex items-center gap-1', s.color)}>
 <span className={cn('w-2 h-2 rounded-full', s.dot)} />
 {s.label}
 <span className="text-slate-300 font-normal">({pipelineTasks.filter(t => t.pipelineStage === s.id).length})</span>
 </span>
 {i < STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
 </React.Fragment>
 ))}
 </div>

 {/* Kanban columns */}
 <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
 <div className="flex gap-4 h-full min-w-max">
 {STAGES.map(stage => {
 const stageTasks = pipelineTasks.filter(t => t.pipelineStage === stage.id);
 const isDragOver = dragOverStage === stage.id;

 return (
 <div
 key={stage.id}
 onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
 onDragLeave={() => setDragOverStage(null)}
 onDrop={e => handleDrop(e, stage.id)}
 className={cn(
 'flex flex-col w-72 h-full rounded-2xl border transition-all',
 isDragOver ? 'bg-white/30 border-indigo-400/30 shadow-lg scale-[1.01]' : 'glass-panel border-white/20'
 )}
 >
 {/* Column header */}
 <div className={cn('shrink-0 px-4 py-3 rounded-t-2xl', stage.bg)}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className={cn('w-2.5 h-2.5 rounded-full', stage.dot)} />
 <span className={cn('text-sm font-black', stage.color)}>{stage.label}</span>
 <span className="text-[11px] font-bold text-slate-400 bg-white/80 px-1.5 py-0.5 rounded-full">
 {stageTasks.length}
 </span>
 </div>
 {stageTotal(stage.id) > 0 && (
 <span className="text-[11px] font-bold text-emerald-600">{fmtMoney(stageTotal(stage.id))}</span>
 )}
 </div>
 </div>

 {/* Cards */}
 <div className="flex-1 overflow-y-auto p-3 space-y-2">
 {stageTasks.length === 0 && (
 <div className={cn(
 'flex items-center justify-center h-20 rounded-xl border-2 border-dashed text-[11px] font-semibold text-slate-300 transition-all',
 isDragOver ? 'border-current scale-105' : 'border-slate-200'
 )}>
 วางการ์ดที่นี่
 </div>
 )}
 {stageTasks.map(task => (
 <PipelineCard
 key={task.id}
 task={task}
 clients={clients}
 onClick={() => onTaskClick(task)}
 />
 ))}
 </div>

 {/* Add button in column */}
 <div className="shrink-0 p-3 pt-0">
 <button
 onClick={() => onNewTask(stage.id)}
 className="w-full flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" /> เพิ่มใน{stage.label}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
}
