import type { ContentPlan } from '../types';

export interface NotionContentPlan extends ContentPlan {
  done?: boolean;
  notionUrl?: string;
}

export async function fetchNotionContentPlans(): Promise<NotionContentPlan[]> {
  const res = await fetch('/api/notion/content-plans');
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createNotionContentPlan(plan: Partial<ContentPlan>): Promise<NotionContentPlan> {
  const res = await fetch('/api/notion/content-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateNotionContentPlan(id: string, updates: Partial<ContentPlan & { done: boolean }>): Promise<NotionContentPlan> {
  const res = await fetch(`/api/notion/content-plans/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteNotionContentPlan(id: string): Promise<void> {
  const res = await fetch(`/api/notion/content-plans/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}
