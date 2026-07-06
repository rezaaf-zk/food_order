import { serve } from "std/http/server.ts";
import Stripe from "npm:stripe@14";

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Dapatkan URL situs dari environment variables. Ini harus diatur di dashboard Supabase.
  // Contoh: https://nama-proyek-anda.vercel.app
  const siteUrl = Deno.env.get('SITE_URL');

  // Ambil kunci rahasia Stripe dengan aman
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (!stripeSecretKey) {
    console.error("Stripe secret key not found in environment variables.");
    return new Response(JSON.stringify({ error: "Server configuration error: Stripe secret key is missing." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  if (!siteUrl) {
    console.error("SITE_URL not found in environment variables.");
    return new Response(JSON.stringify({ error: "Server configuration error: SITE_URL is missing." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { menuName, price, buyerName, spicinessLevel } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'idr',
            product_data: {
              name: `${menuName} (Lvl ${spicinessLevel})`,
              description: `Pembeli: ${buyerName}`,
            },
            unit_amount: price, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Jika sukses, lempar balik user ke halaman status aplikasimu
      success_url: `${siteUrl}/?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${siteUrl}/`,
    })

    return new Response(JSON.stringify({ id: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})