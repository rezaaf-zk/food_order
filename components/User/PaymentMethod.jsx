import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import StripePayment from './StripePayment';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
const isStripeKeyMissing = !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export default function PaymentMethod({ orderData, onBack, onConfirmOrder }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderId] = useState(`ORD-${Date.now()}`);
  const [clientSecret, setClientSecret] = useState('');
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Kartu & Transfer Bank',
      description: 'Kartu Kredit/Debit & Virtual Account (VA).',
      style: 'blue'
    },
    {
      id: 'qris',
      name: 'QRIS',
      description: 'Scan QR untuk membayar.',
      style: 'green'
    },
    {
      id: 'cash',
      name: 'Cash (Bayar di Kasir)',
      description: 'Bayar langsung di kasir.',
      style: 'fuchsia'
    },
  ];

  const handlePaymentSuccess = (paymentIntent) => {
    const completeOrderData = {
      ...orderData,
      orderId: orderId,
      paymentMethod: 'stripe',
      paymentBank: paymentIntent.payment_method_details?.type || 'online',
      paymentStatus: 'completed',
      status: 'processing',
      paymentIntentId: paymentIntent.id, 
    };
    onConfirmOrder(completeOrderData);
  };

  const handlePaymentError = (error) => {
    alert(`Pembayaran Gagal: ${error}`);
  };

  const handleSelectStripe = async () => {
    if (isStripeKeyMissing) {
      alert('Kunci Stripe (VITE_STRIPE_PUBLISHABLE_KEY) belum diatur. Silakan periksa file .env.local Anda.');
      return;
    }

    setSelectedMethod('stripe');
    if (clientSecret) return;

    setIsStripeLoading(true);
    try {
      // PERBAIKAN: Mengubah ujung rute fetch agar sesuai dengan fungsi Supabase Cloud milikmu
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/create-stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderData.totalPrice * 100,
          orderId: orderId,
          customerName: orderData.customerName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Server tidak merespon dengan benar.' }));
        throw new Error(errorData.error || 'Gagal menyiapkan pembayaran.');
      }

      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Error creating Payment Intent:", error);
      alert(`Tidak dapat memuat metode pembayaran Stripe: ${error.message}`);
      setSelectedMethod(null);
    } finally {
      setIsStripeLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMethod) {
      alert('Silakan pilih metode pembayaran!');
      return;
    }
    if (selectedMethod === 'stripe') return;

    setProcessing(true);

    setTimeout(() => {
      const completeOrderData = {
        ...orderData,
        orderId: orderId,
        paymentMethod: selectedMethod,
        paymentBank: null,
        status: 'waiting',
        paymentStatus: 'pending',
      };

      onConfirmOrder(completeOrderData);
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Pilih Pembayaran</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h2 className="font-bold text-gray-800 mb-2">Ringkasan Pesanan</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Jumlah Item:</span>
            <span className="font-bold">{orderData.items.length}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-300">
            <span className="font-bold text-gray-800">Total:</span>
            <span className="font-bold text-lg text-fuchsia-600">
              Rp {orderData.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <h2 className="font-bold text-gray-800">Metode Pembayaran</h2>
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => {
                if (method.id === 'stripe') {
                  handleSelectStripe();
                } else {
                  setSelectedMethod(method.id);
                }
              }}
              className={`w-full p-4 rounded-xl border-2 transition text-left ${
                selectedMethod === method.id
                  ? method.style === 'blue' ? 'border-blue-500 bg-blue-50' :
                    method.style === 'green' ? 'border-green-500 bg-green-50' :
                    'border-fuchsia-500 bg-fuchsia-50'
                  : 'border-gray-200 bg-white hover:border-gray-200'
              }`}
              disabled={isStripeLoading}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{method.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle className={`w-5 h-5 ${
                    method.style === 'blue' ? 'text-blue-600' : 
                    method.style === 'green' ? 'text-green-600' : 
                    'text-fuchsia-600'} flex-shrink-0`} />
                )}
              </div>
            </button>
          ))}
        </div>

        {isStripeLoading && (
          <div className="flex justify-center items-center gap-2 p-4 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memuat metode pembayaran...</span>
          </div>
        )}

        {/* Form Pembayaran Stripe */}
        {selectedMethod === 'stripe' && !isStripeLoading && (
          <div className="mt-2">
            <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
              {clientSecret ? (
                <StripePayment
                  orderData={{ ...orderData, orderId }}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              ) : (
                <div className="flex justify-center items-center gap-2 p-4 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </Elements>
          </div>
        )}

        {/* QRIS Info */}
        {selectedMethod === 'qris' && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center space-y-3">
            <h3 className="font-bold text-green-900">Scan untuk Membayar</h3>
            <div className="bg-white p-2 rounded-lg inline-block shadow-sm">
              <img src="\Qris.JPG" className="w-48 h-48 mx-auto" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Total yang harus dibayar:</p>
              <p className="font-bold text-2xl text-black">
                Rp {orderData.totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

        {/* Cash Info */}
        {selectedMethod === 'cash' && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h3 className="font-bold text-amber-900 mb-2">Pembayaran di Kasir</h3>
            <p className="text-sm text-amber-800">
              Anda akan membayar sebesar <strong>Rp {orderData.totalPrice.toLocaleString()}</strong> Untuk melanjutkan pesanan.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-4 sticky bottom-0">
        {(selectedMethod === 'cash' || selectedMethod === 'qris') && (
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || processing}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-full transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              'Konfirmasi Pesanan'
            )}
          </button>
        )}
      </div>
    </div>
  );
}