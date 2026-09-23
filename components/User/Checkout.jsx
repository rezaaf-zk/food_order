import React, { useState, useContext } from 'react';
import { ArrowLeft, Trash2, Minus, Plus, Store, User, FileText, Phone, Edit3 } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';

export default function Checkout({ onBack, onProceedToPayment }) {
  const { cart, removeFromCart, updateCartItemQuantity, getTotalPrice } = useContext(CartContext);
  const { selectedBranch } = useBranch();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleProceed = () => {
    if (!customerName.trim()) {
      alert('Silakan masukkan nama pemesan!');
      return;
    }

    const orderData = {
      branchId: selectedBranch?.id || 'a0000000-0000-0000-0000-000000000001',
      branchName: selectedBranch?.name || 'Cabang Tunjungan',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || null,
      notes: notes.trim() || null,
      items: cart.map((i) => ({
        ...i,
        notes: i.note || i.notes || null
      })),
      totalPrice: getTotalPrice(),
      orderTime: new Date().toISOString()
    };

    onProceedToPayment(orderData);
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center space-y-3">
          <p className="text-gray-600 text-base font-semibold">Keranjang Anda masih kosong</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-bold hover:bg-fuchsia-700 transition text-xs"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-700 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-extrabold text-gray-900">Konfirmasi Pesanan</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected Branch Badge */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Outlet Pengambilan
            </p>
            <p className="text-xs font-extrabold text-gray-900 truncate">
              {selectedBranch?.name || 'Cabang Tunjungan'}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{selectedBranch?.address}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="font-extrabold text-xs text-gray-900 mb-3 flex items-center justify-between">
            <span>Daftar Menu yang Dipesan</span>
            <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)} Porsi
            </span>
          </h2>

          <div className="space-y-3 divide-y divide-gray-50">
            {cart.map((item) => (
              <div
                key={item.cartItemId || `${item.id}-${item.level}-${item.note}`}
                className="pt-3 first:pt-0 flex justify-between items-start"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-baseline gap-2">
                    <p className="font-bold text-xs text-gray-900">{item.name}</p>
                    {item.level && (
                      <span className="inline-block px-1.5 py-0.2 bg-red-50 text-red-600 rounded text-[10px] font-extrabold">
                        Level {item.level}
                      </span>
                    )}
                  </div>

                  {item.note && (
                    <p className="text-[10px] text-amber-900 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60 mt-1 italic line-clamp-2">
                      Catatan: "{item.note}"
                    </p>
                  )}

                  <p className="text-xs font-black text-fuchsia-700 mt-1">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-center">
                  <button
                    onClick={() =>
                      updateCartItemQuantity(
                        item.cartItemId || item.id,
                        item.quantity - 1
                      )
                    }
                    className="bg-gray-100 hover:bg-gray-200 p-1 rounded-md transition active:scale-95 text-gray-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-extrabold text-xs text-gray-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateCartItemQuantity(
                        item.cartItemId || item.id,
                        item.quantity + 1
                      )
                    }
                    className="bg-fuchsia-600 text-white p-1 rounded-md transition active:scale-95 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() =>
                      removeFromCart(
                        item.cartItemId || item.id,
                        item.level,
                        item.note
                      )
                    }
                    className="p-1 text-gray-400 hover:text-red-600 transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h2 className="font-extrabold text-xs text-gray-900 mb-2">Informasi Pemesan</h2>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Nama Pemesan *
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama Anda"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Nomor HP (Opsional)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Catatan Keseluruhan Pesanan (Opsional)
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan"
                rows={2}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
              />
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-10 shadow-lg">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Pembayaran:
          </span>
          <span className="font-black text-base text-fuchsia-700">
            Rp {getTotalPrice().toLocaleString('id-ID')}
          </span>
        </div>
        <button
          onClick={handleProceed}
          disabled={!customerName.trim()}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-full shadow-lg shadow-fuchsia-200 transition transform active:scale-[0.98] text-xs"
        >
          Lanjut ke Pembayaran
        </button>
      </div>
    </div>
  );
}
