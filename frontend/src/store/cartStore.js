import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items:        [],
  discount:     0,
  discountType: 'fixed',  // 'fixed' | 'percent'
  taxRate:      0,
  orderType:    'dine-in', // 'dine-in' | 'takeaway' | 'delivery'
  paymentMethod:'cash',
  amountPaid:   0,
  customerName:    '',
  customerPhone:   '',
  customerAddress: '',
  tableNumber:     '',
  notes:           '',

  addItem: (product) => {
    const items = get().items;
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      set({ items: items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...items, { productId: product.id, name: product.name, price: product.price, quantity: 1 }] });
    }
  },

  removeItem: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),

  updateQty: (productId, quantity) => {
    if (quantity <= 0) { get().removeItem(productId); return; }
    set({ items: get().items.map(i => i.productId === productId ? { ...i, quantity } : i) });
  },

  clearCart: () => set({
    items: [], discount: 0, discountType: 'fixed', taxRate: 0,
    amountPaid: 0, customerName: '', customerPhone: '', customerAddress: '', tableNumber: '', notes: '',
  }),

  setDiscount:        (v) => set({ discount: Number(v) }),
  setDiscountType:    (v) => set({ discountType: v }),
  setTaxRate:         (v) => set({ taxRate: Number(v) }),
  setOrderType:       (v) => set({ orderType: v }),
  setPaymentMethod:   (v) => set({ paymentMethod: v }),
  setAmountPaid:      (v) => set({ amountPaid: Number(v) }),
  setCustomerName:    (v) => set({ customerName: v }),
  setCustomerPhone:   (v) => set({ customerPhone: v }),
  setCustomerAddress: (v) => set({ customerAddress: v }),
  setTableNumber:     (v) => set({ tableNumber: v }),
  setNotes:           (v) => set({ notes: v }),

  // Computed
  get subtotal() {
    return get().items.reduce((s, i) => s + i.price * i.quantity, 0);
  },
  get discountAmt() {
    const s = get().subtotal;
    return get().discountType === 'percent' ? s * (get().discount / 100) : get().discount;
  },
  get taxAmt() {
    return (get().subtotal - get().discountAmt) * (get().taxRate / 100);
  },
  get total() {
    return get().subtotal - get().discountAmt + get().taxAmt;
  },
  get change() {
    return Math.max(0, get().amountPaid - get().total);
  },
}));
