import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts';
import { Task } from '../../types';
import { TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DashboardViewProps {
  tasks: Task[];
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const glassColorMap: Record<string, string> = {
    'bg-gradient-to-br from-indigo-600 to-indigo-400': 'bg-gradient-to-br from-indigo-550/20 to-indigo-400/5 border-indigo-500/20 text-indigo-900',
    'bg-gradient-to-br from-emerald-600 to-emerald-400': 'bg-gradient-to-br from-emerald-550/20 to-emerald-400/5 border-emerald-500/20 text-emerald-900',
    'bg-gradient-to-br from-amber-600 to-amber-400': 'bg-gradient-to-br from-amber-550/20 to-amber-400/5 border-amber-500/20 text-amber-900',
    'bg-gradient-to-br from-slate-700 to-slate-500': 'bg-gradient-to-br from-slate-550/20 to-slate-500/5 border-slate-500/20 text-slate-900',
  };
  const glassColor = glassColorMap[color] || 'bg-white/40 border-white/20 text-slate-800';

  return (
    <div className={cn(
      'rounded-2xl p-5 flex flex-col justify-between h-28 border backdrop-blur-md shadow-sm',
      glassColor
    )}>
      <p className="text-[10px] font-bold opacity-75 uppercase tracking-wider">{label}</p>
      <div>
        <p className="text-2xl font-black leading-none mb-1">{value}</p>
        <p className="text-[10px] opacity-65 font-semibold">{sub}</p>
      </div>
    </div>
  );
}

export function DashboardView({ tasks }: DashboardViewProps) {
  const todoCount       = tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ').length;
  const doneCount       = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น').length;

  const totalRevenue  = tasks.reduce((s, t) => s + Number(t.price || 0), 0);
  const earnedRevenue = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น')
                             .reduce((s, t) => s + Number(t.price || 0), 0);
  const pendingRevenue = totalRevenue - earnedRevenue;

  const statusData = [
    { name: 'To Do',       value: todoCount,       color: '#94a3b8' },
    { name: 'In Progress', value: inProgressCount, color: '#818cf8' },
    { name: 'Done',        value: doneCount,       color: '#34d399' },
  ].filter(d => d.value > 0);

  const priorityData = useMemo(() => [
    { name: 'ด่วน',   Tasks: tasks.filter(t => t.priority?.includes('ด่วน') || t.priority?.includes('Urgent')).length },
    { name: 'สูง',    Tasks: tasks.filter(t => t.priority?.includes('สูง')   || t.priority?.includes('High')).length },
    { name: 'กลาง',   Tasks: tasks.filter(t => t.priority?.includes('ปานกลาง') || t.priority?.includes('Medium') || !t.priority).length },
    { name: 'ต่ำ',    Tasks: tasks.filter(t => t.priority?.includes('ต่ำ')   || t.priority?.includes('Low')).length },
  ], [tasks]);

  // Monthly revenue mock from task data
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น').forEach(t => {
      const d = t.endDate || t.startDate;
      if (!d) return;
      const key = d.slice(0, 7); // YYYY-MM
      months[key] = (months[key] || 0) + Number(t.price || 0);
    });
    return Object.entries(months).sort().slice(-6).map(([month, revenue]) => ({
      month: month.slice(5), revenue
    }));
  }, [tasks]);

  const assigneeData = useMemo(() => [
    { name: 'Fan',  value: tasks.filter(t => t.assignee === 'Fan').length },
    { name: 'Mod',  value: tasks.filter(t => t.assignee === 'Mod').length },
    { name: 'ไม่ระบุ', value: tasks.filter(t => !t.assignee).length },
  ].filter(d => d.value > 0), [tasks]);

  const ASSIGNEE_COLORS = ['#8b5cf6', '#10b981', '#94a3b8'];

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="รายได้รวม"       value={`฿${totalRevenue.toLocaleString()}`}  sub="งานทั้งหมด"    color="bg-gradient-to-br from-indigo-600 to-indigo-400" />
          <KpiCard label="รับแล้ว"          value={`฿${earnedRevenue.toLocaleString()}`} sub="งานเสร็จสิ้น"  color="bg-gradient-to-br from-emerald-600 to-emerald-400" />
          <KpiCard label="ค้างรับ"          value={`฿${pendingRevenue.toLocaleString()}`} sub="ยังไม่เสร็จ"  color="bg-gradient-to-br from-amber-600 to-amber-400" />
          <KpiCard label="งานทั้งหมด"       value={`${tasks.length}`}                   sub={`เสร็จ ${doneCount} รายการ`} color="bg-gradient-to-br from-slate-700 to-slate-500" />
        </div>

        {/* Status counts */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Clock,       label: 'รอดำเนินการ',  count: todoCount,       color: 'text-slate-655',  bg: 'bg-slate-500/10 border-slate-500/20'   },
            { icon: TrendingUp,  label: 'กำลังทำ',       count: inProgressCount, color: 'text-indigo-655', bg: 'bg-indigo-500/10 border-indigo-500/20'  },
            { icon: CheckCircle, label: 'เสร็จสิ้น',     count: doneCount,       color: 'text-emerald-655',bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map(item => (
            <div key={item.label} className={cn('border rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md', item.bg)}>
              <item.icon className={cn('w-8 h-8', item.color)} />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                <p className={cn('text-2xl font-black', item.color)}>{item.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Monthly revenue area chart */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-slate-700">รายได้รายเดือน</h3>
            </div>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 font-semibold">
                ยังไม่มีข้อมูลรายได้
              </div>
            )}
          </div>

          {/* Priority bar chart */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-700 mb-4">งานแยกตามความสำคัญ</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="Tasks" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div className="glass-card rounded-2xl p-5 flex flex-col items-center">
            <h3 className="font-bold text-sm text-slate-700 mb-4 self-start">สัดส่วนสถานะงาน</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <RechartsPie>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 font-semibold">ยังไม่มีข้อมูล</div>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>

          {/* Assignee distribution */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-700 mb-4">งานแยกตาม Assignee</h3>
            {assigneeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={assigneeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height={140}>
                  <RechartsPie>
                    <Pie data={[{ name: 'Fan', value: 1, color: '#8b5cf6' }, { name: 'Mod', value: 1, color: '#10b981' }]} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                      {ASSIGNEE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
