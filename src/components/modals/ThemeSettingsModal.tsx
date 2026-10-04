import React, { useRef, useState, useEffect } from 'react';
import { X, ImagePlus, Trash2, Check, Palette, Sparkles, RefreshCw } from 'lucide-react';
import { THEMES, ThemeId, getTheme, setTheme, getBackgroundImage, setBackgroundImage, clearCustomBackground } from '../../lib/theme';

interface ThemeSettingsModalProps {
  onClose: () => void;
  onThemeChanged?: (themeId: ThemeId) => void;
}

export function ThemeSettingsModal({ onClose, onThemeChanged }: ThemeSettingsModalProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => getTheme());
  const [bgPreview, setBgPreview] = useState<string | null>(() => getBackgroundImage());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail) setActiveTheme(e.detail);
    };
    window.addEventListener('docflow_theme_changed', handleThemeChange);
    return () => window.removeEventListener('docflow_theme_changed', handleThemeChange);
  }, []);

  const handleSelectTheme = (themeId: ThemeId) => {
    setActiveTheme(themeId);
    setTheme(themeId);
    setBgPreview(null);
    onThemeChanged?.(themeId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBgPreview(dataUrl);
      setBackgroundImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClearBackground = () => {
    clearCustomBackground();
    setBgPreview(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-modal ds-fade-in-up rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-4xl my-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                เลือกธีมระบบ (Design System Themes)
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  4 สไตล์จากภาพอ้างอิง
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                ถอดแบบสี การ์ดขอบมน และโครงสร้างตามภาพต้นแบบทั้ง 4 ภาพ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Themes Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {THEMES.map((t) => {
            const isSelected = activeTheme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className={`relative flex flex-col p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 text-left group ${
                  isSelected
                    ? 'border-blue-600 bg-white shadow-xl shadow-blue-500/10 scale-[1.02]'
                    : 'border-slate-200/90 bg-white/80 hover:bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Reference Badge */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wide">
                    {t.referenceLabel}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-slate-300 text-transparent group-hover:border-slate-400'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {/* Theme Mockup Visual Card */}
                <div
                  className="w-full h-28 rounded-xl p-2.5 flex flex-col justify-between mb-3 border shadow-inner relative overflow-hidden"
                  style={{
                    backgroundColor: t.colors.background,
                    borderColor: isSelected ? t.colors.primary : '#e2e8f0',
                  }}
                >
                  {/* Decorative Mini Layout */}
                  {t.id === 'salesmonk' && (
                    <div className="flex gap-1.5 h-full">
                      {/* Mini sidebar */}
                      <div className="w-7 bg-white rounded-lg p-1 flex flex-col gap-1 border border-slate-200 shadow-2xs">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm mb-1" />
                        <div className="w-full h-2 bg-blue-600 rounded-sm" />
                        <div className="w-full h-1.5 bg-slate-200 rounded-xs" />
                        <div className="w-full h-1.5 bg-slate-200 rounded-xs" />
                      </div>
                      {/* Mini canvas */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="w-full bg-white rounded-lg p-1.5 border border-slate-200 shadow-2xs flex items-center justify-between">
                          <div className="w-10 h-2 bg-blue-600 rounded-sm" />
                          <div className="w-4 h-2 bg-emerald-100 rounded-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="bg-blue-600 rounded-md p-1 flex flex-col justify-end text-[7px] text-white font-bold">
                            $14.8k
                          </div>
                          <div className="bg-white rounded-md p-1 border border-slate-200 flex flex-col justify-end text-[7px] text-slate-800 font-bold">
                            $122k
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {t.id === 'saddam' && (
                    <div className="flex gap-1.5 h-full">
                      {/* Mini sidebar */}
                      <div className="w-6 bg-white rounded-lg p-1 flex flex-col items-center gap-1 border border-slate-200 shadow-2xs">
                        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mb-1" />
                        <div className="w-2 h-2 bg-slate-300 rounded-full" />
                        <div className="w-2 h-2 bg-slate-300 rounded-full" />
                      </div>
                      {/* Mini canvas with 4 stat circles */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="w-full bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-between">
                          <div className="w-10 h-1.5 bg-slate-800 rounded-xs" />
                          <div className="w-5 h-1.5 bg-slate-900 rounded-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="bg-white rounded-md p-1 border border-slate-200 flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-indigo-100 flex items-center justify-center text-[5px] text-indigo-700">★</div>
                            <div className="text-[6px] font-bold text-slate-800">1,589</div>
                          </div>
                          <div className="bg-white rounded-md p-1 border border-slate-200 flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center text-[5px] text-emerald-700">★</div>
                            <div className="text-[6px] font-bold text-slate-800">$160k</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {t.id === 'editorial' && (
                    <div className="flex gap-1.5 h-full">
                      {/* Mini sidebar */}
                      <div className="w-7 bg-[#f7f2ea] rounded-lg p-1 flex flex-col gap-1 border border-[#ede5d8]">
                        <div className="w-2.5 h-2.5 bg-[#1c1917] rounded-full mb-1" />
                        <div className="w-full h-2 bg-[#1c1917] rounded-full" />
                        <div className="w-full h-1.5 bg-[#d6cebf] rounded-xs" />
                      </div>
                      {/* Mini canvas with pastel sorbet chips */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="w-14 h-2 bg-[#1c1917] rounded-sm" />
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="bg-[#fed7aa] rounded-lg p-1 border border-[#fdba74]/50 flex flex-col justify-between">
                            <div className="w-6 h-1 bg-[#9a3412] rounded-xs" />
                            <div className="text-[6px] font-bold text-[#9a3412]">Course</div>
                          </div>
                          <div className="bg-[#d1fae5] rounded-lg p-1 border border-[#86efac]/50 flex flex-col justify-between">
                            <div className="w-6 h-1 bg-[#166534] rounded-xs" />
                            <div className="text-[6px] font-bold text-[#166534]">Writing</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {t.id === 'dei' && (
                    <div className="flex gap-1.5 h-full">
                      {/* Mini obsidian sidebar */}
                      <div className="w-7 bg-[#090a0f] rounded-lg p-1 flex flex-col gap-1 border border-white/10">
                        <div className="w-2.5 h-2.5 bg-[#10b981] rounded-sm mb-1" />
                        <div className="w-full h-2 bg-[#10b981] rounded-sm" />
                        <div className="w-full h-1.5 bg-white/20 rounded-xs" />
                      </div>
                      {/* Mini porcelain canvas with bento cards */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="w-full bg-white rounded-lg p-1 border border-slate-200 shadow-2xs flex items-center justify-between">
                          <div className="w-10 h-1.5 bg-slate-900 rounded-sm" />
                          <div className="px-1 py-0.5 rounded-sm bg-[#10b981]/20 text-[#042f2e] text-[5.5px] font-black">
                            Dei
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-2xs flex flex-col justify-between">
                            <div className="w-3 h-1 bg-slate-900 rounded-xs" />
                            <div className="w-full h-2 bg-[#f3e8ff] rounded-xs flex items-center justify-center text-[5.5px] text-purple-700 font-bold">
                              Bento
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-2xs flex flex-col justify-between">
                            <div className="w-3 h-1 bg-slate-900 rounded-xs" />
                            <div className="w-full h-2 bg-[#d1fae5] rounded-xs flex items-center justify-center text-[5.5px] text-emerald-800 font-bold">
                              Mint
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Name & Info */}
                <h3 className="font-bold text-sm text-slate-900 mb-0.5">
                  {t.name}
                </h3>
                <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mb-3 flex-1 line-clamp-2">
                  {t.tagline}
                </p>

                {/* Color Swatch Dots */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  {t.colors.swatches.slice(0, 5).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Wallpaper Notice & Clear Action */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">
              {bgPreview ? 'กำลังใช้ภาพพื้นหลังคัสตอม (อาจบดบังแคนวาสของธีม)' : 'ใช้พื้นผิวแคนวาสของธีมต้นแบบแท้จริง (ไม่มีภาพบดบัง)'}
            </span>
          </div>
          {bgPreview && (
            <button
              onClick={handleClearBackground}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> ล้างภาพวอลเปเปอร์เดิม
            </button>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="btn-primary w-full py-3 text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-all"
        >
          เลือกธีมนี้และใช้งาน
        </button>
      </div>
    </div>
  );
}
