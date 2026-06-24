import { X, Trash2, Edit3 } from 'lucide-react';
import { Task, Template } from '../../types';
import { cn } from '../../lib/utils';

interface TaskDetailsModalProps {
  task: Task | null;
  onClose: () => void;
  onDelete: (id: string | number) => void;
  onSaveAsTemplate: (template: Template) => void;
  onEdit: (task: Task) => void;
}

function AssigneeBadge({ assignee }: { assignee?: 'Fan' | 'Mod' }) {
  if (!assignee) return null;
  return (
    <span className={cn(
      'text-[10px] font-black px-2 py-0.5 rounded-full border',
      assignee === 'Fan'
        ? 'bg-violet-100 text-violet-700 border-violet-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
    )}>
      {assignee}
    </span>
  );
}

export function TaskDetailsModal({ task, onClose, onDelete, onSaveAsTemplate, onEdit }: TaskDetailsModalProps) {
  if (!task) return null;

  const subtaskList = (() => {
    if (!task.subtasks) return null;
    try {
      const parsed = JSON.parse(task.subtasks);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return null;
  })();

  return (
    <div className="fixed inset-0 bg-black/40 z-[75] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-2xl shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-800 leading-snug">{task.name}</h2>
              {task.customer && <p className="text-sm text-slate-400 font-medium mt-0.5">{task.customer}</p>}
            </div>
            <AssigneeBadge assignee={task.assignee} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">สถานะ</p>
              <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg inline-block text-sm">{task.status}</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">ความสำคัญ</p>
              <p className="font-semibold text-slate-700 text-sm">{task.priority || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">ราคา</p>
              <p className="font-bold text-emerald-600 text-lg">฿{(task.price || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">ผู้รับผิดชอบ</p>
              <AssigneeBadge assignee={task.assignee} />
              {!task.assignee && <p className="text-sm text-slate-400">—</p>}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">วันเริ่ม</p>
              <p className="font-medium text-slate-700 text-sm">{task.startDate || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">กำหนดส่ง</p>
              <p className="font-medium text-slate-700 text-sm">{task.endDate || '—'}</p>
            </div>
            {task.tags && (
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">แท็ก</p>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.split(',').map(t => (
                    <span key={t} className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {(task.details || subtaskList) && (
              <div className="col-span-2 pt-3 border-t border-slate-100 space-y-4">
                {task.details && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">รายละเอียดงาน</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{task.details}</p>
                  </div>
                )}
                {subtaskList && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">งานย่อย</p>
                    <div className="space-y-1.5">
                      {subtaskList.map((step: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                            (step.status === 'done' || step.completed) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                          )} />
                          <span className={cn('flex-1', (step.status === 'done' || step.completed) && 'line-through text-slate-400')}>
                            {step.name || step.text || step}
                          </span>
                          {step.assignee && <AssigneeBadge assignee={step.assignee} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(task.aiAnalysis || task.aiEmail || task.aiCourse) && (
              <div className="col-span-2 pt-3 border-t border-slate-100 space-y-3">
                <h3 className="font-bold text-indigo-600 text-xs uppercase tracking-wider">AI Generated Data</h3>
                {task.aiAnalysis && (
                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">ผลวิเคราะห์ AI</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.aiAnalysis}</p>
                  </div>
                )}
                {task.aiEmail && (
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">ร่างอีเมล</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.aiEmail}</p>
                  </div>
                )}
                {task.aiCourse && (
                  <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-1">ร่างคอร์ส</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.aiCourse}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 flex justify-end gap-2 border-t border-slate-100 rounded-b-2xl bg-slate-50 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="flex items-center gap-1.5 bg-slate-900 text-white font-bold px-4 py-2 rounded-xl hover:bg-black transition-colors cursor-pointer text-sm"
          >
            <Edit3 className="w-4 h-4" /> แก้ไขงาน
          </button>
          <button
            onClick={() => {
              onSaveAsTemplate({ id: `T-${Date.now()}`, name: task.name, price: task.price, details: task.details });
              onClose();
            }}
            className="flex items-center gap-1.5 bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer text-sm border border-blue-200"
          >
            บันทึกเป็นเทมเพลต
          </button>
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer text-sm"
          >
            <Trash2 className="w-4 h-4" /> ลบ
          </button>
        </div>
      </div>
    </div>
  );
}
