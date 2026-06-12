/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Mic, CheckCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BoardView } from './components/views/BoardView';
import { DashboardView } from './components/views/DashboardView';
import { ClientsView, TemplatesView } from './components/views/ListViews';
import { CalendarView, GanttView } from './components/views/Placeholders';
import { DocFlowView } from './components/views/DocFlowView';
import { AgentsView } from './components/views/AgentsView';
import { TaskModal } from './components/modals/TaskModal';
import { TaskDetailsModal } from './components/modals/TaskDetailsModal';
import { AgentModal } from './components/modals/AgentModal';
import { StandupModal } from './components/modals/StandupModal';
import { DocSettingsModal } from './components/modals/DocSettingsModal';
import { ViewType, Task, Client, Template } from './types';
import { syncToSheet, fetchInitialData } from './lib/api';
import { initAuth, googleSignIn } from './lib/auth';
import type { User } from 'firebase/auth';

interface AppNotification {
  id: number;
  message: string;
  isError: boolean;
}

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [currentView, setCurrentView] = useState<ViewType>('board');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Local Mode');
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isStandupModalOpen, setIsStandupModalOpen] = useState(false);
  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const local = localStorage.getItem('docflow_local_tasks');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const local = localStorage.getItem('docflow_local_clients');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const local = localStorage.getItem('docflow_local_templates');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setUser(user);
        setToken(token);
        setNeedsAuth(false);
        setIsSyncing(true);
        try {
          const { 
            fetchTasksFromSheet, 
            fetchClientsFromSheet, 
            fetchTemplatesFromSheet,
            syncAllTasksToSheet,
            syncAllClientsToSheet,
            syncAllTemplatesToSheet 
          } = await import('./lib/sheets');

          // 1. Sync Tasks
          const fetchedTasks = await fetchTasksFromSheet();
          if (fetchedTasks.length > 0) {
            setTasks(fetchedTasks);
            localStorage.setItem('docflow_local_tasks', JSON.stringify(fetchedTasks));
          } else {
            // Sheet is empty - use local cache or fallback mocks and sync up
            const localTasksVal = localStorage.getItem('docflow_local_tasks');
            const tasksToSync = localTasksVal ? JSON.parse(localTasksVal) : [
              { id: '1', name: 'รีวิว Tiktok 1 คลิป คอร์ส RAG AI', status: 'To Do', price: 7009.35, priority: 'สูง (High)' },
              { id: '2', name: 'เขียนบทความ SEO', status: 'In Progress', price: 3500, priority: 'ปานกลาง (Medium)' },
              { id: '3', name: 'ระบบเชื่อม Google Sheets', status: 'Done', price: 15000, priority: 'ด่วน (Urgent)' },
            ];
            setTasks(tasksToSync);
            localStorage.setItem('docflow_local_tasks', JSON.stringify(tasksToSync));
            await syncAllTasksToSheet(tasksToSync);
          }

          // 2. Sync Clients
          const fetchedClients = await fetchClientsFromSheet();
          if (fetchedClients.length > 0) {
            setClients(fetchedClients);
            localStorage.setItem('docflow_local_clients', JSON.stringify(fetchedClients));
          } else {
            const localClientsVal = localStorage.getItem('docflow_local_clients');
            const clientsToSync = localClientsVal ? JSON.parse(localClientsVal) : [
              { id: 'C001', name: 'บริษัท ไลค์มี เอ็กซ์ จำกัด', address: 'กรุงเทพมหานคร', taxId: '0105562056070', targetBudget: 50000, color: 'blue' },
              { id: 'C002', name: 'Shipify Logistics', address: 'กรุงเทพฯ', taxId: '0105512345678', targetBudget: 65000, color: 'indigo' }
            ];
            setClients(clientsToSync);
            localStorage.setItem('docflow_local_clients', JSON.stringify(clientsToSync));
            await syncAllClientsToSheet(clientsToSync);
          }

          // 3. Sync Templates
          const fetchedTemplates = await fetchTemplatesFromSheet();
          if (fetchedTemplates.length > 0) {
            setTemplates(fetchedTemplates);
            localStorage.setItem('docflow_local_templates', JSON.stringify(fetchedTemplates));
          } else {
            const localTemplatesVal = localStorage.getItem('docflow_local_templates');
            const templatesToSync = localTemplatesVal ? JSON.parse(localTemplatesVal) : [
              { id: 'T001', name: 'สร้างเว็บไซต์ E-commerce', price: 45000, details: 'พัฒนาหน้า Storefront' }
            ];
            setTemplates(templatesToSync);
            localStorage.setItem('docflow_local_templates', JSON.stringify(templatesToSync));
            await syncAllTemplatesToSheet(templatesToSync);
          }

          setSyncStatus('Data Synced Successfully');
        } catch (e: any) {
           console.error("Sheets sync error:", e);
           setSyncStatus('Sync Failed (Local mode)');
        } finally {
           setIsSyncing(false);
        }
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-800">DocFlow Docs & Task Sync</h1>
        <p className="text-gray-500">Sign in with Google to access your Workspace integration</p>
        <button onClick={handleLogin} disabled={isLoggingIn} className="gsi-material-button disabled:opacity-50">
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper flex items-center gap-3 px-4 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50">
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents font-medium text-gray-700">Sign in with Google</span>
          </div>
        </button>
      </div>
    );
  }

  const showNotification = (message: string, isError = false) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, isError }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleTaskDrop = async (taskId: string, targetStatus: string) => {
    const updatedTasks = tasks.map(t => t.id.toString() === taskId ? { ...t, status: targetStatus } : t);
    setTasks(updatedTasks);
    localStorage.setItem('docflow_local_tasks', JSON.stringify(updatedTasks));
    
    // Background sync
    try {
       const { syncAllTasksToSheet } = await import('./lib/sheets');
       await syncAllTasksToSheet(updatedTasks);
       setSyncStatus('Data Synced Successfully');
    } catch (e) {
       console.error(e);
       setSyncStatus('Sync Failed');
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    let updatedTasks = [...tasks];
    if (editingTask) {
        updatedTasks = tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t);
        setTasks(updatedTasks);
        localStorage.setItem('docflow_local_tasks', JSON.stringify(updatedTasks));
        showNotification('อัปเดตข้อมูลเรียบร้อย');
        setEditingTask(null);
    } else {
        const newTask: Task = {
            id: Date.now().toString(),
            name: taskData.name || 'งานใหม่',
            status: taskData.status || 'To Do',
            customer: taskData.customer,
            price: taskData.price || 0,
            startDate: taskData.startDate,
            endDate: taskData.endDate,
            tags: taskData.tags,
            details: taskData.details,
            subtasks: taskData.subtasks,
            aiAnalysis: taskData.aiAnalysis,
            aiEmail: taskData.aiEmail,
            aiCourse: taskData.aiCourse,
            priority: taskData.priority
        };
        updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        localStorage.setItem('docflow_local_tasks', JSON.stringify(updatedTasks));
        showNotification('บันทึกเรียบร้อย');
    }

    try {
      setIsSyncing(true);
      const { syncAllTasksToSheet } = await import('./lib/sheets');
      await syncAllTasksToSheet(updatedTasks);
      setSyncStatus('Data Synced Successfully');
    } catch (e) {
      console.error(e);
      setSyncStatus('Sync Failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string | number) => {
      const confirmed = window.confirm("Are you sure you want to delete this task? This action cannot be undone.");
      if (!confirmed) return;

      const updatedTasks = tasks.filter(t => t.id !== id);
      setTasks(updatedTasks);
      localStorage.setItem('docflow_local_tasks', JSON.stringify(updatedTasks));
      showNotification('ลบเรียบร้อย');

      try {
        setIsSyncing(true);
        const { syncAllTasksToSheet } = await import('./lib/sheets');
        await syncAllTasksToSheet(updatedTasks);
        setSyncStatus('Data Synced Successfully');
      } catch (e) {
        console.error(e);
        setSyncStatus('Sync Failed');
      } finally {
        setIsSyncing(false);
      }
  };

  const handleSaveTemplate = async (temp: Template) => {
      const updated = [...templates, temp];
      setTemplates(updated);
      localStorage.setItem('docflow_local_templates', JSON.stringify(updated));
      showNotification('บันทึกเป็นเทมเพลตเรียบร้อย');
      try {
        const { syncAllTemplatesToSheet } = await import('./lib/sheets');
        await syncAllTemplatesToSheet(updated);
      } catch (e) {
        console.error("Failed to sync templates:", e);
      }
  };

  const handleCreateClient = async (clientData: Partial<Client>) => {
    const newClient: Client = {
      id: clientData.id || `C-${Date.now()}`,
      name: clientData.name || 'ลูกค้าใหม่',
      address: clientData.address || '',
      taxId: clientData.taxId || '',
      targetBudget: clientData.targetBudget || 0,
      color: clientData.color || 'blue'
    };
    const updated = [...clients, newClient];
    setClients(updated);
    localStorage.setItem('docflow_local_clients', JSON.stringify(updated));
    showNotification('เพิ่มรายชื่อลูกค้าเรียบร้อย');
    try {
      const { syncAllClientsToSheet } = await import('./lib/sheets');
      await syncAllClientsToSheet(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this client?");
    if (!confirmed) return;
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem('docflow_local_clients', JSON.stringify(updated));
    showNotification('ลบข้อมูลลูกค้าเรียบร้อย');
    try {
      const { syncAllClientsToSheet } = await import('./lib/sheets');
      await syncAllClientsToSheet(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<Template>) => {
    const newTemplate: Template = {
      id: templateData.id || `T-${Date.now()}`,
      name: templateData.name || 'เทมเพลตใหม่',
      price: templateData.price || 0,
      details: templateData.details || ''
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('docflow_local_templates', JSON.stringify(updated));
    showNotification('เพิ่มเทมเพลตเรียบร้อย');
    try {
      const { syncAllTemplatesToSheet } = await import('./lib/sheets');
      await syncAllTemplatesToSheet(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this template?");
    if (!confirmed) return;
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('docflow_local_templates', JSON.stringify(updated));
    showNotification('ลบเทมเพลตเรียบร้อย');
    try {
      const { syncAllTemplatesToSheet } = await import('./lib/sheets');
      await syncAllTemplatesToSheet(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.customer && t.customer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.taxId.includes(searchQuery)
  );

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderView = () => {
    switch (currentView) {
      case 'board': return <BoardView tasks={filteredTasks} onTaskDrop={handleTaskDrop} onTaskClick={setSelectedTask} />;
      case 'gantt': return <GanttView tasks={tasks} />;
      case 'calendar': return <CalendarView tasks={tasks} />;
      case 'dashboard': return <DashboardView tasks={tasks} />;
      case 'clients': return <ClientsView clients={filteredClients} onCreateClient={handleCreateClient} onDeleteClient={handleDeleteClient} />;
      case 'templates': return <TemplatesView templates={filteredTemplates} onCreateTemplate={handleCreateTemplate} onDeleteTemplate={handleDeleteTemplate} />;
      case 'docflow': return <DocFlowView onOpenSettings={() => setIsDocSettingsOpen(true)} showNotification={showNotification} clients={filteredClients} settingsVersion={settingsVersion} />;
      case 'agents': return <AgentsView onAgentClick={setSelectedAgent} />;
      default: return <BoardView tasks={filteredTasks} onTaskDrop={handleTaskDrop} onTaskClick={setSelectedTask} />;
    }
  };

  return (
    <div className="text-gray-800 h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        syncStatus={syncStatus}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <Header 
          currentView={currentView}
          dbSyncStatusText={syncStatus}
          isSyncing={isSyncing}
          onNewTaskClick={() => setIsTaskModalOpen(true)}
          onMenuClick={() => setIsMobileOpen(true)}
          onSearchChange={setSearchQuery}
        />
        
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {renderView()}

          {/* Floating Voice Button */}
          <button onClick={() => setIsStandupModalOpen(true)} className="absolute bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-clickup-purple text-white flex items-center justify-center hover:bg-indigo-600 shadow-xl transition-all hover:scale-105">
            <Mic className="w-6 h-6" />
          </button>
        </main>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-5 right-5 z-[90] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white flex items-center gap-2 transition-all ${n.isError ? 'bg-red-500' : 'bg-emerald-500'}`}>
            <CheckCircle className="w-4 h-4" /> {n.message}
          </div>
        ))}
      </div>

      {/* Modals */}
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
        }} 
        onSave={handleCreateTask} 
        initialTask={editingTask}
      />
      <TaskDetailsModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onDelete={handleDeleteTask} 
        onSaveAsTemplate={handleSaveTemplate} 
        onEdit={handleEditClick}
      />
      <AgentModal agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />
      <StandupModal isOpen={isStandupModalOpen} onClose={() => setIsStandupModalOpen(false)} tasks={tasks} />
      <DocSettingsModal isOpen={isDocSettingsOpen} onClose={() => setIsDocSettingsOpen(false)} onSave={() => { setSettingsVersion(v => v + 1); showNotification("บันทึกการตั้งค่าแล้วค่ะ"); }} />
    </div>
  );
}

