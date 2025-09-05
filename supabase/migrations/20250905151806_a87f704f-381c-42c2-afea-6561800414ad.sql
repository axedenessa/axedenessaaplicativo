-- Fix profiles.role constraint and allow admins to view all profiles

-- 1) Relax/replace invalid role constraint so 'cartomante' is accepted
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_roles;

-- Recreate with the allowed set of roles
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'cartomante'));

-- 2) Make sure admins can list all profiles (UI de gerenciamento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.get_current_user_role() = 'admin');
  END IF;
END $$;