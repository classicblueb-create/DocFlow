import { useState, useMemo } from 'react';
import { 
  Plus, Filter, Calendar, Users as UsersIcon, CheckCircle2, 
  Clock, ArrowUpRight, DollarSign, FolderKanban, CheckCircle
} from 'lucide-react';
import { Task, ProjectCategory, Expense } from '../../types';

interface ThemeDashboardProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
  onOpenTaskModal?: () => void;
}

export function SaddamThemeDashboard({ tasks, categories, expenses = [], onOpenTaskModal }: ThemeDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ' || t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ' || t.status === 'todo');
  
  const totalRevenue = completedTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Active weekly tasks (show real tasks)
  const scheduledTasks = useMemo(() => {
    return tasks.slice(0, 6);
  }, [tasks]);

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter(t => t.endDate || t.startDate)
      .slice(0, 4);
  }, [tasks]);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-1 md:p-3 text-slate-800">
      
      {/* ── Tablet Bezel Inner Container (Decoded from Image 2) ── */}
      <div className="rounded-[28px] border-4 border-[#1e293b]/10 bg-[#f1f4f8] p-5 md:p-7 shadow-xl flex flex-col gap-6">
        
        {/* ── Top Navigation Tabs & Search ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {['ภาพรวม (Dashboard)', 'งานทั้งหมด (Tasks)', 'ดีลและการเงิน (Deals)', 'ตารางเวลา (Schedule)', 'หมวดหมู่ (Categories)'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#18181b] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs flex items-center gap-1.5">
              📅 <span>ModtyTasks 2026</span>
            </span>
          </div>
        </div>

        {/* ── Greeting Banner & CTA ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              สวัสดี Modty 👋 (Saddam Tablet Dashboard)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              สรุปภาพรวมความคืบหน้างานและโครงสร้างโปรเจกต์ของคุณในสไตล์ Tablet OS
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenTaskModal ? (
              <button 
                onClick={onOpenTaskModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18181b] text-white text-xs font-bold hover:bg-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ สร้างงานใหม่</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  const btn = document.querySelector('button[title*="สร้าง"]') as HTMLButtonElement;
                  if (btn) btn.click();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18181b] text-white text-xs font-bold hover:bg-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ สร้างงานใหม่</span>
              </button>
            )}
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>ส่งออก</span>
            </button>
          </div>
        </div>

        {/* ── 4 Stat Cards with Circular Pastel Icons (Decoded from Image 2) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Tasks (Purple Pastel Circle) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#6366f1] flex items-center justify-center font-bold text-sm shadow-2xs">
                📁
              </div>
              <span className="text-xs font-bold text-slate-600">งานทั้งหมดในระบบ</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{tasks.length} งาน</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">อัปเดตเรียลไทม์กับ Supabase</p>
            </div>
          </div>

          {/* Card 2: Total Revenue (Mint Green Pastel Circle) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center font-bold text-sm shadow-2xs">
                💵
              </div>
              <span className="text-xs font-bold text-slate-600">รายรับปิดการขาย (Won)</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">฿{totalRevenue.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  +{completionRate}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">จากงานที่เสร็จสมบูรณ์</p>
            </div>
          </div>

          {/* Card 3: Completion Rate (Coral Red Pastel Circle) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#fee2e2] text-[#ef4444] flex items-center justify-center font-bold text-sm shadow-2xs">
                🎯
              </div>
              <span className="text-xs font-bold text-slate-600">อัตรางานสำเร็จ</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{completionRate}%</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {completedTasks.length} ส่งมอบ
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">จากเป้าหมายผลงานปีนี้</p>
            </div>
          </div>

          {/* Card 4: In Progress Tasks (Amber Pastel Circle) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold text-sm shadow-2xs">
                ⏱️
              </div>
              <span className="text-xs font-bold text-slate-600">งานกำลังดำเนินการ</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{inProgressTasks.length} งาน</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  {pendingTasks.length} รอดำเนินการ
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">กำลังติดตามความคืบหน้า</p>
            </div>
          </div>

        </div>

        {/* ── Main Layout: Weekly Task Scheduling & Feature Events ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Task Scheduling Grid (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* Task Scheduling Weekly Grid */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900">กำหนดการและไทม์ไลน์งาน (Task Scheduling)</h2>
                  <p className="text-[11px] text-slate-400">รายการงานที่มีการนัดหมายและส่งมอบในสัปดาห์นี้</p>
                </div>
                <div className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                  สัปดาห์นี้ (This Week)
                </div>
              </div>

              {/* Weekly Task Rows */}
              <div className="overflow-x-auto">
                <div className="min-w-[500px] flex flex-col gap-2">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 text-center pb-2 border-b border-slate-100">
                    <span className="col-span-4 text-left pl-2">ชื่องานและโปรเจกต์</span>
                    <span>จ.</span><span>อ.</span><span>พ.</span><span>พฤ.</span><span>ศ.</span><span>ส.</span><span>อา.</span><span>ถัดไป</span>
                  </div>

                  {scheduledTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">ยังไม่มีงานในรายการ</div>
                  ) : (
                    scheduledTasks.map((t, idx) => {
                      const isDone = t.status === 'Done' || t.status === 'เสร็จสิ้น';
                      const isInProg = t.status === 'In Progress' || t.status === 'กำลังทำ';
                      const pillColor = isDone ? 'bg-[#10b981]' : isInProg ? 'bg-[#6366f1]' : 'bg-[#f59e0b]';
                      const pillText = isDone ? 'เสร็จสิ้น (Done)' : isInProg ? 'กำลังทำ (In Progress)' : 'รอดำเนินการ (To Do)';
                      const offsetClass = idx % 3 === 0 ? 'pl-2' : idx % 3 === 1 ? 'pl-16' : 'pl-32';

                      return (
                        <div key={t.id} className="grid grid-cols-12 items-center py-2 text-xs border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <div className="col-span-4 flex items-center gap-2 pl-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {t.name.charAt(0) || 'T'}
                            </div>
                            <div className="truncate pr-2">
                              <p className="font-bold text-slate-800 text-[11px] truncate">{t.name}</p>
                              <p className="text-[9px] text-slate-400">
                                {t.customer || `฿${Number(t.price || 0).toLocaleString()}`}
                              </p>
                            </div>
                          </div>
                          <div className={`col-span-8 flex items-center ${offsetClass}`}>
                            <span className={`${pillColor} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5`}>
                              {pillText}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                </div>
              </div>
            </div>

            {/* Performance Summary Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
                  🚀
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">ประสิทธิภาพส่งมอบงาน {completionRate}%</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    คุณปิดงานไปแล้ว {completedTasks.length} รายการ จากเป้าหมายทั้งหมดในระบบ
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('งานทั้งหมด (Tasks)')}
                className="hidden sm:block text-xs font-bold px-3 py-1.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ดูงานทั้งหมด
              </button>
            </div>

          </div>

          {/* Right Column: Upcoming Milestones (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            {/* Upcoming Milestones Card */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900">กำหนดส่งสำคัญ (Deadlines)</h2>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {upcomingDeadlines.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">ยังไม่มีกำหนดส่งที่บันทึกไว้</div>
                ) : (
                  upcomingDeadlines.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-indigo-50/40 hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                          📌
                        </div>
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{t.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {t.endDate || t.startDate || 'เร็วๆ นี้'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shrink-0">
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stat Capsule */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400">ค่าใช้จ่ายรวมรอบนี้</span>
                <p className="text-xl font-black text-rose-600 mt-1">
                  ฿{totalExpenses.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400">หักออกจากรายรับอัตโนมัติ</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
                💳
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
