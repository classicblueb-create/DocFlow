import React, { useState, useMemo, useEffect } from 'react';
import { 
  BatonHandoff, Task, IssuedDocument, Client, ContentPlan 
} from '../../types';
import { 
  computeBatonHandoffs, AGENT_PROFILES, dismissHandoff, 
  markHandoffExecuted, AgentProfile 
} from '../../lib/agentBatonEngine';
import { subscribeIssuedDocuments } from '../../lib/db';
import { 
  BrainCircuit, ArrowRight, Check, X, Sparkles, Send, 
  FileText, MessageSquare, ShieldCheck, CheckCircle2, Clock, 
  Share2, ChevronRight, Eye, RefreshCw 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AgentBatonCenterProps {
  tasks: Task[];
  documents?: IssuedDocument[];
  clients: Client[];
  contentPlans: ContentPlan[];
  onOpenDocFlowWithData?: (docData: Partial<IssuedDocument>) => void;
  onOpenDocFlow?: () => void;
  onOpenContentPlan?: () => void;
  onSaveContentPlan?: (plan: Partial<ContentPlan>) => Promise<void>;
  showNotification?: (msg: string, isError?: boolean) => void;
  className?: string;
}

export function AgentBatonCenter({
  tasks,
  documents,
  clients,
  contentPlans,
  onOpenDocFlowWithData,
  onOpenDocFlow,
  onOpenContentPlan,
  onSaveContentPlan,
  showNotification,
  className = ''
}: AgentBatonCenterProps) {
  const [filter, setFilter] = useState<'pending' | 'executed' | 'all'>('pending');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [scriptModalDoc, setScriptModalDoc] = useState<IssuedDocument | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time issued documents if not provided
  const [internalDocs, setInternalDocs] = useState<IssuedDocument[]>([]);
  useEffect(() => {
    if (!documents || documents.length === 0) {
      const unsub = subscribeIssuedDocuments(docs => setInternalDocs(docs || []));
      return () => unsub();
    }
  }, [documents]);

  const activeDocs = (documents && documents.length > 0) ? documents : internalDocs;

  // Compute live handoffs
  const handoffs = useMemo(() => {
    return computeBatonHandoffs({ tasks, documents: activeDocs, clients, contentPlans });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, activeDocs, clients, contentPlans, refreshKey]);

  const pendingList = useMemo(() => handoffs.filter(h => h.status === 'pending'), [handoffs]);
  const executedList = useMemo(() => handoffs.filter(h => h.status === 'executed'), [handoffs]);

  const displayedList = useMemo(() => {
    if (filter === 'pending') return pendingList;
    if (filter === 'executed') return executedList;
    return handoffs.filter(h => h.status !== 'dismissed');
  }, [filter, pendingList, executedList, handoffs]);

  // Handle Dismiss
  const handleDismiss = (id: string) => {
    dismissHandoff(id);
    setRefreshKey(k => k + 1);
    showNotification?.('ซ่อนการแจ้งเตือนของเอเจนต์แล้ว');
  };

  // Handle Execute / Approve
  const handleApprove = async (handoff: BatonHandoff) => {
    setExecutingId(handoff.id);
    try {
      if (handoff.actionType === 'draft_quotation') {
        markHandoffExecuted(handoff.id);
        setRefreshKey(k => k + 1);
        if (onOpenDocFlowWithData && handoff.actionPayload?.suggestedDoc) {
          onOpenDocFlowWithData(handoff.actionPayload.suggestedDoc);
          showNotification?.(`ส่งข้อมูลดีลเข้า DocFlow แล้ว! ตรวจทานใบเสนอราคาและกดดาวน์โหลดได้ทันที`);
        } else if (onOpenDocFlow) {
          onOpenDocFlow();
        }
      } else if (handoff.actionType === 'follow_up_reminder') {
        setScriptModalDoc(handoff.actionPayload.doc);
      } else if (handoff.actionType === 'auto_convert_invoice') {
        markHandoffExecuted(handoff.id);
        setRefreshKey(k => k + 1);
        const doc = handoff.actionPayload.doc;
        if (onOpenDocFlowWithData) {
          onOpenDocFlowWithData({
            docType: 'invoice',
            customerName: doc.customerName,
            customerAddr: doc.customerAddr,
            customerTaxId: doc.customerTaxId,
            customerContact: doc.customerContact,
            customerPhone: doc.customerPhone,
            items: doc.items,
            netTotal: doc.netTotal,
            subtotal: doc.subtotal,
            whtPercent: doc.whtPercent,
            linkedDocNo: doc.docNo,
          });
          showNotification?.(`เปลี่ยนใบเสนอราคา ${doc.docNo} เป็นใบแจ้งหนี้ใน DocFlow แล้ว! พร้อมออกใบเสร็จรับเงินอัตโนมัติ`);
        }
      } else if (handoff.actionType === 'create_content_plan') {
        const suggested = handoff.actionPayload.suggestedContent;
        if (onSaveContentPlan && suggested) {
          await onSaveContentPlan({
            id: `cp_${Date.now()}`,
            title: suggested.title,
            platform: suggested.platform,
            concept: suggested.concept,
            status: 'ไอเดีย/ร่าง',
            createdAt: new Date().toISOString()
          });
          markHandoffExecuted(handoff.id);
          setRefreshKey(k => k + 1);
          showNotification?.(`ฝ่ายการตลาดบันทึก Case Study เข้าสู่ Content Plan เรียบร้อยแล้ว!`);
          if (onOpenContentPlan) onOpenContentPlan();
        }
      }
    } catch (e: any) {
      showNotification?.(`เกิดข้อผิดพลาด: ${e.message}`, true);
    } finally {
      setExecutingId(null);
    }
  };

  // Copy Follow up script
  const handleCopyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showNotification?.('คัดลอกข้อความทักตามลูกค้าเข้า Clipboard เรียบร้อย!');
    setTimeout(() => setCopied(false), 3000);
  };

  // Stage badge contextual styling
  const getStageBadgeStyle = (actionType: string) => {
    switch (actionType) {
      case 'draft_quotation':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'auto_convert_invoice':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'create_content_plan':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'follow_up_reminder':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={cn("glass-card overflow-hidden transition-all", className)}>
      
      {/* ── Header ── */}
      <div className="p-4 md:p-5 border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 transition-transform"
            style={{ 
              background: 'var(--btn-primary-bg, linear-gradient(135deg, #2563eb, #1d4ed8))',
              borderRadius: 'var(--btn-radius, 16px)'
            }}
          >
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black tracking-tight" style={{ color: 'var(--text-primary, #0f172a)' }}>
                Autonomous Agent Baton Center
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                ส่งไม้ต่ออัตโนมัติ
              </span>
            </div>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary, #64748b)' }}>
              ทีมเอเจนต์ 5 ฝ่ายประสานงานส่งไม้ต่อ &bull; คุณมีหน้าที่เพียงตรวจทานและอนุมัติ (1-Click Commander)
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/5 p-1 rounded-xl self-start md:self-auto border border-slate-200/60">
          <button
            onClick={() => setFilter('pending')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              filter === 'pending'
                ? "bg-white text-blue-600 shadow-2xs border border-blue-200/60"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            รอดำเนินการ ({pendingList.length})
          </button>
          <button
            onClick={() => setFilter('executed')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              filter === 'executed'
                ? "bg-white text-emerald-600 shadow-2xs border border-emerald-200/60"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            อนุมัติแล้ว ({executedList.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              filter === 'all'
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      {/* ── Active Swarm Department Indicators ── */}
      <div className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-600">
        <span className="font-bold shrink-0 uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted, #94a3b8)' }}>
          ทีมเอเจนต์ประจำการ:
        </span>
        {Object.values(AGENT_PROFILES).map(agent => (
          <div key={agent.id} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/90 border border-slate-200/80 shrink-0 font-medium shadow-2xs">
            <span className={cn("w-1.5 h-1.5 rounded-full bg-current", agent.color)} />
            <span className="text-slate-800 font-bold">{agent.name.split(' ')[0]}</span>
            <span className="text-[10px] text-slate-400">({agent.role.split(' ')[0]})</span>
          </div>
        ))}
      </div>

      {/* ── Handoff Feed ── */}
      <div className="p-4 space-y-3">
        {displayedList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">ทีมเอเจนต์พร้อมสแตนด์บาย 100%</p>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'pending'
                ? 'ยังไม่มีงานคั่งค้างที่ต้องรอการอนุมัติ เมื่อมีงาน ดีล หรือเอกสารใหม่ ระบบจะนำส่งมาที่นี่ทันที'
                : 'ไม่มีรายการในหมวดหมู่นี้'}
            </p>
          </div>
        ) : (
          displayedList.map(handoff => {
            const fromAgent = AGENT_PROFILES[handoff.fromAgent];
            const toAgent = AGENT_PROFILES[handoff.toAgent];
            const isPending = handoff.status === 'pending';

            return (
              <div
                key={handoff.id}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5",
                  isPending
                    ? "bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-xs"
                    : "bg-slate-50/60 border-slate-200/60 opacity-80"
                )}
              >
                {/* Left: Baton Flow & Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  
                  {/* Baton Passing Header: From Agent -> To Agent */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    
                    {/* From Agent Badge */}
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <div className={cn("w-4 h-4 rounded-md bg-gradient-to-tr text-white flex items-center justify-center text-[9px]", fromAgent.bgGradient)}>
                        <fromAgent.icon className="w-2.5 h-2.5" />
                      </div>
                      <span>{fromAgent.name}</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                    {/* To Agent Badge */}
                    <div className="flex items-center gap-1 font-black text-slate-800">
                      <div className={cn("w-4 h-4 rounded-md bg-gradient-to-tr text-white flex items-center justify-center text-[9px]", toAgent.bgGradient)}>
                        <toAgent.icon className="w-2.5 h-2.5" />
                      </div>
                      <span>{toAgent.name}</span>
                    </div>

                    {/* Stage Tag */}
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", getStageBadgeStyle(handoff.actionType))}>
                      {handoff.badgeText}
                    </span>

                    {/* Status badge */}
                    {handoff.status === 'executed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> อนุมัติแล้ว
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-xs md:text-sm font-extrabold text-slate-900 leading-snug">
                    {handoff.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {handoff.description}
                  </p>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {isPending ? (
                    <>
                      {/* 1-Click Approve / Execute Button */}
                      <button
                        onClick={() => handleApprove(handoff)}
                        disabled={executingId === handoff.id}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black transition-all cursor-pointer disabled:opacity-50 hover:brightness-110 active:scale-98 shadow-xs"
                        style={{
                          background: 'var(--btn-primary-bg, linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%))',
                          color: 'var(--btn-primary-text, #ffffff)',
                          borderRadius: 'var(--btn-radius, 12px)',
                          boxShadow: 'var(--btn-primary-shadow, 0 4px 14px rgba(37, 99, 235, 0.25))'
                        }}
                      >
                        {executingId === handoff.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {handoff.actionType === 'draft_quotation' ? 'อนุมัติ & เปิดใน DocFlow' :
                           handoff.actionType === 'follow_up_reminder' ? 'ดูข้อความทักตาม' :
                           handoff.actionType === 'auto_convert_invoice' ? 'อนุมัติออกใบแจ้งหนี้' :
                           handoff.actionType === 'create_content_plan' ? 'อนุมัติบันทึก Content Plan' : 'อนุมัติ'}
                        </span>
                      </button>

                      {/* Dismiss button */}
                      <button
                        onClick={() => handleDismiss(handoff.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                        title="ซ่อนรายการนี้"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>เสร็จสิ้น</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ── Follow-Up Script Modal (If triggered from Follow-up Agent) ── */}
      {scriptModalDoc && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setScriptModalDoc(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ข้อความทักตามลูกค้าจาก Follow-Up Agent
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {scriptModalDoc.docNo} &bull; {scriptModalDoc.customerName} (ยอด ฿{Number(scriptModalDoc.netTotal || 0).toLocaleString()})
                  </p>
                </div>
              </div>
              <button onClick={() => setScriptModalDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line select-all">
{`สวัสดีครับคุณ ${scriptModalDoc.customerName || 'ลูกค้า'}

ขออนุญาตสอบถามความคืบหน้าเรื่องใบเสนอราคาเลขที่ ${scriptModalDoc.docNo} (ยอดรวม ฿${Number(scriptModalDoc.netTotal || 0).toLocaleString()}) ที่ส่งไปเมื่อสัปดาห์ก่อนครับ

หากทางคุณ ${scriptModalDoc.customerName || 'ลูกค้า'} มีข้อสงสัยหรือต้องการปรับส่วนไหนในขอบเขตงาน สามารถแจ้งผมได้ตลอดเลยนะครับ ยินดีปรับให้เหมาะสมที่สุดครับ ขอบคุณมากครับ`}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                กดคัดลอกแล้วนำไปวางใน LINE หรือแชทได้ทันที
              </span>
              <button
                onClick={() => handleCopyScript(`สวัสดีครับคุณ ${scriptModalDoc.customerName || 'ลูกค้า'}\n\nขออนุญาตสอบถามความคืบหน้าเรื่องใบเสนอราคาเลขที่ ${scriptModalDoc.docNo} (ยอดรวม ฿${Number(scriptModalDoc.netTotal || 0).toLocaleString()}) ที่ส่งไปเมื่อสัปดาห์ก่อนครับ\n\nหากทางคุณ ${scriptModalDoc.customerName || 'ลูกค้า'} มีข้อสงสัยหรือต้องการปรับส่วนไหน สามารถแจ้งผมได้ตลอดเลยนะครับ ขอบคุณมากครับ`)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs",
                  copied ? "bg-emerald-600 text-white" : "hover:brightness-110 active:scale-98"
                )}
                style={!copied ? {
                  background: 'var(--btn-primary-bg, linear-gradient(135deg, #2563eb, #1d4ed8))',
                  color: 'var(--btn-primary-text, #ffffff)',
                  borderRadius: 'var(--btn-radius, 12px)',
                  boxShadow: 'var(--btn-primary-shadow, 0 4px 14px rgba(37, 99, 235, 0.25))'
                } : { borderRadius: 'var(--btn-radius, 12px)' }}
              >
                <Check className="w-4 h-4" />
                <span>{copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกข้อความ (1-Click)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
