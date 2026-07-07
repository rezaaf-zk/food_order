import React from 'react';
import { Home, LogIn, LogOut, Receipt, X, User } from 'lucide-react';

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
      {/* Overlay dengan Efek Glassmorphism Modern */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Section */}
        <div className="p-5 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="font-extrabold text-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              HoliFood
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 active:scale-95 rounded-xl transition text-gray-500 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-2.5 overflow-y-auto">
          {/* Menu Utama Button */}
          <button
            onClick={() => {
              onViewChange('menu');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left font-medium text-gray-600 hover:text-fuchsia-600 hover:bg-fuchsia-50/60 transition-all duration-200 group active:scale-[0.98]"
          >
            <Home className="w-5 h-5 text-gray-400 group-hover:text-fuchsia-500 transition-colors" />
            <span className="text-sm font-semibold">Menu Utama</span>
          </button>

          {/* === MENU STATUS PESANAN BARU (Floating Premium Card) === */}
          {currentOrder && currentOrder.status !== 'completed' && (
            <button
              onClick={() => {
                onViewChange('orderStatus');
                onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left font-medium text-fuchsia-700 bg-gradient-to-r from-fuchsia-50 to-pink-50/50 border border-fuchsia-100 hover:border-fuchsia-200 shadow-sm transition-all duration-200 relative overflow-hidden group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3.5 z-10">
                <div className="p-1.5 bg-white rounded-lg shadow-sm text-fuchsia-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold tracking-wide">Status Pesanan</span>
              </div>
              
              {/* Indikator Pulse Animasi Live Order */}
              <span className="flex h-2.5 w-2.5 relative z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
              </span>
            </button>
          )}
        </nav>

        {/* Footer Section (User Authentication Area) */}
        <div className="p-5 border-t border-gray-100 bg-slate-50/50">
          {user ? (
            <div className="space-y-4">
              {/* Modern User Profile Card */}
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {user.username ? user.username.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium truncate">Masuk sebagai</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{user.username}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 shadow-sm active:scale-[0.98] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Keluar Akun
              </button>
            </div>
          ) : (
            /* Premium Gradient Login Button */
            <button
              onClick={onLoginClick}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 shadow-md shadow-fuchsia-200 active:scale-[0.98] transition-all"
            >
              <LogIn className="w-4 h-4" />
              Masuk / Login
            </button>
          )}
        </div>
      </aside>
    </>
  );
}