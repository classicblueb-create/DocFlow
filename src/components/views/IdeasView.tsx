import { useState } from 'react';
import { Lightbulb, Plus, X, Sparkles, Loader2, ChevronDown, ChevronUp, Trash2, Tag, Clock, Zap, TrendingUp, Pencil, Check, ArrowRight } from 'lucide-react';
import { Idea, Task } from '../../types';
import { cn } from '../../lib/utils';

interface IdeasViewProps {
 ideas: Idea[];
 onSaveIdea: (idea: Idea) => void;
 onDeleteIdea: (id: string) => void;
 onUpdateIdea: (idea: Idea) => void;
 onCreateTask?: (task: Partial<Task>) => void;
}

const CATEGORIES = ['ธุรกิจ', 'Product', 'Marketing', 'เทคนิค', 'ออกแบบ', 'การเงิน', 'อื่นๆ'];
const PRIORITIES: Idea['priority'][] = ['สูง', 'กลาง', 'ต่ำ'];
const EFFORTS: Idea['effort'][] = ['ง่าย', 'ปานกลาง', 'ยาก'];
const STATUSES: Idea['status'][] = ['ไอเดีย', 'กำลังวางแผน', 'กำลังทำ', 'เสร็จแล้ว'];

const STATUS_COLORS: Record<string, string> = {
 'ไอเดีย': 'bg-slate-500/10 text-slate-700 border-slate-500/20',
 'กำลังวางแผน': 'bg-amber-500/10 text-amber-750 border-amber-500/20',
 'กำลังทำ': 'bg-indigo-500/10 text-indigo-750 border-indigo-500/20',
 'เสร็จแล้ว': 'bg-emerald-500/10 text-emerald-750 border-emerald-500/20',
};

const PRIORITY_COLORS: Record<string, string> = {
 'สูง': 'bg-rose-500/10 text-rose-750 border-rose-500/20',
 'กลาง': 'bg-amber-500/10 text-amber-750 border-amber-500/20',
 'ต่ำ': 'bg-blue-500/10 text-blue-750 border-blue-500/20',
};

const EFFORT_COLORS: Record<string, string> = {
 'ง่าย': 'bg-emerald-500/10 text-emerald-750 border-emerald-500/20',
 'ปานกลาง': 'bg-amber-500/10 text-amber-750 border-amber-500/20',
 'ยาก': 'bg-rose-500/10 text-rose-750 border-rose-500/20',
};

