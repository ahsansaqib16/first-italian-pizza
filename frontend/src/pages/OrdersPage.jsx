import { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import { Search, Eye, XCircle, Printer, Filter } from 'lucide-react';
import { getOrders, cancelOrder } from '../services/orders';
import api from '../services/api';
import Modal from '../components/Modal';
import Receipt from '../components/Receipt';
import { formatDateTime, statusColor, orderTypeLabel, paymentMethodLabel } from '../utils/format';

const STATUS_OPTIONS = ['', 'pending', 'preparing', 'ready', 'completed', 'cancelled'];

export default function OrdersPage() {
  const [orders,   setOrders]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [type,     setType]     = useState('');
  const [date,     setDate]     = useState('');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [settings, setSettings] = useState({});
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  const load = (p = page) => {
    setLoading(true);
    getOrders({ status, type, date, page: p, limit: 20 })
      .then(r => { setOrders(r.data.orders); setTotal(r.data.total); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(1); }, [status, type, date]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    try { await cancelOrder(id); toast.success('Order cancelled'); load(); } catch {}
  };

  const pages = Math.ceil(total / 20);
  const sym   = settings.currency_symbol || 'Rs';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={e => setStatus(e.target.value)} className="input w-36 text-sm">
            <option value="">All Status</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="input w-36 text-sm">
            <option value="">All Types</option>
            <option value="dine-in">Dine In</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-44 text-sm" />
          {(status || type || date) && (
            <button onClick={() => { setStatus(''); setType(''); setDate(''); }} className="btn btn-sm btn-secondary">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Order #</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Items</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Payment</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-gray-100 text-gray-600">{orderTypeLabel(o.type)}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{o.items?.length || 0} items</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{sym}{o.total.toFixed(2)}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{paymentMethodLabel(o.paymentMethod)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge ${statusColor(o.status)}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setSelected(o)} className="btn btn-sm btn-ghost"><Eye size={14} /></button>
                    {o.status !== 'cancelled' && o.status !== 'completed' && (
                      <button onClick={() => handleCancel(o.id)} className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50">
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => load(page - 1)} className="btn btn-sm btn-secondary">Prev</button>
              <button disabled={page >= pages} onClick={() => load(page + 1)} className="btn btn-sm btn-secondary">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.orderNumber}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Date:</span> <strong>{formatDateTime(selected.createdAt)}</strong></div>
              <div><span className="text-gray-500">Type:</span> <strong>{orderTypeLabel(selected.type)}</strong></div>
              <div><span className="text-gray-500">Status:</span> <span className={`badge ${statusColor(selected.status)}`}>{selected.status}</span></div>
              <div><span className="text-gray-500">Payment:</span> <strong>{paymentMethodLabel(selected.paymentMethod)}</strong></div>
              {selected.tableNumber && <div><span className="text-gray-500">Table:</span> <strong>{selected.tableNumber}</strong></div>}
              {selected.customerName && <div><span className="text-gray-500">Customer:</span> <strong>{selected.customerName}</strong></div>}
              {selected.user?.name && <div><span className="text-gray-500">Cashier:</span> <strong>{selected.user.name}</strong></div>}
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Item</th>
                    <th className="text-center px-4 py-2 font-semibold">Qty</th>
                    <th className="text-right px-4 py-2 font-semibold">Price</th>
                    <th className="text-right px-4 py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selected.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{sym}{item.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{sym}{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{sym}{selected.subtotal.toFixed(2)}</span></div>
              {selected.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{sym}{selected.discount.toFixed(2)}</span></div>}
              {selected.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{sym}{selected.tax.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{sym}{selected.total.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Paid</span><span>{sym}{selected.amountPaid.toFixed(2)}</span></div>
              {selected.change > 0 && <div className="flex justify-between"><span>Change</span><span>{sym}{selected.change.toFixed(2)}</span></div>}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setSelected(null); }} className="btn-secondary">Close</button>
              <button onClick={handlePrint} className="btn-primary"><Printer size={15} />Print Receipt</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden receipt */}
      <div className="hidden">
        <Receipt ref={receiptRef} order={selected || {}} settings={settings} />
      </div>
    </div>
  );
}
