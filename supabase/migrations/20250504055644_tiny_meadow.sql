/*
  # Menambahkan fitur yang belum diimplementasikan
  
  1. Fitur Baru
    - Integrasi peta untuk destinasi
    - Full-text search untuk pencarian
    - Sistem analytics
    
  2. Perubahan
    - Menambah kolom map_embed_url pada destinasi
    - Membuat index untuk pencarian
    - Membuat tabel analytics
*/

-- Menambah kolom untuk embed peta
ALTER TABLE destinations
ADD COLUMN IF NOT EXISTS map_embed_url TEXT;

-- Membuat index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_destinations_search 
ON destinations USING GIN (to_tsvector('indonesian', name || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_services_search 
ON services USING GIN (to_tsvector('indonesian', name || ' ' || description));

-- Membuat tabel analytics
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  period DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mengaktifkan Row Level Security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk analytics
CREATE POLICY "Only admins can access analytics" 
ON analytics USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Fungsi untuk mencari destinasi
CREATE OR REPLACE FUNCTION search_destinations(
  search_query TEXT,
  category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category_name TEXT,
  primary_image TEXT,
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.description,
    c.name as category_name,
    (
      SELECT image_url 
      FROM destination_images di 
      WHERE di.destination_id = d.id AND di.is_primary = true 
      LIMIT 1
    ) as primary_image,
    ts_rank(
      to_tsvector('indonesian', d.name || ' ' || d.description),
      to_tsquery('indonesian', search_query)
    ) as rank
  FROM destinations d
  LEFT JOIN categories c ON d.category_id = c.id
  WHERE 
    (category_id IS NULL OR d.category_id = category_id)
    AND (
      search_query IS NULL 
      OR to_tsvector('indonesian', d.name || ' ' || d.description) @@ 
         to_tsquery('indonesian', search_query)
    )
  ORDER BY rank DESC, d.name;
END;
$$;