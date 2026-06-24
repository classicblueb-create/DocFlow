import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Check } from 'lucide-react';
import type { Product } from '../../types';
import { loadProducts, saveProduct, deleteProduct } from '../../lib/db';

interface Props {
  showNotification: (msg: string, isError?: boolean) => void;
}

const CATEGORIES: Product['category'][] = ['คอร์ส', 'ebook', 'template', 'preset', 'อื่นๆ'];
const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'Website', 'อื่นๆ'];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function daysInMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function todayDay() {
  return new Date().getDate();
}

export function ProductRevenueWidget({ showNotification }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', targetUnits: '', platform: 'TikTok', category: 'คอร์ส' as Product['category'] });

  useEffect(() => {
    loadProducts(currentMonth()).then(setProducts).catch(console.error);
  }, []);

  const resetForm = () => setForm({ name: '', price: '', targetUnits: '', platform: 'TikTok', category: 'คอร์ส' });

  const handleAdd = async () => {
    if (!form.name || !form.price) return;
    const p: Product = {
      id: `prod-${Date.now()}`,
      name: form.name,
      price: parseFloat(form.price) || 0,
      targetUnits: parseInt(form.targetUnits) || 0,
      soldUnits: 0,
      month: currentMonth(),
      platform: form.platform,
      category: form.category,
      createdAt: new Date().toISOString(),
    };
    await saveProduct(p).catch(console.error);
    setProducts(prev => [...prev, p]);
    resetForm();
    setAdding(false);
    showNotification('เพิ่ม product แล้ว');
  };

  const handleSoldChange = async (id: string, delta: number) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const updated = { ...p, soldUnits: Math.max(0, p.soldUnits + delta) };
    setProducts(prev => prev.map(x => x.id === id ? updated : x));
    await saveProduct(updated).catch(console.error);
  };

  const handleDelete = async (id: string) => {
    setProducts(prev => prev.filter(x => x.id !== id));
    await deleteProduct(id).catch(console.error);
    showNotification('ลบ product แล้ว');
  };

  const handleEditSave = async (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    await saveProduct(p).catch(console.error);
    setEditing(null);
    showNotification('บันทึกแล้ว');
  };

  const totalRevenue = products.reduce((s, p) => s + p.price * p.soldUnits, 0);
  const totalTarget  = products.reduce((s, p) => s + p.price * p.targetUnits, 0);
  const dayProgress  = todayDay() / daysInMonth();
  const forecast     = products.reduce((s, p) => {
    if (p.soldUnits === 0 || todayDay() === 0) return s;
    const pace = p.soldUnits / todayDay();
    return s + pace * daysInMonth() * p.price;
  }, 0);

  return (
    <div className="glass-card rounded-[24px] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Digital Products</h2>
          <p className="text-xs text-slate-400 mt-0.5">คาดการณ์รายได้ · {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditing(null); }}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่ม
        </button>
      </div>

      {/* Summary bar */}
      {products.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>ยอดจริง <span className="text-slate-800 text-sm">฿{totalRevenue.toLocaleString()}</span></span>
            <span>เป้า <span className="text-slate-800 text-sm">฿{totalTarget.toLocaleString()}</span></span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${Math.min(100, totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>วันที่ {todayDay()} / {daysInMonth()} ({Math.round(dayProgress * 100)}% ของเดือน)</span>
            <span className="text-emerald-600 font-bold">คาดการณ์ปลายเดือน: ฿{Math.round(forecast).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-indigo-50/60 rounded-2xl p-4 flex flex-col gap-3 border border-indigo-100">
          <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">Product ใหม่</p>
          <input
            autoFocus
            placeholder="ชื่อ product เช่น คอร์ส RAG AI"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">ราคา/ชิ้น (฿)</label>
              <input type="number" placeholder="2500" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">เป้าเดือนนี้ (ชิ้น)</label>
              <input type="number" placeholder="20" value={form.targetUnits} onChange={e => setForm(f => ({ ...f, targetUnits: e.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none">
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">ประเภท</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Product['category'] }))}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); resetForm(); }} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 cursor-pointer">ยกเลิก</button>
            <button onClick={handleAdd} disabled={!form.name || !form.price}
              className="flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 cursor-pointer transition-colors">
              <Check className="w-3.5 h-3.5" /> บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="flex flex-col gap-3">
        {products.length === 0 && !adding && (
          <p className="text-center text-xs text-slate-400 py-4">ยังไม่มี digital product — กด เพิ่ม เพื่อเริ่ม</p>
        )}
        {products.map(p => {
          const revenue    = p.price * p.soldUnits;
          const target     = p.price * p.targetUnits;
          const pct        = target > 0 ? Math.min(100, (revenue / target) * 100) : 0;
          const pace       = todayDay() > 0 ? (p.soldUnits / todayDay()) * daysInMonth() : 0;
          const forecasted = Math.round(pace * p.price);
          const isEdit     = editing === p.id;

          return (
            <div key={p.id} className="bg-white/60 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {isEdit ? (
                    <input value={p.name} onChange={e => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))}
                      className="glass-input w-full rounded-lg px-2 py-1 text-sm font-bold outline-none" autoFocus />
                  ) : (
                    <p className="text-sm font-black text-slate-800 truncate">{p.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{p.category}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">{p.platform}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-indigo-500 font-bold">฿{p.price.toLocaleString()}/ชิ้น</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isEdit ? (
                    <>
                      <button onClick={() => handleEditSave(p.id)} className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center cursor-pointer hover:bg-emerald-200"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditing(null)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer hover:bg-slate-200"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing(p.id)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-200"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(p.id)} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-400 flex items-center justify-center cursor-pointer hover:bg-rose-100"><Trash2 className="w-3 h-3" /></button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="flex flex-col gap-1.5">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : '#f59e0b' }} />
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">ขายแล้ว <span className="font-black text-slate-700">{p.soldUnits}</span> / {p.targetUnits} ชิ้น · ฿{revenue.toLocaleString()}</span>
                  <span className="text-emerald-600 font-bold">คาดปลายเดือน ฿{forecasted.toLocaleString()}</span>
                </div>
              </div>

              {/* Sold counter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold">อัปเดตยอดขาย:</span>
                <button onClick={() => handleSoldChange(p.id, -1)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200 font-black"><ChevronDown className="w-4 h-4" /></button>
                <span className="text-sm font-black text-slate-800 w-8 text-center">{p.soldUnits}</span>
                <button onClick={() => handleSoldChange(p.id, 1)} className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center cursor-pointer hover:bg-indigo-200 font-black"><ChevronUp className="w-4 h-4" /></button>
                {isEdit && (
                  <input type="number" value={p.soldUnits} onChange={e => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, soldUnits: parseInt(e.target.value) || 0 } : x))}
                    className="glass-input w-20 rounded-lg px-2 py-1 text-sm outline-none ml-2" placeholder="กรอกตรง" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
