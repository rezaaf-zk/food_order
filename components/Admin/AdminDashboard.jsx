import React, { useMemo, useEffect } from 'react';
import { LogOut, Trash2, DollarSign, ShoppingCart, Clock, Utensils, CheckCircle } from 'lucide-react';

// Konfigurasi untuk setiap status pesanan
const statusConfig = {
  waiting: { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', next: 'processing' },
  processing: { text: 'Diproses', color: 'bg-blue-100 text-blue-800', next: 'ready' },
  ready: { text: 'Siap Diambil', color: 'bg-green-100 text-green-800', next: 'completed' },
  completed: { text: 'Selesai', color: 'bg-gray-200 text-gray-600', next: null },
};

// Teks untuk tombol aksi berikutnya
const getNextStatusText = (status) => {
  if (status === 'waiting') return 'Proses Pesanan';
  if (status === 'processing') return 'Siap Diambil';
  if (status === 'ready') return 'Selesaikan';
  return null;
};

export default function AdminDashboard({ user, onLogout, orders, onUpdateOrders }) {

  // Efek untuk mendengarkan pesanan baru secara live dari tab lain
  useEffect(() => {
    const channel = new BroadcastChannel('order_updates');
    
    const handleNewOrder = (event) => {
      if (event.data && event.data.type === 'NEW_ORDER') {
        // Tambahkan pesanan baru ke daftar yang ada tanpa perlu refresh
        onUpdateOrders([event.data.payload, ...orders]);
      }
    };

    channel.addEventListener('message', handleNewOrder);

    // Membersihkan listener saat komponen tidak lagi digunakan
    return () => {
      channel.removeEventListener('message', handleNewOrder);
      channel.close();
    };
  }, [orders, onUpdateOrders]); // Dependensi agar fungsi selalu mendapat data `orders` terbaru
  
  // Menghitung statistik dasbor, akan dihitung ulang hanya jika 'orders' berubah
  const dashboardStats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'completed')
      .reduce((sum, o) => sum + o.totalPrice, 0);
    
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRevenue,
      totalOrders: orders.length,
      waiting: statusCounts.waiting || 0,
      processing: statusCounts.processing || 0,
      ready: statusCounts.ready || 0,
    };
  }, [orders]);

  // Mengurutkan pesanan, akan dihitung ulang hanya jika 'orders' berubah
  const sortedOrders = useMemo(() => {
    const activeOrders = orders
      .filter(o => o.status !== 'completed')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); // Terbaru di atas
      
    const completedOrders = orders
      .filter(o => o.status === 'completed')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return [...activeOrders, ...completedOrders]; // Gabungkan: aktif dulu, baru selesai
  }, [orders]);

  // Fungsi untuk mengubah status dan memanggil update ke parent
  const handleStatusChange = (orderId) => {
    const updatedOrders = orders.map(order => {
      if (order.orderId === orderId) {
        const currentStatus = order.status;
        const nextStatus = statusConfig[currentStatus]?.next;
        if (nextStatus) {
          return { ...order, status: nextStatus };
        }
      }
      return order;
    });
    onUpdateOrders(updatedOrders); // Kirim data baru ke App.jsx
  };

  // Fungsi untuk konfirmasi pembayaran manual (cash/qris)
  const handlePaymentConfirm = (orderIdToConfirm) => {
    const updatedOrders = orders.map(order => {
      if (order.orderId === orderIdToConfirm) {
        // Otomatis majukan status pesanan ke 'processing' jika sebelumnya 'waiting'
        const newStatus = order.status === 'waiting' ? 'processing' : order.status;
        return { ...order, paymentStatus: 'completed', status: newStatus };
      }
      return order;
    });
    onUpdateOrders(updatedOrders);
  };

  // Fungsi untuk menghapus pesanan
  const handleDeleteOrder = (orderIdToDelete) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pesanan ini? Aksi ini tidak dapat dibatalkan.')) {
      const updatedOrders = orders.filter(order => order.orderId !== orderIdToDelete);
      onUpdateOrders(updatedOrders);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-gray-800">{user.username}</h1>
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={<DollarSign />} title="Total Pendapatan" value={`Rp ${dashboardStats.totalRevenue.toLocaleString()}`} color="text-green-500" />
          <StatCard icon={<ShoppingCart />} title="Total Pesanan" value={dashboardStats.totalOrders} color="text-blue-500" />
          <StatCard icon={<Clock />} title="Menunggu" value={dashboardStats.waiting} color="text-yellow-500" />
          <StatCard icon={<Utensils />} title="Diproses" value={dashboardStats.processing} color="text-indigo-500" />
          <StatCard icon={<CheckCircle />} title="Siap Diambil" value={dashboardStats.ready} color="text-teal-500" />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-bold text-gray-700 p-4 border-b">Daftar Pesanan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">ID Pesanan</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(order => (
                  <tr key={order.orderId} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.orderId.split('-')[1]}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">Rp {order.totalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[order.status]?.color || ''}`}>
                        {statusConfig[order.status]?.text || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                      {order.paymentStatus === 'pending' && ['cash', 'qris'].includes(order.paymentMethod) && (
                        <button
                          onClick={() => handlePaymentConfirm(order.orderId)}
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md text-xs transition whitespace-nowrap"
                        >
                          Konfirmasi Bayar
                        </button>
                      )}
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(order.orderId)}
                          className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold py-1 px-3 rounded-md text-xs transition whitespace-nowrap"
                        >
                          {getNextStatusText(order.status)}
                        </button>
                      )}
                        <button onClick={() => handleDeleteOrder(order.orderId)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <p className="text-center text-gray-500 py-8">Belum ada pesanan.</p>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
    <div className={`p-3 rounded-full bg-gray-100 ${color}`}>
      {React.cloneElement(icon, { className: 'w-6 h-6' })}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);
