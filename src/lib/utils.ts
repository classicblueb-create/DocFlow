import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Task } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateHealthScore(task: Task): { score: number; status: 'Excellent' | 'Healthy' | 'Warning' | 'Critical'; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  if (task.endDate) {
    if (task.endDate < today) {
      score -= 40;
      reasons.push('เกินกำหนดส่งแล้ว');
    } else {
      const daysLeft = Math.round((new Date(task.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 2) { score -= 20; reasons.push('กำหนดส่งใกล้มากแล้ว'); }
      else if (daysLeft <= 7) { score -= 10; reasons.push('กำหนดส่งใกล้'); }
    }
  } else {
    score -= 10;
    reasons.push('ไม่มีวันกำหนดส่ง');
  }

  if (!task.details || task.details.length < 20) {
    score -= 10;
    reasons.push('รายละเอียดงานน้อย');
  }

  if (!task.price || task.price === 0) {
    score -= 5;
    reasons.push('ไม่มีการกำหนดราคา');
  }

  if (task.priority === 'ด่วน (Urgent)' || task.priority === 'สูง (High)') {
    score -= 5;
    reasons.push('ความสำคัญสูง');
  }

  score = Math.max(0, Math.min(100, score));
  let status: 'Excellent' | 'Healthy' | 'Warning' | 'Critical' =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Healthy' : score >= 40 ? 'Warning' : 'Critical';

  if (reasons.length === 0) reasons.push('โครงการอยู่ในสภาพดีเยี่ยม');

  return { score, status, reasons };
}

export type DeadlineStatus = 'overdue' | 'urgent' | 'warning' | 'ok' | null;

export function getDeadlineStatus(task: Task): DeadlineStatus {
  if (!task.endDate) return null;
  const today = new Date().toISOString().split('T')[0];
  if (task.endDate < today) return 'overdue';
  const daysLeft = Math.round((new Date(task.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 1) return 'urgent';
  if (daysLeft <= 3) return 'warning';
  return 'ok';
}

export function parseSubtasks(raw?: string): Array<{ id: string; name: string; status: string; order: number; completed?: boolean }> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

export function getDaysLeft(task: Task): number {
  if (!task.endDate) return 0;
  const today = new Date().toISOString().split('T')[0];
  return Math.round((new Date(task.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
}
