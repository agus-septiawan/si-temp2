import { useState } from 'react';
import supabase from '../lib/supabase';

export function useDestination() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllDestinations = async ({ featured = false, categoryId = null }: { featured?: boolean; categoryId?: string | null } = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('destinations')
        .select(`
          *,
          categories:category_id (*),
          destination_images (*)
        `);

      if (featured) {
        query = query.eq('is_featured', true);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('name');

      if (error) {
        throw error;
      }

      return { success: true, destinations: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil destinasi');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getDestinationById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('destinations')
        .select(`
          *,
          categories:category_id (*),
          destination_images (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, destination: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil detail destinasi');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const searchDestinations = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('destinations')
        .select(`
          *,
          categories:category_id (*),
          destination_images (*)
        `)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('name');

      if (error) {
        throw error;
      }

      return { success: true, destinations: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mencari destinasi');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getAllCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return { success: true, categories: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil kategori');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    getAllDestinations,
    getDestinationById,
    searchDestinations,
    getAllCategories,
    loading,
    error,
  };
}