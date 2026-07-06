// Utility functions for FoodOrder app

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount);
};

export const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateOrderId = () => {
  return `ORD-${Date.now()}`;
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Menunggu',
    preparing: 'Sedang Diproses',
    ready: 'Siap Diambil',
    completed: 'Selesai',
  };
  return labels[status] || status;
};

export const getPaymentStatusLabel = (status) => {
  return status === 'completed' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran';
};

export const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: 'Bayar di Kasir',
    transfer: 'Transfer Bank',
    qris: 'QRIS / E-Wallet',
  };
  return labels[method] || method;
};

export const calculateTotalItems = (items) => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};
