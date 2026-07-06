import React, { useState, useContext } from 'react';
import { Menu, Search, Plus } from 'lucide-react';
import { menuData } from '../../data/menuData';
import HeroSlider from '../shared/HeroSlider';

export default function MenuList({ onSelectItem, toggleSidebar, cartCount }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('makanan');

  const categories = [
    { id: 'makanan', label: 'Makanan' },
    { id: 'minuman', label: 'Minuman' },
    { id: 'snack', label: 'Snack' },
  ];

  const currentItems = menuData[activeCategory];
  const filteredItems = currentItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // Container utama sekarang diatur oleh App.jsx. Komponen ini hanya mengisi ruang yang diberikan.
    <div className="flex flex-col flex-1 relative pb-20">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white">
        <button onClick={toggleSidebar} className="p-1 hover:bg-gray-100 rounded-lg transition">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Holi Food</h1>
        <div className="text-right">
          {cartCount > 0 && (
            <span className="inline-block bg-fuchsia-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Hero Slider */}
      <HeroSlider />

      {/* Category Tabs */}
      <div className="flex gap-2 p-4 bg-white">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setSearchQuery('');
            }}
            className={`flex items-center gap-1 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-fuchsia-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Menu */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-bold text-sm text-gray-800 line-clamp-2 min-h-[40px]">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-fuchsia-600">
                      Rp {item.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => onSelectItem(item, activeCategory)}
                      className="bg-green-400 hover:bg-green-500 text-white p-1.5 rounded-full shadow transition transform active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              Tidak ada menu yang cocok
            </p>
          </div>
        )}
      </div>
    </div>
  );
}