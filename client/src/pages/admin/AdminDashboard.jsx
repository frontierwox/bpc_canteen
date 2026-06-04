import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Users, AlertCircle, ArrowUpRight, UtensilsCrossed } from 'lucide-react';
import { analyticsAPI } from '../../api/analytics.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return count;
};

const StatCard = ({ label, value, prefix = "", trend, trendUp, icon, color, delay }) => {
  const count = useCountUp(value);
  const colorMap = {
    gold: '#D4A017',
    warning: '#D4A017',
    maroon: '#7B1C1C',
    danger: '#E53935'
  };
  const accentColor = colorMap[color] || '#7B1C1C';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="bg-surface-card rounded-lg border border-[rgba(123,28,28,0.08)] p-6 relative overflow-hidden transition-all duration-220 hover:-translate-y-[2px] hover:shadow-md"
      style={{ '--card-accent-color': accentColor }}
    >
      <div className="absolute top-0 left-0 w-1 h-full rounded-r-sm" style={{ background: accentColor }} />
      <div className="absolute top-0 right-0 w-[120px] h-[120px] opacity-[0.04] rounded-full translate-x-[30%] -translate-y-[30%]" style={{ background: accentColor }} />
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ background: `${accentColor}15`, color: accentColor }}>
          {icon}
        </div>
      </div>
      
      <div className="mt-4 relative z-10">
        <div className="font-display text-4xl font-semibold text-[#1A0505] leading-none tracking-[-0.02em] my-3">
          {prefix}{count.toLocaleString('en-IN')}
        </div>
        <p className="font-body text-xs font-medium tracking-[0.08em] uppercase text-[#9A7A7A]">{label}</p>
        <div className={`text-xs font-medium flex items-center gap-1 mt-1 ${trendUp ? 'text-[#1A5C1A]' : 'text-[#8B1A1A]'}`}>
          {trend}
        </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const { data: summary, isLoading: sumLoading } = useQuery({ queryKey: ['analytics', 'summary'], queryFn: () => analyticsAPI.getSummary().then((r) => r.data.data) });
  const { data: monthly } = useQuery({ queryKey: ['analytics', 'monthly'], queryFn: () => analyticsAPI.getMonthlyRevenue().then((r) => r.data.data) });
  const { data: topItems } = useQuery({ queryKey: ['analytics', 'topItems'], queryFn: () => analyticsAPI.getTopItems().then((r) => r.data.data) });
  const { data: paymentStatus } = useQuery({ queryKey: ['analytics', 'paymentStatus'], queryFn: () => analyticsAPI.getPaymentStatus().then((r) => r.data.data) });
  const { data: outstanding } = useQuery({ queryKey: ['analytics', 'outstanding'], queryFn: () => analyticsAPI.getCustomerOutstanding().then((r) => r.data.data) });

  if (sumLoading) return <LoadingSpinner text="Loading dashboard..." />;
  const s = summary || {};

  const statCards = [
    { label: "Today's Revenue", value: s.todayRevenue || 0, prefix: "₹", trend: `${s.todayBills} bills today`, trendUp: true, icon: <TrendingUp className="w-5 h-5"/>, color: "gold" },
    { label: "Pending Bills", value: s.pendingBills || 0, trend: "Requires action", trendUp: false, icon: <Clock className="w-5 h-5"/>, color: "warning" },
    { label: "Active Customers", value: s.activeCustomers || 0, trend: "This month", trendUp: true, icon: <Users className="w-5 h-5"/>, color: "maroon" },
    { label: "Outstanding Dues", value: s.outstandingDues || 0, prefix: "₹", trend: "Total pending", trendUp: false, icon: <AlertCircle className="w-5 h-5"/>, color: "danger" }
  ];

  const COLORS = ['#2D7A3A', '#C97B00', '#D4A017', '#C0392B'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#9A7A7A] mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((c, i) => (
          <StatCard key={c.label} {...c} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Monthly Revenue Area Chart */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card-bpc p-6 xl:col-span-2">
          <h3 className="font-semibold text-[#1A0505] mb-6">Monthly Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly || []}>
                <defs>
                  <linearGradient id="maroonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B1C1C" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#7B1C1C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,28,28,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A7A7A' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} tick={{ fontSize: 11, fill: '#9A7A7A' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#2E0A0A', border: '1px solid rgba(212,160,23,0.3)', borderRadius: '10px', color: '#FFF8F8', fontFamily: 'DM Sans', fontSize: '13px' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                  itemStyle={{ color: '#D4A017' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#7B1C1C" strokeWidth={2.5} fill="url(#maroonGrad)" dot={{ fill: '#D4A017', strokeWidth: 0, r: 4 }} activeDot={{ fill: '#7B1C1C', r: 6, stroke: '#D4A017', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payment Status Donut */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="card-bpc p-6">
          <h3 className="font-semibold text-[#1A0505] mb-6">Payment Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentStatus || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} innerRadius={60} paddingAngle={3} label={({ status, count }) => `${status} (${count})`} labelLine={false}>
                  {(paymentStatus || []).map((entry, index) => <Cell key={entry.status} fill={entry.color || COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(123,28,28,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Top Items Bar Chart */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="card-bpc p-6">
          <div className="flex items-center gap-2 mb-6">
            <UtensilsCrossed className="w-5 h-5 text-gold-400" />
            <h3 className="font-semibold text-[#1A0505]">Top Items This Month</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(topItems || []).slice(0, 10)} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,28,28,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9A7A7A' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#5A3A3A' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(123,28,28,0.08)' }} cursor={{fill: 'rgba(123,28,28,0.04)'}} />
                <Bar dataKey="totalQuantity" fill="#D4A017" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Outstanding Balances Table */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="card-bpc p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-maroon-600" />
            <h3 className="font-semibold text-[#1A0505]">Outstanding Dues</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[300px] max-h-[300px]">
            {(outstanding || []).length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[#9A7A7A]">
                <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mb-3 text-success-text">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-sm">No outstanding balances</p>
              </div>
            )}
            {(outstanding || []).map((cust) => {
              // Fake days overdue for UI demo purposes since it's not in the API currently
              const isCritical = cust.outstandingBalance > 5000;
              return (
                <div key={cust._id} className="flex items-center justify-between p-3.5 bg-surface-page border border-[rgba(123,28,28,0.08)] rounded-lg hover:border-maroon-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-maroon-50 text-maroon-700 flex items-center justify-center text-xs font-bold border border-maroon-200">
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#1A0505] text-sm leading-tight">{cust.name}</p>
                      <p className="text-[11px] text-[#9A7A7A] mt-0.5">{cust.organization || 'Individual'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCritical ? (
                      <span className="px-2.5 py-1 rounded-full bg-danger-bg text-danger-text text-[10px] font-semibold border border-danger-border animate-pulse">Critical</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-warning-bg text-warning-text text-[10px] font-semibold border border-warning-border">Overdue</span>
                    )}
                    <span className="font-mono font-semibold text-maroon-600">₹{cust.outstandingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
