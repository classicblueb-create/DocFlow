import { useState, useEffect } from 'react';
import { X, Sparkles, Link, Send, BellPlus } from 'lucide-react';
import { Task, ProjectCategory } from '../../types';
import { cn } from '../../lib/utils';

interface TaskModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSave: (task: Partial<Task>) => void;
 initialTask?: Task | null;
 categories?: ProjectCategory[];
}

export function TaskModal({ isOpen, onClose, onSave, initialTask, categories = [] }: TaskModalProps) {
 const [name, setName] = useState('');
 const [status, setStatus] = useState('To Do');
 const [customer, setCustomer] = useState('');
 const [priority, setPriority] = useState('ปานกลาง (Medium)');
 const [price, setPrice] = useState('');
 const [devCost, setDevCost] = useState('');
 const [myIncome, setMyIncome] = useState('');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
 const [tags, setTags] = useState('');
 const [details, setDetails] = useState('');
 const [assignee, setAssignee] = useState<'Fan' | 'Mod' | ''>('');
 const [categoryId, setCategoryId] = useState('');
 const [fileUrl, setFileUrl] = useState('');
 const [prevAssignee, setPrevAssignee] = useState<string>('');
 const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
 const [pipelineStage, setPipelineStage] = useState<string>('');
 const [lostReason, setLostReason] = useState('');

 const [aiAnalyzeEnabled, setAiAnalyzeEnabled] = useState(false);
 const [aiEmailEnabled, setAiEmailEnabled] = useState(false);
 const [aiCourseEnabled, setAiCourseEnabled] = useState(false);
 const [aiSubtasksEnabled, setAiSubtasksEnabled] = useState(false);
 const [isGenerating, setIsGenerating] = useState(false);
 const [isEvaluating, setIsEvaluating] = useState(false);

 useEffect(() => {
 if (isOpen) {
 if (initialTask) {
 setName(initialTask.name || '');
 setStatus(initialTask.status || 'To Do');
 setCustomer(initialTask.customer || '');
 setPriority(initialTask.priority || 'ปานกลาง (Medium)');
 setPrice(initialTask.price?.toString() || '');
 setDevCost(initialTask.devCost?.toString() || '');
 setMyIncome(initialTask.myIncome?.toString() || '');
 setStartDate(initialTask.startDate || '');
 setEndDate(initialTask.endDate || '');
 setTags(initialTask.tags || '');
 setDetails(initialTask.details || '');
 setAssignee((initialTask.assignee as any) || '');
 setCategoryId(initialTask.categoryId || '');
 setPrevAssignee((initialTask.assignee as any) || '');
 setFileUrl(initialTask.fileUrl || '');
 setPipelineStage(initialTask.pipelineStage || '');
 const lostReasonLine = initialTask.details?.split('\n').find(l => l.startsWith('[ไม่ได้งานเนื่องจาก]:'));
 setLostReason(lostReasonLine ? lostReasonLine.replace('[ไม่ได้งานเนื่องจาก]:', '').trim() : '');
 } else {
 setName(''); setStatus('To Do'); setCustomer('');
 setPriority('ปานกลาง (Medium)'); setPrice(''); setDevCost(''); setMyIncome('');
 setStartDate(''); setEndDate(''); setTags(''); setDetails('');
 setAssignee(''); setCategoryId(''); setPrevAssignee(''); setFileUrl(''); setPipelineStage('');
 setLostReason('');
 }
 setAiAnalyzeEnabled(false); setAiEmailEnabled(false);
 setAiCourseEnabled(false); setAiSubtasksEnabled(false);
 setIsGenerating(false); setTelegramStatus('idle');
 }
 }, [isOpen, initialTask]);

 if (!isOpen) return null;

 const handleAiEvaluate = async () => {
 if (!name.trim()) { alert('กรุณากรอกชื่องานก่อนประเมินค่ะ'); return; }
 setIsEvaluating(true);
 try {
 const res = await fetch('/api/ai/generate', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ type: 'evaluate', taskName: name, details, priority, customer }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Failed');
 if (data.result?.priority) setPriority(data.result.priority);
 if (data.result?.tags) setTags(data.result.tags);
 } catch (e: any) {
 alert(`ไม่สามารถให้ AI ประเมินได้: ${e.message}`);
 } finally { setIsEvaluating(false); }
 };

 const handleSave = async () => {
 setIsGenerating(true);
 let subtasks = '', aiAnalysis = '', aiEmail = '', aiCourse = '';

 const generateAi = async (type: string) => {
 try {
 const res = await fetch('/api/ai/generate', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ type, taskName: name, details, priority, customer }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Failed');
 return data.result;
 } catch (e: any) { return `[AI Error: ${e.message}]`; }
 };

 if (aiSubtasksEnabled) {
 const steps = await generateAi('subtasks');
 subtasks = Array.isArray(steps) ? JSON.stringify(steps) : steps;
 }
 if (aiAnalyzeEnabled) aiAnalysis = await generateAi('analysis');
 if (aiEmailEnabled) aiEmail = await generateAi('email');
 if (aiCourseEnabled) aiCourse = await generateAi('course');

 const priceNum = Number(price) || 0;
 const devCostNum = Number(devCost) || 0;
 const myIncomeNum = myIncome !== '' ? Number(myIncome) : priceNum - devCostNum;
 const cleanDetails = details.replace(/\[ไม่ได้งานเนื่องจาก\]:\s*.*\n?/, '').trim();
 const finalDetails = pipelineStage === 'lost' && lostReason.trim()
   ? `[ไม่ได้งานเนื่องจาก]: ${lostReason.trim()}\n${cleanDetails}`.trim()
   : cleanDetails;

 onSave({
 name, customer, status, price: priceNum,
 devCost: devCostNum || undefined,
 myIncome: myIncomeNum || undefined,
 startDate, endDate, tags, details: finalDetails, subtasks,
 aiAnalysis, aiEmail, aiCourse, priority,
 assignee: assignee || undefined,
 categoryId: categoryId || undefined,
 fileUrl: fileUrl || undefined,
 pipelineStage: (pipelineStage as any) || undefined,
 });

  // ส่ง Telegram notification เมื่อมีการ assign ใหม่หรือเปลี่ยน assignee
  if (assignee && assignee !== prevAssignee) {
    setTelegramStatus('sending');
    try {
      const res = await fetch('/api/notify/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: name,
          assignee,
          dueDate: endDate || '',
          fileUrl: fileUrl || '',
          details: details || '',
          customer: customer || '',
        }),
      });
      setTelegramStatus(res.ok ? 'sent' : 'error');
    } catch {
      setTelegramStatus('error');
    }
  }

 setIsGenerating(false);
 onClose();
 };

 const Toggle = ({ enabled, setEnabled, label, sublabel }: {
 enabled: boolean; setEnabled: (v: boolean) => void; label: string; sublabel?: string;
 }) => (
 <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors">
 <div>
 <h5 className="font-semibold text-slate-800 text-xs">{label}</h5>
 {sublabel && <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>}
 </div>
 <button
 type="button"
 onClick={() => setEnabled(!enabled)}
 className={cn('w-9 h-5 rounded-full transition-colors relative focus:outline-none cursor-pointer', enabled ? 'bg-indigo-500' : 'bg-slate-200')}
 >
 <span className={cn('absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200', enabled ? 'translate-x-4' : '')} />
 </button>
 </div>
 );

 return (
 <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
 <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col my-8 max-h-[90vh]">
 <div className="p-4 flex justify-between items-center border-b border-slate-100 shrink-0">
 <h2 className="text-xl font-bold text-slate-800">{initialTask ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</h2>
 <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
 </div>

 <div className="flex-1 overflow-y-auto">
 <div className="p-6 space-y-5 text-sm">

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่องาน <span className="text-red-500">*</span></label>
 <input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น ออกแบบหน้าเว็บ"
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-slate-800" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">ลูกค้า</label>
 <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="ระบุชื่อลูกค้า"
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-slate-800" />
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">สถานะ</label>
 <select value={status} onChange={e => setStatus(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none bg-white text-slate-800 cursor-pointer focus:border-indigo-400">
 <option value="To Do">To Do</option>
 <option value="In Progress">In Progress</option>
 <option value="Waiting">Waiting</option>
 <option value="Done">Done</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">ความสำคัญ</label>
 <select value={priority} onChange={e => setPriority(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none bg-white text-slate-800 cursor-pointer focus:border-indigo-400">
 <option value="ต่ำ (Low)">ต่ำ (Low)</option>
 <option value="ปานกลาง (Medium)">ปานกลาง (Medium)</option>
 <option value="สูง (High)">สูง (High)</option>
 <option value="ด่วน (Urgent)">ด่วน (Urgent)</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">ผู้รับผิดชอบ</label>
 <select value={assignee} onChange={e => setAssignee(e.target.value as any)}
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none bg-white text-slate-800 cursor-pointer focus:border-indigo-400">
 <option value="">ไม่ระบุ</option>
 <option value="Fan">Fan</option>
 <option value="Mod">Mod</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">โปรเจค</label>
 <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none bg-white text-slate-800 cursor-pointer focus:border-indigo-400">
 <option value="">ไม่ระบุโปรเจค</option>
 {categories.map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">ราคา (฿)</label>
 <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-slate-800" />
 </div>
 </div>

 {/* Financial breakdown */}
 <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
 <div>
 <label className="block text-xs font-bold text-rose-500 mb-1.5">จ้าง Dev (฿)</label>
 <input
 type="number"
 value={devCost}
 onChange={e => {
 setDevCost(e.target.value);
 const p = Number(price) || 0;
 const d = Number(e.target.value) || 0;
 if (myIncome === '') setMyIncome(String(p - d > 0 ? p - d : 0));
 }}
 placeholder="0"
 className="w-full border border-rose-200 rounded-xl px-3 py-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50 text-slate-800"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-emerald-600 mb-1.5">กำไรสุทธิ (฿)</label>
 <input
 type="number"
 value={myIncome !== '' ? myIncome : (Number(price) - Number(devCost) > 0 ? Number(price) - Number(devCost) : 0)}
 onChange={e => setMyIncome(e.target.value)}
 placeholder={String(Number(price) - Number(devCost) || 0)}
 className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
 />
 <p className="text-[10px] text-slate-400 mt-1">คำนวณอัตโนมัติ: ราคา − Dev</p>
 </div>
 </div>

 {assignee && (
 <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
 <div className="flex items-center gap-2">
 <Link className="w-4 h-4 text-indigo-500 shrink-0" />
 <span className="text-xs font-bold text-indigo-800">ลิงก์ไฟล์งาน (สำหรับแจ้ง Telegram)</span>
 </div>
 <input
 type="url"
 value={fileUrl}
 onChange={e => setFileUrl(e.target.value)}
 placeholder="https://drive.google.com/... หรือ https://docs.google.com/..."
 className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-slate-800 bg-white text-sm"
 />
 {assignee !== prevAssignee && (
 <p className="text-[11px] text-indigo-600 flex items-center gap-1">
 <Send className="w-3 h-3" />
 จะส่งแจ้งเตือน Telegram อัตโนมัติเมื่อบันทึก
 </p>
 )}
  {telegramStatus === 'sent' && <p className="text-[11px] text-emerald-600 font-semibold"> ส่ง Telegram แจ้งเตือนสำเร็จ</p>}
  {telegramStatus === 'error' && <p className="text-[11px] text-red-500"> ส่ง Telegram ไม่สำเร็จ (ตรวจสอบ TELEGRAM_BOT_TOKEN)</p>}
 </div>
 )}

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">วันเริ่ม</label>
 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-800" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">วันกำหนดส่ง</label>
 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-800" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">แท็ก (คั่นด้วยลูกน้ำ)</label>
 <input value={tags} onChange={e => setTags(e.target.value)} placeholder="เช่น Design, Urgent, Frontend"
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-slate-800" />
 </div>

 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="text-xs font-bold text-slate-600">รายละเอียดงาน</label>
 <button type="button" onClick={handleAiEvaluate} disabled={isEvaluating}
 className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-100 disabled:opacity-50 cursor-pointer transition-colors">
 <Sparkles className="w-3.5 h-3.5" />
 {isEvaluating ? 'กำลังประเมิน...' : 'AI ประเมิน Priority & แท็ก'}
 </button>
 </div>
 <textarea value={details} onChange={e => setDetails(e.target.value)} rows={4}
 placeholder="อธิบายรายละเอียด ข้อกำหนด..."
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-slate-800 resize-none" />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-600 mb-1.5">Pipeline Stage (ถ้ามี)</label>
 <select value={pipelineStage} onChange={e => setPipelineStage(e.target.value)}
 className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none bg-white text-slate-800 cursor-pointer focus:border-indigo-400">
  <option value="">ไม่อยู่ใน Pipeline</option>
  <option value="lead">Lead</option>
  <option value="opportunity">Opportunity</option>
  <option value="proposal">Proposal / Quote</option>
  <option value="negotiation">Negotiation</option>
  <option value="won">Closed Won</option>
  <option value="lost">Closed Lost</option>
  </select>

 {pipelineStage === 'lost' && (
   <div className="mt-3">
     <label className="block text-xs font-bold text-rose-600 mb-1.5 animate-fadeIn">เหตุผลที่ไม่ได้งาน</label>
     <input 
       value={lostReason} 
       onChange={e => setLostReason(e.target.value)} 
       placeholder="เช่น ราคาแพงเกินไป / ลูกค้าเงียบหาย..."
       className="w-full border border-rose-200 focus:border-rose-450 focus:ring-rose-50 rounded-xl px-3 py-2.5 outline-none text-slate-800 animate-fadeIn" 
     />
   </div>
 )}
 </div>

 <div className="bg-indigo-50/40 rounded-xl border border-indigo-100/60 overflow-hidden">
 <div className="bg-indigo-100/40 p-4 flex items-center gap-3">
 <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
 <div>
 <h4 className="font-bold text-indigo-900 text-sm">ให้ AI จัดการอัตโนมัติ</h4>
 <p className="text-[11px] text-indigo-700/80">เลือกหัวข้อที่คุณต้องการให้ AI ช่วยทำงาน</p>
 </div>
 </div>
 <div className="p-3 space-y-0.5">
 <Toggle enabled={aiAnalyzeEnabled} setEnabled={setAiAnalyzeEnabled} label="วิเคราะห์งาน (Analysis)" sublabel="สรุปความสำคัญและความเสี่ยง" />
 <Toggle enabled={aiEmailEnabled} setEnabled={setAiEmailEnabled} label="ร่างอีเมล (Draft Email)" sublabel="สร้างเนื้อหาเพื่อติดต่อลูกค้า" />
 <Toggle enabled={aiCourseEnabled} setEnabled={setAiCourseEnabled} label="ร่างคอร์ส (Draft Course)" sublabel="วางโครงสร้างเนื้อหาบทเรียน" />
 <Toggle enabled={aiSubtasksEnabled} setEnabled={setAiSubtasksEnabled} label="แตกงานย่อย (Subtasks)" sublabel="แบ่งงานออกเป็นขั้นตอนย่อย" />
 </div>
 </div>

 </div>
 </div>

 <div className="p-4 bg-slate-50 flex items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 shrink-0">
   <button
     onClick={async () => {
       if (!name.trim()) return;
       try {
         const res = await fetch('/api/reminders/create', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ title: name, dueDate: endDate || undefined, notes: details || undefined })
         });
         const data = await res.json();
         alert(res.ok ? `✅ ${data.message}` : `❌ ${data.error}`);
       } catch (e: any) { alert(`❌ ${e.message}`); }
     }}
     disabled={!name.trim()}
     title="เพิ่มใน iPhone Reminders"
     className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer disabled:opacity-40"
   >
     <BellPlus className="w-3.5 h-3.5" /> Reminders
   </button>
   <div className="flex items-center gap-3">
     <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors cursor-pointer">ยกเลิก</button>
     <button
       onClick={handleSave}
       disabled={isGenerating || !name.trim()}
       className={cn(
         'px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer',
         (isGenerating || !name.trim()) ? 'opacity-60 cursor-not-allowed' : ''
       )}
     >
       {isGenerating ? (
         <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังประมวลผล...</>
       ) : 'บันทึก'}
     </button>
   </div>
 </div>
 </div>
 </div>
 );
}
