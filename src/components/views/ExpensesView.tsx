import { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Plus, X, Trash2, Pencil,
  ExternalLink, CreditCard, RefreshCw, Calendar,
  TrendingUp, TrendingDown, AlertCircle, Wallet,
  Tag, Globe, Zap, BookOpen, Megaphone, Briefcase,
  LayoutGrid, Filter
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseBillingCycle } from '../../types';
import { cn } from '../../lib/utils';

const LS_KEY = 'modty_expenses';
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: any; color: string; bg: string }[] = [
  { value: 'subscription', label: 'Subscription', icon: RefreshCw,  color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/20' },
  { value: 'tools',        label: 'เครื่องมือ',    icon: Zap,        color: 'text-amber-600',  bg: 'bg-amber-500/10 border-amber-500/20' },
  { value: 'freelance',    label: 'จ้างงาน',       icon: Briefcase,  color: 'text-blue-600',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'ads',          label: 'โฆษณา',         icon: Megaphone,  color: 'text-rose-600',   bg: 'bg-rose-500/10 border-rose-500/20' },
  { value: 'software',     label: 'Software',      icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { value: 'education',    label: 'การศึกษา',      icon: BookOpen,   color: 'text-emerald-600',bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'office',       label: 'ออฟฟิศ',        icon: Globe,      color: 'text-teal-600',   bg: 'bg-teal-500/10 border-teal-500/20' },
  { value: 'other',        label: 'อื่นๆ',          icon: Tag,        color: 'text-slate-600',  bg: 'bg-slate-500/10 border-slate-500/20' },
];

const BILLING: { value: ExpenseBillingCycle; label: string }[] = [
  { value: 'monthly',  label: 'รายเดือน' },
  { value: 'yearly',   label: 'รายปี' },
  { value: 'one-time', label: 'ครั้งเดียว' },
];

const USD_RATE = 35;

function toMonthlyTHB(e: Expense): number {
  const amt = e.currency === 'USD' ? e.amount * USD_RATE : e.amount;
  if (e.billingCycle === 'monthly') return amt;
  if (e.billingCycle === 'yearly') return amt / 12;
  return 0;
}

function getCatInfo(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

function isComingSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function SummaryCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-white/40">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-semibold">{label}</p>
        <p className="text-lg font-black text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

interface ExpenseFormProps { initial?: Expense; onSave: (e: Expense) => void; onCancel: () => void; }
function ExpenseForm({ initial, onSave, onCancel }: ExpenseFormProps) {
  const blank = (): Expense => ({
    id: crypto.randomUUID(), name: '', category: 'subscription', amount: 0, currency: 'THB',
    billingCycle: 'monthly', isActive: true, createdAt: new Date().toISOString(),
    vendor: '', notes: '', nextBillingDate: '', url: '', paymentMethod: '',
  });
  const [form, setForm] = useState<Expense>(initial ?? blank());
  const set = (k: keyof Expense, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.name.trim()) return; onSave({ ...form }); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">ชื่อค่าใช้จ่าย *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="เช่น ChatGPT Plus, Figma, ..." className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">ผู้ให้บริการ</label>
          <input value={form.vendor ?? ''} onChange={e => set('vendor', e.target.value)} placeholder="OpenAI, Adobe, ..." className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">หมวดหมู่</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button type="button" key={c.value} onClick={() => set('category', c.value)}
              className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                form.category === c.value ? cn(c.bg, c.color, 'shadow-sm') : 'bg-white/30 border-white/40 text-slate-500 hover:bg-white/50')}>
              <c.icon className="w-3 h-3" />{c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">จำนวนเงิน *</label>
          <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">สกุลเงิน</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50">
            <option value="THB">THB ฿</option>
            <option value="USD">USD $</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">รอบการจ่าย</label>
          <select value={form.billingCycle} onChange={e => set('billingCycle', e.target.value as ExpenseBillingCycle)} className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50">
            {BILLING.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">วันชำระถัดไป</label>
          <input type="date" value={form.nextBillingDate ?? ''} onChange={e => set('nextBillingDate', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">URL / เว็บไซต์</label>
          <input type="url" value={form.url ?? ''} onChange={e => set('url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">วิธีชำระ</label>
          <input value={form.paymentMethod ?? ''} onChange={e => set('paymentMethod', e.target.value)} placeholder="บัตรเครดิต, PayPal, ..." className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">หมายเหตุ</label>
          <input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="..." className="w-full px-3 py-2 rounded-xl border border-white/50 bg-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div onClick={() => set('isActive', !form.isActive)} className={cn('w-9 h-5 rounded-full relative transition-colors cursor-pointer', form.isActive ? 'bg-emerald-500' : 'bg-slate-300')}>
          <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.isActive ? 'translate-x-4' : 'translate-x-0.5')} />
        </div>
        <span className="text-xs font-semibold text-slate-700">{form.isActive ? 'ใช้งานอยู่' : 'หยุดใช้งาน'}</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/50 text-sm text-slate-600 hover:bg-white/40 transition-all">ยกเลิก</button>
        <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all">{initial ? 'บันทึก' : 'เพิ่ม'}</button>
      </div>
    </form>
  );
}

function ExpenseCard({ expense, onDelete, onUpdate }: { expense: Expense; onDelete: (id: string) => void; onUpdate: (e: Expense) => void }) {
  const [editing, setEditing] = useState(false);
  const cat = getCatInfo(expense.category);
  const monthly = toMonthlyTHB(expense);
  const soon = isComingSoon(expense.nextBillingDate);

  return (
    <div className={cn('glass-card rounded-2xl border overflow-hidden transition-all hover:shadow-md',
      expense.isActive ? 'border-white/40' : 'border-slate-200/50 opacity-60',
      soon && 'border-amber-400/60')}>
      {editing ? (
        <div className="p-4">
          <ExpenseForm initial={expense} onSave={(updated) => { onUpdate(updated); setEditing(false); }} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border', cat.bg)}>
              <cat.icon className={cn('w-4 h-4', cat.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-slate-800 truncate">{expense.name}</span>
                {!expense.isActive && <span className="text-[9px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">หยุดใช้</span>}
                {soon && (
                  <span className="text-[9px] font-black bg-amber-400/20 text-amber-700 border border-amber-400/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" /> ครบกำหนดเร็วๆ นี้
                  </span>
                )}
              </div>
              {expense.vendor && <p className="text-[11px] text-slate-500">{expense.vendor}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {expense.url && (
                <a href={expense.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/40 text-slate-400 hover:text-indigo-600 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-white/40 text-slate-400 hover:text-slate-700 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(expense.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-slate-800">
                {expense.currency === 'USD' ? '$' : '฿'}{expense.amount.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold ml-0.5">
                / {BILLING.find(b => b.value === expense.billingCycle)?.label}
              </span>
            </div>
            {expense.billingCycle === 'yearly' && (
              <span className="text-[10px] text-slate-400">(≈ ฿{monthly.toLocaleString(undefined,{maximumFractionDigits:0})}/เดือน)</span>
            )}
            {expense.currency === 'USD' && expense.billingCycle !== 'one-time' && (
              <span className="text-[10px] text-slate-400">(≈ ฿{monthly.toLocaleString(undefined,{maximumFractionDigits:0})}/เดือน)</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cat.bg, cat.color)}>{cat.label}</span>
            {expense.paymentMethod && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-0.5">
                <CreditCard className="w-2.5 h-2.5" />{expense.paymentMethod}
              </span>
            )}
            {expense.nextBillingDate && (
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-0.5',
                soon ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                <Calendar className="w-2.5 h-2.5" />{formatDate(expense.nextBillingDate)}
              </span>
            )}
          </div>
          {expense.notes && <p className="mt-2 text-[11px] text-slate-500 italic leading-relaxed">{expense.notes}</p>}
        </div>
      )}
    </div>
  );
}

export interface ExpensesViewProps {
  expenses?: Expense[];
  onSaveExpense?: (e: Expense) => Promise<void> | void;
  onUpdateExpense?: (e: Expense) => Promise<void> | void;
  onDeleteExpense?: (id: string) => Promise<void> | void;
}

export function ExpensesView({
  expenses: expensesProp,
  onSaveExpense,
  onUpdateExpense,
  onDeleteExpense,
}: ExpensesViewProps = {}) {
  const [localExpenses, setLocalExpenses] = useState<Expense[]>(() => lsGet<Expense[]>(LS_KEY, []));
  const expenses = expensesProp ?? localExpenses;
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | 'all'>('all');
  const [filterCycle, setFilterCycle] = useState<ExpenseBillingCycle | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    if (!expensesProp) {
      lsSet(LS_KEY, localExpenses);
    }
  }, [localExpenses, expensesProp]);

  const addExpense = async (e: Expense) => {
    if (onSaveExpense) {
      await onSaveExpense(e);
    } else {
      setLocalExpenses(prev => [e, ...prev]);
    }
    setShowForm(false);
  };

  const updateExpense = async (updated: Expense) => {
    if (onUpdateExpense) {
      await onUpdateExpense(updated);
    } else {
      setLocalExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    }
  };

  const deleteExpense = async (id: string) => {
    if (onDeleteExpense) {
      await onDeleteExpense(id);
    } else {
      if (!confirm('ลบรายการนี้?')) return;
      setLocalExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const activeExpenses = useMemo(() => expenses.filter(e => e.isActive), [expenses]);
  const monthlyTotal = useMemo(() => activeExpenses.reduce((sum, e) => sum + toMonthlyTHB(e), 0), [activeExpenses]);
  const yearlyTotal = monthlyTotal * 12;
  const oneTimeTHB = useMemo(() =>
    expenses.filter(e => e.billingCycle === 'one-time')
      .reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * USD_RATE : e.amount), 0),
    [expenses]);
  const comingSoon = useMemo(() => activeExpenses.filter(e => isComingSoon(e.nextBillingDate)), [activeExpenses]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    activeExpenses.forEach(e => { const m = toMonthlyTHB(e); if (m > 0) map[e.category] = (map[e.category] ?? 0) + m; });
    return Object.entries(map).sort(([,a],[,b]) => b - a).map(([cat, amount]) => ({ cat: cat as ExpenseCategory, amount }));
  }, [activeExpenses]);

  const filtered = useMemo(() => expenses.filter(e => {
    if (!showInactive && !e.isActive) return false;
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    if (filterCycle !== 'all' && e.billingCycle !== filterCycle) return false;
    return true;
  }), [expenses, filterCat, filterCycle, showInactive]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-sm">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-800 text-xl leading-tight">ค่าใช้จ่ายของฉัน</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Synced
              </span>
            </div>
            <p className="text-xs text-slate-500">Subscriptions · เครื่องมือ · จ้างงาน</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all">
          <Plus className="w-4 h-4" /> เพิ่มรายการ
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="รายจ่ายต่อเดือน" value={`฿${monthlyTotal.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub={`${activeExpenses.filter(e=>e.billingCycle!=='one-time').length} รายการ`} icon={Wallet} color="bg-rose-500/10 text-rose-600" />
        <SummaryCard label="คาดการณ์ต่อปี" value={`฿${yearlyTotal.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="รายการ recurring เท่านั้น" icon={TrendingUp} color="bg-indigo-500/10 text-indigo-600" />
        <SummaryCard label="ซื้อครั้งเดียว (รวม)" value={`฿${oneTimeTHB.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub={`${expenses.filter(e=>e.billingCycle==='one-time').length} รายการ`} icon={TrendingDown} color="bg-amber-500/10 text-amber-600" />
        <SummaryCard label="ครบกำหนดเร็วๆ นี้" value={`${comingSoon.length} รายการ`} sub="ภายใน 7 วัน" icon={AlertCircle} color={comingSoon.length > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-slate-100 text-slate-400'} />
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-white/40">
          <p className="text-xs font-black text-slate-600 mb-3 tracking-wide uppercase">สัดส่วนรายจ่ายรายเดือน (ตามหมวด)</p>
          <div className="space-y-2">
            {categoryBreakdown.map(({ cat, amount }) => {
              const info = getCatInfo(cat);
              const pct = monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0;
              const barColor = info.color.replace('text-','bg-');
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0 border', info.bg)}>
                    <info.icon className={cn('w-3 h-3', info.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                      <span>{info.label}</span>
                      <span>฿{amount.toLocaleString(undefined,{maximumFractionDigits:0})} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-5 border border-indigo-400/30 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-800">เพิ่มค่าใช้จ่ายใหม่</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/40 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ExpenseForm onSave={addExpense} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-[11px] font-bold text-slate-500 mr-1">กรอง:</span>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value as ExpenseCategory | 'all')} className="px-3 py-1 rounded-lg border border-white/50 bg-white/40 text-xs font-semibold text-slate-700 focus:outline-none">
          <option value="all">ทุกหมวด</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filterCycle} onChange={e => setFilterCycle(e.target.value as ExpenseBillingCycle | 'all')} className="px-3 py-1 rounded-lg border border-white/50 bg-white/40 text-xs font-semibold text-slate-700 focus:outline-none">
          <option value="all">ทุกรอบ</option>
          {BILLING.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1">
          <div onClick={() => setShowInactive(v => !v)} className={cn('w-7 h-4 rounded-full relative transition-colors cursor-pointer', showInactive ? 'bg-indigo-400' : 'bg-slate-200')}>
            <span className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform', showInactive ? 'translate-x-3' : 'translate-x-0.5')} />
          </div>
          <span className="text-xs font-semibold text-slate-500">แสดงที่หยุดใช้</span>
        </label>
        <span className="ml-auto text-[11px] text-slate-400 font-semibold">{filtered.length} รายการ</span>
      </div>

      {/* Expense grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
            <Receipt className="w-7 h-7 text-rose-400" />
          </div>
          <p className="font-bold text-slate-600">ยังไม่มีค่าใช้จ่าย</p>
          <p className="text-xs text-slate-400 mt-1">กด "เพิ่มรายการ" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => <ExpenseCard key={e.id} expense={e} onDelete={deleteExpense} onUpdate={updateExpense} />)}
        </div>
      )}
    </div>
  );
}
