import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Download, Plus, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Client } from '../../types';

interface DocFlowViewProps {
  // kept for API compatibility with App.tsx
  onOpenSettings?: () => void;
  settingsVersion?: number;
  showNotification: (msg: string, isError?: boolean) => void;
  clients: Client[];
}

// ─── Translations ──────────────────────────────────────────────────────────
const DICT = {
  th: {
    ui_settings: 'ข้อมูลผู้ออกเอกสาร', ui_pdf: 'ดาวน์โหลด PDF', ui_add: '+ เพิ่มรายการ', ui_cancel: 'ยกเลิก', ui_save: 'บันทึกเป็นค่าเริ่มต้น',
    ui_modTitle: 'ข้อมูลมาตรฐานผู้ออกเอกสาร', ui_modBrand: 'ชื่อบริษัท / แบรนด์', ui_modName: 'ชื่อ-นามสกุล (ผู้ลงนาม)', ui_modRole: 'ตำแหน่ง', ui_modAddr: 'ที่อยู่', ui_modTax: 'เลขผู้เสียภาษี', ui_modContact: 'เบอร์โทร / อีเมล', ui_modBank: 'รายละเอียดการชำระเงิน',
    lbl_no: 'เลขที่:', lbl_date: 'วันที่:', lbl_meta3Q: 'กำหนดยืนราคา:', lbl_meta3I: 'ครบกำหนดชำระ:', lbl_days: 'วัน',
    lbl_cust: 'ลูกค้า:', lbl_addr: 'ที่อยู่:', lbl_tax: 'เลขประจำตัวผู้เสียภาษี:', lbl_contact: 'ผู้ติดต่อ:', lbl_phone: 'เบอร์โทรศัพท์:',
    th_no: '#', th_desc: 'รายละเอียด / Description', th_qty: 'จำนวน', th_price: 'ราคาต่อหน่วย', th_amt: 'ราคารวม',
    lbl_sub: 'ราคาก่อนภาษี', lbl_wht: 'หัก ณ ที่จ่าย', lbl_net_due: 'ยอดชำระสุทธิ', lbl_net_recv: 'ยอดรับชำระทั้งสิ้น', lbl_sigDate: 'วันที่:',
    lbl_remove_logo: 'นำโลโก้ออก', lbl_upload_logo: 'อัปโหลดโลโก้',
    docTitles: { quotation: 'ใบเสนอราคา', invoice: 'ใบแจ้งหนี้', receipt: 'ใบเสร็จรับเงิน' },
    docSubtitles: { quotation: '(QUOTATION)', invoice: '(INVOICE)', receipt: '(RECEIPT)' },
    tabLabels: { quotation: 'ใบเสนอราคา', invoice: 'ใบแจ้งหนี้', receipt: 'ใบเสร็จรับเงิน' },
    termsTitles: { quotation: 'เงื่อนไขการชำระเงิน:', invoice: 'เงื่อนไขการชำระเงิน:', receipt: 'หมายเหตุ:' },
    bankTitles: { quotation: 'รายละเอียดการชำระเงิน:', invoice: 'รายละเอียดการชำระเงิน:', receipt: 'รายละเอียดการรับเงิน:' },
    sigL_head: { quotation: 'การยืนยันอนุมัติ', invoice: 'ผู้รับใบแจ้งหนี้', receipt: 'ผู้จ่ายเงิน' },
    sigL_desc: { quotation: 'ข้าพเจ้าได้รับทราบและตกลงยอมรับเงื่อนไข', invoice: '', receipt: '' },
    sigR_head: { quotation: 'ผู้ออกใบเสนอราคา', invoice: 'ผู้ออกใบแจ้งหนี้', receipt: 'ผู้รับเงิน' },
    defaultTerms: {
      quotation: 'ชำระเงินเต็มจำนวนภายใน 30 วันหลังจากโพสต์งานเสร็จสิ้น',
      invoice: 'กรุณาชำระเงินภายในวันที่ครบกำหนดตามที่ระบุข้างต้น',
      receipt: 'ได้รับชำระเงินเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ'
    },
  },
  en: {
    ui_settings: 'Issuer Info', ui_pdf: 'Download PDF', ui_add: '+ Add Item', ui_cancel: 'Cancel', ui_save: 'Save Default',
    ui_modTitle: 'Standard Issuer Information', ui_modBrand: 'Company / Brand', ui_modName: 'Full Name (Signatory)', ui_modRole: 'Role / Position', ui_modAddr: 'Address', ui_modTax: 'Tax ID', ui_modContact: 'Phone / Email', ui_modBank: 'Payment Details',
    lbl_no: 'No.:', lbl_date: 'Date:', lbl_meta3Q: 'Validity:', lbl_meta3I: 'Due Date:', lbl_days: 'days',
    lbl_cust: 'Customer:', lbl_addr: 'Address:', lbl_tax: 'Tax ID:', lbl_contact: 'Contact Person:', lbl_phone: 'Phone:',
    th_no: 'No.', th_desc: 'Description', th_qty: 'Qty', th_price: 'Unit Price', th_amt: 'Amount',
    lbl_sub: 'Subtotal', lbl_wht: 'Withholding Tax', lbl_net_due: 'Net Total Due', lbl_net_recv: 'Total Received', lbl_sigDate: 'Date:',
    lbl_remove_logo: 'Remove Logo', lbl_upload_logo: 'Upload Logo',
    docTitles: { quotation: 'QUOTATION', invoice: 'INVOICE', receipt: 'RECEIPT' },
    docSubtitles: { quotation: '(ใบเสนอราคา)', invoice: '(ใบแจ้งหนี้)', receipt: '(ใบเสร็จรับเงิน)' },
    tabLabels: { quotation: 'Quotation', invoice: 'Invoice', receipt: 'Receipt' },
    termsTitles: { quotation: 'Payment Terms:', invoice: 'Payment Terms:', receipt: 'Note:' },
    bankTitles: { quotation: 'Bank / Payment Details:', invoice: 'Bank / Payment Details:', receipt: 'Payment Received Via:' },
    sigL_head: { quotation: 'Confirmation', invoice: 'Invoice Recipient', receipt: 'Payer' },
    sigL_desc: { quotation: 'I acknowledge and accept these terms.', invoice: '', receipt: '' },
    sigR_head: { quotation: 'Issued By', invoice: 'Issued By', receipt: 'Received By' },
    defaultTerms: {
      quotation: 'Full payment due within 30 days after work completion.',
      invoice: 'Please settle payment by the due date stated above.',
      receipt: 'Payment received in full. Thank you for your business.'
    },
  },
} as const;

