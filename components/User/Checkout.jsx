import React, { useState, useContext } from 'react';
import { ArrowLeft, Trash2, Minus } from 'lucide-react';
import { CartContext } from '../../context/CartContext';

export default function Checkout({ onBack, onProceedToPayment }) {
  const { cart, removeFromCart, updateCartItemQuantity, getTotalPrice } =
    useContext(CartContext);

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  const handleProceed = () => {
    if (!customerName.trim()) {
      alert('Silakan masukkan nama terlebih dahulu!');
      return;
    }

    const orderData = {
      customerName,
      notes,
      items: cart,
      totalPrice: getTotalPrice(),
      orderTime: new Date().toISOString(),
    };

    onProceedToPayment(orderData);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center pb-6">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Keranjang Anda kosong</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Checkout</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Order Items */}
        <div className="bg-white p-4 border-b">
          <h2 className="font-bold text-gray-800 mb-3">Pesanan ({cart.length})</h2>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={`${item.id}-${item.level}`} className="flex justify-between items-start bg-gray-50 p-2 rounded">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                  {item.level && <p className="text-xs text-gray-500">Level {item.level}</p>}
                  <p className="text-xs text-fuchsia-600 font-semibold">x{item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-fuchsia-600">
                    Rp {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <button
                      onClick={() =>
                        updateCartItemQuantity(item.id, item.level, item.quantity - 1)
                      }
                      className="bg-gray-200 hover:bg-gray-300 p-0.5 rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id, item.level)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white p-4 border-b">
          <h2 className="font-bold text-gray-800 mb-3">Informasi Pelanggan</h2>

          <div className="mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
              Nama Penerima
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama Anda..."
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk pesanan..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-4 sticky bottom-0">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-gray-700">Total Bayar:</span>
          <span className="font-bold text-xl text-fuchsia-600">
            Rp {getTotalPrice().toLocaleString()}
          </span>
        </div>
        <button
          onClick={handleProceed}
          disabled={!customerName.trim()}
          className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-full transition"
        >
          Lanjut ke Pembayaran
        </button>
      </div>
    </div>
  );
}
