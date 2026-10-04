import { useState } from 'react';
import { 
  Bell, Settings, Star, Laptop, Video, Briefcase, 
  Box, ChevronRight, CheckCircle, TrendingUp
} from 'lucide-react';
import { Task, ProjectCategory, Expense } from '../../types';

interface ThemeDashboardProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
}

export function WarmEditorialThemeDashboard({ tasks, categories, expenses = [] }: ThemeDashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = [
    { id: 'All', label: 'All', icon: null },
    { id: 'IT', label: 'IT & Software', icon: Laptop },
    { id: 'Media', label: 'Media Training', icon: Video },
    { id: 'Business', label: 'Business', icon: Briefcase },
    { id: 'Interior', label: 'Interior', icon: Box },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-1 md:p-3 text-[#1c1917]">
      
      {/* ── Main Layout: Left Editorial Canvas + Right Profile Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Big Editorial Heading, Filters, 2x2 Pastel Cards (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Big Editorial Heading */}
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-[#1c1917] tracking-tight leading-tight">
              Invest in your<br />education
            </h1>
          </div>

          {/* Category Filter Pills (Black Capsule for Active) */}
          <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar pb-1">
            {filters.map((f) => {
              const isActive = selectedFilter === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1c1917] text-[#faf6ee] shadow-sm'
                      : 'bg-white/80 border border-[#ede5d8] text-[#57534e] hover:bg-white hover:text-[#1c1917]'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* "Most popular" Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#78716c] uppercase tracking-wider">
              Most popular
            </span>
          </div>

          {/* ── 2x2 Rich Pastel Sorbet Cards (Decoded from Image 3) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Peach Sorbet Card */}
            <div className="rounded-3xl p-5 md:p-6 bg-[#ffdac6] border border-[#fdba99]/60 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#9a3412] text-[10px] font-bold">
                    <Laptop className="w-3 h-3" /> IT & Software
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-[#9a3412] text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-[#ea580c] text-[#ea580c]" /> 4.8
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-black text-[#1c1917] leading-snug mt-4 mb-2">
                  CCNA 2020 200-125 Video Boot Camp
                </h3>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#fdba99]/40">
                <span className="text-xs font-semibold text-[#78716c]">9,530 students</span>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">JD</div>
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">SM</div>
                </div>
              </div>
            </div>

            {/* Card 2: Apricot Honey Card */}
            <div className="rounded-3xl p-5 md:p-6 bg-[#fed7aa] border border-[#fdba74]/60 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#9a3412] text-[10px] font-bold">
                    <Briefcase className="w-3 h-3" /> Business
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-[#9a3412] text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-[#ea580c] text-[#ea580c]" /> 4.9
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-black text-[#1c1917] leading-snug mt-4 mb-2">
                  Powerful Business Writing: How to Write Concisely
                </h3>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#fdba74]/40">
                <span className="text-xs font-semibold text-[#78716c]">1,463 students</span>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">MK</div>
                  <div className="w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">TH</div>
                </div>
              </div>
            </div>

            {/* Card 3: Lavender Lilac Card */}
            <div className="rounded-3xl p-5 md:p-6 bg-[#e9d5ff] border border-[#d8b4fe]/60 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#6b21a8] text-[10px] font-bold">
                    <Video className="w-3 h-3" /> Media Training
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-[#6b21a8] text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-[#9333ea] text-[#9333ea]" /> 4.9
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-black text-[#1c1917] leading-snug mt-4 mb-2">
                  Certified Six Sigma Yellow Belt Training
                </h3>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#d8b4fe]/40">
                <span className="text-xs font-semibold text-[#78716c]">6,726 students</span>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-purple-800 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">AB</div>
                  <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">PL</div>
                </div>
              </div>
            </div>

            {/* Card 4: Pistachio Mint Card */}
            <div className="rounded-3xl p-5 md:p-6 bg-[#d1fae5] border border-[#a7f3d0]/60 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#065f46] text-[10px] font-bold">
                    <Box className="w-3 h-3" /> Interior
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-[#065f46] text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-[#059669] text-[#059669]" /> 5.0
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-black">
                      Top 10
                    </span>
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-black text-[#1c1917] leading-snug mt-4 mb-2">
                  How to Design a Room in 10 Easy Steps
                </h3>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#a7f3d0]/40">
                <span className="text-xs font-semibold text-[#78716c]">8,735 students</span>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">RJ</div>
                  <div className="w-6 h-6 rounded-full bg-rose-700 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">FD</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Annette Black Profile & Stacked Activity Bar Chart (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          <div className="rounded-3xl p-6 bg-[#fffdf8] border border-[#ede5d8] shadow-xs flex flex-col gap-5">
            {/* Top Icons */}
            <div className="flex items-center justify-between text-[#78716c]">
              <button className="p-2 rounded-xl hover:bg-black/5 cursor-pointer">
                <Bell className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl hover:bg-black/5 cursor-pointer">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#f3e8ff] p-1 border-2 border-[#c084fc] flex items-center justify-center mb-2">
                <div className="w-full h-full rounded-full bg-[#1c1917] text-white flex items-center justify-center font-black text-lg">
                  AB
                </div>
              </div>
              <h2 className="text-lg font-black text-[#1c1917]">Annette Black</h2>
            </div>

            {/* 274 Friends Pill */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf6ee] border border-[#ede5d8]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1c1917]">274 Friends</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-white text-[8px] flex items-center justify-center">1</div>
                  <div className="w-5 h-5 rounded-full bg-amber-600 text-white text-[8px] flex items-center justify-center">2</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#a8a29e]" />
              </div>
            </div>

            {/* Activity Multi-colored Stacked Bar Chart */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#78716c]">Activity</span>
                <span className="text-[11px] font-semibold text-[#a8a29e]">Year v</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-[#1c1917]">3.5h</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">
                  👍 Great result!
                </span>
              </div>

              {/* Stacked Bars Mockup */}
              <div className="flex items-end justify-between gap-1.5 h-24 pt-2 border-b border-[#ede5d8]">
                {['Jan', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => {
                  const isCurrent = m === 'Dec';
                  return (
                    <div key={m} className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-full flex flex-col gap-0.5 rounded-lg overflow-hidden">
                        <div className="h-4 bg-[#fed7aa]" />
                        <div className="h-3 bg-[#d1fae5]" />
                        <div className="h-5 bg-[#e9d5ff]" />
                      </div>
                      <span className={`text-[10px] font-bold ${isCurrent ? 'bg-[#1c1917] text-white px-1.5 py-0.5 rounded-md' : 'text-[#a8a29e]'}`}>
                        {m}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Courses Section */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs font-bold text-[#78716c]">My courses</span>
              <div className="rounded-2xl p-3.5 bg-[#fef2f2] border border-[#fecaca] flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#991b1b]">
                  <span>💻 IT & Software</span>
                  <span>★ 4.8</span>
                </div>
                <h4 className="font-bold text-xs text-[#1c1917]">Flutter Masterclass (Dart, APIs, Firebase & More)</h4>
                <span className="text-[10px] text-[#78716c]">9,530 students</span>
              </div>

              <div className="rounded-2xl p-3.5 bg-[#fef3c7] border border-[#fde68a] flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#92400e]">
                  <span>💼 Business</span>
                  <span>★ 4.9</span>
                </div>
                <h4 className="font-bold text-xs text-[#1c1917]">Executive Strategy Masterclass</h4>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
