import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, FileDown, CreditCard, Ban, Receipt, Clock, User, Building2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { billAPI } from '../../api/bill.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatINR } from '../../utils/currency.utils';
import { formatDate, formatDateTime } from '../../utils/date.utils';

const getStatusBadge = (status) => {
  const statusMap = {
    paid: { bg: 'bg-success-bg', text: 'text-success-text', border: 'border-success-border' },
    pending: { bg: 'bg-warning-bg', text: 'text-warning-text', border: 'border-warning-border' },
    partial: { bg: 'bg-info-bg', text: 'text-info-text', border: 'border-info-border' },
    cancelled: { bg: 'bg-danger-bg', text: 'text-danger-text', border: 'border-danger-border' }
  };
  const s = statusMap[status] || statusMap.pending;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold tracking-wide uppercase ${s.bg} ${s.text} border ${s.border}/30 shadow-sm`}>
      {status}
    </span>
  );
};

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [voidReason, setVoidReason] = useState('');

  const { data: bill, isLoading } = useQuery({ queryKey: ['bill', id], queryFn: () => billAPI.getById(id).then((r) => r.data.data) });

  const paymentMut = useMutation({ mutationFn: (data) => billAPI.recordPayment(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bill', id] }); queryClient.invalidateQueries({ queryKey: ['bills'] }); setShowPayment(false); setPayAmount(''); toast.success('Payment recorded successfully'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed to record payment') });
  const voidMut = useMutation({ mutationFn: (data) => billAPI.void(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bill', id] }); setShowVoid(false); toast.success('Bill voided successfully'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed to void bill') });

  const downloadPDF = async () => {
    try { const { data: blob } = await billAPI.getPDF(id); const url = window.URL.createObjectURL(new Blob([blob])); const a = document.createElement('a'); a.href = url; a.download = `${bill.billNumber}.pdf`; a.click(); window.URL.revokeObjectURL(url); } catch { toast.error('PDF download failed'); }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!bill) return <div className="flex flex-col items-center justify-center py-20 text-[#9A7A7A]"><Receipt className="w-12 h-12 mb-4 opacity-20" /><p>Bill not found</p></div>;

  const c = bill.customer || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-body pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl hover:bg-maroon-50 hover:text-maroon-700 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-maroon-800">{bill.billNumber}</h1>
              {getStatusBadge(bill.paymentStatus)}
            </div>
            <p className="text-[13px] text-[#9A7A7A] mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Created {formatDateTime(bill.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadPDF} className="px-4 py-2 bg-surface-card border border-[rgba(123,28,28,0.15)] text-[#1A0505] text-[13px] font-medium rounded-lg hover:bg-maroon-50 transition-colors shadow-sm flex items-center gap-2">
            <FileDown className="w-4 h-4 text-[#9A7A7A]" /> Download PDF
          </button>
          {bill.balanceDue > 0 && !bill.isVoid && (
            <button onClick={() => { setPayAmount(String(bill.balanceDue)); setShowPayment(true); }} className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-[#1A0505] text-[13px] font-bold rounded-lg transition-colors shadow-[0_4px_12px_rgba(212,160,23,0.3)] flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          )}
          {!bill.isVoid && (
            <button onClick={() => setShowVoid(true)} className="px-4 py-2 text-[13px] font-medium text-danger-text bg-danger-bg hover:bg-danger-bg/80 border border-danger-border/30 rounded-lg transition-colors flex items-center gap-2">
              <Ban className="w-4 h-4" /> Void Bill
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer Info */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30 flex items-center gap-2.5">
            <User className="w-4 h-4 text-maroon-600" />
            <h3 className="font-display font-semibold text-[#1A0505]">Customer Details</h3>
          </div>
          <div className="p-5 flex-1">
            <p className="font-semibold text-[#1A0505] text-[16px] mb-2">{c.name || 'Walk-in Customer'}</p>
            <div className="space-y-2.5 mt-4">
              {c.organization && (
                <div className="flex items-start gap-2.5 text-[13px] text-[#5A3A3A]">
                  <Building2 className="w-4 h-4 text-[#9A7A7A] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{c.organization}</p>
                    {c.department && <p className="text-[#9A7A7A] mt-0.5">{c.department}</p>}
                  </div>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2.5 text-[13px] text-[#5A3A3A]">
                  <Phone className="w-4 h-4 text-[#9A7A7A] shrink-0" />
                  <p>{c.phone}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bill Summary */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30 flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-maroon-600" />
            <h3 className="font-display font-semibold text-[#1A0505]">Bill Summary</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-[rgba(123,28,28,0.05)]">
              <span className="text-[13px] text-[#9A7A7A]">Billing Type</span>
              <span className={`text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-full border ${bill.billType === 'monthly_credit' ? 'bg-info-bg text-info-text border-[#3B82F6]/30' : 'bg-success-bg text-success-text border-[#4CAF50]/30'}`}>
                {bill.billType === 'monthly_credit' ? 'Credit Account' : 'Immediate Pay'}
              </span>
            </div>
            
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[#5A3A3A]">Subtotal</span>
                <span className="font-medium text-[#1A0505]">{formatINR(bill.subtotal)}</span>
              </div>
              {bill.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5A3A3A]">Tax ({bill.taxRate}%)</span>
                  <span className="font-medium text-[#1A0505]">{formatINR(bill.taxAmount)}</span>
                </div>
              )}
              {bill.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5A3A3A]">Discount</span>
                  <span className="font-medium text-success-text">-{formatINR(bill.discountAmount)}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-end mt-auto pt-4 border-t border-[rgba(123,28,28,0.08)]">
              <span className="font-medium text-[#1A0505]">Total Amount</span>
              <span className="text-2xl font-display font-bold text-maroon-800">{formatINR(bill.totalAmount)}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Info */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30 flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-maroon-600" />
            <h3 className="font-display font-semibold text-[#1A0505]">Payment Status</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-success-bg border border-success-border/20 rounded-xl">
                <span className="text-[11px] font-medium text-success-text uppercase tracking-wider block mb-1">Amount Paid</span>
                <span className="font-bold text-success-text text-lg">{formatINR(bill.paidAmount)}</span>
              </div>
              <div className="p-3 bg-warning-bg border border-warning-border/20 rounded-xl">
                <span className="text-[11px] font-medium text-warning-text uppercase tracking-wider block mb-1">Balance Due</span>
                <span className="font-bold text-warning-text text-lg">{formatINR(bill.balanceDue)}</span>
              </div>
            </div>
            
            <div className="mt-auto space-y-3 text-[13px] pt-2 border-t border-[rgba(123,28,28,0.05)]">
              <div className="flex justify-between">
                <span className="text-[#9A7A7A]">Payment Method</span>
                <span className="font-medium text-[#1A0505] capitalize bg-surface-page px-2 py-0.5 rounded border border-[rgba(123,28,28,0.08)]">{bill.paymentMethod?.replace('_', ' ') || 'N/A'}</span>
              </div>
              {bill.paymentDate && (
                <div className="flex justify-between">
                  <span className="text-[#9A7A7A]">Last Payment</span>
                  <span className="font-medium text-[#1A0505]">{formatDate(bill.paymentDate)}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Items Table */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-maroon-50/50 border-b border-[rgba(123,28,28,0.08)]">
          <h3 className="font-display font-semibold text-[#1A0505]">Ordered Items <span className="text-[#9A7A7A] font-normal text-sm ml-2">({bill.items?.length} items)</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(123,28,28,0.08)] bg-surface-page">
                <th className="px-6 py-3 font-medium text-[12px] text-[#9A7A7A] uppercase tracking-wider w-12">#</th>
                <th className="px-6 py-3 font-medium text-[12px] text-[#9A7A7A] uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 font-medium text-[12px] text-[#9A7A7A] uppercase tracking-wider text-center">Quantity</th>
                <th className="px-6 py-3 font-medium text-[12px] text-[#9A7A7A] uppercase tracking-wider text-right">Unit Rate</th>
                <th className="px-6 py-3 font-medium text-[12px] text-[#9A7A7A] uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(123,28,28,0.05)]">
              {bill.items?.map((item, i) => (
                <tr key={i} className="hover:bg-maroon-50/30 transition-colors">
                  <td className="px-6 py-4 text-[13px] text-[#9A7A7A] font-mono">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-6 py-4 font-medium text-[#1A0505] text-[14px]">{item.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block bg-surface-page border border-[rgba(123,28,28,0.08)] px-2 py-1 rounded text-[13px] font-medium text-[#5A3A3A] min-w-[3rem]">
                      {item.quantity} <span className="text-[10px] text-[#9A7A7A] font-normal uppercase ml-0.5">{item.unit}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[14px] text-[#5A3A3A]">{formatINR(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-[#1A0505] text-[15px]">{formatINR(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-page border-t border-[rgba(123,28,28,0.08)]">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right font-medium text-[#5A3A3A] text-[14px]">Subtotal</td>
                <td className="px-6 py-4 text-right font-bold text-[#1A0505] text-[16px]">{formatINR(bill.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={() => setShowPayment(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-sm flex flex-col border border-[rgba(123,28,28,0.1)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30">
              <h2 className="font-display font-bold text-xl text-[#1A0505]">Record Payment</h2>
              <p className="text-[13px] text-[#9A7A7A] mt-1">Outstanding Balance: <span className="font-bold text-warning-text">{formatINR(bill.balanceDue)}</span></p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="form-label">Payment Amount (₹)</label>
                <input type="number" step="0.01" max={bill.balanceDue} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="form-input text-lg font-mono font-bold" autoFocus />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPayment(false)} className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">Cancel</button>
                <button onClick={() => paymentMut.mutate({ amount: Number(payAmount) })} disabled={paymentMut.isPending || !payAmount || Number(payAmount) <= 0} className="flex-1 btn-primary justify-center">
                  {paymentMut.isPending ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDialog open={showVoid} onClose={() => setShowVoid(false)} onConfirm={() => voidMut.mutate({ reason: voidReason || 'Admin voided' })} title="Void Bill" message="This action is irreversible. The bill will be cancelled and balances adjusted." confirmText="Void Bill" variant="danger" loading={voidMut.isPending} />
    </div>
  );
};

export default BillDetail;
