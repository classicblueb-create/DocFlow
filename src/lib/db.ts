/**
 * db.ts — Supabase CRUD + realtime listeners
 * แทนที่ Firestore สำหรับ multi-user real-time sync
 * และส่งข้อมูลแบบ Shadow write ไปที่ Google Sheets ด้วยในพื้นหลัง
 */
import { supabase } from './supabase';
import type { Task, Client, Template, Idea, ProjectCategory, ContentPlan } from '../types';
import {
  saveTaskToSheet, deleteTaskFromSheet,
  saveClientToSheet, deleteClientFromSheet,
  saveTemplateToSheet, deleteTemplateFromSheet,
  saveIdeaToSheet, deleteIdeaFromSheet,
} from './sheets';

export type Unsubscribe = () => void;

// ── Realtime listeners (onSnapshot equivalent) ────────────────────────────────

export function subscribeTasks(cb: (tasks: Task[]) => void): Unsubscribe {
  // Fetch initial tasks
  supabase.from('tasks').select('*').order('name').then(({ data, error }) => {
    if (error) console.error('[Supabase] fetch tasks failed:', error);
    else if (data) cb(data as Task[]);
  });

  // Subscribe to changes
  const channel = supabase.channel('tasks-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => {
      const { data } = await supabase.from('tasks').select('*').order('name');
      if (data) cb(data as Task[]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeClients(cb: (clients: Client[]) => void): Unsubscribe {
  // Fetch initial clients
  supabase.from('clients').select('*').order('name').then(({ data, error }) => {
    if (error) console.error('[Supabase] fetch clients failed:', error);
    else if (data) cb(data as Client[]);
  });

  // Subscribe to changes
  const channel = supabase.channel('clients-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, async () => {
      const { data } = await supabase.from('clients').select('*').order('name');
      if (data) cb(data as Client[]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeTemplates(cb: (templates: Template[]) => void): Unsubscribe {
  // Fetch initial templates
  supabase.from('templates').select('*').order('name').then(({ data, error }) => {
    if (error) console.error('[Supabase] fetch templates failed:', error);
    else if (data) cb(data as Template[]);
  });

  // Subscribe to changes
  const channel = supabase.channel('templates-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, async () => {
      const { data } = await supabase.from('templates').select('*').order('name');
      if (data) cb(data as Template[]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeIdeas(cb: (ideas: Idea[]) => void): Unsubscribe {
  // Fetch initial ideas
  supabase.from('ideas').select('*').order('createdAt').then(({ data, error }) => {
    if (error) console.error('[Supabase] fetch ideas failed:', error);
    else if (data) cb(data as Idea[]);
  });

  // Subscribe to changes
  const channel = supabase.channel('ideas-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, async () => {
      const { data } = await supabase.from('ideas').select('*').order('createdAt');
      if (data) cb(data as Idea[]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Task CRUD ─────────────────────────────────────────────────────────────────

export async function saveTask(task: Task): Promise<void> {
  const id = String(task.id);
  const { error } = await supabase.from('tasks').upsert({
    id,
    name: task.name,
    status: task.status,
    price: task.price ?? 0,
    devCost: task.devCost ?? 0,
    myIncome: task.myIncome ?? 0,
    clientId: task.clientId || null,
    customer: task.customer || null,
    startDate: task.startDate || null,
    endDate: task.endDate || null,
    tags: task.tags || null,
    details: task.details || null,
    subtasks: task.subtasks || null,
    aiAnalysis: task.aiAnalysis || null,
    aiEmail: task.aiEmail || null,
    aiCourse: task.aiCourse || null,
    priority: task.priority || null,
    aiChatHistory: task.aiChatHistory || null,
    paymentPhases: task.paymentPhases || null,
    invoices: task.invoices || null,
    pipelineStage: task.pipelineStage || null,
    dealValue: task.dealValue ?? null,
    attachments: task.attachments || null,
    comments: task.comments || null,
    dependencies: task.dependencies || null,
    categoryId: task.categoryId || null,
    updatedAt: task.updatedAt || null,
  });
  if (error) throw error;

  // Sync to Google Calendar (best effort)
  fetch('/api/google/sync-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId: id })
  }).catch(err => console.error('[GCal Sync] saveTask sync failed:', err));

  // Shadow write to Google Sheets
  saveTaskToSheet(task).catch(err => console.error('[Sheets Sync] saveTaskToSheet failed:', err));
}

export async function deleteTask(id: string | number): Promise<void> {
  // Sync delete to Google Calendar (best effort)
  fetch('/api/google/sync-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId: String(id), isDeleted: true })
  }).catch(err => console.error('[GCal Sync] deleteTask sync failed:', err));

  const { error } = await supabase.from('tasks').delete().eq('id', String(id));
  if (error) throw error;

  // Shadow write to Google Sheets
  deleteTaskFromSheet(id).catch(err => console.error('[Sheets Sync] deleteTaskFromSheet failed:', err));
}

// ── Client CRUD ───────────────────────────────────────────────────────────────

export async function saveClient(client: Client): Promise<void> {
  const { error } = await supabase.from('clients').upsert({
    id: client.id,
    name: client.name,
    color: client.color || null,
    address: client.address || null,
    taxId: client.taxId || null,
    targetBudget: client.targetBudget ?? 0,
    contactName: client.contactName || null,
    contactTitle: client.contactTitle || null,
    email: client.email || null,
    phone: client.phone || null,
    mobile: client.mobile || null,
    website: client.website || null,
    lineId: client.lineId || null,
    subDistrict: client.subDistrict || null,
    district: client.district || null,
    province: client.province || null,
    postalCode: client.postalCode || null,
    country: client.country || null,
    companyRegNo: client.companyRegNo || null,
    businessType: client.businessType || null,
    vatRegistered: client.vatRegistered ?? null,
    currency: client.currency || null,
    paymentTerms: client.paymentTerms || null,
    creditLimit: client.creditLimit ?? null,
    industry: client.industry || null,
    source: client.source || null,
    notes: client.notes || null,
  });
  if (error) throw error;

  // Shadow write to Google Sheets
  saveClientToSheet(client).catch(err => console.error('[Sheets Sync] saveClientToSheet failed:', err));
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;

  // Shadow write to Google Sheets
  deleteClientFromSheet(id).catch(err => console.error('[Sheets Sync] deleteClientFromSheet failed:', err));
}

// ── Template CRUD ─────────────────────────────────────────────────────────────

export async function saveTemplate(template: Template): Promise<void> {
  const { error } = await supabase.from('templates').upsert({
    id: template.id,
    name: template.name,
    price: template.price ?? 0,
    details: template.details || null,
  });
  if (error) throw error;

  // Shadow write to Google Sheets
  saveTemplateToSheet(template).catch(err => console.error('[Sheets Sync] saveTemplateToSheet failed:', err));
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) throw error;

  // Shadow write to Google Sheets
  deleteTemplateFromSheet(id).catch(err => console.error('[Sheets Sync] deleteTemplateFromSheet failed:', err));
}

// ── Idea CRUD ─────────────────────────────────────────────────────────────────

export async function saveIdea(idea: Idea): Promise<void> {
  const { error } = await supabase.from('ideas').upsert({
    id: idea.id,
    title: idea.title,
    description: idea.description || null,
    category: idea.category || null,
    tags: idea.tags || null,
    createdAt: idea.createdAt,
    aiAnalysis: idea.aiAnalysis || null,
    priority: idea.priority || null,
    effort: idea.effort || null,
    status: idea.status,
  });
  if (error) throw error;

  // Shadow write to Google Sheets
  saveIdeaToSheet(idea).catch(err => console.error('[Sheets Sync] saveIdeaToSheet failed:', err));
}

export async function deleteIdea(id: string): Promise<void> {
  const { error } = await supabase.from('ideas').delete().eq('id', id);
  if (error) throw error;

  // Shadow write to Google Sheets
  deleteIdeaFromSheet(id).catch(err => console.error('[Sheets Sync] deleteIdeaFromSheet failed:', err));
}

// ── Supabase Storage — file upload ───────────────────────────────────────────

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

/**
 * อัปโหลดไฟล์ไปยัง Supabase Storage
 * bucket: 'attachments'
 */
export async function uploadFile(
  file: File,
  folder: string = 'attachments'
): Promise<UploadResult> {
  const timestamp = Date.now();
  const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath  = `${folder}/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return { url: publicUrl, path: filePath, name: file.name };
}

/**
 * ลบไฟล์จาก Supabase Storage โดยใช้ path
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('attachments')
    .remove([path]);
  if (error) console.warn('[Supabase Storage] deleteFile failed:', error);
}

/**
 * นำเข้าข้อมูลจำนวนมากจาก Google Sheets ลง Supabase
 * โดยไม่เรียกใช้ callback shadow write กลับไปยัง Google Sheets เพื่อประสิทธิภาพ
 */
export async function importDataFromSheets(
  tasks: Task[],
  clients: Client[],
  templates: Template[],
  ideas: Idea[]
): Promise<void> {
  if (tasks.length > 0) {
    const { error } = await supabase.from('tasks').upsert(tasks.map(t => ({
      id: String(t.id),
      name: t.name,
      status: t.status,
      price: t.price ?? 0,
      devCost: t.devCost ?? 0,
      myIncome: t.myIncome ?? 0,
      clientId: t.clientId || null,
      customer: t.customer || null,
      startDate: t.startDate || null,
      endDate: t.endDate || null,
      tags: t.tags || null,
      details: t.details || null,
      subtasks: t.subtasks || null,
      aiAnalysis: t.aiAnalysis || null,
      aiEmail: t.aiEmail || null,
      aiCourse: t.aiCourse || null,
      priority: t.priority || null,
      aiChatHistory: t.aiChatHistory || null,
      paymentPhases: t.paymentPhases || null,
      invoices: t.invoices || null,
      pipelineStage: t.pipelineStage || null,
      dealValue: t.dealValue ?? null,
      attachments: t.attachments || null,
      comments: t.comments || null,
      dependencies: t.dependencies || null,
      categoryId: t.categoryId || null,
      updatedAt: t.updatedAt || null,
    })));
    if (error) throw error;
  }

  if (clients.length > 0) {
    const { error } = await supabase.from('clients').upsert(clients.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color || null,
      address: c.address || null,
      taxId: c.taxId || null,
      targetBudget: c.targetBudget ?? 0,
      contactName: c.contactName || null,
      contactTitle: c.contactTitle || null,
      email: c.email || null,
      phone: c.phone || null,
      mobile: c.mobile || null,
      website: c.website || null,
      lineId: c.lineId || null,
      subDistrict: c.subDistrict || null,
      district: c.district || null,
      province: c.province || null,
      postalCode: c.postalCode || null,
      country: c.country || null,
      companyRegNo: c.companyRegNo || null,
      businessType: c.businessType || null,
      vatRegistered: c.vatRegistered ?? null,
      currency: c.currency || null,
      paymentTerms: c.paymentTerms || null,
      creditLimit: c.creditLimit ?? null,
      industry: c.industry || null,
      source: c.source || null,
      notes: c.notes || null,
    })));
    if (error) throw error;
  }

  if (templates.length > 0) {
    const { error } = await supabase.from('templates').upsert(templates.map(t => ({
      id: t.id,
      name: t.name,
      price: t.price ?? 0,
      details: t.details || null,
    })));
    if (error) throw error;
  }

  if (ideas.length > 0) {
    const { error } = await supabase.from('ideas').upsert(ideas.map(i => ({
      id: i.id,
      title: i.title,
      description: i.description || null,
      category: i.category || null,
      tags: i.tags || null,
      createdAt: i.createdAt,
      aiAnalysis: i.aiAnalysis || null,
      priority: i.priority || null,
      effort: i.effort || null,
      status: i.status,
    })));
    if (error) throw error;
  }
}

// ── Categories (Supabase) ─────────────────────────────────────────────────────

export function subscribeCategories(cb: (cats: ProjectCategory[]) => void): Unsubscribe {
  supabase.from('categories').select('*').order('name').then(({ data, error }) => {
    if (error) console.error('[Supabase] fetch categories failed:', error);
    else if (data) cb(data as ProjectCategory[]);
  });

  const channel = supabase.channel('categories-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) cb(data as ProjectCategory[]);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function saveCategory(cat: ProjectCategory): Promise<void> {
  const { error } = await supabase.from('categories').upsert({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || null,
    description: cat.description || null,
    color: cat.color || null,
    createdAt: cat.createdAt || new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ── ContentPlans (Supabase) ───────────────────────────────────────────────────

function mapContentPlan(r: any): ContentPlan {
  return {
    id: r.id,
    title: r.title,
    platform: r.platform || '',
    status: r.status || 'ไอเดีย/ร่าง',
    concept: r.concept || '',
    toneOfVoice: r.toneOfVoice || undefined,
    targetAudience: r.targetAudience || undefined,
    aiHooks: r.aiHooks ? (typeof r.aiHooks === 'string' ? JSON.parse(r.aiHooks) : r.aiHooks) : undefined,
    aiOutline: r.aiOutline || undefined,
    aiScript: r.aiScript || undefined,
    aiHashtags: r.aiHashtags || undefined,
    publishDate: r.publishDate || undefined,
    notionPageId: r.notionPageId || undefined,
    notionUrl: r.notionUrl || undefined,
    createdAt: r.createdAt || new Date().toISOString(),
    engagementRating: r.engagementRating || null,
    viewCount: r.viewCount ?? undefined,
    likeCount: r.likeCount ?? undefined,
  };
}

export function subscribeContentPlans(cb: (plans: ContentPlan[]) => void): Unsubscribe {
  supabase.from('content_plans').select('*').order('"createdAt"').then(({ data, error }) => {
    if (error) console.error('[Supabase] fetch content_plans failed:', error);
    else if (data) cb(data.map(mapContentPlan));
  });

  const channel = supabase.channel('content-plans-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'content_plans' }, async () => {
      const { data } = await supabase.from('content_plans').select('*').order('"createdAt"');
      if (data) cb(data.map(mapContentPlan));
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function saveContentPlan(plan: ContentPlan): Promise<void> {
  const { error } = await supabase.from('content_plans').upsert({
    id: plan.id,
    title: plan.title,
    platform: plan.platform || null,
    status: plan.status || 'ไอเดีย/ร่าง',
    concept: plan.concept || null,
    toneOfVoice: plan.toneOfVoice || null,
    targetAudience: plan.targetAudience || null,
    aiHooks: plan.aiHooks ? JSON.stringify(plan.aiHooks) : null,
    aiOutline: plan.aiOutline || null,
    aiScript: plan.aiScript || null,
    aiHashtags: plan.aiHashtags || null,
    publishDate: plan.publishDate || null,
    notionPageId: plan.notionPageId || null,
    notionUrl: plan.notionUrl || null,
    createdAt: plan.createdAt || new Date().toISOString(),
    engagementRating: plan.engagementRating || null,
    viewCount: plan.viewCount ?? null,
    likeCount: plan.likeCount ?? null,
  });
  if (error) throw error;
}

export async function deleteContentPlan(id: string): Promise<void> {
  const { error } = await supabase.from('content_plans').delete().eq('id', id);
  if (error) throw error;
}

// ── Products (Supabase) ───────────────────────────────────────────────────────
import type { Product } from '../types';

export async function loadProducts(month?: string): Promise<Product[]> {
  let q = supabase.from('products').select('*');
  if (month) q = q.eq('month', month);
  const { data, error } = await q.order('created_at');
  if (error) { console.error('[Supabase] fetch products failed:', error); return []; }
  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    targetUnits: r.target_units ?? 0,
    soldUnits: r.sold_units ?? 0,
    month: r.month,
    platform: r.platform,
    category: r.category,
    createdAt: r.created_at,
  })) as Product[];
}

export async function saveProduct(product: Product): Promise<void> {
  const { error } = await supabase.from('products').upsert({
    id: product.id,
    name: product.name,
    price: product.price ?? 0,
    target_units: product.targetUnits ?? 0,
    sold_units: product.soldUnits ?? 0,
    month: product.month,
    platform: product.platform || 'อื่นๆ',
    category: product.category || 'คอร์ส',
  });
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ── Doc Numbers Cloud Sync ───────────────────────────────────────────────────

export async function saveDocNumbersCloud(docNumbers: Record<string, string>): Promise<void> {
  // 1. LocalStorage
  try {
    if (docNumbers.quotation) localStorage.setItem('df_docNo_quotation', JSON.stringify(docNumbers.quotation));
    if (docNumbers.invoice) localStorage.setItem('df_docNo_invoice', JSON.stringify(docNumbers.invoice));
    if (docNumbers.receipt) localStorage.setItem('df_docNo_receipt', JSON.stringify(docNumbers.receipt));
  } catch (e) {}

  // 2. Supabase
  try {
    await supabase.from('templates').upsert({
      id: 'df_doc_numbers_config',
      name: 'Document Numbering Config',
      details: JSON.stringify(docNumbers),
    });
  } catch (err) {
    console.warn('[Supabase] Sync doc numbers failed:', err);
  }

  // 3. Express API Backup
  try {
    await fetch('/api/doc-numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docNumbers),
    });
  } catch (e) {}
}

export function subscribeDocNumbersCloud(cb: (numbers: Record<string, string>) => void): Unsubscribe {
  // 1. Initial fetch from Supabase
  supabase.from('templates').select('*').eq('id', 'df_doc_numbers_config').single().then(({ data, error }) => {
    if (!error && data && data.details) {
      try {
        const parsed = JSON.parse(data.details);
        cb(parsed);
      } catch (e) {}
    } else {
      // Fallback to Express API
      fetch('/api/doc-numbers').then(r => r.json()).then(data => {
        if (data && typeof data === 'object') cb(data);
      }).catch(() => {});
    }
  });

  // 2. Supabase Realtime channel
  const channel = supabase.channel('doc-numbers-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'templates', filter: 'id=eq.df_doc_numbers_config' }, async (payload: any) => {
      const details = payload?.new?.details;
      if (details) {
        try {
          const parsed = JSON.parse(details);
          cb(parsed);
        } catch (e) {}
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Issued Documents DB Storage & Realtime Sync ───────────────────────────────
import type { IssuedDocument } from '../types';

export async function saveIssuedDocument(doc: IssuedDocument): Promise<void> {
  // Save to localStorage as immediate offline fallback list
  try {
    const listStr = localStorage.getItem('df_issued_documents') || '[]';
    const list: IssuedDocument[] = JSON.parse(listStr);
    const filtered = list.filter(d => d.id !== doc.id);
    localStorage.setItem('df_issued_documents', JSON.stringify([doc, ...filtered]));
  } catch (e) {}

  // Save to Supabase
  try {
    const row = {
      id: doc.id,
      name: `Doc ${doc.docNo} (${doc.docType.toUpperCase()})`,
      price: doc.netTotal,
      details: JSON.stringify(doc),
    };
    await supabase.from('templates').upsert(row);
  } catch (err) {
    console.warn('[Supabase] Save issued document failed:', err);
  }
}

export function subscribeIssuedDocuments(cb: (docs: IssuedDocument[]) => void): Unsubscribe {
  const mapData = (data: any[]) => {
    return (data || [])
      .filter((r: any) => r.id && r.id.startsWith('doc_') && r.details)
      .map((r: any) => {
        try { return JSON.parse(r.details) as IssuedDocument; } catch { return null; }
      })
      .filter(Boolean) as IssuedDocument[];
  };

  // Initial fetch from Supabase
  supabase.from('templates').select('*').like('id', 'doc_%').order('name').then(({ data, error }) => {
    if (!error && data && data.length > 0) {
      cb(mapData(data));
    } else {
      // Fallback to localStorage
      try {
        const local = JSON.parse(localStorage.getItem('df_issued_documents') || '[]');
        if (Array.isArray(local)) cb(local);
      } catch (e) {}
    }
  });

  // Supabase Realtime channel
  const channel = supabase.channel('issued-docs-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, async () => {
      const { data } = await supabase.from('templates').select('*').like('id', 'doc_%').order('name');
      if (data) cb(mapData(data));
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
