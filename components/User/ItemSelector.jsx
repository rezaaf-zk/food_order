import React, { useState, useContext, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, FileEdit } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';
import { spiceLevels } from '../../data/menuData';

export default function ItemSelector({ item, category, onBack }) {
  const { addToCart } = useContext(CartContext);
  const { selectedBranch } = useBranch();

  const [quantity, setQuantity] = useState(1);
  const [selectedLevels, setSelectedLevels] = useState(Array(1).fill(1)); // default level 1
  const [itemNote, setItemNote] = useState('');

  // Sinkronkan jumlah pilihan level dengan kuantitas
  useEffect(() => {
    setSelectedLevels((currentLevels) => {
      const newLevels = Array(quantity).fill(1);
      for (let i = 0; i < Math.min(currentLevels.length, quantity); i++) {
        newLevels[i] = currentLevels[i];
      }
      return newLevels;
    });
  }, [quantity]);

  const handleSelectLevel = (index, level) => {
    const newLevels = [...selectedLevels];
    newLevels[index] = level;
    setSelectedLevels(newLevels);
  };

  const handleAddToCart = () => {
    const hasSpiciness = item.hasLevel || item.has_spiciness_level;
    const cleanNote = itemNote.trim();

    if (hasSpiciness) {
      selectedLevels.forEach((level) => {
        addToCart(item, 1, level, category, selectedBranch?.id, cleanNote);
      });
    } else {
      addToCart(item, quantity, null, category, selectedBranch?.id, cleanNote);
    }

    onBack();
  };

  const hasSpiciness = item.hasLevel || item.has_spiciness_level;
  const availableLevels = spiceLevels || [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="flex flex-col flex-1 bg-gray-50 font-sans">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Product Hero Image */}
        <div className="relative h-60 md:h-64 bg-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onBack}
            className="absolute top-4 left-4 bg-white/90 p-2.5 rounded-full shadow-md backdrop-blur-sm hover:bg-white active:scale-95 transition text-gray-800"
            title="Kembali ke menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Header */}
        <div className="p-4 bg-white shadow-xs border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 leading-snug">
            {item.name}
          </h2>
          <p className="text-fuchsia-700 font-black text-lg mt-1">
            Rp {item.price.toLocaleString('id-ID')}
          </p>
          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Quantity Selection for Non-Spicy items */}
        {!hasSpiciness ? (
          <div className="p-4 bg-white mt-2.5 rounded-2xl mx-4 border border-gray-100 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
              Jumlah Porsi
            </label>
            <div className="flex items-center gap-4 justify-center py-1.5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-xl transition active:scale-95 text-gray-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-extrabold w-12 text-center text-gray-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white p-2.5 rounded-xl transition active:scale-95 shadow-md shadow-fuchsia-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Spicy level options per quantity */
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-xs border border-gray-100">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Jumlah Porsi
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg transition active:scale-95 text-gray-700"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-extrabold w-6 text-center text-sm text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white p-1.5 rounded-lg transition active:scale-95 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {Array.from({ length: quantity }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100"
                >
                  <label className="text-xs font-bold text-gray-800 mb-2 block">
                    Porsi {idx + 1}: Pilih Level Pedas
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableLevels.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => handleSelectLevel(idx, lvl)}
                        className={`py-2 rounded-xl font-bold text-xs transition-all duration-150 transform active:scale-95 ${
                          selectedLevels[idx] === lvl
                            ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-200'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100'
                        }`}
                      >
                        Lvl {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Universal Item Order Note Input */}
        <div className="p-4 bg-white mt-2.5 rounded-2xl mx-4 border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>Catatan untuk Menu Ini (Opsional)</span>
            </label>
            <span className="text-[10px] text-gray-400 font-mono">
              {itemNote.length}/250
            </span>
          </div>

          <textarea
            value={itemNote}
            onChange={(e) => setItemNote(e.target.value.slice(0, 250))}
            placeholder="Contoh: tidak pakai sambal, saus dipisah, es sedikit, jangan terlalu manis..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-10 shadow-lg">
        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-extrabold py-3.5 rounded-full shadow-lg shadow-fuchsia-200 transition transform active:scale-[0.98] text-sm"
        >
          Tambah ke Keranjang • Rp {(item.price * quantity).toLocaleString('id-ID')}
        </button>
      </div>
    </div>
  );
}
