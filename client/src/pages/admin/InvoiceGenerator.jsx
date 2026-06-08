import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Download, Eye, FileText, Search,
  ChevronDown, ChevronUp, X, IndianRupee, Building2,
  CalendarDays, Hash, Percent, Tag, Package, User,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  ClipboardList, SlidersHorizontal, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceAPI } from '../../api/invoice.api';
import { customerAPI } from '../../api/customer.api';
import { settingsAPI } from '../../api/settings.api';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// ─── Constants ────────────────────────────────────────────────────────────────
const UNIT_OPTIONS = ['NOS', 'KG', 'PLATE', 'BOX', 'LITRE', 'DOZEN', 'PACK'];
const STATUS_BADGE = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  sent: { label: 'Sent', bg: 'bg-blue-100', text: 'text-blue-700' },
  paid: { label: 'Paid', bg: 'bg-green-100', text: 'text-green-700' },
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const fmtCompact = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(n) || 0);

const today = () => new Date().toISOString().split('T')[0];

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
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

/** Single line-item row inside the form */
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
      {/* Item name */}
      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label">Description</span>}
        <input
          value={item.name}
          onChange={(e) => onChange(item.id, 'name', e.target.value)}
          placeholder="e.g. Veg Biryani"
          className="form-input text-sm h-10"
        />
      </div>

      {/* Qty */}
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

      {/* Unit */}
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

      {/* Rate */}
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

      {/* Total */}
      <div className="flex flex-col gap-1">
        {index === 0 && <span className="form-label">Total</span>}
        <div className="h-10 flex items-center justify-end px-3 bg-maroon-50 border border-maroon-100 rounded-lg text-sm font-semibold text-maroon-700 font-mono whitespace-nowrap">
          {fmtCompact(total)}
        </div>
      </div>

      {/* Delete */}
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

/** Mobile-friendly item card (stacked layout for small screens) */
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
          placeholder="e.g. Veg Biryani"
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
        <IndianRupee className="w-3.5 h-3.5" /> Amount Summary
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
        <span className="font-semibold text-maroon-800 text-sm">Total Payable</span>
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

  // Close on outside click
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
            {/* Search input */}
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

