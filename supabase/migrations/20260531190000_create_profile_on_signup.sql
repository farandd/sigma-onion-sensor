/*
  # Create profile rows during auth signup

  When email confirmation is enabled, the browser is still anonymous after
  `auth.signUp`, so RLS blocks direct inserts into `profiles`. This trigger
  creates the profile row server-side from auth metadata instead.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_system_type text;
BEGIN
  requested_system_type := COALESCE(NEW.raw_user_meta_data->>'system_type', 'portable');

  INSERT INTO public.profiles (id, full_name, system_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN requested_system_type IN ('portable', 'panel') THEN requested_system_type
      ELSE 'portable'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    system_type = EXCLUDED.system_type,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO public.profiles (id, full_name, system_type)
SELECT
  users.id,
  COALESCE(users.raw_user_meta_data->>'full_name', ''),
  CASE
    WHEN users.raw_user_meta_data->>'system_type' IN ('portable', 'panel')
      THEN users.raw_user_meta_data->>'system_type'
    ELSE 'portable'
  END
FROM auth.users
LEFT JOIN public.profiles ON profiles.id = users.id
WHERE profiles.id IS NULL;
