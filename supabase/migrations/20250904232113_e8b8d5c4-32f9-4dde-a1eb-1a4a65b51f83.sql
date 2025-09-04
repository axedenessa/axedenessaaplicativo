-- Add cartomante_id column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cartomante_id text;