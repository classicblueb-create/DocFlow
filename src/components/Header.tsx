import { useRef, useState, useEffect } from 'react';
import { Search, Plus, Menu, ImageIcon, X, Palette } from 'lucide-react';
import { ViewType } from '../types';
import { getTheme, THEMES } from '../lib/theme';

interface HeaderProps {
  currentView: ViewType;
  dbSyncStatusText?: string;
  isSyncing?: boolean;
  onNewTaskClick: () => void;
  onMenuClick: () => void;
  onSearchChange: (q: string) => void;
  onGlobalSearch?: () => void;
  categoryName?: string;
  onBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBgRemove: () => void;
  onOpenTheme?: () => void;
}

const VIEW_TITLES: Record<ViewType, string> = {
  briefing: 'Briefing & Chief of Staff',
  board: 'กระดาน (Board)',
  list: 'รายการงาน (List)',
  gantt: 'ไทม์ไลน์ (Gantt)',
  calendar: 'ปฏิทิน (Calendar)',
  dashboard: 'สถิติ & รายได้ (Dashboard)',
  clients: 'ฐานลูกค้า (Client Portal)',
  templates: 'คลังงาน (Template Library)',
  docflow: 'ออกเอกสาร',
  agents: 'คลังผู้ช่วย AI',
  ideas: 'ไอเดีย & นวัตกรรม',
  pipeline: 'Sales Pipeline',
  categories: 'Project Categories',
  portfolio: 'Portfolio',
  content_plan: 'Content Planner',
  expenses: 'ค่าใช้จ่ายของฉัน',
};

export function Header({
  currentView,
  isSyncing,
  onNewTaskClick,
  onMenuClick,
  onSearchChange,
  onGlobalSearch,
  categoryName,
  onBgUpload,
  onBgRemove,
  onOpenTheme,
}: HeaderProps) {
  const title = categoryName || VIEW_TITLES[currentView] || currentView;
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [hasBg, setHasBg] = useState(() => !!localStorage.getItem('modty_bg_image'));
  const [currentThemeId, setCurrentThemeId] = useState(() => getTheme());

  useEffect(() => {
    const onThemeChange = (e: any) => {
      if (e.detail) setCurrentThemeId(e.detail);
    };
    window.addEventListener('docflow_theme_changed', onThemeChange);
    return () => window.removeEventListener('docflow_theme_changed', onThemeChange);
  }, []);

  const activeThemeConfig = THEMES.find(t => t.id === currentThemeId) || THEMES[0];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBgUpload(e);
    setHasBg(true);
  };
  const handleRemove = () => {
    onBgRemove();
    setHasBg(false);
  };

  return (
    <header
      className="h-14 md:h-16 px-4 md:px-6 flex justify-between items-center shrink-0 z-10 app-header border-b border-[var(--header-border,#e2e8f0)]"
    >
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100/30 text-slate-600 transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base md:text-lg font-black text-slate-800 app-header-title truncate max-w-[160px] md:max-w-none">
          {title}
        </h2>
        {isSyncing && (
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-amber-605 bg-amber-500/10 border border-amber-250/20 px-2 py-0.5 rounded-full animate-pulse">
            Syncing…
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:block relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
          <input
            type="text"
            onChange={e => onSearchChange(e.target.value)}
            placeholder="ค้นหางาน, ลูกค้า..."
            className="glass-input pl-9 pr-3 py-1.5 text-xs w-32 md:w-36 transition-all focus:w-48 text-slate-850 placeholder-slate-450"
          />
        </div>
        {onGlobalSearch && (
          <button
            onClick={onGlobalSearch}
            title="ค้นหาทุกอย่าง (⌘K)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-input text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="hidden md:inline text-[10px] text-slate-400 font-bold">⌘K</kbd>
          </button>
        )}

        {/* Theme Selector Button */}
        {onOpenTheme && (
          <button
            onClick={onOpenTheme}
            title="เปลี่ยนธีมระบบ (3 Design Systems)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-xs font-bold text-slate-700 hover:text-blue-600 transition-all cursor-pointer shadow-2xs"
          >
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline text-[11px] font-semibold text-slate-500">ธีม:</span>
            <span className="text-[11px] font-bold text-slate-800">{activeThemeConfig.name}</span>
          </button>
        )}

        {/* Background image picker */}
        <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <div className="flex items-center gap-1">
          <button
            title="เปลี่ยนภาพพื้นหลัง"
            onClick={() => bgFileRef.current?.click()}
            className="p-2 rounded-xl hover:bg-white/40 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          {hasBg && (
            <button
              title="ลบภาพพื้นหลัง"
              onClick={handleRemove}
              className="p-1.5 rounded-xl hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onNewTaskClick}
          className="btn-header-cta flex items-center gap-2 text-sm font-bold px-3 py-2 md:px-4 md:py-2 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">สร้างงานใหม่</span>
        </button>
      </div>
    </header>
  );
}
