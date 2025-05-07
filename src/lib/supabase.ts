import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Pastikan variabel lingkungan telah dikonfigurasi
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL dan Anon Key harus dikonfigurasi di .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;