/** Existing invoices list row */
const InvoiceRow = ({ inv, onView, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPdfLoading, setPdfLoading] = useState(false);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await invoiceAPI.getPDF(inv._id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
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
        {/* Invoice number + customer */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-maroon-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-maroon-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A0505] font-mono">{inv.invoiceNumber}</p>
            <p className="text-xs text-[#9A7A7A] truncate">
              {inv.customer?.name || '—'}
              {inv.customer?.organization ? ` · ${inv.customer.organization}` : ''}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-[#9A7A7A]">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
          </div>
          <div className="text-right min-w-[90px]">
            <p className="font-mono font-semibold text-maroon-700 text-sm">{fmt(inv.totalAmount)}</p>
          </div>
          <StatusBadge status={inv.status} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onView(inv)}
            className="p-2 rounded-lg text-[#9A7A7A] hover:text-maroon-700 hover:bg-maroon-100 transition-colors"
            title="View invoice details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePdf}
            disabled={isPdfLoading}
            className="p-2 rounded-lg text-[#9A7A7A] hover:text-maroon-700 hover:bg-maroon-100 transition-colors disabled:opacity-50"
            title="Download PDF"
          >
            {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="p-2 rounded-lg text-[#9A7A7A] hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { onDelete(inv._id); setConfirmOpen(false); }}
        title="Delete Invoice"
        message={`Delete invoice ${inv.invoiceNumber}? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

/** Invoice detail slide-over panel */
const InvoiceDetailPanel = ({ invoice, onClose, onPdf }) => {
  if (!invoice) return null;
  const gst = calcGST(invoice.subtotal, invoice.cgst, invoice.sgst, invoice.discountAmount);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-bpc-xl z-[200] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/40">
        <div>
          <p className="text-xs text-[#9A7A7A] uppercase tracking-widest font-medium">Invoice</p>
          <h3 className="font-mono font-bold text-maroon-800 text-lg leading-tight">{invoice.invoiceNumber}</h3>
        </div>
        <div className="flex items-center gap-2">
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
        {/* Customer + Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-maroon-50 rounded-xl">
            <p className="text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest mb-1.5">Bill To</p>
            <p className="font-semibold text-[#1A0505] text-sm leading-snug">{invoice.customer?.name}</p>
            {invoice.customer?.organization && <p className="text-xs text-[#9A7A7A] mt-0.5">{invoice.customer.organization}</p>}
            {invoice.customer?.phone && <p className="text-xs text-[#9A7A7A] mt-0.5">{invoice.customer.phone}</p>}
          </div>
          <div className="p-4 bg-maroon-50 rounded-xl">
            <p className="text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest mb-1.5">Details</p>
            <p className="text-xs text-[#5A3A3A]"><span className="font-medium">Date: </span>
              {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
            <p className="text-xs text-[#5A3A3A] mt-1"><span className="font-medium">Supply: </span>{invoice.placeOfSupply || 'Tamil Nadu'}</p>
            <div className="mt-2"><StatusBadge status={invoice.status} /></div>
          </div>
        </div>

        {/* Items table */}
        <div>
          <p className="text-[10px] font-semibold text-[#9A7A7A] uppercase tracking-widest mb-3">Line Items</p>
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
                {invoice.items?.map((it, i) => (
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

        {/* Totals */}
        <TotalsBox subtotal={invoice.subtotal} cgst={invoice.cgst} sgst={invoice.sgst} discount={invoice.discountAmount} gst={gst} />

        {/* Notes */}
        {invoice.notes && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mb-1.5">Notes</p>
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Settlement */}
        {invoice.settlementDetails?.settledByName && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-widest mb-1.5">Settlement Details</p>
            <p className="text-sm text-blue-900 font-medium">{invoice.settlementDetails.settledByName}</p>
            {invoice.settlementDetails.settledByCompany && <p className="text-xs text-blue-700">{invoice.settlementDetails.settledByCompany}</p>}
            {invoice.settlementDetails.settledByPhone && <p className="text-xs text-blue-700">{invoice.settlementDetails.settledByPhone}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Form validation ──────────────────────────────────────────────────────────
const validate = (form) => {
  const errors = {};
  if (!form.customer) errors.customer = 'Please select a customer';
  if (form.items.some((it) => !it.name.trim())) errors.items = 'All items must have a description';
  if (form.items.some((it) => !(Number(it.unitPrice) > 0))) errors.items = 'All items must have a positive price';
  if (form.items.some((it) => !(Number(it.quantity) >= 1))) errors.items = 'All quantities must be at least 1';
  return errors;
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const InvoiceGenerator = () => {
  const queryClient = useQueryClient();

  // ── Settings (for default GST rates) ────────────────────────────────────────
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  // ── Form State ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => ({
    customer: null,
    invoiceDate: today(),
    items: [makeEmptyItem()],
    cgst: '',
    sgst: '',
    discountAmount: '',
    placeOfSupply: 'Tamil Nadu',
    notes: '',
    settlementDetails: { settledByName: '', settledByPhone: '', settledByCompany: '' },
  }));
  const [errors, setErrors] = useState({});
  const [showSettlement, setShowSettlement] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync default GST rates from settings once loaded
  const defaultsApplied = useRef(false);
  if (settings && !defaultsApplied.current) {
    defaultsApplied.current = true;
    setForm((f) => ({
      ...f,
      cgst: f.cgst === '' ? String(settings.defaultCGSTRate ?? 2.5) : f.cgst,
      sgst: f.sgst === '' ? String(settings.defaultSGSTRate ?? 2.5) : f.sgst,
    }));
  }

  // ── Live GST calculation ─────────────────────────────────────────────────────
  const subtotal = form.items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0
  );
  const gst = calcGST(subtotal, form.cgst, form.sgst, form.discountAmount);

  // ── Item operations ──────────────────────────────────────────────────────────
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
      invoiceDate: today(),
      items: [makeEmptyItem()],
      cgst: String(settings?.defaultCGSTRate ?? 2.5),
      sgst: String(settings?.defaultSGSTRate ?? 2.5),
      discountAmount: '',
      placeOfSupply: 'Tamil Nadu',
      notes: '',
      settlementDetails: { settledByName: '', settledByPhone: '', settledByCompany: '' },
    });
    setErrors({});
    setShowSettlement(false);
    setShowAdvanced(false);
    defaultsApplied.current = true;
  }, [settings]);

  // ── Invoice list state ───────────────────────────────────────────────────────
  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState('');
  const [listPage, setListPage] = useState(1);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'

  const { data: invoiceData, isLoading: listLoading, isFetching: listFetching } = useQuery({
    queryKey: ['invoices', listSearch, listStatus, listPage],
    queryFn: () => invoiceAPI.getAll({
      search: listSearch || undefined,
      status: listStatus || undefined,
      page: listPage,
      limit: 10,
    }).then((r) => r.data.data),
    keepPreviousData: true,
  });

  // ── Create mutation ──────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (payload) => invoiceAPI.create(payload),
    onSuccess: (res) => {
      toast.success(`Invoice ${res.data.data.invoiceNumber} created!`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      resetForm();
      setActiveTab('list');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    },
  });

  // ── Delete mutation ──────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id) => invoiceAPI.delete(id),
    onSuccess: () => {
      toast.success('Invoice deleted');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (viewInvoice) setViewInvoice(null);
    },
    onError: () => toast.error('Failed to delete invoice'),
  });

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const firstErr = document.querySelector('[data-error-field]');
      firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const hasSd = form.settlementDetails.settledByName.trim() ||
      form.settlementDetails.settledByCompany.trim() ||
      form.settlementDetails.settledByPhone.trim();

    createMut.mutate({
      customer: form.customer._id,
      invoiceDate: form.invoiceDate,
      items: form.items.map(({ name, quantity, unit, unitPrice }) => ({
        name: name.trim(),
        quantity: Number(quantity),
        unit,
        unitPrice: Number(unitPrice),
      })),
      cgst: Number(form.cgst) || 0,
      sgst: Number(form.sgst) || 0,
      discountAmount: Number(form.discountAmount) || 0,
      placeOfSupply: form.placeOfSupply || 'Tamil Nadu',
      notes: form.notes.trim() || undefined,
      settlementDetails: hasSd ? {
        settledByName: form.settlementDetails.settledByName.trim() || undefined,
        settledByPhone: form.settlementDetails.settledByPhone.trim() || undefined,
        settledByCompany: form.settlementDetails.settledByCompany.trim() || undefined,
      } : undefined,
    });
  };

  // ── View-invoice PDF handler ─────────────────────────────────────────────────
  const handleViewPdf = async (inv) => {
    const toastId = toast.loading('Generating PDF…');
    try {
      const res = await invoiceAPI.getPDF(inv._id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
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

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">
            Invoice Generator
          </h1>
          <p className="text-sm text-[#9A7A7A] mt-1">
            Create standalone GST invoices for clients
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-[rgba(123,28,28,0.12)] overflow-hidden bg-maroon-50/50 p-1 gap-1 self-start sm:self-auto flex-shrink-0">
          {[
            { id: 'create', label: 'New Invoice', icon: Plus },
            { id: 'list', label: 'All Invoices', icon: ClipboardList },
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

      {/* ── CREATE TAB ───────────────────────────────────────────────────── */}
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

                {/* ── Left column: main form ─────────────────────────────── */}
                <div className="xl:col-span-2 space-y-5">

                  {/* Section: Invoice Header */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-maroon-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-maroon-600" />
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#1A0505]">Invoice Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                      {/* Customer picker */}
                      <div className="md:col-span-2" data-error-field={errors.customer ? 'customer' : undefined}>
                        <label className="form-label flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Bill To *
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
                          <CalendarDays className="w-3.5 h-3.5" /> Invoice Date
                        </label>
                        <input
                          type="date"
                          value={form.invoiceDate}
                          onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))}
                          max={today()}
                          className="form-input"
                        />
                      </div>

                      {/* Place of supply */}
                      <div>
                        <label className="form-label flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" /> Place of Supply
                        </label>
                        <input
                          value={form.placeOfSupply}
                          onChange={(e) => setForm((f) => ({ ...f, placeOfSupply: e.target.value }))}
                          placeholder="e.g. Tamil Nadu"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Line Items */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-maroon-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-maroon-600" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1A0505]">Line Items</h2>
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
                      {/* Desktop table layout */}
                      <div className="hidden md:block space-y-2">
                        <AnimatePresence initial={false}>
                          {form.items.map((item, i) => (
                            <ItemRow
                              key={item.id}
                              item={item}
                              index={i}
                              onChange={updateItem}
                              onRemove={removeItem}
                              canRemove={form.items.length > 1}
                            />
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Mobile card layout */}
                      <div className="md:hidden space-y-3">
                        <AnimatePresence initial={false}>
                          {form.items.map((item, i) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              index={i}
                              onChange={updateItem}
                              onRemove={removeItem}
                              canRemove={form.items.length > 1}
                            />
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Add item */}
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

                  {/* Section: Tax + Discount (expandable) */}
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
                      {showAdvanced
                        ? <ChevronUp className="w-4 h-4 text-[#9A7A7A]" />
                        : <ChevronDown className="w-4 h-4 text-[#9A7A7A]" />
                      }
                    </button>

                    <AnimatePresence initial={false}>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                              <label className="form-label flex items-center gap-1.5">
                                <Percent className="w-3 h-3" /> CGST Rate (%)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                step={0.5}
                                value={form.cgst}
                                onChange={(e) => setForm((f) => ({ ...f, cgst: e.target.value }))}
                                placeholder="2.5"
                                className="form-input"
                              />
                            </div>
                            <div>
                              <label className="form-label flex items-center gap-1.5">
                                <Percent className="w-3 h-3" /> SGST Rate (%)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                step={0.5}
                                value={form.sgst}
                                onChange={(e) => setForm((f) => ({ ...f, sgst: e.target.value }))}
                                placeholder="2.5"
                                className="form-input"
                              />
                            </div>
                            <div>
                              <label className="form-label flex items-center gap-1.5">
                                <Tag className="w-3 h-3" /> Discount (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A7A7A] text-xs pointer-events-none">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={form.discountAmount}
                                  onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                                  placeholder="0.00"
                                  className="form-input pl-6"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section: Notes */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <div className="px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3">
                      <h2 className="font-display text-lg font-semibold text-[#1A0505]">Notes <span className="text-sm font-body font-normal text-[#9A7A7A]">(Optional)</span></h2>
                    </div>
                    <div className="p-6">
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Payment terms, special instructions, thank you message…"
                        rows={3}
                        maxLength={2000}
                        className="form-input resize-none text-sm"
                      />
                      <p className="text-right text-[11px] text-[#9A7A7A] mt-1.5">
                        {form.notes.length}/2000
                      </p>
                    </div>
                  </div>

                  {/* Section: Settlement Details (expandable) */}
                  <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowSettlement((p) => !p)}
                      className="w-full px-6 py-4 bg-maroon-50/40 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between hover:bg-maroon-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1A0505]">Settlement Details</h2>
                        <span className="text-xs text-[#9A7A7A] font-body font-normal">Optional — for third-party payers</span>
                      </div>
                      {showSettlement
                        ? <ChevronUp className="w-4 h-4 text-[#9A7A7A]" />
                        : <ChevronDown className="w-4 h-4 text-[#9A7A7A]" />
                      }
                    </button>

                    <AnimatePresence initial={false}>
                      {showSettlement && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                              <label className="form-label">Settled By (Name)</label>
                              <input
                                value={form.settlementDetails.settledByName}
                                onChange={(e) => setForm((f) => ({ ...f, settlementDetails: { ...f.settlementDetails, settledByName: e.target.value } }))}
                                placeholder="Contact person name"
                                className="form-input text-sm"
                              />
                            </div>
                            <div>
                              <label className="form-label">Company</label>
                              <input
                                value={form.settlementDetails.settledByCompany}
                                onChange={(e) => setForm((f) => ({ ...f, settlementDetails: { ...f.settlementDetails, settledByCompany: e.target.value } }))}
                                placeholder="Organisation name"
                                className="form-input text-sm"
                              />
                            </div>
                            <div>
                              <label className="form-label">Phone</label>
                              <input
                                value={form.settlementDetails.settledByPhone}
                                onChange={(e) => setForm((f) => ({ ...f, settlementDetails: { ...f.settlementDetails, settledByPhone: e.target.value } }))}
                                placeholder="+91 XXXXX XXXXX"
                                className="form-input text-sm"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Right column: sticky summary + actions ──────────────── */}
                <div className="xl:col-span-1">
                  <div className="xl:sticky xl:top-[80px] space-y-4">

                    {/* Totals card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-[rgba(123,28,28,0.10)] shadow-bpc overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-[rgba(123,28,28,0.08)] bg-gradient-to-r from-maroon-800 to-maroon-700">
                        <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-gold-300" /> Invoice Summary
                        </h3>
                      </div>
                      <div className="p-5">
                        <TotalsBox
                          subtotal={subtotal}
                          cgst={form.cgst}
                          sgst={form.sgst}
                          discount={form.discountAmount}
                          gst={gst}
                        />
                      </div>
                    </motion.div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={createMut.isPending}
                        className="w-full btn-primary h-12 text-base gap-2.5 shadow-[0_4px_16px_rgba(123,28,28,0.25)] hover:shadow-[0_6px_20px_rgba(123,28,28,0.3)] disabled:opacity-60"
                      >
                        {createMut.isPending
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                          : <><FileText className="w-4 h-4" /> Create Invoice</>
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

                    {/* Tips */}
                    <div className="p-4 bg-amber-50/80 border border-amber-100 rounded-xl">
                      <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest mb-2">Tip</p>
                      <ul className="space-y-1.5 text-xs text-amber-800 leading-relaxed">
                        <li>• CGST & SGST default to settings values</li>
                        <li>• Use "Settlement Details" when someone else pays on behalf of the customer</li>
                        <li>• Invoice PDF is generated after saving</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── LIST TAB ─────────────────────────────────────────────────────── */}
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
                  placeholder="Search by invoice number or notes…"
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
                  <option value="paid">Paid</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A] pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
                className="h-12 w-12 flex items-center justify-center border border-[rgba(123,28,28,0.12)] rounded-xl text-[#9A7A7A] hover:text-maroon-700 hover:bg-maroon-50 transition-colors flex-shrink-0"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${listFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-bpc-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-4 h-4 text-maroon-600" />
                  <h3 className="font-semibold text-[#1A0505]">
                    {invoiceData?.pagination?.total ?? 0} Invoice{(invoiceData?.pagination?.total ?? 0) !== 1 ? 's' : ''}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="btn-bpc text-xs h-8 px-3 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>

              {/* List body */}
              {listLoading ? (
                <div className="py-16 flex flex-col items-center gap-3 text-[#9A7A7A]">
                  <Loader2 className="w-8 h-8 animate-spin text-maroon-400" />
                  <p className="text-sm">Loading invoices…</p>
                </div>
              ) : !invoiceData?.invoices?.length ? (
                <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-maroon-50 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-maroon-300" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-[#1A0505]">No invoices found</p>
                    <p className="text-sm text-[#9A7A7A] mt-1">
                      {listSearch || listStatus ? 'Try adjusting your filters.' : 'Create your first invoice to get started.'}
                    </p>
                  </div>
                  {!listSearch && !listStatus && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="btn-bpc text-sm gap-2 mt-1"
                    >
                      <Plus className="w-4 h-4" /> Create Invoice
                    </button>
                  )}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {invoiceData.invoices.map((inv) => (
                    <InvoiceRow
                      key={inv._id}
                      inv={inv}
                      onView={setViewInvoice}
                      onDelete={(id) => deleteMut.mutate(id)}
                    />
                  ))}
                </AnimatePresence>
              )}

              {/* Pagination */}
              {invoiceData?.pagination?.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(123,28,28,0.06)] bg-maroon-50/20">
                  <p className="text-xs text-[#9A7A7A]">
                    Page {listPage} of {invoiceData.pagination.pages} · {invoiceData.pagination.total} total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                      disabled={listPage === 1}
                      className="h-8 px-3 text-xs font-medium rounded-lg border border-[rgba(123,28,28,0.12)] text-[#5A3A3A] hover:bg-maroon-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setListPage((p) => Math.min(invoiceData.pagination.pages, p + 1))}
                      disabled={listPage === invoiceData.pagination.pages}
                      className="h-8 px-3 text-xs font-medium rounded-lg border border-[rgba(123,28,28,0.12)] text-[#5A3A3A] hover:bg-maroon-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invoice Detail Panel (slide-over) ─────────────────────────────── */}
      <AnimatePresence>
        {viewInvoice && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[195]"
              onClick={() => setViewInvoice(null)}
            />
            <InvoiceDetailPanel
              invoice={viewInvoice}
              onClose={() => setViewInvoice(null)}
              onPdf={() => handleViewPdf(viewInvoice)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoiceGenerator;
