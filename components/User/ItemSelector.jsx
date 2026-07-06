import React, { useState, useContext, useEffect } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { spiceLevels } from '../../data/menuData';

export default function ItemSelector({ item, category, onBack }) {
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [selectedLevels, setSelectedLevels] = useState(Array(1).fill(null));

  // Efek untuk menyinkronkan jumlah pilihan level dengan kuantitas
  useEffect(() => {
    setSelectedLevels(currentLevels => {
      const newLevels = Array(quantity).fill(null);
      // Pertahankan level yang sudah dipilih jika memungkinkan
      for (let i = 0; i < Math.min(currentLevels.length, quantity); i++) {
        newLevels[i] = currentLevels[i];
      }
      return newLevels;
    });
  }, [quantity]);

  const handleSelectLevel = (index, level) => {
    // Buat salinan array untuk diubah
    const newLevels = [...selectedLevels];
    newLevels[index] = level;
    setSelectedLevels(newLevels);
  };

  const handleAddToCart = () => {
    const allLevelsSelected = item.hasLevel
      ? selectedLevels.every((level) => level !== null) // Cek semua level yang sesuai kuantitas
      : true;

    if (!allLevelsSelected) {
      alert('Silakan pilih level terlebih dahulu!');
      return;
    }

    if (item.hasLevel) {
      selectedLevels.forEach((level) => { // Tambahkan setiap pesanan dengan levelnya
        addToCart(item, 1, level, category);
      });
    } else {
      addToCart(item, quantity, null, category);
    }

    onBack();
  };

  return (
    // Container diatur oleh App.jsx. Komponen ini mengisi ruang yang diberikan.
    <div className="flex flex-col flex-1 bg-gray-50">
      {/* Header */}
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-64 bg-gray-100">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button
            onClick={onBack}
            className="absolute top-4 left-4 bg-white/80 p-2 rounded-full shadow backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
        </div>

        {/* Item Info */}
        <div className="p-4 bg-white shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">{item.name}</h2>
          <p className="text-fuchsia-600 font-bold mt-1">Rp {item.price.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-2">{item.description}</p>
        </div>

        {/* Quantity Selection (untuk non-level items atau basis) */}
        {!item.hasLevel ? (
          <div className="p-4 bg-white mt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Jumlah
            </label>
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white p-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Level Selection untuk makanan */
          <div className="p-4 flex-1">
            <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Jumlah Pesanan
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-200 hover:bg-gray-300 p-1 rounded transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white p-1 rounded transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: quantity }).map((_, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Pesanan {idx + 1}: Pilih Level Pedas
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {spiceLevels.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => handleSelectLevel(idx, lvl)}
                        className={`py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 transform active:scale-95 ${
                          selectedLevels[idx] === lvl
                            ? 'bg-fuchsia-600 text-white shadow-lg'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <button
          onClick={handleAddToCart}
          className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3.5 rounded-full shadow-lg transition transform active:scale-95"
        >
          Tambah ke Keranjang
        </button>
      </div>
    </div>
  );
}
