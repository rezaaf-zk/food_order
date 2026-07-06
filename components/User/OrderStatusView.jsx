import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Bell } from 'lucide-react';

// ─── BroadcastChannel (realtime sync tanpa reload) ───────────────
const channel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('orders_sync')
  : null;

const statusFlow = [
  { key: 'waiting',    label: 'Pesanan Diterima', icon: Clock      },
  { key: 'processing', label: 'Sedang Dimasak',   icon: ChefHat    },
  { key: 'ready',      label: 'Siap Diambil',     icon: Bell       },
  { key: 'completed',  label: 'Selesai',           icon: CheckCircle },
];

const paymentMethodLabel = {
  stripe: 'Kartu / Transfer Bank',
  qris:   'QRIS',
  cash:   'Bayar di Kasir',
};

export default function OrderStatusView({ order, onBack }) {
  const [liveOrder, setLiveOrder] = useState(order);

  // Sinkronkan dengan tab admin secara realtime
  useEffect(() => {
    if (!channel) return;
    const handler = (e) => {
      if (e.data?.type === 'ORDERS_UPDATED') {
        const updated = e.data.orders.find(o => o.orderId === order.orderId);
        if (updated) setLiveOrder(updated);
      }
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }, [order.orderId]);

  // Juga listen perubahan localStorage dari tab lain (fallback)
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'orders') return;
      try {
        const all = JSON.parse(e.newValue || '[]');
        const updated = all.find(o => o.orderId === order.orderId);
        if (updated) setLiveOrder(updated);
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [order.orderId]);

  const currentIdx = statusFlow.findIndex(s => s.key === liveOrder.status);

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    // Container diatur oleh App.jsx. Komponen ini mengisi ruang yang diberikan.
    <div className="flex flex-col flex-1 bg-slate-50 font-sans">

      {/* ── Header ── */}
      <div className="bg-white border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="font-bold text-slate-800 text-sm leading-none">Status Pesanan</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            #{liveOrder.orderId.split('-')[1] || liveOrder.orderId.slice(-6)}
          </p>
        </div>
      </div>


      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Timeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Progres Pesanan</h2>
          <ol className="relative space-y-0">
            {statusFlow.map((step, idx) => {
              const Icon = step.icon;
              const done    = idx < currentIdx;
              const current = idx === currentIdx;
              const pending = idx > currentIdx;
              return (
                <li key={step.key} className="flex items-start gap-3 pb-5 last:pb-0 relative">
                  {/* Connector line */}
                  {idx < statusFlow.length - 1 && (
                    <div className={`absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 ${done ? 'bg-fuchsia-500' : 'bg-slate-200'}`} />
                  )}
                  {/* Icon circle */}
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${current ? 'bg-fuchsia-600 ring-4 ring-fuchsia-100' : done ? 'bg-fuchsia-500' : 'bg-slate-200'}`}
                  >
                    <Icon className={`w-4 h-4 ${pending ? 'text-slate-400' : 'text-white'}`} />
                  </div>
                  {/* Label */}
                  <div className="pt-1.5">
                    <p className={`text-sm font-semibold leading-none ${current ? 'text-fuchsia-700' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    {current && (
                      <p className="text-xs text-slate-400 mt-1">
                        Diperbarui pukul {formatTime(liveOrder.createdAt || new Date().toISOString())}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Payment */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Pembayaran</h2>
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full
            ${liveOrder.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${liveOrder.paymentStatus === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {liveOrder.paymentStatus === 'completed' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Metode: {paymentMethodLabel[liveOrder.paymentMethod] || liveOrder.paymentMethod || '—'}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Detail Pesanan</h2>
          <ul className="space-y-2">
            {liveOrder.items.map((item, i) => (
              <li key={i} className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  {item.level && <p className="text-xs text-slate-400">Level {item.level}</p>}
                </div>
                <span className="text-sm font-semibold text-slate-600 ml-4">×{item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className=" border-slate-100 mt-3 pt-3 flex justify-between text-sm font-bold">
            <span className="text-slate-700">Total</span>
            <span className="text-fuchsia-600">Rp {liveOrder.totalPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Customer */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Info Pemesan</h2>
          <div className="grid grid-cols-[max-content,1fr] gap-x-4 gap-y-2 text-sm">
            <span className="text-slate-400">Nama</span>
            <span className="font-medium text-slate-800">{liveOrder.customerName}</span>
            <span className="text-slate-400">Waktu</span>
            <span className="font-medium text-slate-800">{formatTime(liveOrder.orderTime || liveOrder.createdAt)}</span>
            {liveOrder.notes && (
              <>
                <span className="text-slate-400">Catatan</span>
                <span className="font-medium text-slate-800">{liveOrder.notes}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-white border-slate-200 p-4 sticky bottom-0">
        {liveOrder.paymentStatus === 'pending' && liveOrder.paymentMethod === 'cash' && (
          <p className="text-xs text-center text-slate-400 mb-2">
            Tunjukkan pesanan ini ke kasir untuk konfirmasi pembayaran
          </p>
        )}
        <button
          onClick={onBack}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-3 rounded-xl transition"
        >
          Kembali ke Menu
        </button>
      </div>
    </div>
  );
}
