export interface Task {
  id: string | number;
  name: string;
  status: string;
  price?: number;
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
}

export interface Client {
  id: string;
  name: string;
  address: string;
  taxId: string;
  targetBudget: number;
  color: string;
}

export interface Template {
  id: string;
  name: string;
  price: number;
  details: string;
}

export type ViewType = 'board' | 'gantt' | 'calendar' | 'dashboard' | 'clients' | 'templates' | 'docflow' | 'agents';
