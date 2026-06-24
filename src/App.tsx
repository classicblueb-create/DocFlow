import { useState, useEffect, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BoardView } from './components/views/BoardView';
import { ListView } from './components/views/ListView';
import { DashboardView } from './components/views/DashboardView';
import { BriefingView } from './components/views/BriefingView';
import { PipelineView } from './components/views/PipelineView';
import { CategoryDashboardView } from './components/views/CategoryDashboardView';
import { IdeasView } from './components/views/IdeasView';
import { ContentPlanView } from './components/views/ContentPlanView';
import { AgentsView } from './components/views/AgentsView';
import { DocFlowView } from './components/views/DocFlowView';
import { CalendarView, GanttView } from './components/views/Placeholders';
import { ClientsView, TemplatesView } from './components/views/ListViews';
import { ProjectPage } from './components/ProjectPage';

import { LoginModal } from './components/modals/LoginModal';
import { TaskModal } from './components/modals/TaskModal';
import { AgentModal } from './components/modals/AgentModal';
import { StandupModal } from './components/modals/StandupModal';
import { DocSettingsModal } from './components/modals/DocSettingsModal';
import { ThemeSettingsModal } from './components/modals/ThemeSettingsModal';

import { ViewType, Task, Client, Template, Idea, ContentPlan, ProjectCategory } from './types';
import {
 subscribeTasks, subscribeClients, subscribeTemplates, subscribeIdeas,
 subscribeCategories, subscribeContentPlans,
 saveTask, deleteTask as dbDeleteTask,
 saveClient, deleteClient as dbDeleteClient,
 saveTemplate, deleteTemplate as dbDeleteTemplate,
 saveIdea, deleteIdea as dbDeleteIdea,
 saveCategory, deleteCategory as dbDeleteCategory,
 saveContentPlan, deleteContentPlan as dbDeleteContentPlan,
} from './lib/db';
import { getSession, onAuthStateChange } from './lib/auth';
import { applyTheme } from './lib/theme';

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_TASKS = 'docflow_local_tasks';
const LS_CLIENTS = 'docflow_local_clients';
const LS_TEMPLATES = 'docflow_local_templates';
const LS_IDEAS = 'docflow_local_ideas';


