import { Task, Client, ContentPlan, IssuedDocument, BatonHandoff, BatonAgentId } from '../types';
import { 
  BrainCircuit, DollarSign, Clock, ShieldCheck, Sparkles, 
  Share2, CheckCircle2, ArrowRight 
} from 'lucide-react';

export interface AgentProfile {
  id: BatonAgentId;
  name: string;
  role: string;
  icon: any;
  color: string;
  bgGradient: string;
  avatarText: string;
}

export const AGENT_PROFILES: Record<BatonAgentId, AgentProfile> = {
  chief_of_staff: {
    id: 'chief_of_staff',
    name: 'Chief of Staff AI',
    role: 'ผู้ช่วยประสานงาน & คัดกรองงานหลัก',
    icon: BrainCircuit,
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-600 to-blue-600',
    avatarText: 'COS'
  },
  sales_agent: {
    id: 'sales_agent',
    name: 'Sales & Deal Closer',
    role: 'ฝ่ายขาย & ร่างใบเสนอราคา',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-500 to-teal-600',
    avatarText: 'SALES'
  },
  follow_up_agent: {
    id: 'follow_up_agent',
    name: 'Follow-Up Radar Agent',
    role: 'ฝ่ายติดตามงาน & เรดาร์เงินสด',
    icon: Clock,
    color: 'text-amber-600',
    bgGradient: 'from-amber-500 to-orange-600',
    avatarText: 'RADAR'
  },
  finance_agent: {
    id: 'finance_agent',
    name: 'Finance & Bookkeeper',
    role: 'ฝ่ายการเงิน ออกบิล & สรุปรายรับ',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-indigo-600',
    avatarText: 'FIN'
  },
  marketing_agent: {
    id: 'marketing_agent',
    name: 'Content & Brand Strategist',
    role: 'ฝ่ายการตลาด ดึงผลงานทำคอนเทนต์',
    icon: Sparkles,
    color: 'text-pink-600',
    bgGradient: 'from-pink-500 to-rose-600',
    avatarText: 'MKT'
  }
};

const LS_BATON_DISMISSED = 'df_baton_dismissed';
const LS_BATON_EXECUTED = 'df_baton_executed';

export function getDismissedHandoffIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_BATON_DISMISSED) || '[]');
  } catch {
    return [];
  }
}

export function dismissHandoff(id: string): void {
  try {
    const list = getDismissedHandoffIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(LS_BATON_DISMISSED, JSON.stringify(list));
    }
  } catch {}
}

export function getExecutedHandoffIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_BATON_EXECUTED) || '[]');
  } catch {
    return [];
  }
}

