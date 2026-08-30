import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Bell, Store, User, MapPin } from 'lucide-react';

const statusFlow = [
  { key: 'waiting', label: 'Pesanan Diterima', icon: Clock },
  { key: 'processing', label: 'Sedang Dimasak', icon: ChefHat },
  { key: 'ready', label: 'Siap Diambil', icon: Bell },
  { key: 'completed', label: 'Selesai', icon: CheckCircle }
];

const paymentMethodLabel = {
  midtrans: 'Pembayaran Online (Midtrans Snap)',
  stripe: 'Kartu / Transfer Bank',
  qris: 'QRIS / E-Wallet',
  cash: 'Bayar di Kasir (Tunai)'
};

export default function OrderStatusView({ order, onBack }) {
  const [liveOrder, setLiveOrder] = useState(order);

  // Sync status if localStorage orders update
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'orders') return;
      try {
        const all = JSON.parse(e.newValue || '[]');
        const updated = all.find(
          (o) => o.orderId === order.orderId || o.orderNumber === order.orderNumber
        );
        if (updated) setLiveOrder(updated);
      } catch {}
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [order?.orderId, order?.orderNumber]);

  const currentIdx = Math.max(
    0,
    statusFlow.findIndex((s) => s.key === liveOrder?.status)
  );

  const formatTime = (iso) =>
    new Date(iso || Date.now()).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

  const orderIdDisplay =
    liveOrder?.orderNumber ||
    liveOrder?.orderId ||
    `ORD-${Date.now().toString().slice(-6)}`;

  return (
    <div className="flex flex-col flex-1 bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition active:scale-95 text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm leading-none">
              Status Pesanan
            </h1>
            <p className="text-[11px] text-fuchsia-600 font-mono font-bold mt-1">
              #{orderIdDisplay}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-fuchsia-50 text-fuchsia-700">
          Live Tracking
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
        {/* Branch Info Badge */}
        {liveOrder?.branchName && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ambil Pesanan di
              </p>
              <p className="text-xs font-extrabold text-slate-800 truncate">
                {liveOrder.branchName}
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Progres Pesanan
          </h2>
          <ol className="relative space-y-0">
            {statusFlow.map((step, idx) => {
              const Icon = step.icon;
              const isDone = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isPending = idx > currentIdx;

              return (
                <li key={step.key} className="flex items-start gap-3 pb-5 last:pb-0 relative">
                  {/* Vertical Connector Line */}
                  {idx < statusFlow.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 transition-colors duration-300 ${
                        isDone ? 'bg-fuchsia-600' : 'bg-slate-200'
                      }`}
                    />
                  )}
                  {/* Icon Circle */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 ring-4 ring-fuchsia-100 text-white shadow-md'
                        : isDone
                        ? 'bg-fuchsia-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {/* Label */}
                  <div className="pt-1.5 flex-1">
                    <p
                      className={`text-xs font-extrabold leading-none ${
                        isCurrent
                          ? 'text-fuchsia-700'
                          : isDone
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Pukul {formatTime(liveOrder.createdAt || liveOrder.created_at)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Payment Status Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
            Status Pembayaran
          </h2>
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
              liveOrder.paymentStatus === 'completed' || liveOrder.paymentStatus === 'paid'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                liveOrder.paymentStatus === 'completed' || liveOrder.paymentStatus === 'paid'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            {liveOrder.paymentStatus === 'completed' || liveOrder.paymentStatus === 'paid'
              ? 'Lunas (Pembayaran Berhasil)'
              : 'Menunggu Pembayaran Kasir'}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Metode:{' '}
            <span className="font-semibold text-slate-800">
              {paymentMethodLabel[liveOrder.paymentMethod] || liveOrder.paymentMethod || 'Tunai'}
            </span>
          </p>
        </div>

        {/* Order Items Snapshot */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
            Rincian Menu
          </h2>
          <ul className="space-y-2.5 divide-y divide-slate-50">
            {(liveOrder.items || []).map((item, i) => (
              <li key={i} className="pt-2 first:pt-0 flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    {item.level && (
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded">
                        Level {item.level}
                      </span>
                    )}
                  </div>
                  {(item.notes || item.note) && (
                    <p className="text-[10px] text-amber-800 italic mt-0.5 line-clamp-2">
                      Catatan: "{item.notes || item.note}"
                    </p>
                  )}
                </div>
                <span className="text-xs font-extrabold text-slate-700">
                  ×{item.quantity}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between text-xs font-extrabold">
            <span className="text-slate-700">Total Tagihan</span>
            <span className="text-fuchsia-700 text-sm font-black">
              Rp {Number(liveOrder.totalPrice || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
            Informasi Pemesan
          </h2>
          <div className="grid grid-cols-[max-content,1fr] gap-x-4 gap-y-1.5 text-xs">
            <span className="text-slate-400">Nama</span>
            <span className="font-bold text-slate-800">{liveOrder.customerName}</span>
            <span className="text-slate-400">Waktu</span>
            <span className="font-semibold text-slate-800">
              {formatTime(liveOrder.orderTime || liveOrder.createdAt)}
            </span>
            {liveOrder.notes && (
              <>
                <span className="text-slate-400">Catatan</span>
                <span className="font-semibold text-slate-800">{liveOrder.notes}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200/80 p-4 sticky bottom-0">
        <button
          onClick={onBack}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3.5 rounded-xl transition active:scale-[0.98]"
        >
          Kembali ke Menu Utama
        </button>
      </div>
    </div>
  );
}
