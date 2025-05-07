import { useState } from 'react';
import supabase from '../lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

export function useNotification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotifications = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, notifications: data };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mengambil notifikasi');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat menandai notifikasi sebagai telah dibaca');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat menandai semua notifikasi sebagai telah dibaca');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return { success: true, count };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat menghitung notifikasi yang belum dibaca');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    loading,
    error,
  };
}