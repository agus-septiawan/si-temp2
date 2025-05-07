import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@3.2.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { bookingId, type } = await req.json();

    if (!bookingId || !type) {
      throw new Error("booking_id dan type diperlukan");
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email:id
        ),
        services:service_id (
          name,
          service_providers:provider_id (
            company_name
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking tidak ditemukan");
    }

    const customerName = `${booking.profiles.first_name || ""} ${
      booking.profiles.last_name || ""
    }`.trim();
    const customerEmail = booking.profiles.email;

    let subject = "";
    let content = "";

    switch (type) {
      case "booking_confirmed":
        subject = "Booking Anda Telah Dikonfirmasi";
        content = `
          <h2>Booking Dikonfirmasi</h2>
          <p>Hai ${customerName},</p>
          <p>Booking Anda untuk ${booking.services.name} telah dikonfirmasi.</p>
          <p>Detail booking:</p>
          <ul>
            <li>Nomor Booking: ${booking.booking_number}</li>
            <li>Tanggal: ${new Date(booking.start_date).toLocaleDateString("id-ID")}</li>
            <li>Penyedia Layanan: ${booking.services.service_providers.company_name}</li>
          </ul>
        `;
        break;

      case "payment_received":
        subject = "Pembayaran Anda Telah Diterima";
        content = `
          <h2>Pembayaran Berhasil</h2>
          <p>Hai ${customerName},</p>
          <p>Pembayaran Anda untuk booking ${booking.booking_number} telah kami terima.</p>
          <p>Terima kasih telah memilih JelajahSabang!</p>
        `;
        break;

      default:
        throw new Error("Tipe notifikasi tidak valid");
    }

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: "JelajahSabang <noreply@jelajahsabang.com>",
      to: customerEmail,
      subject: subject,
      html: content,
    });

    if (emailError) {
      throw emailError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifikasi berhasil dikirim",
        email: emailResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Gagal mengirim notifikasi",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});