/**
 * db.ts — Supabase CRUD + realtime listeners
 * แทนที่ Firestore สำหรับ multi-user real-time sync
 * และส่งข้อมูลแบบ Shadow write ไปที่ Google Sheets ด้วยในพื้นหลัง
 */
import { supabase } from './supabase';
import type { Task, Client, Template, Idea } from '../types';
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

  // Shadow write to Google Sheets
  saveTaskToSheet(task).catch(err => console.error('[Sheets Sync] saveTaskToSheet failed:', err));
}

export async function deleteTask(id: string | number): Promise<void> {
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

// ── Product stubs (stored in localStorage only) ───────────────────────────────
import type { Product } from '../types';
const LS_PRODUCTS = 'docflow_local_products';

export async function loadProducts(_month?: string): Promise<Product[]> {
  try { const v = localStorage.getItem(LS_PRODUCTS); return v ? JSON.parse(v) : []; } catch { return []; }
}

export async function saveProduct(product: Product): Promise<void> {
  const products: Product[] = await loadProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) products[idx] = product; else products.push(product);
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
}

export async function deleteProduct(id: string): Promise<void> {
  const products: Product[] = await loadProducts();
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(products.filter(p => p.id !== id)));
}
