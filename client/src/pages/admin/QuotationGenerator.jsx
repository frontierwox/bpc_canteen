import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Download, Eye, FileText, Search,
  ChevronDown, ChevronUp, X, IndianRupee, Building2,
  CalendarDays, Hash, Percent, Tag, Package, User,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  ClipboardList, SlidersHorizontal, Filter, MapPin,
  ArrowRightLeft, Clock, Shield, FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { quotationAPI } from '../../api/quotation.api';
import { customerAPI } from '../../api/customer.api';
import { settingsAPI } from '../../api/settings.api';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// ─── Constants ────────────────────────────────────────────────────────────────
const UNIT_OPTIONS = ['NOS', 'KG', 'PLATE', 'BOX', 'LITRE', 'DOZEN', 'PACK'];
const STATUS_BADGE = {
  draft:    { label: 'Draft',    bg: 'bg-gray-100',   text: 'text-gray-600',  icon: FileText },
  sent:     { label: 'Sent',     bg: 'bg-blue-100',   text: 'text-blue-700',  icon: FileCheck },
  accepted: { label: 'Accepted', bg: 'bg-green-100',  text: 'text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-100',    text: 'text-red-700',   icon: AlertCircle },
  expired:  { label: 'Expired',  bg: 'bg-amber-100',  text: 'text-amber-700', icon: Clock },
};

const DEFAULT_TERMS = `Prices are subject to change without prior notice.
Payment terms: 50% advance, balance before event.
Cancellation charges may apply.`;

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const fmtCompact = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(n) || 0);

const today = () => new Date().toISOString().split('T')[0];

const addDays = (dateStr, days) => {
  const d = new Date(dateStr || Date.now());
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const calcGST = (subtotal, cgst, sgst, discount) => {
  const sub = Math.round((Number(subtotal) || 0) * 100);
  const cAmt = Math.round(sub * (Number(cgst) || 0) / 100);
  const sAmt = Math.round(sub * (Number(sgst) || 0) / 100);
  const disc = Math.round((Number(discount) || 0) * 100);
  const total = Math.max(0, sub + cAmt + sAmt - disc);
  return {
    subtotal: sub / 100,
    cgstAmount: cAmt / 100,
    sgstAmount: sAmt / 100,
    taxAmount: (cAmt + sAmt) / 100,
    discount: disc / 100,
    totalAmount: total / 100,
  };
};

const makeEmptyItem = () => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: 1,
  unit: 'NOS',
  unitPrice: '',
});

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Compact status badge */
const StatusBadge = ({ status }) => {
  const s = STATUS_BADGE[status] || STATUS_BADGE.draft;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${s.bg} ${s.text}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
};

