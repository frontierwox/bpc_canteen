import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Shield, Key, Mail, Phone, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '../../api/user.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const EmployeeManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPwd, setNewPwd] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['users', { search }], queryFn: () => userAPI.getAll({ search }).then((r) => r.data.data) });
  const deleteMut = useMutation({ mutationFn: (id) => userAPI.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setDeleteTarget(null); toast.success('User deactivated'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
  const resetPwdMut = useMutation({ mutationFn: ({ id, data }) => userAPI.resetPassword(id, data), onSuccess: () => { setResetTarget(null); setNewPwd(''); toast.success('Password reset successfully!'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });

  const users = data?.users || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-body">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Employees</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">{users.length} registered system users</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
          <Plus className="w-4 h-4 mr-1.5" /> Add Employee
        </button>
      </div>

      <div className="bg-surface-card p-4 rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-wrap gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees by name or email..." className="form-input pl-10 h-10" />
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.map((u, i) => (
            <motion.div key={u._id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.03 }}
              className={`bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-bpc-lg hover:border-[rgba(123,28,28,0.15)] group relative ${!u.isActive ? 'opacity-70 grayscale-[0.3]' : ''}`}>
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-maroon-50/50 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-maroon-100/50" />
              
              <div className="p-5 flex-1 flex flex-col relative z-10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-maroon-50 flex items-center justify-center text-maroon-700 font-display font-bold text-lg border border-maroon-100">
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A0505] text-[15px]">{u.name}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded border ${u.role === 'admin' ? 'bg-danger-bg text-danger-text border-danger-border/30' : 'bg-info-bg text-info-text border-info-border/30'}`}>
                        <Shield className="w-3 h-3" /> {u.role}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5 text-[13px] text-[#5A3A3A] mb-5 flex-1 mt-2">
                  <div className="flex items-center gap-2.5 bg-surface-page p-2 rounded-lg border border-[rgba(123,28,28,0.05)]">
                    <Mail className="w-4 h-4 text-[#9A7A7A]" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-2.5 bg-surface-page p-2 rounded-lg border border-[rgba(123,28,28,0.05)]">
                      <Phone className="w-4 h-4 text-[#9A7A7A]" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-[rgba(123,28,28,0.05)] mt-auto">
                  <button onClick={() => { setEditing(u); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 font-medium text-maroon-700 bg-maroon-50 rounded-lg hover:bg-maroon-100 transition-colors border border-maroon-100">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setResetTarget(u)} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 font-medium text-warning-text bg-warning-bg rounded-lg hover:bg-warning-bg/80 transition-colors border border-warning-border/30">
                    <Key className="w-3 h-3" /> Password
                  </button>
                  <button onClick={() => setDeleteTarget(u)} className="px-3 py-2 text-danger-text bg-danger-bg rounded-lg hover:bg-danger-bg/80 transition-colors border border-danger-border/30 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {users.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] mt-6">
          <User className="w-12 h-12 text-maroon-200 mx-auto mb-4" />
          <p className="text-[#5A3A3A] font-medium text-[16px]">No employees found</p>
          <p className="text-[#9A7A7A] text-[14px] mt-1">Add your first employee to grant them access.</p>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate(deleteTarget._id)} title="Deactivate Employee" message={`Are you sure you want to deactivate "${deleteTarget?.name}"? They will no longer be able to log in.`} confirmText="Deactivate" loading={deleteMut.isPending} />

      <AnimatePresence>
        {resetTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={() => setResetTarget(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-sm flex flex-col border border-[rgba(123,28,28,0.1)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] bg-maroon-50/30 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-xl text-[#1A0505]">Reset Password</h2>
                  <p className="text-[13px] text-[#9A7A7A] mt-0.5">For {resetTarget.name}</p>
                </div>
                <button onClick={() => setResetTarget(null)} className="p-1.5 bg-white rounded-full text-maroon-600 hover:bg-maroon-50 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="form-label">New Password</label>
                  <input value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Minimum 8 characters" className="form-input font-mono" type="password" autoFocus />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setResetTarget(null)} className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">Cancel</button>
                  <button onClick={() => resetPwdMut.mutate({ id: resetTarget._id, data: { newPassword: newPwd } })} disabled={newPwd.length < 8 || resetPwdMut.isPending} className="flex-1 btn-primary w-full justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
                    {resetPwdMut.isPending ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && <UserForm user={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const UserForm = ({ user, onClose }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [fd, setFd] = useState({ name: user?.name || '', email: user?.email || '', password: '', role: user?.role || 'employee', phone: user?.phone || '' });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (user) { const { password, ...updateData } = fd; await userAPI.update(user._id, updateData); toast.success('User updated successfully'); }
      else { await userAPI.create(fd); toast.success('User created successfully'); }
      queryClient.invalidateQueries({ queryKey: ['users'] }); onClose();
    } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-[rgba(123,28,28,0.1)]">
        
        <div className="flex-shrink-0 px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between rounded-t-2xl bg-surface-page">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-maroon-50 text-maroon-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#1A0505]">{user ? 'Edit Employee' : 'Add Employee'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 bg-maroon-50 rounded-full text-maroon-600 hover:bg-maroon-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-surface-page rounded-b-2xl">
          <div>
            <label className="form-label">Full Name *</label>
            <input value={fd.name} onChange={(e) => setFd({ ...fd, name: e.target.value })} className="form-input" required />
          </div>
          
          <div>
            <label className="form-label">Email Address *</label>
            <input type="email" value={fd.email} onChange={(e) => setFd({ ...fd, email: e.target.value })} className="form-input" required />
          </div>
          
          {!user && (
            <div>
              <label className="form-label">Temporary Password *</label>
              <input type="password" value={fd.password} onChange={(e) => setFd({ ...fd, password: e.target.value })} className="form-input font-mono" required minLength={8} placeholder="Min 8 characters" />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="form-label">System Role</label>
              <select value={fd.role} onChange={(e) => setFd({ ...fd, role: e.target.value })} className="form-input">
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input value={fd.phone} onChange={(e) => setFd({ ...fd, phone: e.target.value })} className="form-input" />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-[rgba(123,28,28,0.08)]">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary w-full justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : user ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EmployeeManagement;
