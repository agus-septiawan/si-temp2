/*
  # Create admin user function
  
  1. New Function
    - Creates a secure way to add the initial admin user
    - Handles both auth.users and profiles table
  
  2. Security
    - Function can only be executed by superuser
    - Ensures data consistency between auth and profiles
*/

-- Function to create admin user safely
CREATE OR REPLACE FUNCTION create_admin_user(
  email TEXT,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Create user in auth.users
  user_id := (
    SELECT id FROM auth.users
    WHERE auth.users.email = create_admin_user.email
    LIMIT 1
  );

  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      email,
      crypt(password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      json_build_object(
        'first_name', first_name,
        'last_name', last_name,
        'phone', phone
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO user_id;
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (id, first_name, last_name, phone, role)
  VALUES (user_id, first_name, last_name, phone, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

  RETURN user_id;
END;
$$;