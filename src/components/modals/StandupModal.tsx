import { Bot, X } from 'lucide-react';

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StandupModal({ isOpen, onClose }: StandupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-500"/> สรุปงานประจำวัน
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">สวัสดีค่ะ! วันนี้มีงานที่ต้องโฟกัส 3 งานนะคะ</p>
          <ul className="space-y-3 text-sm font-medium">
            <li className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-500"></div> 
              <div className="flex-1">งานด่วน: <span className="font-bold">รีวิว Tiktok</span></div>
            </li>
            <li className="flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div> 
              <div className="flex-1">กำลังทำ: <span className="font-bold">เชื่อม Google Sheets</span></div>
            </li>
            <li className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div> 
              <div className="flex-1">ส่งงาน: <span className="font-bold">เขียนบทความ SEO</span></div>
            </li>
          </ul>
          <div className="mt-6 flex justify-end">
             <button onClick={onClose} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600 transition-colors">รับทราบ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
