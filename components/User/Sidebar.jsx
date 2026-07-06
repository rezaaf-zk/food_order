import React from 'react';
import { Home, LogIn, LogOut, Receipt, X } from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  onViewChange,
  user,
  onLoginClick,
  onLogout,
  currentOrder
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-40 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-bold text-lg text-fuchsia-600">Menu</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => onViewChange('menu')}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold text-gray-700 hover:bg-gray-100"
          >
            <Home className="w-5 h-5" />
            Menu Utama
          </button>

          {/* === MENU STATUS PESANAN BARU === */}
          {/* Muncul hanya jika ada pesanan yang sedang berjalan */}
          {currentOrder && currentOrder.status !== 'completed' && (
            <button
              onClick={() => onViewChange('orderStatus')}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200 hover:bg-fuchsia-100"
            >
              <Receipt className="w-5 h-5" />
              Status Pesanan Anda
            </button>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          {user ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Masuk sebagai:</p>
              <p className="font-bold">{user.username}</p>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-white bg-fuchsia-600 hover:bg-fuchsia-700"
            >
              <LogIn className="w-5 h-5" />
              Login Admin
            </button>
          )}
        </div>
      </aside>
    </>
  );
}