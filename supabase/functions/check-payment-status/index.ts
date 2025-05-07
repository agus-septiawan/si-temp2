import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import { Xendit } from "npm:xendit-node@4.0.0";

// Konfigurasi environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const xenditApiKey = Deno.env.get("XENDIT_API_KEY") || "";

// Membuat client Supabase dan Xendit
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const xendit = new Xendit({ secretKey: xenditApiKey });
const Invoice = xendit.Invoice;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Hanya menerima metode GET
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Metode tidak didukung" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405,
        }
      );
    }

    // Verifikasi authorization token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Tidak ada token otorisasi" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Dapatkan parameter payment_id atau booking_id dari URL
    const url = new URL(req.url);
    const paymentId = url.searchParams.get("payment_id");
    const bookingId = url.searchParams.get("booking_id");

    if (!paymentId && !bookingId) {
      return new Response(
        JSON.stringify({ error: "payment_id atau booking_id diperlukan" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Query pembayaran dari database
    let query = supabase.from("payments").select(`
      id,
      status,
      amount,
      currency,
      payment_method,
      xendit_invoice_id,
      payment_link,
      expiry_date,
      paid_at,
      created_at,
      bookings:booking_id (
        id,
        booking_number,
        status,
        start_date,
        end_date,
        quantity,
        total_price,
        services:service_id (
          name,
          description,
          type,
          price,
          price_unit
        )
      )
    `);

    if (paymentId) {
      query = query.eq("id", paymentId);
    } else {
      query = query.eq("booking_id", bookingId);
    }

    const { data: payment, error: paymentError } = await query.maybeSingle();

    if (paymentError) {
      return new Response(
        JSON.stringify({
          error: "Terjadi kesalahan saat mengambil data pembayaran",
          details: paymentError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!payment) {
      return new Response(
        JSON.stringify({ error: "Pembayaran tidak ditemukan" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Jika pembayaran masih dalam status pending, periksa status di Xendit
    if (payment.status === "pending" && payment.xendit_invoice_id) {
      try {
        const xenditInvoice = await Invoice.getInvoice({
          invoiceID: payment.xendit_invoice_id,
        });

        // Jika status di Xendit berbeda dengan status di database, update database
        if (
          xenditInvoice.status === "PAID" &&
          payment.status !== "paid"
        ) {
          // Update payment status dan waktu pembayaran
          await supabase
            .from("payments")
            .update({
              status: "paid",
              payment_method: xenditInvoice.payment_method,
              xendit_payment_id: xenditInvoice.payment_id,
              paid_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          // Update booking status menjadi confirmed
          await supabase
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", payment.bookings.id);

          // Update payment objek untuk respon
          payment.status = "paid";
          payment.payment_method = xenditInvoice.payment_method;
          payment.paid_at = new Date().toISOString();
          payment.bookings.status = "confirmed";
        } else if (
          xenditInvoice.status === "EXPIRED" &&
          payment.status !== "failed"
        ) {
          // Update payment status
          await supabase
            .from("payments")
            .update({
              status: "failed",
            })
            .eq("id", payment.id);

          // Update payment objek untuk respon
          payment.status = "failed";
        }
      } catch (xenditError) {
        console.error("Error mengambil invoice dari Xendit:", xenditError);
        // Lanjutkan dengan data dari database jika ada error dari Xendit
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.payment_method,
          payment_link: payment.payment_link,
          expiry_date: payment.expiry_date,
          paid_at: payment.paid_at,
          created_at: payment.created_at,
          booking: payment.bookings,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    return new Response(
      JSON.stringify({
        error: "Terjadi kesalahan pada server",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});