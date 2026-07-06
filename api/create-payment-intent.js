const Stripe = require('stripe');

// Ambil secret key dari environment variable di Vercel
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Izinkan request dari semua origin (atau ganti '*' dengan URL frontend Anda)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request (OPTIONS) untuk CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { amount, orderId, customerName } = req.body;

  try {
    // Buat PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'idr',
      description: `Pembayaran untuk Pesanan #${orderId}`,
      metadata: {
        orderId: orderId,
        customerName: customerName,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Kirim client_secret kembali ke frontend
    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error.message);
    res.status(500).send({ error: error.message });
  }
}
