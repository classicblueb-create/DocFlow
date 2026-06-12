import { Task } from '../../types';
import { cn } from '../../lib/utils';

interface BoardViewProps {
  tasks: Task[];
  onTaskDrop: (taskId: string, targetStatus: string) => void;
  onTaskClick: (task: Task) => void;
}

export function BoardView({ tasks, onTaskDrop, onTaskClick }: BoardViewProps) {
  const columns = [
    { id: 'To Do', label: 'To Do', color: 'gray' },
    { id: 'In Progress', label: 'In Progress', color: 'indigo' },
    { id: 'Done', label: 'Complete', color: 'emerald' },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    onTaskDrop(id, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar p-6 flex">
      <div className="flex gap-6 h-full items-start w-max min-w-full">
        {columns.map(col => {
          const colTasks = tasks.filter(t => {
            if (col.id === 'To Do') return t.status === 'To Do' || t.status === 'รอดำเนินการ' || !t.status;
            return t.status === col.id;
          });
          const bgMap: Record<string, string> = {
            'gray': 'bg-gray-100/50 border-gray-200',
            'indigo': 'bg-indigo-50/30 border-indigo-100',
            'emerald': 'bg-emerald-50/30 border-emerald-100'
          };
          const headerBgMap: Record<string, string> = {
            'gray': 'bg-gray-100 border-gray-200',
            'indigo': 'bg-indigo-50 border-indigo-100',
            'emerald': 'bg-emerald-50 border-emerald-100'
          };
          const textMap: Record<string, string> = {
            'gray': 'text-gray-700',
            'indigo': 'text-indigo-700',
            'emerald': 'text-emerald-700'
          };
          const badgeMap: Record<string, string> = {
            'gray': 'bg-gray-200 text-gray-600',
            'indigo': 'bg-indigo-100 text-indigo-600',
            'emerald': 'bg-emerald-100 text-emerald-600'
          };

          return (
            <div
              key={col.id}
              className={`rounded-xl border w-80 flex flex-col max-h-full shadow-sm transition-colors duration-200 ${bgMap[col.color]}`}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              <div className={`p-3.5 border-b flex justify-between items-center rounded-t-xl shrink-0 ${headerBgMap[col.color]}`}>
                <h2 className={`font-bold flex items-center gap-2 text-sm tracking-wide uppercase ${textMap[col.color]}`}>
                  <span className={`w-2 h-2 rounded-full ${col.color === 'gray' ? 'bg-gray-400' : `bg-${col.color}-400`}`}></span>
                  {col.label}
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeMap[col.color]}`}>
                  {colTasks.length}
                </span>
              </div>
              
              <div className="p-3 overflow-y-auto hide-scrollbar flex-1 flex flex-col gap-3 kanban-column">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id.toString())}
                    onClick={() => onTaskClick(task)}
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:border-clickup-purple transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="px-2 py-0.5 bg-gray-100 text-[10px] rounded uppercase font-bold text-gray-600 self-start">{task.status}</span>
                        {task.priority && (
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] rounded font-bold uppercase",
                            task.priority.includes("สูง") || task.priority.includes("ด่วน") ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 font-semibold text-xs">฿{Number(task.price || 0).toLocaleString()}</span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-800">{task.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
