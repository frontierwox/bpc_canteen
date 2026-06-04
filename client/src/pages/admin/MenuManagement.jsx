import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Star, X, Upload, Leaf, Flame, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuAPI, categoryAPI } from '../../api/menu.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatINR } from '../../utils/currency.utils';

const MenuManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['menu', { search, category: catFilter }], queryFn: () => menuAPI.getAll({ search, category: catFilter, limit: 100 }).then((r) => r.data.data) });
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => categoryAPI.getAll().then((r) => r.data.data) });

  const toggleMut = useMutation({ mutationFn: (id) => menuAPI.toggleAvailability(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['menu'] }); toast.success('Availability toggled'); } });
  const deleteMut = useMutation({ mutationFn: (id) => menuAPI.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['menu'] }); setDeleteTarget(null); toast.success('Item deactivated'); } });

  const items = data?.items || [];

  const openEdit = (item) => { setEditing(item); setShowForm(true); };
  const openCreate = () => { setEditing(null); setShowForm(true); };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-body">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Menu Items</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">{items.length} items total in catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary" id="add-menu-item">
          <Plus className="w-4 h-4 mr-1.5" /> Add New Item
        </button>
      </div>

      <div className="bg-surface-card p-4 rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-wrap gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu items..." className="form-input pl-10 h-10" />
        </div>
        <div className="relative min-w-[180px]">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="form-input appearance-none pr-8 h-10 text-[#5A3A3A]">
            <option value="">All Categories</option>
            {(cats || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <motion.div key={item._id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.02 }}
              className={`bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-bpc-lg hover:border-[rgba(123,28,28,0.15)] ${!item.isAvailable ? 'opacity-70 grayscale-[0.3]' : ''}`}>
              
              <div className="h-40 bg-maroon-50 relative overflow-hidden group">
                {item.image?.url ? (
                  <img src={item.image.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-maroon-200 flex items-center justify-center text-maroon-300 font-display font-bold text-xl">B</div>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                  <div className={`w-3.5 h-3.5 rounded-sm border-[1.5px] flex items-center justify-center ${item.isVeg ? 'border-[#2D7A3A]' : 'border-[#E53935]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-[#2D7A3A]' : 'bg-[#E53935]'}`} />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wide uppercase ${item.isAvailable ? 'bg-success-bg text-success-text border border-success-border/30' : 'bg-danger-bg text-danger-text border border-danger-border/30'}`}>
                    {item.isAvailable ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-[#1A0505] text-[15px] leading-tight flex-1 pr-2">
                    {item.name} {item.isCombo && <span className="text-[10px] bg-maroon-100 text-maroon-800 px-1.5 py-0.5 rounded ml-1 uppercase tracking-wide font-bold">Combo</span>}
                  </h3>
                </div>
                <p className="text-[12px] text-[#9A7A7A] mb-3">{item.category?.name}</p>
                
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-maroon-700">{formatINR(item.effectivePrice || item.basePrice)}</span>
                      {item.hasSpecialPrice && <span className="text-[12px] text-[#9A7A7A] line-through">{formatINR(item.basePrice)}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#9A7A7A] uppercase tracking-wider bg-maroon-50 px-2 py-1 rounded">{item.unit}</span>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-[rgba(123,28,28,0.05)]">
                  <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1 text-[12px] py-1.5 font-medium text-maroon-700 bg-maroon-50 rounded-lg hover:bg-maroon-100 transition-colors border border-maroon-100">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => toggleMut.mutate(item._id)} className={`flex-1 flex items-center justify-center gap-1 text-[12px] py-1.5 font-medium rounded-lg transition-colors border ${item.isAvailable ? 'text-warning-text bg-warning-bg hover:bg-warning-bg/80 border-warning-border/30' : 'text-success-text bg-success-bg hover:bg-success-bg/80 border-success-border/30'}`}>
                    {item.isAvailable ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="px-3 py-1.5 text-danger-text bg-danger-bg rounded-lg hover:bg-danger-bg/80 transition-colors border border-danger-border/30 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {items.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] mt-6">
          <Search className="w-10 h-10 text-maroon-200 mx-auto mb-4" />
          <p className="text-[#5A3A3A] font-medium text-[15px]">No menu items found</p>
          <p className="text-[#9A7A7A] text-[13px] mt-1">Try adjusting your filters or add a new item.</p>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMut.mutate(deleteTarget._id)} title="Deactivate Item" message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`} confirmText="Deactivate" loading={deleteMut.isPending} />

      <AnimatePresence>
        {showForm && <MenuItemForm item={editing} categories={cats} onClose={() => { setShowForm(false); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

/** Modal form for creating/editing menu items */
const MenuItemForm = ({ item, categories, onClose }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '', description: item?.description || '', category: item?.category?._id || item?.category || '',
    basePrice: item?.basePrice || '', unit: item?.unit || 'NOS', isVeg: item?.isVeg ?? true, isCombo: item?.isCombo ?? false, sortOrder: item?.sortOrder || 0, tags: item?.tags?.join(', ') || '',
    specialPriceActive: item?.specialPrice?.isActive ?? false,
    specialPriceAmount: item?.specialPrice?.price || '',
  });
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== 'specialPriceActive' && k !== 'specialPriceAmount') {
          fd.append(k, v);
        }
      });
      fd.append('specialPrice', JSON.stringify({ isActive: formData.specialPriceActive, price: formData.specialPriceAmount }));
      if (imageFile) fd.append('image', imageFile);

      if (item) {
        await menuAPI.update(item._id, fd);
        toast.success('Item updated');
      } else {
        await menuAPI.create(fd);
        toast.success('Item created');
      }
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-[rgba(123,28,28,0.1)]">
        <div className="flex-shrink-0 bg-surface-page px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display font-bold text-xl text-[#1A0505]">{item ? 'Edit Menu Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="p-1.5 bg-maroon-50 rounded-full text-maroon-600 hover:bg-maroon-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface-page">
          <div><label className="form-label">Name *</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" required /></div>
          <div><label className="form-label">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input resize-none" rows={2} /></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input" required>
                <option value="">Select Category</option>
                {(categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">Base Price (₹) *</label><input type="number" step="0.01" min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} className="form-input font-mono" required /></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="form-label">Unit</label>
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="form-input text-sm">
                {['NOS', 'CUP', 'GLASS', 'PLATE', 'SET', 'PIECE', 'KG', 'LITRE'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="form-label">Sort Order</label><input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} className="form-input text-sm" /></div>
            <div className="flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer bg-surface-card p-2 rounded-lg border border-[rgba(123,28,28,0.08)]">
                <input type="checkbox" checked={formData.isVeg} onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })} className="w-4 h-4 rounded text-[#2D7A3A] border-gray-300 focus:ring-[#2D7A3A]" />
                <span className="text-[13px] font-medium text-[#1A0505]">Vegetarian</span>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 cursor-pointer bg-surface-card p-2 rounded-lg border border-[rgba(123,28,28,0.08)]">
                <input type="checkbox" checked={formData.isCombo} onChange={(e) => setFormData({ ...formData, isCombo: e.target.checked })} className="w-4 h-4 rounded text-maroon-700 border-gray-300 focus:ring-maroon-700" />
                <span className="text-[13px] font-medium text-[#1A0505]">Is this a Combo?</span>
              </label>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 cursor-pointer bg-surface-card p-2 rounded-lg border border-[rgba(123,28,28,0.08)]">
                <input type="checkbox" checked={formData.specialPriceActive} onChange={(e) => setFormData({ ...formData, specialPriceActive: e.target.checked })} className="w-4 h-4 rounded text-gold-500 border-gray-300 focus:ring-gold-500" />
                <span className="text-[13px] font-medium text-[#1A0505]">Has Special Price?</span>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {formData.specialPriceActive && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label className="form-label">Special Price (₹) *</label>
                <input type="number" step="0.01" min="0" value={formData.specialPriceAmount} onChange={(e) => setFormData({ ...formData, specialPriceAmount: e.target.value })} className="form-input font-mono" required={formData.specialPriceActive} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div>
            <label className="form-label">Item Image</label>
            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[rgba(123,28,28,0.15)] bg-maroon-50/30 rounded-xl cursor-pointer hover:border-maroon-300 hover:bg-maroon-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Upload className="w-5 h-5 text-maroon-600" />
              </div>
              <span className="text-[14px] font-medium text-[#5A3A3A]">{imageFile ? imageFile.name : 'Click to upload image'}</span>
              <span className="text-[11px] text-[#9A7A7A]">PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="hidden" />
            </label>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-[rgba(123,28,28,0.08)]">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default MenuManagement;
