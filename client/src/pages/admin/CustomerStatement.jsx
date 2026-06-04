import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Download, CheckCircle, Calendar, User, Building, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { statementAPI } from '../../api/statement.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';
import { formatMonthYear } from '../../utils/date.utils';

const CustomerStatement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['statement', id],
    queryFn: () => statementAPI.getById(id).then((res) => res.data.data),
  });

  const markPaidMut = useMutation({
    mutationFn: (data) => statementAPI.markPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement', id] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  });

  const deleteMut = useMutation({
    mutationFn: () => statementAPI.delete(id),
    onSuccess: () => {
      toast.success('Statement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      navigate('/admin/statements');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete statement');
    }
  });

  const downloadPDF = async () => {
    try {
      const { data: blob } = await statementAPI.getPDF(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Statement_${data.statementNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return (
    <div className="text-center py-20 font-body">
      <h2 className="text-2xl font-display text-maroon-800">Statement Not Found</h2>
      <button onClick={() => navigate('/admin/statements')} className="mt-4 text-maroon-600 hover:underline">
        Back to Statements
      </button>
    </div>
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { bg: 'bg-surface-page', text: 'text-[#5A3A3A]', border: 'border-[rgba(123,28,28,0.15)]' },
      sent: { bg: 'bg-info-bg', text: 'text-info-text', border: 'border-[#3B82F6]' },
      paid: { bg: 'bg-success-bg', text: 'text-success-text', border: 'border-[#4CAF50]' },
      partial: { bg: 'bg-warning-bg', text: 'text-warning-text', border: 'border-[#D4A017]' },
      overdue: { bg: 'bg-danger-bg', text: 'text-danger-text', border: 'border-[#E53935]' }
    };
    const s = statusMap[status] || statusMap.draft;
    return (
      <span className={`inline-flex items-center gap-[5px] px-[12px] py-[4px] rounded-full text-[12px] font-medium tracking-[0.04em] ${s.bg} ${s.text} border ${s.border}/30 uppercase`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 font-body pb-10"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/statements')}
          className="flex items-center text-maroon-600 hover:text-maroon-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Statements
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this statement? You can easily regenerate it again based on the latest bill updates.')) {
                deleteMut.mutate();
              }
            }}
            disabled={deleteMut.isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-danger-text bg-danger-bg rounded-lg hover:bg-danger-bg/80 transition-colors border border-danger-border/30"
          >
            <Trash2 className="w-3 h-3 mr-1.5" /> Delete
          </button>
          {data.status !== 'paid' && (
            <button
              onClick={() => markPaidMut.mutate({ amount: data.closingBalance })}
              disabled={markPaidMut.isLoading}
              className="btn-bpc flex items-center shadow-sm"
            >
              <CheckCircle className="w-9 h-9 mr-1" /> Mark as Paid
            </button>
          )}
          <button
            onClick={downloadPDF}
            className="btn-primary flex items-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]"
          >
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </button>
        </div>
      </div>

      {/* Main Statement Header */}
      <div className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-maroon-50/50 rounded-bl-full pointer-events-none" />

        <div className="p-6 sm:p-8 relative z-10 border-b border-[rgba(123,28,28,0.08)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-maroon-50 flex items-center justify-center text-maroon-600 border border-maroon-100">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-maroon-800 tracking-tight">
                  {data.statementNumber}
                </h1>
                <p className="text-maroon-600/80 flex items-center mt-1 font-medium">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Statement for {formatMonthYear(data.month, data.year)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              {getStatusBadge(data.status)}
              <p className="text-sm text-[#9A7A7A]">
                Generated on {formatDate(data.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[rgba(123,28,28,0.08)] relative z-10">

          {/* Customer Info */}
          <div className="p-6 sm:p-8">
            <h3 className="text-[11px] font-bold text-[#9A7A7A] uppercase tracking-wider mb-4">Customer Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-maroon-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1A0505]">{data.customer?.name}</p>
                  <p className="text-xs text-[#9A7A7A] mt-0.5">Contact Person</p>
                </div>
              </div>
              {data.customer?.organization && (
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-maroon-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#1A0505]">{data.customer.organization}</p>
                    {data.customer?.department && <p className="text-xs text-[#9A7A7A] mt-0.5">{data.customer.department}</p>}
                  </div>
                </div>
              )}
              {data.customer?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-maroon-400" />
                  <p className="text-sm text-[#1A0505]">{data.customer.phone}</p>
                </div>
              )}
              {data.customer?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-maroon-400" />
                  <p className="text-sm text-[#1A0505]">{data.customer.email}</p>
                </div>
              )}
              {data.customer?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-maroon-400 mt-0.5" />
                  <p className="text-sm text-[#1A0505]">{data.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-6 sm:p-8 bg-surface-page/50">
            <h3 className="text-[11px] font-bold text-[#9A7A7A] uppercase tracking-wider mb-4">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl">
                <p className="text-xs font-medium text-[#9A7A7A]">Opening Balance</p>
                <p className="text-lg font-semibold text-[#1A0505] mt-1">{formatINR(data.openingBalance)}</p>
              </div>
              <div className="p-4 bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl">
                <p className="text-xs font-medium text-[#9A7A7A]">Total Billed</p>
                <p className="text-lg font-semibold text-[#1A0505] mt-1">{formatINR(data.totalBilled)}</p>
              </div>
              <div className="p-4 bg-success-bg border border-success-border/20 rounded-xl">
                <p className="text-xs font-medium text-success-text">Total Paid</p>
                <p className="text-lg font-semibold text-success-text mt-1">{formatINR(data.totalPaid)}</p>
              </div>
              <div className="p-4 bg-warning-bg border border-warning-border/30 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-warning-text uppercase tracking-wide">Closing Balance</p>
                <p className="text-2xl font-bold text-warning-text mt-1">{formatINR(data.closingBalance)}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30">
          <h2 className="font-display font-semibold text-lg text-maroon-800">Transactions & Orders</h2>
          <p className="text-sm text-[#9A7A7A]">Detailed breakdown of all items billed this month.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-page border-b border-[rgba(123,28,28,0.08)] text-[11px] uppercase tracking-wider text-[#9A7A7A]">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Particulars</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(123,28,28,0.05)]">
              {data.transactions && data.transactions.length > 0 ? (
                data.transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-maroon-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1A0505] whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4A4A4A]">
                      {tx.particulars}
                      {tx.billNumber && (
                        <span className="ml-2 text-xs text-[#9A7A7A] px-2 py-0.5 bg-surface-page rounded border border-[rgba(123,28,28,0.1)]">
                          Ref: {tx.billNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#1A0505] text-right">
                      {formatINR(tx.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-[#9A7A7A] text-sm">
                    No transactions found for this statement.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-surface-page/50 border-t border-[rgba(123,28,28,0.08)]">
              <tr>
                <td colSpan="2" className="px-6 py-4 text-right text-sm font-bold text-[#5A3A3A] uppercase tracking-wider">
                  Total Billed Amount
                </td>
                <td className="px-6 py-4 text-right text-lg font-bold text-maroon-800">
                  {formatINR(data.totalBilled)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </motion.div>
  );
};

export default CustomerStatement;
