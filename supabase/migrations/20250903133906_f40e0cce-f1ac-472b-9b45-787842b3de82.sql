-- Add role support for user differentiation between admin and employees
-- This allows employees like Alana to have limited access to their own data

-- Add a queue_position column to games table for manual queue reordering
ALTER TABLE public.games 
ADD COLUMN queue_position INTEGER;

-- Create an index for better performance on queue ordering
CREATE INDEX idx_games_queue_position ON public.games(queue_position) WHERE status = 'na_fila';

-- Update the existing games to have queue positions based on payment time
UPDATE public.games 
SET queue_position = ROW_NUMBER() OVER (
  PARTITION BY cartomante 
  ORDER BY game_date, payment_time
) 
WHERE status = 'na_fila';

-- Add a function to automatically set queue position for new games
CREATE OR REPLACE FUNCTION public.set_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set queue position for games in queue
  IF NEW.status = 'na_fila' THEN
    NEW.queue_position = COALESCE(
      (SELECT MAX(queue_position) + 1 
       FROM public.games 
       WHERE cartomante = NEW.cartomante 
       AND status = 'na_fila'), 
      1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set queue position on insert
DROP TRIGGER IF EXISTS set_queue_position_trigger ON public.games;
CREATE TRIGGER set_queue_position_trigger
  BEFORE INSERT ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.set_queue_position();

-- Update profiles table to allow different roles (admin vs employee)
-- Admin role should already exist, so we're just updating the default
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'admin';

-- Add constraint to ensure only valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'employee'));