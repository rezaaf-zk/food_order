import React, { useState, useEffect } from 'react';
import { User, ClipboardList, ShoppingCart, X, LogOut, LogIn } from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onViewChange, user, onLoginClick, onLogout, allOrders }) {
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    if (user && user.userId) {
      const filtered = allOrders.filter(order => order.userId === user.userId);
      setUserOrders(filtered);
    }
  }, [user, allOrders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose}></div>
      
      {/* Drawer Content */}
      <div className="relative w-72 max-w-sm bg-gray-50 h-full p-5 shadow-xl flex flex-col z-10 overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500">
          <X className="w-5 h-5" />
        </button>

        {/* User Profile Header */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 mt-4">
          <div className="bg-gray-200 p-2 rounded-full">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <span className="font-bold text-gray-800 block text-sm">
              {user ? user.username.toUpperCase() : 'GUEST'}
            </span>
            {user?.phone && <span className="text-xs text-gray-500">{user.phone}</span>}
          </div>
        </div>

        {/* Authentication Section */}
        {!user ? (
          <div className="mb-4 space-y-2">
            <button 
              onClick={() => { onLoginClick(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white p-2.5 rounded-xl font-semibold text-sm transition"
            >
              <LogIn className="w-4 h-4" /> Login / Daftar
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <button 
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl font-semibold text-sm transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="space-y-3 mb-4">
          <button 
            onClick={() => { onViewChange('menu'); onClose(); }}
            className="w-full flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 hover:bg-fuchsia-50 transition font-medium text-sm text-gray-700"
          >
            <ShoppingCart className="w-4 h-4 text-fuchsia-500" />
            Menu Utama
          </button>
        </div>

        {/* Order History Section */}
        {user && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-fuchsia-500" />
              <h3 className="font-semibold text-gray-800 text-sm">Riwayat Pesanan ({userOrders.length})</h3>
            </div>
            
            {userOrders.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                <p>Belum ada pesanan</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userOrders.map((order, idx) => (
                  <div key={order.orderId} className="bg-white p-3 rounded-lg border border-gray-200 text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-700">#Pesanan {idx + 1}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'processing' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'completed' ? 'Selesai' :
                         order.status === 'ready' ? 'Siap Ambil' :
                         order.status === 'processing' ? 'Diproses' :
                         'Menunggu'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-1">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">
                        {new Date(order.orderTime).toLocaleDateString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="font-bold text-fuchsia-600">
                        Rp {order.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className={`text-xs font-semibold ${
                        order.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {order.paymentStatus === 'completed' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}