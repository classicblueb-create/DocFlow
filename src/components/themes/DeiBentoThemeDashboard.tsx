import { useState } from 'react';
import { 
  Play, Check, MoreHorizontal, Lock, Search, 
  Sparkles, Clock, Calendar, Star, ChevronDown, CheckCircle
} from 'lucide-react';
import { Task, ProjectCategory, Expense } from '../../types';

interface ThemeDashboardProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
}

export function DeiBentoThemeDashboard({ tasks, categories, expenses = [] }: ThemeDashboardProps) {
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ' || t.status === 'in_progress');
  const upcomingTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ' || t.status === 'todo');

  return (
    <div className="w-full flex flex-col gap-5 animate-fade-in p-1 text-slate-900">
      
      {/* ── Top Obsidian Header (Decoded from Image 4) ── */}
      <div className="bg-[#000000] text-white px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xl border border-white/10">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black tracking-tight text-white">Dei</span>
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="text-white flex items-center gap-1.5 font-bold cursor-pointer">
              🎓 Learning Plan
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">👥 Community</span>
            <span className="hover:text-white transition-colors cursor-pointer">⏱️ Schedule</span>
            <span className="hover:text-white transition-colors cursor-pointer">🛡️ Compliance</span>
            <span className="hover:text-white transition-colors cursor-pointer">▦ Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-all cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
              ET
            </div>
            <div className="hidden sm:block text-left text-[11px] leading-tight">
              <p className="font-bold text-white">Ellington Thom</p>
              <p className="text-[9px] text-slate-400">annette@gmail.com</p>
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
              My Learning Plan ⏱️
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Pill */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-8 pr-4 py-1.5 text-xs rounded-full bg-white border border-slate-200 text-slate-800 outline-none w-36 sm:w-44 shadow-2xs" 
              />
            </div>

            {/* 3 Bento Counters (26 Total, 2 Completed, 23 Upcoming) */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-base font-black text-slate-900 block leading-none">{tasks.length || 26}</span>
                <span className="text-[9px] font-bold text-slate-400">Total</span>
              </div>
              
              <div className="px-3.5 py-1.5 rounded-xl bg-[#d1fae5] border border-[#a7f3d0] text-center shadow-2xs">
                <span className="text-base font-black text-[#065f46] block leading-none">{completedTasks.length || 2}</span>
                <span className="text-[9px] font-bold text-[#065f46]">Completed 🎉</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-base font-black text-slate-900 block leading-none">{upcomingTasks.length || 23}</span>
                <span className="text-[9px] font-bold text-slate-400">Upcoming</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Layout: Tree Grid & Right Events Column ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Learning Nodes Tree (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* Node 1: Medical Terminology */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-start justify-between group hover:shadow-md transition-all">
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-black text-base text-slate-900">Medical Terminology</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Learn basic medical language for effective communication across departments.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d1fae5] text-[#065f46] text-xs font-bold border border-[#a7f3d0]">
                    Completed 🌿
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <div className="w-7 h-7 rounded-full bg-[#18181b] text-white flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Node 2: Floating Tilted Purple Media Card (Pharmacology Basics) */}
            <div className="rounded-3xl p-6 bg-[#f3e8ff] border border-[#e9d5ff] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 transform -rotate-1 hover:rotate-0 transition-transform duration-200">
              <div className="space-y-2 max-w-sm">
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                  Featured Module
                </span>
                <h3 className="font-black text-lg text-slate-900 leading-tight">
                  Pharmacology Basics
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Learn basic medical language for effective communication and clinical operations.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <span className="px-3 py-1 rounded-full bg-white text-purple-900 text-xs font-bold shadow-2xs">
                    ⏱️ Watching 00:30
                  </span>
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-purple-700 text-white text-[8px] flex items-center justify-center font-bold border-2 border-white">JD</div>
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center font-bold border-2 border-white">SM</div>
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[8px] flex items-center justify-center font-bold border-2 border-white">AB</div>
                  </div>
                </div>
              </div>

              {/* Big Play Button Circle */}
              <div className="w-16 h-16 rounded-full bg-white text-[#9333ea] flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer self-center">
                <Play className="w-7 h-7 fill-[#9333ea] ml-1" />
              </div>
            </div>

            {/* Node 3: Anatomy and Physiology */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-start justify-between group hover:shadow-md transition-all">
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-black text-base text-slate-900">Anatomy and Physiology</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Understand the structure and function of the human body and bio-systems.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d1fae5] text-[#065f46] text-xs font-bold border border-[#a7f3d0]">
                    Completed 🌿
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <div className="w-7 h-7 rounded-full bg-[#18181b] text-white flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Node 4: Medical Ethics and Professionalism */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-start justify-between group hover:shadow-md transition-all opacity-85">
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-black text-base text-slate-900">Medical Ethics and Professionalism</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Understand ethical principles and professionalism in modern healthcare.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                    Upcoming ⏱️
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* Right Column: "My Events 🧐" (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              My Events 🧐
            </h2>

            {/* Event 1: Webinar (Cyan Card) */}
            <div className="rounded-2xl p-4 bg-[#e0f7fa] border border-[#b2ebf2] flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#006064]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#00838f] text-white text-[9px] flex items-center justify-center font-bold">W</div>
                  <span>Webinar</span>
                </div>
                <span>Tu, 25.03</span>
              </div>
              <p className="text-xs text-[#004d40] font-semibold leading-relaxed">
                Understanding medical research, critical appraisal skills, and evidence-based guidelines in practice.
              </p>
              <div className="pt-2 text-[10px] font-bold text-[#00838f]">
                ⏱️ Start at 12:30
              </div>
            </div>

            {/* Event 2: Lesson (Lilac Card) */}
            <div className="rounded-2xl p-4 bg-[#f3e8ff] border border-[#e9d5ff] flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#6b21a8]">
                <span>📊 Lesson</span>
                <span>We, 26.03</span>
              </div>
              <p className="text-xs text-[#581c87] font-semibold leading-relaxed">
                Overview of healthcare delivery systems, health policy, and their impact on patient care.
              </p>
            </div>

            {/* Event 3: Task (Butter Yellow Card) */}
            <div className="rounded-2xl p-4 bg-[#fef9c3] border border-[#fef08a] flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#854d0e]">
                <span>⭐ Task</span>
                <span>Th, 27.03</span>
              </div>
              <p className="text-xs text-[#713f12] font-semibold leading-relaxed">
                Examination of major global health issues, infectious diseases, and healthcare disparities.
              </p>
            </div>

            {/* Floating Mint Sticky Note at Bottom */}
            <div className="rounded-2xl p-4 bg-[#dcfce7] border border-[#bbf7d0] shadow-lg flex flex-col gap-2 transform rotate-1 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#166534]">
                <span>📌 Priority Note</span>
                <span>Fr, 28.03</span>
              </div>
              <p className="text-xs text-[#14532d] font-semibold leading-relaxed">
                Importance of teamwork and communication among healthcare professionals for optimal patient outcomes.
              </p>
            </div>

          </div>

        </div>

        {/* ── Floating Bottom Tool Dock (Decoded from Image 4) ── */}
        <div className="flex justify-center mt-3">
          <div className="bg-[#18181b] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-white/20">
            <button className="w-7 h-7 rounded-full bg-white text-black font-black text-xs flex items-center justify-center hover:scale-105 transition-all">T</button>
            <button className="w-7 h-7 rounded-full bg-[#38bdf8] text-black font-black text-xs flex items-center justify-center hover:scale-105 transition-all">A</button>
            <button className="w-7 h-7 rounded-full bg-[#f472b6] text-black font-black text-xs flex items-center justify-center hover:scale-105 transition-all">📝</button>
            <button className="w-7 h-7 rounded-full bg-[#facc15] text-black font-black text-xs flex items-center justify-center hover:scale-105 transition-all">📋</button>
            <button className="w-7 h-7 rounded-full bg-[#c084fc] text-black font-black text-xs flex items-center justify-center hover:scale-105 transition-all">💬</button>
            <button className="w-7 h-7 rounded-full bg-[#4ade80] text-black font-black text-xs flex items-center justify-center hover:scale-105 transition-all">😊</button>
            <button className="w-7 h-7 rounded-full bg-white/20 text-white font-black text-xs flex items-center justify-center hover:bg-white/30 transition-all">+</button>
          </div>
        </div>

      </div>

    </div>
  );
}
