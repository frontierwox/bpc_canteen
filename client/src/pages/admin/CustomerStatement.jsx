import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Download, CheckCircle, Calendar, User, Building,
  Phone, Mail, MapPin, Trash2, ChevronDown, ChevronRight, RefreshCw,
  ShieldCheck, Package, AlertCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { statementAPI } from '../../api/statement.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';
import { formatMonthYear } from '../../utils/date.utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDateIST = (dateString) => {
  if (!dateString) return '—';
  const istMs = new Date(dateString).getTime() + 330 * 60 * 1000;
  const d     = new Date(istMs);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getUTCDate()).padStart(2,'0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

const formatTimeIST = (dateString) => {
  if (!dateString) return '';
  const istMs = new Date(dateString).getTime() + 330 * 60 * 1000;
  const d     = new Date(istMs);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
};

const statusBadgeClass = (status) => {
  const map = {
    draft:   'bg-surface-page text-[#5A3A3A] border-[rgba(123,28,28,0.15)]',
    sent:    'bg-info-bg text-info-text border-[#3B82F6]',
    paid:    'bg-success-bg text-success-text border-[#4CAF50]',
    partial: 'bg-warning-bg text-warning-text border-[#D4A017]',
    overdue: 'bg-danger-bg text-danger-text border-[#E53935]',
  };
  return map[status] || map.draft;
};

// ─────────────────────────────────────────────────────────────────────────────
// DailySummaryRow — a single day's compact row, expandable to show order detail
// ─────────────────────────────────────────────────────────────────────────────
const DailySummaryRow = ({ day, idx }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Day header row */}
      <tr
        onClick={() => setExpanded((v) => !v)}
        className={`cursor-pointer transition-colors ${
          idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-page/40'
        } hover:bg-maroon-50/40`}
      >
        {/* Date */}
        <td className="px-4 py-3 text-sm font-semibold text-[#1A0505] whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-maroon-400">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
            {day.displayDate || formatDateIST(day.date)}
          </div>
        </td>

        {/* Order count badge */}
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            day.orderCount > 1
              ? 'bg-maroon-100 text-maroon-700 border border-maroon-200'
              : 'bg-surface-page text-[#9A7A7A] border border-[rgba(123,28,28,0.1)]'
          }`}>
            <Package className="w-3 h-3" />
            {day.orderCount} {day.orderCount === 1 ? 'order' : 'orders'}
          </span>
        </td>

        {/* Particulars preview (first order summary) */}
        <td className="px-4 py-3 text-sm text-[#4A4A4A] max-w-xs">
          {day.orderCount === 1
            ? <span>{day.orders[0].particulars}</span>
            : <span className="text-[#9A7A7A] italic">
                {day.orders.map(o => o.billNumber).join(', ')}
              </span>
          }
        </td>

        {/* Day total */}
        <td className="px-4 py-3 text-sm font-bold text-maroon-800 text-right whitespace-nowrap">
          {formatINR(day.dayTotal)}
        </td>
      </tr>

      {/* Expanded order rows */}
      <AnimatePresence>
        {expanded && day.orders.map((order, oi) => (
          <tr key={oi} className="bg-maroon-50/20 border-l-2 border-maroon-200">
            <td className="pl-10 pr-4 py-2.5">
              <div className="flex items-center gap-1.5 text-[12px] text-[#9A7A7A]">
                <Clock className="w-3.5 h-3.5" />
                <span>{order.time || '—'}</span>
              </div>
            </td>
            <td className="px-4 py-2.5">
              <span className="text-[11px] font-mono text-maroon-600 px-2 py-0.5 bg-maroon-50 rounded border border-maroon-100">
                {order.billNumber}
              </span>
            </td>
            <td className="px-4 py-2.5">
              {/* Item breakdown */}
              <div className="space-y-0.5">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2 text-[12px] text-[#4A4A4A]">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-[#9A7A7A]">×{item.quantity}</span>
                      <span className="text-[#9A7A7A] ml-auto">{formatINR(item.totalPrice)}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[12px] text-[#9A7A7A]">{order.particulars}</span>
                )}
              </div>
            </td>
            <td className="px-4 py-2.5 text-sm font-semibold text-[#1A0505] text-right whitespace-nowrap">
              {formatINR(order.amount)}
            </td>
          </tr>
        ))}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FlatTransactionRow — fallback when no dailySummary (old statements)
// ─────────────────────────────────────────────────────────────────────────────
const FlatTransactionRow = ({ tx, idx }) => (
  <tr className={`hover:bg-maroon-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-page/40'}`}>
    <td className="px-6 py-4 text-sm font-medium text-[#1A0505] whitespace-nowrap">
      {formatDateIST(tx.date)}
    </td>
    <td className="px-6 py-4 text-sm">
      <span>{tx.particulars}</span>
      {tx.billNumber && (
        <span className="ml-2 text-xs text-[#9A7A7A] px-2 py-0.5 bg-surface-page rounded border border-[rgba(123,28,28,0.1)]">
          {tx.billNumber}
        </span>
      )}
    </td>
    <td className="px-6 py-4 text-sm font-semibold text-right">{formatINR(tx.amount)}</td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const CustomerStatement = () => {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const queryClient     = useQueryClient();
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'flat'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['statement', id],
    queryFn:  () => statementAPI.getById(id).then((res) => res.data.data),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const markPaidMut = useMutation({
    mutationFn: (payload) => statementAPI.markPaid(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement', id] });
      toast.success('Payment recorded successfully');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to record payment'),
  });

  const regenerateMut = useMutation({
    mutationFn: () => statementAPI.regenerate(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      toast.success(`Regenerated: ${res.data.data?.statementNumber || ''}`, { icon: '🔄' });
      // Redirect to the newly generated statement ID
      if (res.data.data?._id) {
        navigate(`/admin/statements/${res.data.data._id}`, { replace: true });
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Regeneration failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () => statementAPI.delete(id),
    onSuccess: () => {
      toast.success('Statement deleted');
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      navigate('/admin/statements');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const downloadPDF = async () => {
    try {
      const { data: blob } = await statementAPI.getPDF(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `Statement_${data.statementNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return (
    <div className="text-center py-20 font-body">
      <AlertCircle className="w-12 h-12 text-maroon-300 mx-auto mb-4" />
      <h2 className="text-2xl font-display text-maroon-800">Statement Not Found</h2>
      <button onClick={() => navigate('/admin/statements')} className="mt-4 text-maroon-600 hover:underline">
        Back to Statements
      </button>
    </div>
  );

  // ── Data shortcuts ─────────────────────────────────────────────────────────
  const hasDailySummary  = data.dailySummary && data.dailySummary.length > 0;
  const transactions     = data.transactions  || [];
  const validationPassed = data.validationReport?.passed;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 font-body pb-10">

      {/* ── Header Actions ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate('/admin/statements')}
          className="flex items-center text-maroon-600 hover:text-maroon-800 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Statements
        </button>
        <div className="flex gap-2 flex-wrap">
          {/* Validation badge */}
          {validationPassed !== undefined && (
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              validationPassed
                ? 'bg-success-bg text-success-text border-success-border/30'
                : 'bg-danger-bg text-danger-text border-danger-border/30'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {validationPassed ? 'Validated' : 'Validation Failed'}
            </span>
          )}

          {/* Regenerate */}
          <button onClick={() => {
            if (window.confirm('Regenerate this statement with latest bill data?')) regenerateMut.mutate();
          }} disabled={regenerateMut.isLoading}
            className="flex items-center px-3 py-2 text-sm font-medium text-maroon-700 bg-maroon-50 rounded-lg hover:bg-maroon-100 transition-colors border border-maroon-100">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${regenerateMut.isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          {/* Delete */}
          <button onClick={() => {
            if (window.confirm('Delete this statement? You can regenerate it anytime.')) deleteMut.mutate();
          }} disabled={deleteMut.isLoading}
            className="flex items-center px-3 py-2 text-sm font-medium text-danger-text bg-danger-bg rounded-lg hover:bg-danger-bg/80 transition-colors border border-danger-border/30">
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
          </button>

          {/* Mark Paid */}
          {data.status !== 'paid' && (
            <button onClick={() => markPaidMut.mutate({ amount: data.closingBalance })}
              disabled={markPaidMut.isLoading}
              className="flex items-center px-3 py-2 text-sm font-medium text-success-text bg-success-bg rounded-lg hover:bg-success-bg/80 transition-colors border border-success-border/30">
              <CheckCircle className="w-4 h-4 mr-1.5" /> Mark Paid
            </button>
          )}

          {/* Download PDF */}
          <button onClick={downloadPDF}
            className="btn-primary flex items-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Statement Header Card ── */}
      <div className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-maroon-50/50 rounded-bl-full pointer-events-none" />

        {/* Title row */}
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
                  {formatMonthYear(data.month, data.year)}
                </p>
                {data.totalOrders > 0 && (
                  <p className="text-xs text-[#9A7A7A] mt-1">
                    {data.totalOrders} order{data.totalOrders !== 1 ? 's' : ''} in period
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase border ${statusBadgeClass(data.status)}`}>
                {data.status}
              </span>
              <p className="text-sm text-[#9A7A7A]">
                Generated {formatDateIST(data.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Financial summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[rgba(123,28,28,0.08)] relative z-10">

          {/* Customer Info */}
          <div className="p-6 sm:p-8">
            <h3 className="text-[11px] font-bold text-[#9A7A7A] uppercase tracking-wider mb-4">Customer Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-maroon-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1A0505]">{data.customer?.name}</p>
                  <p className="text-xs text-[#9A7A7A] mt-0.5">Customer</p>
                </div>
              </div>
              {data.customer?.organization && (
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-maroon-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#1A0505]">{data.customer.organization}</p>
                    {data.customer?.department && <p className="text-xs text-[#9A7A7A]">{data.customer.department}</p>}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl">
                <p className="text-xs font-medium text-[#9A7A7A]">Opening Balance</p>
                <p className="text-base font-semibold text-[#1A0505] mt-1">{formatINR(data.openingBalance)}</p>
              </div>
              <div className="p-3.5 bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl">
                <p className="text-xs font-medium text-[#9A7A7A]">Total Billed</p>
                <p className="text-base font-semibold text-[#1A0505] mt-1">{formatINR(data.totalBilled)}</p>
              </div>
              <div className="p-3.5 bg-success-bg border border-success-border/20 rounded-xl">
                <p className="text-xs font-medium text-success-text">Total Paid</p>
                <p className="text-base font-semibold text-success-text mt-1">{formatINR(data.totalPaid)}</p>
              </div>
              <div className="p-3.5 bg-warning-bg border border-warning-border/30 rounded-xl">
                <p className="text-xs font-bold text-warning-text uppercase tracking-wide">Balance Due</p>
                <p className="text-xl font-bold text-warning-text mt-0.5">{formatINR(data.closingBalance)}</p>
              </div>
            </div>

            {/* Reconciliation formula display */}
            <div className="mt-3 p-2.5 bg-surface-card border border-[rgba(123,28,28,0.05)] rounded-lg">
              <p className="text-[10px] text-[#9A7A7A] font-mono">
                Balance = {formatINR(data.openingBalance)} + {formatINR(data.totalBilled)} − {formatINR(data.totalPaid)} = <strong className="text-maroon-800">{formatINR(data.closingBalance)}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-semibold text-lg text-maroon-800">Transactions & Orders</h2>
            <p className="text-sm text-[#9A7A7A]">
              {hasDailySummary
                ? `${data.totalOrders || transactions.length} orders across ${data.dailySummary.length} day(s). Click a row to expand.`
                : `${transactions.length} transactions this month`}
            </p>
          </div>

          {/* View mode toggle */}
          {hasDailySummary && (
            <div className="flex rounded-lg overflow-hidden border border-[rgba(123,28,28,0.1)] text-sm">
              <button onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 font-medium transition-colors ${viewMode === 'daily' ? 'bg-maroon-700 text-white' : 'text-[#5A3A3A] hover:bg-maroon-50'}`}>
                By Day
              </button>
              <button onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 font-medium transition-colors border-l border-[rgba(123,28,28,0.1)] ${viewMode === 'flat' ? 'bg-maroon-700 text-white' : 'text-[#5A3A3A] hover:bg-maroon-50'}`}>
                All Orders
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-page border-b border-[rgba(123,28,28,0.08)] text-[11px] uppercase tracking-wider text-[#9A7A7A]">
                <th className="px-4 py-4 font-semibold">Date</th>
                <th className="px-4 py-4 font-semibold">Orders</th>
                <th className="px-4 py-4 font-semibold">Particulars</th>
                <th className="px-4 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(123,28,28,0.05)]">

              {/* Daily grouped view */}
              {viewMode === 'daily' && hasDailySummary && (
                data.dailySummary.map((day, idx) => (
                  <DailySummaryRow key={day.dayKey || idx} day={day} idx={idx} />
                ))
              )}

              {/* Flat view or fallback */}
              {(viewMode === 'flat' || !hasDailySummary) && (
                transactions.length > 0
                  ? transactions.map((tx, idx) => (
                      <FlatTransactionRow key={tx._id || idx} tx={tx} idx={idx} />
                    ))
                  : (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-[#9A7A7A] text-sm">
                        No transactions found for this statement.
                      </td>
                    </tr>
                  )
              )}
            </tbody>
            <tfoot className="bg-surface-page/50 border-t-2 border-[rgba(123,28,28,0.1)]">
              <tr>
                <td colSpan="3" className="px-4 py-4 text-right text-sm font-bold text-[#5A3A3A] uppercase tracking-wider">
                  Total Billed This Period
                </td>
                <td className="px-4 py-4 text-right text-lg font-bold text-maroon-800">
                  {formatINR(data.totalBilled)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Validation Report (shown if failed) ── */}
      {data.validationReport && !data.validationReport.passed && (
        <div className="bg-danger-bg border border-danger-border/30 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-danger-text mt-0.5" />
            <div>
              <h3 className="font-semibold text-danger-text">Validation Issues Detected</h3>
              <p className="text-sm text-danger-text/80 mt-0.5">
                The statement has calculation inconsistencies. Regenerate to fix.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {data.validationReport.checks?.filter(c => !c.passed).map((check, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-danger-text">
                <span className="font-bold">✗</span>
                <span>{check.name}: {check.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CustomerStatement;
