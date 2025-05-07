import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import { utils, write } from "npm:xlsx@0.18.5";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { type, startDate, endDate } = await req.json();

    if (!type) {
      throw new Error("type diperlukan");
    }

    let data;
    let fileName;

    switch (type) {
      case "bookings":
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            *,
            profiles:user_id (first_name, last_name, email:id),
            services:service_id (
              name,
              price,
              service_providers:provider_id (company_name)
            )
          `)
          .gte("created_at", startDate)
          .lte("created_at", endDate)
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;

        data = bookings.map(booking => ({
          Nomor_Booking: booking.booking_number,
          Tanggal_Booking: new Date(booking.booking_date).toLocaleDateString("id-ID"),
          Pelanggan: `${booking.profiles.first_name} ${booking.profiles.last_name}`,
          Email: booking.profiles.email,
          Layanan: booking.services.name,
          Penyedia: booking.services.service_providers.company_name,
          Status: booking.status,
          Total: booking.total_price,
        }));

        fileName = `bookings_${startDate}_${endDate}.xlsx`;
        break;

      case "revenue":
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select(`
            *,
            bookings:booking_id (
              booking_number,
              services:service_id (
                name,
                service_providers:provider_id (company_name)
              )
            )
          `)
          .eq("status", "paid")
          .gte("created_at", startDate)
          .lte("created_at", endDate)
          .order("created_at", { ascending: false });

        if (paymentsError) throw paymentsError;

        data = payments.map(payment => ({
          Tanggal: new Date(payment.created_at).toLocaleDateString("id-ID"),
          Nomor_Booking: payment.bookings.booking_number,
          Layanan: payment.bookings.services.name,
          Penyedia: payment.bookings.services.service_providers.company_name,
          Jumlah: payment.amount,
          Metode_Pembayaran: payment.payment_method,
        }));

        fileName = `revenue_${startDate}_${endDate}.xlsx`;
        break;

      default:
        throw new Error("Tipe laporan tidak valid");
    }

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(data);
    utils.book_append_sheet(workbook, worksheet, "Data");
    const buffer = write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Gagal mengekspor data",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});