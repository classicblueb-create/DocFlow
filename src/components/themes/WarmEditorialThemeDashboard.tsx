import { useState, useMemo } from 'react';
import { 
  Laptop, Video, Briefcase, Box, Star, 
  Calendar as CalendarIcon, CheckCircle2, ArrowRight, User, TrendingUp, Sparkles, FolderKanban
} from 'lucide-react';
import { Task, ProjectCategory, Expense } from '../../types';

interface ThemeDashboardProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
  onOpenTaskModal?: () => void;
}

export function WarmEditorialThemeDashboard({ tasks, categories, expenses = [] }: ThemeDashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ' || t.status === 'in_progress');
  const totalRevenue = completedTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Filter tasks by selected category
  const filteredTasks = useMemo(() => {
    if (selectedFilter === 'All') return tasks;
    return tasks.filter(t => t.categoryId === selectedFilter);
  }, [tasks, selectedFilter]);

  const getCatName = (catId?: string) => {
    return categories.find(c => c.id === catId)?.name || 'ทั่วไป';
  };

  // 4 Top Featured Projects to show in the 2x2 Sorbet Pastel Cards
  const featuredProjects = useMemo(() => {
    return filteredTasks.slice(0, 4);
  }, [filteredTasks]);

  // Monthly activity data for stacked bar chart
  const activityData = [
    { day: 'จ.', val1: 40, val2: 25, val3: 35 },
    { day: 'อ.', val1: 65, val2: 20, val3: 15 },
    { day: 'พ.', val1: 45, val2: 30, val3: 25 },
    { day: 'พฤ.', val1: 80, val2: 15, val3: 5 },
    { day: 'ศ.', val1: 70, val2: 20, val3: 10 },
    { day: 'ส.', val1: 30, val2: 40, val3: 30 },
    { day: 'อา.', val1: 20, val2: 30, val3: 50 },
  ];

  // 4 Color Palettes for the 2x2 cards (Peach, Apricot, Lavender, Pistachio)
  const cardPalettes = [
    { bg: 'bg-[#ffdac6]', border: 'border-[#fdba99]/60', tagBg: 'bg-white/80', tagText: 'text-[#9a3412]', fill: '#ea580c' },
    { bg: 'bg-[#fed7aa]', border: 'border-[#fdba74]/60', tagBg: 'bg-white/80', tagText: 'text-[#9a3412]', fill: '#ea580c' },
    { bg: 'bg-[#e9d5ff]', border: 'border-[#d8b4fe]/60', tagBg: 'bg-white/80', tagText: 'text-[#6b21a8]', fill: '#9333ea' },
    { bg: 'bg-[#d1fae5]', border: 'border-[#a7f3d0]/60', tagBg: 'bg-white/80', tagText: 'text-[#065f46]', fill: '#059669' },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-1 md:p-3 text-[#1c1917]">
      
      {/* ── Main Layout: Left Editorial Canvas + Right Profile Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Big Editorial Heading, Filters, 2x2 Pastel Cards (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Big Editorial Heading */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#78716c] mb-1 block">
              ModtyTasks Editorial Overview
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-[#1c1917] tracking-tight leading-tight">
              สร้างสรรค์ผลงาน<br />และขยายธุรกิจของคุณ
            </h1>
          </div>

          {/* Category Filter Pills (Black Capsule for Active - Decoded from Image 3) */}
          <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedFilter('All')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'All'
                  ? 'bg-[#1c1917] text-[#faf6ee] shadow-sm'
                  : 'bg-white/80 border border-[#ede5d8] text-[#57534e] hover:bg-white hover:text-[#1c1917]'
              }`}
            >
              <span>ทั้งหมด ({tasks.length})</span>
            </button>
            {categories.slice(0, 5).map((cat) => {
              const isActive = selectedFilter === cat.id || selectedFilter === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFilter(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1c1917] text-[#faf6ee] shadow-sm'
                      : 'bg-white/80 border border-[#ede5d8] text-[#57534e] hover:bg-white hover:text-[#1c1917]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#f59e0b' }} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Section Divider */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-[#78716c] uppercase tracking-wider">
              โครงการเด่น & งานสำคัญ (Featured Projects)
            </span>
            <span className="text-xs font-semibold text-[#a8a29e]">
              แสดง {featuredProjects.length} จาก {filteredTasks.length} รายการ
            </span>
          </div>

          {/* ── 2x2 Rich Pastel Sorbet Cards (Decoded from Image 3) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featuredProjects.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-sm font-semibold text-[#78716c] bg-white/60 rounded-3xl border border-[#ede5d8]">
                ยังไม่มีงานในหมวดหมู่นี้
              </div>
            ) : (
              featuredProjects.map((t, idx) => {
                const p = cardPalettes[idx % cardPalettes.length];
                const isWon = t.status === 'Done' || t.status === 'เสร็จสิ้น';
                return (
                  <div 
                    key={t.id} 
                    className={`rounded-3xl p-5 md:p-6 ${p.bg} border ${p.border} flex flex-col justify-between shadow-xs hover:shadow-md transition-all group min-h-[220px]`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${p.tagBg} ${p.tagText} text-[10px] font-bold truncate max-w-[140px]`}>
                          <FolderKanban className="w-3 h-3 shrink-0" />
                          <span className="truncate">{getCatName(t.categoryId)}</span>
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${p.tagBg} ${p.tagText} text-[10px] font-bold`}>
                          {t.status}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-black text-[#1c1917] leading-snug mt-4 mb-2 line-clamp-2">
                        {t.name}
                      </h3>
                      <p className="text-xs font-medium text-[#78716c] truncate">
                        ลูกค้า: {t.customer || 'งานภายในองค์กร'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-black/10">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c]">มูลค่างาน</span>
                        <p className="text-sm font-black text-[#1c1917]">
                          ฿{Number(t.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-[#78716c]">กำหนดส่ง</span>
                        <p className="text-xs font-bold text-[#1c1917]">
                          {t.endDate || t.startDate || 'เร็วๆ นี้'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Profile & Multi-Color Stacked Bar Activity (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* User Profile Card (Decoded from Annette Black card) */}
          <div className="rounded-3xl p-6 bg-white border border-[#ede5d8] shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fed7aa] to-[#ffdac6] border-2 border-[#1c1917] flex items-center justify-center text-2xl font-black text-[#1c1917] shadow-xs">
                M
              </div>
              <div>
                <h3 className="font-black text-lg text-[#1c1917]">Modty</h3>
                <p className="text-xs font-semibold text-[#78716c]">DocFlow & ModtyTasks Lead</p>
              </div>
            </div>

            {/* Quick Stat Pill Chips */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#faf6ee] border border-[#ede5d8]">
                <span className="text-[10px] font-bold text-[#78716c] uppercase">งานที่เสร็จแล้ว</span>
                <p className="text-xl font-black text-[#1c1917] mt-0.5">{completedTasks.length} งาน</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#faf6ee] border border-[#ede5d8]">
                <span className="text-[10px] font-bold text-[#78716c] uppercase">กำไรสุทธิ</span>
                <p className="text-xl font-black text-emerald-700 mt-0.5">฿{netProfit.toLocaleString()}</p>
              </div>
            </div>

            {/* Stacked Activity Bar Chart (Multi-color bar chart) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#1c1917]">สถิติการส่งมอบงาน (Output Activity)</span>
                <span className="text-[10px] font-bold text-[#78716c]">รายสัปดาห์</span>
              </div>

              {/* Multi-color stacked bars */}
              <div className="flex items-end justify-between gap-2 h-32 pt-2 px-1 border-b border-[#ede5d8]">
                {activityData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full max-w-[18px] flex flex-col rounded-t-md overflow-hidden" style={{ height: `${d.val1 + d.val2}%` }}>
                      {/* Top bar (Black) */}
                      <div className="w-full bg-[#1c1917]" style={{ height: `${d.val1}%` }} />
                      {/* Mid bar (Warm Apricot) */}
                      <div className="w-full bg-[#fed7aa]" style={{ height: `${d.val2}%` }} />
                      {/* Bottom bar (Pistachio) */}
                      <div className="w-full bg-[#a7f3d0]" style={{ height: `${d.val3}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-[#78716c]">{d.day}</span>
                  </div>
                ))}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-bold text-[#78716c]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1c1917]" />
                  <span>ส่งมอบแล้ว</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fed7aa]" />
                  <span>กำลังทำ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a7f3d0]" />
                  <span>รอตรวจ</span>
                </div>
              </div>
            </div>

            {/* Overall Revenue Callout */}
            <div className="p-4 rounded-2xl bg-[#1c1917] text-[#faf6ee] flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#a8a29e]">รายรับปิดการขายทั้งหมด</span>
                <p className="text-xl font-black text-white mt-0.5">฿{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
