-- Create user management functions and tables for employee access

-- Create role enum if not exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'cartomante');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'admin'::public.user_role;

-- Add cartomante_id to profiles for linking cartomante users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cartomante_id text;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Update RLS policies for games table to allow cartomante access
DROP POLICY IF EXISTS "Cartomante users can view their games" ON public.games;
CREATE POLICY "Cartomante users can view their games"
ON public.games
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'::public.user_role
  ) OR
  (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'cartomante'::public.user_role
    ) AND
    cartomante = (
      SELECT cartomante_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Update update policy for games
DROP POLICY IF EXISTS "Cartomante users can update their games" ON public.games;
CREATE POLICY "Cartomante users can update their games"
ON public.games
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'::public.user_role
  ) OR
  (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'cartomante'::public.user_role
    ) AND
    cartomante = (
      SELECT cartomante_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'::public.user_role
  ) OR
  (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'cartomante'::public.user_role
    ) AND
    cartomante = (
      SELECT cartomante_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Ensure admin users can manage everything
UPDATE public.games SET updated_at = now() WHERE updated_at IS NOT NULL;