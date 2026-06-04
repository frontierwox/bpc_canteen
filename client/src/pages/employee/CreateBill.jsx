import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Leaf, Flame, ChevronRight, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { menuAPI, categoryAPI } from '../../api/menu.api';
import { customerAPI } from '../../api/customer.api';
import { billAPI } from '../../api/bill.api';
import useCartStore from '../../store/cartStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';

const CreateBill = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', organization: '', phone: '', accountType: 'immediate' });

  const { items, customerId, customerData, billType, notes, paymentMethod, addItem, removeItem, updateQuantity, setCustomer, setBillType, setNotes, setPaymentMethod, clearCart } = useCartStore();

  const { data: menuData, isLoading: menuLoading } = useQuery({ queryKey: ['menu', { limit: 200 }], queryFn: () => menuAPI.getAll({ limit: 200 }).then((r) => r.data.data) });
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => categoryAPI.getAll().then((r) => r.data.data) });
  const { data: customersData } = useQuery({ queryKey: ['customers', { search: customerSearch }], queryFn: () => customerAPI.getAll({ search: customerSearch, limit: 20 }).then((r) => r.data.data.customers) });

  const menuItems = menuData?.items || [];
  const categories = cats || [];
  const customers = customersData || [];

  const filteredItems = useMemo(() => {
    let list = menuItems.filter((i) => i.isAvailable);
    if (activeCategory !== 'all') list = list.filter((i) => (i.category?._id || i.category) === activeCategory);
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [menuItems, activeCategory, search]);

  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const createBillMut = useMutation({
    mutationFn: (data) => billAPI.create(data),
    onSuccess: (res) => {
      toast.success('Bill created successfully!');
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      navigate(res.data.data?.createdBy?.role === 'admin' ? '/admin/bills' : '/employee/bills');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create bill'),
  });

  const handleSubmit = () => {
    if (!customerId) { toast.error('Please select a customer'); return; }
    if (items.length === 0) { toast.error('Please add at least one item'); return; }

    createBillMut.mutate({
      customer: customerId,
      billType,
      items: items.map((i) => ({ menuItem: i.menuItemId, name: i.name, quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice })),
      paymentMethod,
      notes,
    });
  };

  const selectCustomer = (c) => {
    setCustomer(c._id, c);
    setBillType(c.accountType || 'immediate');
    setShowCustomerPicker(false);
    setIsAddingCustomer(false);
  };

  const createCustomerMut = useMutation({
    mutationFn: (data) => customerAPI.create(data),
    onSuccess: (res) => {
      toast.success('Customer created successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      selectCustomer(res.data.data);
      setNewCustomer({ name: '', organization: '', phone: '', accountType: 'immediate' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create customer'),
  });

  const handleCreateCustomer = () => {
    if (!newCustomer.name.trim()) { toast.error('Name is required'); return; }
    createCustomerMut.mutate(newCustomer);
  };

  if (menuLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-7rem)] font-body">
      {/* Left: Menu Selection */}
      <div className="flex-1 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-maroon-800 tracking-tight">Create Bill</h1>
            <p className="text-sm text-[#9A7A7A] mt-1">Select customer and add items to cart</p>
          </div>
          <button onClick={() => setShowCart(true)} className="lg:hidden relative p-3 bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] text-[#1A0505]">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-maroon-600 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-surface-page">{itemCount}</span>}
          </button>
        </div>

        {/* Customer Selection */}
        <div className="bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl p-4 shadow-sm">
          {customerData ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-maroon-50 border border-maroon-100 flex items-center justify-center text-maroon-700 font-bold text-lg">{customerData.name?.charAt(0)}</div>
                <div>
                  <p className="font-semibold text-[#1A0505] text-[15px]">{customerData.name}</p>
                  <p className="text-[13px] text-[#9A7A7A] mt-0.5">{customerData.organization || customerData.accountType}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border tracking-wide uppercase ${billType === 'monthly_credit' ? 'bg-info-bg text-info-text border-[#3B82F6]/30' : 'bg-success-bg text-success-text border-[#4CAF50]/30'}`}>{billType === 'monthly_credit' ? 'Credit Account' : 'Immediate Pay'}</span>
                <button onClick={() => { setCustomer(null, null); setBillType('immediate'); }} className="text-[13px] font-medium text-danger-text hover:text-danger-text/80 transition-colors">Change Customer</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCustomerPicker(true)} className="w-full py-4 border-2 border-dashed border-maroon-300 bg-maroon-50 rounded-xl text-[15px] font-semibold text-maroon-700 hover:border-maroon-400 hover:bg-maroon-100 hover:shadow-sm transition-all flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Select Customer
            </button>
          )}
        </div>

        {/* Search + Category */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className="form-input pl-10 h-[46px]" />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button onClick={() => setActiveCategory('all')} className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 border ${activeCategory === 'all' ? 'bg-maroon-700 text-white border-maroon-700 shadow-bpc' : 'bg-surface-card text-[#5A3A3A] border-[rgba(123,28,28,0.08)] hover:bg-maroon-50'}`}>All Items</button>
          {categories.map((c) => <button key={c._id} onClick={() => setActiveCategory(c._id)} className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 border whitespace-nowrap ${activeCategory === c._id ? 'bg-maroon-700 text-white border-maroon-700 shadow-bpc' : 'bg-surface-card text-[#5A3A3A] border-[rgba(123,28,28,0.08)] hover:bg-maroon-50'}`}>{c.icon} {c.name}</button>)}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const cartItem = items.find((i) => i.menuItemId === item._id);
            return (
              <motion.button key={item._id} whileTap={{ scale: 0.97 }} onClick={() => addItem(item)}
                className={`bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] p-4 text-left transition-all duration-200 flex flex-col h-full hover:border-maroon-300 hover:shadow-bpc relative overflow-hidden ${cartItem ? 'ring-2 ring-maroon-400 bg-maroon-50/50' : ''}`}>
                {cartItem && <div className="absolute top-0 right-0 w-8 h-8 bg-maroon-600 rounded-bl-xl text-white text-[12px] font-bold flex items-center justify-center">{cartItem.quantity}</div>}
                
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-3.5 h-3.5 rounded-sm border-[1.5px] flex items-center justify-center ${item.isVeg ? 'border-[#2D7A3A]' : 'border-[#E53935]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-[#2D7A3A]' : 'bg-[#E53935]'}`} />
                  </div>
                </div>
                
                <p className="font-semibold text-[#1A0505] text-[14px] leading-tight mb-3 flex-1">{item.name}</p>
                <div className="flex items-end justify-between w-full mt-auto">
                  <p className="text-maroon-700 font-bold text-[16px]">{formatINR(item.effectivePrice || item.basePrice)}</p>
                  {item.hasSpecialPrice && <span className="text-[10px] text-gold-500 font-medium bg-gold-400/10 px-1.5 py-0.5 rounded border border-gold-400/20">SPL</span>}
                </div>
              </motion.button>
            );
          })}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl">
            <p className="text-[#9A7A7A]">No items match your search.</p>
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="hidden lg:flex flex-col w-[380px] bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-xl shadow-sm sticky top-20 max-h-[calc(100vh-7rem)] overflow-hidden">
        <CartPanel items={items} subtotal={subtotal} billType={billType} notes={notes} paymentMethod={paymentMethod}
          updateQuantity={updateQuantity} removeItem={removeItem} setBillType={setBillType} setNotes={setNotes} setPaymentMethod={setPaymentMethod}
          handleSubmit={handleSubmit} loading={createBillMut.isPending} customerId={customerId} />
      </div>

      {/* Mobile Cart Sheet */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute bottom-0 left-0 right-0 bg-surface-page rounded-t-3xl max-h-[85vh] flex flex-col shadow-[-0_-10px_40px_rgba(123,28,28,0.1)]">
              <div className="flex-shrink-0 bg-surface-page px-6 py-4 border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between rounded-t-3xl relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[rgba(123,28,28,0.1)] rounded-full" />
                <h3 className="font-display font-bold text-xl text-[#1A0505]">Cart ({itemCount})</h3>
                <button onClick={() => setShowCart(false)} className="p-2 bg-maroon-50 rounded-full text-maroon-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CartPanel items={items} subtotal={subtotal} billType={billType} notes={notes} paymentMethod={paymentMethod}
                  updateQuantity={updateQuantity} removeItem={removeItem} setBillType={setBillType} setNotes={setNotes} setPaymentMethod={setPaymentMethod}
                  handleSubmit={handleSubmit} loading={createBillMut.isPending} customerId={customerId} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Picker Modal */}
      <AnimatePresence>
        {showCustomerPicker && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1A0505]/60 backdrop-blur-sm" onClick={() => { setShowCustomerPicker(false); setIsAddingCustomer(false); }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 bg-surface-page rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-[rgba(123,28,28,0.1)]">
              <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl text-[#1A0505]">{isAddingCustomer ? 'Add New Customer' : 'Select Customer'}</h2>
                  <div className="flex items-center gap-2">
                    {!isAddingCustomer && (
                      <button onClick={() => setIsAddingCustomer(true)} className="text-[13px] font-medium text-maroon-600 hover:bg-maroon-50 px-3 py-1.5 rounded-lg border border-[rgba(123,28,28,0.15)] transition-colors">
                        + New
                      </button>
                    )}
                    <button onClick={() => { setShowCustomerPicker(false); setIsAddingCustomer(false); }} className="p-1.5 bg-maroon-50 rounded-full text-maroon-600"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-surface-page">
                {isAddingCustomer ? (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="form-label">Name <span className="text-red-500">*</span></label>
                      <input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="form-input" placeholder="e.g. John Doe" autoFocus />
                    </div>
                    <div>
                      <label className="form-label">Organization / Department</label>
                      <input value={newCustomer.organization} onChange={e => setNewCustomer({...newCustomer, organization: e.target.value})} className="form-input" placeholder="e.g. Marketing" />
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="form-input" placeholder="Optional" />
                    </div>
                    <div>
                      <label className="form-label">Account Type</label>
                      <select value={newCustomer.accountType} onChange={e => setNewCustomer({...newCustomer, accountType: e.target.value})} className="form-input py-0">
                        <option value="immediate">Immediate Pay</option>
                        <option value="monthly_credit">Monthly Credit</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-[rgba(123,28,28,0.08)]">
                      <button onClick={() => setIsAddingCustomer(false)} className="flex-1 py-2.5 rounded-md border border-[rgba(123,28,28,0.15)] text-[#5A3A3A] font-medium text-sm hover:bg-surface-card transition-colors">Cancel</button>
                      <button onClick={handleCreateCustomer} disabled={createCustomerMut.isPending} className="flex-1 btn-primary py-2.5 disabled:opacity-50 h-auto">
                        {createCustomerMut.isPending ? 'Saving...' : 'Save & Select'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 pb-2">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
                        <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search name or organization..." className="form-input pl-10" autoFocus />
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {customers.map((c) => (
                        <button key={c._id} onClick={() => selectCustomer(c)} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-maroon-50 transition-colors text-left border border-transparent hover:border-[rgba(123,28,28,0.08)]">
                          <div className="w-12 h-12 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700 font-bold text-[16px]">{c.name?.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1A0505] text-[15px] truncate">{c.name}</p>
                            <p className="text-[13px] text-[#9A7A7A] truncate mt-0.5">{c.organization || c.accountType}</p>
                          </div>
                          <span className={`flex-shrink-0 text-[11px] font-medium tracking-wide uppercase px-2.5 py-1 rounded-full border ${c.accountType === 'monthly_credit' ? 'bg-info-bg text-info-text border-[#3B82F6]/30' : 'bg-success-bg text-success-text border-[#4CAF50]/30'}`}>{c.accountType === 'monthly_credit' ? 'Credit' : 'Immediate'}</span>
                        </button>
                      ))}
                      {customers.length === 0 && (
                        <div className="text-center py-10">
                          <p className="text-[#9A7A7A] mb-3">No customers found.</p>
                          <button onClick={() => setIsAddingCustomer(true)} className="text-sm font-medium text-maroon-600 hover:underline">Add as a new customer</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (mobile) */}
      {itemCount > 0 && !showCart && (
        <motion.button initial={{ y: 100 }} animate={{ y: 0 }} onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-[88px] left-4 right-4 btn-primary py-4 rounded-xl shadow-[0_8px_32px_rgba(123,28,28,0.3)] justify-between z-30 flex">
          <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> {itemCount} items</span>
          <span className="font-bold text-lg">{formatINR(subtotal)} →</span>
        </motion.button>
      )}
    </div>
  );
};

/** Shared cart panel for desktop sidebar and mobile sheet */
const CartPanel = ({ items, subtotal, billType, notes, paymentMethod, updateQuantity, removeItem, setBillType, setNotes, setPaymentMethod, handleSubmit, loading, customerId }) => (
  <div className="flex flex-col h-full bg-surface-card">
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center justify-center h-full text-[#9A7A7A]">
          <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-[15px] font-medium text-[#5A3A3A]">Cart is empty</p>
          <p className="text-[13px] mt-1">Tap items from the menu to add them</p>
        </div>
      ) : items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5 bg-surface-page border border-[rgba(123,28,28,0.05)] rounded-xl group">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#1A0505] text-[14px] leading-snug">{item.name}</p>
            <p className="text-[12px] text-[#9A7A7A] mt-1">{formatINR(item.unitPrice)} × {item.quantity}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-maroon-700">{formatINR(item.totalPrice)}</p>
              <button onClick={() => removeItem(i)} className="p-1.5 -mr-1.5 text-[#9A7A7A] hover:text-danger-text hover:bg-danger-bg rounded-md transition-all lg:opacity-0 group-hover:opacity-100 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-surface-card border border-[rgba(123,28,28,0.08)] rounded-md p-0.5">
              <button onClick={() => updateQuantity(i, item.quantity - 1)} className="w-7 h-7 rounded text-[#5A3A3A] flex items-center justify-center hover:bg-maroon-50 hover:text-maroon-600 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
              <input 
                type="text" 
                inputMode="numeric" 
                value={item.quantity === 0 ? '' : item.quantity}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  updateQuantity(i, val === '' ? 0 : parseInt(val, 10));
                }}
                onBlur={() => {
                  if (item.quantity === 0) updateQuantity(i, 1);
                }}
                className="w-10 text-center text-[13px] font-medium text-[#1A0505] bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-maroon-300 rounded px-1" 
              />
              <button onClick={() => updateQuantity(i, item.quantity + 1)} className="w-7 h-7 rounded text-[#5A3A3A] flex items-center justify-center hover:bg-maroon-50 hover:text-maroon-600 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="border-t border-[rgba(123,28,28,0.08)] p-5 space-y-4 bg-surface-page">
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-[#9A7A7A] uppercase tracking-wider mb-1.5">Bill Type</label>
          <select value={billType} onChange={(e) => setBillType(e.target.value)} className="form-input py-2.5 text-[14px]">
            <option value="immediate">Immediate Payment</option>
            <option value="monthly_credit">Monthly Credit Account</option>
          </select>
        </div>
        
        {billType === 'immediate' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="block text-[11px] font-medium text-[#9A7A7A] uppercase tracking-wider mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'upi', 'card', 'bank_transfer'].map(method => (
                <button key={method} onClick={() => setPaymentMethod(method)} className={`py-2 px-3 text-[13px] font-medium rounded-lg border transition-all ${paymentMethod === method ? 'bg-maroon-50 border-maroon-400 text-maroon-700 shadow-sm' : 'bg-surface-card border-[rgba(123,28,28,0.08)] text-[#5A3A3A] hover:bg-maroon-50/50'}`}>
                  {method === 'cash' ? 'Cash' : method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Bank'}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        
        <div>
          <label className="block text-[11px] font-medium text-[#9A7A7A] uppercase tracking-wider mb-1.5">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any special instructions..." className="form-input py-2.5 text-[14px]" />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-[rgba(123,28,28,0.08)]">
        <span className="text-[15px] font-medium text-[#5A3A3A]">Total Amount</span>
        <span className="text-2xl font-display font-bold text-maroon-800">{formatINR(subtotal)}</span>
      </div>

      <button onClick={handleSubmit} disabled={loading || items.length === 0 || !customerId} className="btn-primary w-full justify-center py-3.5 text-[15px] shadow-[0_8px_20px_rgba(123,28,28,0.2)] disabled:shadow-none">
        {loading ? (
          <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</div>
        ) : (
          <div className="flex items-center gap-2"><Receipt className="w-5 h-5" /> Generate Bill</div>
        )}
      </button>
    </div>
  </div>
);

export default CreateBill;
