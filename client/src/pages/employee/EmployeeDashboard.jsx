import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Receipt, Clock, IndianRupee, FileBarChart, CalendarDays } from 'lucide-react';
import { billAPI } from '../../api/bill.api';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';

const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['bills', { page: 1, limit: 10 }], queryFn: () => billAPI.getAll({ page: 1, limit: 10 }).then((r) => r.data.data) });

  if (isLoading) return <LoadingSpinner text="Loading..." />;
  const bills = data?.bills || [];
  const total = data?.pagination?.total || 0;

  const todayBills = bills.filter((b) => {
    const bd = new Date(b.billDate);
    const today = new Date();
    return bd.toDateString() === today.toDateString();
  });
  const todayRevenue = todayBills.reduce((s, b) => s + b.totalAmount, 0);

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { bg: 'bg-success-bg', text: 'text-success-text', border: 'border-[#4CAF50]' },
      pending: { bg: 'bg-warning-bg', text: 'text-warning-text', border: 'border-[#D4A017]' },
      partial: { bg: 'bg-info-bg', text: 'text-info-text', border: 'border-[#3B82F6]' },
    };
    const s = statusMap[status] || statusMap.pending;
    return (
      <span className={`inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-full text-[11px] font-medium tracking-[0.04em] ${s.bg} ${s.text} border border-[rgba(123,28,28,0.08)]`}>
        <span className={`w-[5px] h-[5px] rounded-full bg-current`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">Here's your day at a glance</p>
        </div>
        <div className="font-mono text-sm text-[#5A3A3A] bg-surface-card px-4 py-2 rounded-md border border-[rgba(123,28,28,0.08)]">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
        <button onClick={() => navigate('/employee/create-bill')} className="flex items-center gap-[14px] p-5 lg:p-6 bg-maroon-600 text-white rounded-xl shadow-bpc transition-all duration-220 hover:-translate-y-[2px] hover:bg-maroon-700 hover:shadow-bpc-lg text-left">
          <div className="w-10 h-10 rounded-md bg-white/15 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[15px] font-medium">New Bill</div>
            <div className="text-[11px] opacity-75 mt-0.5">Create a bill for walk-in customer</div>
          </div>
        </button>

        <button onClick={() => navigate('/employee/create-bill?type=monthly')} className="flex items-center gap-[14px] p-5 lg:p-6 bg-surface-card text-[#1A0505] rounded-xl border-[1.5px] border-[rgba(123,28,28,0.15)] transition-all duration-220 hover:-translate-y-[2px] hover:bg-maroon-50 hover:border-maroon-300 text-left">
          <div className="w-10 h-10 rounded-md bg-maroon-50 text-maroon-600 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[15px] font-medium">Monthly Entry</div>
            <div className="text-[11px] text-[#9A7A7A] mt-0.5">Add to ledger</div>
          </div>
        </button>

        <button onClick={() => navigate('/employee/statements')} className="flex items-center gap-[14px] p-5 lg:p-6 bg-surface-card text-[#1A0505] rounded-xl border-[1.5px] border-[rgba(123,28,28,0.15)] transition-all duration-220 hover:-translate-y-[2px] hover:bg-maroon-50 hover:border-maroon-300 text-left">
          <div className="w-10 h-10 rounded-md bg-maroon-50 text-maroon-600 flex items-center justify-center flex-shrink-0">
            <FileBarChart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[15px] font-medium">Statement</div>
            <div className="text-[11px] text-[#9A7A7A] mt-0.5">View & Print</div>
          </div>
        </button>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="font-semibold text-[#1A0505] mb-3">My Stats Today</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-surface-card p-5 rounded-lg border border-[rgba(123,28,28,0.08)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-maroon-50 flex items-center justify-center text-maroon-600 border border-maroon-100"><Receipt className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-[#9A7A7A] uppercase tracking-wide font-medium">Bills Created</p>
              <p className="text-2xl font-display font-semibold text-[#1A0505] leading-none mt-1">{todayBills.length}</p>
            </div>
          </motion.div>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-surface-card p-5 rounded-lg border border-[rgba(123,28,28,0.08)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center text-success-text border border-success-border/30"><IndianRupee className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-[#9A7A7A] uppercase tracking-wide font-medium">Total Billed</p>
              <p className="text-2xl font-display font-semibold text-[#1A0505] leading-none mt-1">{formatINR(todayRevenue)}</p>
            </div>
          </motion.div>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-surface-card p-5 rounded-lg border border-[rgba(123,28,28,0.08)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-bg flex items-center justify-center text-warning-text border border-warning-border/30"><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-[#9A7A7A] uppercase tracking-wide font-medium">Pending Dues</p>
              <p className="text-2xl font-display font-semibold text-[#1A0505] leading-none mt-1">{bills.filter(b => b.paymentStatus !== 'paid').length}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="card-bpc overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/50">
          <h2 className="font-semibold text-[#1A0505]">Recent Bills</h2>
          <Link to="/employee/bills" className="text-sm text-maroon-600 hover:text-maroon-800 font-medium">View All</Link>
        </div>
        <div className="divide-y divide-[rgba(123,28,28,0.05)]">
          {bills.slice(0, 5).map((bill) => (
            <div key={bill._id} className="flex items-center justify-between px-6 py-4 hover:bg-maroon-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-maroon-50 border border-maroon-100 flex items-center justify-center text-maroon-700 font-mono text-xs font-bold">
                  {bill.billNumber?.slice(-3) || '000'}
                </div>
                <div>
                  <p className="font-medium text-[#1A0505] text-sm">{bill.customer?.name || 'Walk-in'}</p>
                  <p className="text-xs text-[#9A7A7A] mt-0.5">{formatDate(bill.billDate)}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="font-mono font-semibold text-[#1A0505]">{formatINR(bill.totalAmount)}</p>
                {getStatusBadge(bill.paymentStatus)}
              </div>
            </div>
          ))}
          {bills.length === 0 && (
            <div className="text-center py-10">
              <p className="text-[#9A7A7A] text-sm">No bills yet. Create your first bill!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
