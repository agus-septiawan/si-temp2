import { useState } from 'react';
import supabase from '../lib/supabase';

export function useFavorite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToFavorites = async (
    userId: string,
    { destinationId, serviceId }: { destinationId?: string; serviceId?: string }
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!destinationId && !serviceId) {
        throw new Error('Destination ID atau Service ID diperlukan');
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          destination_id: destinationId || null,
          service_id: serviceId || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, favorite: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat menambahkan ke favorit');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (
    userId: string,
    { destinationId, serviceId }: { destinationId?: string; serviceId?: string }
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!destinationId && !serviceId) {
        throw new Error('Destination ID atau Service ID diperlukan');
      }

      let query = supabase.from('favorites').delete().eq('user_id', userId);

      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat menghapus dari favorit');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getUserFavorites = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          destinations:destination_id (
            *,
            categories:category_id (*),
            destination_images (*)
          ),
          services:service_id (
            *,
            service_providers:provider_id (
              company_name,
              logo_url,
              is_verified
            ),
            service_images (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, favorites: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil favorit');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const checkIsFavorite = async (
    userId: string,
    { destinationId, serviceId }: { destinationId?: string; serviceId?: string }
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!destinationId && !serviceId) {
        throw new Error('Destination ID atau Service ID diperlukan');
      }

      let query = supabase.from('favorites').select('*').eq('user_id', userId);

      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return { success: true, isFavorite: !!data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat memeriksa favorit');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    addToFavorites,
    removeFromFavorites,
    getUserFavorites,
    checkIsFavorite,
    loading,
    error,
  };
}