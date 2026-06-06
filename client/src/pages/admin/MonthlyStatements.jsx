import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, FileDown, CheckCircle, Search, X, Calendar, Filter, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { statementAPI } from '../../api/statement.api';
import { customerAPI } from '../../api/customer.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';
import { formatMonthYear } from '../../utils/date.utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig = {
  draft:   { bg: 'bg-surface-page', text: 'text-[#5A3A3A]', border: 'border-[rgba(123,28,28,0.15)]' },
  sent:    { bg: 'bg-info-bg', text: 'text-info-text', border: 'border-[#3B82F6]' },
  paid:    { bg: 'bg-success-bg', text: 'text-success-text', border: 'border-[#4CAF50]' },
  partial: { bg: 'bg-warning-bg', text: 'text-warning-text', border: 'border-[#D4A017]' },
  overdue: { bg: 'bg-danger-bg', text: 'text-danger-text', border: 'border-[#E53935]' },
};

const StatusBadge = ({ status }) => {
  const s = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${s.bg} ${s.text} border ${s.border}/30 uppercase`}>
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
const MonthlyStatements = () => {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const [showGenerate, setShowGenerate] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [search,  setSearch]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');
  const [filterYear,   setFilterYear]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['statements'],
    queryFn:  () => statementAPI.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const allStatements = data?.statements || [];

  // ── Client-side filtering ──────────────────────────────────────────────────
  const statements = allStatements.filter((s) => {
    const matchSearch = !search ||
      s.statementNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.organization?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || s.status === filterStatus;
    const matchMonth  = !filterMonth  || s.month === Number(filterMonth);
    const matchYear   = !filterYear   || s.year  === Number(filterYear);
    return matchSearch && matchStatus && matchMonth && matchYear;
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const downloadPDF = async (id, num) => {
    try {
      const { data: blob } = await statementAPI.getPDF(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${num}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF download failed');
    }
  };

  const markPaidMut = useMutation({
    mutationFn: ({ id, payload }) => statementAPI.markPaid(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      setPaymentTarget(null);
      toast.success('Payment recorded');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // ── Clear filters ──────────────────────────────────────────────────────────
  const hasFilters = search || filterStatus || filterMonth || filterYear;
  const clearFilters = () => {
    setSearch(''); setFilterStatus(''); setFilterMonth(''); setFilterYear('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-body">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Monthly Statements</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">
            {statements.length} of {allStatements.length} statement{allStatements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowGenerate(true)}
          className="btn-primary flex items-center justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
          <Plus className="w-4 h-4 mr-1.5" /> Generate Statement
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap gap-3 items-center bg-surface-card p-4 rounded-xl border border-[rgba(123,28,28,0.08)]">
        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or statement no."
            className="form-input pl-9 py-2 text-sm w-full" />
        </div>

        {/* Status filter */}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input py-2 text-sm min-w-32">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>

        {/* Month filter */}
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="form-input py-2 text-sm min-w-28">
          <option value="">All Months</option>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>

        {/* Year filter */}
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          className="form-input py-2 text-sm min-w-24">
          <option value="">All Years</option>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#5A3A3A] bg-maroon-50 rounded-lg border border-maroon-100 hover:bg-maroon-100 transition-colors">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {statements.map((stmt, i) => (
            <motion.div key={stmt._id}
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.025 }}
              className="bg-surface-card p-5 rounded-xl border border-[rgba(123,28,28,0.08)] shadow-sm hover:shadow-bpc-lg transition-all duration-300 hover:-translate-y-1 hover:border-maroon-300 relative overflow-hidden group cursor-pointer"
              onClick={() => navigate(stmt._id)}>

              {/* Decorative bg */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-maroon-50/50 rounded-bl-full pointer-events-none group-hover:bg-maroon-100/50 transition-all duration-300" />

              {/* Header row */}
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-maroon-50 flex items-center justify-center text-maroon-600 border border-maroon-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-[#1A0505] text-[14px]">{stmt.statementNumber}</p>
                    <p className="text-[11px] text-[#9A7A7A] mt-0.5">{formatMonthYear(stmt.month, stmt.year)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={stmt.status} />
                  {stmt.validationReport?.passed !== undefined && (
                    <span className={`text-[10px] ${stmt.validationReport.passed ? 'text-success-text' : 'text-danger-text'}`}>
                      {stmt.validationReport.passed ? '✓ Valid' : '✗ Issues'}
                    </span>
                  )}
                </div>
              </div>

              {/* Customer */}
              <div className="mb-4 relative z-10">
                <p className="text-[14px] font-semibold text-[#1A0505] truncate">{stmt.customer?.name}</p>
                <p className="text-[12px] text-[#9A7A7A] truncate">{stmt.customer?.organization || 'Individual'}</p>
                {stmt.totalOrders > 0 && (
                  <p className="text-[11px] text-maroon-400 mt-0.5">{stmt.totalOrders} orders</p>
                )}
              </div>

              {/* Financial grid */}
              <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                <div className="p-2.5 bg-surface-page border border-[rgba(123,28,28,0.05)] rounded-lg">
                  <span className="text-[10px] font-medium text-[#9A7A7A] uppercase tracking-wider">Billed</span>
                  <p className="font-semibold text-[#1A0505] text-sm mt-0.5">{formatINR(stmt.totalBilled)}</p>
                </div>
                <div className="p-2.5 bg-success-bg border border-success-border/20 rounded-lg">
                  <span className="text-[10px] font-medium text-success-text uppercase tracking-wider">Paid</span>
                  <p className="font-semibold text-success-text text-sm mt-0.5">{formatINR(stmt.totalPaid)}</p>
                </div>
                <div className="col-span-2 p-2.5 bg-warning-bg border border-warning-border/20 rounded-lg">
                  <span className="text-[10px] font-bold text-warning-text uppercase tracking-wider">Balance Due</span>
                  <p className="font-bold text-warning-text text-lg leading-tight mt-0.5">{formatINR(stmt.closingBalance)}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-[rgba(123,28,28,0.08)] relative z-10">
                <button onClick={(e) => { e.stopPropagation(); downloadPDF(stmt._id, stmt.statementNumber); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 font-medium text-maroon-700 bg-maroon-50 rounded-lg hover:bg-maroon-100 transition-colors border border-maroon-100">
                  <FileDown className="w-3.5 h-3.5" /> PDF
                </button>
                {stmt.status !== 'paid' && (
                  <button onClick={(e) => { e.stopPropagation(); setPaymentTarget(stmt); }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 font-medium text-success-text bg-success-bg rounded-lg hover:bg-success-bg/80 transition-colors border border-success-border/30">
                    <CheckCircle className="w-3.5 h-3.5" /> Record Payment
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {statements.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)]">
          <FileText className="w-12 h-12 text-maroon-200 mx-auto mb-4" />
          <p className="text-[#5A3A3A] font-medium text-[16px]">
            {hasFilters ? 'No statements match your filters' : 'No statements generated yet'}
          </p>
          <p className="text-[#9A7A7A] text-[14px] mt-1">
            {hasFilters
              ? <button onClick={clearFilters} className="text-maroon-600 hover:underline">Clear filters</button>
              : 'Generate your first monthly statement for a credit customer.'}
          </p>
        </div>
      )}

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerate && <GenerateStatementModal onClose={() => setShowGenerate(false)} />}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {paymentTarget && (
          <RecordPaymentModal 
            statement={paymentTarget} 
            onClose={() => setPaymentTarget(null)} 
            onConfirm={(payload) => markPaidMut.mutate({ id: paymentTarget._id, payload })}
            loading={markPaidMut.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate Statement Modal
// ─────────────────────────────────────────────────────────────────────────────
const GenerateStatementModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [loading,    setLoading]    = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [month,      setMonth]      = useState(new Date().getMonth() + 1);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [forceRegen, setForceRegen] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['customers', { accountType: 'monthly_credit' }],
    queryFn:  () => customerAPI.getAll({ accountType: 'monthly_credit', limit: 100 }).then((r) => r.data.data.customers),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await statementAPI.generate({ customerId, month, year, forceRegenerate: forceRegen });
      toast.success('Statement generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-md border border-[rgba(123,28,28,0.1)]">

        <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-maroon-50 text-maroon-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#1A0505]">Generate Statement</h2>
          </div>
          <button onClick={onClose} className="p-1.5 bg-maroon-50 rounded-full text-maroon-600 hover:bg-maroon-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-surface-page rounded-b-2xl">
          <div>
            <label className="form-label">Select Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="form-input" required>
              <option value="">Select credit customer</option>
              {(customers || []).map((c) => (
                <option key={c._id} value={c._id}>{c.name} — {c.organization || 'Individual'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Billing Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="form-input">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Billing Year</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="form-input" min="2020" max="2100" />
            </div>
          </div>

          {/* Force regenerate toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={forceRegen} onChange={(e) => setForceRegen(e.target.checked)}
              className="w-4 h-4 accent-maroon-700 rounded" />
            <span className="text-sm text-[#5A3A3A] font-medium">
              Overwrite existing statement (regenerate)
            </span>
          </label>

          <div className="bg-info-bg/50 border border-info-border/30 rounded-lg p-3">
            <p className="text-[12px] text-info-text flex items-start gap-2">
              <span className="text-base leading-none">ℹ️</span>
              All monthly_credit bills in this period will be included. Multiple same-day orders are preserved individually.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[rgba(123,28,28,0.08)]">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary w-full justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                : (forceRegen ? 'Regenerate Now' : 'Generate Now')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Record Payment Modal
// ─────────────────────────────────────────────────────────────────────────────
const RecordPaymentModal = ({ statement, onClose, onConfirm, loading }) => {
  const [amount, setAmount] = useState(statement.closingBalance);
  const [reference, setReference] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reference.trim()) return toast.error("Payment reference is required.");
    onConfirm({ amount, paymentReference: reference });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-sm border border-[rgba(123,28,28,0.1)] overflow-hidden">

        <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] bg-success-bg/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-[#4CAF50] flex items-center justify-center shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-[#1A0505]">Record Payment</h2>
              <p className="text-[12px] text-[#9A7A7A] mt-0.5">Stmt: {statement.statementNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white rounded-full text-[#4CAF50] hover:bg-success-bg transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-surface-page">
          <div>
            <label className="form-label text-[#4CAF50] font-semibold">Payment Amount (₹) *</label>
            <input type="number" step="0.01" max={statement.closingBalance} min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="form-input font-mono bg-success-bg/30 border-[#4CAF50]/30 focus:border-[#4CAF50] focus:ring-[#4CAF50]" required />
            <p className="text-[11px] text-[#9A7A7A] mt-1.5">Max balance due: {formatINR(statement.closingBalance)}</p>
          </div>

          <div>
            <label className="form-label">Payment Reference / Note *</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI Ref, Cheque No, Cash" className="form-input" required />
            <p className="text-[11px] text-maroon-500 mt-1.5 italic">* Compulsory for audit purposes</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[rgba(123,28,28,0.08)]">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 w-full justify-center shadow-[0_4px_16px_rgba(76,175,80,0.25)] bg-[#4CAF50] text-white py-3 rounded-xl hover:bg-[#43A047] font-medium transition-all flex items-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default MonthlyStatements;
