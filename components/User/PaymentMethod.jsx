import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Loader2, CreditCard, QrCode, Banknote, ShieldCheck, Zap } from 'lucide-react';
import { loadMidtransSnap } from '../../utils/midtransSnap';
import { createOrder } from '../../services/orderService';

export default function PaymentMethod({ orderData, onBack, onConfirmOrder }) {
  const [selectedMethod, setSelectedMethod] = useState('midtrans');
  const [isSnapLoading, setIsSnapLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [tempOrderId] = useState(() => `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`);

  const paymentMethods = [
    {
      id: 'midtrans',
      name: 'Pembayaran Online (Midtrans Snap)',
      description: 'QRIS (GoPay, OVO, Dana, ShopeePay), VA BCA/Mandiri/BNI/BRI, & Kartu.',
      icon: <Zap className="w-5 h-5" />,
      style: 'fuchsia',
      badge: 'Otomatis'
    },
    {
      id: 'qris',
      name: 'QRIS Statis Gerai',
      description: 'Scan barcode QRIS gerai & konfirmasi ke kasir.',
      icon: <QrCode className="w-5 h-5" />,
      style: 'green',
      badge: 'Manual'
    },
    {
      id: 'cash',
      name: 'Bayar Tunai di Kasir',
      description: 'Lakukan pembayaran langsung tunai saat ambil pesanan.',
      icon: <Banknote className="w-5 h-5" />,
      style: 'amber',
      badge: 'Tunai'
    }
  ];

  // --------------------------------------------------------------------------
  // Handle Midtrans Snap Payment
  // --------------------------------------------------------------------------
  const handleMidtransPayment = async () => {
    if (processing || isSnapLoading) return; // Prevent double-clicks

    setIsSnapLoading(true);
    setProcessing(true);

    try {
      // 1. Determine API endpoint
      const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
      let endpoint = '/api/create-midtrans-transaction';
      if (rawApiBase) {
        if (rawApiBase.endsWith('/api')) {
          endpoint = `${rawApiBase}/create-midtrans-transaction`;
        } else if (rawApiBase.endsWith('/functions/v1')) {
          endpoint = `${rawApiBase}/create-midtrans-transaction`;
        } else {
          endpoint = `${rawApiBase}/api/create-midtrans-transaction`;
        }
      }

      // 2. Request Snap Token from backend
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: tempOrderId,
            amount: orderData.totalPrice,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            items: orderData.items
          })
        });
      } catch (fetchErr) {
        throw new Error(`Tidak dapat terhubung ke server backend (${endpoint}): ${fetchErr.message}. Pastikan backend server aktif (npm run server).`);
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server merespon dengan status ${response.status}`);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('Gagal menerima Snap token dari server payment.');
      }

      // 3. Load Snap SDK
      const snap = await loadMidtransSnap();
      if (!snap || typeof snap.pay !== 'function') {
        throw new Error('Midtrans Snap SDK tidak berhasil diinisialisasi.');
      }

      // 4. Open Midtrans Snap Popup
      snap.pay(data.token, {
        onSuccess: async (result) => {
          console.log('[Midtrans] Payment Success:', result);
          try {
            const createResult = await createOrder({
              ...orderData,
              orderNumber: tempOrderId,
              paymentMethod: 'midtrans',
              paymentStatus: 'paid',
              orderStatus: 'confirmed',
              paymentIntentId: result.transaction_id || tempOrderId
            });

            if (createResult.success) {
              onConfirmOrder(createResult.order);
            }
          } catch (err) {
            alert('Pembayaran berhasil namun pembuatan pesanan gagal: ' + err.message);
          } finally {
            setProcessing(false);
            setIsSnapLoading(false);
          }
        },

        onPending: async (result) => {
          console.log('[Midtrans] Payment Pending:', result);
          try {
            const createResult = await createOrder({
              ...orderData,
              orderNumber: tempOrderId,
              paymentMethod: 'midtrans',
              paymentStatus: 'pending',
              orderStatus: 'pending',
              paymentIntentId: result.transaction_id || tempOrderId
            });

            if (createResult.success) {
              onConfirmOrder(createResult.order);
            }
          } catch (err) {
            alert('Gagal menyimpan pesanan pending: ' + err.message);
          } finally {
            setProcessing(false);
            setIsSnapLoading(false);
          }
        },

        onError: (result) => {
          console.error('[Midtrans] Payment Error:', result);
          alert('Pembayaran gagal atau dibatalkan oleh bank: ' + (result?.status_message || 'Silakan coba lagi.'));
          setProcessing(false);
          setIsSnapLoading(false);
        },

        onClose: () => {
          console.log('[Midtrans] Customer closed the Snap popup without finishing payment.');
          setProcessing(false);
          setIsSnapLoading(false);
        }
      });

    } catch (err) {
      console.error('[Midtrans] Error in Snap flow:', err);
      alert(`Gagal membuka sistem pembayaran Midtrans: ${err.message}`);
      setProcessing(false);
      setIsSnapLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handle Manual / Offline Payment (QRIS Statis / Tunai di Kasir)
  // --------------------------------------------------------------------------
  const handleConfirmOffline = async () => {
    if (!selectedMethod || processing) return;

    setProcessing(true);
    try {
      const result = await createOrder({
        ...orderData,
        orderNumber: tempOrderId,
        paymentMethod: selectedMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending'
      });

      if (result.success) {
        onConfirmOrder(result.order);
      }
    } catch (err) {
      alert('Gagal membuat pesanan: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white flex-1 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button
          onClick={onBack}
          disabled={processing || isSnapLoading}
          className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-700 active:scale-95 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-extrabold text-gray-900">Metode Pembayaran</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Order Summary Box */}
        <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50/50 p-4 rounded-2xl border border-fuchsia-100">
          <h2 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider mb-2">
            Ringkasan Tagihan
          </h2>
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>Outlet</span>
            <span className="font-bold text-gray-800">{orderData.branchName}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
            <span>Total Menu ({orderData.items.length} item)</span>
            <span className="font-bold text-gray-800">{orderData.items.reduce((s, i) => s + i.quantity, 0)} Porsi</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-fuchsia-100">
            <span className="font-bold text-sm text-gray-900">Total Bayar</span>
            <span className="font-extrabold text-lg text-fuchsia-700">
              Rp {orderData.totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2.5">
          <h2 className="font-extrabold text-sm text-gray-900">Pilih Pembayaran</h2>
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                disabled={processing || isSnapLoading}
                className={`w-full p-3.5 rounded-2xl border-2 transition-all duration-150 text-left ${
                  isSelected
                    ? method.style === 'fuchsia'
                      ? 'border-fuchsia-500 bg-fuchsia-50/60 ring-2 ring-fuchsia-100'
                      : method.style === 'green'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100'
                      : 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-100'
                    : 'border-gray-100 bg-white hover:border-gray-200 shadow-xs'
                } disabled:opacity-60`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isSelected
                          ? method.style === 'fuchsia'
                            ? 'bg-fuchsia-600 text-white shadow-sm'
                            : method.style === 'green'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-amber-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {method.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs text-gray-900">{method.name}</h3>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          method.style === 'fuchsia' ? 'bg-fuchsia-100 text-fuchsia-700' :
                          method.style === 'green' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {method.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{method.description}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle
                      className={`w-5 h-5 ${
                        method.style === 'fuchsia'
                          ? 'text-fuchsia-600'
                          : method.style === 'green'
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      } flex-shrink-0`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Method Details Preview */}
        {selectedMethod === 'midtrans' && (
          <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50/50 p-4 rounded-2xl border border-fuchsia-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-fuchsia-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-fuchsia-600" />
              <span>Pembayaran Online Terverifikasi Otomatis</span>
            </div>
            <p className="text-xs text-fuchsia-950 leading-relaxed">
              Klik tombol di bawah untuk membuka popup <strong>Midtrans Snap</strong>. Mendukung pembayaran instan melalui QRIS GoPay, OVO, ShopeePay, DANA, Virtual Account, & Kartu Debit/Kredit.
            </p>
          </div>
        )}

        {/* QRIS View */}
        {selectedMethod === 'qris' && (
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 text-center space-y-3 animate-in fade-in duration-200">
            <h3 className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider">
              Scan QRIS Gerai Fisik
            </h3>
            <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-emerald-100">
              <img src="/Qris.JPG" alt="QRIS" className="w-48 h-48 mx-auto object-contain rounded-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pembayaran:</p>
              <p className="font-extrabold text-xl text-gray-900">
                Rp {orderData.totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
            <p className="text-[11px] text-emerald-800">
              Setelah scan dan transfer, konfirmasikan bukti pembayaran Anda ke kasir gerai.
            </p>
          </div>
        )}

        {/* Cash View */}
        {selectedMethod === 'cash' && (
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Pembayaran Tunai di Kasir</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Silakan lakukan pembayaran tunai sebesar{' '}
              <strong>Rp {orderData.totalPrice.toLocaleString('id-ID')}</strong> ke kasir saat mengambil pesanan di{' '}
              <strong>{orderData.branchName}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-white p-4 border-t border-gray-100 sticky bottom-0">
        {selectedMethod === 'midtrans' ? (
          <button
            onClick={handleMidtransPayment}
            disabled={processing || isSnapLoading}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-full shadow-lg shadow-fuchsia-200 transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isSnapLoading || processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyiapkan Pembayaran Midtrans...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Bayar Sekarang (Rp {orderData.totalPrice.toLocaleString('id-ID')})</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleConfirmOffline}
            disabled={!selectedMethod || processing}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-full shadow-lg shadow-fuchsia-200 transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Pesanan...</span>
              </>
            ) : (
              <span>Konfirmasi & Buat Pesanan</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}