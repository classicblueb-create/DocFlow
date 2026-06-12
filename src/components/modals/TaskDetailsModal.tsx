import { X, Trash2, Copy, Edit3 } from 'lucide-react';
import { Task, Template } from '../../types';

interface TaskDetailsModalProps {
  task: Task | null;
  onClose: () => void;
  onDelete: (id: string | number) => void;
  onSaveAsTemplate: (template: Template) => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailsModal({ task, onClose, onDelete, onSaveAsTemplate, onEdit }: TaskDetailsModalProps) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[75] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between bg-gray-50 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">{task.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ลูกค้า</p>
              <p className="font-medium text-gray-800">{task.customer || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">สถานะ</p>
              <span className="font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded inline-block">{task.status}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ราคา</p>
              <p className="font-medium text-emerald-600 text-lg">฿{(task.price || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ความสำคัญ</p>
              <p className="font-medium text-gray-800">{task.priority || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">หมวดหมู่</p>
              <p className="font-medium text-gray-800">{task.tags || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">วันที่เริ่ม</p>
              <p className="font-medium text-gray-800">{task.startDate || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">กำหนดส่ง</p>
              <p className="font-medium text-gray-800">{task.endDate || '-'}</p>
            </div>
            {(task.details || task.subtasks) && (
                <div className="col-span-1 sm:col-span-2 pt-4 border-t border-gray-100">
                    {task.details && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">รายละเอียดงาน</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.details}</p>
                        </div>
                    )}
                    {task.subtasks && (
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">งานย่อย (Action Steps)</p>
                            {(() => {
                                try {
                                    const parsed = JSON.parse(task.subtasks);
                                    if (Array.isArray(parsed)) {
                                        return (
                                            <div className="space-y-2">
                                                {parsed.map((step, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100">
                                                        <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"></div>
                                                        {step}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                } catch (e) {}
                                return <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.subtasks}</p>;
                            })()}
                        </div>
                    )}
                </div>
            )}
            {(task.aiAnalysis || task.aiEmail || task.aiCourse) && (
                <div className="col-span-1 sm:col-span-2 pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-clickup-purple mb-3 text-sm">ข้อมูล AI (AI Generated Data)</h3>
                    <div className="space-y-4">
                        {task.aiAnalysis && (
                            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider mb-1">ผลวิเคราะห์ AI</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.aiAnalysis}</p>
                            </div>
                        )}
                        {task.aiEmail && (
                            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider mb-1">ร่างอีเมล</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.aiEmail}</p>
                            </div>
                        )}
                        {task.aiCourse && (
                            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider mb-1">ร่างคอร์ส</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.aiCourse}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
        <div className="p-5 flex justify-end gap-2 border-t border-gray-100 rounded-b-2xl bg-gray-50">
          <button 
            onClick={() => onEdit(task)}
            className="bg-[#17171f] text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-black transition-colors"
          >
            <Edit3 className="w-4 h-4"/> แก้ไขงาน
          </button>
          <button 
            onClick={() => { 
                onSaveAsTemplate({
                    id: `T-${Date.now()}`,
                    name: task.name,
                    price: task.price || 0,
                    details: 'Template from task'
                }); 
                onClose(); 
            }} 
            className="bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
          >
            <Copy className="w-4 h-4"/> บันทึกเป็นเทมเพลต
          </button>
          <button 
            onClick={() => { onDelete(task.id); onClose(); }} 
            className="text-red-500 hover:bg-red-50 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4"/> ลบ
          </button>
        </div>
      </div>
    </div>
  );
}
