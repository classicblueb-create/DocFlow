import {
  Kanban,
  GanttChart,
  CalendarDays,
  PieChart,
  FileText,
  Users,
  Library,
  Sparkles,
  Mic,
  BrainCircuit,
  User,
  X
} from 'lucide-react';
import { ViewType } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  syncStatus: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ currentView, onViewChange, syncStatus, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const NavItem = ({ view, icon: Icon, label, className = "", innerClassName = "", iconClassName = "" }: { view?: ViewType, icon: any, label: string, className?: string, innerClassName?: string, iconClassName?: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          if (view) onViewChange(view);
          setIsMobileOpen(false);
        }}
        className={cn(
          "w-full flex items-center px-2 py-2 rounded-lg transition-colors overflow-hidden relative",
          isActive ? "bg-clickup-hover" : "hover:bg-clickup-hover",
          className
        )}
      >
        <Icon className={cn("w-5 h-5 shrink-0 text-white", iconClassName)} />
        <span className={cn("text-sm font-medium ml-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap", innerClassName, isActive ? "text-white" : "text-gray-300")}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative inset-y-0 left-0 bg-clickup-sidebar text-white flex flex-col shrink-0 transition-all duration-300 z-50 overflow-hidden group shadow-2xl h-full",
        isMobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-[64px] md:hover:w-64"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50 shrink-0 whitespace-nowrap bg-gray-900/50">
          <div className="flex items-center">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-tr from-clickup-purple to-indigo-400 flex items-center justify-center text-white font-black shadow-lg text-xl">M</div>
            <div className="ml-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center">
              <h1 className="font-bold text-white text-base tracking-wide leading-tight">ModtyTasks</h1>
              <p className="text-[9px] text-indigo-300 font-medium">Intelligence in every task</p>
            </div>
          </div>
          <button className="md:hidden" onClick={() => setIsMobileOpen(false)}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 hide-scrollbar">
          {/* HOME */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-2 px-1 tracking-wider md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">เวิร์กสเปซ (WORKSPACE)</p>
            <div className="space-y-1">
              <NavItem view="board" icon={Kanban} label="กระดาน (Board)" />
              <NavItem view="gantt" icon={GanttChart} label="ไทม์ไลน์ (Gantt)" />
              <NavItem view="calendar" icon={CalendarDays} label="ปฏิทิน (Calendar)" />
              <NavItem view="dashboard" icon={PieChart} label="สถิติ & รายได้ (Dashboard)" />
            </div>
          </div>

          {/* SYSTEMS */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-2 px-1 tracking-wider md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">ระบบจัดการ (SYSTEMS)</p>
            <div className="space-y-1">
              <NavItem view="docflow" icon={FileText} label="ออกเอกสาร (DocFlow)" iconClassName="text-amber-400" innerClassName="text-amber-400" />
              <NavItem view="clients" icon={Users} label="ฐานลูกค้า (Client Portal)" iconClassName="text-emerald-400" innerClassName="text-emerald-400" />
              <NavItem view="templates" icon={Library} label="คลังงาน (Templates)" iconClassName="text-blue-400" innerClassName="text-blue-400" />
            </div>
          </div>

          {/* AI Hub */}
          <div>
            <p className="text-[10px] font-bold text-white mb-2 px-1 tracking-wider flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-white shrink-0" /> AI HUB
            </p>
            <div className="space-y-1">
              <NavItem view="agents" icon={BrainCircuit} label="คลังผู้ช่วย AI ทั้งหมด" className="bg-clickup-purple/20 border border-clickup-purple/30" innerClassName="text-white font-bold" iconClassName="text-clickup-purple" />
            </div>
          </div>
        </div>
        
        <div className="p-3 border-t border-gray-700/50 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0 border-2 border-clickup-purple"><User className="w-4 h-4 text-white"/></div>
            <div>
              <p className="text-xs font-bold text-white">Modty Admin</p>
              <p className="text-[10px] text-emerald-400 font-bold max-w-[150px] truncate">{syncStatus}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
