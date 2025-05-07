import { useState } from 'react';
import supabase from '../lib/supabase';

interface ReviewFormData {
  destinationId?: string;
  serviceId?: string;
  bookingId?: string;
  rating: number;
  comment?: string;
}

export function useReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReview = async (userId: string, formData: ReviewFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.destinationId && !formData.serviceId) {
        throw new Error('Destination ID atau Service ID diperlukan');
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          destination_id: formData.destinationId || null,
          service_id: formData.serviceId || null,
          booking_id: formData.bookingId || null,
          rating: formData.rating,
          comment: formData.comment || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, review: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat menambahkan ulasan');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getDestinationReviews = async (destinationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('destination_id', destinationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, reviews: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil ulasan');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getServiceReviews = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, reviews: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil ulasan');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getUserReviews = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          destinations:destination_id (*),
          services:service_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, reviews: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil ulasan pengguna');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    addReview,
    getDestinationReviews,
    getServiceReviews,
    getUserReviews,
    loading,
    error,
  };
}