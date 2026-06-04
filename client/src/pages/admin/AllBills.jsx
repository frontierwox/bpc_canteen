import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, FileDown, Eye, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { billAPI } from '../../api/bill.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';

const AllBills = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({ queryKey: ['bills', { search, paymentStatus: statusFilter, billType: typeFilter, page }], queryFn: () => billAPI.getAll({ search, paymentStatus: statusFilter, billType: typeFilter, page, limit: 20 }).then((r) => r.data.data) });

  const bills = data?.bills || [];
  const pagination = data?.pagination || {};

  const downloadPDF = async (id, billNumber) => {
    try {
      const { data: blob } = await billAPI.getPDF(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url; link.download = `${billNumber}.pdf`; link.click();
      window.URL.revokeObjectURL(url);
    } catch { /* handled silently */ }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { bg: 'bg-success-bg', text: 'text-success-text', border: 'border-[#4CAF50]' },
      pending: { bg: 'bg-warning-bg', text: 'text-warning-text', border: 'border-[#D4A017]' },
      partial: { bg: 'bg-info-bg', text: 'text-info-text', border: 'border-[#3B82F6]' },
      cancelled: { bg: 'bg-danger-bg', text: 'text-danger-text', border: 'border-[#E53935]' }
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
    <div className="space-y-6 max-w-7xl mx-auto font-body">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">All Bills</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">{pagination.total || 0} total bills generated</p>
        </div>
      </div>

      <div className="bg-surface-card p-4 rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-wrap gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by bill number or customer..." className="form-input pl-10" />
        </div>
        <div className="flex gap-4">
          <div className="relative min-w-[140px]">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input appearance-none pr-8 text-[#5A3A3A]">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A] pointer-events-none" />
          </div>
          <div className="relative min-w-[140px]">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input appearance-none pr-8 text-[#5A3A3A]">
              <option value="">All Types</option>
              <option value="immediate">Immediate</option>
              <option value="monthly_credit">Monthly Credit</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A] pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card-bpc overflow-hidden shadow-bpc">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-maroon-50/50 border-b border-[rgba(123,28,28,0.08)]">
                  <th className="px-5 py-4 font-semibold text-[13px] text-[#9A7A7A] uppercase tracking-wider">Bill No.</th>
                  <th className="px-5 py-4 font-semibold text-[13px] text-[#9A7A7A] uppercase tracking-wider">Date</th>
                  <th className="px-5 py-4 font-semibold text-[13px] text-[#9A7A7A] uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-4 font-semibold text-[13px] text-[#9A7A7A] uppercase tracking-wider">Type</th>
                  <th className="px-5 py-4 font-semibold text-[13px] text-[#9A7A7A] uppercase tracking-wider text-right">Amount</th>
                  <th className="px-5 py-4 font-semibold text-[13px] text-[#9A7A7A] uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-4 font-semibold text-[13px] text-[#9A7A7A] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(123,28,28,0.05)]">
                {bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-maroon-50/30 transition-colors bg-surface-page group">
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-maroon-700 bg-maroon-50 px-2 py-1 rounded text-[13px] border border-maroon-100">{bill.billNumber}</span>
                    </td>
                    <td className="px-5 py-4 text-[14px] text-[#5A3A3A] whitespace-nowrap">{formatDate(bill.billDate)}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1A0505] text-[14px]">{bill.customer?.name || 'Walk-in'}</p>
                      <p className="text-[12px] text-[#9A7A7A] mt-0.5">{bill.customer?.organization || ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-full border ${bill.billType === 'monthly_credit' ? 'bg-info-bg text-info-text border-[#3B82F6]/30' : 'bg-success-bg text-success-text border-[#4CAF50]/30'}`}>
                        {bill.billType === 'monthly_credit' ? 'Credit' : 'Immediate'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-mono font-bold text-[#1A0505] text-[15px]">{formatINR(bill.totalAmount)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {getStatusBadge(bill.paymentStatus)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/bills/${bill._id}`} className="p-2 text-[#9A7A7A] hover:text-maroon-600 hover:bg-maroon-50 rounded-lg transition-colors border border-transparent hover:border-maroon-100" title="View Details">
                          <Eye className="w-[18px] h-[18px]" />
                        </Link>
                        <button onClick={() => downloadPDF(bill._id, bill.billNumber)} className="p-2 text-[#9A7A7A] hover:text-maroon-600 hover:bg-maroon-50 rounded-lg transition-colors border border-transparent hover:border-maroon-100" title="Download PDF">
                          <FileDown className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-[#9A7A7A] bg-surface-page">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-[15px] font-medium text-[#5A3A3A]">No bills found</p>
                      <p className="text-[13px] mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(123,28,28,0.08)] bg-maroon-50/30">
              <p className="text-[13px] font-medium text-[#5A3A3A]">Page <span className="font-bold text-[#1A0505]">{pagination.page}</span> of {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-[13px] font-medium text-[#1A0505] bg-surface-card border border-[rgba(123,28,28,0.15)] rounded-lg hover:bg-maroon-50 transition-colors disabled:opacity-50 disabled:hover:bg-surface-card">Previous</button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="px-4 py-2 text-[13px] font-medium text-[#1A0505] bg-surface-card border border-[rgba(123,28,28,0.15)] rounded-lg hover:bg-maroon-50 transition-colors disabled:opacity-50 disabled:hover:bg-surface-card">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllBills;
