-- Create edge function for Facebook API integration and update RLS policies for authenticated users

-- First, create a function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update RLS policies to allow authenticated users to read and write data
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can view campaigns" ON public.campaigns
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage campaigns" ON public.campaigns
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Update clients policies
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;

CREATE POLICY "Authenticated users can view clients" ON public.clients
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage clients" ON public.clients
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Update games policies
DROP POLICY IF EXISTS "Authenticated users can view games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can insert games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;

CREATE POLICY "Authenticated users can view games" ON public.games
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert games" ON public.games
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update games" ON public.games
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete games" ON public.games
FOR DELETE TO authenticated
USING (true);