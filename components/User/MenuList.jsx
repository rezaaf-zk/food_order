import React, { useState, useEffect } from 'react';
import { Menu, Search, Plus, Ban, Loader2 } from 'lucide-react';
import HeroSlider from '../shared/HeroSlider';
import BranchHeaderBar from '../Branch/BranchHeaderBar';
import { useBranch } from '../../context/BranchContext';
import { fetchCategories, fetchProductsByBranch } from '../../services/productService';

export default function MenuList({ onSelectItem, toggleSidebar, cartCount }) {
  const { selectedBranch } = useBranch();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('makanan');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories and branch-filtered products
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories(),
          fetchProductsByBranch(selectedBranch?.id)
        ]);

        if (isMounted) {
          setCategories(cats);
          if (cats.length > 0 && !cats.some((c) => c.slug === activeCategory)) {
            setActiveCategory(cats[0].slug);
          }
          setProducts(prods);
        }
      } catch (err) {
        console.error('Error loading menu:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedBranch?.id]);

  const currentCategoryProducts = products.filter(
    (item) => item.category === activeCategory
  );

  const filteredItems = currentCategoryProducts.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 relative pb-[44vh] bg-gray-50 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white sticky top-0 z-20 shadow-xs">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-700 active:scale-95"
          title="Buka menu navigasi"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
          HoliFood
        </h1>
        <div className="text-right">
          {cartCount > 0 && (
            <span className="inline-block bg-fuchsia-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm animate-in zoom-in-75 duration-150">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {/* Branch Selector Header Bar */}
      <BranchHeaderBar />

      {/* Search Bar */}
      <div className="px-4 py-1.5 bg-transparent">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari menu lezat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500 shadow-xs placeholder:text-gray-400"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Hero Slider */}
      <HeroSlider />

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-2 bg-transparent overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => {
              setActiveCategory(cat.slug);
              setSearchQuery('');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all duration-200 active:scale-95 ${
              activeCategory === cat.slug
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-200'
                : 'bg-white text-gray-700 border border-gray-200/70 hover:bg-gray-100'
            }`}
          >
            {cat.label || cat.name}
          </button>
        ))}
      </div>

      {/* Grid Menu Products */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-fuchsia-600" />
            <p className="text-xs font-semibold">Memuat menu outlet...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filteredItems.map((item) => {
              const isAvailable = item.available !== false;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 group ${
                    !isAvailable ? 'opacity-70 bg-gray-50' : ''
                  }`}
                >
                  {/* Interactive Product Image */}
                  <div
                    onClick={() => isAvailable && onSelectItem(item, activeCategory)}
                    className={`relative overflow-hidden ${
                      isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    role="button"
                    tabIndex={isAvailable ? 0 : -1}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && isAvailable) {
                        onSelectItem(item, activeCategory);
                      }
                    }}
                    title={isAvailable ? `Lihat detail ${item.name}` : 'Menu habis'}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`w-full h-32 object-cover transition-transform duration-300 ${
                        isAvailable ? 'group-hover:scale-105' : 'grayscale'
                      }`}
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Habis di Outlet
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div
                      onClick={() => isAvailable && onSelectItem(item, activeCategory)}
                      className={isAvailable ? 'cursor-pointer' : ''}
                    >
                      <h3 className="font-extrabold text-xs text-gray-900 line-clamp-1 group-hover:text-fuchsia-600 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 min-h-[30px] leading-tight">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Price & Add Action */}
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-50">
                      <span className="text-xs font-black text-fuchsia-700">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>

                      {isAvailable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectItem(item, activeCategory);
                          }}
                          className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white p-2 rounded-xl shadow-xs transition transform active:scale-90"
                          title={`Pilih ${item.name}`}
                          aria-label={`Pilih ${item.name}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                          Kosong
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <p className="text-sm font-semibold">Tidak ada menu pada kategori ini.</p>
            <p className="text-xs mt-1">Coba cari dengan kata kunci lain.</p>
          </div>
        )}
      </div>
    </div>
  );
}