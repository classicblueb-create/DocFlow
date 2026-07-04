import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, Lightbulb, Users, Video, ChevronRight } from 'lucide-react';
import { Task, Client, Idea, ContentPlan } from '../types';
import { cn } from '../lib/utils';

interface GlobalSearchProps {
  tasks: Task[];
  clients: Client[];
  ideas: Idea[];
  contentPlans: ContentPlan[];
  onTaskClick: (task: Task) => void;
  onViewChange: (view: string) => void;
  onClose: () => void;
}

interface SearchResult {
  type: 'task' | 'client' | 'idea' | 'content';
  id: string;
  title: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  data: Task | Client | Idea | ContentPlan;
}

export function GlobalSearch({ tasks, clients, ideas, contentPlans, onTaskClick, onViewChange, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    tasks.forEach(t => {
      if (t.name?.toLowerCase().includes(q) || t.customer?.toLowerCase().includes(q) || t.details?.toLowerCase().includes(q)) {
        const isDone = t.status === 'Done' || t.status === 'เสร็จสิ้น';
        out.push({
          type: 'task', id: String(t.id), title: t.name,
          sub: [t.customer, t.endDate, t.assignee].filter(Boolean).join(' · '),
          badge: t.status, badgeColor: isDone ? 'bg-emerald-500/15 text-emerald-700' : 'bg-indigo-500/15 text-indigo-700',
          data: t,
        });
      }
    });

    clients.forEach(c => {
      if (c.name?.toLowerCase().includes(q) || c.contactName?.toLowerCase().includes(q)) {
        out.push({
          type: 'client', id: c.id, title: c.name,
          sub: [c.contactName, c.email, c.phone].filter(Boolean).join(' · '),
          badge: 'Client', badgeColor: 'bg-blue-500/15 text-blue-700',
          data: c,
        });
      }
    });

    ideas.forEach(i => {
      if (i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)) {
        out.push({
          type: 'idea', id: i.id, title: i.title,
          sub: [i.category, i.status, i.priority].filter(Boolean).join(' · '),
          badge: 'ไอเดีย', badgeColor: 'bg-amber-500/15 text-amber-700',
          data: i,
        });
      }
    });

    contentPlans.forEach(p => {
      if (p.title?.toLowerCase().includes(q) || p.concept?.toLowerCase().includes(q)) {
        out.push({
          type: 'content', id: p.id, title: p.title,
          sub: [p.platform, p.status].filter(Boolean).join(' · '),
          badge: p.platform, badgeColor: 'bg-violet-500/15 text-violet-700',
          data: p,
        });
      }
    });

    return out.slice(0, 12);
  }, [query, tasks, clients, ideas, contentPlans]);

  useEffect(() => { setSelected(0); }, [results]);

  const handleSelect = (r: SearchResult) => {
    if (r.type === 'task') { onTaskClick(r.data as Task); }
    else if (r.type === 'client') { onViewChange('clients'); }
    else if (r.type === 'idea') { onViewChange('ideas'); }
    else if (r.type === 'content') { onViewChange('content-plan'); }
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) { handleSelect(results[selected]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, selected]);

  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const ICONS = { task: FileText, client: Users, idea: Lightbulb, content: Video };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหางาน, ลูกค้า, ไอเดีย, content..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-300 hover:text-slate-500 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-bold text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400 font-semibold">ไม่พบผลลัพธ์</div>
            ) : (
              results.map((r, i) => {
                const Icon = ICONS[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer',
                      i === selected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', i === selected ? 'bg-indigo-100' : 'bg-slate-100')}>
                      <Icon className={cn('w-4 h-4', i === selected ? 'text-indigo-600' : 'text-slate-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{r.title}</p>
                      {r.sub && <p className="text-[11px] text-slate-400 font-medium truncate">{r.sub}</p>}
                    </div>
                    {r.badge && (
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', r.badgeColor)}>{r.badge}</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">
            พิมพ์เพื่อค้นหา · ↑↓ เลือก · Enter เปิด
          </div>
        )}
      </div>
    </div>
  );
}
