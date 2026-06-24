import React, { useState } from 'react';
import { Task, Client } from '../../types';
import { cn, parseSubtasks } from '../../lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Circle, CircleDot, CircleCheck, AlertCircle, Bot } from 'lucide-react';

interface ListViewProps {
 tasks: Task[];
 clients: Client[];
 onTaskClick: (task: Task) => void;
 onStatusChange: (taskId: string, newStatus: string) => void;
 onConsultAgent?: (taskId: string) => void;
}

type SortKey = 'name' | 'status' | 'priority' | 'customer' | 'price' | 'endDate';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = {
 'ด่วน (Urgent)': 0,
 'สูง (High)': 1,
 'ปานกลาง (Medium)': 2,
 'ต่ำ (Low)': 3,
};

const STATUS_CYCLE: Record<string, string> = {
 'To Do': 'In Progress',
 'In Progress': 'Done',
 'Done': 'To Do',
 'รอดำเนินการ': 'In Progress',
 'กำลังดำเนินการ': 'Done',
 'กำลังทำ': 'Done',
 'เสร็จสิ้น': 'To Do',
};

function StatusIcon({ status }: { status: string }) {
 if (status === 'Done' || status === 'เสร็จสิ้น')
 return <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />;
 if (status === 'In Progress' || status === 'กำลังดำเนินการ' || status === 'กำลังทำ')
 return <CircleDot className="w-4 h-4 text-indigo-600 shrink-0" />;
 return <Circle className="w-4 h-4 text-slate-400 shrink-0" />;
}

function PriorityBadge({ priority }: { priority?: string }) {
 if (!priority) return <span className="text-xs text-slate-300">—</span>;
 const isUrgent = priority.includes('ด่วน') || priority.includes('Urgent');
 const isHigh = priority.includes('สูง') || priority.includes('High');
 const isLow = priority.includes('ต่ำ') || priority.includes('Low');
 return (
 <span className={cn(
 'text-[10px] font-bold px-1.5 py-0.5 rounded border',
 isUrgent ? 'bg-red-50 text-red-700 border-red-100' :
 isHigh ? 'bg-orange-50 text-orange-700 border-orange-100' :
 isLow ? 'bg-blue-50 text-blue-700 border-blue-100' :
 'bg-slate-100 text-slate-600 border-slate-200'
 )}>
 {priority.split(' ')[0]}
 </span>
 );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
 if (!active) return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
 return dir === 'asc'
 ? <ChevronUp className="w-3 h-3 text-indigo-600" />
 : <ChevronDown className="w-3 h-3 text-indigo-600" />;
}

