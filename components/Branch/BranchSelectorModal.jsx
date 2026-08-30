import React from 'react';
import { MapPin, Navigation, X, Check, Store, Clock, Phone, AlertTriangle } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { CartContext } from '../../context/CartContext';
import { formatDistance } from '../../utils/distance';

export default function BranchSelectorModal() {
  const {
    branches,
    selectedBranch,
    isDetecting,
    isSelectorOpen,
    closeSelector,
    selectBranch,
    detectNearestBranch,
    locationPermission
  } = useBranch();

  const { cart, clearCart } = React.useContext(CartContext);

  if (!isSelectorOpen) return null;

  const handleSelectBranch = (branch) => {
    if (selectedBranch && selectedBranch.id !== branch.id && cart.length > 0) {
      const confirmChange = window.confirm(
        `Anda sedang mengganti outlet ke "${branch.name}". Keranjang akan disesuaikan dengan ketersediaan di outlet ini. Lanjutkan?`
      );
      if (!confirmChange) return;
      clearCart();
    }

    selectBranch(branch, true);
    closeSelector();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-fuchsia-100 text-fuchsia-700 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-gray-800">Pilih Outlet Terdekat</h2>
              <p className="text-xs text-gray-500">Temukan gerai terdekat dari lokasi Anda</p>
            </div>
          </div>
          <button
            onClick={closeSelector}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Detection Button (GPS) */}
        <div className="p-4 bg-gradient-to-r from-fuchsia-50 to-pink-50/40 border-b border-fuchsia-100">
          <button
            onClick={detectNearestBranch}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 shadow-md shadow-fuchsia-200 active:scale-[0.98] transition disabled:opacity-75"
          >
            <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Mencari Outlet Terdekat...' : 'Gunakan Lokasi Saya Saat Ini'}</span>
          </button>

          {locationPermission === 'denied' && (
            <p className="text-xs text-amber-700 flex items-center gap-1.5 mt-2.5 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Izin lokasi dinonaktifkan. Anda dapat memilih outlet secara manual di bawah.</span>
            </p>
          )}
        </div>

        {/* Branch Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-gray-100">
          {branches.map((branch) => {
            const isSelected = selectedBranch?.id === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => handleSelectBranch(branch)}
                className={`pt-3 first:pt-0 p-3 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-fuchsia-600 bg-fuchsia-50/50 shadow-sm'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-gray-900 truncate">{branch.name}</h3>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 bg-fuchsia-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" /> Aktif
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{branch.address}, {branch.city}</span>
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-gray-600 font-medium">
                      {branch.distance_km != null && (
                        <span className="inline-flex items-center gap-1 text-fuchsia-700 bg-fuchsia-100/70 px-2 py-0.5 rounded-md font-bold">
                          <Navigation className="w-3 h-3" /> {formatDistance(branch.distance_km)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" /> Buka (10:00 - 22:00)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBranch(branch);
                    }}
                    className={`text-xs font-bold py-2 px-3.5 rounded-xl transition-all whitespace-nowrap self-center ${
                      isSelected
                        ? 'bg-fuchsia-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-fuchsia-50 hover:text-fuchsia-600'
                    }`}
                  >
                    {isSelected ? 'Dipilih' : 'Pilih Cabang'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            Menu dan ketersediaan stok akan otomatis menyesuaikan dengan outlet yang Anda pilih.
          </p>
        </div>
      </div>
    </div>
  );
}
