import { useState, useRef } from 'react';
import { Settings, Send, Plus, FileCheck2, Link, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Client } from '../../types';

interface DocFlowViewProps {
  onOpenSettings: () => void;
  showNotification: (msg: string, isError?: boolean) => void;
  clients: Client[];
  settingsVersion?: number;
}

export function DocFlowView({ onOpenSettings, showNotification, clients, settingsVersion }: DocFlowViewProps) {
  const [docType, setDocType] = useState('Quotation');
  const [docNumber, setDocNumber] = useState('QT26-004');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [items, setItems] = useState([{ id: 1, desc: 'รีวิว Tiktok 1 คลิป คอร์ส RAG AI', qty: 1, price: 7009.35 }]);
  const [includeVat, setIncludeVat] = useState(true);
  const [docNotes, setDocNotes] = useState('');
  const [docConditions, setDocConditions] = useState('');
  const [aiInput, setAiInput] = useState('');
  
  const docRef = useRef<HTMLDivElement>(null);

  const bizName = localStorage.getItem('bizName') || 'MODTY.AI (ศศิวรรณ จันทร์แดง)';
  const bizAddress = localStorage.getItem('bizAddress') || '5/4 หมู่6 ตำบล เขาวง อำเภอ พระพุทธบาท จังหวัด สระบุรี 18120';
  const bizTax = localStorage.getItem('bizTax') || '1199600115041';
  const bizBank = localStorage.getItem('bizBank') || 'ธนาคารกสิกรไทย\nชื่อบัญชี: ศศิวรรณ จันทร์แดง\nเลขบัญชี: 160-2-46775-5';
  const bizLogo = localStorage.getItem('bizLogo') || '';

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const vat = includeVat ? subtotal * 0.07 : 0;
  const total = subtotal + vat;

  const handleAiSend = () => {
    if(!aiInput.trim()) return;
    showNotification('ระบบ AI วิเคราะห์เอกสารทำงานอยู่เบื้องหลังค่ะ');
    setAiInput('');
  };

  const handleGeneratePdf = async () => {
    if(!customerName) {
        showNotification('กรุณากรอกชื่อลูกค้าก่อนค่ะ', true);
        return;
    }
    
    if (!docRef.current) return;

    try {
      showNotification('กำลังสร้างไฟล์ PDF...');
      
      // Some images might be external, allow taint
      const canvas = await html2canvas(docRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${docType}_${docNumber}.pdf`);
      
      showNotification('ดาวน์โหลดไฟล์ PDF สำเร็จ');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('เกิดข้อผิดพลาดในการสร้าง PDF', true);
    }
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClientId(val);
    if(val) {
      const client = clients.find(c => c.id === val);
      if(client) {
        setCustomerName(client.name);
        setCustomerAddress(client.address);
        setCustomerTaxId(client.taxId);
      }
    } else {
      setCustomerName('');
      setCustomerAddress('');
      setCustomerTaxId('');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      <div className="flex flex-col lg:flex-row w-full h-full relative">
        <button onClick={onOpenSettings} className="absolute top-4 right-4 z-50 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg shadow-sm hover:text-clickup-purple transition flex items-center gap-1.5 text-xs font-bold">
          <Settings className="w-4 h-4" /> ตั้งค่าเอกสาร
        </button>
        
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 h-full flex flex-col bg-white border-r border-gray-200 shadow-sm z-10 overflow-y-auto hide-scrollbar pb-10">
          <div className="p-5 border-b border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 shrink-0">
            <div className="relative flex items-center">
              <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSend()} placeholder="พิมพ์สั่ง AI: 'ออกใบเสนอราคาให้ บจก.ใจดี...'" className="w-full pl-4 pr-12 py-3 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm outline-none" />
              <button onClick={handleAiSend} className="absolute right-2 w-8 h-8 rounded-lg bg-indigo-600 text-white flex justify-center items-center hover:bg-indigo-700 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-1">ประเภท</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white">
                  <option value="Quotation">ใบเสนอราคา</option>
                  <option value="Invoice">ใบแจ้งหนี้</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-1">เลขที่เอกสาร</label>
                <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none uppercase font-bold text-clickup-purple" />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center mb-1">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">ข้อมูลลูกค้า</h4>
                 <select value={selectedClientId} onChange={handleClientChange} className="text-xs border rounded px-2 py-1 outline-none bg-white max-w-[200px]">
                    <option value="">เลือกจากฐานข้อมูล...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                 </select>
              </div>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="ชื่อลูกค้า / บริษัท" className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-2" />
              <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="ที่อยู่" className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-2 resize-none h-16" />
              <input type="text" value={customerTaxId} onChange={e => setCustomerTaxId(e.target.value)} placeholder="เลขประจำตัวผู้เสียภาษี" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" />
            </div>

            <div className="flex justify-between items-end mb-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">รายการสินค้า</h4>
              <button 
                onClick={() => setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }])}
                className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-100"
              >
                <Plus className="w-3 h-3" /> เพิ่ม
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-gray-100 grid grid-cols-12 gap-2 p-2 font-bold text-gray-600 border-b border-gray-200 text-center">
                <div className="col-span-6 text-left pl-2">รายละเอียด</div>
                <div className="col-span-2">จำนวน</div>
                <div className="col-span-3">ราคา/หน่วย</div>
                <div className="col-span-1"></div>
              </div>
              <div className="flex flex-col bg-white">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-b border-gray-100 items-center">
                    <div className="col-span-6"><input type="text" value={item.desc} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, desc: e.target.value} : i))} className="w-full border border-gray-200 rounded px-2 py-1" /></div>
                    <div className="col-span-2"><input type="number" value={item.qty} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, qty: Number(e.target.value)} : i))} className="w-full border border-gray-200 rounded px-2 py-1 text-center" /></div>
                    <div className="col-span-3"><input type="number" value={item.price} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, price: Number(e.target.value)} : i))} className="w-full border border-gray-200 rounded px-2 py-1 text-right" /></div>
                    <div className="col-span-1 flex justify-center"><button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                 <label className="block text-gray-700 text-xs font-bold mb-1">หมายเหตุเพิ่มเติม</label>
                 <textarea value={docNotes} onChange={e => setDocNotes(e.target.value)} placeholder="Ex: โอนเงินภายใน 7 วัน" className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none h-16" />
              </div>
              <div>
                 <label className="block text-gray-700 text-xs font-bold mb-1">เงื่อนไขการชำระเงิน</label>
                 <textarea value={docConditions} onChange={e => setDocConditions(e.target.value)} placeholder="Ex: มัดจำ 50% ก่อนเริ่มงาน" className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none h-16" />
              </div>
            </div>

            <div className="flex justify-between items-start pt-4 border-t border-gray-200 mt-auto">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={includeVat} onChange={e => setIncludeVat(e.target.checked)} className="rounded text-indigo-600" />
                  VAT 7%
                </label>
              </div>
              <div className="w-48 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>รวม</span><span>฿{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>ภาษี</span><span>฿{vat.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg text-indigo-700 border-t pt-2 mt-2"><span>ยอดสุทธิ</span><span>฿{total.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t">
              <button onClick={handleGeneratePdf} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center gap-2">
                <FileCheck2 className="w-5 h-5" /> สร้าง PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Side: Preview */}
        <div className="w-full lg:w-1/2 h-full bg-gray-200 p-6 lg:p-10 flex justify-center items-start overflow-y-auto">
          <div ref={docRef} className="bg-white w-full max-w-[600px] min-h-[848px] p-8 sm:p-12 shadow-md border text-sm flex flex-col relative aspect-auto">
            <div className="flex justify-between items-start mb-8 border-b pb-4 shrink-0">
              <div className="flex gap-4 items-center">
                {bizLogo ? (
                   <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      <img src={bizLogo} alt="Business Logo" className="w-full h-full object-contain" />
                   </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {bizName ? bizName.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-gray-800">{bizName}</h1>
                  <p className="text-xs text-gray-500 whitespace-pre-wrap">{bizAddress}</p>
                  <p className="text-xs text-gray-500">เลขประจำตัวผู้เสียภาษี: {bizTax}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-widest">{docType === 'Quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'}</h2>
                <h3 className="text-sm font-bold text-indigo-800 uppercase mb-1">{docType.toUpperCase()}</h3>
                <div className="text-xs text-gray-600">เลขที่: <b>{docNumber}</b></div>
                <div className="text-xs text-gray-600">วันที่: <b>{new Date().toLocaleDateString('th-TH')}</b></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="mb-6 pb-4 border-l-2 border-indigo-500 pl-4 shrink-0 bg-gray-50/50 p-2 rounded-r-lg">
                <p className="text-xs text-gray-500 font-bold mb-1 uppercase">ลูกค้า (CUSTOMER)</p>
                <p className="font-bold text-sm text-gray-800">{customerName || 'ยังไม่ได้ระบุชื่อลูกค้า'}</p>
                <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{customerAddress || 'ยังไม่ได้ระบุที่อยู่'}</p>
                <p className="text-xs text-gray-600 mt-0.5">TAX ID: {customerTaxId || 'ยังไม่ได้ระบุเลขประจำตัวผู้เสียภาษี'}</p>
              </div>

              <div className="mb-6 flex-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600">
                        <th className="py-2 px-2 text-left w-3/5">รายละเอียด</th>
                        <th className="py-2 px-2 text-center w-1/5">จำนวน</th>
                        <th className="py-2 px-2 text-right w-1/5">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 px-2 break-words">{item.desc}</td>
                          <td className="py-2 px-2 text-center">{item.qty}</td>
                          <td className="py-2 px-2 text-right">฿{(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>

              <div className="shrink-0 flex justify-between items-end pt-4 border-t mt-auto">
                <div className="text-xs text-gray-500 w-[55%] pr-4 space-y-4">
                  {(docNotes || docConditions) && (
                      <div className="space-y-1">
                        {docNotes && <div><p className="font-bold text-gray-700">หมายเหตุ:</p><p className="whitespace-pre-wrap">{docNotes}</p></div>}
                        {docConditions && <div><p className="font-bold text-gray-700 mt-2">เงื่อนไข:</p><p className="whitespace-pre-wrap">{docConditions}</p></div>}
                      </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-700 mb-1">รายละเอียดการชำระเงิน:</p>
                    <p className="whitespace-pre-wrap">{bizBank}</p>
                  </div>
                </div>
                <div className="w-[45%] max-w-[220px] text-xs self-end">
                  <div className="flex justify-between py-1 text-gray-600"><span>รวมเป็นเงิน</span><span>฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between py-1 text-gray-600"><span>ภาษีมูลค่าเพิ่ม 7%</span><span>฿{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between py-2 font-bold text-sm text-gray-800 border-t mt-1"><span>จำนวนเงินรวมทั้งสิ้น</span><span>฿{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
              </div>
              
              <div className="mt-10 pt-4 border-t flex justify-between px-4 text-center shrink-0">
                  <div className="w-1/2">
                      <div className="text-xs text-gray-500 mb-8">ผู้รับสินค้า / บริการ</div>
                      <div className="border-b border-gray-300 w-32 mx-auto mb-2"></div>
                      <div className="text-xs text-gray-500">วันที่ _____/_____/_____</div>
                  </div>
                  <div className="w-1/2">
                      <div className="text-xs text-gray-500 mb-8">ผู้อนุมัติ / ผู้มีอำนาจลงนาม</div>
                      <div className="border-b border-gray-300 w-32 mx-auto mb-2"></div>
                      <div className="text-xs text-gray-500">วันที่ _____/_____/_____</div>
                  </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
