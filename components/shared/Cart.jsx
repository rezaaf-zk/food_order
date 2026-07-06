import React, { useContext } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { CartContext } from '../../context/CartContext';

export default function Cart({ onCheckout }) {
  const { cart, removeFromCart, updateCartItemQuantity, getTotalPrice } =
    useContext(CartContext);

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white rounded-t-2xl shadow-2xl overflow-hidden">
      <div className="p-4 max-h-96 overflow-y-auto">
        <h3 className="font-bold text-lg text-gray-800 mb-3">Keranjang ({cart.length})</h3>

        <div className="space-y-3">
          {cart.map((item) => (
            <div key={`${item.id}-${item.level}`} className="bg-gray-50 rounded-lg p-3 flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.name}</p>
                {item.level && <p className="text-xs text-gray-500">Level {item.level}</p>}
                <p className="text-sm text-fuchsia-600 font-bold">
                  Rp {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateCartItemQuantity(item.id, item.level, item.quantity - 1)
                  }
                  className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateCartItemQuantity(item.id, item.level, item.quantity + 1)
                  }
                  className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white p-1 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.id, item.level)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-gray-700">Total:</span>
          <span className="font-bold text-lg text-fuchsia-600">
            Rp {getTotalPrice().toLocaleString()}
          </span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-full transition"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
