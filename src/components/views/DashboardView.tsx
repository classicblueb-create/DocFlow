import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Area, AreaChart, RadialBarChart, RadialBar,
} from 'recharts';
import { Task, ProjectCategory } from '../../types';
import { TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { cn, getTaskPrice, getTaskProfit } from '../../lib/utils';

interface DashboardViewProps {
  tasks: Task[];
  categories: ProjectCategory[];
}

// ── Stripe-style metric card with line chart ──────────────────────────────────
function MetricCard({
  label, total, data, dataKey, color, formatter,
}: {
  label: string;
  total: string;
  data: { month: string; [k: string]: number | string }[];
  dataKey: string;
  color: string;
  formatter?: (v: number) => string;
}) {
  const CustomTooltip = ({ active, payload, label: lbl }: any) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value ?? 0;
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2 text-xs">
        <p className="text-slate-400 font-semibold mb-0.5">{lbl}</p>
        <p className="font-black text-slate-800">{formatter ? formatter(val) : val}</p>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{total}</p>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Small KPI chip ────────────────────────────────────────────────────────────
function KpiChip({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className={cn('glass-card rounded-2xl p-4 border-l-4', accent)}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 font-semibold mt-1">{sub}</p>
    </div>
  );
}

export function DashboardView({ tasks, categories }: DashboardViewProps) {
  const todoCount       = tasks.filter(t => t.status === 'To Do' || t.status === 'รอดำเนินการ').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress' || t.status === 'กำลังทำ').length;
  const doneCount       = tasks.filter(t => t.status === 'Done' || t.status === 'เสร็จสิ้น').length;

  const { closedWon, closedWonCount } = useMemo(() => {
    const wonTasks = tasks.filter(t => t.pipelineStage === 'won');
    return {
      closedWon: wonTasks.reduce((s, t) => s + Number(t.dealValue || t.price || 0), 0),
      closedWonCount: wonTasks.length,
    };
  }, [tasks]);

  const { totalRevenue, earnedRevenue, pendingRevenue, totalProfit } = useMemo(() => {
    let tr = 0;
    let er = 0;
    let pr = 0;
    let tp = 0;

    tasks.forEach(t => {
      let price = Number(t.price || 0);
      let hasPhases = false;
      let phasePaidSum = 0;
      let phaseUnpaidSum = 0;

      if (t.paymentPhases) {
        try {
          const phases = JSON.parse(t.paymentPhases);
          if (Array.isArray(phases) && phases.length > 0) {
            hasPhases = true;
            price = phases.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
            phases.forEach((p: any) => {
              const amt = Number(p.amount || 0);
              if (p.paid) {
                phasePaidSum += amt;
              } else {
                phaseUnpaidSum += amt;
              }
            });
          }
        } catch (e) {}
      }

      tr += price;

      if (hasPhases) {
        er += phasePaidSum;
        pr += phaseUnpaidSum;
      } else {
        if (t.status === 'Done' || t.status === 'เสร็จสิ้น') {
          er += price;
        } else {
          pr += price;
        }
      }

      tp += getTaskProfit(t);
    });

    return { totalRevenue: tr, earnedRevenue: er, pendingRevenue: pr, totalProfit: tp };
  }, [tasks]);

  const totalDevCost   = tasks.reduce((s, t) => s + Number(t.devCost || 0), 0);

  // ── Build monthly time-series (last 12 months) ──────────────────────────────
  const { grossData, netData, customerData } = useMemo(() => {
    // Generate last 12 month keys
    const now = new Date();
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const gross: Record<string, number> = {};
    const net: Record<string, number> = {};
    const newCust: Record<string, Set<string>> = {};
    const firstSeen: Record<string, string> = {}; // customer → first month

    keys.forEach(k => { gross[k] = 0; net[k] = 0; newCust[k] = new Set(); });

    tasks.forEach(t => {
      const d = t.startDate || t.endDate;
      const key = d?.slice(0, 7);
      if (!key || !gross.hasOwnProperty(key)) return;

      const price  = getTaskPrice(t);
      const profit = getTaskProfit(t);

      gross[key] += price;
      net[key]   += profit;

      if (t.customer) {
        if (!firstSeen[t.customer]) {
          firstSeen[t.customer] = key;
          newCust[key].add(t.customer);
        }
      }
    });

    const label = (k: string) => {
      const [, m] = k.split('-');
      const names = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      return names[parseInt(m, 10) - 1] || m;
    };

    return {
      grossData:    keys.map(k => ({ month: label(k), gross: gross[k] })),
      netData:      keys.map(k => ({ month: label(k), net:   net[k] })),
      customerData: keys.map(k => ({ month: label(k), newCustomers: newCust[k].size })),
    };
  }, [tasks]);

  const totalNewCustomers = useMemo(() => {
    const seen = new Set<string>();
    tasks.forEach(t => { if (t.customer) seen.add(t.customer); });
    return seen.size;
  }, [tasks]);

  // ── Other chart data ────────────────────────────────────────────────────────
  const statusData = [
    { name: 'To Do',       value: todoCount,       color: '#94a3b8' },
    { name: 'In Progress', value: inProgressCount, color: '#818cf8' },
    { name: 'Done',        value: doneCount,       color: '#34d399' },
  ].filter(d => d.value > 0);

  const priorityData = useMemo(() => [
    { name: 'ด่วน',  Tasks: tasks.filter(t => t.priority?.includes('ด่วน')     || t.priority?.includes('Urgent')).length },
    { name: 'สูง',   Tasks: tasks.filter(t => t.priority?.includes('สูง')      || t.priority?.includes('High')).length },
    { name: 'กลาง',  Tasks: tasks.filter(t => t.priority?.includes('ปานกลาง') || t.priority?.includes('Medium') || !t.priority).length },
    { name: 'ต่ำ',   Tasks: tasks.filter(t => t.priority?.includes('ต่ำ')      || t.priority?.includes('Low')).length },
  ], [tasks]);

  const assigneeData = useMemo(() => [
    { name: 'Fan', value: tasks.filter(t => t.assignee === 'Fan').length },
    { name: 'Mod', value: tasks.filter(t => t.assignee === 'Mod').length },
    { name: 'ไม่ระบุ', value: tasks.filter(t => !t.assignee).length },
  ].filter(d => d.value > 0), [tasks]);

  const ASSIGNEE_COLORS = ['#8b5cf6', '#10b981', '#94a3b8'];

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const catId = t.categoryId || 'uncategorized';
      counts[catId] = (counts[catId] || 0) + 1;
    });

    return Object.entries(counts).map(([catId, count]) => {
      if (catId === 'uncategorized') {
        return {
          name: 'ไม่ระบุโปรเจค',
          value: count,
          color: '#94a3b8'
        };
      }
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || 'ไม่รู้จัก',
        value: count,
        color: cat?.color || '#cbd5e1'
      };
    }).sort((a, b) => b.value - a.value);
  }, [tasks, categories]);

  // ── Pipeline sales data ────────────────────────────────────────────────────
  const { momData, forecastData, closedBusinessData } = useMemo(() => {
    const MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    // Month over Month: gross revenue change %
    const monthly: Record<string,number> = {};
    keys.forEach(k => { monthly[k] = 0; });
    tasks.forEach(t => {
      const key = (t.endDate || t.startDate || '').slice(0,7);
      if (monthly.hasOwnProperty(key)) monthly[key] += getTaskPrice(t);
    });
    const momArr = keys.map((k, i) => {
      const val = monthly[k];
      const prev = i > 0 ? monthly[keys[i-1]] : val;
      const change = prev > 0 ? ((val - prev) / prev) * 100 : 0;
      const [, m] = k.split('-');
      return { month: MONTH_NAMES[parseInt(m,10)-1], value: val, change: Math.round(change * 10) / 10 };
    });

    // Forecast by Month: pipeline tasks grouped by close month (endDate)
    const forecastMap: Record<string,{ pipeline:number; won:number }> = {};
    const fKeys: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      fKeys.push(k);
      forecastMap[k] = { pipeline: 0, won: 0 };
    }
    tasks.filter(t => t.pipelineStage && t.endDate).forEach(t => {
      const k = t.endDate!.slice(0,7);
      if (!forecastMap[k]) return;
      const val = Number(t.dealValue || t.price || 0);
      if (t.pipelineStage === 'won') forecastMap[k].won += val;
      else if (t.pipelineStage !== 'lost') forecastMap[k].pipeline += val;
    });
    const forecastArr = fKeys.map(k => {
      const [, m] = k.split('-');
      return { month: MONTH_NAMES[parseInt(m,10)-1], ...forecastMap[k] };
    });

    // Closed Business gauge data
    const wonTot = tasks.filter(t => t.pipelineStage === 'won').reduce((s,t) => s + Number(t.dealValue || t.price || 0), 0);
    const target = Math.max(wonTot * 1.25, 100000); // 25% above current as target
    const pct = Math.min(Math.round((wonTot / target) * 100), 100);
    const gaugeData = [
      { name: 'Closed', value: pct, fill: '#34d399' },
      { name: 'Target', value: 100 - pct, fill: '#e2e8f0' },
    ];
    return { momData: momArr, forecastData: forecastArr, closedBusinessData: { won: wonTot, target, pct, gaugeData } };
  }, [tasks]);

  const thb = (v: number) => `฿${v.toLocaleString()}`;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">

        {/* Stripe-style metric line charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Gross Volume"
            total={`฿${totalRevenue.toLocaleString()}`}
            data={grossData}
            dataKey="gross"
            color="#6366f1"
            formatter={thb}
          />
          <MetricCard
            label="Net Volume (กำไรสุทธิ)"
            total={`฿${totalProfit.toLocaleString()}`}
            data={netData}
            dataKey="net"
            color="#10b981"
            formatter={thb}
          />
          <MetricCard
            label="New Customers"
            total={`${totalNewCustomers} ราย`}
            data={customerData}
            dataKey="newCustomers"
            color="#8b5cf6"
            formatter={v => `${v} ราย`}
          />
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiChip label="Closed Won"   value={`฿${closedWon.toLocaleString()}`}      sub={`ปิดดีลแล้ว ${closedWonCount} ดีล`} accent="border-emerald-500" />
          <KpiChip label="รับแล้ว"      value={`฿${earnedRevenue.toLocaleString()}`}  sub="งานเสร็จสิ้น"            accent="border-emerald-400" />
          <KpiChip label="ค้างรับ"      value={`฿${pendingRevenue.toLocaleString()}`} sub="ยังไม่เสร็จ"              accent="border-amber-400" />
          <KpiChip label="ต้นทุน Dev"   value={`฿${totalDevCost.toLocaleString()}`}   sub="ค่าจ้าง Dev รวม"          accent="border-rose-400" />
          <KpiChip label="งานทั้งหมด"   value={`${tasks.length}`}                     sub={`เสร็จ ${doneCount} งาน`} accent="border-indigo-400" />
        </div>

        {/* Status counts */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Clock,       label: 'รอดำเนินการ', count: todoCount,       color: 'text-slate-600',  bg: 'bg-slate-500/10 border-slate-500/20'   },
            { icon: TrendingUp,  label: 'กำลังทำ',      count: inProgressCount, color: 'text-indigo-600', bg: 'bg-indigo-500/10 border-indigo-500/20'  },
            { icon: CheckCircle, label: 'เสร็จสิ้น',    count: doneCount,       color: 'text-emerald-600',bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map(item => (
            <div key={item.label} className={cn('border rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md', item.bg)}>
              <item.icon className={cn('w-7 h-7', item.color)} />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                <p className={cn('text-2xl font-black', item.color)}>{item.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sales Pipeline Charts */}
        {(() => {
          const STAGES = ['lead','opportunity','proposal','negotiation','won','lost'] as const;
          const STAGE_COLORS: Record<string, string> = {
            lead: '#94a3b8', opportunity: '#818cf8', proposal: '#60a5fa',
            negotiation: '#fbbf24', won: '#34d399', lost: '#fb7185',
          };
          const STAGE_LABELS: Record<string, string> = {
            lead: 'Lead', opportunity: 'Opportunity', proposal: 'Proposal',
            negotiation: 'Negotiation', won: 'Won', lost: 'Lost',
          };
          const pipelineData = STAGES.map(stage => {
            const deals = tasks.filter(t => t.pipelineStage === stage);
            return {
              stage: STAGE_LABELS[stage] || stage,
              stageKey: stage,
              count: deals.length,
              value: deals.reduce((s, t) => s + Number(t.dealValue || 0), 0),
            };
          }).filter(d => d.count > 0);

          // Pipeline Value chart: exclude lost, only stages that have value
          const funnelData = pipelineData.filter(d => d.stageKey !== 'lost' && d.value > 0);

          if (pipelineData.length === 0) return null;
          return (
            <div className="space-y-4">
              <h3 className="font-black text-sm text-slate-700">Sales Pipeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-card rounded-2xl p-5">
                  <h4 className="font-bold text-xs text-slate-600 mb-3">Pipeline by Stage (Count)</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={pipelineData} layout="vertical" margin={{ left: 80, right: 20, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={75} />
                      <Tooltip formatter={(v: any) => [`${v} ดีล`, 'จำนวน']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                      <Bar dataKey="count" name="จำนวนดีล" radius={[0, 8, 8, 0]} maxBarSize={22}>
                        {pipelineData.map((d, i) => <Cell key={i} fill={STAGE_COLORS[d.stageKey] || '#94a3b8'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <h4 className="font-bold text-xs text-slate-600 mb-3">Pipeline Value (ไม่รวม Lost)</h4>
                  {funnelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={funnelData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `฿${(v/1000).toFixed(0)}k` : `฿${v}`} />
                        <Tooltip formatter={(v: any) => [`฿${Number(v).toLocaleString()}`, 'มูลค่า']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                        <Bar dataKey="value" name="มูลค่า" radius={[8, 8, 0, 0]} maxBarSize={40}>
                          {funnelData.map((d, i) => <Cell key={i} fill={STAGE_COLORS[d.stageKey] || '#94a3b8'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-xs text-slate-400 font-semibold">ยังไม่มีมูลค่าดีลในระบบ</div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Closed Business + MoM + Forecast ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Closed Business Gauge */}
          <div className="glass-card rounded-2xl p-5 flex flex-col items-center">
            <h3 className="font-bold text-sm text-slate-700 mb-1 self-start">Closed Business</h3>
            <p className="text-[10px] text-slate-400 font-semibold self-start mb-3">ยอดปิดดีลเทียบเป้าหมาย</p>
            <div className="relative w-40 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={closedBusinessData.gaugeData}
                    cx="50%" cy="100%"
                    startAngle={180} endAngle={0}
                    innerRadius={50} outerRadius={70}
                    dataKey="value" strokeWidth={0}
                  >
                    {closedBusinessData.gaugeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </RechartsPie>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <p className="text-xl font-black text-emerald-600">{closedBusinessData.pct}%</p>
              </div>
            </div>
            <p className="text-base font-black text-slate-800 mt-1">{thb(closedBusinessData.won)}</p>
            <p className="text-[10px] text-slate-400 font-semibold">เป้า {thb(Math.round(closedBusinessData.target))}</p>
          </div>

          {/* Month Over Month Growth */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-700 mb-1">Month Over Month</h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-3">รายรับเปลี่ยนแปลง % ต่อเดือน</p>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={momData} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'เปลี่ยนแปลง']} cursor={{ stroke: '#e2e8f0' }} />
                <Line dataKey="change" name="MoM %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast by Month */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-700 mb-1">Forecast by Month</h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-3">Pipeline vs Closed Won ตาม Close Date</p>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={forecastData} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `฿${(v/1000).toFixed(0)}k` : `฿${v}`} />
                <Tooltip formatter={(v: any, name: string) => [thb(Number(v)), name === 'pipeline' ? 'Pipeline' : 'Won']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="pipeline" name="pipeline" fill="#818cf8" radius={[4,4,0,0]} maxBarSize={24} stackId="a" />
                <Bar dataKey="won" name="won" fill="#34d399" radius={[4,4,0,0]} maxBarSize={24} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500"><span className="w-2 h-2 rounded-sm bg-indigo-400 inline-block"/>Pipeline</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block"/>Won</span>
            </div>
          </div>
        </div>

        {/* Stage radial bars */}
        {(() => {
          const STAGE_COLORS: Record<string,string> = { lead:'#94a3b8', opportunity:'#818cf8', proposal:'#60a5fa', negotiation:'#fbbf24', won:'#34d399', lost:'#fb7185' };
          const STAGE_LABELS: Record<string,string> = { lead:'Lead', opportunity:'Opportunity', proposal:'Proposal', negotiation:'Negotiation', won:'Won', lost:'Lost' };
          const stages = ['lead','opportunity','proposal','negotiation','won','lost'] as const;
          const pipelineTasks = tasks.filter(t => t.pipelineStage);
          const maxCount = Math.max(...stages.map(s => pipelineTasks.filter(t => t.pipelineStage === s).length), 1);
          const radialData = stages.map(s => {
            const count = pipelineTasks.filter(t => t.pipelineStage === s).length;
            const val = pipelineTasks.filter(t => t.pipelineStage === s).reduce((sum,t) => sum + Number(t.dealValue || t.price || 0), 0);
            return { name: STAGE_LABELS[s], count, value: Math.round((count / maxCount) * 100), fill: STAGE_COLORS[s], dealValue: val };
          }).filter(d => d.count > 0);
          if (radialData.length === 0) return null;
          return (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-bold text-sm text-slate-700 mb-4">Sales Activity by Stage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={90} data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#f1f5f9' }} />
                    <Tooltip formatter={(_: any, __: any, props: any) => [`${props.payload.count} ดีล · ${thb(props.payload.dealValue)}`, props.payload.name]} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {radialData.map(d => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs font-semibold text-slate-600 flex-1">{d.name}</span>
                      <span className="text-xs font-black text-slate-800">{d.count} ดีล</span>
                      <span className="text-[10px] font-semibold text-slate-400">{thb(d.dealValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Revenue breakdown bar chart */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-700">รายรับรายเดือน (Gross / Net)</h3>
              <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Gross</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Net</span>
              </div>
            </div>
            {grossData.some(d => d.gross > 0) ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={grossData.slice(-6)} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
                  <Tooltip formatter={(v: any) => `฿${Number(v).toLocaleString()}`} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                  <Bar dataKey="gross" name="Gross" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 font-semibold">ยังไม่มีข้อมูลรายได้</div>
            )}
          </div>

          {/* Priority bar chart */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-700 mb-4">งานแยกตามความสำคัญ</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={priorityData} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="Tasks" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div className="glass-card rounded-2xl p-5 flex flex-col">
            <h3 className="font-bold text-sm text-slate-700 mb-4">สัดส่วนสถานะงาน</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <RechartsPie>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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

          {/* Assignee pie */}
          <div className="glass-card rounded-2xl p-5 flex flex-col">
            <h3 className="font-bold text-sm text-slate-700 mb-4">งานแยกตาม Assignee</h3>
            {assigneeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <RechartsPie>
                    <Pie data={assigneeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {assigneeData.map((_, i) => <Cell key={i} fill={ASSIGNEE_COLORS[i % ASSIGNEE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {assigneeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ASSIGNEE_COLORS[i % ASSIGNEE_COLORS.length] }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 font-semibold">ยังไม่มีข้อมูล</div>
            )}
          </div>

          {/* Category Donut chart */}
          <div className="glass-card rounded-2xl p-5 flex flex-col">
            <h3 className="font-bold text-sm text-slate-700 mb-4">สัดส่วนงานแยกตามประเภท (Categories)</h3>
            {categoryChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <RechartsPie>
                    <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {categoryChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2 max-h-[100px] overflow-y-auto hide-scrollbar">
                  {categoryChartData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 font-semibold">ยังไม่มีข้อมูลประเภทงาน</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