function lsGet<T>(key: string, fallback: T): T {
 try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
 try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Notification type ─────────────────────────────────────────────────────────
interface AppNotification { id: number; message: string; isError: boolean; }

export default function App() {
 // ── Auth ──────────────────────────────────────────────────────────────────
 const [authed, setAuthed] = useState(false);
 const [authLoading, setAuthLoading] = useState(true);

 // ── UI state ──────────────────────────────────────────────────────────────
 const [currentView, setCurrentView] = useState<ViewType>('briefing');
 const [isMobileOpen, setIsMobileOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [notifications, setNotifications] = useState<AppNotification[]>([]);
 const [settingsVersion, setSettingsVersion] = useState(0);

 // ── Active category (for category drill-down) ──────────────────────────────
 const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

 // ── Modal state ───────────────────────────────────────────────────────────
 const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
 const [editingTask, setEditingTask] = useState<Task | null>(null);
 const [selectedTask, setSelectedTask] = useState<Task | null>(null);
 const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
 const [isStandupOpen, setIsStandupOpen] = useState(false);
 const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false);
 const [isThemeOpen, setIsThemeOpen] = useState(false);
 const [newTaskPipelineStage, setNewTaskPipelineStage] = useState<string | undefined>();

 // ── Data ──────────────────────────────────────────────────────────────────
 const [tasks, setTasks] = useState<Task[]>(() => lsGet(LS_TASKS, []));
 const [clients, setClients] = useState<Client[]>(() => lsGet(LS_CLIENTS, []));
 const [templates, setTemplates] = useState<Template[]>(() => lsGet(LS_TEMPLATES, []));
 const [ideas, setIdeas] = useState<Idea[]>(() => lsGet(LS_IDEAS, []));
 const [contentPlans, setContentPlans] = useState<ContentPlan[]>([]);
 const [categories, setCategories] = useState<ProjectCategory[]>([]);

 // ── Apply theme on mount ──────────────────────────────────────────────────
 useEffect(() => { applyTheme(); }, []);

 // ── Auth bootstrap ────────────────────────────────────────────────────────
 useEffect(() => {
 getSession().then(({ data }) => {
 setAuthed(!!data.session);
 setAuthLoading(false);
 });
 const { data: { subscription } } = onAuthStateChange((user: any) => {
 setAuthed(!!user);
 });
 return () => subscription.unsubscribe();
 }, []);

 // ── Background image (persisted in localStorage) ─────────────────────────
 const applyBgImage = (dataUrl: string | null) => {
 const val = dataUrl ? `url("${dataUrl}")` : 'none';
 document.documentElement.style.setProperty('--app-bg-image', val);
 };
 useEffect(() => {
 const saved = localStorage.getItem('modty_bg_image');
 if (saved) applyBgImage(saved);
 }, []);

 const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = ev => {
 const dataUrl = ev.target?.result as string;
 localStorage.setItem('modty_bg_image', dataUrl);
 applyBgImage(dataUrl);
 };
 reader.readAsDataURL(file);
 e.target.value = '';
 };

 const handleBgRemove = () => {
 localStorage.removeItem('modty_bg_image');
 applyBgImage(null);
 };

 // ── Realtime subscriptions (only when authed) ─────────────────────────────
 useEffect(() => {
 if (!authed) return;

 const unsubTasks = subscribeTasks(data => {
 setTasks(data);
 lsSet(LS_TASKS, data);
 });
 const unsubClients = subscribeClients(data => {
 setClients(data);
 lsSet(LS_CLIENTS, data);
 });
 const unsubTemplates = subscribeTemplates(data => {
 setTemplates(data);
 lsSet(LS_TEMPLATES, data);
 });
 const unsubIdeas = subscribeIdeas(data => {
 setIdeas(data);
 lsSet(LS_IDEAS, data);
 });
 const unsubCategories = subscribeCategories(data => {
 setCategories(data);
 });
 const unsubContentPlans = subscribeContentPlans(async data => {
 // One-time migration: push any localStorage plans not yet in Supabase
 if (data.length === 0) {
 try {
 const local = localStorage.getItem('docflow_local_content_plans');
 if (local) {
 const localPlans: ContentPlan[] = JSON.parse(local);
 for (const p of localPlans) await saveContentPlan(p).catch(() => {});
 localStorage.removeItem('docflow_local_content_plans');
 }
 } catch { /* skip */ }
 }
 setContentPlans(data);
 });

 return () => {
 unsubTasks();
 unsubClients();
 unsubTemplates();
 unsubIdeas();
 unsubCategories();
 unsubContentPlans();
 };
 }, [authed]);

 // ── Notification helper ───────────────────────────────────────────────────
 const showNotification = useCallback((message: string, isError = false) => {
 const id = Date.now();
 setNotifications(prev => [...prev, { id, message, isError }]);
 setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3500);
 }, []);

 // ── Task handlers ─────────────────────────────────────────────────────────
 const handleSaveTask = useCallback(async (taskData: Partial<Task>) => {
 const id = taskData.id || `task-${Date.now()}`;
 const task: Task = {
 id,
 name: taskData.name || 'งานใหม่',
 status: taskData.status || 'To Do',
 ...taskData,
 updatedAt: new Date().toISOString(),
 };
 try {
 await saveTask(task);
 showNotification('บันทึกเรียบร้อย');
 } catch (e: any) {
 showNotification(`บันทึกไม่สำเร็จ: ${e.message}`, true);
 }
 }, [showNotification]);

 const handleUpdateTask = useCallback(async (task: Task) => {
 const updated = { ...task, updatedAt: new Date().toISOString() };
 // Optimistic update
 setTasks(prev => {
 const next = prev.map(t => t.id === task.id ? updated : t);
 lsSet(LS_TASKS, next);
 return next;
 });
 // Update selected task if open
 setSelectedTask(prev => prev?.id === task.id ? updated : prev);
 try {
 await saveTask(updated);
 } catch (e: any) {
 showNotification(`อัปเดตไม่สำเร็จ: ${e.message}`, true);
 }
 }, [showNotification]);

 const handleCreateTask = useCallback(async (taskData: Partial<Task>) => {
 if (editingTask) {
 await handleUpdateTask({ ...editingTask, ...taskData });
 setEditingTask(null);
 } else {
 await handleSaveTask({
 ...taskData,
 pipelineStage: (newTaskPipelineStage as any) || taskData.pipelineStage,
 });
 }
 setNewTaskPipelineStage(undefined);
 }, [editingTask, handleUpdateTask, handleSaveTask, newTaskPipelineStage]);

 const handleDeleteTask = useCallback(async (id: string | number) => {
 if (!window.confirm('ลบงานนี้ใช่ไหม? ไม่สามารถกู้คืนได้')) return;
 setTasks(prev => { const next = prev.filter(t => t.id !== id); lsSet(LS_TASKS, next); return next; });
 setSelectedTask(null);
 try {
 await dbDeleteTask(id);
 showNotification('ลบเรียบร้อย');
 } catch (e: any) {
 showNotification(`ลบไม่สำเร็จ: ${e.message}`, true);
 }
 }, [showNotification]);

 const handleTaskDrop = useCallback(async (taskId: string, targetStatus: string) => {
 const task = tasks.find(t => t.id.toString() === taskId);
 if (!task) return;
 await handleUpdateTask({ ...task, status: targetStatus });
 }, [tasks, handleUpdateTask]);

 const handleTaskClick = useCallback((task: Task) => {
 setSelectedTask(task);
 }, []);

 const handleEditClick = useCallback((task: Task) => {
 setEditingTask(task);
 setSelectedTask(null);
 setIsTaskModalOpen(true);
 }, []);

 // ── Client handlers ───────────────────────────────────────────────────────
 const handleSaveClient = useCallback(async (clientData: Partial<Client>) => {
 const client: Client = { id: clientData.id || `C-${Date.now()}`, name: clientData.name || 'ลูกค้าใหม่', ...clientData };
 try { await saveClient(client); showNotification('บันทึกลูกค้าเรียบร้อย'); }
 catch (e: any) { showNotification(`บันทึกไม่สำเร็จ: ${e.message}`, true); }
 }, [showNotification]);

 const handleDeleteClient = useCallback(async (id: string) => {
 if (!window.confirm('ลบลูกค้าใช่ไหม?')) return;
 setClients(prev => { const next = prev.filter(c => c.id !== id); lsSet(LS_CLIENTS, next); return next; });
 try { await dbDeleteClient(id); showNotification('ลบลูกค้าเรียบร้อย'); }
 catch (e: any) { showNotification(`ลบไม่สำเร็จ: ${e.message}`, true); }
 }, [showNotification]);

 // ── Template handlers ─────────────────────────────────────────────────────
 const handleSaveTemplate = useCallback(async (tmpl: Template) => {
 const template: Template = { id: tmpl.id || `T-${Date.now()}`, name: tmpl.name || 'เทมเพลตใหม่', ...tmpl };
 try { await saveTemplate(template); showNotification('บันทึกเทมเพลตเรียบร้อย'); }
 catch (e: any) { showNotification(`บันทึกไม่สำเร็จ: ${e.message}`, true); }
 }, [showNotification]);

 const handleDeleteTemplate = useCallback(async (id: string) => {
 if (!window.confirm('ลบเทมเพลตใช่ไหม?')) return;
 setTemplates(prev => { const next = prev.filter(t => t.id !== id); lsSet(LS_TEMPLATES, next); return next; });
 try { await dbDeleteTemplate(id); showNotification('ลบเทมเพลตเรียบร้อย'); }
 catch (e: any) { showNotification(`ลบไม่สำเร็จ: ${e.message}`, true); }
 }, [showNotification]);

 // ── Idea handlers ─────────────────────────────────────────────────────────
 const handleSaveIdea = useCallback(async (idea: Idea) => {
 // Optimistic
 setIdeas(prev => {
 const existing = prev.findIndex(i => i.id === idea.id);
 const next = existing >= 0 ? prev.map(i => i.id === idea.id ? idea : i) : [...prev, idea];
 lsSet(LS_IDEAS, next);
 return next;
 });
 try { await saveIdea(idea); }
 catch (e: any) { showNotification(`บันทึกไอเดียไม่สำเร็จ: ${e.message}`, true); }
 }, [showNotification]);

 const handleDeleteIdea = useCallback(async (id: string) => {
 setIdeas(prev => { const next = prev.filter(i => i.id !== id); lsSet(LS_IDEAS, next); return next; });
 try { await dbDeleteIdea(id); showNotification('ลบไอเดียเรียบร้อย'); }
 catch (e: any) { showNotification(`ลบไม่สำเร็จ: ${e.message}`, true); }
 }, [showNotification]);

 const handleUpdateIdea = useCallback(async (idea: Idea) => {
 setIdeas(prev => { const next = prev.map(i => i.id === idea.id ? idea : i); lsSet(LS_IDEAS, next); return next; });
 try { await saveIdea(idea); }
 catch (e: any) { showNotification(`อัปเดตไอเดียไม่สำเร็จ: ${e.message}`, true); }
 }, [showNotification]);

 // ── Content plan handlers ──────────────────────────────────────────────────
 const handleSaveContentPlan = useCallback(async (plan: ContentPlan) => {
 let savedPlan = plan;
 try {
 const res = await fetch('/api/notion/content-plans', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(plan),
 });
 if (res.ok) {
 const { notionPageId, notionUrl } = await res.json();
 savedPlan = { ...plan, notionPageId, notionUrl };
 }
 } catch { /* Notion unavailable */ }

 try {
 await saveContentPlan(savedPlan);
 showNotification('บันทึกแผนคอนเทนต์เรียบร้อย' + (savedPlan.notionUrl ? ' · ซิงค์ Notion แล้ว ' : ''));
 } catch { showNotification('บันทึกแผนคอนเทนต์ไม่สำเร็จ', true); }
 }, [showNotification]);

 const handleDeleteContentPlan = useCallback(async (id: string) => {
 try {
 await dbDeleteContentPlan(id);
 showNotification('ลบแผนคอนเทนต์เรียบร้อย');
 } catch { showNotification('ลบแผนคอนเทนต์ไม่สำเร็จ', true); }
 }, [showNotification]);

 const handleUpdateContentPlan = useCallback(async (plan: ContentPlan) => {
 try {
 await saveContentPlan(plan);
 } catch { /* silent */ }
 if (plan.notionPageId) {
 try {
 await fetch(`/api/notion/content-plans/${plan.notionPageId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(plan),
 });
 } catch { /* silent */ }
 }
 }, []);

 // ── Category handlers ──────────────────────────────────────────────────────
 const handleCreateCategory = useCallback(async (cat: Omit<ProjectCategory, 'id' | 'createdAt'>) => {
 const newCat: ProjectCategory = { ...cat, id: `CAT-${Date.now()}`, createdAt: new Date().toISOString() };
 try {
 await saveCategory(newCat);
 showNotification('สร้าง Category เรียบร้อย');
 } catch { showNotification('สร้าง Category ไม่สำเร็จ', true); }
 }, [showNotification]);

 const handleDeleteCategory = useCallback(async (id: string) => {
 if (!window.confirm('ลบ Category นี้ใช่ไหม?')) return;
 try {
 await dbDeleteCategory(id);
 } catch { showNotification('ลบ Category ไม่สำเร็จ', true); }
 }, [showNotification]);

 // ── Consult agent ──────────────────────────────────────────────────────────
 const handleConsultAgent = useCallback((agentId: string, _initialPrompt?: string) => {
 setSelectedAgent(agentId);
 }, []);

 // ── New task from pipeline ─────────────────────────────────────────────────
 const handleNewPipelineTask = useCallback((stage: string) => {
 setNewTaskPipelineStage(stage);
 setEditingTask(null);
 setIsTaskModalOpen(true);
 }, []);

 // ── Filtered data ─────────────────────────────────────────────────────────
 const q = searchQuery.toLowerCase();
 const filteredTasks = q ? tasks.filter(t => t.name.toLowerCase().includes(q) || (t.customer || '').toLowerCase().includes(q)) : tasks;
 const filteredClients = q ? clients.filter(c => c.name.toLowerCase().includes(q) || (c.taxId || '').includes(q)) : clients;
 const filteredTemplates = q ? templates.filter(t => t.name.toLowerCase().includes(q)) : templates;

 // Category-filtered tasks
 const categoryTasks = activeCategoryId ? filteredTasks.filter(t => t.categoryId === activeCategoryId) : filteredTasks;

 // ── View renderer ─────────────────────────────────────────────────────────
 const renderView = () => {
 switch (currentView) {
 case 'briefing':
 return (
 <BriefingView
 tasks={filteredTasks} clients={clients} ideas={ideas}
 onTaskClick={handleTaskClick}
 onUpdateTask={handleUpdateTask}
 onSaveTask={handleSaveTask}
 onSaveIdea={handleSaveIdea}
 onViewChange={setCurrentView}
 onConsultAgent={handleConsultAgent}
 showNotification={showNotification}
 />
 );

 case 'board':
 return (
 <BoardView
 tasks={categoryTasks}
 onTaskDrop={handleTaskDrop}
 onTaskClick={handleTaskClick}
 />
 );

 case 'list':
 return (
 <ListView
 tasks={categoryTasks}
 clients={clients}
 onTaskClick={handleTaskClick}
 onStatusChange={(id, status) => {
 const t = tasks.find(t => t.id.toString() === id);
 if (t) handleUpdateTask({ ...t, status });
 }}
 onConsultAgent={(id) => handleConsultAgent('daily_briefer')}
 />
 );

 case 'gantt': return <GanttView tasks={filteredTasks} />;
 case 'calendar': return <CalendarView tasks={filteredTasks} />;

 case 'dashboard':
 return <DashboardView tasks={filteredTasks} />;

 case 'pipeline':
 return (
 <PipelineView
 tasks={filteredTasks} clients={clients}
 onTaskClick={handleTaskClick}
 onUpdateTask={handleUpdateTask}
 onNewTask={handleNewPipelineTask}
 />
 );

 case 'categories':
 return (
 <CategoryDashboardView
 categories={categories}
 tasks={filteredTasks}
 onEnterCategory={(id) => { setActiveCategoryId(id); setCurrentView('board'); }}
 onCreateCategory={handleCreateCategory}
 onDeleteCategory={handleDeleteCategory}
 />
 );

 case 'clients':
 return (
 <ClientsView
 clients={filteredClients}
 onCreateClient={handleSaveClient}
 onDeleteClient={handleDeleteClient}
 />
 );

 case 'templates':
 return (
 <TemplatesView
 templates={filteredTemplates}
 onCreateTemplate={handleSaveTemplate}
 onDeleteTemplate={handleDeleteTemplate}
 />
 );

 case 'docflow':
 return (
 <DocFlowView
 onOpenSettings={() => setIsDocSettingsOpen(true)}
 showNotification={showNotification}
 clients={filteredClients}
 settingsVersion={settingsVersion}
 />
 );

 case 'agents':
 return <AgentsView onAgentClick={setSelectedAgent} />;

 case 'ideas':
 return (
 <IdeasView
 ideas={ideas}
 onSaveIdea={handleSaveIdea}
 onDeleteIdea={handleDeleteIdea}
 onUpdateIdea={handleUpdateIdea}
 />
 );

 case 'content_plan':
 return (
 <ContentPlanView
 contentPlans={contentPlans}
 onSaveContentPlan={handleSaveContentPlan}
 onDeleteContentPlan={handleDeleteContentPlan}
 onUpdateContentPlan={handleUpdateContentPlan}
 />
 );

 default:
 return (
 <BoardView
 tasks={filteredTasks}
 onTaskDrop={handleTaskDrop}
 onTaskClick={handleTaskClick}
 />
 );
 }
 };

 // ── Loading splash ────────────────────────────────────────────────────────
 if (authLoading) {
 return (
 <div className="h-full flex items-center justify-center app-bg">
 <div className="flex flex-col items-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-2xl shadow-xl animate-pulse">M</div>
 <p className="text-slate-500 text-sm font-semibold">กำลังโหลด ModtyTasks...</p>
 </div>
 </div>
 );
 }

 // ── Auth gate ─────────────────────────────────────────────────────────────
 if (!authed) {
 return <LoginModal onLogin={() => setAuthed(true)} />;
 }

 // ── Active category name for header ───────────────────────────────────────
 const activeCategoryName = activeCategoryId
 ? categories.find(c => c.id === activeCategoryId)?.name
 : undefined;

 return (
 <div
 className="text-[#0f172a] flex overflow-hidden font-sans relative app-bg"
 style={{ height: '100%' }}
 >
 <Sidebar
 currentView={currentView}
 onViewChange={(view) => {
 setCurrentView(view);
 setActiveCategoryId(null);
 }}
 isMobileOpen={isMobileOpen}
 setIsMobileOpen={setIsMobileOpen}
 />

 <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
 <Header
 currentView={currentView}
 isSyncing={false}
 onNewTaskClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
 onMenuClick={() => setIsMobileOpen(true)}
 onSearchChange={setSearchQuery}
 categoryName={activeCategoryName}
 onBgUpload={handleBgUpload}
 onBgRemove={handleBgRemove}
 />

 <main className="flex-1 relative overflow-hidden flex flex-col">
 {renderView()}
 </main>
 </div>

 {/* Notifications */}
 <div className="fixed bottom-5 right-5 z-[90] flex flex-col gap-2 pointer-events-none">
 {notifications.map(n => (
 <div
 key={n.id}
 className={`px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 animate-fade-in ${n.isError ? 'bg-rose-500' : 'bg-emerald-500'}`}
 >
 <CheckCircle className="w-4 h-4 shrink-0" /> {n.message}
 </div>
 ))}
 </div>

 {/* Project Page (full task detail) */}
 {selectedTask && (
 <ProjectPage
 task={selectedTask}
 tasks={tasks}
 clients={clients}
 onClose={() => setSelectedTask(null)}
 onUpdateTask={handleUpdateTask}
 onDeleteTask={handleDeleteTask}
 onEdit={handleEditClick}
 onConsultAgent={(taskId, agentId) => handleConsultAgent(agentId || 'daily_briefer')}
 onSaveAsTemplate={handleSaveTemplate}
 />
 )}

 {/* Task create/edit modal */}
 <TaskModal
 isOpen={isTaskModalOpen}
 onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setNewTaskPipelineStage(undefined); }}
 onSave={handleCreateTask}
 initialTask={editingTask}
 categories={categories}
 />

 {/* Agent modal */}
 <AgentModal agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />

 {/* Standup modal */}
 <StandupModal isOpen={isStandupOpen} onClose={() => setIsStandupOpen(false)} tasks={tasks} />

 {/* Doc settings modal */}
 <DocSettingsModal
 isOpen={isDocSettingsOpen}
 onClose={() => setIsDocSettingsOpen(false)}
 onSave={() => { setSettingsVersion(v => v + 1); showNotification('บันทึกการตั้งค่าแล้วค่ะ'); }}
 />

 {/* Theme settings modal */}
 {isThemeOpen && <ThemeSettingsModal onClose={() => { setIsThemeOpen(false); applyTheme(); }} />}
 </div>
 );
}
