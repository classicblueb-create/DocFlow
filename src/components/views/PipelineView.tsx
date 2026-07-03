import React, { useState } from 'react';
import { Task, Client } from '../../types';
import { Plus, DollarSign, Calendar, User, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type PipelineStage = 'lead' | 'opportunity' | 'proposal' | 'negotiation' | 'won' | 'lost';

interface PipelineViewProps {
 tasks: Task[];
 clients: Client[];
 onTaskClick: (task: Task) => void;
 onUpdateTask: (task: Task) => void;
 onNewTask: (stage: PipelineStage) => void;
}

const STAGES: { id: PipelineStage; label: string; color: string; bg: string; border: string; dot: string }[] = [
 { id: 'lead', label: 'Lead', color: 'text-slate-600', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-400' },
 { id: 'opportunity', label: 'Opportunity', color: 'text-indigo-650', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
 { id: 'proposal', label: 'Proposal / Quote', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
 { id: 'negotiation', label: 'Negotiation', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
 { id: 'won', label: 'Closed Won', color: 'text-emerald-700', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
 { id: 'lost', label: 'Closed Lost', color: 'text-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-500' },
];

function fmtMoney(v?: number) {
 if (!v) return '–';
 return v >= 1e6 ? `฿${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v.toLocaleString()}`;
}

function PipelineCard({ task, clients, onClick }: { task: Task; clients: Client[]; onClick: () => void }) {
 const client = clients.find(c => c.id === task.clientId);
 const price = task.dealValue ?? task.price ?? 0;

 const lostReasonLine = task.details?.split('\n').find(l => l.startsWith('[ไม่ได้งานเนื่องจาก]:'));
 const lostReason = lostReasonLine ? lostReasonLine.replace('[ไม่ได้งานเนื่องจาก]:', '').trim() : '';

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

 {task.pipelineStage === 'lost' && lostReason && (
 <div className="mt-2.5 text-[11px] text-rose-700 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100/50 leading-relaxed font-semibold">
 😞 {lostReason}
 </div>
 )}

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
 const [lostTask, setLostTask] = useState<Task | null>(null);
 const [reasonInput, setReasonInput] = useState('');

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
 const cleanDetails = (task.details || '').replace(/\[ไม่ได้งานเนื่องจาก\]:\s*.*\n?/, '').trim();
 onUpdateTask({ ...task, pipelineStage: undefined, status: 'To Do', details: cleanDetails });
 } else if (targetStage === 'lost') {
 setLostTask(task);
 } else {
 const cleanDetails = (task.details || '').replace(/\[ไม่ได้งานเนื่องจาก\]:\s*.*\n?/, '').trim();
 onUpdateTask({ ...task, pipelineStage: targetStage, details: cleanDetails });
 }
 dragOverStage && setDragOverStage(null);
 };

 const forecastTotal = pipelineTasks
 .filter(t => t.pipelineStage !== 'lost')
 .reduce((s, t) => s + (t.dealValue ?? t.price ?? 0), 0);

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

 {/* ── Seller Home Summary ── */}
 <div className="shrink-0 px-6 py-4 border-b border-white/20">
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
     {/* Total Pipeline Donut */}
     {(() => {
       const stageColors: Record<string,string> = { lead:'#94a3b8', opportunity:'#818cf8', proposal:'#60a5fa', negotiation:'#fbbf24', won:'#34d399', lost:'#fb7185' };
       const donutData = STAGES.map(s => ({ name: s.label, value: Math.max(stageTotal(s.id), 0), color: stageColors[s.id] })).filter(d => d.value > 0);
       const hasData = donutData.length > 0;
       return (
         <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
           <div className="w-20 h-20 shrink-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={hasData ? donutData : [{ name:'ว่าง', value:1, color:'#e2e8f0' }]} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                   {(hasData ? donutData : [{ color:'#e2e8f0' }]).map((d,i) => <Cell key={i} fill={d.color} />)}
                 </Pie>
                 {hasData && <Tooltip formatter={(v:any) => fmtMoney(Number(v))} />}
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pipeline</p>
             <p className="text-lg font-black text-slate-800 leading-tight">{fmtMoney(forecastTotal)}</p>
             <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{pipelineTasks.filter(t => t.pipelineStage !== 'lost').length} active deals</p>
           </div>
         </div>
       );
     })()}

     {/* Closed Won */}
     {(() => {
       const wonDeals = pipelineTasks.filter(t => t.pipelineStage === 'won');
       const wonVal = wonDeals.reduce((s,t) => s + (t.dealValue ?? t.price ?? 0), 0);
       const lostDeals = pipelineTasks.filter(t => t.pipelineStage === 'lost').length;
       const total = wonDeals.length + lostDeals;
       const winRate = total > 0 ? Math.round((wonDeals.length / total) * 100) : 0;
       const winData = [{ value: winRate, color: '#34d399' }, { value: 100 - winRate, color: '#e2e8f0' }];
       return (
         <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
           <div className="w-20 h-20 shrink-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={winData} cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                   {winData.map((d,i) => <Cell key={i} fill={d.color} />)}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Closed Won</p>
             <p className="text-lg font-black text-emerald-600 leading-tight">{fmtMoney(wonVal)}</p>
             <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Win Rate {winRate}% · {wonDeals.length} ดีล</p>
           </div>
         </div>
       );
     })()}

     {/* Stage breakdown */}
     {(() => {
       const active = STAGES.filter(s => s.id !== 'won' && s.id !== 'lost');
       return (
         <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Stage Breakdown</p>
           <div className="flex flex-col gap-1">
             {active.map(s => {
               const count = pipelineTasks.filter(t => t.pipelineStage === s.id).length;
               const maxCount = Math.max(...active.map(a => pipelineTasks.filter(t => t.pipelineStage === a.id).length), 1);
               return (
                 <div key={s.id} className="flex items-center gap-2">
                   <span className="text-[9px] text-slate-400 font-semibold w-16 shrink-0">{s.label.split(' ')[0]}</span>
                   <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                     <div className={cn('h-1.5 rounded-full', s.dot)} style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: undefined }} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-500 w-4 text-right">{count}</span>
                 </div>
               );
             })}
           </div>
         </div>
       );
     })()}

     {/* Recent Won */}
     {(() => {
       const recentWon = [...pipelineTasks.filter(t => t.pipelineStage === 'won')].reverse().slice(0, 3);
       return (
         <div className="glass-card rounded-2xl p-4 flex flex-col">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Won 🏆</p>
           {recentWon.length === 0 ? (
             <p className="text-xs text-slate-300 font-semibold flex-1 flex items-center">ยังไม่มีดีลที่ปิดได้</p>
           ) : (
             <div className="flex flex-col gap-1.5">
               {recentWon.map(t => (
                 <div key={t.id} className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                   <span className="text-xs font-semibold text-slate-700 truncate flex-1">{t.name}</span>
                   <span className="text-[10px] font-bold text-emerald-600 shrink-0">{fmtMoney(t.dealValue ?? t.price ?? 0)}</span>
                 </div>
               ))}
             </div>
           )}
         </div>
       );
     })()}
   </div>
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

 {lostTask && (
 <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
 <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-4 border border-slate-100/50">
 <div>
 <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
 <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
 ระบุเหตุผลที่ไม่ได้งาน
 </h3>
 <p className="text-xs text-slate-400 font-bold mt-1.5 leading-relaxed">
 ดีล: <span className="text-slate-600 font-extrabold">{lostTask.name}</span>
 </p>
 </div>

 <div className="flex flex-wrap gap-1.5 my-1">
 {['ราคาแพงเกินไป', 'ลูกค้าเงียบหาย', 'คู่แข่งชนะดีล', 'ข้อเสนอไม่ตรงเป้า', 'งบประมาณไม่พอ', 'เลื่อนการลงทุน'].map(opt => (
 <button
 key={opt}
 type="button"
 onClick={() => setReasonInput(opt)}
 className="text-[10px] font-black px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 hover:border-rose-200 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
 >
 {opt}
 </button>
 ))}
 </div>

 <textarea
 value={reasonInput}
 onChange={e => setReasonInput(e.target.value)}
 placeholder="พิมพ์รายละเอียดหรือเหตุผลเพิ่มเติม..."
 rows={3}
 className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50 text-slate-800 text-xs resize-none"
 />

 <div className="flex justify-end gap-2 mt-2">
 <button
 onClick={() => {
 setLostTask(null);
 setReasonInput('');
 }}
 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors rounded-xl font-bold text-xs cursor-pointer"
 >
 ยกเลิก
 </button>
 <button
 onClick={() => {
 if (lostTask) {
 const cleanDetails = (lostTask.details || '').replace(/\[ไม่ได้งานเนื่องจาก\]:\s*.*\n?/, '').trim();
 const newDetails = reasonInput.trim() 
 ? `[ไม่ได้งานเนื่องจาก]: ${reasonInput.trim()}\n${cleanDetails}`.trim()
 : cleanDetails;
 
 onUpdateTask({
 ...lostTask,
 pipelineStage: 'lost',
 details: newDetails
 });
 }
 setLostTask(null);
 setReasonInput('');
 }}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white transition-colors rounded-xl font-bold text-xs cursor-pointer shadow-sm"
 >
 บันทึกเหตุผล
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
}
