import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Task } from '../../types';
import { cn } from '../../lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialTask?: Task | null;
}

export function TaskModal({ isOpen, onClose, onSave, initialTask }: TaskModalProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('รอดำเนินการ');
  const [customer, setCustomer] = useState('');
  const [priority, setPriority] = useState('ปานกลาง (Medium)');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tags, setTags] = useState('');
  const [details, setDetails] = useState('');
  const [aiAnalyzeEnabled, setAiAnalyzeEnabled] = useState(false);
  const [aiEmailEnabled, setAiEmailEnabled] = useState(false);
  const [aiCourseEnabled, setAiCourseEnabled] = useState(false);
  const [aiSubtasksEnabled, setAiSubtasksEnabled] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleAiEvaluate = async () => {
    if (!name.trim()) {
      alert("กรุณากรอกชื่องานก่อนประเมินค่ะ");
      return;
    }
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "evaluate",
          taskName: name,
          details: details,
          priority: priority,
          customer: customer
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to evaluate task");
      }
      
      const evalResult = data.result;
      if (evalResult) {
        if (evalResult.priority) setPriority(evalResult.priority);
        if (evalResult.tags) setTags(evalResult.tags);
      }
    } catch (e: any) {
      console.error(e);
      alert(`ไม่สามารถให้ AI ประเมินได้: ${e.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setName(initialTask.name || '');
        setStatus(initialTask.status || 'รอดำเนินการ');
        setCustomer(initialTask.customer || '');
        setPriority(initialTask.priority || 'ปานกลาง (Medium)');
        setPrice(initialTask.price?.toString() || '');
        setStartDate(initialTask.startDate || '');
        setEndDate(initialTask.endDate || '');
        setTags(initialTask.tags || '');
        setDetails(initialTask.details || '');
        setAiAnalyzeEnabled(false);
        setAiEmailEnabled(false);
        setAiCourseEnabled(false);
        setAiSubtasksEnabled(false);
      } else {
        setName('');
        setStatus('รอดำเนินการ');
        setCustomer('');
        setPriority('ปานกลาง (Medium)');
        setPrice('');
        setStartDate('');
        setEndDate('');
        setTags('');
        setDetails('');
        setAiAnalyzeEnabled(false);
        setAiEmailEnabled(false);
        setAiCourseEnabled(false);
        setAiSubtasksEnabled(false);
      }
      setIsGenerating(false);
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsGenerating(true);
    
    let subtasks = '';
    let aiAnalysis = '';
    let aiEmail = '';
    let aiCourse = '';

    const generateAi = async (type: string) => {
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            taskName: name,
            details,
            priority,
            customer
          })
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to generate AI data");
        }
        
        return data.result;
      } catch (e: any) {
        console.error(`Error generating ${type}:`, e);
        return `[ระบบ AI ขัดข้อง: ${e.message || 'กรุณาลองใหม่อีกครั้ง'}]`;
      }
    };

    if (aiSubtasksEnabled) {
      const steps = await generateAi("subtasks");
      subtasks = Array.isArray(steps) ? JSON.stringify(steps) : steps;
    }
    
    if (aiAnalyzeEnabled) {
      aiAnalysis = await generateAi("analysis");
    }

    if (aiEmailEnabled) {
      aiEmail = await generateAi("email");
    }

    if (aiCourseEnabled) {
      aiCourse = await generateAi("course");
    }

    onSave({
      name, customer, status, price: Number(price),
      startDate, endDate, tags, details, subtasks,
      aiAnalysis, aiEmail, aiCourse, priority
    });
    setIsGenerating(false);
    onClose();
  };

  const Toggle = ({ enabled, setEnabled, label, sublabel }: { enabled: boolean, setEnabled: (v: boolean) => void, label: string, sublabel?: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors group">
        <div>
            <h5 className="font-semibold text-gray-800 text-xs">{label}</h5>
            {sublabel && <p className="text-[10px] text-gray-500 mt-0.5">{sublabel}</p>}
        </div>
        <button 
            type="button" 
            onClick={() => setEnabled(!enabled)}
            className={cn("w-9 h-5 rounded-full transition-colors relative focus:outline-none", enabled ? "bg-indigo-500" : "bg-gray-200")}
        >
            <span className={cn("absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200", enabled ? "translate-x-4" : "")}></span>
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col my-8 h-full max-h-[90vh] relative">
        <div className="p-4 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 tracking-tight">
            {initialTask ? 'แก้ไขข้อมูลงาน' : 'เพิ่มงานใหม่'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-white border-t border-gray-100">
          <div className="p-6 text-sm space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex gap-1 items-center">
                  ชื่องาน <span className="text-red-500">*</span>
                </label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="เช่น ออกแบบหน้าเว็บ" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ลูกค้า</label>
                <input type="text" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="ระบุชื่อลูกค้า" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">สถานะ</label>
                <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400">
                  <option value="รอดำเนินการ">รอดำเนินการ</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ความสำคัญ</label>
                <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400">
                  <option value="ต่ำ (Low)">ต่ำ (Low)</option>
                  <option value="ปานกลาง (Medium)">ปานกลาง (Medium)</option>
                  <option value="สูง (High)">สูง (High)</option>
                  <option value="ด่วน (Urgent)">ด่วน (Urgent)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ราคา/งบประมาณ (฿)</label>
                <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">วันเริ่ม</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 focus:border-gray-400 focus:ring-1 focus:ring-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">วันสิ้นสุด</label>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 focus:border-gray-400 focus:ring-1 focus:ring-gray-400" />
              </div>
            </div>

            <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">แท็ก (คั่นด้วยลูกน้ำ)</label>
               <input type="text" value={tags} onChange={e=>setTags(e.target.value)} placeholder="เช่น Design, Urgent, Frontend" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400" />
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">รายละเอียดงาน</label>
                    <button 
                      type="button"
                      onClick={handleAiEvaluate}
                      disabled={isEvaluating}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-md transition-colors border border-indigo-100/50 disabled:opacity-50"
                    >
                        <Sparkles className="w-3.5 h-3.5" /> 
                        {isEvaluating ? "กำลังประเมิน..." : "AI ประเมิน Priority & แท็ก"}
                    </button>
                </div>
               <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={4} placeholder="อธิบายรายละเอียด ข้อกำหนด หรือข้อมูลที่จำเป็น..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none transition-shadow text-gray-800 placeholder-gray-400 resize-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"></textarea>
            </div>

            <div className="bg-indigo-50/40 rounded-xl border border-indigo-100/60 overflow-hidden">
                <div className="bg-indigo-100/40 p-4 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm">ให้ AI จัดการอัตโนมัติ</h4>
                        <p className="text-[11px] text-indigo-700/80">เลือกหัวข้อที่คุณต้องการให้ AI ช่วยทำงาน</p>
                    </div>
                </div>
                <div className="p-3 space-y-1">
                    <Toggle enabled={aiAnalyzeEnabled} setEnabled={setAiAnalyzeEnabled} label="วิเคราะห์งาน (Analysis)" sublabel="สรุปความสำคัญและความเสี่ยง" />
                    <Toggle enabled={aiEmailEnabled} setEnabled={setAiEmailEnabled} label="ร่างอีเมล (Draft Email)" sublabel="สร้างเนื้อหาเพื่อติดต่อลูกค้า" />
                    <Toggle enabled={aiCourseEnabled} setEnabled={setAiCourseEnabled} label="ร่างคอร์ส (Draft Course)" sublabel="วางโครงสร้างเนื้อหาบทเรียน" />
                    <Toggle enabled={aiSubtasksEnabled} setEnabled={setAiSubtasksEnabled} label="แตกงานย่อย (Subtasks)" sublabel="แบ่งงานออกเป็นขั้นตอนย่อย" />
                </div>
            </div>

          </div>
        </div>

        <div className="p-5 bg-[#f9f9f9] flex items-center gap-4 rounded-b-2xl shrink-0 relative">
          <div className="absolute left-6 text-gray-500 hover:bg-gray-200 p-1.5 rounded-lg transition-colors cursor-pointer" onClick={onClose}>
            <X className="w-5 h-5" />
          </div>
          <div className="flex-1"></div>
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm">ยกเลิก</button>
          <button 
            onClick={handleSave} 
            disabled={isGenerating}
            className={cn(
                "px-6 py-2.5 bg-[#17171f] hover:bg-black transition-all text-white rounded-lg font-medium shadow-sm text-sm flex items-center gap-2",
                isGenerating ? "opacity-70 cursor-not-allowed" : ""
            )}
          >
            {isGenerating ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังประมวลผลด้วย AI...
                </>
            ) : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