type Lang = 'th' | 'en';
type DocType = 'quotation' | 'invoice' | 'receipt';

interface IssuerConfig { brand: string; name: string; role: string; address: string; taxId: string; contact: string; bankInfo: string; }
interface ItemRow { id: number; desc: string; qty: number; price: number; }

const DEFAULT_ISSUER: Record<Lang, IssuerConfig> = {
  th: {
    brand: 'MODTY.AI', name: 'ศศิวรรณ จันทร์แดง', role: 'ผู้จัดการ',
    address: '5/4 หมู่ 6 ตำบลเขาวง อำเภอพระพุทธบาท จังหวัดสระบุรี 18120',
    taxId: 'เลขประจำตัวผู้เสียภาษี: 1199600115041',
    contact: 'โทร: +66-99102-9991 | Email: modty.project@yahoo.com',
    bankInfo: 'ชำระเงินผ่านบัญชีธนาคาร\nธนาคารกสิกรไทย สาขาโรบินสันสระบุรี\nเลขบัญชี: 160-2-46775-5',
  },
  en: {
    brand: 'MODTY.AI', name: 'Siwan Jandang', role: 'Manager',
    address: '5/4 Moo 6, Khao Wong, Phra Phutthabat, Saraburi 18120',
    taxId: 'Tax ID: 1199600115041',
    contact: 'Tel: +66-99102-9991 | Email: modty.project@yahoo.com',
    bankInfo: 'Bank Transfer\nKasikornbank (Robinson Saraburi Branch)\nAccount No.: 160-2-46775-5',
  },
};

function lsGet<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

const FONTS = [
  { label: 'Prompt (ทันสมัย)', value: "'Prompt', sans-serif" },
  { label: 'Sarabun (ทางการ)', value: "'Sarabun', sans-serif" },
  { label: 'Kanit (เรียบร้อย)', value: "'Kanit', sans-serif" },
  { label: 'Noto Sans Thai', value: "'Noto Sans Thai', sans-serif" },
];