/** Single line-item row (desktop) */
const ItemRow = ({ item, index, onChange, onRemove, canRemove }) => {
  const total = ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.18 }}
      className="group grid gap-2 items-start"
      style={{ gridTemplateColumns: '1fr 80px 90px 110px 100px 36px' }}
    >
      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label">Description</span>}
        <input
          value={item.name}
          onChange={(e) => onChange(item.id, 'name', e.target.value)}
          placeholder="e.g. Combo Dinner"
          className="form-input text-sm h-10"
        />
      </div>

      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label">Qty</span>}
        <input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onChange(item.id, 'quantity', e.target.value)}
          className="form-input text-sm h-10 text-center"
        />
      </div>

      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label">Unit</span>}
        <select
          value={item.unit}
          onChange={(e) => onChange(item.id, 'unit', e.target.value)}
          className="form-input text-sm h-10 pr-2 appearance-none cursor-pointer"
        >
          {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label">Rate (₹)</span>}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A7A7A] text-xs pointer-events-none">₹</span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={item.unitPrice}
            onChange={(e) => onChange(item.id, 'unitPrice', e.target.value)}
            placeholder="0.00"
            className="form-input text-sm h-10 pl-6"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label">Total</span>}
        <div className="h-10 flex items-center justify-end px-3 bg-maroon-50 border border-maroon-100 rounded-lg text-sm font-semibold text-maroon-700 font-mono whitespace-nowrap">
          {fmtCompact(total)}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label opacity-0">Del</span>}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          className="h-10 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

/** Mobile item card */
const ItemCard = ({ item, index, onChange, onRemove, canRemove }) => {
  const total = ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="bg-maroon-50/40 border border-maroon-100 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9A7A7A] uppercase tracking-wider">
          Item #{index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <label className="form-label">Description</label>
        <input
          value={item.name}
          onChange={(e) => onChange(item.id, 'name', e.target.value)}
          placeholder="e.g. Combo Dinner"
          className="form-input text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="form-label">Qty</label>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => onChange(item.id, 'quantity', e.target.value)}
            className="form-input text-sm text-center"
          />
        </div>
        <div>
          <label className="form-label">Unit</label>
          <select
            value={item.unit}
            onChange={(e) => onChange(item.id, 'unit', e.target.value)}
            className="form-input text-sm appearance-none cursor-pointer"
          >
            {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Rate (₹)</label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={item.unitPrice}
            onChange={(e) => onChange(item.id, 'unitPrice', e.target.value)}
            placeholder="0.00"
            className="form-input text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-maroon-100">
        <span className="text-xs text-[#9A7A7A]">Line Total</span>
        <span className="font-mono font-semibold text-maroon-700 text-sm">{fmt(total)}</span>
      </div>
    </motion.div>
  );
};

/** Summary totals box */
const TotalsBox = ({ subtotal, cgst, sgst, discount, gst }) => (
  <div className="rounded-xl border border-maroon-200 bg-gradient-to-br from-maroon-50 to-white overflow-hidden">
    <div className="px-5 py-3 border-b border-maroon-100 bg-maroon-50/60">
      <h4 className="text-xs font-semibold text-[#5A3A3A] uppercase tracking-widest flex items-center gap-2">
        <IndianRupee className="w-3.5 h-3.5" /> Estimated Amount
      </h4>
    </div>
    <div className="p-5 space-y-2.5">
      <div className="flex justify-between text-sm">
        <span className="text-[#9A7A7A]">Subtotal</span>
        <span className="font-mono font-medium text-[#1A0505]">{fmt(gst.subtotal)}</span>
      </div>
      {gst.cgstAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[#9A7A7A]">CGST ({cgst}%)</span>
          <span className="font-mono text-[#5A3A3A]">+ {fmt(gst.cgstAmount)}</span>
        </div>
      )}
      {gst.sgstAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[#9A7A7A]">SGST ({sgst}%)</span>
          <span className="font-mono text-[#5A3A3A]">+ {fmt(gst.sgstAmount)}</span>
        </div>
      )}
      {gst.discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[#9A7A7A]">Discount</span>
          <span className="font-mono text-green-600">− {fmt(gst.discount)}</span>
        </div>
      )}
      <div className="pt-2 mt-1 border-t border-maroon-200 flex justify-between items-center">
        <span className="font-semibold text-maroon-800 text-sm">Estimated Total</span>
        <span className="font-display font-bold text-2xl text-maroon-700 tracking-tight">
          {fmt(gst.totalAmount)}
        </span>
      </div>
    </div>
  </div>
);

/** Customer search + select dropdown */
const CustomerPicker = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  const { data: results, isFetching } = useQuery({
    queryKey: ['customers', 'search', q],
    queryFn: () => customerAPI.getAll({ search: q, limit: 8, isActive: true }).then((r) => r.data.data.customers),
    enabled: open,
    placeholderData: (prev) => prev,
  });

  const handleBlur = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.relatedTarget)) setOpen(false);
  }, []);

  const select = (c) => {
    onChange(c);
    setOpen(false);
    setQ('');
  };

  const displayName = value
    ? `${value.name}${value.organization ? ` — ${value.organization}` : ''}`
    : '';

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
      <div
        className={`form-input flex items-center gap-2 cursor-pointer select-none min-h-[48px] ${error ? 'error' : ''} ${open ? 'border-maroon-400 ring-[3px] ring-maroon-400/20 bg-white' : ''}`}
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((p) => !p); } }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {value
          ? (<><Building2 className="w-4 h-4 text-maroon-500 flex-shrink-0" /><span className="text-sm font-medium text-[#1A0505] truncate flex-1">{displayName}</span></>)
          : (<span className="text-[#9A7A7A] text-sm flex-1">Search by name, company…</span>)
        }
        <ChevronDown className={`w-4 h-4 text-[#9A7A7A] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 bg-white rounded-xl border border-[rgba(123,28,28,0.12)] shadow-bpc-lg overflow-hidden origin-top"
          >
            <div className="p-2 border-b border-[rgba(123,28,28,0.06)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A7A7A]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Type to filter…"
                  className="w-full h-9 pl-8 pr-3 text-sm bg-maroon-50 border border-maroon-100 rounded-lg outline-none focus:border-maroon-300"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
              {isFetching && (
                <li className="flex items-center justify-center py-6 text-[#9A7A7A] text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                </li>
              )}
              {!isFetching && (!results || results.length === 0) && (
                <li className="py-6 text-center text-[#9A7A7A] text-sm">No customers found</li>
              )}
              {!isFetching && results?.map((c) => (
                <li
                  key={c._id}
                  role="option"
                  aria-selected={value?._id === c._id}
                  onClick={() => select(c)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-maroon-50 ${value?._id === c._id ? 'bg-maroon-50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-maroon-100 border border-maroon-200 flex items-center justify-center text-maroon-600 text-xs font-bold flex-shrink-0">
                    {c.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1A0505] truncate">{c.name}</p>
                    {c.organization && <p className="text-xs text-[#9A7A7A] truncate">{c.organization}</p>}
                  </div>
                  {value?._id === c._id && <CheckCircle2 className="w-4 h-4 text-maroon-600 flex-shrink-0" />}
                </li>
              ))}
            </ul>

            {value && (
              <div className="p-2 border-t border-[rgba(123,28,28,0.06)]">
                <button
                  type="button"
                  onClick={() => { onChange(null); setOpen(false); }}
                  className="w-full py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
};

/** Missing Details Dialog */
const MissingDetailsDialog = ({ open, onClose, onSubmit, fields }) => {
  const [values, setValues] = useState({});

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[210] p-4"
          >
            <div className="bg-white rounded-2xl shadow-bpc-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)]">
                <h3 className="font-display text-lg font-semibold text-[#1A0505] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Additional Details Required
                </h3>
                <p className="text-xs text-[#9A7A7A] mt-1">
                  Please provide the following details to continue.
                </p>
              </div>
              <div className="p-6 space-y-4">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label className="form-label flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {f.label} *
                    </label>
                    <input
                      value={values[f.key] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="form-input text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-[rgba(123,28,28,0.08)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[#9A7A7A] hover:text-maroon-700 bg-maroon-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allFilled = fields.every((f) => (values[f.key] || '').trim());
                    if (!allFilled) {
                      toast.error('Please fill all required fields');
                      return;
                    }
                    onSubmit(values);
                  }}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/** Quotation list row */
const QuotationRow = ({ q: quot, onView, onDelete, onConvert, onPdf }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPdfLoading, setPdfLoading] = useState(false);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await quotationAPI.getPDF(quot._id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quot.quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 border-b border-[rgba(123,28,28,0.06)] last:border-0 hover:bg-maroon-50/40 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A0505] font-mono">{quot.quotationNumber}</p>
            <p className="text-xs text-[#9A7A7A] truncate">
              {quot.customer?.name || '—'}
              {quot.customer?.organization ? ` · ${quot.customer.organization}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-[#9A7A7A]">{quot.quotationDate ? new Date(quot.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
          </div>
          <div className="text-right min-w-[90px]">
            <p className="font-mono font-semibold text-maroon-700 text-sm">{fmt(quot.totalAmount)}</p>
          </div>
          <StatusBadge status={quot.status} />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
          <button type="button" onClick={() => onView(quot)} className="p-2 rounded-lg text-[#9A7A7A] hover:text-maroon-700 hover:bg-maroon-100 transition-colors" title="View details">
            <Eye className="w-4 h-4" />
          </button>
          <button type="button" onClick={handlePdf} disabled={isPdfLoading} className="p-2 rounded-lg text-[#9A7A7A] hover:text-maroon-700 hover:bg-maroon-100 transition-colors disabled:opacity-50" title="Download PDF">
            {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          {!quot.convertedToInvoice && (quot.status === 'draft' || quot.status === 'sent' || quot.status === 'accepted') && (
            <button type="button" onClick={() => onConvert(quot)} className="p-2 rounded-lg text-[#9A7A7A] hover:text-green-600 hover:bg-green-50 transition-colors" title="Convert to Invoice">
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={() => setConfirmOpen(true)} className="p-2 rounded-lg text-[#9A7A7A] hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { onDelete(quot._id); setConfirmOpen(false); }}
        title="Delete Quotation"
        message={`Delete quotation ${quot.quotationNumber}? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

/** Quotation detail slide-over */
const QuotationDetailPanel = ({ quotation, onClose, onPdf, onConvert }) => {
  if (!quotation) return null;
  const gst = calcGST(quotation.subtotal, quotation.cgst, quotation.sgst, quotation.discountAmount);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-bpc-xl z-[200] flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/40">
        <div>
          <p className="text-xs text-[#9A7A7A] uppercase tracking-widest font-medium">Quotation</p>
          <h3 className="font-mono font-bold text-maroon-800 text-lg leading-tight">{quotation.quotationNumber}</h3>
        </div>
        <div className="flex items-center gap-2">
          {!quotation.convertedToInvoice && (
            <button
              onClick={() => onConvert(quotation)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Convert
            </button>
          )}
          <button
            onClick={onPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#9A7A7A] hover:bg-maroon-100 hover:text-maroon-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status + Validity */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={quotation.status} />
          {quotation.convertedToInvoice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
              <ArrowRightLeft className="w-3 h-3" />
              Converted: {quotation.convertedToInvoice.invoiceNumber || 'Invoice'}
            </span>
          )}
        </div>

        {/* Customer + Event */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-maroon-50 rounded-xl">
            <p className="text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest mb-1.5">Customer Details</p>
            <p className="font-semibold text-[#1A0505] text-sm leading-snug">{quotation.customer?.name}</p>
            {quotation.customer?.organization && <p className="text-xs text-[#9A7A7A] mt-0.5">{quotation.customer.organization}</p>}
            {quotation.customer?.phone && <p className="text-xs text-[#9A7A7A] mt-0.5">{quotation.customer.phone}</p>}
          </div>
          <div className="p-4 bg-maroon-50 rounded-xl">
            <p className="text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest mb-1.5">Details</p>
            <p className="text-xs text-[#5A3A3A]"><span className="font-medium">Date: </span>
              {quotation.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
            <p className="text-xs text-[#5A3A3A] mt-1"><span className="font-medium">Valid Until: </span>
              {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Event Location + Service Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mb-1.5">Event Location</p>
            <p className="text-sm text-amber-900">{quotation.eventLocation || '—'}</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-widest mb-1.5">Service Venue</p>
            <p className="text-sm text-blue-900">{quotation.serviceVenue || '—'}</p>
          </div>
        </div>

        {/* Items table */}
        <div>
          <p className="text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest mb-3">Items / Services</p>
          <div className="rounded-xl border border-[rgba(123,28,28,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-maroon-50/60 border-b border-[rgba(123,28,28,0.08)]">
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest">Item</th>
                  <th className="text-center px-2 py-2.5 text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest">Qty</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest">Rate</th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((it, i) => (
                  <tr key={i} className="border-b border-[rgba(123,28,28,0.05)] last:border-0">
                    <td className="px-3 py-2.5 text-[#1A0505]">{it.name}</td>
                    <td className="px-2 py-2.5 text-center text-[#5A3A3A]">{it.quantity} {it.unit}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#5A3A3A]">{fmt(it.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-[#1A0505]">{fmt(it.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <TotalsBox subtotal={quotation.subtotal} cgst={quotation.cgst} sgst={quotation.sgst} discount={quotation.discountAmount} gst={gst} />

        {quotation.notes && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mb-1.5">Notes</p>
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{quotation.notes}</p>
          </div>
        )}

        {quotation.termsAndConditions && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{quotation.termsAndConditions}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Form validation ──────────────────────────────────────────────────────────
const validateForm = (form) => {
  const errors = {};
  if (!form.customer) errors.customer = 'Please select a customer';
  if (form.items.some((it) => !it.name.trim())) errors.items = 'All items must have a description';
  if (form.items.some((it) => !(Number(it.unitPrice) > 0))) errors.items = 'All items must have a positive price';
  if (form.items.some((it) => !(Number(it.quantity) >= 1))) errors.items = 'All quantities must be at least 1';
  return errors;
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const QuotationGenerator = () => {
  const queryClient = useQueryClient();

  // Settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  // Form state
  const [form, setForm] = useState(() => ({
    customer: null,
    quotationDate: today(),
    validUntil: addDays(today(), 15),
    items: [makeEmptyItem()],
    cgst: '',
    sgst: '',
    discountAmount: '',
    eventLocation: '',
    serviceVenue: '',
    notes: '',
    termsAndConditions: DEFAULT_TERMS,
  }));
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [missingDialog, setMissingDialog] = useState({ open: false, fields: [], pendingData: null });

  // Sync defaults
  const defaultsApplied = useRef(false);
  if (settings && !defaultsApplied.current) {
    defaultsApplied.current = true;
    setForm((f) => ({
      ...f,
      cgst: f.cgst === '' ? String(settings.defaultCGSTRate ?? 2.5) : f.cgst,
      sgst: f.sgst === '' ? String(settings.defaultSGSTRate ?? 2.5) : f.sgst,
    }));
  }

  // Live GST
  const subtotal = form.items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0
  );
  const gst = calcGST(subtotal, form.cgst, form.sgst, form.discountAmount);

  // Item operations
  const updateItem = useCallback((id, field, value) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it) => it.id === id ? { ...it, [field]: value } : it),
    }));
    setErrors((e) => ({ ...e, items: undefined }));
  }, []);

  const addItem = useCallback(() => {
    setForm((f) => ({ ...f, items: [...f.items, makeEmptyItem()] }));
  }, []);

  const removeItem = useCallback((id) => {
    setForm((f) => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((it) => it.id !== id) : f.items,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      customer: null,
      quotationDate: today(),
      validUntil: addDays(today(), 15),
      items: [makeEmptyItem()],
      cgst: String(settings?.defaultCGSTRate ?? 2.5),
      sgst: String(settings?.defaultSGSTRate ?? 2.5),
      discountAmount: '',
      eventLocation: '',
      serviceVenue: '',
      notes: '',
      termsAndConditions: DEFAULT_TERMS,
    });
    setErrors({});
    setShowAdvanced(false);
    defaultsApplied.current = true;
  }, [settings]);

  // List state
  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState('');
  const [listPage, setListPage] = useState(1);
  const [viewQuotation, setViewQuotation] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [convertConfirm, setConvertConfirm] = useState(null);

  const { data: quotationData, isLoading: listLoading, isFetching: listFetching } = useQuery({
    queryKey: ['quotations', listSearch, listStatus, listPage],
    queryFn: () => quotationAPI.getAll({
      search: listSearch || undefined,
      status: listStatus || undefined,
      page: listPage,
      limit: 10,
    }).then((r) => r.data.data),
    keepPreviousData: true,
  });

  // Create mutation
  const createMut = useMutation({
    mutationFn: (payload) => quotationAPI.create(payload),
    onSuccess: (res) => {
      toast.success(`Quotation ${res.data.data.quotationNumber} created!`);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      resetForm();
      setActiveTab('list');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create quotation');
    },
  });

  // Delete mutation
  const deleteMut = useMutation({
    mutationFn: (id) => quotationAPI.delete(id),
    onSuccess: () => {
      toast.success('Quotation deleted');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      if (viewQuotation) setViewQuotation(null);
    },
    onError: () => toast.error('Failed to delete quotation'),
  });

  // Convert to Invoice mutation
  const convertMut = useMutation({
    mutationFn: (id) => quotationAPI.convertToInvoice(id),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Converted to invoice!');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setConvertConfirm(null);
      if (viewQuotation) setViewQuotation(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to convert');
      setConvertConfirm(null);
    },
  });

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const firstErr = document.querySelector('[data-error-field]');
      firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Check if event location / service venue are missing
    const missingFields = [];
    if (!form.eventLocation.trim()) {
      missingFields.push({ key: 'eventLocation', label: 'Event Location', placeholder: 'e.g. Grand Hall, Trichy' });
    }
    if (!form.serviceVenue.trim()) {
      missingFields.push({ key: 'serviceVenue', label: 'Service Venue', placeholder: 'e.g. Hotel ABC, Srirangam' });
    }

    if (missingFields.length > 0) {
      setMissingDialog({ open: true, fields: missingFields, pendingData: true });
      return;
    }

    submitQuotation(form.eventLocation, form.serviceVenue);
  };

  const submitQuotation = (eventLoc, serviceVen) => {
    createMut.mutate({
      customer: form.customer._id,
      quotationDate: form.quotationDate,
      validUntil: form.validUntil,
      items: form.items.map(({ name, quantity, unit, unitPrice }) => ({
        name: name.trim(),
        quantity: Number(quantity),
        unit,
        unitPrice: Number(unitPrice),
      })),
      cgst: Number(form.cgst) || 0,
      sgst: Number(form.sgst) || 0,
      discountAmount: Number(form.discountAmount) || 0,
      eventLocation: eventLoc || form.eventLocation,
      serviceVenue: serviceVen || form.serviceVenue,
      notes: form.notes.trim() || undefined,
      termsAndConditions: form.termsAndConditions.trim() || undefined,
    });
  };

  // PDF handler
  const handleViewPdf = async (quot) => {
    const toastId = toast.loading('Generating PDF…');
    try {
      const res = await quotationAPI.getPDF(quot._id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quot.quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success('PDF downloaded', { id: toastId });
    } catch {
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-0 font-body pb-20 md:pb-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">
            Quotation Generator
          </h1>
          <p className="text-sm text-[#9A7A7A] mt-1">
            Create professional quotations for catering events
          </p>
        </div>

        <div className="flex rounded-xl border border-[rgba(123,28,28,0.12)] overflow-hidden bg-maroon-50/50 p-1 gap-1 self-start sm:self-auto flex-shrink-0">
          {[
            { id: 'create', label: 'New Quotation', icon: Plus },
            { id: 'list', label: 'All Quotations', icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === id
                  ? 'bg-maroon-600 text-white shadow-bpc-sm'
                  : 'text-[#5A3A3A] hover:bg-maroon-100'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CREATE TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left column */}
                <div className="xl:col-span-2 space-y-5">

                  {/* Quotation Details */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-maroon-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-maroon-600" />
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#1A0505]">Quotation Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Customer */}
                      <div className="md:col-span-2" data-error-field={errors.customer ? 'customer' : undefined}>
                        <label className="form-label flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Customer Details *
                        </label>
                        <CustomerPicker
                          value={form.customer}
                          onChange={(c) => {
                            setForm((f) => ({ ...f, customer: c }));
                            setErrors((e) => ({ ...e, customer: undefined }));
                          }}
                          error={errors.customer}
                        />
                      </div>

                      {/* Date */}
                      <div>
                        <label className="form-label flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" /> Quotation Date
                        </label>
                        <input
                          type="date"
                          value={form.quotationDate}
                          onChange={(e) => setForm((f) => ({ ...f, quotationDate: e.target.value, validUntil: addDays(e.target.value, 15) }))}
                          className="form-input"
                        />
                      </div>

                      {/* Valid Until */}
                      <div>
                        <label className="form-label flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Valid Until
                        </label>
                        <input
                          type="date"
                          value={form.validUntil}
                          onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                          min={form.quotationDate}
                          className="form-input"
                        />
                      </div>

                      {/* Event Location */}
                      <div>
                        <label className="form-label flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Event Location
                        </label>
                        <input
                          value={form.eventLocation}
                          onChange={(e) => setForm((f) => ({ ...f, eventLocation: e.target.value }))}
                          placeholder="e.g. Grand Hall, Trichy"
                          className="form-input"
                        />
                      </div>

                      {/* Service Venue */}
                      <div>
                        <label className="form-label flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Service Venue
                        </label>
                        <input
                          value={form.serviceVenue}
                          onChange={(e) => setForm((f) => ({ ...f, serviceVenue: e.target.value }))}
                          placeholder="e.g. Hotel ABC, Srirangam"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-maroon-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-maroon-600" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1A0505]">Items / Services</h2>
                        <span className="px-2 py-0.5 bg-maroon-100 text-maroon-700 rounded-full text-xs font-semibold">
                          {form.items.length}
                        </span>
                      </div>
                      {errors.items && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.items}
                        </p>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="hidden md:block space-y-2">
                        <AnimatePresence initial={false}>
                          {form.items.map((item, i) => (
                            <ItemRow key={item.id} item={item} index={i} onChange={updateItem} onRemove={removeItem} canRemove={form.items.length > 1} />
                          ))}
                        </AnimatePresence>
                      </div>

                      <div className="md:hidden space-y-3">
                        <AnimatePresence initial={false}>
                          {form.items.map((item, i) => (
                            <ItemCard key={item.id} item={item} index={i} onChange={updateItem} onRemove={removeItem} canRemove={form.items.length > 1} />
                          ))}
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        onClick={addItem}
                        className="mt-4 w-full h-11 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-maroon-200 text-maroon-500 text-sm font-medium hover:border-maroon-400 hover:text-maroon-700 hover:bg-maroon-50 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add another item
                      </button>
                    </div>
                  </div>

                  {/* Tax & Discount */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((p) => !p)}
                      className="w-full px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between hover:bg-maroon-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-maroon-100 flex items-center justify-center">
                          <Percent className="w-4 h-4 text-maroon-600" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1A0505]">Tax & Discount</h2>
                        {!showAdvanced && (
                          <span className="text-xs text-[#9A7A7A] font-normal font-body">
                            CGST {form.cgst || 0}% · SGST {form.sgst || 0}%
                            {Number(form.discountAmount) > 0 ? ` · Discount ₹${form.discountAmount}` : ''}
                          </span>
                        )}
                      </div>
                      {showAdvanced ? <ChevronUp className="w-4 h-4 text-[#9A7A7A]" /> : <ChevronDown className="w-4 h-4 text-[#9A7A7A]" />}
                    </button>

                    <AnimatePresence initial={false}>
                      {showAdvanced && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                              <label className="form-label flex items-center gap-1.5"><Percent className="w-3 h-3" /> CGST Rate (%)</label>
                              <input type="number" min={0} max={50} step={0.5} value={form.cgst} onChange={(e) => setForm((f) => ({ ...f, cgst: e.target.value }))} placeholder="2.5" className="form-input" />
                            </div>
                            <div>
                              <label className="form-label flex items-center gap-1.5"><Percent className="w-3 h-3" /> SGST Rate (%)</label>
                              <input type="number" min={0} max={50} step={0.5} value={form.sgst} onChange={(e) => setForm((f) => ({ ...f, sgst: e.target.value }))} placeholder="2.5" className="form-input" />
                            </div>
                            <div>
                              <label className="form-label flex items-center gap-1.5"><Tag className="w-3 h-3" /> Discount (₹)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A7A7A] text-xs pointer-events-none">₹</span>
                                <input type="number" min={0} step={0.01} value={form.discountAmount} onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))} placeholder="0.00" className="form-input pl-6" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notes */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3">
                      <h2 className="font-display text-lg font-semibold text-[#1A0505]">Notes <span className="text-sm font-body font-normal text-[#9A7A7A]">(Optional)</span></h2>
                    </div>
                    <div className="p-6">
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Special instructions, menu preferences…"
                        rows={2}
                        maxLength={2000}
                        className="form-input resize-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#1A0505]">Terms & Conditions</h2>
                    </div>
                    <div className="p-6">
                      <textarea
                        value={form.termsAndConditions}
                        onChange={(e) => setForm((f) => ({ ...f, termsAndConditions: e.target.value }))}
                        placeholder="Enter terms and conditions (one per line)…"
                        rows={4}
                        maxLength={3000}
                        className="form-input resize-none text-sm"
                      />
                      <p className="text-right text-[11px] text-[#9A7A7A] mt-1.5">
                        {form.termsAndConditions.length}/3000
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right column: summary */}
                <div className="xl:col-span-1">
                  <div className="xl:sticky xl:top-[80px] space-y-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[rgba(123,28,28,0.10)] shadow-bpc overflow-hidden">
                      <div className="px-5 py-4 border-b border-[rgba(123,28,28,0.08)] bg-gradient-to-r from-maroon-800 to-maroon-700">
                        <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-gold-300" /> Quotation Summary
                        </h3>
                      </div>
                      <div className="p-5">
                        <TotalsBox subtotal={subtotal} cgst={form.cgst} sgst={form.sgst} discount={form.discountAmount} gst={gst} />
                      </div>
                    </motion.div>

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={createMut.isPending}
                        className="w-full btn-primary h-12 text-base gap-2.5 shadow-[0_4px_16px_rgba(123,28,28,0.25)] hover:shadow-[0_6px_20px_rgba(123,28,28,0.3)] disabled:opacity-60"
                      >
                        {createMut.isPending
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                          : <><FileText className="w-4 h-4" /> Create Quotation</>
                        }
                      </button>

                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={createMut.isPending}
                        className="w-full h-11 flex items-center justify-center gap-2 text-sm font-medium text-[#9A7A7A] hover:text-maroon-700 bg-maroon-50 hover:bg-maroon-100 border border-maroon-100 rounded-xl transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reset Form
                      </button>
                    </div>

                    <div className="p-4 bg-amber-50/80 border border-amber-100 rounded-xl">
                      <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest mb-2">Tips</p>
                      <ul className="space-y-1.5 text-xs text-amber-800 leading-relaxed">
                        <li>• Validity defaults to 15 days</li>
                        <li>• GST rates default from settings</li>
                        <li>• Quotation PDF can be generated after saving</li>
                        <li>• Convert accepted quotations to invoices</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* LIST TAB */}
        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A]" />
                <input
                  value={listSearch}
                  onChange={(e) => { setListSearch(e.target.value); setListPage(1); }}
                  placeholder="Search by quotation number, notes…"
                  className="form-input pl-10 w-full"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A]" />
                <select
                  value={listStatus}
                  onChange={(e) => { setListStatus(e.target.value); setListPage(1); }}
                  className="form-input pl-9 pr-8 appearance-none cursor-pointer min-w-[150px]"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A] pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['quotations'] })}
                className="h-12 w-12 flex items-center justify-center border border-[rgba(123,28,28,0.12)] rounded-xl text-[#9A7A7A] hover:text-maroon-700 hover:bg-maroon-50 transition-colors flex-shrink-0"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${listFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-4 h-4 text-maroon-600" />
                  <h3 className="font-semibold text-[#1A0505]">
                    {quotationData?.pagination?.total ?? 0} Quotation{(quotationData?.pagination?.total ?? 0) !== 1 ? 's' : ''}
                  </h3>
                </div>
                <button type="button" onClick={() => setActiveTab('create')} className="btn-bpc text-xs h-8 px-3 gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>

              {listLoading ? (
                <div className="py-16 flex flex-col items-center gap-3 text-[#9A7A7A]">
                  <Loader2 className="w-8 h-8 animate-spin text-maroon-400" />
                  <p className="text-sm">Loading quotations…</p>
                </div>
              ) : !quotationData?.quotations?.length ? (
                <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-maroon-50 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-maroon-300" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-[#1A0505]">No quotations found</p>
                    <p className="text-sm text-[#9A7A7A] mt-1">
                      {listSearch || listStatus ? 'Try adjusting your filters.' : 'Create your first quotation to get started.'}
                    </p>
                  </div>
                  {!listSearch && !listStatus && (
                    <button type="button" onClick={() => setActiveTab('create')} className="btn-bpc text-sm gap-2 mt-1">
                      <Plus className="w-4 h-4" /> Create Quotation
                    </button>
                  )}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {quotationData.quotations.map((quot) => (
                    <QuotationRow
                      key={quot._id}
                      q={quot}
                      onView={setViewQuotation}
                      onDelete={(id) => deleteMut.mutate(id)}
                      onConvert={(q) => setConvertConfirm(q)}
                      onPdf={handleViewPdf}
                    />
                  ))}
                </AnimatePresence>
              )}

              {quotationData?.pagination?.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(123,28,28,0.06)] bg-maroon-50/20">
                  <p className="text-xs text-[#9A7A7A]">
                    Page {listPage} of {quotationData.pagination.pages} · {quotationData.pagination.total} total
                  </p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setListPage((p) => Math.max(1, p - 1))} disabled={listPage === 1} className="h-8 px-3 text-xs font-medium rounded-lg border border-[rgba(123,28,28,0.12)] text-[#5A3A3A] hover:bg-maroon-50 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                      ← Prev
                    </button>
                    <button type="button" onClick={() => setListPage((p) => Math.min(quotationData.pagination.pages, p + 1))} disabled={listPage === quotationData.pagination.pages} className="h-8 px-3 text-xs font-medium rounded-lg border border-[rgba(123,28,28,0.12)] text-[#5A3A3A] hover:bg-maroon-50 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Panel */}
      <AnimatePresence>
        {viewQuotation && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[195]" onClick={() => setViewQuotation(null)} />
            <QuotationDetailPanel
              quotation={viewQuotation}
              onClose={() => setViewQuotation(null)}
              onPdf={() => handleViewPdf(viewQuotation)}
              onConvert={(q) => { setViewQuotation(null); setConvertConfirm(q); }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Convert Confirm Dialog */}
      <ConfirmDialog
        open={!!convertConfirm}
        onClose={() => setConvertConfirm(null)}
        onConfirm={() => convertConfirm && convertMut.mutate(convertConfirm._id)}
        title="Convert to Invoice"
        message={`Convert quotation ${convertConfirm?.quotationNumber} to an invoice? This will create a new invoice with the same items and mark the quotation as accepted.`}
        confirmText={convertMut.isPending ? 'Converting…' : 'Convert'}
        variant="primary"
      />

      {/* Missing Details Dialog */}
      <MissingDetailsDialog
        open={missingDialog.open}
        onClose={() => setMissingDialog({ open: false, fields: [], pendingData: null })}
        fields={missingDialog.fields}
        onSubmit={(values) => {
          setForm((f) => ({ ...f, ...values }));
          setMissingDialog({ open: false, fields: [], pendingData: null });
          submitQuotation(values.eventLocation || form.eventLocation, values.serviceVenue || form.serviceVenue);
        }}
      />
    </div>
  );
};

export default QuotationGenerator;
