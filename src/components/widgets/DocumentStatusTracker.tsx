import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Clock, CheckCircle2, AlertTriangle, Send, Mail, ArrowRight,
  ExternalLink, RefreshCw, Sparkles, Filter, Search, ChevronRight, Eye,
  Calendar, Check, AlertCircle, ShieldCheck
} from 'lucide-react';
import { IssuedDocument } from '../../types';
import { subscribeIssuedDocuments, updateIssuedDocument } from '../../lib/db';
import { getPdfBlob } from '../../lib/pdfStore';

interface DocumentStatusTrackerProps {
  onOpenDocFlow?: () => void;
  onLoadDocument?: (doc: IssuedDocument) => void;
  className?: string;
  compact?: boolean;
}

export function DocumentStatusTracker({ onOpenDocFlow, onLoadDocument, className = '', compact = false }: DocumentStatusTrackerProps) {
  const [documents, setDocuments] = useState<IssuedDocument[]>([]);
  const [filter, setFilter] = useState<'all' | 'quotation_pending' | 'quotation_signed' | 'invoice_receipt'>('all');
  const [search, setSearch] = useState('');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Subscribe to real-time issued documents
  useEffect(() => {
    const unsub = subscribeIssuedDocuments(docs => {
      setDocuments(docs || []);
    });
    return () => unsub();
  }, []);

  // Helper to calculate days remaining for 7-day window
  const getFollowUpDays = (doc: IssuedDocument) => {
    const targetDate = doc.followUpDueDate 
      ? new Date(doc.followUpDueDate)
      : new Date(new Date(doc.createdAt || doc.docDate).getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const now = new Date();
    // Normalize to midnight for clean day calculation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      daysRemaining: diffDays,
      dueFormatted: targetDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }),
      isOverdue: diffDays < 0,
      isToday: diffDays === 0
    };
  };

  // Mark quotation as signed
  const handleMarkSigned = async (doc: IssuedDocument) => {
    setLoadingActionId(doc.id);
    try {
      const updated: IssuedDocument = {
        ...doc,
        status: 'signed',
        signedAt: new Date().toISOString()
      };
      await updateIssuedDocument(updated);
      setActionMessage(`อัปเดตใบเสนอราคา ${doc.docNo} เป็น "เซ็นกลับมาแล้ว" เรียบร้อย`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Re-send receipt email to sasiwanjandaeng@gmail.com
  const handleResendReceiptEmail = async (receiptDoc: IssuedDocument) => {
    setLoadingActionId(receiptDoc.id);
    try {
      const res = await fetch('/api/documents/send-receipt-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNo: receiptDoc.docNo,
          invoiceNo: receiptDoc.linkedDocNo || 'INV',
          customerName: receiptDoc.customerName,
          netTotal: receiptDoc.netTotal,
          currency: receiptDoc.currency || 'THB',
          recipientEmail: receiptDoc.emailSentTo || 'sasiwanjandaeng@gmail.com',
          docDate: receiptDoc.docDate,
          dueDate: receiptDoc.followUpDueDate,
          items: receiptDoc.items
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`ส่งอีเมลใบเสร็จ ${receiptDoc.docNo} ไปที่ ${data.sentTo} สำเร็จ!`);
        // Update document record
        const updated = {
          ...receiptDoc,
          emailSentAt: new Date().toISOString(),
          emailStatus: 'sent' as const
        };
        await updateIssuedDocument(updated);
      } else {
        setActionMessage(`ไม่สามารถส่งอีเมลได้: ${data.error || 'Unknown error'}`);
      }
      setTimeout(() => setActionMessage(null), 5000);
    } catch (e: any) {
      setActionMessage(`ข้อผิดพลาดในการส่งอีเมล: ${e.message}`);
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Open PDF viewer or prompt to load into form
  const handleViewPdf = (doc: IssuedDocument) => {
    const blob = getPdfBlob(doc.id);
    if (!blob) {
      if (onLoadDocument && window.confirm(`เอกสาร ${doc.docNo} ยังไม่มีไฟล์แคช PDF ในเครื่องนี้ ต้องการโหลดข้อมูลเข้าแบบฟอร์มเพื่อดาวน์โหลด PDF หรือไม่?`)) {
        onLoadDocument(doc);
        return;
      }
      alert('ไม่พบไฟล์ PDF ในเครื่อง หรือขนาดไฟล์เกิน 1MB');
      return;
    }
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${blob}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  // Filtered lists
  const quotations = useMemo(() => documents.filter(d => d.docType === 'quotation'), [documents]);
  const pendingQuotations = useMemo(() => quotations.filter(q => q.status !== 'signed'), [quotations]);
  const signedQuotations = useMemo(() => quotations.filter(q => q.status === 'signed'), [quotations]);
  const autoReceipts = useMemo(() => documents.filter(d => d.docType === 'receipt' && (d.autoGenerated || d.linkedDocNo)), [documents]);

  const displayedDocs = useMemo(() => {
    let list = documents;
    if (filter === 'quotation_pending') {
      list = pendingQuotations;
    } else if (filter === 'quotation_signed') {
      list = signedQuotations;
    } else if (filter === 'invoice_receipt') {
      list = documents.filter(d => d.docType === 'invoice' || d.docType === 'receipt');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => 
        d.docNo.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        (d.linkedDocNo && d.linkedDocNo.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [documents, filter, search, pendingQuotations, signedQuotations]);

  return (
    <div className={`rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all ${className}`}>
      
      {/* ── Header ── */}
      <div className="p-4 md:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                สถานะเอกสาร & ระบบนับเวลาอัตโนมัติ (Document Workflow)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  ระบบอัตโนมัติ
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                ติดตามใบเสนอราคาเซ็นกลับภายใน 7 วัน & ออกใบเสร็จรับเงินอัตโนมัติพร้อมส่งเมลแจ้งเตือน
              </p>
            </div>
          </div>
        </div>

        {onOpenDocFlow && (
          <button
            onClick={onOpenDocFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-2xs transition-all cursor-pointer self-start md:self-auto"
          >
            <span>เปิดหน้าออกเอกสาร DocFlow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Toast Action Message ── */}
      {actionMessage && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ── KPI Quick Summary Grid ── */}
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 border-b border-slate-100">
        
        {/* Card 1: Quotations Pending Signature (7-Day countdown) */}
        <div 
          onClick={() => setFilter('quotation_pending')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            filter === 'quotation_pending' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs' 
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ใบเสนอราคารอเซ็น
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
              นับ 7 วัน
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{pendingQuotations.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">ฉบับรอติดตาม</span>
          </div>
        </div>

        {/* Card 2: Quotations Signed */}
        <div 
          onClick={() => setFilter('quotation_signed')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            filter === 'quotation_signed' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs' 
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              เซ็นกลับมาแล้ว
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              สำเร็จ
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{signedQuotations.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">ฉบับพร้อมออกบิล</span>
          </div>
        </div>

        {/* Card 3: Auto Receipts Generated */}
        <div 
          onClick={() => setFilter('invoice_receipt')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            filter === 'invoice_receipt' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20 shadow-xs' 
              : 'bg-white border-slate-200/80 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-700 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              ใบเสร็จอัตโนมัติ
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
              ทันที 7 วัน
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{autoReceipts.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">ฉบับออกตาม INV</span>
          </div>
        </div>

        {/* Card 4: Email Dispatched */}
        <div 
          onClick={() => setFilter('all')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            filter === 'all' 
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/20 shadow-xs' 
              : 'bg-white border-slate-200/80 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-indigo-700 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              อีเมลแจ้งเตือน
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full truncate max-w-[70px]">
              sasiwan...
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">
              {documents.filter(d => d.emailSentTo).length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">ฉบับส่งเมลแล้ว</span>
          </div>
        </div>

      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="p-3 md:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({documents.length})
          </button>
          <button
            onClick={() => setFilter('quotation_pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'quotation_pending' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            รอเซ็นกลับ ({pendingQuotations.length})
          </button>
          <button
            onClick={() => setFilter('quotation_signed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'quotation_signed' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Check className="w-3 h-3" />
            เซ็นกลับแล้ว ({signedQuotations.length})
          </button>
          <button
            onClick={() => setFilter('invoice_receipt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'invoice_receipt' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            ใบแจ้งหนี้ &amp; ใบเสร็จ ({autoReceipts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่ / ชื่อลูกค้า..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* ── Document List ── */}
      <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
        {displayedDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <FileText className="w-8 h-8 opacity-40 text-slate-400" />
            <p className="text-xs font-semibold">ยังไม่มีเอกสารในหมวดหมู่นี้</p>
            <p className="text-[11px] text-slate-400">เมื่อออกใบเสนอราคาหรือใบแจ้งหนี้ในระบบ DocFlow ระบบจะแสดงการติดตามที่นี่โดยอัตโนมัติ</p>
          </div>
        ) : (
          displayedDocs.map(doc => {
            const followUp = getFollowUpDays(doc);
            const isQuotation = doc.docType === 'quotation';
            const isInvoice = doc.docType === 'invoice';
            const isReceipt = doc.docType === 'receipt';
            const isSigned = doc.status === 'signed';

            return (
              <div 
                key={doc.id}
                className="p-3.5 md:p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                {/* Left: Document info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                    isQuotation 
                      ? isSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      : isInvoice 
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isQuotation ? 'QT' : isInvoice ? 'INV' : 'RC'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs md:text-sm text-slate-900">{doc.docNo}</span>
                      
                      {/* Document Type Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isQuotation 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : isInvoice 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}>
                        {isQuotation ? 'ใบเสนอราคา' : isInvoice ? 'ใบแจ้งหนี้' : 'ใบเสร็จรับเงิน'}
                      </span>

                      {/* Linked Document Reference */}
                      {doc.linkedDocNo && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          ผูกกับ {doc.linkedDocNo}
                        </span>
                      )}

                      {/* Auto generated badge */}
                      {doc.autoGenerated && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>สร้างอัตโนมัติ</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]">{doc.customerName}</span>
                      <span>·</span>
                      <span>ออกเมื่อ {new Date(doc.docDate || doc.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                      <span>·</span>
                      <span className="font-bold text-slate-800">
                        {doc.currency === 'USD' ? '$' : '฿'}{doc.netTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Email recipient info */}
                    {doc.emailSentTo && (
                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-semibold mt-1">
                        <Mail className="w-3 h-3 text-indigo-500" />
                        <span>ส่งเมลไปที่: <strong>{doc.emailSentTo}</strong></span>
                        <span className="text-slate-400">({doc.emailSentAt ? new Date(doc.emailSentAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'สำเร็จ'})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: 7-Day Countdown Timer & Action Controls */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  
                  {/* Quotation 7-day follow-up countdown */}
                  {isQuotation && (
                    <div className="flex flex-col items-end">
                      {isSigned ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>เซ็นกลับมาแล้ว</span>
                          {doc.signedAt && (
                            <span className="text-[10px] text-emerald-600/70 font-normal">
                              ({new Date(doc.signedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${
                          followUp.isOverdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                            : followUp.isToday
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {followUp.isOverdue
                              ? `เกินกำหนดตาม ${Math.abs(followUp.daysRemaining)} วัน!`
                              : followUp.isToday
                                ? 'ครบกำหนดตามวันนี้!'
                                : `เหลือเวลาตาม ${followUp.daysRemaining} วัน`}
                          </span>
                          <span className="text-[10px] opacity-75 font-normal">
                            (ภายใน 7 วัน: {followUp.dueFormatted})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invoice / Receipt 7-day Payment/Email indicator */}
                  {(isInvoice || isReceipt) && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>รอบ 7 วัน: {followUp.dueFormatted}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    
                    {/* Mark as signed button for Quotations */}
                    {isQuotation && !isSigned && (
                      <button
                        onClick={() => handleMarkSigned(doc)}
                        disabled={loadingActionId === doc.id}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="ทำเครื่องหมายว่าลูกค้าเซ็นใบเสนอราคากลับมาแล้ว"
                      >
                        {loadingActionId === doc.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>เซ็นกลับแล้ว</span>
                      </button>
                    )}

                    {/* Resend Receipt Email for Receipts */}
                    {isReceipt && (
                      <button
                        onClick={() => handleResendReceiptEmail(doc)}
                        disabled={loadingActionId === doc.id}
                        className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 text-xs font-medium shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                        title="ส่งอีเมลใบเสร็จรับเงินอีกครั้งไปที่ sasiwanjandaeng@gmail.com"
                      >
                        {loadingActionId === doc.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Load to Form Button (for viewing / re-downloading PDF) */}
                    {onLoadDocument && (
                      <button
                        onClick={() => onLoadDocument(doc)}
                        className="px-2 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 hover:bg-blue-100 text-xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        title="โหลดข้อมูลเอกสารนี้เข้าแบบฟอร์มเพื่อตรวจทานหรือกดดาวน์โหลด PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">โหลดเข้าฟอร์ม / โหลด PDF</span>
                      </button>
                    )}

                    {/* View PDF */}
                    <button
                      onClick={() => handleViewPdf(doc)}
                      className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 text-xs font-medium shadow-2xs transition-all cursor-pointer"
                      title="เปิดดู PDF เอกสาร"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer explanation ── */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>
            ระบบอัตโนมัติ: ใบเสนอราคาจะเริ่มนับเวลาติดตาม 7 วันทันที | ใบแจ้งหนี้จะออกใบเสร็จรับเงินอัตโนมัติพร้อมส่งเมลไปที่ <strong>sasiwanjandaeng@gmail.com</strong>
          </span>
        </div>
        <span className="font-bold text-slate-700 shrink-0">
          รวมทั้งหมด {documents.length} ฉบับ
        </span>
      </div>

    </div>
  );
}
