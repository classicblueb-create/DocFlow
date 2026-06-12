import { Bot, X } from 'lucide-react';
import { Task } from '../../types';
import { cn } from '../../lib/utils';

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export function StandupModal({ isOpen, onClose, tasks }: StandupModalProps) {
  if (!isOpen) return null;

  // Find tasks to focus on:
  // 1. High/Urgent priority tasks that are not Done
  // 2. In Progress tasks
  // 3. To Do tasks
  const urgentTasks = tasks.filter(t => t.status !== 'Done' && (t.priority?.includes('สูง') || t.priority?.includes('High') || t.priority?.includes('ด่วน') || t.priority?.includes('Urgent')));
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังดำเนินการ' || t.status === 'กำลังทำ');
  const todoTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ');

  // Select up to 3 focus tasks
  const focusTasks: { label: string, name: string, colorClass: string, dotClass: string }[] = [];

  urgentTasks.slice(0, 2).forEach(t => {
    focusTasks.push({
      label: 'งานด่วน',
      name: t.name,
      colorClass: 'bg-red-50 text-red-700 border-red-100',
      dotClass: 'bg-red-500'
    });
  });

  if (focusTasks.length < 3) {
    inProgressTasks.slice(0, 3 - focusTasks.length).forEach(t => {
      focusTasks.push({
        label: 'กำลังทำ',
        name: t.name,
        colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
        dotClass: 'bg-amber-500'
      });
    });
  }

  if (focusTasks.length < 3) {
    todoTasks.slice(0, 3 - focusTasks.length).forEach(t => {
      focusTasks.push({
        label: 'รอดำเนินการ',
        name: t.name,
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        dotClass: 'bg-indigo-500'
      });
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-500"/> สรุปงานประจำวัน
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            {focusTasks.length > 0 
              ? `สวัสดีค่ะ! วันนี้มีงานที่แนะนำให้คุณโฟกัส ${focusTasks.length} งานนะคะ:` 
              : "สวัสดีค่ะ! วันนี้ไม่มีงานค้างในระบบเลยค่ะ เก่งมากๆ!"
            }
          </p>
          <ul className="space-y-3 text-sm font-medium">
            {focusTasks.map((task, idx) => (
              <li key={idx} className={cn("flex items-center gap-3 p-3 border rounded-lg", task.colorClass)}>
                <div className={cn("w-2 h-2 rounded-full", task.dotClass)}></div> 
                <div className="flex-1">{task.label}: <span className="font-bold">{task.name}</span></div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
             <button onClick={onClose} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600 transition-colors">รับทราบ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
