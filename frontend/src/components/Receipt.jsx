import { forwardRef } from 'react';
import { formatDateTime } from '../utils/format';

const Receipt = forwardRef(({ order, settings = {} }, ref) => {
  const sym = settings.currency_symbol || 'Rs';

  return (
    <div id="receipt" ref={ref} className="font-mono text-xs text-black w-72 p-4 bg-white">
      {/* Header */}
      <div className="text-center mb-3">
        <p className="font-bold text-base">{settings.shop_name || 'First Italian Pizza'}</p>
        {settings.shop_address && <p>{settings.shop_address}</p>}
        {settings.shop_phone   && <p>Tel: {settings.shop_phone}</p>}
        <p className="mt-1">{'─'.repeat(36)}</p>
      </div>

      {/* Order info */}
      <div className="mb-2 space-y-0.5">
        <div className="flex justify-between">
          <span>Order#:</span><span>{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span><span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span><span className="capitalize">{order.type}</span>
        </div>
        {order.tableNumber && (
          <div className="flex justify-between">
            <span>Table:</span><span>{order.tableNumber}</span>
          </div>
        )}
        {order.customerName && (
          <div className="flex justify-between">
            <span>Customer:</span><span>{order.customerName}</span>
          </div>
        )}
        {order.customerPhone && (
          <div className="flex justify-between">
            <span>Phone:</span><span>{order.customerPhone}</span>
          </div>
        )}
        {order.customerAddress && (
          <div>
            <span>Address:</span>
            <p className="pl-2">{order.customerAddress}</p>
          </div>
        )}
        {order.user?.name && (
          <div className="flex justify-between">
            <span>Cashier:</span><span>{order.user.name}</span>
          </div>
        )}
      </div>

      <p>{'─'.repeat(36)}</p>

      {/* Items */}
      <div className="my-2 space-y-1">
        <div className="flex justify-between font-bold">
          <span>Item</span><span>Total</span>
        </div>
        {order.items?.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between">
              <span className="truncate flex-1 mr-2">{item.name}</span>
              <span>{sym}{(item.subtotal).toFixed(2)}</span>
            </div>
            <div className="text-gray-500 pl-2">
              {item.quantity} x {sym}{item.price.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <p>{'─'.repeat(36)}</p>

      {/* Totals */}
      <div className="my-2 space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal:</span><span>{sym}{order.subtotal?.toFixed(2)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span><span>-{sym}{order.discount?.toFixed(2)}</span>
          </div>
        )}
        {order.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax ({order.taxRate}%):</span><span>{sym}{order.tax?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL:</span><span>{sym}{order.total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid ({order.paymentMethod}):</span><span>{sym}{order.amountPaid?.toFixed(2)}</span>
        </div>
        {order.change > 0 && (
          <div className="flex justify-between">
            <span>Change:</span><span>{sym}{order.change?.toFixed(2)}</span>
          </div>
        )}
      </div>

      <p>{'─'.repeat(36)}</p>

      {/* Footer */}
      <div className="text-center mt-2 space-y-1">
        <p>{settings.receipt_footer || 'Thank you for your order!'}</p>
        <p className="text-gray-400">Powered by First Italian Pizza POS</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
