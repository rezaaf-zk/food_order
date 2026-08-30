let snapPromise = null;

export function loadMidtransSnap(
  clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '',
  isProduction
) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Midtrans Snap is only available in browser environments.'));
  }

  // Determine production vs sandbox
  const prod = isProduction !== undefined
    ? Boolean(isProduction)
    : (import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true' || !String(clientKey).startsWith('SB-'));

  if (window.snap) {
    return Promise.resolve(window.snap);
  }

  if (snapPromise) {
    return snapPromise;
  }

  snapPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('midtrans-snap-script');
    if (existingScript) {
      if (window.snap) {
        resolve(window.snap);
        return;
      }
      existingScript.addEventListener('load', () => resolve(window.snap));
      existingScript.addEventListener('error', () => reject(new Error('Gagal memuat script Midtrans Snap.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = prod
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    if (clientKey) {
      script.setAttribute('data-client-key', clientKey);
    }

    script.async = true;
    script.onload = () => {
      if (window.snap) {
        resolve(window.snap);
      } else {
        reject(new Error('Midtrans Snap SDK tidak terdefinisi di window.'));
      }
    };
    script.onerror = () => {
      snapPromise = null;
      reject(new Error('Gagal memuat skrip Midtrans Snap. Periksa koneksi internet Anda.'));
    };

    document.body.appendChild(script);
  });

  return snapPromise;
}
