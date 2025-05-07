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

// CORS headers untuk mengizinkan request dari frontend application
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

    // Mengambil data dari request body
    const { bookingId } = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "booking_id diperlukan" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Mengambil informasi booking dari database
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        services:service_id (
          name,
          price,
          price_unit,
          provider_id,
          service_providers:provider_id (
            company_name
          )
        ),
        profiles:user_id (
          first_name,
          last_name,
          email:id,
          phone
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({
          error: "Booking tidak ditemukan",
          details: bookingError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Mengecek apakah sudah ada payment untuk booking ini
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status, payment_link")
      .eq("booking_id", bookingId)
      .in("status", ["pending", "paid"])
      .maybeSingle();

    // Jika sudah ada payment yang pending atau paid, kembalikan payment link yang ada
    if (existingPayment) {
      return new Response(
        JSON.stringify({
          success: true,
          payment_link: existingPayment.payment_link,
          payment_id: existingPayment.id,
          status: existingPayment.status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Buat invoice baru di Xendit
    const customerName = `${booking.profiles.first_name || ""} ${
      booking.profiles.last_name || ""
    }`.trim() || "Customer";

    const customerEmail = booking.profiles.email;
    const customerPhone = booking.profiles.phone || "";

    // Set tanggal kedaluwarsa untuk 24 jam ke depan
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);

    const invoiceParams = {
      externalID: `booking-${bookingId}-${Date.now()}`,
      amount: booking.total_price,
      payerEmail: customerEmail,
      description: `Pembayaran untuk ${booking.services.name} - Booking #${booking.booking_number}`,
      customer: {
        givenNames: customerName,
        email: customerEmail,
        mobileNumber: customerPhone,
      },
      customerNotificationPreference: {
        invoiceCreated: ["email", "whatsapp"],
        invoicePaid: ["email", "whatsapp"],
      },
      successRedirectURL: `${Deno.env.get("FRONTEND_URL")}/booking/success?booking_id=${bookingId}`,
      failureRedirectURL: `${Deno.env.get("FRONTEND_URL")}/booking/failed?booking_id=${bookingId}`,
      currency: "IDR",
      invoiceDuration: 86400, // 24 jam dalam detik
    };

    const invoice = await Invoice.createInvoice(invoiceParams);

    // Simpan data payment ke database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount: booking.total_price,
        currency: "IDR",
        status: "pending",
        xendit_invoice_id: invoice.id,
        payment_link: invoice.invoiceUrl,
        expiry_date: expiryDate.toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Terjadi kesalahan menyimpan payment:", paymentError);
      return new Response(
        JSON.stringify({
          error: "Gagal menyimpan data pembayaran",
          details: paymentError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Update status booking menjadi pending_payment
    await supabase
      .from("bookings")
      .update({ status: "pending_payment" })
      .eq("id", bookingId);

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        payment_link: invoice.invoiceUrl,
        xendit_invoice_id: invoice.id,
        expiry_date: expiryDate,
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