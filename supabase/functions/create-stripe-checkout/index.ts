import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Ambil kunci rahasia Stripe dengan aman
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (!stripeSecretKey) {
    console.error("Stripe secret key not found in environment variables.");
    return new Response(JSON.stringify({ error: "Server configuration error: Stripe secret key is missing." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Mengambil data yang sesuai dengan alur Stripe Elements
    const { amount, orderId, customerName } = await req.json();

    // Membuat PaymentIntent, sama seperti di api/create-payment-intent.js
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

    // Mengirim kembali client_secret ke frontend
    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})