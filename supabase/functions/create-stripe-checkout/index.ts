import { serve } from "std/http/server.ts";
import Stripe from "npm:stripe@14";

const env = (globalThis as any).Deno?.env?.get('sk_test_51TkP8hP0Gl1mWU4osBid2ZpXV9N05ZMUerR7unVgpdi3IKfzwvQV7sojxH9e2QY3quhcQFuFlTTuxb7oSmSiSz1Q00ISrrC3TL')
  ?? (globalThis as any).process?.env?.STRIPE_SECRET_KEY
  ?? '';

const stripe = new Stripe(env, {
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { menuName, price, buyerName, spicinessLevel } = await req.json()

    // Membuat session checkout otomatis di platform Stripe
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
      success_url: `http://localhost:5173/?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `http://localhost:5173/`,
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