function IdeaCard({ idea, onDelete, onUpdate, onConvertToTask }: { key?: React.Key; idea: Idea; onDelete: (id: string) => void; onUpdate: (idea: Idea) => void; onConvertToTask?: (idea: Idea) => void }) {
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [showAnalysis, setShowAnalysis] = useState(!!idea.aiAnalysis);
 const [isEditing, setIsEditing] = useState(false);
 const [editTitle, setEditTitle] = useState(idea.title);
 const [editDescription, setEditDescription] = useState(idea.description);
 const [editCategory, setEditCategory] = useState(idea.category || '');
 const [editTags, setEditTags] = useState(idea.tags || '');
 const [editPriority, setEditPriority] = useState<Idea['priority']>(idea.priority);
 const [editEffort, setEditEffort] = useState<Idea['effort']>(idea.effort);
 const [editStatus, setEditStatus] = useState<Idea['status']>(idea.status);

 const handleEditSave = (e: React.FormEvent) => {
   e.preventDefault();
   onUpdate({
     ...idea,
     title: editTitle.trim(),
     description: editDescription.trim(),
     category: editCategory || undefined,
     tags: editTags || undefined,
     priority: editPriority,
     effort: editEffort,
     status: editStatus,
   });
   setIsEditing(false);
 };

 const handleAnalyze = async () => {
 setIsAnalyzing(true);
 setShowAnalysis(true);

 const systemPrompt = `คุณคือ AI ที่ปรึกษาธุรกิจและผู้เชี่ยวชาญด้านการประเมินไอเดีย มีประสบการณ์ทั้ง Startup, Freelance, และ Product Development
คุณต้องวิเคราะห์ไอเดียของผู้ใช้อย่างละเอียดและตรงไปตรงมา โดยใช้ภาษาไทยผสมอังกฤษตามความเหมาะสม ตอบในรูปแบบ HTML สวยงาม`;

 const userPrompt = `วิเคราะห์ไอเดียนี้อย่างละเอียดและซื่อสัตย์:

**ชื่อไอเดีย:** ${idea.title}
**หมวดหมู่:** ${idea.category || 'ไม่ระบุ'}
**รายละเอียด:** ${idea.description}
**แท็ก:** ${idea.tags || 'ไม่ระบุ'}
**ความสำคัญที่ตั้งไว้:** ${idea.priority || 'ไม่ระบุ'}
**ความยากที่ประเมิน:** ${idea.effort || 'ไม่ระบุ'}

กรุณาวิเคราะห์ใน 6 หัวข้อนี้:

1. **ภาพรวมและศักยภาพ** — ไอเดียนี้มีคุณค่าอะไร มีโอกาสสำเร็จมากน้อยแค่ไหน (0-100%) และทำไม
2. **จุดแข็งที่ควรรักษา** — สิ่งที่ดีในไอเดียนี้และควรเก็บไว้
3. **ความเสี่ยงและจุดอ่อน** — อุปสรรคสำคัญที่อาจทำให้ล้มเหลว บอกตรงๆ อย่าปรุงแต่ง
4. **ขั้นตอนแรกที่ควรทำ** (First 3 Actions) — บอก 3 action แรกที่ทำได้เลยภายใน 7 วัน พร้อมเหตุผล
5. **ประเมิน ROI & Timeline** — ถ้าทำจริงจะใช้เวลาเท่าไหร่ ผลตอบแทนน่าจะเป็นอย่างไร (ทั้งเงินและอื่นๆ)
6. **คำแนะนำสุดท้าย** — ควรทำหรือยัง? ถ้าทำควรปรับอะไรก่อน? ถ้ายังไม่ควรทำ ทำไม?

ตอบเป็น HTML ที่อ่านง่าย ใช้ emoji นำหน้าหัวข้อ และ <b> สำหรับ highlight จุดสำคัญ`;

 try {
 const response = await fetch('/api/ai/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 messages: [{ role: 'user', text: userPrompt }],
 agentTitle: 'ที่ปรึกษาไอเดียบรรเจิด',
 agentInstructions: systemPrompt,
 contextData: {},
 }),
 });
 const data = await response.json();
 if (!response.ok) throw new Error(data.error || 'AI ไม่ตอบสนอง');
 onUpdate({ ...idea, aiAnalysis: data.result });
 } catch (e: any) {
 onUpdate({ ...idea, aiAnalysis: `<span class="text-red-500"> เกิดข้อผิดพลาด: ${e.message}</span>` });
 } finally {
 setIsAnalyzing(false);
 }
 };

 const handleStatusChange = (status: Idea['status']) => {
 onUpdate({ ...idea, status });
 };

 return (
 <div className="glass-card rounded-[20px] hover:shadow-md transition-all duration-200 overflow-hidden group relative">
 {/* Inline Edit Overlay */}
 {isEditing && (
   <form onSubmit={handleEditSave} className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-[20px] p-5 flex flex-col gap-3 overflow-y-auto">
     <div className="flex items-center justify-between mb-1">
       <span className="text-xs font-black text-[#0f172a]">แก้ไขไอเดีย</span>
       <button type="button" onClick={() => setIsEditing(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
     </div>
     <input
       required value={editTitle} onChange={e => setEditTitle(e.target.value)}
       placeholder="ชื่อไอเดีย" className="glass-input w-full px-3 py-1.5 text-xs"
     />
     <textarea
       required rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)}
       placeholder="รายละเอียด" className="glass-input w-full px-3 py-1.5 text-xs resize-none"
     />
     <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="glass-input w-full px-3 py-1.5 text-xs cursor-pointer">
       <option value="">หมวดหมู่...</option>
       {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
     </select>
     <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="แท็ก (คั่นด้วยจุลภาค)" className="glass-input w-full px-3 py-1.5 text-xs" />
     <div className="flex gap-1">
       {PRIORITIES.map(p => (
         <button key={p} type="button" onClick={() => setEditPriority(p)}
           className={cn('flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition cursor-pointer', editPriority === p ? PRIORITY_COLORS[p!] : 'bg-white/10 text-slate-400 border-white/20')}
         >{p}</button>
       ))}
     </div>
     <div className="flex gap-1">
       {EFFORTS.map(ef => (
         <button key={ef} type="button" onClick={() => setEditEffort(ef)}
           className={cn('flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition cursor-pointer', editEffort === ef ? EFFORT_COLORS[ef!] : 'bg-white/10 text-slate-400 border-white/20')}
         >{ef}</button>
       ))}
     </div>
     <select value={editStatus} onChange={e => setEditStatus(e.target.value as Idea['status'])} className="glass-input w-full px-3 py-1.5 text-xs cursor-pointer">
       {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
     </select>
     <div className="flex gap-2 pt-1">
       <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 bg-[#0f172a] text-white text-xs font-bold py-2 rounded-xl cursor-pointer">
         <Check className="w-3.5 h-3.5" /> บันทึก
       </button>
       <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-white/20 text-slate-500 text-xs font-semibold rounded-xl hover:bg-white/10 cursor-pointer">ยกเลิก</button>
     </div>
   </form>
 )}
 <div className="p-5">
 {/* Top row */}
 <div className="flex items-start justify-between gap-3 mb-3">
 <div className="flex items-center gap-2 min-w-0">
 <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
 <Lightbulb className="w-4 h-4 text-amber-500" />
 </div>
 <h3 className="font-bold text-[#0f172a] text-sm leading-snug">{idea.title}</h3>
 </div>
 <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
 <button
   onClick={() => setIsEditing(true)}
   className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer"
 >
   <Pencil className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => onDelete(idea.id)}
 className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {/* Description */}
 <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{idea.description}</p>

 {/* Badges */}
 <div className="flex flex-wrap gap-1.5 mb-4">
 {idea.category && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{idea.category}</span>
 )}
 {idea.priority && (
 <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', PRIORITY_COLORS[idea.priority] || 'bg-slate-100 text-slate-600 border-slate-200')}>
 ความสำคัญ: {idea.priority}
 </span>
 )}
 {idea.effort && (
 <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', EFFORT_COLORS[idea.effort] || '')}>
 ความยาก: {idea.effort}
 </span>
 )}
 {idea.tags && idea.tags.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
 <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 flex items-center gap-1">
 <Tag className="w-2.5 h-2.5" />{tag}
 </span>
 ))}
 </div>

 {/* Status + Actions */}
 <div className="flex items-center justify-between gap-2">
 <select
 value={idea.status}
 onChange={(e) => handleStatusChange(e.target.value as Idea['status'])}
 className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none appearance-none', STATUS_COLORS[idea.status] || 'bg-slate-100 text-slate-600 border-slate-200')}
 >
 {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
 </select>

 <div className="flex items-center gap-1.5">
 {onConvertToTask && (
   <button
     onClick={() => onConvertToTask(idea)}
     className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
     title="สร้างเป็นงาน"
   >
     <ArrowRight className="w-3 h-3" /> สร้างงาน
   </button>
 )}
 <button
 onClick={handleAnalyze}
 disabled={isAnalyzing}
 className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#0f172a] text-white hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
 >
 {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
 {isAnalyzing ? 'กำลังวิเคราะห์...' : idea.aiAnalysis ? 'วิเคราะห์ใหม่' : 'วิเคราะห์ด้วย AI'}
 </button>
 </div>

 {/* AI Analysis toggle */}
 {idea.aiAnalysis && (
 <button
 onClick={() => setShowAnalysis(v => !v)}
 className="mt-3 w-full flex items-center justify-between text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-100 transition-all cursor-pointer"
 >
 <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> ผลวิเคราะห์ AI</span>
 {showAnalysis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
 </button>
 )}
 </div>

 {/* AI Analysis Panel */}
 {idea.aiAnalysis && showAnalysis && (
 <div className="border-t border-white/10 bg-indigo-500/5 px-5 py-4">
 <div
 className="text-xs text-slate-700 leading-relaxed prose-sm space-y-1 [&_b]:text-[#0f172a] [&_b]:font-bold"
 dangerouslySetInnerHTML={{ __html: idea.aiAnalysis }}
 />
 </div>
 )}

 {/* Skeleton while analyzing */}
 {isAnalyzing && (
 <div className="border-t border-indigo-50 bg-indigo-50/30 px-5 py-4">
 <div className="flex items-center gap-2 mb-3">
 <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
 <span className="text-xs font-bold text-indigo-600">AI กำลังวิเคราะห์ไอเดียของคุณ...</span>
 </div>
 <div className="space-y-2 animate-pulse">
 {[80, 95, 70, 85, 60].map((w, i) => (
 <div key={i} className="h-2 bg-indigo-100 rounded-full" style={{ width: `${w}%` }} />
 ))}
 </div>
 </div>
 )}

 {/* Timestamp */}
 <div className="px-5 pb-3 flex items-center gap-1 text-[9px] text-slate-300 font-semibold uppercase tracking-wider">
 <Clock className="w-2.5 h-2.5" />
 {new Date(idea.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
 </div>
 </div>
 </div>
 );
}

export function IdeasView({ ideas, onSaveIdea, onDeleteIdea, onUpdateIdea, onCreateTask }: IdeasViewProps) {
 const [isAdding, setIsAdding] = useState(false);
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [category, setCategory] = useState('');
 const [tags, setTags] = useState('');
 const [priority, setPriority] = useState<Idea['priority']>('กลาง');
 const [effort, setEffort] = useState<Idea['effort']>('ปานกลาง');
 const [filterStatus, setFilterStatus] = useState<string>('ทั้งหมด');
 const [filterCategory, setFilterCategory] = useState<string>('ทั้งหมด');
 const [searchQ, setSearchQ] = useState('');

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim() || !description.trim()) return;
 const newIdea: Idea = {
 id: `idea-${Date.now()}`,
 title: title.trim(),
 description: description.trim(),
 category: category || undefined,
 tags: tags || undefined,
 priority,
 effort,
 status: 'ไอเดีย',
 createdAt: new Date().toISOString(),
 };
 onSaveIdea(newIdea);
 setTitle(''); setDescription(''); setCategory(''); setTags('');
 setPriority('กลาง'); setEffort('ปานกลาง');
 setIsAdding(false);
 };

 const handleDelete = (id: string) => {
 if (window.confirm('ลบไอเดียนี้ใช่ไหม?')) onDeleteIdea(id);
 };

 const filtered = ideas.filter(idea => {
 const matchStatus = filterStatus === 'ทั้งหมด' || idea.status === filterStatus;
 const matchCategory = filterCategory === 'ทั้งหมด' || idea.category === filterCategory;
 const matchSearch = !searchQ || idea.title.toLowerCase().includes(searchQ.toLowerCase()) || idea.description.toLowerCase().includes(searchQ.toLowerCase());
 return matchStatus && matchCategory && matchSearch;
 });

 const statCounts = {
 total: ideas.length,
 withAnalysis: ideas.filter(i => i.aiAnalysis).length,
 high: ideas.filter(i => i.priority === 'สูง').length,
 doing: ideas.filter(i => i.status === 'กำลังทำ' || i.status === 'กำลังวางแผน').length,
 };

 return (
 <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 bg-transparent">
 <div className="max-w-6xl w-full mx-auto space-y-6">

 {/* Stats Banner */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {[
 { icon: Lightbulb, label: 'ไอเดียทั้งหมด', value: statCounts.total, color: 'text-amber-655', bg: 'bg-amber-500/10 border-amber-500/20' },
 { icon: Sparkles, label: 'วิเคราะห์แล้ว', value: statCounts.withAnalysis, color: 'text-indigo-655', bg: 'bg-indigo-500/10 border-indigo-500/20' },
 { icon: TrendingUp, label: 'ความสำคัญสูง', value: statCounts.high, color: 'text-rose-655', bg: 'bg-rose-500/10 border-rose-500/20' },
 { icon: Zap, label: 'กำลังดำเนินการ', value: statCounts.doing, color: 'text-emerald-655', bg: 'bg-emerald-500/10 border-emerald-500/20' },
 ].map(stat => (
 <div key={stat.label} className={cn('border rounded-[18px] p-4 flex items-center gap-3 glass-card backdrop-blur-md', stat.bg)}>
 <div className={cn('w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-sm', stat.color)}>
 <stat.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
 </div>
 <div>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
 <p className={cn('text-2xl font-black', stat.color)}>{stat.value}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Toolbar */}
 <div className="flex flex-wrap gap-3 items-center justify-between">
 <div className="flex flex-wrap gap-2 items-center">
 <input
 type="text"
 placeholder="ค้นหาไอเดีย..."
 value={searchQ}
 onChange={e => setSearchQ(e.target.value)}
 className="glass-input text-xs px-3 py-1.5 w-40 text-slate-800"
 />
 <select
 value={filterStatus}
 onChange={e => setFilterStatus(e.target.value)}
 className="glass-input text-xs px-3 py-1.5 cursor-pointer text-slate-850"
 >
 <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
 {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 <select
 value={filterCategory}
 onChange={e => setFilterCategory(e.target.value)}
 className="glass-input text-xs px-3 py-1.5 cursor-pointer text-slate-850"
 >
 <option value="ทั้งหมด">หมวด: ทั้งหมด</option>
 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <button
 onClick={() => setIsAdding(true)}
 className="flex items-center gap-2 text-xs font-bold bg-[#0f172a] hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" /> เพิ่มไอเดียใหม่
 </button>
 </div>

 {/* Add Form */}
 {isAdding && (
 <form onSubmit={handleSubmit} className="glass-card rounded-[24px] p-6 space-y-4 animate-fade-in">
 <div className="flex items-center justify-between mb-1">
 <h3 className="font-black text-sm text-[#0f172a] flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> บันทึกไอเดียใหม่</h3>
 <button type="button" onClick={() => setIsAdding(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">ชื่อไอเดีย *</label>
 <input
 type="text" required value={title} onChange={e => setTitle(e.target.value)}
 placeholder="เช่น แอปติดตามค่าใช้จ่ายสำหรับ Freelancer"
 className="glass-input w-full px-4 py-2 text-sm bg-white/5"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">รายละเอียดไอเดีย *</label>
 <textarea
 required rows={4} value={description} onChange={e => setDescription(e.target.value)}
 placeholder="อธิบายไอเดียให้ละเอียดที่สุดเท่าที่ทำได้ — ปัญหาที่แก้, กลุ่มเป้าหมาย, วิธีทำเงิน, แรงบันดาลใจ ฯลฯ ยิ่งละเอียด AI วิเคราะห์ได้แม่นยำกว่า"
 className="glass-input w-full px-4 py-2 text-sm bg-white/5 resize-none"
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">หมวดหมู่</label>
 <select value={category} onChange={e => setCategory(e.target.value)} className="glass-input w-full px-4 py-2 text-sm bg-white/5 cursor-pointer">
 <option value="">เลือกหมวดหมู่...</option>
 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">แท็ก (คั่นด้วยจุลภาค)</label>
 <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="เช่น saas, b2b, mobile" className="glass-input w-full px-4 py-2 text-sm bg-white/5" />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">ความสำคัญ</label>
 <div className="flex gap-2">
 {PRIORITIES.map(p => (
 <button key={p} type="button" onClick={() => setPriority(p)}
 className={cn('flex-1 text-xs font-bold py-2 rounded-xl border transition cursor-pointer', priority === p ? PRIORITY_COLORS[p!] + ' shadow-sm' : 'bg-white/10 text-slate-400 border-white/20 hover:bg-white/20')}
 >{p}</button>
 ))}
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">ความยาก (Effort)</label>
 <div className="flex gap-2">
 {EFFORTS.map(ef => (
 <button key={ef} type="button" onClick={() => setEffort(ef)}
 className={cn('flex-1 text-xs font-bold py-2 rounded-xl border transition cursor-pointer', effort === ef ? EFFORT_COLORS[ef!] + ' shadow-sm' : 'bg-white/10 text-slate-400 border-white/20 hover:bg-white/20')}
 >{ef}</button>
 ))}
 </div>
 </div>
 </div>

 <div className="pt-2 flex gap-3">
 <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-slate-700 text-white font-bold text-sm py-3 rounded-xl transition cursor-pointer shadow-sm">
 บันทึกไอเดีย
 </button>
 <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 border border-white/20 text-slate-500 font-bold text-sm rounded-xl hover:bg-white/10 cursor-pointer">
 ยกเลิก
 </button>
 </div>
 </form>
 )}

 {/* Ideas Grid */}
 {filtered.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
 <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
 <Lightbulb className="w-8 h-8 text-amber-300" />
 </div>
 <div>
 <p className="font-bold text-slate-700 mb-1">ยังไม่มีไอเดีย</p>
 <p className="text-xs text-slate-400 max-w-xs">กดปุ่ม "เพิ่มไอเดียใหม่" เพื่อบันทึกไอเดียแรกของคุณ แล้วให้ AI วิเคราะห์ว่าควรเริ่มจากตรงไหนก่อน</p>
 </div>
 <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer">
 <Plus className="w-3.5 h-3.5" /> เพิ่มไอเดียแรก
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {filtered.map(idea => (
 <IdeaCard key={idea.id} idea={idea} onDelete={handleDelete} onUpdate={onUpdateIdea}
   onConvertToTask={onCreateTask ? (idea) => onCreateTask({ name: idea.title, details: idea.description, status: 'To Do', tags: idea.tags || undefined }) : undefined}
 />
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

import React from 'react';