export function ListView({ tasks, clients, onTaskClick, onStatusChange, onConsultAgent }: ListViewProps) {
 const [sortKey, setSortKey] = useState<SortKey>('endDate');
 const [sortDir, setSortDir] = useState<SortDir>('asc');
 const [groupByStatus, setGroupByStatus] = useState(true);

 const today = new Date().toISOString().split('T')[0];

 const handleSort = (key: SortKey) => {
 if (sortKey === key) {
 setSortDir(d => d === 'asc' ? 'desc' : 'asc');
 } else {
 setSortKey(key);
 setSortDir('asc');
 }
 };

 const sortTasks = (list: Task[]) => [...list].sort((a, b) => {
 let va: string | number = '';
 let vb: string | number = '';

 if (sortKey === 'name') { va = a.name; vb = b.name; }
 else if (sortKey === 'status') { va = a.status; vb = b.status; }
 else if (sortKey === 'priority') {
 va = PRIORITY_ORDER[a.priority ?? ''] ?? 99;
 vb = PRIORITY_ORDER[b.priority ?? ''] ?? 99;
 }
 else if (sortKey === 'customer') { va = a.customer ?? ''; vb = b.customer ?? ''; }
 else if (sortKey === 'price') { va = Number(a.price ?? 0); vb = Number(b.price ?? 0); }
 else if (sortKey === 'endDate') { va = a.endDate ?? '9999'; vb = b.endDate ?? '9999'; }

 if (va < vb) return sortDir === 'asc' ? -1 : 1;
 if (va > vb) return sortDir === 'asc' ? 1 : -1;
 return 0;
 });

 const groups: { label: string; color: string; tasks: Task[] }[] = groupByStatus
 ? [
 { label: 'To Do', color: 'text-slate-400', tasks: sortTasks(tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ' || !t.status)) },
 { label: 'In Progress', color: 'text-indigo-600', tasks: sortTasks(tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังดำเนินการ' || t.status === 'กำลังทำ')) },
 { label: 'Done', color: 'text-emerald-600', tasks: sortTasks(tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น')) },
 ].filter(g => g.tasks.length > 0)
 : [{ label: 'ทั้งหมด', color: 'text-slate-600', tasks: sortTasks(tasks) }];

 const Th = ({ label, sortable, k }: { label: string; sortable?: boolean; k?: SortKey }) => (
 <th
 className={cn(
 'px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap select-none',
 sortable && 'cursor-pointer hover:text-slate-700 transition-colors'
 )}
 onClick={() => sortable && k && handleSort(k)}
 >
 <span className="flex items-center gap-1">
 {label}
 {sortable && k && <SortIcon active={sortKey === k} dir={sortDir} />}
 </span>
 </th>
 );

 return (
 <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 bg-transparent">
 <div className="max-w-6xl mx-auto">

 {/* Toolbar */}
 <div className="flex items-center justify-between mb-4">
 <p className="text-xs text-slate-500 font-medium">{tasks.length} รายการ</p>
 <button
 onClick={() => setGroupByStatus(g => !g)}
 className={cn(
 'text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer',
 groupByStatus
 ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
 : 'text-slate-600 border-slate-200 hover:bg-slate-50'
 )}
 >
 {groupByStatus ? ' จัดกลุ่มตามสถานะ' : ' แสดงทั้งหมด'}
 </button>
 </div>

 {/* Mobile card list */}
 <div className="md:hidden flex flex-col gap-3">
 {groups.map(group => (
 <React.Fragment key={group.label}>
 {groupByStatus && (
 <div className="px-1 pt-2 pb-1">
 <span className={cn('text-[10px] font-black uppercase tracking-widest', group.color)}>
 {group.label} · {group.tasks.length}
 </span>
 </div>
 )}
 {group.tasks.map(task => {
 const isOverdue = task.endDate && task.endDate < today && task.status !== 'Done' && task.status !== 'เสร็จสิ้น';
 const subtasks = parseSubtasks(task.subtasks);
 const completedSubs = subtasks.filter(s => s.completed).length;
 const progress = subtasks.length > 0 ? Math.round(completedSubs / subtasks.length * 100) : -1;
 return (
 <div
 key={task.id}
 onClick={() => onTaskClick(task)}
 className="glass-card rounded-2xl p-4 active:scale-[0.99] transition-all cursor-pointer"
 >
 <div className="flex items-start justify-between gap-2 mb-2">
 <div className="flex items-center gap-2 min-w-0">
 <button onClick={e => { e.stopPropagation(); onStatusChange(task.id.toString(), STATUS_CYCLE[task.status] ?? 'In Progress'); }} className="shrink-0">
 <StatusIcon status={task.status} />
 </button>
 <span className="font-bold text-sm text-slate-800 truncate">{task.name}</span>
 {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
 </div>
 <span className="text-xs font-bold text-emerald-700 shrink-0">
 {Number(task.price || 0) > 0 ? `฿${Number(task.price).toLocaleString()}` : ''}
 </span>
 </div>
 <div className="flex flex-wrap gap-1.5 mb-2">
 <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-lg border',
 task.status === 'Done' || task.status === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
 task.status === 'In Progress' || task.status === 'กำลังดำเนินการ' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
 'bg-slate-100 text-slate-600 border-slate-200'
 )}>{task.status}</span>
 {task.priority && <PriorityBadge priority={task.priority} />}
 {task.endDate && <span className={cn('text-[9px] font-medium px-2 py-0.5 rounded-lg border border-slate-200', isOverdue ? 'text-red-500 font-bold bg-red-50 border-red-100' : 'text-slate-500 bg-slate-50')}> {task.endDate}</span>}
 </div>
 {task.customer && <p className="text-[10px] text-slate-400 font-semibold"> {task.customer}</p>}
 {progress >= 0 && (
 <div className="flex items-center gap-2 mt-2">
 <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
 <div className={cn('h-full rounded-full', progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600')} style={{ width: `${progress}%` }} />
 </div>
 <span className="text-[9px] text-slate-400 font-bold">{completedSubs}/{subtasks.length}</span>
 </div>
 )}
 </div>
 );
 })}
 </React.Fragment>
 ))}
 {tasks.length === 0 && (
 <div className="py-16 text-center text-slate-300 text-sm">ยังไม่มีงาน — กด "+ งานใหม่" เพื่อเริ่ม</div>
 )}
 </div>

 {/* Desktop table */}
 <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
 <table className="w-full min-w-[700px]">
 <thead>
 <tr className="border-b border-white/20 bg-white/25">
 <Th label="ชื่องาน" sortable k="name" />
 <Th label="สถานะ" sortable k="status" />
 <Th label="ความสำคัญ" sortable k="priority" />
 <Th label="ลูกค้า" sortable k="customer" />
 <Th label="ราคา" sortable k="price" />
 <Th label="กำหนดส่ง" sortable k="endDate" />
 <Th label="ความคืบหน้า" />
 <Th label="" />
 </tr>
 </thead>
 <tbody>
 {groups.map(group => (
 <React.Fragment key={group.label}>
 {groupByStatus && (
 <tr className="border-b border-white/10 bg-white/10">
 <td colSpan={8} className="px-3 py-2">
 <span className={cn('text-[10px] font-black uppercase tracking-widest', group.color)}>
 {group.label} · {group.tasks.length}
 </span>
 </td>
 </tr>
 )}
 {group.tasks.map(task => {
 const isOverdue = task.endDate && task.endDate < today &&
 task.status !== 'Done' && task.status !== 'เสร็จสิ้น';
 const subtasks = parseSubtasks(task.subtasks);
 const completedSubs = subtasks.filter(s => s.completed).length;
 const progress = subtasks.length > 0 ? Math.round(completedSubs / subtasks.length * 100) : -1;

 return (
 <tr
 key={task.id}
 className="border-b border-white/15 hover:bg-white/20 transition-colors group cursor-pointer"
 onClick={() => onTaskClick(task)}
 >
 {/* Name */}
 <td className="px-3 py-3 max-w-[240px]">
 <div className="flex items-center gap-2">
 <button
 onClick={e => { e.stopPropagation(); onStatusChange(task.id.toString(), STATUS_CYCLE[task.status] ?? 'In Progress'); }}
 title="คลิกเพื่อเปลี่ยนสถานะ"
 className="shrink-0 hover:scale-110 transition-transform cursor-pointer"
 >
 <StatusIcon status={task.status} />
 </button>
 <span className="text-sm font-semibold text-slate-800 truncate">{task.name}</span>
 {isOverdue && (
 <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" aria-label="เกินกำหนด" />
 )}
 </div>
 </td>

 {/* Status */}
 <td className="px-3 py-3 whitespace-nowrap">
 <span className={cn(
 'text-[10px] font-bold px-2 py-1 rounded-lg border',
 task.status === 'Done' || task.status === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
 task.status === 'In Progress' || task.status === 'กำลังดำเนินการ' || task.status === 'กำลังทำ' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
 'bg-slate-100 text-slate-600 border-slate-200'
 )}>
 {task.status}
 </span>
 </td>

 {/* Priority */}
 <td className="px-3 py-3">
 <PriorityBadge priority={task.priority} />
 </td>

 {/* Customer */}
 <td className="px-3 py-3 max-w-[120px]">
 <span className="text-xs text-slate-600 truncate block">{task.customer || '—'}</span>
 </td>

 {/* Price */}
 <td className="px-3 py-3 whitespace-nowrap">
 <span className="text-xs font-bold text-emerald-700">
 {Number(task.price || 0) > 0 ? `฿${Number(task.price).toLocaleString()}` : '—'}
 </span>
 </td>

 {/* Deadline */}
 <td className="px-3 py-3 whitespace-nowrap">
 {task.endDate ? (
 <span className={cn(
 'text-xs font-medium',
 isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'
 )}>
 {isOverdue ? ' ' : ''}{task.endDate}
 </span>
 ) : (
 <span className="text-xs text-slate-300">—</span>
 )}
 </td>

 {/* Progress */}
 <td className="px-3 py-3 min-w-[100px]">
 {progress >= 0 ? (
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div
 className={cn('h-full rounded-full transition-all', progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600')}
 style={{ width: `${progress}%` }}
 />
 </div>
 <span className="text-[10px] text-slate-400 font-bold shrink-0">{completedSubs}/{subtasks.length}</span>
 </div>
 ) : (
 <span className="text-xs text-slate-300">—</span>
 )}
 </td>

 {/* Actions */}
 <td className="px-3 py-3">
 <button
 onClick={e => { e.stopPropagation(); onConsultAgent?.(task.id.toString()); }}
 className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-white bg-slate-100 hover:bg-[#0f172a] border border-slate-200 hover:border-transparent px-2.5 py-1 rounded-lg cursor-pointer"
 >
 <Bot className="w-3 h-3" /> AI
 </button>
 </td>
 </tr>
 );
 })}
 </React.Fragment>
 ))}
 {tasks.length === 0 && (
 <tr>
 <td colSpan={8} className="py-16 text-center text-slate-300 text-sm">ยังไม่มีงาน — กด "+ งานใหม่" เพื่อเริ่ม</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>{/* end desktop table wrapper */}
 </div>
 </div>
 );
}
