import { useState } from 'react';
import supabase from '../lib/supabase';
import { format } from 'date-fns';

interface BookingFormData {
  serviceId: string;
  startDate: Date;
  endDate?: Date;
  quantity: number;
  specialRequests?: string;
}

export function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (userId: string, formData: BookingFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Dapatkan detail layanan untuk menghitung total harga
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', formData.serviceId)
        .single();

      if (serviceError) {
        throw new Error('Layanan tidak ditemukan');
      }

      // Hitung total harga berdasarkan jumlah dan durasi jika perlu
      const totalPrice = service.price * formData.quantity;

      // Membuat nomor booking unik
      const bookingNumber = `JLS-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Tanggal booking adalah hari ini
      const bookingDate = format(new Date(), 'yyyy-MM-dd');

      // Membuat entri booking baru
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          service_id: formData.serviceId,
          booking_number: bookingNumber,
          status: 'pending',
          booking_date: bookingDate,
          start_date: formData.startDate.toISOString(),
          end_date: formData.endDate ? formData.endDate.toISOString() : null,
          quantity: formData.quantity,
          total_price: totalPrice,
          special_requests: formData.specialRequests || null,
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      return { success: true, booking };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat membuat booking');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getUserBookings = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            name, 
            description, 
            type, 
            price,
            price_unit,
            service_providers:provider_id (
              company_name
            )
          ),
          payments (
            id,
            status,
            payment_link,
            paid_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, bookings: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil data booking');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getBookingById = async (bookingId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            name, 
            description, 
            type, 
            price,
            price_unit,
            duration,
            service_providers:provider_id (
              company_name,
              address,
              logo_url
            )
          ),
          payments (
            id,
            status,
            amount,
            payment_link,
            payment_method,
            paid_at
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, booking: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil detail booking');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Perbarui status booking menjadi 'cancelled'
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat membatalkan booking');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    loading,
    error,
  };
}