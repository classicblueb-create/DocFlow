import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';

interface DocSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function DocSettingsModal({ isOpen, onClose, onSave }: DocSettingsModalProps) {
  const [bizName, setBizName] = useState(() => localStorage.getItem('bizName') || 'MODTY.AI (ศศิวรรณ จันทร์แดง)');
  const [bizAddress, setBizAddress] = useState(() => localStorage.getItem('bizAddress') || '5/4 หมู่6 ตำบล เขาวง อำเภอ พระพุทธบาท จังหวัด สระบุรี 18120');
  const [bizTax, setBizTax] = useState(() => localStorage.getItem('bizTax') || '1199600115041');
  const [bizBank, setBizBank] = useState(() => localStorage.getItem('bizBank') || 'ธนาคารกสิกรไทย\nชื่อบัญชี: ศศิวรรณ จันทร์แดง\nเลขบัญชี: 160-2-46775-5');
  const [bizLogo, setBizLogo] = useState(() => localStorage.getItem('bizLogo') || '');

  const handleSave = () => {
    localStorage.setItem('bizName', bizName);
    localStorage.setItem('bizAddress', bizAddress);
    localStorage.setItem('bizTax', bizTax);
    localStorage.setItem('bizBank', bizBank);
    localStorage.setItem('bizLogo', bizLogo);
    onSave();
    onClose();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBizLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" /> ตั้งค่าข้อมูลบริษัท
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 text-sm space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-bold mb-1 block">โลโก้บริษัท</label>
            <div className="flex items-center gap-4">
              {bizLogo ? (
                <div className="relative w-16 h-16 rounded-lg border overflow-hidden bg-gray-100 flex items-center justify-center group shrink-0">
                  <img src={bizLogo} alt="Logo preview" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setBizLogo('')} 
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    ลบ
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-gray-400 bg-gray-50 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">ชื่อบริษัท / ผู้ติดต่อ</label>
              <input type="text" value={bizName} onChange={e=>setBizName(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-clickup-purple" placeholder="ชื่อบริษัท" />
          </div>
          <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">ที่อยู่</label>
              <input type="text" value={bizAddress} onChange={e=>setBizAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-clickup-purple" placeholder="ที่อยู่" />
          </div>
          <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">เลขประจำตัวผู้เสียภาษี</label>
              <input type="text" value={bizTax} onChange={e=>setBizTax(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-clickup-purple" placeholder="TAX ID" />
          </div>
          <div>
              <label className="text-xs text-gray-500 font-bold mb-1 block">รายละเอียดการชำระเงิน (ธนาคาร)</label>
              <textarea value={bizBank} onChange={e=>setBizBank(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-clickup-purple"></textarea>
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors rounded-lg font-bold text-sm">ยกเลิก</button>
          <button onClick={handleSave} className="px-4 py-2 bg-clickup-purple text-white hover:bg-indigo-600 transition-colors rounded-lg font-bold text-sm">บันทึก</button>
        </div>
      </div>
    </div>
  );
}
