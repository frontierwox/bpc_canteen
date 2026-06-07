import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, X, Search, Tag, 
  Utensils, Coffee, Pizza, CupSoda, IceCream, 
  Cake, Salad, Leaf, Flame, Star, Heart, 
  Award, Clock, Sparkles, ThumbsUp, CheckCircle2, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryAPI } from '../../api/menu.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// Map string names to Lucide icons
const iconMap = {
  Utensils, Coffee, Pizza, CupSoda, IceCream, Cake, Salad, 
  Leaf, Flame, Star, Heart, Award, Clock, Sparkles, ThumbsUp, 
  CheckCircle2, Tag, ShoppingBag
};

const CategoryManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: categories, isLoading } = useQuery({ 
    queryKey: ['categories'], 
    queryFn: () => categoryAPI.getAll().then((r) => r.data.data) 
  });

  const deleteMut = useMutation({ 
    mutationFn: (id) => categoryAPI.delete(id), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
      setDeleteTarget(null); 
      toast.success('Category deleted successfully'); 
    }, 
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete category') 
  });

  const filteredCategories = categories?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const openEdit = (cat) => { setEditing(cat); setShowForm(true); };
  const openCreate = () => { setEditing(null); setShowForm(true); };

  const renderIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || Tag;
    return <IconComponent className="w-6 h-6 text-maroon-600" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-body">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Category Management</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">Manage menu categories and customized icons</p>
        </div>
        <button onClick={openCreate} className="btn-primary" id="add-category">
          <Plus className="w-4 h-4 mr-1.5" /> Add New Category
        </button>
      </div>

      <div className="bg-surface-card p-4 rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-wrap gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search categories..." 
            className="form-input pl-10 h-10" 
          />
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredCategories.map((cat, i) => (
            <motion.div 
              key={cat._id} 
              initial={{ y: 10, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: i * 0.05 }}
              className={`bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-bpc-lg hover:border-[rgba(123,28,28,0.15)] ${!cat.isActive ? 'opacity-75 grayscale-[0.3]' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-maroon-50 border border-maroon-100 flex items-center justify-center">
                  {renderIcon(cat.icon)}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wide uppercase ${cat.isActive ? 'bg-success-bg text-success-text border border-success-border/30' : 'bg-danger-bg text-danger-text border border-danger-border/30'}`}>
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </span>
                  {cat.isCustom && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-gold-100 text-gold-700 border border-gold-200 uppercase tracking-wide">
                      Custom
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="font-display font-semibold text-[#1A0505] text-lg leading-tight mb-1">
                  {cat.name}
                </h3>
                <p className="text-[13px] text-[#9A7A7A] mb-4">
                  {cat.itemCount || 0} Menu Item{(cat.itemCount !== 1) && 's'}
                </p>
                
                <div className="flex gap-2 mt-auto pt-4 border-t border-[rgba(123,28,28,0.05)]">
                  <button onClick={() => openEdit(cat)} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] py-2 font-medium text-maroon-700 bg-maroon-50 rounded-lg hover:bg-maroon-100 transition-colors border border-maroon-100">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(cat)} className="px-3 py-2 text-danger-text bg-danger-bg rounded-lg hover:bg-danger-bg/80 transition-colors border border-danger-border/30 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredCategories.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] mt-6">
          <Tag className="w-10 h-10 text-maroon-200 mx-auto mb-4" />
          <p className="text-[#5A3A3A] font-medium text-[15px]">No categories found</p>
          <p className="text-[#9A7A7A] text-[13px] mt-1">Add a new category to get started.</p>
        </div>
      )}

      <ConfirmDialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={() => deleteMut.mutate(deleteTarget._id)} 
        title="Delete Category" 
        message={`Are you sure you want to delete "${deleteTarget?.name}"? You cannot delete a category if it has associated menu items.`} 
        confirmText="Delete Category" 
        loading={deleteMut.isPending} 
      />

      <AnimatePresence>
        {showForm && (
          <CategoryForm 
            category={editing} 
            onClose={() => { setShowForm(false); setEditing(null); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CategoryForm = ({ category, onClose }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    icon: category?.icon || 'Tag',
    sortOrder: category?.sortOrder || 0,
    isActive: category?.isActive ?? true,
    isCustom: category?.isCustom ?? false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (category) {
        await categoryAPI.update(category._id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoryAPI.create(formData);
        toast.success('Category created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-[rgba(123,28,28,0.1)]">
        <div className="flex-shrink-0 bg-surface-page px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display font-bold text-xl text-[#1A0505]">{category ? 'Edit Category' : 'Add New Category'}</h2>
          <button onClick={onClose} className="p-1.5 bg-maroon-50 rounded-full text-maroon-600 hover:bg-maroon-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-surface-page rounded-b-2xl">
          <div>
            <label className="form-label">Category Name *</label>
            <input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="form-input" 
              placeholder="e.g. Starters, Main Course"
              required 
            />
          </div>
          
          <div>
            <label className="form-label">Sort Order</label>
            <input 
              type="number" 
              value={formData.sortOrder} 
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} 
              className="form-input text-sm" 
            />
          </div>

          <div>
            <label className="form-label mb-3">Select Icon</label>
            <div className="grid grid-cols-6 gap-2 max-h-[160px] overflow-y-auto p-2 border border-[rgba(123,28,28,0.1)] rounded-lg bg-white">
              {Object.keys(iconMap).map((iconName) => {
                const IconComponent = iconMap[iconName];
                const isSelected = formData.icon === iconName;
                return (
                  <div 
                    key={iconName}
                    onClick={() => setFormData({ ...formData, icon: iconName })}
                    className={`flex items-center justify-center p-2 rounded cursor-pointer transition-all ${isSelected ? 'bg-maroon-600 text-white shadow-md transform scale-105' : 'text-[#9A7A7A] hover:bg-maroon-50 hover:text-maroon-600'}`}
                    title={iconName}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer bg-surface-card p-3 rounded-lg border border-[rgba(123,28,28,0.08)] transition-colors hover:border-maroon-200">
              <input 
                type="checkbox" 
                checked={formData.isActive} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                className="w-4 h-4 rounded text-maroon-600 border-gray-300 focus:ring-maroon-600" 
              />
              <span className="text-[13px] font-medium text-[#1A0505]">Active</span>
            </label>
            
            <label className="flex items-center gap-2.5 cursor-pointer bg-surface-card p-3 rounded-lg border border-[rgba(123,28,28,0.08)] transition-colors hover:border-gold-300">
              <input 
                type="checkbox" 
                checked={formData.isCustom} 
                onChange={(e) => setFormData({ ...formData, isCustom: e.target.checked })} 
                className="w-4 h-4 rounded text-gold-500 border-gray-300 focus:ring-gold-500" 
              />
              <span className="text-[13px] font-medium text-[#1A0505]">Custom</span>
            </label>
          </div>
          
          <div className="flex gap-3 pt-6 border-t border-[rgba(123,28,28,0.08)]">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-[14px] font-medium text-[#5A3A3A] bg-surface-card border border-[rgba(123,28,28,0.1)] rounded-xl hover:bg-maroon-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary w-full justify-center shadow-[0_4px_16px_rgba(123,28,28,0.2)]">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CategoryManagement;
