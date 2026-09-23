import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");

        if (!serverKey) {
            throw new Error(
                "Server configuration error: Midtrans Server Key is missing.",
            );
        }

        const { amount, orderId, customerName } = await req.json();

        const midtransUrl =
            "https://app.production.midtrans.com/snap/v1/transactions";
        const encodedAuth = btoa(serverKey + ":");

        const payload = {
            transaction_details: {
                order_id: orderId || `ORD-${Date.now()}`,
                gross_amount: Math.round(amount), // Pastikan angka bulat
            },
            customer_details: {
                first_name: customerName || "Pelanggan",
            },
            item_details: [
                {
                    id: "food-item",
                    price: Math.round(amount),
                    quantity: 1,
                    name: `Pesanan #${orderId || "Makanan"}`,
                },
            ],
        };

        const midtransResponse = await fetch(midtransUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Basic ${encodedAuth}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await midtransResponse.json();

        if (!midtransResponse.ok) {
            throw new Error(
                data.message || JSON.stringify(data) ||
                    "Gagal membuat transaksi Midtrans.",
            );
        }

        return new Response(
            JSON.stringify({
                token: data.token,
                redirect_url: data.redirect_url,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error: any) {
        console.error("Error creating Midtrans transaction:", error);
        return new Response(
            JSON.stringify({
                error: error.message || "Terjadi kesalahan pada server.",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});
