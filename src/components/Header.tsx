import { Kanban, Database, Search, Plus, Menu } from 'lucide-react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  dbSyncStatusText: string;
  isSyncing: boolean;
  onNewTaskClick: () => void;
  onMenuClick: () => void;
  onSearchChange: (q: string) => void;
}

const viewConfig: Record<ViewType, { title: string; icon: any }> = {
  board: { title: 'กระดาน (Board)', icon: Kanban },
  gantt: { title: 'ไทม์ไลน์ (Gantt)', icon: Kanban },
  calendar: { title: 'ปฏิทิน (Calendar)', icon: Kanban },
  dashboard: { title: 'สถิติ & รายได้ (Dashboard)', icon: Kanban },
  clients: { title: 'ฐานลูกค้า (Client Portal)', icon: Kanban },
  templates: { title: 'คลังงาน (Template Library)', icon: Kanban },
  docflow: { title: 'ออกเอกสาร (DocFlow)', icon: Kanban },
  agents: { title: 'คลังผู้ช่วยอัจฉริยะ', icon: Kanban },
}

export function Header({ currentView, dbSyncStatusText, isSyncing, onNewTaskClick, onMenuClick, onSearchChange }: HeaderProps) {
  const Icon = viewConfig[currentView].icon;
  
  return (
    <header className="h-16 border-b border-gray-200 px-4 md:px-6 flex justify-between items-center shrink-0 bg-white z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100" onClick={onMenuClick}>
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
          {/* We simplify icons for now, but in full version they match */}
          {/* <Icon className="w-5 h-5 text-gray-500" /> {viewConfig[currentView].title} */}
          <span className="truncate max-w-[150px] md:max-w-none">{viewConfig[currentView].title}</span>
        </h2>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        <a 
          href="#" 
          onClick={e => e.preventDefault()}
          className="hidden md:flex bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 transition text-sm font-medium items-center gap-1.5 shadow-sm" 
          title="ฐานข้อมูล Google Sheets"
        >
          <Database className={isSyncing ? "animate-spin text-amber-500 w-4 h-4" : "text-emerald-500 w-4 h-4"} /> 
          <span>{dbSyncStatusText}</span>
        </a>

        <div className="hidden sm:block relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหางาน, ลูกค้า..." 
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clickup-purple w-40 transition-all focus:w-60 bg-gray-50 focus:bg-white text-gray-700" 
          />
        </div>

        <button 
          onClick={onNewTaskClick} 
          title="สร้างงานใหม่" 
          className="bg-gradient-to-r from-clickup-purple to-indigo-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" /> <span className="hidden md:inline">สร้างงานใหม่</span>
        </button>
      </div>
    </header>
  );
}
