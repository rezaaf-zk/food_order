import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function StripePayment({ orderData, onPaymentSuccess, onPaymentError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // Simpan data pesanan di localStorage sebelum redirect
    localStorage.setItem('stripe_order', JSON.stringify(orderData));

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Arahkan kembali ke halaman yang sama setelah pembayaran
        return_url: window.location.href.split('?')[0],
      },
    });

    if (confirmError.type === 'card_error' || confirmError.type === 'validation_error') {
      setError(confirmError.message);
      if (onPaymentError) onPaymentError(confirmError.message);
    } else if (confirmError) {
      const msg = confirmError.message || 'Terjadi kesalahan tak terduga.';
      setError(msg);
      if (onPaymentError) onPaymentError(msg);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-xl border">
      <div className="p-3 bg-white rounded-lg border">
        <PaymentElement />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-full transition flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Memproses...
          </>
        ) : (
          `Bayar Rp ${orderData.totalPrice.toLocaleString('id-ID')}`
        )}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Pembayaran Anda aman dan terenkripsi.
      </p>
    </form>
  );
}