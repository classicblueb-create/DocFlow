import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check, Calendar, Hash, CheckSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Tracker {
 id: string;
 name: string;
 type: 'date' | 'number' | 'checkbox';
 unit: string;
 month: string;
 entries: Record<string, any>;
 color: string;
 createdAt: string;
}

interface Props {
 showNotification: (msg: string, isError?: boolean) => void;
}

const COLORS = ['indigo', 'violet', 'emerald', 'orange', 'rose', 'amber', 'sky', 'pink'];
const COLOR_MAP: Record<string, { bg: string; active: string; text: string; ring: string }> = {
 indigo: { bg: 'bg-indigo-50', active: 'bg-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-300' },
 violet: { bg: 'bg-violet-50', active: 'bg-violet-500', text: 'text-violet-600', ring: 'ring-violet-300' },
 emerald: { bg: 'bg-emerald-50', active: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-300' },
 orange: { bg: 'bg-orange-50', active: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-300' },
 rose: { bg: 'bg-rose-50', active: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-300' },
 amber: { bg: 'bg-amber-50', active: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-300' },
 sky: { bg: 'bg-sky-50', active: 'bg-sky-500', text: 'text-sky-600', ring: 'ring-sky-300' },
 pink: { bg: 'bg-pink-50', active: 'bg-pink-500', text: 'text-pink-600', ring: 'ring-pink-300' },
};

function currentMonth() { return new Date().toISOString().slice(0, 7); }
function daysInMonth(m: string) {
 const [y, mo] = m.split('-').map(Number);
 return new Date(y, mo, 0).getDate();
}
function dayKey(m: string, d: number) {
 return `${m}-${String(d).padStart(2, '0')}`;
}
function todayKey() { return new Date().toISOString().slice(0, 10); }

async function loadTrackers(month: string): Promise<Tracker[]> {
 const { data } = await supabase.from('custom_trackers').select('*').eq('month', month).order('created_at');
 return (data || []).map((r: any) => ({
 id: r.id, name: r.name, type: r.type, unit: r.unit,
 month: r.month, entries: r.entries || {}, color: r.color, createdAt: r.created_at,
 }));
}

async function saveTracker(t: Tracker) {
 await supabase.from('custom_trackers').upsert({
 id: t.id, name: t.name, type: t.type, unit: t.unit,
 month: t.month, entries: t.entries, color: t.color, created_at: t.createdAt,
 });
}

async function removeTracker(id: string) {
 await supabase.from('custom_trackers').delete().eq('id', id);
}

const TYPE_CONFIG = {
 date: { label: 'วันที่', icon: Calendar, desc: 'ติก วันที่ทำ' },
 number: { label: 'ตัวเลข', icon: Hash, desc: 'กรอกตัวเลขรายวัน' },
 checkbox: { label: 'Checkbox', icon: CheckSquare, desc: 'ทำ/ไม่ทำ รายวัน' },
};

export function CustomTrackerWidget({ showNotification }: Props) {
 const [month] = useState(currentMonth());
 const [trackers, setTrackers] = useState<Tracker[]>([]);
 const [adding, setAdding] = useState(false);
 const [form, setForm] = useState({ name: '', type: 'date' as Tracker['type'], unit: '', color: 'indigo' });
 const [editingEntry, setEditingEntry] = useState<{ trackerId: string; day: number } | null>(null);
 const [numInput, setNumInput] = useState('');

 const days = daysInMonth(month);
 const today = new Date().getDate();
 const [y, mo] = month.split('-').map(Number);
 const firstDow = new Date(y, mo - 1, 1).getDay(); // 0=Sun

 useEffect(() => {
 loadTrackers(month).then(setTrackers).catch(console.error);
 }, [month]);

 const handleAdd = async () => {
 if (!form.name.trim()) return;
 const t: Tracker = {
 id: `tracker-${Date.now()}`,
 name: form.name.trim(),
 type: form.type,
 unit: form.unit.trim(),
 month,
 entries: {},
 color: form.color,
 createdAt: new Date().toISOString(),
 };
 await saveTracker(t).catch(console.error);
 setTrackers(prev => [...prev, t]);
 setForm({ name: '', type: 'date', unit: '', color: 'indigo' });
 setAdding(false);
 showNotification(`สร้างหัวข้อ "${t.name}" แล้ว`);
 };

 const toggleDate = async (trackerId: string, day: number) => {
 const t = trackers.find(x => x.id === trackerId);
 if (!t) return;
 const key = dayKey(month, day);
 const updated = { ...t, entries: { ...t.entries, [key]: !t.entries[key] } };
 setTrackers(prev => prev.map(x => x.id === trackerId ? updated : x));
 await saveTracker(updated).catch(console.error);
 };

 const setNumber = async (trackerId: string, day: number, val: string) => {
 const t = trackers.find(x => x.id === trackerId);
 if (!t) return;
 const key = dayKey(month, day);
 const num = parseFloat(val);
 const updated = { ...t, entries: { ...t.entries, [key]: isNaN(num) ? undefined : num } };
 setTrackers(prev => prev.map(x => x.id === trackerId ? updated : x));
 await saveTracker(updated).catch(console.error);
 setEditingEntry(null);
 };

 const handleDelete = async (id: string, name: string) => {
 setTrackers(prev => prev.filter(x => x.id !== id));
 await removeTracker(id).catch(console.error);
 showNotification(`ลบ "${name}" แล้ว`);
 };

 const countActive = (t: Tracker) =>
 Object.values(t.entries).filter(v => v !== false && v !== undefined && v !== null && v !== 0).length;

 return (
 <div className="glass-card rounded-[24px] p-5 flex flex-col gap-5">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Custom Tracker</h2>
 <p className="text-xs text-slate-400 mt-0.5">
 {new Date(y, mo - 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
 </p>
 </div>
 <button
 onClick={() => setAdding(true)}
 className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" /> สร้างหัวข้อ
 </button>
 </div>

 {/* Add form */}
 {adding && (
 <div className="bg-violet-50/70 rounded-2xl p-4 flex flex-col gap-3 border border-violet-100">
 <p className="text-xs font-black text-violet-700 uppercase tracking-widest">หัวข้อใหม่</p>

 <input
 autoFocus
 placeholder="ชื่อหัวข้อ เช่น โพสต์คอนเทนต์, ออกกำลังกาย"
 value={form.name}
 onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
 className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
 />

 {/* Type selector */}
 <div>
 <label className="text-[10px] text-slate-400 font-bold block mb-1.5">ประเภทข้อมูล</label>
 <div className="grid grid-cols-3 gap-2">
 {(Object.entries(TYPE_CONFIG) as [Tracker['type'], typeof TYPE_CONFIG['date']][]).map(([type, cfg]) => {
 const Icon = cfg.icon;
 return (
 <button
 key={type}
 onClick={() => setForm(f => ({ ...f, type }))}
 className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
 form.type === type
 ? 'bg-violet-100 border-violet-300 text-violet-700'
 : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
 }`}
 >
 <Icon className="w-4 h-4" />
 {cfg.label}
 <span className="text-[9px] font-normal text-slate-400">{cfg.desc}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Unit (for number type) */}
 {form.type === 'number' && (
 <input
 placeholder="หน่วย เช่น คลิป, บาท, ครั้ง (ไม่บังคับ)"
 value={form.unit}
 onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
 className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
 />
 )}

 {/* Color picker */}
 <div>
 <label className="text-[10px] text-slate-400 font-bold block mb-1.5">สี</label>
 <div className="flex gap-2 flex-wrap">
 {COLORS.map(c => (
 <button
 key={c}
 onClick={() => setForm(f => ({ ...f, color: c }))}
 className={`w-6 h-6 rounded-full transition-all cursor-pointer ring-offset-1 ${COLOR_MAP[c].active} ${form.color === c ? `ring-2 ${COLOR_MAP[c].ring}` : ''}`}
 />
 ))}
 </div>
 </div>

 <div className="flex gap-2 justify-end">
 <button onClick={() => { setAdding(false); }} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 cursor-pointer">ยกเลิก</button>
 <button
 onClick={handleAdd}
 disabled={!form.name.trim()}
 className="flex items-center gap-1 text-xs font-bold bg-violet-600 text-white px-4 py-1.5 rounded-xl hover:bg-violet-700 disabled:opacity-40 cursor-pointer transition-colors"
 >
 <Check className="w-3.5 h-3.5" /> สร้าง
 </button>
 </div>
 </div>
 )}

 {/* Tracker cards */}
 {trackers.length === 0 && !adding && (
 <p className="text-center text-xs text-slate-400 py-4">ยังไม่มีหัวข้อ — กด "สร้างหัวข้อ" เพื่อเริ่ม</p>
 )}

 {trackers.map(t => {
 const c = COLOR_MAP[t.color] || COLOR_MAP.indigo;
 const active = countActive(t);
 const pct = days > 0 ? Math.round((active / days) * 100) : 0;

 return (
 <div key={t.id} className="flex flex-col gap-3">
 {/* Title row */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${c.active}`} />
 <span className="text-sm font-black text-slate-800">{t.name}</span>
 {t.unit && <span className={`text-[10px] font-bold ${c.text} ${c.bg} px-2 py-0.5 rounded-full`}>{t.unit}</span>}
 <span className="text-[11px] text-slate-400">{active}/{days} วัน · {pct}%</span>
 </div>
 <button
 onClick={() => handleDelete(t.id, t.name)}
 className="w-6 h-6 rounded-lg bg-rose-50 text-rose-400 flex items-center justify-center cursor-pointer hover:bg-rose-100"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>

 {/* Progress */}
 <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
 <div className={`h-full rounded-full transition-all duration-500 ${c.active}`} style={{ width: `${pct}%` }} />
 </div>

 {/* Calendar grid (date & checkbox) */}
 {(t.type === 'date' || t.type === 'checkbox') && (
 <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
 {/* Day headers */}
 {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
 <div key={d} className="text-center text-[9px] text-slate-400 font-bold pb-0.5">{d}</div>
 ))}
 {/* Blank cells before first day */}
 {Array.from({ length: firstDow }).map((_, i) => <div key={`blank-${i}`} />)}
 {/* Day cells */}
 {Array.from({ length: days }, (_, i) => i + 1).map(d => {
 const key = dayKey(month, d);
 const isActive = !!t.entries[key];
 const isToday = d === today;
 return (
 <button
 key={d}
 onClick={() => toggleDate(t.id, d)}
 className={`aspect-square rounded-lg text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer
 ${isActive ? `${c.active} text-white shadow-sm` : `${c.bg} ${c.text} hover:opacity-80`}
 ${isToday && !isActive ? `ring-1 ${c.ring}` : ''}
 `}
 >
 {d}
 </button>
 );
 })}
 </div>
 )}

 {/* Number tracker: list of days with values */}
 {t.type === 'number' && (
 <div className="grid grid-cols-7 gap-1">
 {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
 <div key={d} className="text-center text-[9px] text-slate-400 font-bold pb-0.5">{d}</div>
 ))}
 {Array.from({ length: firstDow }).map((_, i) => <div key={`blank-${i}`} />)}
 {Array.from({ length: days }, (_, i) => i + 1).map(d => {
 const key = dayKey(month, d);
 const val = t.entries[key];
 const hasVal = val !== undefined && val !== null;
 const isToday = d === today;
 const isEditing = editingEntry?.trackerId === t.id && editingEntry?.day === d;

 return (
 <div key={d} className="flex flex-col items-center">
 {isEditing ? (
 <input
 autoFocus
 type="number"
 value={numInput}
 onChange={e => setNumInput(e.target.value)}
 onBlur={() => setNumber(t.id, d, numInput)}
 onKeyDown={e => { if (e.key === 'Enter') setNumber(t.id, d, numInput); if (e.key === 'Escape') setEditingEntry(null); }}
 className={`w-full aspect-square text-center text-[10px] font-bold rounded-lg outline-none ring-1 ${c.ring} ${c.bg}`}
 />
 ) : (
 <button
 onClick={() => { setEditingEntry({ trackerId: t.id, day: d }); setNumInput(hasVal ? String(val) : ''); }}
 className={`w-full aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer
 ${hasVal ? `${c.active} text-white` : `${c.bg} ${c.text} opacity-60 hover:opacity-100`}
 ${isToday && !hasVal ? `ring-1 ${c.ring}` : ''}
 `}
 >
 {hasVal ? (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val) : d}
 </button>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
}
