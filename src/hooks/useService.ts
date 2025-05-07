import { useState } from 'react';
import supabase from '../lib/supabase';

export function useService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllServices = async ({ type = null }: { type?: string | null } = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('services')
        .select(`
          *,
          service_providers:provider_id (
            company_name, 
            description, 
            logo_url, 
            address, 
            is_verified
          ),
          service_images (*)
        `);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query
        .eq('is_available', true)
        .order('name');

      if (error) {
        throw error;
      }

      return { success: true, services: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil layanan');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getServiceById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_providers:provider_id (
            id,
            company_name,
            description,
            logo_url,
            address,
            is_verified
          ),
          service_images (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, service: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil detail layanan');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const searchServices = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_providers:provider_id (
            company_name,
            description,
            logo_url,
            address,
            is_verified
          ),
          service_images (*)
        `)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_available', true)
        .order('name');

      if (error) {
        throw error;
      }

      return { success: true, services: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mencari layanan');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getServicesByProvider = async (providerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_images (*)
        `)
        .eq('provider_id', providerId)
        .order('name');

      if (error) {
        throw error;
      }

      return { success: true, services: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil layanan penyedia');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    getAllServices,
    getServiceById,
    searchServices,
    getServicesByProvider,
    loading,
    error,
  };
}