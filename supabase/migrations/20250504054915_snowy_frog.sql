/*
  # Menambahkan tabel untuk cache dan notifikasi
  
  1. Tabel Baru
    - `cache` - Menyimpan data cache
    - `notifications` - Menyimpan riwayat notifikasi
    
  2. Keamanan
    - Aktifkan RLS pada semua tabel baru
    - Buat kebijakan akses untuk masing-masing tabel
*/

-- Tabel Cache
CREATE TABLE IF NOT EXISTS cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Notifikasi
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_cache_key ON cache (key);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);

-- Mengaktifkan Row Level Security
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk Cache
CREATE POLICY "Cache can be accessed by system only" 
ON cache USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Notifications
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON notifications FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Fungsi untuk membersihkan cache yang kadaluarsa
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM cache WHERE expires_at < NOW();
END;
$$;

-- Trigger untuk membersihkan cache secara otomatis
CREATE OR REPLACE FUNCTION trigger_clean_expired_cache()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM clean_expired_cache();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clean_cache_trigger
  AFTER INSERT ON cache
  EXECUTE FUNCTION trigger_clean_expired_cache();

-- Fungsi untuk mengirim notifikasi
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;