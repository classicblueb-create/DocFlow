import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle2, Copy, Send, Sparkles, 
  ExternalLink, ArrowRight, MessageSquare, ShieldAlert, Check,
  DollarSign, FileText, Smartphone, Calendar, RefreshCw, X
} from 'lucide-react';
import { IssuedDocument } from '../../types';
import { subscribeIssuedDocuments, updateIssuedDocument } from '../../lib/db';
import { cn } from '../../lib/utils';

interface SoloFollowUpRadarProps {
  onOpenDocFlow?: () => void;
  showNotification?: (msg: string, isError?: boolean) => void;
  className?: string;
  topTasks?: any[];
  gcalEvents?: any[];
  documents?: IssuedDocument[];
}

export function SoloFollowUpRadar({
  onOpenDocFlow,
  showNotification,
  className = '',
  topTasks = [],
  gcalEvents = [],
  documents: externalDocs
}: SoloFollowUpRadarProps) {
  const [internalDocs, setInternalDocs] = useState<IssuedDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'quotation' | 'invoice' | 'receipt'>('quotation');
  const [scriptModalDoc, setScriptModalDoc] = useState<IssuedDocument | null>(null);
  const [scriptTone, setScriptTone] = useState<'friendly' | 'formal' | 'quick'>('friendly');
  const [copied, setCopied] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!externalDocs || externalDocs.length === 0) {
      const unsub = subscribeIssuedDocuments(docs => {
        setInternalDocs(docs || []);
      });
      return () => unsub();
    }
  }, [externalDocs]);

  const documents = (externalDocs && externalDocs.length > 0) ? externalDocs : internalDocs;

  // Helper to calculate days remaining for 7-day follow-up
  const getFollowUpDays = (doc: IssuedDocument) => {
    const targetDate = doc.followUpDueDate 
      ? new Date(doc.followUpDueDate)
      : new Date(new Date(doc.createdAt || doc.docDate).getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      daysRemaining: diffDays,
      dueFormatted: targetDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
      isOverdue: diffDays < 0,
      isToday: diffDays === 0
    };
  };

  // Filtered lists
  const pendingQuotations = useMemo(() => {
    return documents.filter(d => d.docType === 'quotation' && d.status !== 'signed');
  }, [documents]);

  const pendingInvoices = useMemo(() => {
    return documents.filter(d => d.docType === 'invoice' && d.status !== 'paid');
  }, [documents]);

  const autoReceipts = useMemo(() => {
    return documents.filter(d => d.docType === 'receipt');
  }, [documents]);

  // Total pending money
  const pendingQuotationTotal = useMemo(() => {
    return pendingQuotations.reduce((sum, d) => sum + (Number(d.netTotal) || 0), 0);
  }, [pendingQuotations]);

  const pendingInvoiceTotal = useMemo(() => {
    return pendingInvoices.reduce((sum, d) => sum + (Number(d.netTotal) || 0), 0);
  }, [pendingInvoices]);

  // Mark quotation as signed
  const handleMarkSigned = async (doc: IssuedDocument) => {
    try {
      const updated: IssuedDocument = {
        ...doc,
        status: 'signed',
        signedAt: new Date().toISOString()
      };
      await updateIssuedDocument(updated);
      showNotification?.(`อัปเดตใบเสนอราคา ${doc.docNo} เป็น "เซ็นกลับมาแล้ว" เรียบร้อย!`);
    } catch (e: any) {
      showNotification?.(`เกิดข้อผิดพลาด: ${e.message}`, true);
    }
  };

  // Generate Follow-Up Message Copy
  const generateFollowUpMessage = (doc: IssuedDocument, tone: 'friendly' | 'formal' | 'quick') => {
    const isQuotation = doc.docType === 'quotation';
    const totalFormatted = `฿${Number(doc.netTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const custName = doc.customerName || 'คุณลูกค้า';

    if (isQuotation) {
      if (tone === 'friendly') {
        return `สวัสดีครับคุณ ${custName}\n\nขออนุญาตสอบถามความคืบหน้าเรื่องใบเสนอราคาเลขที่ ${doc.docNo} (ยอดรวม ${totalFormatted}) ที่ส่งไปเมื่อสัปดาห์ก่อนครับ\n\nหากทางคุณ ${custName} มีข้อสงสัยหรือต้องการปรับลด/เพิ่มส่วนไหนในขอบเขตงาน สามารถแจ้งผมได้ตลอดเลยนะครับ ยินดีปรับให้เหมาะสมที่สุดครับ ขอบคุณมากครับ`;
      }
      if (tone === 'formal') {
        return `เรียน คุณ ${custName}\n\nเรื่อง: ติดตามความคืบหน้าใบเสนอราคาเลขที่ ${doc.docNo}\n\nอ้างถึงใบเสนอราคาเลขที่ ${doc.docNo} มูลค่า ${totalFormatted} ที่ได้นำส่งให้ท่านพิจารณา กระผมขออนุญาตติดตามผลการพิจารณาเอกสารดังกล่าว หากท่านต้องการข้อมูลเพิ่มเติมหรือประสงค์จะปรับแก้รายละเอียดประการใด กรุณาติดต่อกลับได้ทันทีครับ\n\nขอแสดงความนับถือ`;
      }
      return `สวัสดีครับคุณ ${custName} แวะมาอัปเดตเรื่องใบเสนอราคา ${doc.docNo} (${totalFormatted}) ครับ หากสะดวกพิจารณาเซ็นอนุมัติแล้วแจ้งได้เลยนะครับ จะได้รีบเริ่มงานให้ทันทีครับ ขอบคุณครับ`;
    } else {
      // Invoice follow-up
      if (tone === 'friendly') {
        return `สวัสดีครับคุณ ${custName}\n\nขออนุญาตส่งข้อความแจ้งเตือนรอบการชำระเงินตามใบแจ้งหนี้เลขที่ ${doc.docNo} ยอดชำระ ${totalFormatted} ครับ\n\nหากชำระเงินเรียบร้อยแล้ว รบกวนส่งสลิปแจ้งผมได้เลยนะครับ ระบบจะออกใบเสร็จรับเงินให้ทันทีครับ ขอบคุณมากครับ`;
      }
      if (tone === 'formal') {
        return `เรียน คุณ ${custName}\n\nเรื่อง: แจ้งเตือนครบกำหนดชำระตามใบแจ้งหนี้เลขที่ ${doc.docNo}\n\nตามที่ได้ออกใบแจ้งหนี้เลขที่ ${doc.docNo} จำนวนเงิน ${totalFormatted} ทางเราขอแจ้งเตือนรอบกำหนดชำระเงิน ทั้งนี้หากท่านได้ดำเนินการโอนเรียบร้อยแล้ว กรุณาแจ้งหลักฐานการชำระเงินเพื่อดำเนินการออกใบเสร็จรับเงินต่อไป\n\nขอแสดงความนับถือ`;
      }
      return `สวัสดีครับคุณ ${custName} ขออนุญาตเตือนยอดใบแจ้งหนี้ ${doc.docNo} ยอด ${totalFormatted} ครบกำหนดชำระครับ โอนแล้วส่งสลิปมาได้เลยนะครับ ขอบคุณครับ`;
    }
  };

  // Copy to clipboard handler
  const handleCopyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showNotification?.('คัดลอกข้อความทักตามลูกค้าเข้า Clipboard แล้ว! นำไปวางใน LINE หรือแชทได้ทันที');
    setTimeout(() => setCopied(false), 3000);
  };

  // Send Daily Briefing to Telegram
  const handleSendTelegramBriefing = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus(null);
    try {
      const todayMeetings = gcalEvents.filter(e => {
        const d = (e.start || '').slice(0, 10);
        return d === new Date().toISOString().slice(0, 10);
      });

      const res = await fetch('/api/notify/telegram-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topTasks: topTasks.slice(0, 3).map(t => ({
            name: t.name,
            prioScore: t.prioScore,
            prioReason: t.prioReason,
            endDate: t.endDate
          })),
          pendingQuotations: pendingQuotations.map(q => {
            const fu = getFollowUpDays(q);
            return {
              docNo: q.docNo,
              customerName: q.customerName,
              netTotal: q.netTotal,
              daysRemaining: fu.daysRemaining
            };
          }),
          pendingInvoices: pendingInvoices.map(inv => ({
            docNo: inv.docNo,
            customerName: inv.customerName,
            netTotal: inv.netTotal,
            dueDate: inv.followUpDueDate
          })),
          meetings: todayMeetings.map(m => ({
            title: m.title,
            time: m.allDay ? 'ทั้งวัน' : new Date(m.start).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTelegramStatus('ส่งสรุปเข้า Telegram สำเร็จ!');
        showNotification?.('ส่งสรุปเช้าวันนี้เข้า Telegram สำเร็จแล้ว!');
      } else {
        setTelegramStatus(data.error || 'ส่งไม่สำเร็จ');
        showNotification?.(`แจ้งเตือน Telegram: ${data.error || 'ไม่สำเร็จ'}`, true);
      }
    } catch (e: any) {
      setTelegramStatus(e.message || 'เกิดข้อผิดพลาด');
      showNotification?.(`เกิดข้อผิดพลาด: ${e.message}`, true);
    } finally {
      setIsSendingTelegram(false);
      setTimeout(() => setTelegramStatus(null), 5000);
    }
  };

  return (
    <div className={cn("glass-card overflow-hidden border border-slate-200/90 shadow-xs rounded-2xl", className)}>
      
      {/* ── Header ── */}
      <div className="p-4 md:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
                Solo Follow-up Radar &amp; Action Center
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                ระบบผู้ช่วยไม่ลืมงาน
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ป้องกันคนทำงานคนเดียวลืมตามเอกสาร &bull; นับถอยหลัง 7 วัน &bull; คัดลอกข้อความทักตามลูกค้า 1-Click
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Send Daily Briefing to Telegram */}
          <button
            onClick={handleSendTelegramBriefing}
            disabled={isSendingTelegram}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="ส่งสรุปงานและเงินที่ต้องติดตามเข้ามือถือผ่าน Telegram"
          >
            {isSendingTelegram ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Smartphone className="w-3.5 h-3.5" />
            )}
            <span>ส่งสรุปเข้า Telegram</span>
          </button>

          {onOpenDocFlow && (
            <button
              onClick={onOpenDocFlow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>เปิด DocFlow</span>
            </button>
          )}
        </div>
      </div>

      {telegramStatus && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>{telegramStatus}</span>
          </div>
          <button onClick={() => setTelegramStatus(null)} className="text-indigo-400 hover:text-indigo-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Radar Highlights Strip ── */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60 border-b border-slate-100">
        
        {/* Card 1: Pending Quotations */}
        <div 
          onClick={() => setActiveTab('quotation')}
          className={cn(
            "p-3 rounded-xl border transition-all cursor-pointer",
            activeTab === 'quotation' 
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs" 
              : "bg-white border-slate-200/80 hover:border-amber-200"
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ใบเสนอราคารอเซ็นกลับ
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
              7 วัน
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-xl font-black text-slate-900">{pendingQuotations.length}</span>
              <span className="text-[11px] text-slate-500 font-medium ml-1">ฉบับ</span>
            </div>
            <span className="text-xs font-bold text-amber-600 privacy-blur">
              ฿{pendingQuotationTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: Pending Invoices */}
        <div 
          onClick={() => setActiveTab('invoice')}
          className={cn(
            "p-3 rounded-xl border transition-all cursor-pointer",
            activeTab === 'invoice' 
              ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20 shadow-xs" 
              : "bg-white border-slate-200/80 hover:border-blue-200"
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 mb-1">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              ใบแจ้งหนี้รอเก็บเงิน
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
              รอชำระ
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-xl font-black text-slate-900">{pendingInvoices.length}</span>
              <span className="text-[11px] text-slate-500 font-medium ml-1">ฉบับ</span>
            </div>
            <span className="text-xs font-bold text-blue-600 privacy-blur">
              ฿{pendingInvoiceTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Auto Receipts */}
        <div 
          onClick={() => setActiveTab('receipt')}
          className={cn(
            "p-3 rounded-xl border transition-all cursor-pointer",
            activeTab === 'receipt' 
              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs" 
              : "bg-white border-slate-200/80 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ใบเสร็จรับเงินอัตโนมัติ
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
              เรียบร้อย
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-xl font-black text-slate-900">{autoReceipts.length}</span>
              <span className="text-[11px] text-slate-500 font-medium ml-1">ฉบับ</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold truncate max-w-[120px]">
              เมลถึง sasiwan...
            </span>
          </div>
        </div>

      </div>

      {/* ── Document List & Quick Action Area ── */}
      <div className="p-4">
        {activeTab === 'quotation' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>ใบเสนอราคาที่กำลังนับเวลาถอยหลัง (คลิกปุ่ม "ข้อความทักตาม" เพื่อคัดลอกข้อความส่งหาลูกค้า)</span>
              </p>
              <span className="text-xs text-slate-400 font-medium">
                {pendingQuotations.length} รายการ
              </span>
            </div>

            {pendingQuotations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">ยอดเยี่ยมมาก! ไม่มีใบเสนอราคาค้างติดตาม</p>
                <p className="text-xs text-slate-400 mt-1">ใบเสนอราคาทุกฉบับได้รับการเซ็นกลับเรียบร้อยแล้ว</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingQuotations.map(doc => {
                  const followUp = getFollowUpDays(doc);
                  return (
                    <div 
                      key={doc.id}
                      className={cn(
                        "radar-item p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all",
                        followUp.isOverdue
                          ? "bg-rose-50/50 border-rose-200 hover:border-rose-300"
                          : followUp.isToday
                          ? "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                          : "bg-white border-slate-200/90 hover:border-slate-300"
                      )}
                    >
                      {/* Doc Details */}
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs",
                          followUp.isOverdue
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        )}>
                          QT
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-slate-900">{doc.docNo}</span>
                            <span className="font-extrabold text-xs text-slate-800">{doc.customerName}</span>
                            
                            {/* Follow up status badge */}
                            {followUp.isOverdue ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                เกิน 7 วันแล้ว ({Math.abs(followUp.daysRemaining)} วัน)
                              </span>
                            ) : followUp.isToday ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ครบกำหนดวันนี้!
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                เหลืออีก {followUp.daysRemaining} วัน (ถึง {followUp.dueFormatted})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span>วันที่ออก: {doc.docDate}</span>
                            <span>&bull;</span>
                            <span className="font-bold text-slate-900">
                              ยอดรวม: ฿{Number(doc.netTotal || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        {/* 1-Click Follow Up Script */}
                        <button
                          onClick={() => {
                            setScriptModalDoc(doc);
                            setCopied(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                          title="เปิดข้อความทักตามลูกค้าที่สร้างให้อัตโนมัติ"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>ข้อความทักตาม</span>
                        </button>

                        {/* Mark Signed */}
                        <button
                          onClick={() => handleMarkSigned(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                          title="ลูกค้าเซ็นกลับมาแล้ว"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>เซ็นกลับแล้ว</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoice' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span>ใบแจ้งหนี้รอชำระเงิน (คลิกปุ่ม "ข้อความทักตาม" เพื่อแจ้งเตือนลูกค้า)</span>
              </p>
              <span className="text-xs text-slate-400 font-medium">
                {pendingInvoices.length} รายการ
              </span>
            </div>

            {pendingInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">ไม่มีใบแจ้งหนี้ค้างชำระ</p>
                <p className="text-xs text-slate-400 mt-1">เก็บเงินได้ครบถ้วนเรียบร้อยแล้ว</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingInvoices.map(doc => {
                  return (
                    <div 
                      key={doc.id}
                      className="radar-item p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center shrink-0 font-black text-xs">
                          INV
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-slate-900">{doc.docNo}</span>
                            <span className="font-extrabold text-xs text-slate-800">{doc.customerName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              รอรับชำระ
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span>วันที่ออก: {doc.docDate}</span>
                            <span>&bull;</span>
                            <span className="font-bold text-blue-700">
                              ยอดเงิน: ฿{Number(doc.netTotal || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <button
                          onClick={() => {
                            setScriptModalDoc(doc);
                            setCopied(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>ข้อความทักตาม</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'receipt' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>ใบเสร็จรับเงินที่ระบบสร้างให้อัตโนมัติ (ออกทันทีจากใบแจ้งหนี้)</span>
              </p>
              <span className="text-xs text-slate-400 font-medium">
                {autoReceipts.length} รายการ
              </span>
            </div>

            {autoReceipts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">ยังไม่มีใบเสร็จรับเงินในระบบ</p>
                <p className="text-xs text-slate-400 mt-1">เมื่อคุณออกใบแจ้งหนี้ใน DocFlow ระบบจะสร้างใบเสร็จรับเงินให้อัตโนมัติทันที</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {autoReceipts.slice(0, 5).map(doc => (
                  <div 
                    key={doc.id}
                    className="radar-item p-3.5 rounded-xl border border-slate-200/90 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0 font-black text-xs">
                        REC
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-900">{doc.docNo}</span>
                          <span className="font-extrabold text-xs text-slate-800">{doc.customerName}</span>
                          {doc.linkedDocNo && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                              อ้างอิง {doc.linkedDocNo}
                            </span>
                          )}
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            ออกอัตโนมัติ
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span>วันที่: {doc.docDate}</span>
                          <span>&bull;</span>
                          <span className="font-bold text-emerald-700">
                            ยอดเงิน: ฿{Number(doc.netTotal || 0).toLocaleString()}
                          </span>
                          {doc.emailSentTo && (
                            <>
                              <span>&bull;</span>
                              <span className="text-indigo-600">เมลแจ้งแล้ว: {doc.emailSentTo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Follow-Up Script Modal ── */}
      {scriptModalDoc && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setScriptModalDoc(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ข้อความทักตามลูกค้า (Follow-Up Script)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {scriptModalDoc.docType === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'} {scriptModalDoc.docNo} &bull; {scriptModalDoc.customerName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setScriptModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tone Select */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">สไตล์ข้อความ:</span>
              <div className="flex items-center gap-1.5 flex-1">
                {[
                  { id: 'friendly', label: 'สุภาพเป็นกันเอง (แนะนำ)' },
                  { id: 'formal', label: 'เป็นทางการ' },
                  { id: 'quick', label: 'กระชับรวดเร็ว' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setScriptTone(t.id as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      scriptTone === t.id
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="p-4 flex-1">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line select-all">
                {generateFollowUpMessage(scriptModalDoc, scriptTone)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                กดปุ่มด้านขวาเพื่อคัดลอก แล้วไปวางใน LINE หรือแชทได้ทันที
              </span>
              <button
                onClick={() => handleCopyScript(generateFollowUpMessage(scriptModalDoc, scriptTone))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer",
                  copied 
                    ? "bg-emerald-600 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกข้อความ (1-Click Copy)'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