// Auto-expanding textarea helper
function AutoTextarea({ value, onChange, placeholder, style, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px'; }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={{ resize: 'none', overflow: 'hidden', ...style }}
      className={className}
    />
  );
}

// ─── Inline paper input styles ──────────────────────────────────────────────
const fieldCls = "bg-transparent border border-dashed border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-blue-50 outline-none rounded px-1 py-0.5 w-full transition-colors duration-150 focus:border-solid";

export function DocFlowView({ showNotification, clients }: DocFlowViewProps) {
  const [lang, setLangState] = useState<Lang>(() => lsGet('df_lang', 'th'));
  const [docType, setDocTypeState] = useState<DocType>('quotation');
  const [font, setFont] = useState<string>(() => lsGet('df_font', "'Prompt', sans-serif"));
  const [logoUrl, setLogoUrl] = useState<string>(() => lsGet('df_logo', ''));
  const [issuerCfg, setIssuerCfg] = useState<Record<Lang, IssuerConfig>>(() => lsGet('df_issuer', DEFAULT_ISSUER));
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Paper fields – live state
  const [docNo, setDocNo] = useState('QT26-001');
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [meta3, setMeta3] = useState('30');
  const [issuerName, setIssuerName] = useState('');
  const [issuerAddr, setIssuerAddr] = useState('');
  const [issuerTax, setIssuerTax] = useState('');
  const [issuerContact, setIssuerContact] = useState('');
  const [custName, setCustName] = useState('');
  const [custAddr, setCustAddr] = useState('');
  const [custTax, setCustTax] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [termsDesc, setTermsDesc] = useState('');
  const [bankDesc, setBankDesc] = useState('');
  const [sigLName, setSigLName] = useState('');
  const [sigLRole, setSigLRole] = useState('');
  const [sigLDate, setSigLDate] = useState('');
  const [sigRName, setSigRName] = useState('');
  const [sigRRole, setSigRRole] = useState('');
  const [sigRDate, setSigRDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<ItemRow[]>([{ id: 1, desc: 'รายละเอียดสินค้า / บริการ', qty: 1, price: 0 }]);
  const [whPct, setWhPct] = useState(3);

  // Settings modal state
  const [setForm, setSetForm] = useState<IssuerConfig>(issuerCfg[lang]);

  const paperRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const d = DICT[lang];

  // Apply issuer defaults to paper when lang or docType changes
  const applyIssuer = useCallback((l: Lang, cfg: Record<Lang, IssuerConfig>) => {
    const c = cfg[l];
    setIssuerName(`${c.brand} (${c.name})`);
    setIssuerAddr(c.address);
    setIssuerTax(c.taxId);
    setIssuerContact(c.contact);
    setBankDesc(c.bankInfo);
    setSigRName(c.name);
    setSigRRole(c.role);
  }, []);

  const applyDocType = useCallback((l: Lang, dt: DocType) => {
    const dd = DICT[l];
    setTermsDesc(dd.defaultTerms[dt]);
    setSigRDate(docDate);
  }, [docDate]);

  useEffect(() => {
    applyIssuer(lang, issuerCfg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    applyDocType(lang, docType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, docType]);

  // Load font CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&family=Noto+Sans+Thai:wght@300;400;500;700&family=Prompt:wght@300;400;500;700&family=Sarabun:wght@300;400;500;700&display=swap';
    document.head.appendChild(link);
  }, []);

  const changeLang = (l: Lang) => {
    setLangState(l);
    lsSet('df_lang', l);
  };

  const changeDocType = (dt: DocType) => {
    setDocTypeState(dt);
  };

  const changeFont = (f: string) => {
    setFont(f);
    lsSet('df_font', f);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      setLogoUrl(url);
      lsSet('df_logo', url);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => { setLogoUrl(''); lsSet('df_logo', ''); };

  // Items
  const addItem = () => setItems(prev => [...prev, { id: Date.now(), desc: '', qty: 1, price: 0 }]);
  const removeItem = (id: number) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  const updateItem = (id: number, field: keyof ItemRow, val: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: field === 'desc' ? val : (parseFloat(val) || 0) } : i));
  };

  // Calc
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const wht = subtotal * (whPct / 100);
  const net = subtotal - wht;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Settings modal
  const openSettings = () => { setSetForm({ ...issuerCfg[lang] }); setShowSettings(true); };
  const saveSettings = () => {
    const updated = { ...issuerCfg, [lang]: setForm };
    setIssuerCfg(updated);
    lsSet('df_issuer', updated);
    applyIssuer(lang, updated);
    setShowSettings(false);
    showNotification('บันทึกข้อมูลเรียบร้อยแล้ว ✓');
  };

  // PDF export
  const handleExportPdf = async () => {
    if (!paperRef.current) return;
    setExporting(true);
    showNotification(lang === 'th' ? 'กำลังสร้างไฟล์ PDF...' : 'Generating PDF...');
    try {
      // รอให้ font โหลดครบก่อน
      await document.fonts.ready;

      const paper = paperRef.current;

      // แทน input/textarea/select ด้วย div ชั่วคราว เพื่อให้ html2canvas capture ค่าได้ถูกต้อง
      const replacements: { original: HTMLElement; fake: HTMLElement }[] = [];
      paper.querySelectorAll<HTMLElement>('input, textarea, select').forEach(el => {
        if ((el as HTMLInputElement).type === 'file') return;

        const isMulti = el.tagName === 'TEXTAREA';
        const fake = document.createElement(isMulti ? 'div' : 'span');
        const st = window.getComputedStyle(el);

        fake.style.cssText = `
          font-family:${st.fontFamily}; font-size:${st.fontSize}; font-weight:${st.fontWeight};
          color:${st.color}; text-align:${st.textAlign}; width:${st.width};
          padding:${st.padding}; margin:${st.margin}; box-sizing:${st.boxSizing};
          display:${isMulti ? 'block' : 'inline-block'};
          ${isMulti ? `white-space:pre-wrap; word-break:break-word; line-height:${st.lineHeight};` : ''}
        `;

        let val = (el as HTMLInputElement).value ?? '';
        if (el.tagName === 'SELECT') {
          val = (el as HTMLSelectElement).options[(el as HTMLSelectElement).selectedIndex]?.text ?? '';
        } else if ((el as HTMLInputElement).type === 'date' && val) {
          const [y, m, d] = val.split('-');
          val = `${d}/${m}/${y}`;
        }
        fake.innerText = val;

        el.style.display = 'none';
        el.parentNode?.insertBefore(fake, el.nextSibling);
        replacements.push({ original: el, fake });
      });

      // ซ่อน UI element ที่ไม่ต้องการในเอกสาร
      const hiddenEls: { el: HTMLElement; prev: string }[] = [];
      paper.querySelectorAll<HTMLElement>('[data-no-print]').forEach(el => {
        hiddenEls.push({ el, prev: el.style.display });
        el.style.display = 'none';
      });

      const prevStyle = { width: paper.style.width, maxWidth: paper.style.maxWidth, boxShadow: paper.style.boxShadow };
      paper.style.width = '794px';
      paper.style.maxWidth = '794px';
      paper.style.boxShadow = 'none';

      const canvas = await html2canvas(paper, {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: 0,
        windowWidth: 840,
        onclone: (clonedDoc) => {
          // ให้ font ใน clone document โหลดด้วย
          const link = clonedDoc.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;700&family=Sarabun:wght@300;400;500;700&family=Kanit:wght@300;400;500;700&family=Noto+Sans+Thai:wght@300;400;500;700&display=swap';
          clonedDoc.head.appendChild(link);
        },
      });

      // คืนค่าทุกอย่าง
      paper.style.width = prevStyle.width;
      paper.style.maxWidth = prevStyle.maxWidth;
      paper.style.boxShadow = prevStyle.boxShadow;
      replacements.forEach(({ original, fake }) => { fake.remove(); original.style.display = ''; });
      hiddenEls.forEach(({ el, prev }) => { el.style.display = prev; });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = (canvas.height * pw) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pw, ph);
      pdf.save(`${DICT[lang].docTitles[docType]}_${docNo}.pdf`);
      showNotification(lang === 'th' ? 'ดาวน์โหลด PDF สำเร็จ' : 'PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      showNotification(lang === 'th' ? 'เกิดข้อผิดพลาดในการสร้าง PDF' : 'PDF generation failed', true);
    }
    setExporting(false);
  };

  // Dynamic meta3 label
  const meta3IsDate = docType === 'invoice';

  const paperStyle: React.CSSProperties = {
    fontFamily: font,
    background: '#fff',
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm 16mm',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#111',
    position: 'relative',
  };

  const inputInPaper: React.CSSProperties = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    color: 'inherit',
    background: 'transparent',
    border: '1px dashed transparent',
    outline: 'none',
    borderRadius: '3px',
    padding: '2px 4px',
    transition: 'border-color 0.15s, background 0.15s',
    width: '100%',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-200">
      {/* ─── Toolbar ──────────────────────────────── */}
      <div className="sticky top-0 z-40 shadow-md">
        {/* Top row */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex flex-wrap gap-3 items-center justify-between">
          {/* Doc Type Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['quotation', 'invoice', 'receipt'] as DocType[]).map(dt => (
              <button
                key={dt}
                onClick={() => changeDocType(dt)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${docType === dt ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {d.tabLabels[dt]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={openSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
            >
              <Settings className="w-4 h-4" /> {d.ui_settings}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> {exporting ? '...' : d.ui_pdf}
            </button>
          </div>
        </div>
        {/* Sub row */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-2 flex flex-wrap gap-4 items-center text-xs text-gray-500">
          {/* Lang toggle */}
          <div className="flex items-center gap-2">
            <span>ภาษา:</span>
            <div className="flex bg-gray-200 p-0.5 rounded">
              {(['th', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => changeLang(l)} className={`px-3 py-0.5 rounded text-xs font-bold transition ${lang === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          {/* Font */}
          <div className="flex items-center gap-2">
            <span>ฟอนต์:</span>
            <select value={font} onChange={e => changeFont(e.target.value)} className="border border-gray-200 rounded px-2 py-0.5 text-xs bg-white cursor-pointer">
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          {/* Logo */}
          <div className="flex items-center gap-2 ml-auto">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button onClick={() => logoInputRef.current?.click()} className="px-2 py-0.5 border border-gray-300 bg-white rounded text-xs hover:bg-gray-50 transition">{d.lbl_upload_logo}</button>
            {logoUrl && <button onClick={removeLogo} className="px-2 py-0.5 border border-gray-300 bg-white rounded text-xs hover:bg-red-50 hover:text-red-600 transition">{d.lbl_remove_logo}</button>}
          </div>
        </div>
      </div>

      {/* ─── Paper ────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6 lg:p-10 flex justify-center items-start">
        <div ref={paperRef} style={paperStyle}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid #d4d4d4', paddingBottom: '16px', gap: '20px' }}>
            <div style={{ width: '180px', minHeight: '60px', display: 'flex', alignItems: 'flex-start' }}>
              {logoUrl
                ? <img src={logoUrl} alt="logo" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} crossOrigin="anonymous" />
                : <div style={{ width: '56px', height: '56px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '22px' }}>M</div>
              }
            </div>
            <div style={{ textAlign: 'right', width: '260px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb', fontFamily: font }}>
                <input value={d.docTitles[docType]} readOnly style={{ ...inputInPaper, textAlign: 'right', fontWeight: 700, fontSize: '22px', color: '#2563eb' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#666', letterSpacing: '1px' }}>
                <input value={d.docSubtitles[docType]} readOnly style={{ ...inputInPaper, textAlign: 'right', fontWeight: 600, color: '#666' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 8px', alignItems: 'center', justifyContent: 'end', fontSize: '12px', marginTop: '8px' }}>
                <label style={{ fontWeight: 600, color: '#555', textAlign: 'right', whiteSpace: 'nowrap' }}>{d.lbl_no}</label>
                <input value={docNo} onChange={e => setDocNo(e.target.value)} style={{ ...inputInPaper, width: '120px', textAlign: 'right' }} className={fieldCls} placeholder="INV-2025-001" />
                <label style={{ fontWeight: 600, color: '#555', textAlign: 'right', whiteSpace: 'nowrap' }}>{d.lbl_date}</label>
                <input type="date" value={docDate} onChange={e => { setDocDate(e.target.value); setSigRDate(e.target.value); }} style={{ ...inputInPaper, width: '120px', textAlign: 'right' }} className={fieldCls} />
                {docType !== 'receipt' && <>
                  <label style={{ fontWeight: 600, color: '#555', textAlign: 'right', whiteSpace: 'nowrap' }}>{meta3IsDate ? d.lbl_meta3I : d.lbl_meta3Q}</label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {meta3IsDate
                      ? <input type="date" value={meta3} onChange={e => setMeta3(e.target.value)} style={{ ...inputInPaper, width: '120px', textAlign: 'right' }} className={fieldCls} />
                      : <><input type="number" value={meta3} onChange={e => setMeta3(e.target.value)} style={{ ...inputInPaper, width: '40px', textAlign: 'right' }} className={fieldCls} /><span style={{ color: '#555', fontSize: '12px' }}>{d.lbl_days}</span></>
                    }
                  </div>
                </>}
              </div>
            </div>
          </div>

          {/* Issuer */}
          <div style={{ marginBottom: '20px' }}>
            <input value={issuerName} onChange={e => setIssuerName(e.target.value)} style={{ ...inputInPaper, fontWeight: 700, fontSize: '14px' }} className={fieldCls} placeholder="ชื่อบริษัท / ผู้ออกเอกสาร" />
            <AutoTextarea value={issuerAddr} onChange={setIssuerAddr} placeholder="ที่อยู่" style={{ ...inputInPaper, display: 'block' }} className={`${fieldCls} mt-0.5`} />
            <input value={issuerTax} onChange={e => setIssuerTax(e.target.value)} style={{ ...inputInPaper, fontSize: '12px', color: '#444' }} className={`${fieldCls} mt-0.5`} placeholder="เลขประจำตัวผู้เสียภาษี" />
            <input value={issuerContact} onChange={e => setIssuerContact(e.target.value)} style={{ ...inputInPaper, fontSize: '12px', color: '#444' }} className={`${fieldCls} mt-0.5`} placeholder="เบอร์โทร / อีเมล" />
          </div>

          {/* Customer */}
          <div style={{ border: '1px solid #d4d4d4', borderRadius: '6px', padding: '10px 14px', marginBottom: '20px', background: '#fafafa' }}>
            {([
              [d.lbl_cust, custName, setCustName, 'ระบุชื่อบริษัท หรือ ชื่อลูกค้า'],
              [d.lbl_addr, custAddr, setCustAddr, 'ระบุที่อยู่'],
              [d.lbl_tax, custTax, setCustTax, 'เลขประจำตัวผู้เสียภาษี'],
              [d.lbl_contact, custContact, setCustContact, 'ชื่อผู้ติดต่อ'],
              [d.lbl_phone, custPhone, setCustPhone, 'เบอร์โทร'],
            ] as [string, string, (v: string) => void, string][]).map(([label, val, setter, ph]) => (
              <div key={label} style={{ display: 'flex', gap: '8px', marginBottom: '2px', alignItems: 'baseline' }}>
                <span style={{ flexShrink: 0, width: '120px', fontWeight: 600, fontSize: '12px', color: '#333' }}>{label}</span>
                {label === d.lbl_addr
                  ? <AutoTextarea value={val} onChange={setter} placeholder={ph} style={{ ...inputInPaper, flex: 1 }} className={fieldCls} />
                  : <input value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={{ ...inputInPaper, flex: 1 }} className={fieldCls} />
                }
              </div>
            ))}
            {/* Client quick-select */}
            {clients.length > 0 && (
              <div data-no-print style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#888' }}>เลือกลูกค้า:</span>
                <select
                  onChange={e => {
                    const c = clients.find(cl => cl.id === e.target.value);
                    if (c) { setCustName(c.name); setCustAddr(c.address); setCustTax(c.taxId); }
                  }}
                  style={{ fontSize: '11px', border: '1px solid #ddd', borderRadius: '4px', padding: '2px 6px', background: '#fff' }}
                  defaultValue=""
                >
                  <option value="" disabled>เลือกจากฐานข้อมูล...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                {[d.th_no, d.th_desc, d.th_qty, d.th_price, d.th_amt].map((h, i) => (
                  <th key={i} style={{
                    border: '1px solid #d4d4d4', padding: '8px', fontWeight: 600, color: '#444',
                    textAlign: i === 0 ? 'center' : i === 1 ? 'left' : i === 2 ? 'center' : 'right',
                    width: i === 0 ? '5%' : i === 1 ? '45%' : i === 2 ? '10%' : '17%',
                  }}>{h}</th>
                ))}
                <th style={{ border: '1px solid #d4d4d4', padding: '4px', width: '4%' }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #d4d4d4', padding: '6px', textAlign: 'center', verticalAlign: 'top' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #d4d4d4', padding: '4px', verticalAlign: 'top' }}>
                    <AutoTextarea value={item.desc} onChange={v => updateItem(item.id, 'desc', v)} placeholder="รายละเอียดสินค้า / บริการ" style={{ ...inputInPaper }} className={fieldCls} />
                  </td>
                  <td style={{ border: '1px solid #d4d4d4', padding: '4px', verticalAlign: 'top' }}>
                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ ...inputInPaper, textAlign: 'center' }} className={fieldCls} min="0" step="1" />
                  </td>
                  <td style={{ border: '1px solid #d4d4d4', padding: '4px', verticalAlign: 'top' }}>
                    <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ ...inputInPaper, textAlign: 'right' }} className={fieldCls} min="0" step="0.01" />
                  </td>
                  <td style={{ border: '1px solid #d4d4d4', padding: '6px', textAlign: 'right', verticalAlign: 'top', fontWeight: 500 }}>
                    {fmt(item.qty * item.price)}
                  </td>
                  <td data-no-print style={{ border: '1px solid #d4d4d4', padding: '2px', textAlign: 'center', verticalAlign: 'top' }}>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: '4px', borderRadius: '4px' }} className="hover:!text-red-500 hover:!bg-red-50">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            data-no-print
            onClick={addItem}
            style={{ display: 'block', width: '100%', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginBottom: '24px', fontFamily: font }}
            className="hover:bg-slate-100 transition"
          >
            <Plus className="w-3.5 h-3.5 inline-block mr-1" />{d.ui_add.replace('+ ', '')}
          </button>

          {/* Bottom: Terms + Summary */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', alignItems: 'flex-start' }}>
            {/* Terms / Bank */}
            <div style={{ flex: 1.5 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb', marginBottom: '4px' }}>
                {d.termsTitles[docType]}
              </div>
              <AutoTextarea value={termsDesc} onChange={setTermsDesc} placeholder="ระบุเงื่อนไขการชำระเงิน หรือหมายเหตุ" style={{ ...inputInPaper, marginBottom: '12px' }} className={`${fieldCls} text-xs`} />
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb', marginBottom: '4px' }}>{d.bankTitles[docType]}</div>
                <AutoTextarea value={bankDesc} onChange={setBankDesc} placeholder="รายละเอียดธนาคาร" style={{ ...inputInPaper, fontSize: '12px' }} className={`${fieldCls} text-xs`} />
              </div>
            </div>

            {/* Summary */}
            <div style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #d4d4d4', padding: '6px 8px', color: '#444', fontWeight: 500 }}>{d.lbl_sub}</td>
                    <td style={{ border: '1px solid #d4d4d4', padding: '6px 8px', textAlign: 'right', fontWeight: 500 }}>{fmt(subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #d4d4d4', padding: '6px 8px', color: '#444', fontWeight: 500 }}>
                      <span>{d.lbl_wht}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: '#fff', padding: '0 4px', border: '1px solid #ddd', borderRadius: '3px', marginLeft: '8px' }}>
                        <input type="number" value={whPct} onChange={e => setWhPct(parseFloat(e.target.value) || 0)} min={0} step={0.5} style={{ width: '30px', textAlign: 'center', border: 'none', outline: 'none', fontSize: '11px', fontFamily: font }} />%
                      </span>
                    </td>
                    <td style={{ border: '1px solid #d4d4d4', padding: '6px 8px', textAlign: 'right', fontWeight: 500 }}>{fmt(wht)}</td>
                  </tr>
                  <tr style={{ background: '#e5e7eb' }}>
                    <td style={{ border: '1px solid #d4d4d4', padding: '6px 8px', fontWeight: 700, fontSize: '14px' }}>
                      {docType === 'receipt' ? d.lbl_net_recv : d.lbl_net_due}
                    </td>
                    <td style={{ border: '1px solid #d4d4d4', padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>{fmt(net)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', marginTop: '20px', borderTop: '1px solid #d4d4d4', paddingTop: '16px' }}>
            {/* Left sig */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                <input value={d.sigL_head[docType]} readOnly style={{ ...inputInPaper, textAlign: 'center', fontWeight: 700 }} className={fieldCls} />
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '32px', minHeight: '16px' }}>
                <input value={d.sigL_desc[docType]} readOnly style={{ ...inputInPaper, fontSize: '11px', color: '#666', textAlign: 'center' }} className={fieldCls} />
              </div>
              <div style={{ borderTop: '1px solid #333', paddingTop: '8px', display: 'inline-flex', width: '80%', justifyContent: 'center', gap: '4px', margin: '0 auto' }}>
                <span>(</span>
                <input value={sigLName} onChange={e => setSigLName(e.target.value)} style={{ ...inputInPaper, textAlign: 'center', width: '100px' }} className={fieldCls} placeholder="ชื่อ" />
                <span>)</span>
              </div>
              <div style={{ marginTop: '2px' }}>
                <input value={sigLRole} onChange={e => setSigLRole(e.target.value)} style={{ ...inputInPaper, fontSize: '11px', color: '#666', textAlign: 'center', width: '100px', margin: '0 auto' }} className={fieldCls} placeholder="ตำแหน่ง" />
              </div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#555', display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                <span>{d.lbl_sigDate}</span>
                <input value={sigLDate} onChange={e => setSigLDate(e.target.value)} style={{ ...inputInPaper, width: '80px', textAlign: 'center' }} className={fieldCls} placeholder="____/____/____" />
              </div>
            </div>

            {/* Right sig */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                <input value={d.sigR_head[docType]} readOnly style={{ ...inputInPaper, textAlign: 'center', fontWeight: 700 }} className={fieldCls} />
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '32px', minHeight: '16px' }}>
                <input value="" readOnly style={{ ...inputInPaper, fontSize: '11px', color: '#666', textAlign: 'center' }} className={fieldCls} />
              </div>
              <div style={{ borderTop: '1px solid #333', paddingTop: '8px', display: 'inline-flex', width: '80%', justifyContent: 'center', gap: '4px', margin: '0 auto' }}>
                <span>(</span>
                <input value={sigRName} onChange={e => setSigRName(e.target.value)} style={{ ...inputInPaper, textAlign: 'center', width: '120px' }} className={fieldCls} placeholder="ชื่อ" />
                <span>)</span>
              </div>
              <div style={{ marginTop: '2px' }}>
                <input value={sigRRole} onChange={e => setSigRRole(e.target.value)} style={{ ...inputInPaper, fontSize: '11px', color: '#666', textAlign: 'center', width: '120px', margin: '0 auto' }} className={fieldCls} placeholder="ตำแหน่ง" />
              </div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#555', display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                <span>{d.lbl_sigDate}</span>
                <input type="date" value={sigRDate} onChange={e => setSigRDate(e.target.value)} style={{ ...inputInPaper, width: '110px', textAlign: 'center' }} className={fieldCls} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Settings Modal ─────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl sticky top-0">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                {d.ui_modTitle}
                <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">{lang.toUpperCase()}</span>
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 text-sm space-y-3">
              {([
                ['brand', d.ui_modBrand],
                ['name', d.ui_modName],
                ['role', d.ui_modRole],
                ['taxId', d.ui_modTax],
                ['contact', d.ui_modContact],
              ] as [keyof IssuerConfig, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">{label}</label>
                  <input
                    value={setForm[key]}
                    onChange={e => setSetForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">{d.ui_modAddr}</label>
                <textarea value={setForm.address} onChange={e => setSetForm(p => ({ ...p, address: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">{d.ui_modBank}</label>
                <textarea value={setForm.bankInfo} onChange={e => setSetForm(p => ({ ...p, bankInfo: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-2xl border-t border-gray-100 sticky bottom-0">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg text-sm font-semibold transition">{d.ui_cancel}</button>
              <button onClick={saveSettings} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold transition">{d.ui_save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Trash icon for items (global style fix) */}
      <style>{`
        .paper-remove-btn:hover { color: #ef4444 !important; background: #fee2e2 !important; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
}
