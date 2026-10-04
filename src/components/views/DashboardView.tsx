import { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Area, AreaChart, RadialBarChart, RadialBar,
} from 'recharts';
import { Task, ProjectCategory, Expense } from '../../types';
import { 
  TrendingUp, CheckCircle, Clock, CalendarDays, Receipt, TrendingDown, DollarSign,
  Palette, ChevronDown, ChevronUp, Sparkles, Layers
} from 'lucide-react';
import { cn, getTaskPrice, getTaskProfit } from '../../lib/utils';
import { getTheme, setTheme, ThemeId, THEMES } from '../../lib/theme';
import { SalesMonkThemeDashboard } from '../themes/SalesMonkThemeDashboard';
import { SaddamThemeDashboard } from '../themes/SaddamThemeDashboard';
import { WarmEditorialThemeDashboard } from '../themes/WarmEditorialThemeDashboard';
import { DeiBentoThemeDashboard } from '../themes/DeiBentoThemeDashboard';

interface DashboardViewProps {
  tasks: Task[];
  categories: ProjectCategory[];
  expenses?: Expense[];
  onOpenTaskModal?: () => void;
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

export function DashboardView({ tasks, categories, expenses: expensesProp, onOpenTaskModal }: DashboardViewProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => getTheme());
  const [showDetailedLedger, setShowDetailedLedger] = useState(false);

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail) {
        setActiveTheme(e.detail as ThemeId);
      } else {
        setActiveTheme(getTheme());
      }
    };
    window.addEventListener('modty-theme-change', handleThemeChange);
    return () => window.removeEventListener('modty-theme-change', handleThemeChange);
  }, []);

  const handleSelectTheme = (themeId: ThemeId) => {
    setTheme(themeId);
    setActiveTheme(themeId);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  const USD_RATE = 35;
  const allExpenses = useMemo((): Expense[] => {
    if (expensesProp && expensesProp.length > 0) return expensesProp;
    try {
      const raw = localStorage.getItem('modty_expenses');
      return raw ? JSON.parse(raw) : (expensesProp || []);
    } catch { return expensesProp || []; }
  }, [expensesProp]);

  const getExpenseDate = (e: Expense): string => {
    return e.startDate || e.nextBillingDate || (e.createdAt ? e.createdAt.slice(0, 10) : '');
  };

  const getExpenseAmountTHB = (e: Expense): number => {
    return (e.currency === 'USD' ? e.amount * USD_RATE : e.amount) || 0;
  };

  const calculateExpenseForMonth = (monthKey: string, expList: Expense[]) => {
    let recurring = 0;
    let oneTime = 0;
    const oneTimeItems: Expense[] = [];
    const recurringItems: Expense[] = [];

    expList.forEach(e => {
      const amtTHB = getExpenseAmountTHB(e);
      if (e.billingCycle === 'one-time') {
        const expMonth = getExpenseDate(e).slice(0, 7);
        if (expMonth === monthKey) {
          oneTime += amtTHB;
          oneTimeItems.push(e);
        }
      } else if (e.billingCycle === 'monthly') {
        if (!e.isActive) return;
        const startMonth = (e.startDate || e.createdAt)?.slice(0, 7) || '2000-01';
        const endMonth = e.endDate ? e.endDate.slice(0, 7) : '9999-12';
        if (monthKey >= startMonth && monthKey <= endMonth) {
          recurring += amtTHB;
          recurringItems.push(e);
        }
      } else if (e.billingCycle === 'yearly') {
        if (!e.isActive) return;
        const startMonth = (e.startDate || e.createdAt)?.slice(0, 7) || '2000-01';
        const endMonth = e.endDate ? e.endDate.slice(0, 7) : '9999-12';
        if (monthKey >= startMonth && monthKey <= endMonth) {
          recurring += amtTHB / 12;
          recurringItems.push(e);
        }
      }
    });

    return {
      total: recurring + oneTime,
      recurring,
      oneTime,
      oneTimeItems,
      recurringItems,
    };
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>([String(currentYear)]);
    tasks.forEach(t => {
      [t.startDate, t.endDate, t.updatedAt].forEach(d => {
        if (d && d.length >= 4) years.add(d.slice(0, 4));
      });
      if (t.paymentPhases) {
        try {
          const phases = JSON.parse(t.paymentPhases);
          if (Array.isArray(phases)) {
            phases.forEach((p: any) => {
              const pd = p.paidAt || p.paidDate || p.dueDate;
              if (pd && pd.length >= 4) years.add(pd.slice(0, 4));
            });
          }
        } catch (e) {}
      }
    });
    allExpenses.forEach(e => {
      const d = getExpenseDate(e);
      if (d && d.length >= 4) years.add(d.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [tasks, allExpenses, currentYear]);

  const inPeriod = (dateStr?: string) => {
    if (!dateStr) return false;
    const y = dateStr.slice(0, 4);
    const m = String(parseInt(dateStr.slice(5, 7), 10));
    if (selectedYear !== 'all' && y !== selectedYear) return false;
    if (selectedMonth !== 'all' && m !== selectedMonth) return false;
    return true;
  };

  const todoCount       = tasks.filter(t => (t.status === 'To Do' || t.status === 'รอดำเนินการ') && (selectedYear === 'all' && selectedMonth === 'all' ? true : inPeriod(t.startDate || t.endDate || t.updatedAt))).length;
  const inProgressCount = tasks.filter(t => (t.status === 'In Progress' || t.status === 'กำลังทำ') && (selectedYear === 'all' && selectedMonth === 'all' ? true : inPeriod(t.startDate || t.endDate || t.updatedAt))).length;
  const doneCount       = tasks.filter(t => (t.status === 'Done' || t.status === 'เสร็จสิ้น') && (selectedYear === 'all' && selectedMonth === 'all' ? true : inPeriod(t.startDate || t.endDate || t.updatedAt))).length;

  const { closedWon, closedWonCount } = useMemo(() => {
    let sum = 0;
    let count = 0;
    tasks.forEach(t => {
      const isWon = t.pipelineStage === 'won' || t.status === 'Done' || t.status === 'เสร็จสิ้น';
      const d = t.endDate || t.startDate || t.updatedAt;
      if (isWon && (selectedYear === 'all' && selectedMonth === 'all' ? true : inPeriod(d))) {
        sum += Number(t.dealValue || t.price || 0);
        count += 1;
      }
    });
    return { closedWon: sum, closedWonCount: count };
  }, [tasks, selectedYear, selectedMonth]);

  const { totalRevenue, earnedRevenue, pendingRevenue, totalProfit, totalDevCost } = useMemo(() => {
    let tr = 0;
    let er = 0;
    let pr = 0;
    let tp = 0;
    let tc = 0;

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
              const pd = p.paidAt || p.paidDate || p.dueDate || t.updatedAt || t.endDate || t.startDate;
              if (p.paid) {
                if (selectedYear === 'all' && selectedMonth === 'all' ? true : inPeriod(pd)) {
                  phasePaidSum += amt;
                }
              } else {
                if (selectedYear === 'all' && selectedMonth === 'all' ? true : inPeriod(pd)) {
                  phaseUnpaidSum += amt;
                }
              }
            });
          }
        } catch (e) {}
      }

      const taskDate = t.endDate || t.startDate || t.updatedAt;
      const isTaskInPeriod = selectedYear === 'all' && selectedMonth === 'all' ? true : inPeriod(taskDate);

      if (isTaskInPeriod) {
        tr += price;
        tp += getTaskProfit(t);
        tc += Number(t.devCost || 0);
      }

      if (hasPhases) {
        er += phasePaidSum;
        pr += phaseUnpaidSum;
      } else {
        if (isTaskInPeriod) {
          if (t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.pipelineStage === 'won') {
            er += price;
          } else {
            pr += price;
          }
        }
      }
    });

    return { totalRevenue: tr, earnedRevenue: er, pendingRevenue: pr, totalProfit: tp, totalDevCost: tc };
  }, [tasks, selectedYear, selectedMonth]);

  // ── Build monthly time-series (last 12 months) — ใช้วันที่จ่ายจริง ──────────
  const { grossData, netData, customerData, monthlyPaidData } = useMemo(() => {
    const nowD = new Date();
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const gross: Record<string, number> = {};
    const net: Record<string, number> = {};
    const paid: Record<string, number> = {};
    const newCust: Record<string, Set<string>> = {};
    const firstSeen: Record<string, string> = {};

    keys.forEach(k => { gross[k] = 0; net[k] = 0; paid[k] = 0; newCust[k] = new Set(); });

    tasks.forEach(t => {
      const price  = getTaskPrice(t);
      const profit = getTaskProfit(t);

      // Gross/Net: ใช้ startDate เป็น task date
      const taskKey = (t.startDate || t.endDate)?.slice(0, 7);
      if (taskKey && Object.prototype.hasOwnProperty.call(gross, taskKey)) {
        gross[taskKey] += price;
        net[taskKey]   += profit;
      }

      // Paid Revenue: ใช้ paidAt จาก payment phases เป็นหลัก
      if (t.paymentPhases) {
        try {
          const phases = JSON.parse(t.paymentPhases);
          if (Array.isArray(phases)) {
            phases.forEach((p: any) => {
              if (!p.paid) return;
              const paidDateStr = p.paidAt || p.paidDate;
              const paidKey = paidDateStr?.slice(0, 7);
              if (paidKey && Object.prototype.hasOwnProperty.call(paid, paidKey)) {
                paid[paidKey] += Number(p.amount || 0);
              }
            });
          }
        } catch {}
      } else {
        if (t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.pipelineStage === 'won') {
          const paidKey = (t.endDate || t.updatedAt)?.slice(0, 7);
          if (paidKey && Object.prototype.hasOwnProperty.call(paid, paidKey)) {
            paid[paidKey] += price;
          }
        }
      }

      // New Customers
      if (t.customer) {
        const custKey = (t.startDate || t.endDate)?.slice(0, 7);
        if (custKey) {
          if (!firstSeen[t.customer]) {
            firstSeen[t.customer] = custKey;
            if (newCust[custKey]) newCust[custKey].add(t.customer);
          }
        }
      }
    });

    const MONTH_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const label = (k: string) => {
      const [y, m] = k.split('-');
      return `${MONTH_SHORT[parseInt(m, 10) - 1]} ${String(y).slice(2)}`;
    };

    return {
      grossData:       keys.map(k => ({ month: label(k), gross: gross[k] })),
      netData:         keys.map(k => ({ month: label(k), net:   net[k]   })),
      customerData:    keys.map(k => ({ month: label(k), newCustomers: newCust[k].size })),
      monthlyPaidData: keys.map(k => ({ month: label(k), paid: paid[k]  })),
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

  // ── Expense data & period summaries ──────────────────────────────────────
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const periodExpenseSummary = useMemo(() => {
    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      const targetKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const res = calculateExpenseForMonth(targetKey, allExpenses);
      return {
        ...res,
        isSpecificMonth: true,
        monthKey: targetKey,
        title: `ค่าใช้จ่ายเดือน ${MONTH_NAMES[parseInt(selectedMonth, 10) - 1]} ${selectedYear}`,
      };
    } else if (selectedYear !== 'all' && selectedMonth === 'all') {
      let total = 0;
      let recurring = 0;
      let oneTime = 0;
      const oneTimeItems: Expense[] = [];
      const recurringItems: Expense[] = [];

      for (let m = 1; m <= 12; m++) {
        const targetKey = `${selectedYear}-${String(m).padStart(2, '0')}`;
        const res = calculateExpenseForMonth(targetKey, allExpenses);
        total += res.total;
        recurring += res.recurring;
        oneTime += res.oneTime;
        res.oneTimeItems.forEach(item => {
          if (!oneTimeItems.some(x => x.id === item.id)) oneTimeItems.push(item);
        });
      }

      return {
        total,
        recurring,
        oneTime,
        oneTimeItems,
        recurringItems,
        isSpecificMonth: false,
        monthKey: selectedYear,
        title: `ค่าใช้จ่ายทั้งปี ${selectedYear}`,
      };
    } else {
      const res = calculateExpenseForMonth(currentMonthKey, allExpenses);
      return {
        ...res,
        isSpecificMonth: true,
        monthKey: currentMonthKey,
        title: `ค่าใช้จ่ายเดือนนี้ (${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()})`,
      };
    }
  }, [allExpenses, selectedYear, selectedMonth, currentMonthKey]);

  const monthlyExpenseTotal = periodExpenseSummary.total;

  // ── Current month income vs expense ──────────────────────────────────────
  const currentMonthIncome = useMemo(() => {
    let total = 0;
    tasks.forEach(t => {
      if (t.paymentPhases) {
        try {
          const phases = JSON.parse(t.paymentPhases);
          if (Array.isArray(phases)) {
            phases.forEach((p: any) => {
              if (!p.paid) return;
              const pd = (p.paidAt || p.paidDate || '')?.slice(0,7);
              if (pd === currentMonthKey) total += Number(p.amount || 0);
            });
          }
        } catch {}
      } else if ((t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.pipelineStage === 'won')) {
        const key = (t.endDate || t.updatedAt || '')?.slice(0,7);
        if (key === currentMonthKey) total += getTaskPrice(t);
      }
    });
    return total;
  }, [tasks, currentMonthKey]);

  const currentPeriodRevenue = selectedYear === 'all' && selectedMonth === 'all' ? currentMonthIncome : earnedRevenue;
  const periodNetProfit = currentPeriodRevenue - periodExpenseSummary.total;
  const currentMonthNetProfit = currentMonthIncome - calculateExpenseForMonth(currentMonthKey, allExpenses).total;

  // ── 12-month income vs expense chart ────────────────────────────────────
  const incomeVsExpenseData = useMemo(() => {
    const MONTH_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const nowD = new Date();
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }

    const incomeMap: Record<string,number> = {};
    keys.forEach(k => { incomeMap[k] = 0; });

    tasks.forEach(t => {
      if (t.paymentPhases) {
        try {
          const phases = JSON.parse(t.paymentPhases);
          if (Array.isArray(phases)) {
            phases.forEach((p: any) => {
              if (!p.paid) return;
              const k = (p.paidAt || p.paidDate || '')?.slice(0,7);
              if (k && incomeMap.hasOwnProperty(k)) incomeMap[k] += Number(p.amount || 0);
            });
          }
        } catch {}
      } else if (t.status === 'Done' || t.status === 'เสร็จสิ้น' || t.pipelineStage === 'won') {
        const k = (t.endDate || t.updatedAt || '')?.slice(0,7);
        if (k && incomeMap.hasOwnProperty(k)) incomeMap[k] += getTaskPrice(t);
      }
    });

    return keys.map(k => {
      const [yr, mo] = k.split('-');
      const income = incomeMap[k] || 0;
      const expRes = calculateExpenseForMonth(k, allExpenses);
      return {
        month: `${MONTH_SHORT[parseInt(mo,10)-1]} ${String(yr).slice(2)}`,
        monthKey: k,
        income,
        expense: Math.round(expRes.total),
        recurringExpense: Math.round(expRes.recurring),
        oneTimeExpense: Math.round(expRes.oneTime),
        oneTimeCount: expRes.oneTimeItems.length,
        net: Math.round(income - expRes.total),
      };
    });
  }, [tasks, allExpenses]);


  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-3 md:p-6">
      <div className="max-w-7xl w-full mx-auto space-y-6">

        {/* ── Theme Switcher Bar ── */}
        <div className="glass-card rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">ธีมตามภาพต้นแบบ</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  4 สไตล์ตรงตามภาพ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">สลับดูการจัดวาง สี และ HTML ที่แกะจากภาพทั้ง 4 ภาพได้ทันที</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto hide-scrollbar">
            {THEMES.map((th) => {
              const isActive = activeTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => handleSelectTheme(th.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: th.colors.primary }} />
                  <span>{th.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Decoded Reference Layout Component ── */}
        {activeTheme === 'salesmonk' && (
          <SalesMonkThemeDashboard tasks={tasks} categories={categories} expenses={allExpenses} onOpenTaskModal={onOpenTaskModal} />
        )}
        {activeTheme === 'saddam' && (
          <SaddamThemeDashboard tasks={tasks} categories={categories} expenses={allExpenses} onOpenTaskModal={onOpenTaskModal} />
        )}
        {activeTheme === 'editorial' && (
          <WarmEditorialThemeDashboard tasks={tasks} categories={categories} expenses={allExpenses} onOpenTaskModal={onOpenTaskModal} />
        )}
        {activeTheme === 'dei' && (
          <DeiBentoThemeDashboard tasks={tasks} categories={categories} expenses={allExpenses} onOpenTaskModal={onOpenTaskModal} />
        )}

        {/* ── Collapsible Detailed Accounting Ledger & Period Filter ── */}
        <div className="pt-2">
          <button
            onClick={() => setShowDetailedLedger(!showDetailedLedger)}
            className="flex items-center justify-between w-full p-4 rounded-2xl glass-card text-left transition-all hover:border-indigo-300 group cursor-pointer shadow-xs border border-slate-200/80"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  ตารางบัญชีละเอียด & สถิติย้อนหลัง (Detailed Accounting & Ledger Breakdown)
                </p>
                <p className="text-xs text-slate-400">
                  {showDetailedLedger ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อเปิดดู'} ตัวกรองปี/เดือน, กราฟ Gross Sales, รายรับ-รายจ่ายรายเดือน และตารางสถานะงาน
                </p>
              </div>
            </div>
            {showDetailedLedger ? (
              <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            )}
          </button>

          {showDetailedLedger && (
            <div className="mt-6 space-y-6 animate-fade-in">

              {/* Period Filter Bar */}
              <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-white/60 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">สรุปรายได้ & สถิติผลงาน (Closed Won)</h2>
              <p className="text-[10px] text-slate-400 font-medium">
                {selectedYear === 'all' && selectedMonth === 'all'
                  ? 'แสดงข้อมูลทั้งหมดทุกปี/ทุกเดือน'
                  : `แสดงผล: ${selectedYear !== 'all' ? `ปี ${selectedYear}` : 'ทุกปี'} ${selectedMonth !== 'all' ? `เดือน ${MONTH_NAMES[parseInt(selectedMonth, 10) - 1]}` : 'ทุกเดือน'}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">กรอง:</span>
            
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="all">ทุกปี (All Years)</option>
              {availableYears.map(y => (
                <option key={y} value={y}>ปี {y}</option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="all">ทุกเดือน (All Months)</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={String(idx + 1)}>{m}</option>
              ))}
            </select>

            {/* Quick Filters */}
            <button
              onClick={() => { setSelectedYear(String(currentYear)); setSelectedMonth(String(currentMonth)); }}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                selectedYear === String(currentYear) && selectedMonth === String(currentMonth)
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              )}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => { setSelectedYear(String(currentYear)); setSelectedMonth('all'); }}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                selectedYear === String(currentYear) && selectedMonth === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              )}
            >
              ปีนี้ ({currentYear})
            </button>
            <button
              onClick={() => { setSelectedYear('all'); setSelectedMonth('all'); }}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                selectedYear === 'all' && selectedMonth === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              ทั้งหมด
            </button>
          </div>
        </div>

        {/* Stripe-style metric line charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Gross Volume"
            total={`฿${totalRevenue.toLocaleString()}`}
            data={grossData}
            dataKey="gross"
            color="#6366f1"
            formatter={thb}
          />
          <MetricCard
            label="Net Volume (กำไรก่อนหักค่าใช้จ่าย)"
            total={`฿${totalProfit.toLocaleString()}`}
            data={netData}
            dataKey="net"
            color="#10b981"
            formatter={thb}
          />
          <MetricCard
            label={periodExpenseSummary.title}
            total={`฿${Math.round(periodExpenseSummary.total).toLocaleString()}`}
            data={incomeVsExpenseData}
            dataKey="expense"
            color="#f43f5e"
            formatter={thb}
          />
          <MetricCard
            label={selectedYear === 'all' && selectedMonth === 'all' ? 'กำไรสุทธิเดือนนี้ (หลังหักค่าใช้จ่าย)' : 'กำไรสุทธิรอบที่เลือก (หลังหักค่าใช้จ่าย)'}
            total={`${periodNetProfit >= 0 ? '' : '-'}฿${Math.abs(Math.round(periodNetProfit)).toLocaleString()}`}
            data={incomeVsExpenseData}
            dataKey="net"
            color={periodNetProfit >= 0 ? '#10b981' : '#f43f5e'}
            formatter={thb}
          />
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <KpiChip label="Closed Won"   value={`฿${closedWon.toLocaleString()}`}      sub={`ปิดดีลแล้ว ${closedWonCount} ดีล`} accent="border-emerald-500" />
          <KpiChip label="รับแล้ว"      value={`฿${earnedRevenue.toLocaleString()}`}  sub="งานเสร็จสิ้น"            accent="border-emerald-400" />
          <KpiChip label="ค้างรับ"      value={`฿${pendingRevenue.toLocaleString()}`} sub="ยังไม่เสร็จ"              accent="border-amber-400" />
          <KpiChip
            label="ค่าใช้จ่ายรอบนี้"
            value={`฿${Math.round(periodExpenseSummary.total).toLocaleString()}`}
            sub={`ประจำ ฿${Math.round(periodExpenseSummary.recurring).toLocaleString()} · รายครั้ง ฿${Math.round(periodExpenseSummary.oneTime).toLocaleString()}`}
            accent="border-rose-400"
          />
          <KpiChip
            label="กำไรสุทธิรอบนี้"
            value={`${periodNetProfit >= 0 ? '+' : '-'}฿${Math.abs(Math.round(periodNetProfit)).toLocaleString()}`}
            sub={periodNetProfit >= 0 ? '✅ มีกำไร' : '⚠️ ขาดทุน'}
            accent={periodNetProfit >= 0 ? 'border-emerald-500' : 'border-rose-600'}
          />
          <KpiChip label="งานทั้งหมด"   value={`${tasks.length}`}                     sub={`เสร็จ ${doneCount} งาน`} accent="border-indigo-400" />
        </div>

        {/* ── Income vs Expense vs Net Profit Chart ──────────────────────── */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-black text-sm text-slate-800">รายรับ vs ค่าใช้จ่าย vs กำไรสุทธิ (12 เดือนล่าสุด)</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                สีเขียว = รายรับ · สีแดง = ค่าใช้จ่าย · เส้นน้ำเงิน = กำไรสุทธิ (ลบค่าใช้จ่ายแล้ว)
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"/>รายรับ
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block"/>ค่าใช้จ่าย
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"/>กำไรสุทธิ
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={incomeVsExpenseData} margin={{ left: 8, right: 8, top: 16, bottom: 0 }} barSize={12} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `฿${(v/1000).toFixed(0)}k` : `฿${v}`} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 11 }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { income: 'รายรับ', expense: 'ค่าใช้จ่ายรวม (ประจำ+รายครั้ง)', net: 'กำไรสุทธิ' };
                  return [`฿${value.toLocaleString()}`, labels[name] ?? name];
                }}
              />
              <Bar dataKey="income" fill="#34d399" radius={[4,4,0,0]} name="income" />
              <Bar dataKey="expense" fill="#f87171" radius={[4,4,0,0]} name="expense" />
              <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} name="net" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Period Expense & One-Time Detail Breakdown ──────────────────── */}
        <div className="glass-card rounded-2xl p-5 border border-white/60">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" />
                รายละเอียดค่าใช้จ่ายรอบนี้ ({periodExpenseSummary.title})
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                รวมค่าใช้จ่ายประจำ (Subscriptions/Tools) และค่าใช้จ่ายรายครั้งที่เกิดขึ้นในรอบนี้
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black">
                รวมทั้งหมด ฿{Math.round(periodExpenseSummary.total).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">ค่าใช้จ่ายประจำ (Recurring)</p>
                <p className="text-base font-black text-slate-800">฿{Math.round(periodExpenseSummary.recurring).toLocaleString()}</p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                {periodExpenseSummary.recurringItems.length} รายการ
              </span>
            </div>
            <div className="bg-rose-50/60 rounded-xl p-3 border border-rose-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-rose-600 font-bold uppercase">ค่าใช้จ่ายรายครั้ง (One-Time)</p>
                <p className="text-base font-black text-rose-700">฿{Math.round(periodExpenseSummary.oneTime).toLocaleString()}</p>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-white px-2 py-1 rounded-lg border border-rose-200">
                {periodExpenseSummary.oneTimeItems.length} รายการ
              </span>
            </div>
          </div>

          {/* List of One-time expenses for this period */}
          {periodExpenseSummary.oneTimeItems.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-600">รายการค่าใช้จ่ายรายครั้งในรอบนี้:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {periodExpenseSummary.oneTimeItems.map(item => {
                  const amtTHB = getExpenseAmountTHB(item);
                  return (
                    <div key={item.id} className="bg-white/80 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between shadow-xs">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.vendor || 'รายครั้ง'} · {getExpenseDate(item) || 'ไม่ระบุวันที่'}
                        </p>
                      </div>
                      <span className="text-xs font-black text-rose-600 shrink-0">
                        {item.currency === 'USD' ? `$${item.amount.toLocaleString()} ` : ''}฿{amtTHB.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">ไม่มีค่าใช้จ่ายรายครั้งในรอบที่เลือก (มีเฉพาะค่าใช้จ่ายประจำ)</p>
          )}
        </div>

        {/* ── Monthly Revenue Bar Chart ────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-sm text-slate-800">รายได้รายเดือน (12 เดือนล่าสุด)</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                คำนวณจากวันที่รับเงินจริง (paidAt) · สีเขียว = รับแล้ว, สีม่วง = Gross ทั้งหมด
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"/>รับแล้ว
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-300 inline-block"/>Gross
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={monthlyPaidData.map((m, i) => ({ ...m, gross: grossData[i]?.gross ?? 0 }))}
              margin={{ left: 8, right: 8, top: 16, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickFormatter={v => v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : v > 0 ? `฿${v}` : ''}
              />
              <Tooltip
                formatter={(v: any, name: string) => [
                  `฿${Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
                  name === 'paid' ? 'รับแล้ว' : 'Gross รวม'
                ]}
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                contentStyle={{ borderRadius: '10px', fontSize: '11px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="gross" name="gross" fill="#a5b4fc" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="paid"  name="paid"  fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          {/* Month summary row */}
          <div className="mt-3 grid grid-cols-6 md:grid-cols-12 gap-1">
            {monthlyPaidData.map((m, i) => {
              const gross = grossData[i]?.gross ?? 0;
              const isPeak = m.paid > 0 && m.paid === Math.max(...monthlyPaidData.map(x => x.paid));
              return (
                <div key={m.month} className={`text-center p-1 rounded-lg ${isPeak ? 'bg-emerald-50 ring-1 ring-emerald-300' : ''}`}>
                  <p className="text-[9px] text-slate-400 font-semibold leading-none">{m.month}</p>
                  <p className={`text-[10px] font-black leading-tight mt-0.5 ${m.paid > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                    {m.paid >= 1000 ? `฿${(m.paid / 1000).toFixed(0)}k` : m.paid > 0 ? `฿${m.paid}` : '-'}
                  </p>
                  {gross > 0 && gross !== m.paid && (
                    <p className="text-[8px] text-indigo-300 font-semibold leading-none">
                      {gross >= 1000 ? `฿${(gross / 1000).toFixed(0)}k` : `฿${gross}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
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
          )}
        </div>
      </div>
    </div>
  );
}
