import { useState } from 'react';
import supabase from '../lib/supabase';

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (bookingId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Dapatkan token autentikasi dari sesi saat ini
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Anda harus login untuk melakukan pembayaran');
      }

      // Panggil edge function untuk membuat invoice pembayaran
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat pembayaran');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat membuat pembayaran');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId?: string, bookingId?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!paymentId && !bookingId) {
        throw new Error('Payment ID atau Booking ID diperlukan');
      }

      // Dapatkan token autentikasi dari sesi saat ini
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Anda harus login untuk memeriksa status pembayaran');
      }

      // Buat parameter query
      const params = new URLSearchParams();
      if (paymentId) params.append('payment_id', paymentId);
      if (bookingId) params.append('booking_id', bookingId);

      // Panggil edge function untuk memeriksa status pembayaran
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment-status?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memeriksa status pembayaran');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat memeriksa status pembayaran');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    createPayment,
    checkPaymentStatus,
    loading,
    error,
  };
}