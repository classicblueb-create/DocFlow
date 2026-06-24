import React, { useState, useEffect, useRef } from 'react';
import {
 ArrowLeft, Edit2, Trash2, CheckCircle, Clock, Loader2,
 Plus, X, Paperclip, MessageSquare, GitBranch, Bot,
 ChevronDown, GripVertical, Calendar, DollarSign,
 Sparkles, Check, AlertCircle, Link2, Mail, BookOpen,
 RefreshCw, Copy, ExternalLink, Banknote, FileText, Send, Download,
} from 'lucide-react';
import { Task, Subtask, Client, Template, TaskComment, TaskAttachment, PaymentPhase, Invoice, InvoiceStatus } from '../types';
import { cn, getDeadlineStatus, getDaysLeft } from '../lib/utils';
import { uploadFile, deleteFile } from '../lib/db';

interface AiChatEntry {
 agentId: string;
 agentTitle: string;
 timestamp: string;
 text: string;
 sender: 'user' | 'agent';
}

// ── helpers ──────────────────────────────────────────────────────────────────


function parseSubtasks(raw?: string): Subtask[] {
 if (!raw) return [];
 try {
 const parsed = JSON.parse(raw);
 if (Array.isArray(parsed) && parsed[0]?.status) return parsed as Subtask[];
 return [];
 } catch {
 return [];
 }
}

function parseComments(raw?: string): TaskComment[] {
 if (!raw) return [];
 try { return JSON.parse(raw) as TaskComment[]; } catch { return []; }
}

function parseAttachments(raw?: string): TaskAttachment[] {
 if (!raw) return [];
 try { return JSON.parse(raw) as TaskAttachment[]; } catch { return []; }
}

function parsePaymentPhases(raw?: string): PaymentPhase[] {
 if (!raw) return [];
 try { return JSON.parse(raw) as PaymentPhase[]; } catch { return []; }
}

