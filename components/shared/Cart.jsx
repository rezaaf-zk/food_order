import React, { useContext, useState } from 'react';
import { Trash2, Minus, Plus, ShoppingBag, Edit3, X, Check, FileText } from 'lucide-react';
import { CartContext } from '../../context/CartContext';

export default function Cart({ onCheckout }) {
  const {
    cart,
    removeFromCart,
    updateCartItemQuantity,
    updateCartItemNote,
    getTotalPrice
  } = useContext(CartContext);

  const [editingItem, setEditingItem] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  if (cart.length === 0) {
    return null;
  }

  const handleOpenEditNote = (item) => {
    setEditingItem(item);
    setEditingNoteText(item.note || '');
  };

  const handleSaveNote = () => {
    if (editingItem) {
      updateCartItemNote(editingItem.cartItemId, editingNoteText);
      setEditingItem(null);
      setEditingNoteText('');
    }
  };

  return (
    <>
      {/* Floating Bottom Cart Sheet with Fixed Header, Scrollable List, Fixed Footer */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md md:max-w-lg bg-white rounded-t-3xl shadow-2xl z-20 border-t border-slate-200/80 flex flex-col max-h-[42vh] md:max-h-[45vh] animate-in slide-in-from-bottom duration-200">
        {/* 1. FIXED HEADER */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-fuchsia-100 text-fuchsia-700 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">
              Keranjang Pesanan
            </h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-fuchsia-600 text-white">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Porsi
          </span>
        </div>

        {/* 2. SCROLLABLE ITEM LIST */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-1.5 space-y-0 divide-y divide-gray-100">
          {cart.map((item) => (
            <div
              key={item.cartItemId || `${item.id}-${item.level}-${item.note}`}
              className="py-1.5 first:pt-0.5"
            >
              {/* Row 1: Name + Price + Controls */}
              <div className="flex items-center gap-2">
                {/* Left: name + price */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1.5">
                    <h4 className="font-semibold text-[12.5px] leading-tight text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <span className="font-bold text-[12px] text-fuchsia-700 whitespace-nowrap flex-shrink-0">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Right: Qty controls + Delete — always on same row */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() =>
                      updateCartItemQuantity(item.cartItemId || item.id, item.quantity - 1)
                    }
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-1 rounded-md transition active:scale-90"
                    title="Kurangi"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-4 text-center font-extrabold text-[11px] text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateCartItemQuantity(item.cartItemId || item.id, item.quantity + 1)
                    }
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white p-1 rounded-md transition active:scale-90"
                    title="Tambah"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.cartItemId || item.id, item.level, item.note)}
                    className="p-1 text-gray-300 hover:text-red-500 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 2: Level badge + Note (combined, compact) */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.level && (
                  <span className="font-bold text-red-600 bg-red-50 px-1 py-px rounded text-[10px] leading-none flex-shrink-0">
                    Lv.{item.level}
                  </span>
                )}
                {item.note ? (
                  <button
                    onClick={() => handleOpenEditNote(item)}
                    className="flex-1 text-left text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200/50 rounded px-1.5 py-px italic truncate hover:bg-amber-100 transition"
                    title="Klik untuk ubah catatan"
                  >
                    "{item.note}"
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenEditNote(item)}
                    className="text-[10px] text-gray-400 hover:text-fuchsia-600 flex items-center gap-0.5 transition"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Tambah catatan</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 3. FIXED FOOTER */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex-shrink-0 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Pembayaran:
            </span>
            <span className="font-black text-base text-fuchsia-700">
              Rp {getTotalPrice().toLocaleString('id-ID')}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-extrabold py-2.5 rounded-full shadow-md shadow-fuchsia-200 transition transform active:scale-[0.98] text-xs"
          >
            Lanjut Checkout ({cart.reduce((s, i) => s + i.quantity, 0)} Item)
          </button>
        </div>
      </div>

      {/* Edit Note Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-fuchsia-600" />
                <h4 className="font-extrabold text-xs text-gray-900">
                  Ubah Catatan Menu
                </h4>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-gray-800">
              {editingItem.name}{' '}
              {editingItem.level && (
                <span className="text-[10px] text-red-600">
                  (Level {editingItem.level})
                </span>
              )}
            </p>

            <div>
              <textarea
                value={editingNoteText}
                onChange={(e) => setEditingNoteText(e.target.value.slice(0, 250))}
                placeholder="Contoh: jangan pakai sambal, kuah dipisah..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                autoFocus
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Maksimal 250 karakter</span>
                <span>{editingNoteText.length}/250</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
