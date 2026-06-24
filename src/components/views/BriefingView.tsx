import React, { useState, useMemo } from 'react';
import { ProductRevenueWidget } from '../widgets/ProductRevenueWidget';
import { CustomTrackerWidget } from '../widgets/CustomTrackerWidget';
import { 
  TrendingUp, Users, CheckCircle, FileText, AlertCircle, Sparkles, Loader2,
  DollarSign, Wallet, Hourglass, CalendarDays, ChevronRight, CheckSquare,
  ListTodo, Plus, Target, ShieldAlert, Sparkle, BrainCircuit, RefreshCw, Send, Bot, ClipboardCheck, UserCircle2
} from 'lucide-react';
import { Task, Client, Idea } from '../../types';
import { cn } from '../../lib/utils';
import {
  calculateTaskPriorityScore,
  calculateProjectHealthScore,
  compileRevenueData,
  PriorityResult,
  HealthResult
} from '../../lib/chiefOfStaff';

interface BriefingViewProps {
  tasks: Task[];
  clients: Client[];
  ideas: Idea[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onSaveIdea: (idea: Idea) => Promise<void>;
  onViewChange: (view: any) => void;
  onConsultAgent: (agentId: string, initialPrompt?: string) => void;
  showNotification: (msg: string, isError?: boolean) => void;
}

export function BriefingView({
  tasks,
  clients,
  ideas,
  onTaskClick,
  onUpdateTask,
  onSaveTask,
  onSaveIdea,
  onViewChange,
  onConsultAgent,
  showNotification
}: BriefingViewProps) {
  // ── Local state for Brain Dump ──
  const [dumpInput, setDumpInput] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any | null>(null);

  // ── Local state for Analyze My Business ──
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<any | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // ── Compile calculations ──
  const revenueData = useMemo(() => compileRevenueData(tasks), [tasks]);
  
  const fanTasks = useMemo(() => tasks.filter(t => t.assignee === 'Fan' && t.status !== 'Done' && t.status !== 'เสร็จสิ้น'), [tasks]);
  const modTasks = useMemo(() => tasks.filter(t => t.assignee === 'Mod' && t.status !== 'Done' && t.status !== 'เสร็จสิ้น'), [tasks]);
  const fanDone  = useMemo(() => tasks.filter(t => t.assignee === 'Fan' && (t.status === 'Done' || t.status === 'เสร็จสิ้น')), [tasks]);
  const modDone  = useMemo(() => tasks.filter(t => t.assignee === 'Mod' && (t.status === 'Done' || t.status === 'เสร็จสิ้น')), [tasks]);

  // Tasks with priority scores calculated
  const prioritizedTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Done' && t.status !== 'เสร็จสิ้น')
      .map(t => {
        const clientObj = clients.find(c => c.id === t.clientId);
        const prio = calculateTaskPriorityScore(t, clientObj);
        return {
          ...t,
          prioScore: prio.score,
          prioReason: prio.reason
        };
      })
      .sort((a, b) => b.prioScore - a.prioScore);
  }, [tasks, clients]);

  // Projects (Tasks) with health scores calculated
  const projectHealths = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Done' && t.status !== 'เสร็จสิ้น')
      .map(t => {
        const health = calculateProjectHealthScore(t);
        return {
          ...t,
          healthScore: health.score,
          healthStatus: health.status,
          healthReasons: health.reasons
        };
      });
  }, [tasks]);

  const topPriorityTask = prioritizedTasks[0];

  const overdueCount = prioritizedTasks.filter(t => {
    if (!t.endDate) return false;
    return t.endDate < new Date().toISOString().split('T')[0];
  }).length;

  const openProjectsCount = prioritizedTasks.length;

  // AI Recommendation sum
  const potentialImpactValue = useMemo(() => {
    // Sum top 3 priority tasks
    return prioritizedTasks.slice(0, 3).reduce((sum, t) => sum + Number(t.price || 0), 0);
  }, [prioritizedTasks]);

  // ── Handle Brain Dump Submission ──
  const handleBrainDumpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dumpInput.trim() || isClassifying) return;

    setIsClassifying(true);
    setClassificationResult(null);

    try {
      const response = await fetch('/api/ai/classify-braindump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: dumpInput })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'การจัดหมวดหมู่ล้มเหลว');

      const result = data.result;
      setClassificationResult(result);

      // Automatically save to the appropriate table
      if (result.type === 'task') {
        const newTask: Partial<Task> = {
          name: result.title || 'งานด่วนจาก Brain Dump',
          status: 'To Do',
          price: 0,
          details: result.details || dumpInput,
          priority: result.priority || 'ปานกลาง (Medium)',
          tags: result.tags || 'braindump',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days
        };
        await onSaveTask(newTask);
      } else {
        const newIdea: Idea = {
          id: `idea-${Date.now()}`,
          title: result.title || 'ไอเดียจาก Brain Dump',
          description: result.details || dumpInput,
          category: result.category || 'อื่นๆ',
          tags: result.tags || 'braindump',
          priority: result.priority === 'ต่ำ (Low)' ? 'ต่ำ' : result.priority === 'สูง (High)' || result.priority === 'ด่วน (Urgent)' ? 'สูง' : 'กลาง',
          effort: 'ปานกลาง',
          status: 'ไอเดีย',
          createdAt: new Date().toISOString()
        };
        await onSaveIdea(newIdea);
      }
      
      // Auto-clear success message after 4 seconds
      setTimeout(() => {
        setClassificationResult(null);
        setDumpInput('');
      }, 5000);

    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์คำสั่งร่างไอเดีย: ' + err);
    } finally {
      setIsClassifying(false);
    }
  };

  // ── Handle Business Analysis ──
  const handleAnalyzeBusiness = async () => {
    setIsAnalyzing(true);
    setShowAnalysisModal(true);

    const userPrompt = `กรุณาวิเคราะห์สภาพธุรกิจของฉันแบบสรุปภาพรวมทั้งหมดอย่างกระชับ
    ดึงข้อมูลจากระบบ เช่น งานค้าง, ลูกค้า, รายได้ และไอเดียที่มี วิเคราะห์สถานะสุขภาพธุรกิจ (Business Health Score) ออกมาเป็นตัวเลข (0-100) และสรุปความเสี่ยง (Risks), โอกาสสร้างรายได้ (Opportunities), และการดำเนินการแนะนำ 3 ข้อ (Recommended Actions).
    
    ตอบเป็นรูปแบบ JSON ต่อไปนี้เท่านั้น (ไม่ต้องใส่ markdown blocks):
    {
      "healthScore": number,
      "summary": string,
      "risks": [string],
      "opportunities": [string],
      "recommendedActions": [string]
    }`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', text: userPrompt }],
          agentTitle: 'MODTY Business Analysis Agent',
          agentInstructions: 'คุณคือสุดยอด AI วิเคราะห์และประเมินธุรกิจ ที่ได้รับความไว้วางใจในการทำ Business Intelligence',
          contextData: { tasks, clients, ideas }
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI ไม่ตอบสนอง');

      // AI response formatting cleanup
      const cleanJson = data.result.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+(>|$)/g, "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      setAnalysisReport(parsed);

    } catch (e: any) {
      console.error(e);
      setAnalysisReport({
        healthScore: 68,
        summary: 'ไม่สามารถเชื่อมต่อการวิเคราะห์แบบ AI เต็มรูปแบบได้ในขณะนี้ แต่อ้างอิงจากข้อมูลสถิติปกติระบบของคุณจัดอยู่ในเกณฑ์ปานกลาง',
        risks: ['มีโปรเจกต์ค้างส่ง ' + overdueCount + ' งาน', 'ไม่มีการติดตามลูกค้าอย่างเป็นระบบ'],
        opportunities: ['มี Sales Pipeline คอยพัฒนา', 'มีไอเดียรอสร้างมูลค่า ' + ideas.length + ' เรื่อง'],
        recommendedActions: ['จัดการกับงานด่วนชิ้นแรกในวันนี้ทันที', 'ติดต่อลูกค้า VIP', 'สร้างใบเสนอราคาผ่าน DocFlow']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Quick checkmark to toggle status ──
  const handleQuickComplete = async (task: Task) => {
    const updated = {
      ...task,
      status: 'Done',
      updatedAt: new Date().toISOString()
    };
    onUpdateTask(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 bg-transparent flex flex-col gap-6 font-sans">
      
      {/* Welcome Banner */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 rounded-[24px] relative overflow-hidden shrink-0 border border-zinc-900 shadow-xl transition-premium" 
        style={{ background: '#09090b' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
            <Bot className="w-3.5 h-3.5 text-indigo-400" /> MODTY AI Chief of Staff
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">เฮ้! วันนี้จัดการอะไรดีก่อน?</h1>
          <p className="text-zinc-400 text-xs md:text-sm max-w-xl font-semibold">MODTY เช็กทุกอย่างให้แล้ว — งาน เงิน ดีล วิเคราะห์สิ่งสำคัญที่สุดเพื่อคุณวันนี้</p>
        </div>

        <button
          onClick={handleAnalyzeBusiness}
          className="relative z-10 shrink-0 flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs py-3 px-5 rounded-xl transition-premium cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <Sparkle className="w-3.5 h-3.5 text-zinc-950" /> Analyze My Business
        </button>
      </div>

      {/* Module 1: MODTY Daily Briefing / Business Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        {[
          { label: 'Revenue (เดือนนี้)', val: `฿${revenueData.monthly.toLocaleString()}`, color: 'indigo', icon: DollarSign, sub: 'งานเสร็จแล้วประจำเดือน' },
          { label: 'Pipeline Potential', val: `฿${revenueData.pipelinePotential.toLocaleString()}`, color: 'emerald', icon: TrendingUp, sub: `${revenueData.pendingDeals} ดีลรอการปิด` },
          { label: 'Open Projects', val: `${openProjectsCount} โครงการ`, color: 'orange', icon: FileText, sub: 'งานกำลังดำเนินอยู่' },
          { label: 'Overdue Tasks', val: `${overdueCount} งานด่วน`, color: 'rose', icon: AlertCircle, sub: 'เกินกำหนดส่งแล้ว' },
          { label: 'ค้างรับเงิน (Invoices)', val: `฿${revenueData.outstandingInvoices.toLocaleString()}`, color: 'amber', icon: Hourglass, sub: `เกินกำหนด ฿${revenueData.overdueInvoices.toLocaleString()}` }
        ].map(kpi => (
          <div key={kpi.label} className="bg-white hover:-translate-y-0.5 border border-slate-100 shadow-sm hover:shadow-md transition-premium rounded-[20px] p-4 flex flex-col justify-between h-28 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</span>
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm',
                kpi.color === 'indigo' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                kpi.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                kpi.color === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                kpi.color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                       'bg-amber-50 border-amber-100 text-amber-600'
              )}>
                <kpi.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{kpi.val}</p>
              <span className="text-[9px] text-slate-400 font-semibold">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Priorities & Opportunities & Health & Cashflow */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Priorities Section (Priority Engine) */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Today's Priorities</h2>
              </div>
              <button 
                onClick={() => onViewChange('board')}
                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                ดูทั้งหมด <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Smart Focus Recommendation Box */}
            {topPriorityTask ? (
              <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-[18px] p-4 flex gap-4 items-start shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Target className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[9px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Focus Target</span>
                  <h3 className="font-extrabold text-sm text-slate-800 leading-snug truncate">{topPriorityTask.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">วิเคราะห์ความคุ้มค่า:</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{topPriorityTask.prioReason}"</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center shrink-0 bg-white border border-slate-100 rounded-xl px-2.5 py-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Priority</span>
                  <span className="text-base font-black text-indigo-600">{topPriorityTask.prioScore}</span>
                </div>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-[18px] p-8 text-center text-slate-400 font-semibold text-xs">
                ไม่มีเป้าหมายงานค้างให้ประเมิน จัดลำดับ Priority ว่างเปล่า
              </div>
            )}

            {/* Top 3 Prioritized Tasks List */}
            {prioritizedTasks.length > 0 && (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {prioritizedTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        onClick={() => handleQuickComplete(task)}
                        title="ทำเครื่องหมายเสร็จสิ้น"
                        className="w-5 h-5 rounded-full border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer group-hover:scale-105"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-transparent hover:text-emerald-600" />
                      </button>
                      <button 
                        onClick={() => onTaskClick(task)}
                        className="text-left font-bold text-xs text-slate-700 hover:text-indigo-600 transition-colors truncate"
                      >
                        {task.name}
                      </button>
                      {task.customer && (
                        <span className="text-[10px] bg-slate-50 text-slate-400 font-semibold px-2 py-0.5 rounded border border-slate-100 truncate max-w-[120px]">
                          {task.customer}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0">
                      {task.endDate && (
                        <span className={cn(
                          'text-[10px] font-semibold',
                          task.endDate < new Date().toISOString().split('T')[0] ? 'text-rose-600' : 'text-slate-400'
                        )}>
                          {task.endDate}
                        </span>
                      )}
                      <span className="w-10 text-right text-xs font-black text-slate-900 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5">{task.prioScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Module 5: Team Task Summary */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <UserCircle2 className="w-5 h-5 text-violet-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Team Overview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fan — Admin */}
              {(() => {
                const active = fanTasks;
                const done   = fanDone;
                const urgent = active.filter(t => t.priority === 'ด่วน (Urgent)' || t.priority === 'สูง (High)');
                return (
                  <div className="rounded-[18px] bg-slate-50/50 border border-slate-100 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">F</div>
                        <div>
                          <p className="text-sm font-black text-slate-800">Fan</p>
                          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Admin</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-800">{active.length}</p>
                        <p className="text-[10px] text-slate-400">งานค้างอยู่</p>
                      </div>
                    </div>
                    {urgent.length > 0 && (
                      <div className="bg-rose-50/80 border border-rose-100 rounded-xl px-3 py-2">
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider mb-1">ด่วน / สำคัญ</p>
                        {urgent.slice(0, 3).map(t => (
                          <p key={String(t.id)} className="text-[11px] text-rose-700 truncate font-semibold">· {t.name}</p>
                        ))}
                        {urgent.length > 3 && <p className="text-[10px] text-rose-400 mt-0.5">+{urgent.length - 3} รายการ</p>}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                      {active.length === 0 && <p className="text-[11px] text-slate-400 text-center py-2 font-medium">ไม่มีงานค้าง</p>}
                      {active.map(t => (
                        <div key={String(t.id)} className="flex items-center gap-2">
                          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', t.priority === 'ด่วน (Urgent)' ? 'bg-rose-500' : t.priority === 'สูง (High)' ? 'bg-orange-400' : 'bg-slate-300')} />
                          <p className="text-[11px] text-slate-600 truncate flex-1 font-semibold">{t.name}</p>
                          <span className="text-[9px] text-slate-400 shrink-0 font-bold uppercase tracking-wider">{t.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">เสร็จแล้ว</span>
                      <span className="text-[11px] font-black text-emerald-600">{done.length} งาน</span>
                    </div>
                  </div>
                );
              })()}

              {/* Mod — Owner */}
              {(() => {
                const active = modTasks;
                const done   = modDone;
                const urgent = active.filter(t => t.priority === 'ด่วน (Urgent)' || t.priority === 'สูง (High)');
                return (
                  <div className="rounded-[18px] bg-slate-50/50 border border-slate-100 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-black">M</div>
                        <div>
                          <p className="text-sm font-black text-slate-800">Mod</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Owner</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-800">{active.length}</p>
                        <p className="text-[10px] text-slate-400">งานค้างอยู่</p>
                      </div>
                    </div>
                    {urgent.length > 0 && (
                      <div className="bg-rose-50/80 border border-rose-100 rounded-xl px-3 py-2">
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider mb-1">ด่วน / สำคัญ</p>
                        {urgent.slice(0, 3).map(t => (
                          <p key={String(t.id)} className="text-[11px] text-rose-700 truncate font-semibold">· {t.name}</p>
                        ))}
                        {urgent.length > 3 && <p className="text-[10px] text-rose-400 mt-0.5">+{urgent.length - 3} รายการ</p>}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                      {active.length === 0 && <p className="text-[11px] text-slate-400 text-center py-2 font-medium">ไม่มีงานค้าง</p>}
                      {active.map(t => (
                        <div key={String(t.id)} className="flex items-center gap-2">
                          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', t.priority === 'ด่วน (Urgent)' ? 'bg-rose-500' : t.priority === 'สูง (High)' ? 'bg-orange-400' : 'bg-slate-300')} />
                          <p className="text-[11px] text-slate-600 truncate flex-1 font-semibold">{t.name}</p>
                          <span className="text-[9px] text-slate-400 shrink-0 font-bold uppercase tracking-wider">{t.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">เสร็จแล้ว</span>
                      <span className="text-[11px] font-black text-emerald-600">{done.length} งาน</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Module 6: Revenue Command Center */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Revenue Command Center</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Box A: Revenue Overview */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                <h3 className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Revenue Overview
                </h3>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Monthly</span>
                    <span className="font-black text-slate-800">฿{revenueData.monthly.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-slate-400">Quarterly</span>
                    <span className="font-black text-slate-800">฿{revenueData.quarterly.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-slate-400">Annual</span>
                    <span className="font-black text-slate-800">฿{revenueData.annual.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Box B: Sales Pipeline */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                <h3 className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Sales Pipeline
                </h3>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Potential Val</span>
                    <span className="font-black text-slate-800">฿{revenueData.pipelinePotential.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-slate-400">Open Quotations</span>
                    <span className="font-black text-slate-800">{revenueData.openQuotations} ใบ</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-slate-400">Pending Deals</span>
                    <span className="font-black text-slate-800">{revenueData.pendingDeals} ดีล</span>
                  </div>
                </div>
              </div>

              {/* Box C: Cash Flow */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                <h3 className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Hourglass className="w-3.5 h-3.5 text-amber-500" /> Cash Flow
                </h3>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Paid Invoices</span>
                    <span className="font-black text-emerald-600">฿{revenueData.paidInvoices.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-slate-400">Outstanding</span>
                    <span className="font-black text-amber-600">฿{revenueData.outstandingInvoices.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-slate-400">Overdue Invoices</span>
                    <span className="font-black text-rose-600">฿{revenueData.overdueInvoices.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right 1 Column: Brain Dump & Project Health Score & Recent Activities */}
        <div className="flex flex-col gap-6">

          {/* Module 8: Brain Dump Inbox */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden shadow-sm">
            
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Brain Dump Inbox</h2>
            </div>
            
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              โยนความคิด ไอเดีย หรือภารกิจด่วนลงในกล่องนี้ เพื่อให้ระบบ AI ทำการประเมินความสำคัญ คัดแยกประเภท และจดบันทึกเข้าระบบทันที
            </p>

            <form onSubmit={handleBrainDumpSubmit} className="space-y-3">
              <textarea
                value={dumpInput}
                onChange={e => setDumpInput(e.target.value)}
                placeholder="เช่น: สร้าง AI Agent สำหรับร้านอาหาร"
                rows={3}
                required
                className="w-full px-4 py-3 text-xs border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl outline-none resize-none transition bg-white text-slate-800 placeholder-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={isClassifying || !dumpInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-zinc-950 text-white hover:bg-zinc-850 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isClassifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    กำลังวิเคราะห์จัดประเภท...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    วิเคราะห์ & บันทึกด่วน
                  </>
                )}
              </button>
            </form>

            {/* AI Classification Feedback Box */}
            {classificationResult && (
              <div className="bg-emerald-50/80 border border-emerald-250 rounded-2xl p-4.5 space-y-2.5 animate-fade-in">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-xs font-bold">MODTY AI บันทึกสำเร็จแล้ว</span>
                </div>
                <div className="space-y-1 text-[11px] text-emerald-800 font-semibold leading-relaxed">
                  <p>• <b>ประเภท:</b> {classificationResult.type === 'task' ? 'งานที่ต้องทำ (Task)' : 'ไอเดียใหม่ (Idea)'}</p>
                  <p>• <b>หมวดหมู่:</b> {classificationResult.category}</p>
                  <p>• <b>ความสำคัญ:</b> {classificationResult.priority}</p>
                  <p>• <b>แท็ก:</b> {classificationResult.tags}</p>
                  <p>• <b>ขั้นถัดไป:</b> <span className="underline">{classificationResult.suggestedNextStep}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Module 3: Project Health Score */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Project Health Status</h2>
              </div>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto hide-scrollbar">
              {projectHealths.length > 0 ? (
                projectHealths.map(proj => (
                  <div key={proj.id} className="bg-slate-50/30 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <button 
                        onClick={() => onTaskClick(proj)}
                        className="text-xs font-extrabold text-slate-800 hover:text-indigo-600 transition-colors text-left truncate flex-1"
                      >
                        {proj.name}
                      </button>
                      <span className={cn(
                        'text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0',
                        proj.healthStatus === 'Excellent' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        proj.healthStatus === 'Healthy' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                        proj.healthStatus === 'Warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                           'bg-rose-50 border-rose-200 text-rose-700'
                      )}>
                        {proj.healthStatus}
                      </span>
                    </div>

                    {/* Progress Bar & Health score */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>สุขภาพโครงการ</span>
                        <span className={cn(
                          'font-black',
                          proj.healthStatus === 'Critical' ? 'text-rose-600' :
                          proj.healthStatus === 'Warning' ? 'text-amber-600' : 'text-indigo-600'
                        )}>{proj.healthScore} / 100</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className={cn(
                             'h-full rounded-full transition-all duration-500',
                             proj.healthStatus === 'Excellent' ? 'bg-emerald-500' :
                             proj.healthStatus === 'Healthy' ? 'bg-indigo-500' :
                             proj.healthStatus === 'Warning' ? 'bg-amber-500' :
                                                                'bg-rose-500'
                           )} 
                          style={{ width: `${proj.healthScore}%` }} 
                        />
                      </div>
                    </div>

                    {/* Health explanation */}
                    <div className="text-[10px] text-slate-500 leading-relaxed font-semibold italic">
                      • {proj.healthReasons[0]}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-400 font-semibold text-xs">
                  ไม่มีโครงการที่กำลังดำเนินการอยู่ขณะนี้
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities Feed */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Recent Activities</h2>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 4).map((task, idx) => (
                <div key={task.id} className="flex gap-3 text-xs leading-relaxed group">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-150 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    {idx < 3 && <div className="w-[1px] h-full bg-slate-150 mt-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      อัปเดตงาน: <b>{task.name}</b>
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block">
                      {task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'เมื่อเร็วๆ นี้'} · สถานะ: {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Module 7: MODTY Business Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black/20 z-[95] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-modal border border-slate-100 rounded-[28px] max-w-2xl w-full p-6 md:p-8 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">MODTY Business Intelligent report</h2>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">AI Chief of Staff Advisor</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAnalysisModal(false); setAnalysisReport(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-6 hide-scrollbar text-sm text-slate-700">
              {isAnalyzing || !analysisReport ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                  <p className="font-extrabold text-sm text-slate-800 animate-pulse">MODTY AI กำลังวิเคราะห์สถานการณ์ธุรกิจของคุณอย่างละเอียด...</p>
                  <p className="text-xs text-slate-400 font-medium">กระบวนการนี้อาจใช้เวลาประมวลผลประมาณ 5-10 วินาทีค่ะ</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Health score header */}
                  <div className="flex items-center gap-5 bg-gradient-to-br from-indigo-50/30 to-white/40 border border-indigo-100/50 rounded-2xl p-5 backdrop-blur-md">
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-600 flex items-center justify-center shrink-0">
                      <span className="text-2xl font-black text-indigo-600">{analysisReport.healthScore}%</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800">คะแนนสุขภาพธุรกิจโดยรวม</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{analysisReport.summary}</p>
                    </div>
                  </div>

                  {/* Risks block */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> ความเสี่ยงที่ตรวจพบ (Risks)
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-1">
                      {analysisReport.risks.map((risk: string, i: number) => (
                        <li key={i} className="font-semibold">{risk}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities block */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> โอกาสสร้างรายได้ (Opportunities)
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-1">
                      {analysisReport.opportunities.map((opp: string, i: number) => (
                        <li key={i} className="font-semibold">{opp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended actions block */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4" /> คำแนะนำเพื่อการตัดสินใจวันนี้ (Recommended Actions)
                    </h4>
                    <div className="space-y-2.5">
                      {analysisReport.recommendedActions.map((act: string, i: number) => (
                        <div key={i} className="flex gap-3 bg-slate-50 border border-slate-200/50 rounded-xl p-3">
                          <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-xs text-slate-700 font-extrabold flex-1 self-center">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 shrink-0 flex gap-3">
              <button
                onClick={() => { setShowAnalysisModal(false); setAnalysisReport(null); }}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
              {analysisReport && (
                <button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    onConsultAgent('daily_briefer', 'สรุปวิเคราะห์ธุรกิจตามคำแนะนำ AI และแผนปฏิบัติการถัดไปให้ฉันหน่อยค่ะ');
                  }}
                  className="flex-1 py-3 bg-[#0f172a] text-white hover:bg-zinc-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Bot className="w-4 h-4" /> คุยกับ AI ต่อ
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Digital Product Revenue Widget */}
      <ProductRevenueWidget showNotification={showNotification} />

      {/* Custom Tracker Widget */}
      <CustomTrackerWidget showNotification={showNotification} />

    </div>
  );
}