const STATUS_OPTIONS = [
 { value: 'To Do', label: 'รอดำเนินการ', color: 'bg-slate-100 text-slate-600 border-slate-200' },
 { value: 'In Progress', label: 'กำลังทำ', color: 'bg-orange-100 text-orange-700 border-orange-200' },
 { value: 'Done', label: 'เสร็จสิ้น', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
 { value: 'Waiting', label: 'รอข้อมูล', color: 'bg-amber-100 text-amber-700 border-amber-200' },
 { value: 'Cancelled', label: 'ยกเลิก', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

function statusStyle(status: string) {
 return STATUS_OPTIONS.find(s => s.value === status || s.label === status)?.color
 ?? 'bg-slate-100 text-slate-600 border-slate-200';
}
function statusLabel(status: string) {
 return STATUS_OPTIONS.find(s => s.value === status || s.label === status)?.label ?? status;
}

// ── Tab type ─────────────────────────────────────────────────────────────────
type TabId = 'subtasks' | 'payment' | 'overview' | 'notes' | 'files' | 'dependencies' | 'ai';

// ── Props ────────────────────────────────────────────────────────────────────
interface ProjectPageProps {
 task: Task;
 tasks: Task[];
 clients: Client[];
 onClose: () => void;
 onUpdateTask: (t: Task) => void;
 onDeleteTask: (id: string | number) => void;
 onEdit: (t: Task) => void;
 onConsultAgent: (taskId: string, agentId?: string) => void;
 onSaveAsTemplate: (tmpl: Template) => void;
}

export function ProjectPage({
 task, tasks, clients, onClose,
 onUpdateTask, onDeleteTask, onEdit, onConsultAgent,
}: ProjectPageProps) {
 const [activeTab, setActiveTab] = useState<TabId>('subtasks');
 const [subtasks, setSubtasks] = useState<Subtask[]>(() => parseSubtasks(task.subtasks));
 const [comments, setComments] = useState<TaskComment[]>(() => parseComments(task.comments));
 const [attachments, setAttachments] = useState<TaskAttachment[]>(() => parseAttachments(task.attachments));
 const [newSubtaskName, setNewSubtaskName] = useState('');
 const [newSubStartDate, setNewSubStartDate] = useState('');
 const [newSubDueDate, setNewSubDueDate] = useState('');
 const [newSubNotes, setNewSubNotes] = useState('');
 const [newSubAssignee, setNewSubAssignee] = useState<'Fan' | 'Mod' | ''>('');
 const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
 const [newComment, setNewComment] = useState('');
 const [newLinkName, setNewLinkName] = useState('');
 const [newLinkUrl, setNewLinkUrl] = useState('');
 const [showStatusDropdown, setShowStatusDropdown] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [isGeneratingAI, setIsGeneratingAI] = useState(false);
 const [aiError, setAiError] = useState('');
 const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
 const dragIdx = useRef<number | null>(null);

 // AI tab state
 const [aiAnalysis, setAiAnalysis] = useState(task.aiAnalysis || '');
 const [aiEmail, setAiEmail] = useState(task.aiEmail || '');
 const [aiCourse, setAiCourse] = useState(task.aiCourse || '');
 const [isGenAnalysis, setIsGenAnalysis] = useState(false);
 const [isGenEmail, setIsGenEmail] = useState(false);
 const [isGenCourse, setIsGenCourse] = useState(false);
 const [aiTabError, setAiTabError] = useState('');
 const [copiedKey, setCopiedKey] = useState<string | null>(null);

 const chatHistory: AiChatEntry[] = (() => {
 try { return task.aiChatHistory ? JSON.parse(task.aiChatHistory) : []; } catch { return []; }
 })();

 // ── Payment phases ────────────────────────────────────────────────────────
 const [phases, setPhases] = useState<PaymentPhase[]>(() => parsePaymentPhases(task.paymentPhases));
 const [newPhaseLabel, setNewPhaseLabel] = useState('');
 const [newPhaseAmount, setNewPhaseAmount] = useState('');

 const commitPhases = (next: PaymentPhase[]) => {
 setPhases(next);
 saveTask({ paymentPhases: JSON.stringify(next) });
 };

 const addPhase = () => {
 const label = newPhaseLabel.trim();
 const amount = parseFloat(newPhaseAmount);
 if (!label || isNaN(amount) || amount <= 0) return;
 const next: PaymentPhase[] = [...phases, { id: Date.now().toString(), label, amount, paid: false }];
 commitPhases(next);
 setNewPhaseLabel(''); setNewPhaseAmount('');
 };

 const togglePhasePaid = (id: string) => {
 const next = phases.map(p =>
 p.id === id ? { ...p, paid: !p.paid, paidAt: !p.paid ? new Date().toISOString().split('T')[0] : undefined } : p
 );
 commitPhases(next);
 };

 const deletePhase = (id: string) => {
 commitPhases(phases.filter(p => p.id !== id));
 };

 const updatePhaseAmount = (id: string, val: string) => {
 const amount = parseFloat(val);
 if (isNaN(amount)) return;
 commitPhases(phases.map(p => p.id === id ? { ...p, amount } : p));
 };

 const updatePhaseLabel = (id: string, label: string) => {
 commitPhases(phases.map(p => p.id === id ? { ...p, label } : p));
 };

 // ── Invoice ──────────────────────────────────────────────────────────────
 const [invoices, setInvoices] = useState<Invoice[]>(() => { try { return task.invoices ? JSON.parse(task.invoices) : []; } catch { return []; } });
 const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([]);
 const [invoiceDueDate, setInvoiceDueDate] = useState('');
 const [invoiceNotes, setInvoiceNotes] = useState('');
 const [isCreatingInv, setIsCreatingInv] = useState(false);
 const [isPdfLoading, setIsPdfLoading] = useState<string | null>(null);
 const [showInvForm, setShowInvForm] = useState(false);

 const commitInvoices = (next: Invoice[]) => {
 setInvoices(next);
 saveTask({ invoices: JSON.stringify(next) });
 };

 const nextInvoiceNo = () => {
 const year = new Date().getFullYear();
 const existing = invoices.map(inv => parseInt(inv.invoiceNo.split('-').pop() || '0', 10)).filter(n => !isNaN(n));
 const seq = existing.length > 0 ? Math.max(...existing) + 1 : 1;
 return `INV-${year}-${String(seq).padStart(3, '0')}`;
 };

 const createInvoice = () => {
 if (selectedPhaseIds.length === 0) return;
 const selectedPhases = phases.filter(p => selectedPhaseIds.includes(p.id));
 const totalAmount = selectedPhases.reduce((s, p) => s + p.amount, 0);
 const inv: Invoice = {
 id: Date.now().toString(),
 invoiceNo: nextInvoiceNo(),
 issueDate: new Date().toISOString().split('T')[0],
 dueDate: invoiceDueDate || undefined,
 status: 'draft',
 phaseIds: selectedPhaseIds,
 totalAmount,
 notes: invoiceNotes || undefined,
 };
 commitInvoices([...invoices, inv]);
 setSelectedPhaseIds([]); setInvoiceDueDate(''); setInvoiceNotes(''); setShowInvForm(false);
 };

 const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
 const next = invoices.map(inv => {
 if (inv.id !== id) return inv;
 const updated = { ...inv, status };
 if (status === 'sent') updated.sentAt = new Date().toISOString().split('T')[0];
 if (status === 'paid') {
 updated.paidAt = new Date().toISOString().split('T')[0];
 // auto-mark payment phases as paid
 const phasesToMark = phases.map(p => inv.phaseIds.includes(p.id) ? { ...p, paid: true, paidAt: updated.paidAt } : p);
 commitPhases(phasesToMark);
 }
 return updated;
 });
 commitInvoices(next);
 };

 const deleteInvoice = (id: string) => commitInvoices(invoices.filter(inv => inv.id !== id));

 const downloadInvoicePdf = async (inv: Invoice) => {
 setIsPdfLoading(inv.id);
 const client = clients.find(c => c.id === task.clientId);
 const invPhases = phases.filter(p => inv.phaseIds.includes(p.id));
 try {
 const { generatePDF } = await import('../lib/sheets');
 const url = await generatePDF({
 docType: 'invoice',
 invoiceNo: inv.invoiceNo,
 issueDate: inv.issueDate,
 dueDate: inv.dueDate,
 projectName: task.name,
 clientName: task.customer || client?.name || '',
 clientAddress: client?.address || '',
 clientTaxId: client?.taxId || '',
 items: invPhases.map(p => ({ description: p.label, amount: p.amount })),
 totalAmount: inv.totalAmount,
 notes: inv.notes,
 });
 if (url) window.open(url, '_blank');
 else alert('ไม่สามารถสร้าง PDF ได้ — ตรวจสอบ Apps Script');
 } catch (e: any) {
 alert(`PDF error: ${e.message}`);
 } finally {
 setIsPdfLoading(null);
 }
 };

 const INV_STATUS: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
 draft: { label: 'ร่าง', color: 'text-slate-500', bg: 'bg-slate-100' },
 sent: { label: 'ส่งแล้ว', color: 'text-blue-600', bg: 'bg-blue-100' },
 pending: { label: 'รอชำระ', color: 'text-amber-600', bg: 'bg-amber-100' },
 paid: { label: 'รับเงินแล้ว', color: 'text-emerald-600', bg: 'bg-emerald-100' },
 overdue: { label: 'เกินกำหนด', color: 'text-rose-600', bg: 'bg-rose-100' },
 };

 // computed payment stats
 const totalPrice = task.price || 0;
 const totalPaid = phases.reduce((s, p) => s + (p.paid ? p.amount : 0), 0);
 const totalPending = phases.reduce((s, p) => s + (!p.paid ? p.amount : 0), 0);
 const phasesTotal = phases.reduce((s, p) => s + p.amount, 0);
 const paidPct = phasesTotal > 0 ? Math.round((totalPaid / phasesTotal) * 100) : 0;

 // Sync back to parent whenever subtasks/comments/attachments change
 const saveTask = (patch: Partial<Task>) => {
 onUpdateTask({ ...task, ...patch });
 };

 // ── Subtask helpers ───────────────────────────────────────────────────────
 const commitSubtasks = (next: Subtask[]) => {
 setSubtasks(next);
 saveTask({ subtasks: JSON.stringify(next) });
 };

 const addSubtask = () => {
 const name = newSubtaskName.trim();
 if (!name) return;
 const next: Subtask = {
 id: Date.now().toString(),
 name,
 status: 'todo',
 order: subtasks.length,
 assignee: newSubAssignee || undefined,
 startDate: newSubStartDate || undefined,
 dueDate: newSubDueDate || undefined,
 notes: newSubNotes || undefined,
 };
 commitSubtasks([...subtasks, next]);
 setNewSubtaskName('');
 setNewSubStartDate('');
 setNewSubDueDate('');
 setNewSubNotes('');
 setNewSubAssignee('');
 // ส่ง Telegram notification
 const projectName = task.name;
 fetch('/api/notify/telegram', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 taskName: `[Subtask] ${name}`,
 assignee: next.assignee || task.assignee || 'ทีม',
 dueDate: newSubDueDate || '',
 details: newSubNotes || '',
 customer: projectName,
 fileUrl: task.fileUrl || '',
 }),
 }).catch(() => {}); // silent fail
 };

 const toggleSubtask = (id: string) => {
 const next = subtasks.map(s => s.id === id
 ? { ...s, status: (s.status === 'done' ? 'todo' : 'done') as Subtask['status'] }
 : s);
 commitSubtasks(next);
 };

 const deleteSubtask = (id: string) => commitSubtasks(subtasks.filter(s => s.id !== id));

 const cycleSubtaskStatus = (id: string) => {
 const order: Subtask['status'][] = ['todo', 'doing', 'done'];
 const next = subtasks.map(s => {
 if (s.id !== id) return s;
 const idx = order.indexOf(s.status);
 return { ...s, status: order[(idx + 1) % order.length] };
 });
 commitSubtasks(next);
 };

 // Drag-to-reorder subtasks
 const onDragStart = (i: number) => { dragIdx.current = i; };
 const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); };
 const onDrop = (i: number) => {
 const from = dragIdx.current;
 if (from === null || from === i) { setDragOverIdx(null); return; }
 const next = [...subtasks];
 const [moved] = next.splice(from, 1);
 next.splice(i, 0, moved);
 commitSubtasks(next.map((s, idx) => ({ ...s, order: idx })));
 setDragOverIdx(null);
 };

 // ── AI Generate subtasks ──────────────────────────────────────────────────
 const generateSubtasksWithAI = async () => {
 setIsGeneratingAI(true);
 setAiError('');
 try {
 const res = await fetch('/api/ai/generate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ type: 'subtasks', taskName: task.name, details: task.details, customer: task.customer, priority: task.priority }),
 });
 if (!res.ok) throw new Error(`HTTP ${res.status}`);
 const data = await res.json();
 if (data.error) throw new Error(data.error);
 // result is already a parsed array from server
 const parsed: { name: string }[] = Array.isArray(data.result)
 ? data.result.map((s: any) => typeof s === 'string' ? { name: s } : s)
 : [];
 const aiSubtasks: Subtask[] = parsed.map((s, i) => ({
 id: `ai-${Date.now()}-${i}`,
 name: s.name,
 status: 'todo',
 order: subtasks.length + i,
 }));
 commitSubtasks([...subtasks, ...aiSubtasks]);
 } catch (e: any) {
 setAiError(e.message || 'เกิดข้อผิดพลาด');
 } finally {
 setIsGeneratingAI(false);
 }
 };

 // ── Comments ──────────────────────────────────────────────────────────────
 const addComment = () => {
 const text = newComment.trim();
 if (!text) return;
 const next = [...comments, { id: Date.now().toString(), text, createdAt: new Date().toISOString() }];
 setComments(next);
 saveTask({ comments: JSON.stringify(next) });
 setNewComment('');
 };

 const deleteComment = (id: string) => {
 const next = comments.filter(c => c.id !== id);
 setComments(next);
 saveTask({ comments: JSON.stringify(next) });
 };

 // ── Attachments ──────────────────────────────────────────────────────────
 const addLink = () => {
 const url = newLinkUrl.trim();
 if (!url) return;
 const next = [...attachments, { id: Date.now().toString(), name: newLinkName || url, url }];
 setAttachments(next);
 saveTask({ attachments: JSON.stringify(next) });
 setNewLinkName(''); setNewLinkUrl('');
 };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setIsUploading(true);
 try {
 const result = await uploadFile(file, `attachments/${task.id}`);
 const newAttachment: TaskAttachment = {
 id: Date.now().toString(),
 name: file.name,
 url: result.url,
 path: result.path,
 mimeType: file.type,
 size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
 };
 const next = [...attachments, newAttachment];
 setAttachments(next);
 saveTask({ attachments: JSON.stringify(next) });
 } catch (err: any) {
 console.error('[Upload Error]:', err);
 alert(`อัปโหลดไฟล์ไม่สำเร็จ: ${err.message || err}`);
 } finally {
 setIsUploading(false);
 }
 };

 const deleteAttachment = async (id: string) => {
 const attachment = attachments.find(a => a.id === id);
 if (attachment?.path) {
 try {
 await deleteFile(attachment.path);
 } catch (err) {
 console.error('[Storage Delete Error]:', err);
 }
 }
 const next = attachments.filter(a => a.id !== id);
 setAttachments(next);
 saveTask({ attachments: JSON.stringify(next) });
 };

 // ── AI generation helpers ─────────────────────────────────────────────────
 const callGenerateAPI = async (type: string): Promise<string> => {
 const res = await fetch('/api/ai/generate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ type, taskName: task.name, details: task.details, customer: task.customer, priority: task.priority }),
 });
 if (!res.ok) throw new Error(`HTTP ${res.status}`);
 const data = await res.json();
 if (data.error) throw new Error(data.error);
 return typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
 };

 const copyToClipboard = (text: string, key: string) => {
 navigator.clipboard.writeText(text).then(() => {
 setCopiedKey(key);
 setTimeout(() => setCopiedKey(null), 2000);
 });
 };

 const generateAnalysis = async () => {
 setIsGenAnalysis(true); setAiTabError('');
 try {
 const result = await callGenerateAPI('analysis');
 setAiAnalysis(result);
 saveTask({ aiAnalysis: result });
 } catch (e: any) { setAiTabError(e.message); }
 finally { setIsGenAnalysis(false); }
 };

 const generateEmail = async () => {
 setIsGenEmail(true); setAiTabError('');
 try {
 const result = await callGenerateAPI('email');
 setAiEmail(result);
 saveTask({ aiEmail: result });
 } catch (e: any) { setAiTabError(e.message); }
 finally { setIsGenEmail(false); }
 };

 const generateCourse = async () => {
 setIsGenCourse(true); setAiTabError('');
 try {
 const result = await callGenerateAPI('course');
 setAiCourse(result);
 saveTask({ aiCourse: result });
 } catch (e: any) { setAiTabError(e.message); }
 finally { setIsGenCourse(false); }
 };

 // ── Computed ──────────────────────────────────────────────────────────────
 const doneSubs = subtasks.filter(s => s.status === 'done').length;
 const totalSubs = subtasks.length;
 const pct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
 const deadline = getDeadlineStatus(task);
 const daysLeft = getDaysLeft(task);
 const client = clients.find(c => c.id === task.clientId);

 const aiDataCount = [aiAnalysis, aiEmail, aiCourse].filter(Boolean).length + (chatHistory.length > 0 ? 1 : 0);

 const TABS: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
 { id: 'subtasks', label: 'Subtasks', icon: CheckCircle, badge: totalSubs > 0 ? totalSubs : undefined },
 { id: 'payment', label: 'การชำระเงิน', icon: Banknote, badge: phases.length > 0 ? phases.length : undefined },
 { id: 'overview', label: 'ภาพรวม', icon: GitBranch },
 { id: 'ai', label: 'AI', icon: Bot, badge: aiDataCount > 0 ? aiDataCount : undefined },
 { id: 'notes', label: 'บันทึก', icon: MessageSquare, badge: comments.length > 0 ? comments.length : undefined },
 { id: 'files', label: 'ไฟล์ & ลิงก์', icon: Paperclip, badge: attachments.length > 0 ? attachments.length : undefined },
 { id: 'dependencies', label: 'Dependencies', icon: Link2 },
 ];

 const depTasks = (task.dependencies || []).map(id => tasks.find(t => t.id.toString() === id)).filter(Boolean) as Task[];

 // ── Close on Escape ───────────────────────────────────────────────────────
 useEffect(() => {
 const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
 window.addEventListener('keydown', handler);
 return () => window.removeEventListener('keydown', handler);
 }, [onClose]);

 return (
 <div className="fixed inset-0 z-[80] flex">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

 {/* Panel — slides in from right */}
 <div className="relative ml-auto w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">

 {/* ── Header ─────────────────────────────────────────────────── */}
 <div className="shrink-0 border-b border-slate-100 bg-white">

 {/* Top bar */}
 <div className="flex items-center gap-3 px-6 py-3">
 <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0">
 <ArrowLeft className="w-4 h-4" />
 </button>
 <div className="flex-1 min-w-0">
 <h1 className="text-lg font-black text-slate-900 truncate leading-tight">{task.name}</h1>
 {task.customer && <p className="text-xs text-slate-400 font-semibold">{task.customer}</p>}
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button onClick={() => onConsultAgent(task.id.toString(), 'daily_briefer')}
 className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer">
 <Bot className="w-3.5 h-3.5" /> AI Agent
 </button>
 <button onClick={() => onEdit(task)}
 className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
 <Edit2 className="w-4 h-4" />
 </button>
 <button onClick={() => onDeleteTask(task.id)}
 className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Meta row */}
 <div className="px-6 pb-3 flex flex-wrap items-center gap-2">
 {/* Status badge — clickable */}
 <div className="relative">
 <button onClick={() => setShowStatusDropdown(v => !v)}
 className={cn('flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors', statusStyle(task.status))}>
 {statusLabel(task.status)} <ChevronDown className="w-3 h-3" />
 </button>
 {showStatusDropdown && (
 <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-10 py-1 min-w-[140px]">
 {STATUS_OPTIONS.map(opt => (
 <button key={opt.value} onClick={() => {
 saveTask({ status: opt.value });
 setShowStatusDropdown(false);
 }}
 className={cn('w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer',
 (task.status === opt.value || task.status === opt.label) && 'bg-indigo-50 text-indigo-700')}>
 {opt.label}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Priority */}
 {task.priority && (
 <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
 {task.priority}
 </span>
 )}

 {/* Deadline */}
 {task.endDate && (
 <span className={cn('flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border',
 deadline === 'overdue' ? 'bg-rose-100 text-rose-700 border-rose-200' :
 deadline === 'urgent' ? 'bg-orange-100 text-orange-700 border-orange-200' :
 deadline === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200' :
 'bg-slate-100 text-slate-600 border-slate-200')}>
 <Calendar className="w-3 h-3" />
 {task.endDate}
 {deadline === 'overdue' ? ` (เกิน ${Math.abs(daysLeft)} วัน)` :
 deadline ? ` (อีก ${daysLeft} วัน)` : ''}
 </span>
 )}

 {/* Price */}
 {task.price ? (
 <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
 <DollarSign className="w-3 h-3" /> ฿{Number(task.price).toLocaleString()}
 </span>
 ) : null}

 {/* Progress */}
 {totalSubs > 0 && (
 <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
 <CheckCircle className="w-3 h-3" />
 {doneSubs}/{totalSubs} subtasks ({pct}%)
 </span>
 )}
 </div>

 {/* Progress bar */}
 {totalSubs > 0 && (
 <div className="px-6 pb-3">
 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
 style={{ width: `${pct}%` }} />
 </div>
 </div>
 )}

 {/* Tabs */}
 <div className="px-6 flex gap-0 border-t border-slate-100">
 {TABS.map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)}
 className={cn(
 'flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer relative',
 activeTab === tab.id
 ? 'border-indigo-500 text-indigo-700'
 : 'border-transparent text-slate-400 hover:text-slate-600'
 )}>
 <tab.icon className="w-3.5 h-3.5" />
 {tab.label}
 {tab.badge !== undefined && (
 <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">{tab.badge}</span>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* ── Tab content ────────────────────────────────────────────── */}
 <div className="flex-1 overflow-y-auto hide-scrollbar">

 {/* SUBTASKS */}
 {activeTab === 'subtasks' && (
 <div className="p-6 space-y-3">
 {/* AI generate button */}
 <div className="flex items-center justify-between mb-4">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
 {subtasks.length} รายการ · เสร็จ {doneSubs}
 </p>
 <button onClick={generateSubtasksWithAI} disabled={isGeneratingAI}
 className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer disabled:opacity-60">
 {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
 {isGeneratingAI ? 'AI กำลังสร้าง...' : 'AI สร้าง Subtasks'}
 </button>
 </div>

 {aiError && (
 <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
 <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {aiError}
 </div>
 )}

 {/* Subtask list */}
 <div className="space-y-2">
 {subtasks.map((sub, i) => (
 <div key={sub.id} className="rounded-2xl border bg-white border-slate-100 hover:border-slate-200 transition-all">
 {/* Main row */}
 <div
 draggable
 onDragStart={() => onDragStart(i)}
 onDragOver={e => onDragOver(e, i)}
 onDrop={() => onDrop(i)}
 className={cn('flex items-center gap-3 p-3', dragOverIdx === i ? 'opacity-50' : '')}
 >
 <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 cursor-grab" />
 <button onClick={() => cycleSubtaskStatus(sub.id)}
 className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer',
 sub.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' :
 sub.status === 'doing' ? 'bg-orange-400 border-orange-400 text-white' :
 'border-slate-300 hover:border-indigo-400')}>
 {sub.status === 'done' && <Check className="w-3 h-3" />}
 {sub.status === 'doing' && <Clock className="w-3 h-3" />}
 </button>
 <div className="flex-1 min-w-0">
 <span className={cn('text-sm font-semibold', sub.status === 'done' && 'line-through text-slate-400')}>
 {sub.name}
 </span>
 {/* Date badges */}
 {(sub.startDate || sub.dueDate) && (
 <div className="flex gap-2 mt-0.5">
 {sub.startDate && <span className="text-[10px] text-slate-400">เริ่ม {sub.startDate}</span>}
 {sub.dueDate && <span className="text-[10px] text-rose-500 font-semibold">ส่ง {sub.dueDate}</span>}
 </div>
 )}
 </div>
 <div className="flex items-center gap-1.5 shrink-0">
 {sub.assignee && (
 <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
 {sub.assignee}
 </span>
 )}
 <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full',
 sub.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
 sub.status === 'doing' ? 'bg-orange-100 text-orange-700' :
 'bg-slate-100 text-slate-500')}>
 {sub.status === 'done' ? 'Done' : sub.status === 'doing' ? 'กำลังทำ' : 'รอ'}
 </span>
 </div>
 <button onClick={() => setExpandedSubId(expandedSubId === sub.id ? null : sub.id)}
 className="text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer">
 <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expandedSubId === sub.id && 'rotate-180')} />
 </button>
 <button onClick={() => deleteSubtask(sub.id)} className="text-slate-300 hover:text-rose-400 transition-colors cursor-pointer">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 {/* Expanded detail panel */}
 {expandedSubId === sub.id && (
 <div className="px-4 pb-3 border-t border-slate-50 pt-3 space-y-2">
 <div className="grid grid-cols-3 gap-2">
 <div>
 <label className="text-[10px] font-bold text-slate-400 block mb-1">ผู้รับผิดชอบ</label>
 <select value={sub.assignee || ''} onChange={e => commitSubtasks(subtasks.map(s => s.id === sub.id ? {...s, assignee: (e.target.value as any) || undefined} : s))}
 className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white cursor-pointer">
 <option value="">ไม่ระบุ</option>
 <option value="Fan">Fan</option>
 <option value="Mod">Mod</option>
 </select>
 </div>
 <div>
 <label className="text-[10px] font-bold text-slate-400 block mb-1">วันเริ่ม</label>
 <input type="date" value={sub.startDate || ''} onChange={e => commitSubtasks(subtasks.map(s => s.id === sub.id ? {...s, startDate: e.target.value || undefined} : s))}
 className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400" />
 </div>
 <div>
 <label className="text-[10px] font-bold text-slate-400 block mb-1">วันกำหนดส่ง</label>
 <input type="date" value={sub.dueDate || ''} onChange={e => commitSubtasks(subtasks.map(s => s.id === sub.id ? {...s, dueDate: e.target.value || undefined} : s))}
 className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400" />
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-slate-400 block mb-1">หมายเหตุ</label>
 <textarea value={sub.notes || ''} onChange={e => commitSubtasks(subtasks.map(s => s.id === sub.id ? {...s, notes: e.target.value || undefined} : s))}
 rows={2} placeholder="ระบุหมายเหตุ..."
 className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 resize-none" />
 </div>
 </div>
 )}
 </div>
 ))}
 </div>

 {/* Add subtask form */}
 <div className="border border-slate-200 rounded-2xl p-3 space-y-2 bg-slate-50/50">
 <input
 value={newSubtaskName}
 onChange={e => setNewSubtaskName(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && addSubtask()}
 placeholder="ชื่อ subtask ใหม่..."
 className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white"
 />
 <div className="grid grid-cols-3 gap-2">
 <div>
 <label className="text-[10px] font-bold text-slate-400 block mb-1">ผู้รับผิดชอบ</label>
 <select value={newSubAssignee} onChange={e => setNewSubAssignee(e.target.value as any)}
 className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white cursor-pointer">
 <option value="">ไม่ระบุ</option>
 <option value="Fan">Fan</option>
 <option value="Mod">Mod</option>
 </select>
 </div>
 <div>
 <label className="text-[10px] font-bold text-slate-400 block mb-1">วันเริ่ม</label>
 <input type="date" value={newSubStartDate} onChange={e => setNewSubStartDate(e.target.value)}
 className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white" />
 </div>
 <div>
 <label className="text-[10px] font-bold text-slate-400 block mb-1">กำหนดส่ง</label>
 <input type="date" value={newSubDueDate} onChange={e => setNewSubDueDate(e.target.value)}
 className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white" />
 </div>
 </div>
 <textarea value={newSubNotes} onChange={e => setNewSubNotes(e.target.value)}
 rows={2} placeholder="หมายเหตุ (ถ้ามี)..."
 className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none bg-white" />
 <button onClick={addSubtask}
 className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors cursor-pointer">
 <Plus className="w-3.5 h-3.5" /> เพิ่ม Subtask + แจ้ง Telegram
 </button>
 </div>
 </div>
 )}

 {/* OVERVIEW */}
 {activeTab === 'overview' && (
 <div className="p-6 space-y-5">

 {/* Details */}
 {task.details && (
 <div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">รายละเอียดงาน</p>
 <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-wrap">
 {task.details}
 </div>
 </div>
 )}

 {/* Financial info */}
 <div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ข้อมูลการเงิน</p>
 <div className="grid grid-cols-3 gap-3">
 {[
 { label: 'ราคาโปรเจค', value: task.price ? `฿${Number(task.price).toLocaleString()}` : '—', accent: 'text-slate-900' },
 { label: 'ต้นทุน', value: task.devCost ? `฿${Number(task.devCost).toLocaleString()}` : '—', accent: 'text-rose-600' },
 { label: 'รายได้สุทธิ', value: task.myIncome ? `฿${Number(task.myIncome).toLocaleString()}` : '—', accent: 'text-emerald-600' },
 ].map(f => (
 <div key={f.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</p>
 <p className={cn('text-xl font-black mt-1', f.accent)}>{f.value}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Dates */}
 <div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">วันที่</p>
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">วันเริ่ม</p>
 <p className="text-sm font-bold text-slate-700 mt-1">{task.startDate || '—'}</p>
 </div>
 <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">วันกำหนดส่ง</p>
 <p className={cn('text-sm font-bold mt-1',
 deadline === 'overdue' ? 'text-rose-600' :
 deadline === 'urgent' ? 'text-orange-600' : 'text-slate-700')}>
 {task.endDate || '—'}
 </p>
 </div>
 </div>
 </div>

 {/* Tags */}
 {task.tags && (
 <div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tags</p>
 <div className="flex flex-wrap gap-1.5">
 {task.tags.split(',').map(tag => (
 <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
 {tag.trim()}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Client info */}
 {client && (
 <div>
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ลูกค้า</p>
 <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
 <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
 style={{ backgroundColor: client.color || '#6366f1' }}>
 {client.name[0]}
 </div>
 <div>
 <p className="text-sm font-bold text-slate-800">{client.name}</p>
 {client.email && <p className="text-xs text-slate-400">{client.email}</p>}
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* NOTES */}
 {activeTab === 'notes' && (
 <div className="p-6 space-y-3">
 <div className="flex gap-2">
 <textarea
 value={newComment}
 onChange={e => setNewComment(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
 placeholder="เพิ่มบันทึก... (Enter เพื่อบันทึก, Shift+Enter ขึ้นบรรทัดใหม่)"
 rows={3}
 className="flex-1 text-sm border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
 />
 <button onClick={addComment} className="px-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-700 transition-colors cursor-pointer">
 <Plus className="w-4 h-4" />
 </button>
 </div>
 {comments.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
 <MessageSquare className="w-8 h-8 text-slate-300" />
 <p className="text-xs font-semibold">ยังไม่มีบันทึก</p>
 </div>
 ) : (
 <div className="space-y-2">
 {[...comments].reverse().map(c => (
 <div key={c.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
 <div className="flex items-start justify-between gap-2">
 <p className="text-sm text-slate-700 leading-relaxed flex-1 whitespace-pre-wrap">{c.text}</p>
 <button onClick={() => deleteComment(c.id)} className="text-slate-300 hover:text-rose-400 transition-colors cursor-pointer shrink-0">
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 <p className="text-[10px] text-slate-400 mt-2 font-semibold">
 {new Date(c.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* FILES */}
 {activeTab === 'files' && (
 <div className="p-6 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Upload File Panel */}
 <label className={cn(
 "flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all group shrink-0",
 isUploading ? "border-indigo-300 pointer-events-none cursor-not-allowed" : "border-slate-200 hover:border-indigo-400 cursor-pointer"
 )}>
 <div className="flex flex-col items-center gap-1.5 text-center">
 {isUploading ? (
 <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
 ) : (
 <Paperclip className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
 )}
 <span className="text-xs font-bold text-slate-600">
 {isUploading ? 'กำลังอัปโหลดไฟล์ขึ้นระบบ...' : 'คลิกเพื่อเลือกไฟล์อัปโหลด'}
 </span>
 <span className="text-[10px] text-slate-400 font-medium">รองรับ PDF, เอกสาร, รูปภาพ (สูงสุด 50MB)</span>
 </div>
 <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
 </label>

 {/* Add Link Panel */}
 <div className="flex flex-col justify-between p-5 border border-slate-100 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
 <div className="flex items-center gap-1.5 mb-2 shrink-0">
 <Link2 className="w-4 h-4 text-indigo-500" />
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">หรือใส่ลิงก์เว็บภายนอก</span>
 </div>
 <div className="flex gap-2">
 <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="ชื่อลิงก์ (optional)"
 className="w-32 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400" />
 <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="URL ลิงก์..."
 onKeyDown={e => e.key === 'Enter' && addLink()}
 className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400" />
 <button onClick={addLink} className="px-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shrink-0">
 <Plus className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>

 {isUploading && (
 <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-pulse shrink-0">
 <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-indigo-700">กำลังอัปโหลดไฟล์จริงขึ้นคลาวด์ Storage...</p>
 <p className="text-[10px] text-indigo-500/80 font-medium">กรุณาปล่อยหน้าต่างนี้เปิดไว้จนกว่าจะเสร็จสิ้น</p>
 </div>
 </div>
 )}

 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 shrink-0">
 รายการไฟล์และลิงก์แนบ ({attachments.length})
 </p>

 {attachments.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2 border border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
 <Paperclip className="w-8 h-8 text-slate-300 animate-bounce duration-1000" />
 <p className="text-xs font-semibold">ยังไม่มีไฟล์หรือลิงก์ในโปรเจกต์นี้</p>
 </div>
 ) : (
 <div className="space-y-2">
 {attachments.map(a => {
 const isCloud = !!a.path;
 return (
 <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50/60 border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all group shadow-[0_2px_4px_rgba(0,0,0,0.005)]">
 <Paperclip className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors" />
 <div className="flex-1 min-w-0">
 <a href={a.url} target="_blank" rel="noreferrer"
 className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors truncate block flex items-center gap-1.5">
 {a.name}
 <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-all" />
 </a>
 <div className="flex items-center gap-2 mt-0.5 text-[9px] font-semibold text-slate-400">
 <span className={cn('px-1.5 py-0.5 rounded-md uppercase tracking-wider text-[8px] font-bold border', 
 isCloud ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50' : 'bg-slate-100 text-slate-500 border-slate-200/40')}>
 {isCloud ? 'Cloud File' : 'Link'}
 </span>
 {a.size && <span>• {a.size}</span>}
 </div>
 </div>
 <button onClick={() => deleteAttachment(a.id)} className="text-slate-300 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 transition-all cursor-pointer shrink-0">
 <X className="w-4 h-4" />
 </button>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* Payment */}
 {activeTab === 'payment' && (
 <div className="p-6 space-y-5">

 {/* Summary cards */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ราคางาน</p>
 <p className="text-lg font-black text-slate-800 tabular-nums">฿{totalPrice.toLocaleString()}</p>
 </div>
 <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
 <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">มอบให้ Dev</p>
 <p className="text-lg font-black text-rose-700 tabular-nums">฿{Number(task.devCost || 0).toLocaleString()}</p>
 </div>
 <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
 <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">กำไรของเรา</p>
 <p className="text-lg font-black text-indigo-700 tabular-nums">
 ฿{(task.myIncome !== undefined ? Number(task.myIncome) : totalPrice - Number(task.devCost || 0)).toLocaleString()}
 </p>
 </div>
 <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
 <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">รับแล้ว</p>
 <p className="text-lg font-black text-emerald-700 tabular-nums">฿{totalPaid.toLocaleString()}</p>
 </div>
 <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
 <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">ค้างชำระ</p>
 <p className="text-lg font-black text-orange-700 tabular-nums">฿{totalPending.toLocaleString()}</p>
 </div>
 </div>

 {/* Progress bar */}
 {phasesTotal > 0 && (
 <div>
 <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
 <span>ความคืบหน้าการรับชำระ</span>
 <span className="font-black text-emerald-600">{paidPct}%</span>
 </div>
 <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
 style={{ width: `${paidPct}%` }} />
 </div>
 {phasesTotal !== totalPrice && (
 <p className="text-[10px] text-orange-500 font-semibold mt-1">
 ยอดเฟสรวม ฿{phasesTotal.toLocaleString()} ≠ ราคางาน ฿{totalPrice.toLocaleString()}
 </p>
 )}
 </div>
 )}

 {/* Phase list */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เฟสการชำระเงิน ({phases.length})</p>
 </div>

 {phases.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
 <Banknote className="w-8 h-8" />
 <p className="text-xs font-semibold text-slate-400">ยังไม่มีเฟสการชำระเงิน</p>
 <p className="text-[11px] text-slate-300">เพิ่มมัดจำหรือแบ่งจ่ายด้านล่าง</p>
 </div>
 ) : (
 <div className="space-y-2">
 {phases.map((phase, idx) => (
 <div key={phase.id} className={cn(
 'flex items-center gap-3 p-3.5 rounded-2xl border transition-all',
 phase.paid
 ? 'bg-emerald-50/70 border-emerald-200'
 : 'bg-white border-slate-200 hover:border-slate-300'
 )}>
 {/* checkbox */}
 <button onClick={() => togglePhasePaid(phase.id)}
 className={cn(
 'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
 phase.paid ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'
 )}>
 {phase.paid && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
 </button>

 {/* label */}
 <div className="flex-1 min-w-0">
 <input
 value={phase.label}
 onChange={e => updatePhaseLabel(phase.id, e.target.value)}
 className={cn(
 'w-full text-sm font-semibold bg-transparent border-none outline-none',
 phase.paid ? 'text-emerald-800 line-through decoration-emerald-400' : 'text-slate-800'
 )}
 />
 {phase.paid && phase.paidAt && (
 <p className="text-[10px] text-emerald-500 font-medium">รับเงิน {phase.paidAt}</p>
 )}
 </div>

 {/* amount */}
 <div className="flex items-center gap-1 shrink-0">
 <span className="text-xs text-slate-400 font-semibold">฿</span>
 <input
 type="number"
 value={phase.amount}
 onChange={e => updatePhaseAmount(phase.id, e.target.value)}
 className={cn(
 'w-24 text-sm font-black text-right bg-transparent border-none outline-none tabular-nums',
 phase.paid ? 'text-emerald-700' : 'text-slate-800'
 )}
 />
 </div>

 {/* phase number badge */}
 <span className="text-[10px] font-bold text-slate-300 shrink-0 w-5 text-center">{idx + 1}</span>

 {/* delete */}
 <button onClick={() => deletePhase(phase.id)}
 className="text-slate-200 hover:text-rose-500 transition-colors cursor-pointer shrink-0">
 <X className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Add new phase */}
 <div className="border border-dashed border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/30">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+ เพิ่มเฟสใหม่</p>
 <div className="flex gap-2">
 <input
 value={newPhaseLabel}
 onChange={e => setNewPhaseLabel(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && addPhase()}
 placeholder="เช่น มัดจำ 30%, เฟส 1, ส่งงาน..."
 className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 bg-white"
 />
 <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 bg-white gap-1 w-36">
 <span className="text-xs text-slate-400 font-semibold shrink-0">฿</span>
 <input
 type="number"
 value={newPhaseAmount}
 onChange={e => setNewPhaseAmount(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && addPhase()}
 placeholder="จำนวนเงิน"
 className="w-full text-sm bg-transparent border-none outline-none tabular-nums"
 />
 </div>
 <button onClick={addPhase}
 className="px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-sm font-bold shrink-0">
 <Plus className="w-4 h-4" /> เพิ่ม
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {['มัดจำ 30%', 'เฟส 1', 'เฟส 2', 'ส่งงาน', 'ชำระส่วนที่เหลือ'].map(preset => (
 <button key={preset} onClick={() => setNewPhaseLabel(preset)}
 className="text-[11px] font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer">
 {preset}
 </button>
 ))}
 </div>
 </div>

 </div>
 )}

 {/* AI */}
 {activeTab === 'ai' && (
 <div className="p-6 space-y-5">

 {aiTabError && (
 <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
 <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {aiTabError}
 </div>
 )}

 {/* Quick action buttons */}
 <div className="grid grid-cols-3 gap-2">
 <button onClick={generateAnalysis} disabled={isGenAnalysis}
 className="flex flex-col items-center gap-1.5 p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-2xl transition-colors cursor-pointer disabled:opacity-60 group">
 {isGenAnalysis ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /> : <Sparkles className="w-5 h-5 text-indigo-600" />}
 <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">วิเคราะห์งาน</span>
 </button>
 <button onClick={generateEmail} disabled={isGenEmail}
 className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-colors cursor-pointer disabled:opacity-60">
 {isGenEmail ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <Mail className="w-5 h-5 text-blue-600" />}
 <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">ร่างอีเมล</span>
 </button>
 <button onClick={generateCourse} disabled={isGenCourse}
 className="flex flex-col items-center gap-1.5 p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl transition-colors cursor-pointer disabled:opacity-60">
 {isGenCourse ? <Loader2 className="w-5 h-5 text-purple-600 animate-spin" /> : <BookOpen className="w-5 h-5 text-purple-600" />}
 <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">แผนงาน</span>
 </button>
 </div>

 {/* Consult AI Agent button */}
 <button onClick={() => onConsultAgent(task.id.toString(), 'daily_briefer')}
 className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-bold text-sm rounded-2xl hover:bg-slate-700 transition-colors cursor-pointer">
 <Bot className="w-4 h-4" /> คุยกับ AI Agent (แชทอิสระ)
 </button>

 {/* AI Analysis result */}
 {(aiAnalysis || isGenAnalysis) && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5" /> ผลวิเคราะห์ AI
 </p>
 <div className="flex gap-1">
 <button onClick={() => copyToClipboard(aiAnalysis, 'analysis')} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1">
 {copiedKey === 'analysis' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 <button onClick={generateAnalysis} disabled={isGenAnalysis} className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer p-1">
 <RefreshCw className={cn('w-3.5 h-3.5', isGenAnalysis && 'animate-spin')} />
 </button>
 </div>
 </div>
 {isGenAnalysis ? (
 <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-2 text-xs text-indigo-600 font-semibold">
 <Loader2 className="w-4 h-4 animate-spin" /> AI กำลังวิเคราะห์...
 </div>
 ) : (
 <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
 {aiAnalysis}
 </div>
 )}
 </div>
 )}

 {/* AI Email result */}
 {(aiEmail || isGenEmail) && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
 <Mail className="w-3.5 h-3.5" /> ร่างอีเมล
 </p>
 <div className="flex gap-1">
 <button onClick={() => copyToClipboard(aiEmail, 'email')} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1">
 {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 <button onClick={generateEmail} disabled={isGenEmail} className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1">
 <RefreshCw className={cn('w-3.5 h-3.5', isGenEmail && 'animate-spin')} />
 </button>
 </div>
 </div>
 {isGenEmail ? (
 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-2 text-xs text-blue-600 font-semibold">
 <Loader2 className="w-4 h-4 animate-spin" /> AI กำลังร่างอีเมล...
 </div>
 ) : (
 <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
 {aiEmail}
 </div>
 )}
 </div>
 )}

 {/* AI Course/Plan result */}
 {(aiCourse || isGenCourse) && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
 <BookOpen className="w-3.5 h-3.5" /> แผนงาน / Roadmap
 </p>
 <div className="flex gap-1">
 <button onClick={() => copyToClipboard(aiCourse, 'course')} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1">
 {copiedKey === 'course' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 <button onClick={generateCourse} disabled={isGenCourse} className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer p-1">
 <RefreshCw className={cn('w-3.5 h-3.5', isGenCourse && 'animate-spin')} />
 </button>
 </div>
 </div>
 {isGenCourse ? (
 <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-2 text-xs text-purple-600 font-semibold">
 <Loader2 className="w-4 h-4 animate-spin" /> AI กำลังสร้างแผน...
 </div>
 ) : (
 <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
 {aiCourse}
 </div>
 )}
 </div>
 )}

 {/* Chat history */}
 {chatHistory.length > 0 && (
 <div className="space-y-2">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
 <MessageSquare className="w-3.5 h-3.5" /> ประวัติแชท AI ({chatHistory.length} ข้อความ)
 </p>
 <div className="space-y-2 max-h-72 overflow-y-auto hide-scrollbar bg-slate-50 border border-slate-100 rounded-2xl p-3">
 {chatHistory.map((c, i) => (
 <div key={i} className="text-xs">
 <div className="flex items-center justify-between mb-1 px-1">
 <span className="font-bold text-indigo-600">
 {c.sender === 'user' ? ' คุณ' : ` ${c.agentTitle}`}
 </span>
 <span className="text-slate-400 text-[9px]">
 {new Date(c.timestamp).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 <div className={cn(
 'rounded-xl px-3 py-2 text-slate-800 leading-relaxed whitespace-pre-wrap border',
 c.sender === 'user' ? 'bg-white border-slate-200' : 'bg-indigo-50 border-indigo-100'
 )} dangerouslySetInnerHTML={{ __html: c.text }} />
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Empty state */}
 {!aiAnalysis && !aiEmail && !aiCourse && chatHistory.length === 0 && !isGenAnalysis && !isGenEmail && !isGenCourse && (
 <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
 <Bot className="w-10 h-10 text-slate-200" />
 <p className="text-xs font-semibold text-center">กดปุ่มด้านบนเพื่อให้ AI ช่วยวิเคราะห์งาน<br />ร่างอีเมล หรือสร้างแผนงาน</p>
 </div>
 )}

 </div>
 )}

 {/* DEPENDENCIES */}
 {activeTab === 'dependencies' && (
 <div className="p-6">
 {depTasks.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
 <Link2 className="w-8 h-8 text-slate-300" />
 <p className="text-xs font-semibold">ไม่มีงานที่ต้องทำก่อน</p>
 <p className="text-[10px] text-slate-300">แก้ไขงานเพื่อเพิ่ม dependencies</p>
 </div>
 ) : (
 <div className="space-y-2">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
 ต้องทำก่อน ({depTasks.length} งาน)
 </p>
 {depTasks.map(dep => {
 const depStatus = dep.status === 'Done' || dep.status === 'เสร็จสิ้น';
 return (
 <div key={dep.id} className={cn('flex items-center gap-3 p-3 border rounded-2xl',
 depStatus ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100')}>
 {depStatus
 ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
 : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
 <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{dep.name}</span>
 <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full',
 depStatus ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600')}>
 {statusLabel(dep.status)}
 </span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 </div>
 </div>
 </div>
 );
}
