/*
  # Seed initial data
  
  1. Initial Data
    - Creates admin user
    - Adds service providers
    - Sets up initial services
*/

-- Create admin user
SELECT create_admin_user(
  'admin@jelajahsabang.com',
  'Admin123!',
  'Admin',
  'JelajahSabang',
  '08123456789'
);

-- Create service provider users
DO $$
DECLARE
  budi_id UUID;
  dewi_id UUID;
BEGIN
  -- Create Budi's account
  SELECT create_admin_user(
    'budi@example.com',
    'Provider123!',
    'Budi',
    'Santoso',
    '08234567890'
  ) INTO budi_id;

  -- Create Dewi's account
  SELECT create_admin_user(
    'dewi@example.com',
    'Provider123!',
    'Dewi',
    'Lestari',
    '08345678901'
  ) INTO dewi_id;

  -- Update their roles to service_provider
  UPDATE profiles 
  SET role = 'service_provider'
  WHERE id IN (budi_id, dewi_id);

  -- Create their service provider profiles
  INSERT INTO service_providers (profile_id, company_name, description, address, logo_url, is_verified)
  VALUES 
    (
      budi_id,
      'Sabang Diving Center',
      'Pusat diving terlengkap di Sabang dengan instruktur berpengalaman dan peralatan modern.',
      'Jl. Pantai Gapang, Iboih, Kota Sabang',
      'https://images.pexels.com/photos/3329292/pexels-photo-3329292.jpeg',
      TRUE
    ),
    (
      dewi_id,
      'Iboih Beach Resort',
      'Resort tepi pantai dengan pemandangan laut yang indah.',
      'Pantai Iboih, Kota Sabang',
      'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg',
      TRUE
    );
END $$;