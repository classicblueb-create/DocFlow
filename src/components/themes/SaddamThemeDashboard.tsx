import { useState } from 'react';
import { 
  Users, DollarSign, RefreshCw, Layers, Plus, 
  Calendar as CalendarIcon, Filter, ArrowUpRight, CheckCircle, Clock
} from 'lucide-react';
import { Task, ProjectCategory, Expense } from '../../types';

interface ThemeDashboardProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
}

export function SaddamThemeDashboard({ tasks, categories, expenses = [] }: ThemeDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ' || t.status === 'in_progress');
  
  const totalRevenue = completedTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  const totalEmployees = tasks.length || 1589;

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-1 md:p-3 text-slate-800">
      
      {/* ── Tablet Bezel Inner Container ── */}
      <div className="rounded-[28px] border-4 border-[#1e293b]/10 bg-[#f1f4f8] p-5 md:p-7 shadow-xl flex flex-col gap-6">
        
        {/* ── Top Navigation Tabs & Search ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {['Dashboard', 'Employees', 'Reports', 'Schedule', 'Company'].map((tab) => {
              const isActive = activeTab.toLowerCase() === tab.toLowerCase();
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
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
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
              📅 28 Apr, 2026
            </span>
          </div>
        </div>

        {/* ── Greeting Banner & CTA ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back, John
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Here's a clear overview of your workforce performance and structure
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18181b] text-white text-xs font-bold hover:bg-black shadow-xs transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Employee</span>
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* ── 4 Stat Cards with Circular Pastel Icons (Decoded from Image 2) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Employees (Purple) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#6366f1] flex items-center justify-center font-bold text-sm shadow-2xs">
                👥
              </div>
              <span className="text-xs font-bold text-slate-600">Total Employees</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{totalEmployees.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  +5.6%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">from last month</p>
            </div>
          </div>

          {/* Card 2: Sales Revenue (Mint Green) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center font-bold text-sm shadow-2xs">
                💵
              </div>
              <span className="text-xs font-bold text-slate-600">Sales Revenue</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">฿{totalRevenue.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  +7.9%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Total Revenue</p>
            </div>
          </div>

          {/* Card 3: Submission Rate (Coral Red) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#fee2e2] text-[#ef4444] flex items-center justify-center font-bold text-sm shadow-2xs">
                🔄
              </div>
              <span className="text-xs font-bold text-slate-600">Submission Rate</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">67%</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  +5.6%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Profile</p>
            </div>
          </div>

          {/* Card 4: Sales Leads (Amber Orange) */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold text-sm shadow-2xs">
                🎯
              </div>
              <span className="text-xs font-bold text-slate-600">Sales Leads</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">56</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Positions</p>
            </div>
          </div>

        </div>

        {/* ── Main Layout: Weekly Meeting Scheduling & Feature Events ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Meeting Scheduling & Employee List (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* Meeting Scheduling Weekly Grid */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900">Meeting Scheduling</h2>
                <select className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 outline-none">
                  <option>Today v</option>
                  <option>This Week</option>
                </select>
              </div>

              {/* Weekly Days Bar */}
              <div className="overflow-x-auto">
                <div className="min-w-[500px] flex flex-col gap-2">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 text-center pb-2 border-b border-slate-100">
                    <span className="col-span-3 text-left pl-2">Employees</span>
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span>
                  </div>

                  {/* Row 1: James Anderson */}
                  <div className="grid grid-cols-12 items-center py-2 text-xs border-b border-slate-50">
                    <div className="col-span-3 flex items-center gap-2 pl-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">JA</div>
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] truncate">James Anderson</p>
                        <p className="text-[9px] text-slate-400">UI/UX Designer</p>
                      </div>
                    </div>
                    <div className="col-span-9 flex items-center pl-4">
                      <span className="bg-[#6366f1] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                        Meeting <span className="bg-white/20 text-[8.5px] px-1 rounded-full">Approved</span>
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Alex Mika */}
                  <div className="grid grid-cols-12 items-center py-2 text-xs border-b border-slate-50">
                    <div className="col-span-3 flex items-center gap-2 pl-2">
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">AM</div>
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] truncate">Alex Mika</p>
                        <p className="text-[9px] text-slate-400">Marketer</p>
                      </div>
                    </div>
                    <div className="col-span-9 flex items-center pl-16">
                      <span className="bg-[#ef4444] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                        Sick Leave <span className="bg-white/20 text-[8.5px] px-1 rounded-full">Pending</span>
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Allison Baker */}
                  <div className="grid grid-cols-12 items-center py-2 text-xs border-b border-slate-50">
                    <div className="col-span-3 flex items-center gap-2 pl-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">AB</div>
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] truncate">Allison Baker</p>
                        <p className="text-[9px] text-slate-400">Co-Founder</p>
                      </div>
                    </div>
                    <div className="col-span-9 flex items-center pl-6">
                      <span className="bg-[#10b981] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                        Paid Leave <span className="bg-white/20 text-[8.5px] px-1 rounded-full">Approved</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee List Table */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
              <h2 className="text-sm font-black text-slate-900 mb-3">Employee List</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Join Date</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.slice(0, 3).map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-800">{t.name}</td>
                        <td className="py-2.5 text-slate-500 font-medium">UX/UI Designer</td>
                        <td className="py-2.5 text-slate-400 text-[11px]">user{idx+1}@gmail.com</td>
                        <td className="py-2.5 text-slate-400 text-[11px]">Apr 16, 2026</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${idx % 2 === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {idx % 2 === 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Feature Events (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">Feature Events</h2>
              <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Event 1: Monthly Performance Review */}
              <div className="rounded-2xl p-4 bg-[#f1f5f9] border border-slate-200/80 flex flex-col gap-1.5">
                <h3 className="font-bold text-xs text-slate-900">Monthly Performance Review</h3>
                <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium">
                  Evaluate employee performance, KPIs, and progress across departments.
                </p>
                <div className="flex items-center gap-3 pt-2 text-[10px] font-semibold text-slate-400">
                  <span>⏱️ 11:00 - 12:00</span>
                  <span>📅 16 Apr, 2026</span>
                </div>
              </div>

              {/* Event 2: Team Attendance Audit */}
              <div className="rounded-2xl p-4 bg-[#f0fdf4] border border-emerald-100 flex flex-col gap-1.5">
                <h3 className="font-bold text-xs text-slate-900">Team Attendance Audit</h3>
                <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium">
                  Review attendance records, late check-ins, and leave summaries.
                </p>
                <div className="flex items-center gap-3 pt-2 text-[10px] font-semibold text-emerald-600">
                  <span>⏱️ 12:00 - 01:00</span>
                  <span>📅 17 Apr, 2026</span>
                </div>
              </div>

              {/* Event 3: Payroll Processing Cycle */}
              <div className="rounded-2xl p-4 bg-[#fdf2f2] border border-rose-100 flex flex-col gap-1.5">
                <h3 className="font-bold text-xs text-slate-900">Payroll Processing Cycle</h3>
                <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium">
                  Finalize salaries, bonuses, and deductions for all employees.
                </p>
                <div className="flex items-center gap-3 pt-2 text-[10px] font-semibold text-rose-500">
                  <span>⏱️ 01:00 - 02:00</span>
                  <span>📅 18 Apr, 2026</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-[11px] font-bold text-indigo-600 cursor-pointer hover:underline">
                View all scheduled events →
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
