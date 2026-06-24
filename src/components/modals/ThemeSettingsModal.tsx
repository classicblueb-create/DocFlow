import React, { useRef, useState } from 'react';
import { X, ImagePlus, Trash2 } from 'lucide-react';
import { getBackgroundImage, setBackgroundImage } from '../../lib/theme';

interface ThemeSettingsModalProps {
  onClose: () => void;
}

export function ThemeSettingsModal({ onClose }: ThemeSettingsModalProps) {
  const [bgPreview, setBgPreview] = useState<string | null>(() => getBackgroundImage());
  const fileRef = useRef<HTMLInputElement>(null);

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

  const removeBg = () => {
    setBgPreview(null);
    setBackgroundImage(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="glass-modal ds-fade-in-up rounded-3xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>ตั้งค่าธีม</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors duration-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>



        {/* Background image upload */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">พื้นหลัง (Glassmorphism)</p>
        {bgPreview ? (
          <div className="relative rounded-lg overflow-hidden mb-3 border border-slate-200 h-32">
            <img src={bgPreview} alt="พื้นหลัง" className="w-full h-full object-cover" />
            <button onClick={removeBg} title="ลบพื้นหลัง" className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#FF1493] shadow-sm cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-6 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#0080FF]/40 hover:text-[#0080FF] transition-colors duration-200 mb-3 cursor-pointer"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs font-semibold">อัปโหลดภาพพื้นหลัง</span>
          </button>
        )}
        {bgPreview && (
          <button onClick={() => fileRef.current?.click()} className="w-full text-xs font-bold text-[#0080FF] hover:text-[#006fdb] mb-3 cursor-pointer">
            เปลี่ยนภาพพื้นหลัง
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        <button onClick={onClose} className="btn-primary w-full py-3 text-sm cursor-pointer">
          เสร็จแล้ว
        </button>
      </div>
    </div>
  );
}
