import { create } from 'zustand';

/**
 * Zustand cart store for bill creation.
 * Manages items being added to a bill with quantity controls.
 */
const useCartStore = create((set, get) => ({
  items: [],
  customerId: null,
  customerData: null,
  billType: 'immediate',
  serviceDate: null,
  notes: '',
  paymentMethod: 'cash',
  settledByName: '',
  settledByPhone: '',
  settledByCompany: '',

  /**
   * Add item to cart or increment quantity if already exists.
   */
  addItem: (menuItem) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.menuItemId === menuItem._id);

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      set({ items: updated });
    } else {
      const price = menuItem.effectivePrice || menuItem.basePrice;
      set({
        items: [...items, {
          menuItemId: menuItem._id,
          name: menuItem.name,
          quantity: 1,
          unit: menuItem.unit || 'NOS',
          unitPrice: price,
          totalPrice: price,
          isVeg: menuItem.isVeg,
        }],
      });
    }
  },

  /**
   * Remove item from cart by index.
   */
  removeItem: (index) => {
    set({ items: get().items.filter((_, i) => i !== index) });
  },

  /**
   * Update item quantity at the given index.
   * Floors to integer and prevents negative values.
   * Automatically removes the item when quantity reaches zero.
   */
  updateQuantity: (index, quantity) => {
    const qty = Math.max(0, Math.floor(Number(quantity)) || 0);

    if (qty === 0) {
      // Remove the item entirely — a zero-quantity line item is invalid
      set({ items: get().items.filter((_, i) => i !== index) });
      return;
    }

    const updated = [...get().items];
    updated[index].quantity   = qty;
    updated[index].totalPrice = qty * updated[index].unitPrice;
    set({ items: updated });
  },

  /**
   * Set customer for the bill.
   */
  setCustomer: (customerId, customerData) => {
    const isCreditAccount = customerData?.accountType === 'monthly_credit';
    set({
      customerId,
      customerData,
      ...(isCreditAccount && { billType: 'monthly_credit', paymentMethod: 'credit' }),
    });
  },

  setBillType: (billType) => set({ billType }),
  setServiceDate: (serviceDate) => set({ serviceDate }),
  setNotes: (notes) => set({ notes }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  
  setSettledByName: (settledByName) => set({ settledByName }),
  setSettledByPhone: (settledByPhone) => set({ settledByPhone }),
  setSettledByCompany: (settledByCompany) => set({ settledByCompany }),

  /**
   * Calculate subtotal from all items.
   */
  getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),

  /**
   * Get total item count.
   */
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  /**
   * Reset cart to initial state.
   */
  clearCart: () => set({
    items: [],
    customerId: null,
    customerData: null,
    billType: 'immediate',
    serviceDate: null,
    notes: '',
    paymentMethod: 'cash',
    settledByName: '',
    settledByPhone: '',
    settledByCompany: '',
  }),
}));

export default useCartStore;
