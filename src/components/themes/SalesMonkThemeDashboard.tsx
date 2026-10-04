import { useState, useMemo } from 'react';
import { 
  TrendingUp, Download, Filter, MoreVertical, 
  ArrowUpRight, ArrowDownRight, FolderKanban, Layers, Users as UsersIcon,
  CheckCircle, Clock, Calendar, DollarSign
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
  const pendingTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ' || t.status === 'todo');
  const canceledTasks = tasks.filter(t => t.status === 'Cancelled' || t.status === 'ยกเลิก' || t.status === 'blocked');
  
  const totalRevenue = completedTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 72;
  const pendingValue = inProgressTasks.reduce((s, t) => s + (Number(t.price) || 0), 0);

  // Top revenue tasks
  const topTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
      .slice(0, 4);
  }, [tasks]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    if (categories.length === 0) {
      return [
        { name: 'เว็บ & แอปพลิเคชัน', count: 12, pct: 45, color: '#2563eb' },
        { name: 'ออกแบบ UI/UX', count: 8, pct: 32, color: '#06b6d4' },
        { name: 'การตลาด & แบรนด์', count: 5, pct: 23, color: '#84cc16' },
      ];
    }
    const total = tasks.length || 1;
    return categories.slice(0, 4).map((c, i) => {
      const count = tasks.filter(t => t.categoryId === c.id).length;
      const pct = Math.round((count / total) * 100);
      const colors = ['#2563eb', '#06b6d4', '#84cc16', '#f59e0b'];
      return {
        name: c.name,
        count,
        pct: pct || (25 + i * 5),
        color: c.color || colors[i % colors.length],
      };
    });
  }, [tasks, categories]);

  // Chart data for Area chart
  const marginChartData = [
    { name: 'พ.ค.', value: 55 },
    { name: 'มิ.ย.', value: 68 },
    { name: 'ก.ค.', value: 62 },
    { name: 'ส.ค.', value: 74 },
    { name: 'ก.ย.', value: 71 },
    { name: 'ต.ค.', value: Math.max(grossMargin, 40) },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-1 md:p-2 text-slate-800">
      
      {/* ── SalesMonk Top Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ภาพรวมผลงาน & รายได้ (SalesMonk Dashboard)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            สรุปสถานะโครงการ รายรับ และอัตรากำไรธุรกิจ ModtyTasks ของคุณ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>ปี 2026 (ปีปัจจุบัน)</span>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export รายงาน</span>
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
            <span className="text-xs font-semibold text-blue-100">กำไรสุทธิ (Net Profit)</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ฿{netProfit.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-400/40 text-blue-100 flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> +{grossMargin}%
              </span>
            </div>
            <p className="text-[11px] text-blue-200 font-medium mt-1">
              จากรายรับรวม ฿{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 2: Completed Tasks (White Card) */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">งานที่เสร็จสิ้น (Delivered)</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {completedTasks.length} งาน
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" /> {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              จากทั้งหมด {tasks.length} รายการงาน
            </p>
          </div>
        </div>

        {/* Card 3: Active Projects Value (White Card) */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">มูลค่างานกำลังทำ (In Progress)</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                ฿{pendingValue.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
                {inProgressTasks.length} โปรเจกต์
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              รอส่งมอบและปิดรอบบิล
            </p>
          </div>
        </div>

        {/* Card 4: Gross Margin with Smooth Area Wave (White Card) */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">อัตรากำไร (Gross Margin)</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {grossMargin}%
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                Healthy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              หลังหักค่าใช้จ่าย ฿{totalExpenses.toLocaleString()}
            </p>
          </div>
          {/* Sparkline Wave Chart */}
          <div className="h-10 -mx-5 -mb-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marginChartData}>
                <defs>
                  <linearGradient id="marginWave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0d9488" 
                  strokeWidth={2.5} 
                  fill="url(#marginWave)" 
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Middle Section: Sales Report (4 Pillars) & Sales Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sales Report (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-white p-5 md:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">สรุปความเคลื่อนไหวทางธุรกิจ (Business Report)</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                เปรียบเทียบรายได้ที่เกิดขึ้นจริง vs ค่าใช้จ่าย
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTimeRange('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === 'monthly'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                รายเดือน
              </button>
              <button 
                onClick={() => setTimeRange('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === 'weekly'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                รายสัปดาห์
              </button>
            </div>
          </div>

          {/* 4 Pillars Visual Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100">
            {/* Pillar 1 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400">ปิดดีลแล้ว (Won)</span>
              <p className="text-xl font-black text-slate-900">฿{totalRevenue.toLocaleString()}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563eb] h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <span className="text-[10px] text-slate-400">{completedTasks.length} งานสำเร็จ</span>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400">กำลังดำเนินการ</span>
              <p className="text-xl font-black text-slate-900">฿{pendingValue.toLocaleString()}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#38bdf8] h-full rounded-full" style={{ width: '60%' }} />
              </div>
              <span className="text-[10px] text-slate-400">{inProgressTasks.length} งานรอตรวจ</span>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400">ค่าใช้จ่ายรวม</span>
              <p className="text-xl font-black text-slate-900">฿{totalExpenses.toLocaleString()}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#f43f5e] h-full rounded-full" style={{ width: '40%' }} />
              </div>
              <span className="text-[10px] text-slate-400">{expenses.length} รายการ</span>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400">กำไรสุทธิ</span>
              <p className="text-xl font-black text-emerald-600">฿{netProfit.toLocaleString()}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: '90%' }} />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">มาร์จิ้น {grossMargin}%</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>ฐานข้อมูล Supabase Cloud ซิงค์ล่าสุดแบบ Realtime</span>
            <span className="text-blue-600 font-bold cursor-pointer hover:underline">ดูรายละเอียดเต็ม &rarr;</span>
          </div>
        </div>

        {/* Sales Activity: Donut Gauge (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-white p-5 md:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-black text-slate-900">สถานะงาน (Task Activity)</h2>
            <span className="text-xs text-slate-400 font-medium">ทั้งหมด {tasks.length} งาน</span>
          </div>

          <div className="flex items-center justify-around my-4">
            {/* Radial Center Meter */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                {/* Completed circle slice */}
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="#2563eb" strokeWidth="12" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 * (1 - (tasks.length > 0 ? completedTasks.length / tasks.length : 0.68))} 
                  strokeLinecap="round" 
                  fill="none" 
                />
                {/* In Progress slice */}
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="#84cc16" strokeWidth="12" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 * (1 - (tasks.length > 0 ? inProgressTasks.length / tasks.length : 0.24))} 
                  strokeLinecap="round" 
                  fill="none" 
                  className="opacity-70"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">{tasks.length}</span>
                <span className="text-[10px] text-slate-400 font-bold">TOTAL TASKS</span>
              </div>
            </div>

            {/* Legend Column */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                  <span className="text-lg font-black text-slate-900">{completedTasks.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold pl-4.5">เสร็จสิ้น (Delivered)</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#84cc16]" />
                  <span className="text-lg font-black text-slate-900">{inProgressTasks.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold pl-4.5">กำลังทำ (In Progress)</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]" />
                  <span className="text-lg font-black text-slate-900">{pendingTasks.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold pl-4.5">รอดำเนินการ (To Do)</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>อัตราความสำเร็จโดยรวม</span>
            <span className="font-bold text-slate-900">
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* ── Bottom Row: Top Revenue Projects & Projects by Category ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Top Revenue Projects (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">งานและดีลมูลค่าสูงสุด (Top Revenue Projects)</h2>
              <p className="text-xs text-slate-400 font-medium">โปรเจกต์ที่สร้างมูลค่ามากที่สุดใน ModtyTasks</p>
            </div>
            <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {topTasks.length} งานเด่น
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2.5">ชื่องาน / ลูกค้า</th>
                  <th className="pb-2.5">สถานะ</th>
                  <th className="pb-2.5 text-right">มูลค่า (THB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topTasks.map((t) => {
                  const isWon = t.status === 'Done' || t.status === 'เสร็จสิ้น';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                          {t.name.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 truncate max-w-[200px]">{t.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {t.customer || 'งานภายในองค์กร'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isWon
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">
                        ฿{Number(t.price || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Projects by Category (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-black text-slate-900">สัดส่วนงานตามหมวดหมู่ (Categories)</h2>
              <p className="text-lg font-black text-[#2563eb] mt-0.5">
                ฿{totalRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">ยอดรวมจากทุกประเภทโครงการ</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3 py-2">
            {categoryStats.map((cat, idx) => (
              <div key={cat.name + idx} className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-2 truncate max-w-[140px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(cat.pct, 100)}%`, backgroundColor: cat.color }} 
                    />
                  </div>
                  <span className="font-bold text-slate-900 text-[11px] w-8 text-right">{cat.count} งาน</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>การกระจายตัวของงาน</span>
            <span className="text-blue-600 font-bold">จัดการแล้วในระบบ</span>
          </div>
        </div>

      </div>

    </div>
  );
}
