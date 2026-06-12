import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Task } from '../../types';
import { TrendingUp, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
}

export function DashboardView({ tasks }: DashboardViewProps) {
  const todoStats = tasks.filter(t => t.status === 'To Do').length;
  const inProgressStats = tasks.filter(t => t.status === 'In Progress').length;
  const doneStats = tasks.filter(t => t.status === 'Done').length;

  const totalRevenue = tasks.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const earnedRevenue = tasks.filter(t => t.status === 'Done').reduce((sum, t) => sum + Number(t.price || 0), 0);
  const pendingRevenue = totalRevenue - earnedRevenue;

  const statusData = [
    { name: 'To Do', value: todoStats, color: '#f3f4f6' },
    { name: 'In Progress', value: inProgressStats, color: '#818cf8' },
    { name: 'Complete', value: doneStats, color: '#34d399' },
  ].filter(d => d.value > 0);

  const priorityCounts = {
    High: tasks.filter(t => t.priority?.includes('สูง') || t.priority?.includes('High') || t.priority?.includes('ด่วน') || t.priority?.includes('Urgent')).length,
    Med: tasks.filter(t => t.priority?.includes('ปานกลาง') || t.priority?.includes('Medium') || !t.priority).length,
    Low: tasks.filter(t => t.priority?.includes('ต่ำ') || t.priority?.includes('Low')).length,
  };

  const priorityData = [
    { name: 'High', Tasks: priorityCounts.High },
    { name: 'Med', Tasks: priorityCounts.Med },
    { name: 'Low', Tasks: priorityCounts.Low },
  ];

  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50/50">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-xl shadow-lg p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-sm font-bold text-indigo-200 mb-1 tracking-widest uppercase flex items-center justify-center md:justify-start gap-2">
              <TrendingUp className="w-4 h-4" /> Revenue Tracking
            </h2>
            <p className="text-3xl font-black mb-1">฿{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400">รายได้รวมทั้งหมด</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex-1 text-center md:text-left">
              <p className="text-xs text-emerald-300 font-medium mb-1">กำไรสุทธิ (เสร็จแล้ว)</p>
              <p className="text-xl font-bold text-emerald-400">฿{earnedRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex-1 text-center md:text-left">
              <p className="text-xs text-amber-300 font-medium mb-1">ยอดค้างชำระ</p>
              <p className="text-xl font-bold text-amber-400">฿{pendingRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <span className="text-sm text-gray-500 mb-1">งานทั้งหมด</span>
            <div className="text-3xl font-bold text-gray-800">{tasks.length}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm border-l-4 border-l-gray-400">
            <span className="text-sm text-gray-500 mb-1">รอดำเนินการ</span>
            <div className="text-3xl font-bold text-gray-800">{todoStats}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm border-l-4 border-l-indigo-400">
            <span className="text-sm text-gray-500 mb-1">กำลังทำ</span>
            <div className="text-3xl font-bold text-indigo-700">{inProgressStats}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm border-l-4 border-l-emerald-400">
            <span className="text-sm text-gray-500 mb-1">เสร็จสิ้น</span>
            <div className="text-3xl font-bold text-emerald-700">{doneStats}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center">
            <h3 className="font-bold text-gray-700 mb-6 self-start flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-500" /> สัดส่วนสถานะงาน
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center">
            <h3 className="font-bold text-gray-700 mb-6 self-start flex items-center gap-2">
              <BarChartIcon className="w-5 h-5 text-claude-accent" /> ปริมาณงานแยกตามความสำคัญ
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="Tasks" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
