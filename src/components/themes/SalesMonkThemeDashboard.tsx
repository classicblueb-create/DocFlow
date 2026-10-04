import { useState } from 'react';
import { 
  TrendingUp, Download, Filter, MoreVertical, 
  ArrowUpRight, ArrowDownRight, Globe, Layers, Users as UsersIcon,
  CheckCircle, Clock, Calendar
} from 'lucide-react';
import { Task, ProjectCategory, Expense } from '../../types';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';

interface ThemeDashboardProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
  onOpenTaskModal?: () => void;
}

export function SalesMonkThemeDashboard({ tasks, categories, expenses = [] }: ThemeDashboardProps) {
  const [timeRange, setTimeRange] = useState<'monthly' | 'weekly'>('monthly');

  // Calculate live stats
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ' || t.status === 'in_progress');
  const canceledTasks = tasks.filter(t => t.status === 'Cancelled' || t.status === 'ยกเลิก' || t.status === 'blocked');
  
  const totalRevenue = completedTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 72;

  // Chart data for Area chart
  const marginChartData = [
    { name: 'ธ.ค.', value: 45 },
    { name: 'ม.ค.', value: 58 },
    { name: 'ก.พ.', value: 52 },
    { name: 'มี.ค.', value: 65 },
    { name: 'เม.ย.', value: 60 },
    { name: 'พ.ค.', value: 72 },
    { name: 'มิ.ย.', value: 78 },
    { name: 'ก.ค.', value: 75 },
    { name: 'ส.ค.', value: 82 },
    { name: 'ก.ย.', value: 80 },
    { name: 'ต.ค.', value: grossMargin },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-1 md:p-2 text-slate-800">
      
      {/* ── SalesMonk Top Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Here's your overview of your business sales.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* ── 4 Top KPI Cards (Decoded from Image 1) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Profit (Hero Blue Card with Grid Lines) */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white p-5 shadow-lg shadow-blue-500/25 flex flex-col justify-between overflow-hidden group">
          {/* Subtle Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100">Total Profit</span>
            <button className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative z-10 my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ฿{netProfit.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-400/40 text-blue-100 flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> +2.9%
              </span>
            </div>
            <p className="text-[11px] text-blue-200 font-medium mt-1">
              vs last month ฿{(netProfit * 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Card 2: Total Insight (White Card) */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Insight</span>
            <button className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                ฿{totalRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> +4.2%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              vs last month ฿{(totalRevenue * 0.88).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Card 3: Organic Sales (White Card) */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Organic Sales</span>
            <button className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                ฿{(totalRevenue * 0.75).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center gap-0.5">
                <ArrowDownRight className="w-2.5 h-2.5" /> -2.8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              vs last month ฿{(totalRevenue * 0.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Card 4: Gross Margin with Smooth Area Wave (White Card) */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Gross Margin</span>
            <button className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {grossMargin}%
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center gap-0.5">
              <ArrowUpRight className="w-2.5 h-2.5" /> +4.2%
            </span>
          </div>
          {/* Smooth Wave Chart like SalesMonk */}
          <div className="h-14 w-full -mb-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marginChartData}>
                <defs>
                  <linearGradient id="salesmonkTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0284c7" 
                  strokeWidth={2.5} 
                  fill="url(#salesmonkTeal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Middle Row: Sales Report Area & Sales Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sales Report Area (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white p-5 md:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Sales Report Area</h2>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                +4.2% vs last years
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={timeRange} 
                onChange={e => setTimeRange(e.target.value as any)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 outline-none cursor-pointer"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
              <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Colored Pillars (Profit, Insight, Sale, Target) */}
          <div className="flex items-end justify-around h-48 py-4 border-b border-slate-100">
            {/* Pillar 1: Profit (Lime Green) */}
            <div className="flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lime-100 text-lime-800">
                +9.5%
              </span>
              <div className="w-12 md:w-14 h-32 rounded-xl bg-[#84cc16] shadow-sm hover:brightness-105 transition-all" />
              <span className="text-xs font-bold text-slate-500">Profit</span>
            </div>

            {/* Pillar 2: Insight (Soft Lavender Blue) */}
            <div className="flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                +5.2%
              </span>
              <div className="w-12 md:w-14 h-24 rounded-xl bg-[#bfdbfe] shadow-sm hover:brightness-105 transition-all" />
              <span className="text-xs font-bold text-slate-500">Insight</span>
            </div>

            {/* Pillar 3: Sale (Solid Royal Blue) */}
            <div className="flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                +9.9%
              </span>
              <div className="w-12 md:w-14 h-40 rounded-xl bg-[#2563eb] shadow-md shadow-blue-500/30 hover:brightness-105 transition-all" />
              <span className="text-xs font-bold text-slate-900">Sale</span>
            </div>

            {/* Pillar 4: Target (Cyan Gradient) */}
            <div className="flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                +9.9%
              </span>
              <div className="w-12 md:w-14 h-28 rounded-xl bg-gradient-to-t from-[#06b6d4] to-[#67e8f9] shadow-sm hover:brightness-105 transition-all" />
              <span className="text-xs font-bold text-slate-500">Target</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Target overflow by ฿{(netProfit * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} profit
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-slate-900 leading-tight">
                ฿{(totalRevenue / (completedTasks.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">Per unit sales</p>
            </div>
          </div>
        </div>

        {/* Sales Activity Donut Gauge (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-5 md:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-black text-slate-900">Sales Activity</h2>
            <select className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 outline-none">
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          </div>

          {/* Radial Donut Visualization */}
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG Radial Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                <circle cx="50" cy="50" r="40" stroke="#84cc16" strokeWidth="12" strokeDasharray="60 200" fill="none" />
                <circle cx="50" cy="50" r="40" stroke="#bfdbfe" strokeWidth="12" strokeDasharray="50 200" strokeDashoffset="-65" fill="none" />
                <circle cx="50" cy="50" r="40" stroke="#2563eb" strokeWidth="12" strokeDasharray="90 200" strokeDashoffset="-120" strokeLinecap="round" fill="none" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">{tasks.length}</span>
                <span className="text-[9.5px] text-slate-400 font-semibold">Total tasks count</span>
              </div>
            </div>

            {/* Legend Column */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#84cc16]" />
                  <span className="text-lg font-black text-slate-900">{inProgressTasks.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold pl-4.5">On Process</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#bfdbfe]" />
                  <span className="text-lg font-black text-slate-900">{canceledTasks.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold pl-4.5">Canceled</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                  <span className="text-lg font-black text-slate-900">{completedTasks.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold pl-4.5">Delivered</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overall completion rate</span>
            <span className="font-bold text-slate-900">
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* ── Bottom Row: Best Sellers & Most Order by Country ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Best Sellers (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900">Best Sellers</h2>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2.5">Seller / Task</th>
                  <th className="pb-2.5">Stats</th>
                  <th className="pb-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.slice(0, 4).map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {t.name.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 truncate max-w-[180px]">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">฿{Number(t.price || 0).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        +{(4.2 + idx * 1.5).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">
                      ฿{Number(t.price || 2400).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Order by Country (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-black text-slate-900">Most Order by Country</h2>
              <p className="text-lg font-black text-[#2563eb] mt-0.5">
                ฿{(totalRevenue * 0.45).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">International Transaction</p>
            </div>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                🇺🇸 USA
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2563eb] h-full rounded-full" style={{ width: '45%' }} />
                </div>
                <span className="font-bold text-slate-900 text-[11px]">27%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                🇦🇺 Australia
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#06b6d4] h-full rounded-full" style={{ width: '32%' }} />
                </div>
                <span className="font-bold text-slate-900 text-[11px]">18%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                🇮🇹 Italy
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#84cc16] h-full rounded-full" style={{ width: '55%' }} />
                </div>
                <span className="font-bold text-slate-900 text-[11px]">35%</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Global fulfillment</span>
            <span className="text-emerald-600 font-bold">100% Operational</span>
          </div>
        </div>

      </div>

    </div>
  );
}
