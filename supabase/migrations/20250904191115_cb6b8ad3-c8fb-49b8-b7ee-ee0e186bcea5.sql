-- Fix the role comparison by casting enum to text
DROP POLICY IF EXISTS "Cartomante users can view their games" ON public.games;
CREATE POLICY "Cartomante users can view their games"
ON public.games
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role::text = 'admin'
  ) OR
  (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role::text = 'cartomante'
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
    SELECT user_id FROM public.profiles WHERE role::text = 'admin'
  ) OR
  (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role::text = 'cartomante'
    ) AND
    cartomante = (
      SELECT cartomante_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role::text = 'admin'
  ) OR
  (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role::text = 'cartomante'
    ) AND
    cartomante = (
      SELECT cartomante_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);