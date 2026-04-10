import { useEffect, useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Trash2, Plus, Minus, Printer, CreditCard,
  Banknote, Search, X, ChevronDown, Tag, CheckCircle
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { getProducts, getCategories } from '../services/products';
import { createOrder } from '../services/orders';
import api from '../services/api';
import Receipt from '../components/Receipt';
import { currency } from '../utils/format';

export default function POSPage() {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [activeCat,   setActiveCat]   = useState('all');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [lastOrder,   setLastOrder]   = useState(null);
  const [settings,    setSettings]    = useState({ currency_symbol: 'Rs' });
  const receiptRef = useRef();

  const cart = useCartStore();

  // Load products, categories and settings
  useEffect(() => {
    Promise.all([
      getProducts({ active: 'true' }),
      getCategories(),
      api.get('/settings'),
    ]).then(([pRes, cRes, sRes]) => {
      setProducts(pRes.data);
      setCategories(cRes.data);
      setSettings(sRes.data);
      // Pre-fill tax rate from settings
      if (sRes.data.tax_rate) cart.setTaxRate(Number(sRes.data.tax_rate));
    }).catch(() => {});
  }, []);

  // Barcode/keyboard search focus shortcut (F2)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') document.getElementById('pos-search')?.focus();
      if (e.key === 'Escape') setShowPayment(false);
      if (e.key === 'F9' && cart.items.length > 0) setShowPayment(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.items]);

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'all' || p.categoryId === activeCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    return matchCat && matchSearch;
  });

  // Barcode: if exact match on Enter
  const handleSearchKey = (e) => {
    if (e.key === 'Enter') {
      const match = products.find(p => p.barcode === search || p.name.toLowerCase() === search.toLowerCase());
      if (match) { cart.addItem(match); setSearch(''); }
    }
  };

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  const handleCheckout = async () => {
    if (!cart.items.length) return;
    setLoading(true);
    try {
      const subtotal   = cart.items.reduce((s,i) => s + i.price * i.quantity, 0);
      const discAmt    = cart.discountType === 'percent' ? subtotal * (cart.discount/100) : cart.discount;
      const taxAmt     = (subtotal - discAmt) * (cart.taxRate/100);
      const total      = subtotal - discAmt + taxAmt;

      const order = await createOrder({
        type:            cart.orderType,
        items:           cart.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        discount:        cart.discount,
        discountType:    cart.discountType,
        taxRate:         cart.taxRate,
        paymentMethod:   cart.paymentMethod,
        amountPaid:      cart.paymentMethod === 'cash' ? cart.amountPaid || total : total,
        customerName:    cart.customerName,
        customerPhone:   cart.customerPhone,
        customerAddress: cart.customerAddress,
        tableNumber:     cart.tableNumber,
        notes:           cart.notes,
      });

      setLastOrder(order.data);
      setShowPayment(false);
      cart.clearCart();
      toast.success(`Order ${order.data.orderNumber} completed!`);

      // Auto-print if enabled
      if (settings.print_receipt === 'true') setTimeout(handlePrint, 300);
    } catch {
      /* toast shown by interceptor */
    } finally {
      setLoading(false);
    }
  };

  const sym = settings.currency_symbol || 'Rs';
  const subtotal  = cart.items.reduce((s,i) => s + i.price * i.quantity, 0);
  const discAmt   = cart.discountType === 'percent' ? subtotal * (cart.discount/100) : cart.discount;
  const taxAmt    = (subtotal - discAmt) * (cart.taxRate/100);
  const total     = subtotal - discAmt + taxAmt;
  const change    = Math.max(0, (cart.amountPaid || 0) - total);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Search + categories */}
        <div className="bg-white border-b px-4 py-3 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="pos-search" type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search products or scan barcode… (F2)"
              className="input pl-9 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCat('all')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCat === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >All</button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCat === c.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={activeCat === c.id ? { backgroundColor: c.color } : {}}
              >
                <span>{c.icon}</span>{c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-5xl mb-2">🔍</span>
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => cart.addItem(p)}
                  className="product-card bg-white rounded-xl p-3 text-left border border-gray-200 hover:border-brand-400 hover:shadow-md active:scale-95"
                >
                  <div className="aspect-square rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">{p.category?.icon || '🍕'}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-tight truncate">{p.name}</p>
                  <p className="text-brand-600 font-bold text-sm mt-1">{sym}{p.price.toFixed(2)}</p>
                  <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: p.category?.color || '#ccc' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-80 bg-white border-l flex flex-col flex-shrink-0 shadow-lg">
        {/* Cart header */}
        <div className="px-4 py-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-brand-600" />
              <span className="font-semibold text-gray-900">Order</span>
              <span className="badge bg-brand-100 text-brand-700">{cart.items.length}</span>
            </div>
            {cart.items.length > 0 && (
              <button onClick={() => cart.clearCart()} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 size={13} />Clear
              </button>
            )}
          </div>

          {/* Order type */}
          <div className="flex gap-1">
            {['dine-in','takeaway','delivery'].map(t => (
              <button
                key={t}
                onClick={() => cart.setOrderType(t)}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${cart.orderType === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t === 'dine-in' ? '🍽 Dine In' : t === 'takeaway' ? '📦 Take' : '🛵 Deliver'}
              </button>
            ))}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <ShoppingCart size={40} strokeWidth={1} className="mb-2" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click a product to add it</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.items.map(item => (
                <div key={item.productId} className="flex items-center gap-2 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{sym}{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cart.updateQty(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => cart.updateQty(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-brand-100 hover:bg-brand-200 flex items-center justify-center text-brand-600">
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-gray-900 w-14 text-right">{sym}{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => cart.removeItem(item.productId)} className="text-red-400 hover:text-red-600 ml-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discount + Tax */}
        {cart.items.length > 0 && (
          <div className="border-t px-4 py-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Discount</label>
                <div className="flex">
                  <input type="number" min="0" value={cart.discount}
                    onChange={e => cart.setDiscount(e.target.value)}
                    className="input text-sm rounded-r-none flex-1 py-1.5 px-2" />
                  <select value={cart.discountType} onChange={e => cart.setDiscountType(e.target.value)}
                    className="border border-l-0 border-gray-300 bg-gray-50 text-xs rounded-r-lg px-1 focus:outline-none">
                    <option value="fixed">{sym}</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div className="w-20">
                <label className="text-xs text-gray-500 mb-1 block">Tax %</label>
                <input type="number" min="0" value={cart.taxRate}
                  onChange={e => cart.setTaxRate(e.target.value)}
                  className="input text-sm py-1.5 px-2" />
              </div>
            </div>

            {/* Dine-in: table number */}
            {cart.orderType === 'dine-in' && (
              <input value={cart.tableNumber} onChange={e => cart.setTableNumber(e.target.value)}
                placeholder="Table number" className="input text-sm py-1.5" />
            )}
            {/* Takeaway: just name */}
            {cart.orderType === 'takeaway' && (
              <input value={cart.customerName} onChange={e => cart.setCustomerName(e.target.value)}
                placeholder="Customer name (optional)" className="input text-sm py-1.5" />
            )}
            {/* Delivery: name, phone, address */}
            {cart.orderType === 'delivery' && (
              <div className="space-y-1.5">
                <input value={cart.customerName} onChange={e => cart.setCustomerName(e.target.value)}
                  placeholder="Customer name *" className="input text-sm py-1.5" />
                <input value={cart.customerPhone} onChange={e => cart.setCustomerPhone(e.target.value)}
                  placeholder="Phone number *" className="input text-sm py-1.5" />
                <textarea value={cart.customerAddress} onChange={e => cart.setCustomerAddress(e.target.value)}
                  placeholder="Delivery address *" className="input text-sm py-1.5 resize-none" rows={2} />
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="border-t px-4 py-3 space-y-1.5 bg-gray-50">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>{sym}{subtotal.toFixed(2)}</span>
          </div>
          {discAmt > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span><span>-{sym}{discAmt.toFixed(2)}</span>
            </div>
          )}
          {taxAmt > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax</span><span>{sym}{taxAmt.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t">
            <span>Total</span><span className="text-brand-600">{sym}{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout button */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.items.length === 0}
            className="btn-primary w-full btn-lg text-base"
          >
            <CreditCard size={20} />
            Checkout  (F9)
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Payment</h2>
              <button onClick={() => setShowPayment(false)}><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-4xl font-bold text-brand-600 mt-1">{sym}{total.toFixed(2)}</p>
              </div>

              {/* Payment method */}
              <div>
                <label className="label">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => cart.setPaymentMethod('cash')}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${cart.paymentMethod === 'cash' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Banknote size={24} />
                    <span className="text-sm font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => cart.setPaymentMethod('card')}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${cart.paymentMethod === 'card' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <CreditCard size={24} />
                    <span className="text-sm font-medium">Card</span>
                  </button>
                </div>
              </div>

              {cart.paymentMethod === 'cash' && (
                <>
                  <div>
                    <label className="label">Amount Received</label>
                    <input
                      type="number" min={total} step="0.01"
                      value={cart.amountPaid || ''}
                      onChange={e => cart.setAmountPaid(e.target.value)}
                      placeholder={total.toFixed(2)}
                      className="input text-lg font-bold"
                      autoFocus
                    />
                  </div>
                  {/* Quick cash buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {[500,1000,2000,5000].map(v => (
                      <button key={v} onClick={() => cart.setAmountPaid(v)}
                        className={`py-1.5 text-sm rounded-lg border font-medium transition ${cart.amountPaid === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
                        {sym}{v}
                      </button>
                    ))}
                  </div>
                  {cart.amountPaid > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 flex justify-between font-semibold">
                      <span className="text-green-700">Change</span>
                      <span className="text-green-700">{sym}{change.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              <button onClick={handleCheckout} disabled={loading}
                className="btn-success w-full btn-lg text-base">
                {loading ? <span className="animate-spin">⏳</span> : <CheckCircle size={20} />}
                {loading ? 'Processing…' : 'Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden receipt for printing */}
      <div className="hidden">
        <Receipt ref={receiptRef} order={lastOrder || {}} settings={settings} />
      </div>

      {/* Last order + print button */}
      {lastOrder && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl z-40">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-sm">Order {lastOrder.orderNumber} done</span>
          <button onClick={handlePrint} className="btn btn-sm bg-white text-gray-900 hover:bg-gray-100">
            <Printer size={15} /> Print
          </button>
          <button onClick={() => setLastOrder(null)} className="text-gray-400 hover:text-white"><X size={15} /></button>
        </div>
      )}
    </div>
  );
}
