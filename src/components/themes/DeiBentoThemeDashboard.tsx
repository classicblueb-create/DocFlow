import { useState, useMemo } from 'react';
import { 
  Sparkles, Clock, CheckCircle2, ChevronDown, 
  Calendar, ArrowUpRight, Search, Plus, Filter, 
  Layers, FolderKanban, ShieldCheck, Zap
} from 'lucide-react';
import { Task, ProjectCategory, Expense } from '../../types';

interface ThemeDashboardProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
  onOpenTaskModal?: () => void;
}

export function DeiBentoThemeDashboard({ tasks, categories, expenses = [], onOpenTaskModal }: ThemeDashboardProps) {
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ' || t.status === 'in_progress');
  const upcomingTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ' || t.status === 'todo');

  const totalRevenue = completedTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Top active projects
  const activeProjects = useMemo(() => {
    return tasks.slice(0, 3);
  }, [tasks]);

  // Featured hero project for the tilted card
  const heroTask = tasks[0] || {
    id: 'hero',
    name: 'พัฒนาและส่งมอบระบบ ModtyTasks',
    price: 45000,
    status: 'In Progress',
    customer: 'Enterprise Client',
    endDate: '2026-10-15',
  };

  const getCatName = (catId?: string) => {
    return categories.find(c => c.id === catId)?.name || 'โครงการ';
  };

  return (
    <div className="w-full flex flex-col gap-5 animate-fade-in p-1 text-slate-900">
      
      {/* ── Top Obsidian Header (Decoded from Image 4) ── */}
      <div className="bg-[#000000] text-white px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xl border border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
              M
            </div>
            <span className="text-lg font-black tracking-tight text-white">ModtyTasks</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="text-white flex items-center gap-1.5 font-bold cursor-pointer">
              ⚡ ภาพรวมงาน
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">📋 กระดานงาน</span>
            <span className="hover:text-white transition-colors cursor-pointer">💰 ปิดการขาย</span>
            <span className="hover:text-white transition-colors cursor-pointer">📊 ค่าใช้จ่าย</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-all cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
              MO
            </div>
            <div className="hidden sm:block text-left text-[11px] leading-tight">
              <p className="font-bold text-white">Modty Team</p>
              <p className="text-[9px] text-slate-400">admin@modty.com</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </div>
        </div>
      </div>

      {/* ── Porcelain Canvas Area ── */}
      <div className="rounded-[28px] bg-[#eff2f6] p-5 md:p-7 border border-slate-200/90 shadow-xs flex flex-col gap-6 relative">
        
        {/* Top Header Bar: Title, Search, 3 Bento Stat Counters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              ภาพรวมโครงการ & ไทม์ไลน์ ⏱️
            </h1>
          </div>

          {/* 3 Bento Stat Counters (Decoded from Image 4) */}
          <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto hide-scrollbar">
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-black text-slate-900">{tasks.length}</span>
              <span className="text-xs font-semibold text-slate-500">ทั้งหมด</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-black text-emerald-600">{completedTasks.length}</span>
              <span className="text-xs font-semibold text-slate-500">เสร็จแล้ว 🎉</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-black text-indigo-600">{inProgressTasks.length}</span>
              <span className="text-xs font-semibold text-slate-500">กำลังทำ ⏱️</span>
            </div>
          </div>
        </div>

        {/* ── Bento Grid: Left Main Section (8 Cols) + Right Events (4 Cols) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (8 Cols): Hero Tilted Card + Active Tasks Bento */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Hero Card with Tilted Media Card Visual (Decoded from Image 4) */}
            <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#18181b] to-[#27272a] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-6">
              
              {/* Left Content */}
              <div className="flex flex-col justify-between max-w-sm z-10">
                <div>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider inline-block mb-3">
                    🚀 โครงการสำคัญ (Primary Milestone)
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                    {heroTask.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    ลูกค้า: {heroTask.customer || 'งานหลักองค์กร'}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/15 px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-indigo-300" />
                    <span>กำหนดส่ง: {heroTask.endDate || 'เร็วๆ นี้'}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400">
                    ฿{Number(heroTask.price || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Right Floating Tilted Violet Card (Decoded 3D tilt effect) */}
              <div className="relative flex items-center justify-center min-w-[200px]">
                <div 
                  className="w-48 h-40 rounded-2xl bg-gradient-to-br from-[#c084fc] via-[#a855f7] to-[#7c3aed] p-4 text-white shadow-2xl transform rotate-6 hover:rotate-2 transition-transform duration-300 border-2 border-white/20 flex flex-col justify-between"
                  style={{ transform: 'perspective(600px) rotateY(-8deg) rotateZ(5deg)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                      ⚡
                    </span>
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                      Priority High
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-100 uppercase">ยอดปิดการขาย</span>
                    <p className="text-xl font-black text-white">฿{totalRevenue.toLocaleString()}</p>
                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-white h-full rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Active Projects Bento List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeProjects.map((t, idx) => {
                const isDone = t.status === 'Done' || t.status === 'เสร็จสิ้น';
                return (
                  <div key={t.id} className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {getCatName(t.categoryId)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDone ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-slate-800 line-clamp-1">{t.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1">ลูกค้า: {t.customer || 'ทั่วไป'}</p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">฿{Number(t.price || 0).toLocaleString()}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{t.endDate || 'ไม่มีกำหนด'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column (4 Cols): "My Events 🧐" Card List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                  กิจกรรมและกำหนดส่ง 🧐
                </h3>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>

              {/* Event Cards */}
              <div className="flex flex-col gap-3">
                {tasks.slice(0, 4).map((t, i) => {
                  const colors = [
                    'bg-[#ede9fe] border-[#ddd6fe] text-[#6b21a8]',
                    'bg-[#fed7aa] border-[#fdba74] text-[#9a3412]',
                    'bg-[#dcfce7] border-[#bbf7d0] text-[#166534]',
                    'bg-[#dbeafe] border-[#bfdbfe] text-[#1e40af]',
                  ];
                  const c = colors[i % colors.length];

                  return (
                    <div key={t.id} className={`rounded-2xl p-4 border ${c} flex flex-col gap-2 transition-all hover:scale-[1.01]`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          📅 {t.endDate || t.startDate || 'สัปดาห์นี้'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70">
                          {t.status}
                        </span>
                      </div>
                      <h4 className="font-black text-xs text-slate-900 line-clamp-1">{t.name}</h4>
                      <p className="text-[10px] font-medium opacity-80">มูลค่างาน: ฿{Number(t.price || 0).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* ── Floating Tool Dock Capsule (Decoded from Image 4) ── */}
        <div className="sticky bottom-2 mx-auto px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center gap-3 z-20">
          <button 
            onClick={() => {
              if (onOpenTaskModal) onOpenTaskModal();
              else {
                const btn = document.querySelector('button[title*="สร้าง"]') as HTMLButtonElement;
                if (btn) btn.click();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-black shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างงานใหม่</span>
          </button>
          
          <div className="h-4 w-px bg-slate-200" />
          
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#f43f5e] text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform" title="งานด่วน">
              🔥
            </span>
            <span className="w-7 h-7 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform" title="สรุปบัญชี">
              💎
            </span>
            <span className="w-7 h-7 rounded-full bg-[#10b981] text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform" title="ปิดดีลแล้ว">
              🎉
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