export function markHandoffExecuted(id: string): void {
  try {
    const list = getExecutedHandoffIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(LS_BATON_EXECUTED, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Core Baton-Passing Engine
 * Evaluates current state across all modules and generates proactive agent handoffs.
 */
export function computeBatonHandoffs(params: {
  tasks: Task[];
  documents: IssuedDocument[];
  clients: Client[];
  contentPlans: ContentPlan[];
}): BatonHandoff[] {
  const { tasks = [], documents = [], clients = [], contentPlans = [] } = params;
  const dismissed = getDismissedHandoffIds();
  const executed = getExecutedHandoffIds();

  const handoffs: BatonHandoff[] = [];
  const now = new Date();

  // ──────────────────────────────────────────────────────────────────────────
  // BATON 1: Sales Agent (Draft Quotation from Leads / Deals)
  // ──────────────────────────────────────────────────────────────────────────
  tasks.forEach(task => {
    const isCompleted = task.status === 'Done' || task.status === 'เสร็จสิ้น';
    if (isCompleted) return;

    const val = Number(task.price || task.dealValue || 0);
    const hasClient = Boolean(task.customer || task.clientId);
    const stage = task.pipelineStage || 'proposal';

    if (val > 0 && hasClient && (stage === 'proposal' || stage === 'lead' || stage === 'opportunity')) {
      // Check if quotation already exists for this customer or task
      const existingDoc = documents.find(d => 
        d.docType === 'quotation' && 
        (d.customerName.toLowerCase() === (task.customer || '').toLowerCase() || d.id.includes(String(task.id)))
      );

      if (!existingDoc) {
        const handoffId = `baton_sales_qt_${task.id}`;
        const matchedClient = clients.find(c => 
          c.name.toLowerCase() === (task.customer || '').toLowerCase() || c.id === task.clientId
        );

        const status = executed.includes(handoffId) ? 'executed' : dismissed.includes(handoffId) ? 'dismissed' : 'pending';

        handoffs.push({
          id: handoffId,
          fromAgent: 'chief_of_staff',
          toAgent: 'sales_agent',
          badgeText: 'ร่างใบเสนอราคา',
          title: `ฝ่ายขาย: ยกร่างใบเสนอราคาสำหรับดีล "${task.name}"`,
          description: `ตรวจพบดีลลูกค้า "${task.customer || 'ลูกค้า'}" มูลค่า ฿${val.toLocaleString()} — ฝ่ายขายได้เตรียมรายการและยอดสุทธิ พร้อมส่งเข้า DocFlow ให้คุณตรวจทาน 1 คลิก`,
          actionType: 'draft_quotation',
          actionPayload: {
            task,
            client: matchedClient,
            suggestedDoc: {
              docType: 'quotation',
              customerName: task.customer || matchedClient?.name || '',
              customerAddr: matchedClient?.address || '',
              customerTaxId: matchedClient?.taxId || '',
              customerContact: matchedClient?.contactName || '',
              customerPhone: matchedClient?.phone || matchedClient?.mobile || '',
              netTotal: val,
              items: [{ desc: task.name, qty: 1, price: val }]
            }
          },
          status,
          createdAt: task.updatedAt || now.toISOString()
        });
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // BATON 2: Follow-Up Radar Agent (Pending Quotations Countdown)
  // ──────────────────────────────────────────────────────────────────────────
  documents.forEach(doc => {
    if (doc.docType === 'quotation' && doc.status !== 'signed') {
      const docCreated = new Date(doc.createdAt || doc.docDate || now);
      const diffTime = now.getTime() - docCreated.getTime();
      const elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Calculate days remaining in 7-day window
      const targetDue = doc.followUpDueDate 
        ? new Date(doc.followUpDueDate) 
        : new Date(docCreated.getTime() + 7 * 24 * 60 * 60 * 1000);
      const remainingDays = Math.ceil((targetDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (elapsedDays >= 1 || remainingDays <= 5) {
        const handoffId = `baton_radar_qt_${doc.id}`;
        const status = executed.includes(handoffId) ? 'executed' : dismissed.includes(handoffId) ? 'dismissed' : 'pending';

        const urgencyText = remainingDays < 0 
          ? `เกินกำหนด 7 วันแล้ว (${Math.abs(remainingDays)} วัน)` 
          : remainingDays === 0 
          ? `ครบกำหนดวันนี้!` 
          : `เหลือเวลาอีก ${remainingDays} วัน`;

        handoffs.push({
          id: handoffId,
          fromAgent: 'sales_agent',
          toAgent: 'follow_up_agent',
          badgeText: 'เรดาร์ 7 วัน',
          title: `ฝ่ายติดตาม: ใบเสนอราคา ${doc.docNo} (${doc.customerName}) รอเซ็นกลับ`,
          description: `ส่งเอกสารไปแล้ว ${elapsedDays} วัน (ยอด ฿${Number(doc.netTotal || 0).toLocaleString()}) [${urgencyText}] — ฝ่ายติดตามเตรียมข้อความทักตามลูกค้าให้พร้อมส่งใน LINE/แชท ทันที`,
          actionType: 'follow_up_reminder',
          actionPayload: { doc, remainingDays, elapsedDays },
          status,
          createdAt: doc.createdAt
        });
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // BATON 3: Finance Agent (Signed Quotations -> Auto-Convert to Invoice & Receipt)
  // ──────────────────────────────────────────────────────────────────────────
  documents.forEach(doc => {
    if (doc.docType === 'quotation' && doc.status === 'signed') {
      // Check if invoice already issued referencing this quotation
      const hasInvoice = documents.some(d => 
        d.docType === 'invoice' && (d.linkedDocNo === doc.docNo || d.customerName === doc.customerName)
      );

      if (!hasInvoice) {
        const handoffId = `baton_fin_convert_${doc.id}`;
        const status = executed.includes(handoffId) ? 'executed' : dismissed.includes(handoffId) ? 'dismissed' : 'pending';

        handoffs.push({
          id: handoffId,
          fromAgent: 'follow_up_agent',
          toAgent: 'finance_agent',
          badgeText: 'เซ็นแล้ว -> ออกบิล',
          title: `ฝ่ายการเงิน: ใบเสนอราคา ${doc.docNo} เซ็นกลับแล้ว -> แปลงเป็นใบแจ้งหนี้ & ใบเสร็จ`,
          description: `ลูกค้า "${doc.customerName}" อนุมัติยอด ฿${Number(doc.netTotal || 0).toLocaleString()} แล้ว — ฝ่ายการเงินพร้อมเปลี่ยนเป็นใบแจ้งหนี้ (INV) และออกใบเสร็จรับเงิน (RC) ล่วงหน้าให้ทันที`,
          actionType: 'auto_convert_invoice',
          actionPayload: { doc },
          status,
          createdAt: doc.signedAt || doc.createdAt
        });
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // BATON 4: Marketing Agent (Completed Project -> Content Plan Case Study)
  // ──────────────────────────────────────────────────────────────────────────
  tasks.forEach(task => {
    const isCompleted = task.status === 'Done' || task.status === 'เสร็จสิ้น';
    if (!isCompleted) return;

    // Check if matching content plan exists
    const hasContentPlan = contentPlans.some(cp => 
      cp.title.toLowerCase().includes(task.name.toLowerCase()) ||
      (cp.concept && cp.concept.toLowerCase().includes(task.name.toLowerCase()))
    );

    if (!hasContentPlan) {
      const handoffId = `baton_mkt_case_${task.id}`;
      const status = executed.includes(handoffId) ? 'executed' : dismissed.includes(handoffId) ? 'dismissed' : 'pending';

      handoffs.push({
        id: handoffId,
        fromAgent: 'finance_agent',
        toAgent: 'marketing_agent',
        badgeText: 'คอนเทนต์ต่อยอด',
        title: `ฝ่ายการตลาด: สรุปโปรเจกต์ "${task.name}" เป็น Case Study โพสต์โซเชียล`,
        description: `โปรเจกต์ของลูกค้า "${task.customer || 'ลูกค้า'}" ส่งมอบสำเร็จ — ฝ่ายการตลาดได้ร่างไอเดียคอนเทนต์ 'เบื้องหลังความสำเร็จและผลลัพธ์' เพื่อปั้น Personal Brand ต่อทันที`,
        actionType: 'create_content_plan',
        actionPayload: {
          task,
          suggestedContent: {
            title: `เบื้องหลังการแก้ปัญหา: ${task.name}`,
            platform: 'Facebook / LinkedIn',
            concept: `สรุป Case Study วิธีส่งมอบงาน ${task.name} ให้ลูกค้า ${task.customer || ''}: ปัญหาเดิมที่เจอ, ทางแก้ที่เราทำ, และผลลัพธ์ที่วัดได้จริง`,
            status: 'ไอเดีย/ร่าง' as const
          }
        },
        status,
        createdAt: task.updatedAt || now.toISOString()
      });
    }
  });

  // Sort: pending first, then by createdAt descending
  return handoffs.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
