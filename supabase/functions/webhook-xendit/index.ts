import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

// Konfigurasi environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const xenditCallbackToken = Deno.env.get("XENDIT_CALLBACK_TOKEN") || "";

// Membuat client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    // Hanya menerima metode POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Metode tidak didukung" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405,
        }
      );
    }

    // Verifikasi callback token
    const callbackToken = req.headers.get("X-Callback-Token");
    if (callbackToken !== xenditCallbackToken) {
      console.error("Callback token tidak valid:", callbackToken);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Callback token tidak valid" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Mengambil data dari request body
    const data = await req.json();
    console.log("Xendit Webhook Payload:", JSON.stringify(data));

    // Verifikasi tipe callback
    if (data.event_type !== "invoice.paid") {
      // Untuk tipe event lain, kita hanya merekam dan mengembalikan sukses
      console.log(`Menerima event ${data.event_type} - tidak perlu tindakan`);
      return new Response(
        JSON.stringify({ success: true, message: "Event diterima" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Dapatkan data invoice dari payload
    const invoice = data.data;
    const xenditInvoiceId = invoice.id;

    // Cari payment yang terkait dengan invoice ini
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, booking_id, status")
      .eq("xendit_invoice_id", xenditInvoiceId)
      .single();

    if (paymentError || !payment) {
      console.error(
        "Payment dengan Xendit invoice ID tidak ditemukan:",
        xenditInvoiceId
      );
      return new Response(
        JSON.stringify({
          error: "Payment tidak ditemukan",
          details: paymentError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Jika payment sudah dalam status 'paid', hindari pemrosesan duplikat
    if (payment.status === "paid") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment sudah diproses sebelumnya",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update payment status dan waktu pembayaran
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        payment_method: invoice.payment_method,
        xendit_payment_id: invoice.payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error("Gagal mengupdate payment:", updatePaymentError);
      return new Response(
        JSON.stringify({
          error: "Gagal mengupdate payment",
          details: updatePaymentError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Update booking status menjadi confirmed
    const { error: updateBookingError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", payment.booking_id);

    if (updateBookingError) {
      console.error("Gagal mengupdate booking:", updateBookingError);
      return new Response(
        JSON.stringify({
          error: "Gagal mengupdate booking",
          details: updateBookingError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment berhasil diproses",
        payment_id: payment.id,
        booking_id: payment.booking_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Terjadi kesalahan memproses webhook:", error);
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