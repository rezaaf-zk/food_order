import React from 'react';
import { MapPin, ChevronRight, Store, Navigation } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { formatDistance } from '../../utils/distance';

export default function BranchHeaderBar() {
  const { selectedBranch, openSelector } = useBranch();

  return (
    <div
      onClick={openSelector}
      className="mx-4 my-2 p-3 bg-gradient-to-r from-fuchsia-50/90 to-pink-50/70 border border-fuchsia-100 rounded-2xl cursor-pointer hover:border-fuchsia-300 hover:shadow-sm transition-all duration-200 flex items-center justify-between group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-white rounded-xl shadow-xs text-fuchsia-600 group-hover:scale-105 transition-transform flex-shrink-0">
          <Store className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600">
              Outlet Pemesanan
            </p>
            {selectedBranch?.distance_km != null && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-pink-600 bg-pink-100/70 px-1.5 py-0.2 rounded">
                <Navigation className="w-2.5 h-2.5" />
                {formatDistance(selectedBranch.distance_km)}
              </span>
            )}
          </div>
          <h2 className="font-extrabold text-sm text-gray-900 truncate">
            {selectedBranch ? selectedBranch.name : 'Pilih Outlet'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs font-bold text-fuchsia-600 pl-2">
        <span>Ganti</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
