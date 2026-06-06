import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Building2, User, Phone, X, CreditCard, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerAPI } from '../../api/customer.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatINR } from '../../utils/currency.utils';

const CustomerManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['customers', { search, accountType: typeFilter }], queryFn: () => customerAPI.getAll({ search, accountType: typeFilter, limit: 100 }).then((r) => r.data.data) });
  const deleteMut = useMutation({ mutationFn: (id) => customerAPI.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setDeleteTarget(null); toast.success('Customer deleted'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete') });

  const customers = data?.customers || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-body">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Customers</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">{customers.length} registered customers</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
          <Plus className="w-4 h-4 mr-1.5" /> Add Customer
        </button>
      </div>

      <div className="bg-surface-card p-4 rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-wrap gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, organization, or phone..." className="form-input pl-10" />
        </div>
        <div className="relative min-w-[180px]">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input appearance-none pr-8 text-[#5A3A3A]">
            <option value="">All Account Types</option>
            <option value="immediate">Immediate Pay</option>
            <option value="monthly_credit">Monthly Credit</option>
          </select>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {customers.map((c, i) => (
            <motion.div key={c._id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.02 }} 
              className="bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-bpc-lg hover:border-[rgba(123,28,28,0.15)] group relative">
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-maroon-50/50 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-maroon-100/50" />
              
              <div className="p-5 flex-1 flex flex-col relative z-10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-maroon-50 flex items-center justify-center text-maroon-700 font-display font-bold text-lg border border-maroon-100">
                      {c.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A0505] text-[15px]">{c.name}</p>
                      <span className={`inline-block mt-1 text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded border ${c.accountType === 'monthly_credit' ? 'bg-info-bg text-info-text border-[#3B82F6]/30' : 'bg-success-bg text-success-text border-[#4CAF50]/30'}`}>
                        {c.accountType === 'monthly_credit' ? 'Credit Account' : 'Immediate'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-[13px] text-[#5A3A3A] mb-4 flex-1">
                  {c.organization && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#9A7A7A]" />
                      <span className="truncate">{c.organization} {c.department ? `(${c.department})` : ''}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#9A7A7A]" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#9A7A7A]" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>
                
                {c.outstandingBalance > 0 && (
                  <div className="px-3 py-2 bg-warning-bg border border-warning-border/20 rounded-lg mb-4 flex justify-between items-center">
                    <span className="text-[12px] font-medium text-warning-text uppercase tracking-wider">Outstanding</span>
                    <span className="font-bold text-warning-text text-[14px]">{formatINR(c.outstandingBalance)}</span>
                  </div>
                )}
                
                {c.outstandingBalance <= 0 && c.accountType === 'monthly_credit' && (
                  <div className="px-3 py-2 bg-success-bg/50 border border-success-border/10 rounded-lg mb-4 flex justify-between items-center">
                    <span className="text-[12px] font-medium text-success-text uppercase tracking-wider">Status</span>
                    <span className="font-bold text-success-text text-[12px]">All Cleared</span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t border-[rgba(123,28,28,0.05)] mt-auto">
                  <button onClick={() => { setEditing(c); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 font-medium text-maroon-700 bg-maroon-50 rounded-lg hover:bg-maroon-100 transition-colors border border-maroon-100">
                    <Edit2 className="w-3 h-3" /> Edit Profile
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="px-3 py-2 text-danger-text bg-danger-bg rounded-lg hover:bg-danger-bg/80 transition-colors border border-danger-border/30 flex items-center justify-center" title="Delete Customer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {customers.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] mt-6">
          <User className="w-12 h-12 text-maroon-200 mx-auto mb-4" />
          <p className="text-[#5A3A3A] font-medium text-[16px]">No customers found</p>
          <p className="text-[#9A7A7A] text-[14px] mt-1">Try adjusting your search filters or add a new customer.</p>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate(deleteTarget._id)} title="Delete Customer" message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action will also delete all associated bills and statements. This cannot be undone.`} confirmText="Delete" loading={deleteMut.isPending} />

      <AnimatePresence>
        {showForm && <CustomerForm customer={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const CustomerForm = ({ customer, onClose }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [fd, setFd] = useState({ name: customer?.name || '', organization: customer?.organization || '', department: customer?.department || '', phone: customer?.phone || '', email: customer?.email || '', address: customer?.address || '', accountType: customer?.accountType || 'immediate', notes: customer?.notes || '' });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (customer) { await customerAPI.update(customer._id, fd); toast.success('Customer updated'); } else { await customerAPI.create(fd); toast.success('Customer created'); }
      queryClient.invalidateQueries({ queryKey: ['customers'] }); onClose();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] border border-[rgba(123,28,28,0.1)]">
        
        <div className="flex-shrink-0 px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between rounded-t-2xl bg-surface-page">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-maroon-50 text-maroon-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#1A0505]">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 bg-maroon-50 rounded-full text-maroon-600 hover:bg-maroon-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface-page">
          <div>
            <label className="form-label">Full Name *</label>
            <input value={fd.name} onChange={(e) => setFd({ ...fd, name: e.target.value })} className="form-input" required />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Organization / Company</label>
              <input value={fd.organization} onChange={(e) => setFd({ ...fd, organization: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input value={fd.department} onChange={(e) => setFd({ ...fd, department: e.target.value })} className="form-input" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Phone Number</label>
              <input value={fd.phone} onChange={(e) => setFd({ ...fd, phone: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" value={fd.email} onChange={(e) => setFd({ ...fd, email: e.target.value })} className="form-input" />
            </div>
          </div>
          
          <div>
            <label className="form-label flex items-center gap-2">Account Type *</label>
            <select value={fd.accountType} onChange={(e) => setFd({ ...fd, accountType: e.target.value })} className="form-input" required>
              <option value="immediate">Immediate Payment</option>
              <option value="monthly_credit">Monthly Credit Account</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Internal Notes</label>
            <textarea value={fd.notes} onChange={(e) => setFd({ ...fd, notes: e.target.value })} className="form-input resize-none" rows={2} placeholder="Add any special instructions or notes..." />
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-[rgba(123,28,28,0.08)]">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary w-full justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : customer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CustomerManagement;
