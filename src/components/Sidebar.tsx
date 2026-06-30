import {
  Kanban, GanttChart, CalendarDays, PieChart,
  FileText, Users, Library, Sparkles, BrainCircuit,
  User, X, Lightbulb, TrendingUp, FolderKanban,
  Video, LayoutDashboard, List, LogOut
} from 'lucide-react';
import { ViewType } from '../types';
import { cn } from '../lib/utils';
import { signOut } from '../lib/auth';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  activeCategoryName?: string;
}

export function Sidebar({ currentView, onViewChange, isMobileOpen, setIsMobileOpen, activeCategoryName }: SidebarProps) {
  const handleLogout = async () => {
    await signOut();
  };

  const NavItem = ({
    view, icon: Icon, label, iconClass = '', labelClass = '', badge
  }: {
    view?: ViewType; icon: any; label: string; iconClass?: string; labelClass?: string; badge?: string;
  }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          if (view) onViewChange(view);
          setIsMobileOpen(false);
        }}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left overflow-hidden relative border border-transparent',
          isActive
            ? 'bg-white/60 text-indigo-650 shadow-sm border-white/50 font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
        )}
      >
        <Icon className={cn('w-4.5 h-4.5 shrink-0 transition-colors', isActive ? 'text-indigo-600' : 'text-slate-500', iconClass)} style={{ width: '18px', height: '18px' }} />
        <span className={cn(
          'text-xs font-semibold whitespace-nowrap truncate transition-opacity duration-300',
          'md:opacity-0 md:group-hover:opacity-100',
          isActive ? 'text-indigo-700 font-bold' : '',
          labelClass
        )}>
          {label}
        </span>
        {badge && (
          <span className="ml-auto text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed md:relative inset-y-0 left-0 flex flex-col shrink-0 transition-all duration-300 z-50 overflow-hidden group h-full border-r border-white/40 shadow-sm',
        isMobileOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full md:translate-x-0 md:w-[60px] md:hover:w-64'
      )}
        style={{
          background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)'
        }}
      >
        {/* Logo */}
        <div className="h-14 md:h-16 flex items-center justify-between px-4 border-b border-white/25 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-white flex items-center justify-center text-zinc-950 font-black text-sm shadow-sm border border-slate-100">
              M
            </div>
            <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <h1 className="font-bold text-slate-800 text-sm tracking-tight leading-tight">ModtyTasks</h1>
              <p className="text-[9px] text-slate-500 font-semibold">AI Workplace Sync</p>
            </div>
          </div>
          <button className="md:hidden text-slate-600 hover:text-slate-900" onClick={() => setIsMobileOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5 hide-scrollbar">

          {/* BRIEFING */}
          <div>
            <p className="text-[9px] font-black text-slate-400/80 mb-2 px-1 tracking-widest uppercase md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              AI CHIEF OF STAFF
            </p>
            <div className="space-y-0.5">
              <NavItem view="briefing" icon={LayoutDashboard} label="Briefing & AI Advisor" iconClass="text-amber-500" labelClass="text-amber-700" />
            </div>
          </div>

          {/* WORKSPACE */}
          <div>
            <p className="text-[9px] font-black text-slate-400/80 mb-2 px-1 tracking-widest uppercase md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              WORKSPACE
            </p>
            <div className="space-y-0.5">
              <NavItem view="board"     icon={Kanban}      label="กระดาน (Board)" />
              <NavItem view="list"      icon={List}        label="รายการงาน (List)" />
              <NavItem view="gantt"     icon={GanttChart}  label="ไทม์ไลน์ (Gantt)" />
              <NavItem view="calendar"  icon={CalendarDays} label="ปฏิทิน (Calendar)" />
              <NavItem view="dashboard" icon={PieChart}    label="Dashboard" />
              <NavItem view="pipeline"  icon={TrendingUp}  label="Sales Pipeline" iconClass="text-emerald-500" labelClass="text-emerald-700" />
              <NavItem view="categories" icon={FolderKanban} label="Project Categories" />
            </div>
          </div>

          {/* SYSTEMS */}
          <div>
            <p className="text-[9px] font-black text-slate-400/80 mb-2 px-1 tracking-widest uppercase md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              SYSTEMS
            </p>
            <div className="space-y-0.5">
              <NavItem view="docflow"   icon={FileText}   label="ออกเอกสาร" iconClass="text-amber-600" labelClass="text-amber-800" />
              <NavItem view="clients"   icon={Users}      label="ฐานลูกค้า (Clients)" iconClass="text-emerald-600" labelClass="text-emerald-800" />
              <NavItem view="templates" icon={Library}    label="คลังงาน (Templates)" iconClass="text-blue-600" labelClass="text-blue-800" />
            </div>
          </div>

          {/* AI HUB */}
          <div>
            <p className="text-[9px] font-black text-slate-400/80 mb-2 px-1 tracking-widest uppercase md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-400/80 shrink-0" /> AI HUB
            </p>
            <div className="space-y-0.5">
              <NavItem view="agents"       icon={BrainCircuit} label="คลังผู้ช่วย AI" iconClass="text-violet-600" labelClass="text-violet-800" />
              <NavItem view="ideas"        icon={Lightbulb}    label="ไอเดีย & นวัตกรรม" iconClass="text-yellow-600" labelClass="text-yellow-800" />
              <NavItem view="content_plan" icon={Video}        label="Content Planner" iconClass="text-pink-600" labelClass="text-pink-800" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/25 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/50 border border-white/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Modty Team</p>
              <p className="text-[10px] text-slate-500 font-semibold truncate">modty.work</p>
            </div>
            <button
              onClick={handleLogout}
              title="ออกจากระบบ"
              className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 p-1.5 rounded-lg hover:bg-white/20 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
