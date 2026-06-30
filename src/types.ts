export type ViewType =
  | 'briefing'
  | 'board'
  | 'list'
  | 'gantt'
  | 'calendar'
  | 'dashboard'
  | 'clients'
  | 'templates'
  | 'docflow'
  | 'agents'
  | 'ideas'
  | 'pipeline'
  | 'categories'
  | 'portfolio'
  | 'content_plan';

export interface Task {
  id: string | number;
  name: string;
  status: string;
  price?: number;
  devCost?: number;
  myIncome?: number;
  clientId?: string;
  customer?: string;
  startDate?: string;
  endDate?: string;
  tags?: string;
  details?: string;
  subtasks?: string;
  aiAnalysis?: string;
  aiEmail?: string;
  aiCourse?: string;
  priority?: string;
  aiChatHistory?: string;
  paymentPhases?: string;
  invoices?: string;
  pipelineStage?: 'lead' | 'opportunity' | 'proposal' | 'negotiation' | 'won' | 'lost';
  dealValue?: number;
  assignee?: 'Fan' | 'Mod';
  fileUrl?: string;
  categoryId?: string;
  updatedAt?: string;
  comments?: string;
  attachments?: string;
  dependencies?: string[];
}

export interface Subtask {
  id: string;
  name: string;
  status: 'todo' | 'doing' | 'done';
  order: number;
  assignee?: 'Fan' | 'Mod';
  startDate?: string;
  dueDate?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  color?: string;
  address?: string;
  taxId?: string;
  targetBudget?: number;
  contactName?: string;
  contactTitle?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  lineId?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  companyRegNo?: string;
  businessType?: 'individual' | 'company' | 'government';
  vatRegistered?: boolean;
  currency?: string;
  paymentTerms?: string;
  creditLimit?: number;
  industry?: string;
  source?: string;
  notes?: string;
  createdAt?: string;
}

export interface Template {
  id: string;
  name: string;
  price?: number;
  details?: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string;
  createdAt: string;
  aiAnalysis?: string;
  priority?: 'สูง' | 'กลาง' | 'ต่ำ';
  effort?: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  status: 'ไอเดีย' | 'กำลังวางแผน' | 'กำลังทำ' | 'เสร็จแล้ว';
}

export interface ContentPlan {
  id: string;
  title: string;
  platform: string;
  status: 'ไอเดีย/ร่าง' | 'กำลังผลิต' | 'กำหนดลง' | 'เผยแพร่แล้ว';
  concept: string;
  toneOfVoice?: string;
  targetAudience?: string;
  aiHooks?: string[];
  aiOutline?: string;
  aiScript?: string;
  aiHashtags?: string;
  publishDate?: string;
  createdAt: string;
  notionPageId?: string;
  notionUrl?: string;
  engagementRating?: 'B+' | 'A+' | null;
  viewCount?: number;
  likeCount?: number;
}

export interface PaymentPhase {
  id: string;
  label: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
  paidAt?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNo: string;
  issueDate: string;
  dueDate?: string;
  status: InvoiceStatus;
  phaseIds: string[];
  totalAmount: number;
  notes?: string;
  sentAt?: string;
  paidAt?: string;
}

export interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  path?: string;
  mimeType?: string;
  size?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'คอร์ส' | 'ebook' | 'template' | 'preset' | 'อื่นๆ';
  price: number;
  platform?: string;
  description?: string;
  soldUnits: number;
  targetUnits: number;
  month?: string;
  monthlySales?: Record<string, number>; // key = 'YYYY-MM'
  createdAt: string;
}
