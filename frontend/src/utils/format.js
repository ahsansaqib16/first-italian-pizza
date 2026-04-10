// Currency formatting
export const currency = (amount, symbol = 'Rs') =>
  `${symbol}${Number(amount || 0).toFixed(2)}`;

// Date formatting
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// Status badge colors
export const statusColor = (status) => {
  const map = {
    pending:    'bg-yellow-100 text-yellow-800',
    preparing:  'bg-blue-100 text-blue-800',
    ready:      'bg-green-100 text-green-800',
    completed:  'bg-gray-100 text-gray-700',
    cancelled:  'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export const paymentMethodLabel = (method) => {
  const map = { cash: 'Cash', card: 'Card' };
  return map[method] || method;
};

export const orderTypeLabel = (type) => {
  const map = { 'dine-in': 'Dine In', takeaway: 'Takeaway', delivery: 'Delivery' };
  return map[type] || type;
};
