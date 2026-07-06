import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Check, LogOut, RefreshCw } from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleOrderStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    const { error } = await supabase
      .from('orders')
      .update({ order_status: nextStatus })
      .eq('id', id);

    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, order_status: nextStatus } : o));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Panel */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard Antrean</h1>
            <p className="text-xs text-gray-400">Update status pesanan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchOrders} className="p-2 bg-gray-50 border rounded-xl text-gray-600 hover:bg-gray-100">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="p-2 bg-red-50 border border-red-100 rounded-xl text-red-500 hover:bg-red-100 flex items-center gap-2 text-sm font-semibold">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b">
                  <th className="p-4">Jam Pesan</th>
                  <th className="p-4">Nama Pembeli</th>
                  <th className="p-4">Pesanan</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Total Harga</th>
                  <th className="p-4">Metode Bayar</th>
                  <th className="p-4 text-center">Aksi (Selesai)</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className={`hover:bg-gray-50/80 transition ${order.order_status === 'completed' ? 'bg-green-50/30' : ''}`}>
                    <td className="p-4 font-medium text-gray-400">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4 font-bold text-gray-800">{order.buyer_name}</td>
                    <td className="p-4 font-semibold">{order.menu_name}</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold">Lvl {order.spiciness_level}</span></td>
                    <td className="p-4 font-bold text-fuchsia-600">Rp {order.total_price.toLocaleString()}</td>
                    <td className="p-4"><span className="text-xs uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-semibold">{order.payment_method}</span></td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleOrderStatus(order.id, order.order_status)}
                        className={`p-2 rounded-xl transition ${
                          order.order_status === 'completed' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 hover:bg-green-100 text-gray-400 hover:text-green-600'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center p-8 text-gray-400 text-sm">Tidak ada pesanan masuk saat ini.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}