/*
  # Schema awal untuk JelajahSabang
  
  1. Tabel Baru
    - `profiles` - Informasi profil pengguna
    - `destinations` - Katalog tempat wisata
    - `categories` - Kategori tempat wisata
    - `destination_images` - Gambar-gambar tempat wisata
    - `services` - Layanan yang ditawarkan (penginapan, tur, dll)
    - `bookings` - Reservasi yang dibuat pengguna
    - `reviews` - Ulasan dari pengguna
    
  2. Keamanan
    - Aktifkan RLS pada semua tabel
    - Buat kebijakan akses untuk masing-masing tabel
*/

-- Tabel Profil Pengguna
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'service_provider', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Kategori Destinasi
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Destinasi Wisata
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category_id UUID REFERENCES categories(id),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Gambar Destinasi
CREATE TABLE IF NOT EXISTS destination_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Penyedia Layanan
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Layanan
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('accommodation', 'tour', 'transport', 'activity', 'food')),
  price DECIMAL(10, 2) NOT NULL,
  price_unit TEXT DEFAULT 'per person',
  duration TEXT,
  max_capacity INT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Gambar Layanan
CREATE TABLE IF NOT EXISTS service_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Booking
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES services(id),
  booking_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  booking_date DATE NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  quantity INT DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Pembayaran
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'IDR',
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  xendit_invoice_id TEXT,
  xendit_payment_id TEXT,
  payment_link TEXT,
  expiry_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Ulasan
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT review_target_check CHECK (
    (destination_id IS NOT NULL AND service_id IS NULL) OR
    (destination_id IS NULL AND service_id IS NOT NULL)
  )
);

-- Tabel Favorit
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT favorite_target_check CHECK (
    (destination_id IS NOT NULL AND service_id IS NULL) OR
    (destination_id IS NULL AND service_id IS NOT NULL)
  )
);

-- Mengaktifkan Row Level Security untuk semua tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk Profiles
CREATE POLICY "Profiles can be viewed by anyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Kebijakan RLS untuk Categories
CREATE POLICY "Categories can be viewed by anyone" 
ON categories FOR SELECT USING (true);

CREATE POLICY "Only admins can modify categories" 
ON categories USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Destinations
CREATE POLICY "Destinations can be viewed by anyone" 
ON destinations FOR SELECT USING (true);

CREATE POLICY "Only admins can modify destinations" 
ON destinations USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Destination Images
CREATE POLICY "Destination images can be viewed by anyone" 
ON destination_images FOR SELECT USING (true);

CREATE POLICY "Only admins can modify destination images" 
ON destination_images USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Service Providers
CREATE POLICY "Service providers can be viewed by anyone" 
ON service_providers FOR SELECT USING (true);

CREATE POLICY "Service providers can update their own profile" 
ON service_providers FOR UPDATE USING (
  profile_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can register as service providers" 
ON service_providers FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Kebijakan RLS untuk Services
CREATE POLICY "Services can be viewed by anyone" 
ON services FOR SELECT USING (true);

CREATE POLICY "Service providers can manage their own services" 
ON services USING (
  EXISTS (
    SELECT 1 FROM service_providers
    WHERE service_providers.id = provider_id AND service_providers.profile_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Service Images
CREATE POLICY "Service images can be viewed by anyone" 
ON service_images FOR SELECT USING (true);

CREATE POLICY "Service providers can manage their own service images" 
ON service_images USING (
  EXISTS (
    SELECT 1 FROM services
    JOIN service_providers ON services.provider_id = service_providers.id
    WHERE services.id = service_images.service_id AND service_providers.profile_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Bookings
CREATE POLICY "Users can view their own bookings" 
ON bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service providers can view bookings for their services" 
ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM services
    JOIN service_providers ON services.provider_id = service_providers.id
    WHERE services.id = service_id AND service_providers.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all bookings" 
ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can create their own bookings" 
ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Kebijakan RLS untuk Payments
CREATE POLICY "Users can view their own payments" 
ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Service providers can view payments for their services" 
ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    JOIN services ON bookings.service_id = services.id
    JOIN service_providers ON services.provider_id = service_providers.id
    WHERE bookings.id = booking_id AND service_providers.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all payments" 
ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "System can create and update payments" 
ON payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Reviews
CREATE POLICY "Reviews can be viewed by anyone" 
ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" 
ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" 
ON reviews USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kebijakan RLS untuk Favorites
CREATE POLICY "Users can view their own favorites" 
ON favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" 
ON favorites USING (auth.uid() = user_id);

-- Menambahkan data awal untuk kategori
INSERT INTO categories (name, description, icon) VALUES
('Pantai', 'Destinasi pantai indah di Pulau Weh', 'beach'),
('Menyelam', 'Lokasi diving terbaik dengan keindahan bawah laut', 'diving'),
('Sejarah', 'Tempat-tempat bersejarah di Sabang', 'landmark'),
('Kuliner', 'Wisata kuliner dan makanan khas Sabang', 'utensils'),
('Penginapan', 'Akomodasi dan tempat menginap', 'bed'),
('Aktivitas', 'Berbagai aktivitas menarik di Sabang', 'activity');