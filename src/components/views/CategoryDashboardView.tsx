import { useState } from 'react';
import {
  Plus, ChevronRight, FolderKanban, X, Pencil,
  Bot, Megaphone, Globe, Search, Users, FlaskConical, Briefcase,
} from 'lucide-react';
import { Task, ProjectCategory } from '../../types';
import { calculateHealthScore } from '../../lib/utils';
import { cn } from '../../lib/utils';

const COLOR_PRESETS = ['#6366f1', '#0080FF', '#8B00FF', '#20B2AA', '#FF1493', '#f97316', '#10b981', '#64748b'];

const ICON_MAP: Record<string, any> = { Bot, Megaphone, Globe, Search, Users, FlaskConical, Briefcase, FolderKanban };
const ICON_PRESETS = Object.keys(ICON_MAP);

function getIcon(name?: string) {
  if (!name) return FolderKanban;
  return ICON_MAP[name] || FolderKanban;
}

interface CategoryDashboardViewProps {
  categories: ProjectCategory[];
  tasks: Task[];
  onEnterCategory: (categoryId: string) => void;
  onCreateCategory: (cat: Omit<ProjectCategory, 'id' | 'createdAt'>) => void;
  onDeleteCategory: (id: string) => void;
}

function CreateCategoryModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (cat: Omit<ProjectCategory, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(ICON_PRESETS[0]);
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() || undefined, icon, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="glass-modal ds-fade-in-up rounded-3xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>สร้าง Category ใหม่</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ชื่อ Category</label>
        <input
          autoFocus value={name} onChange={e => setName(e.target.value)}
          placeholder="เช่น AI Website Builder"
          className="glass-input w-full px-3 py-2.5 text-sm font-semibold mb-4"
        />

        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">คำอธิบาย</label>
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="อธิบายสั้นๆ ว่า category นี้ใช้กับงานแบบไหน"
          className="glass-input w-full px-3 py-2.5 text-sm resize-none h-16 mb-4"
        />

        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ไอคอน</label>
        <div className="grid grid-cols-8 gap-2 mb-4">
          {ICON_PRESETS.map(iconName => {
            const Icon = getIcon(iconName);
            return (
              <button key={iconName} onClick={() => setIcon(iconName)}
                className={cn('flex items-center justify-center h-9 rounded-lg border-2 transition-colors cursor-pointer',
                  icon === iconName ? 'border-current text-white' : 'border-slate-200 text-slate-400 hover:border-slate-300')}
                style={icon === iconName ? { backgroundColor: color, borderColor: color } : {}}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">สีหลัก (Color Theme)</label>
        <div className="flex gap-2 mb-6">
          {COLOR_PRESETS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={cn('w-7 h-7 rounded-full border-2 transition-transform cursor-pointer', color === c ? 'scale-110 border-slate-900' : 'border-transparent')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button onClick={submit} disabled={!name.trim()} className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          สร้าง Category
        </button>
      </div>
    </div>
  );
}

export function CategoryDashboardView({ categories, tasks, onEnterCategory, onCreateCategory, onDeleteCategory }: CategoryDashboardViewProps) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Project Categories</h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>เลือกประเภทงานเพื่อดูโปรเจกต์ทั้งหมดในกลุ่มนั้น</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shadow-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Create Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const Icon = getIcon(cat.icon);
          const catTasks = tasks.filter(t => t.categoryId === cat.id);
          const total = catTasks.length;
          const active = catTasks.filter(t => t.status !== 'Done' && t.status !== 'เสร็จสิ้น' && t.status !== 'Cancelled' && t.status !== 'ยกเลิก').length;
          const completed = catTasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น').length;
          const avgHealth = total > 0 ? Math.round(catTasks.reduce((s, t) => s + calculateHealthScore(t).score, 0) / total) : null;

          return (
            <div key={cat.id} className="glass-card rounded-2xl p-5 flex flex-col gap-4 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color || '#6366f1' }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
                    {cat.description && <p className="text-[11px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>{cat.description}</p>}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  title="ลบ category"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{total}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ทั้งหมด</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-black text-orange-600">{active}</p>
                  <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wide">กำลังทำ</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-black text-emerald-600">{completed}</p>
                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">เสร็จแล้ว</p>
                </div>
              </div>

              {avgHealth !== null && (
                <div className="flex items-center justify-between text-xs font-bold">
                  <span style={{ color: 'var(--text-muted)' }}>Health Score เฉลี่ย</span>
                  <span className={cn(
                    avgHealth >= 75 ? 'text-emerald-600' : avgHealth >= 50 ? 'text-amber-600' : 'text-rose-600'
                  )}>
                    {avgHealth >= 75 ? '🟢' : avgHealth >= 50 ? '🟡' : '🔴'} {avgHealth}/100
                  </span>
                </div>
              )}

              <button
                onClick={() => onEnterCategory(cat.id)}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-white/20 text-slate-700 border border-white/30 hover:bg-white/32 backdrop-blur-sm text-sm font-bold transition-colors cursor-pointer mt-auto"
              >
                Enter Category <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-slate-300">
            <FolderKanban className="w-12 h-12" />
            <p className="text-sm font-semibold">ยังไม่มี Category — สร้างอันแรกเลย</p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCategoryModal onClose={() => setShowCreate(false)} onCreate={onCreateCategory} />
      )}
    </div>
  );
}
