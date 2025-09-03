-- Add role support for user differentiation between admin and employees
-- This allows employees like Alana to have limited access to their own data

-- Add a queue_position column to games table for manual queue reordering
ALTER TABLE public.games 
ADD COLUMN queue_position INTEGER;

-- Create an index for better performance on queue ordering
CREATE INDEX idx_games_queue_position ON public.games(queue_position) WHERE status = 'na_fila';

-- Update the existing games to have queue positions based on payment time
-- Using a more complex approach to avoid window functions in UPDATE
DO $$
DECLARE
    game_record RECORD;
    position_counter INTEGER;
BEGIN
    -- Process each cartomante separately
    FOR game_record IN 
        SELECT DISTINCT cartomante FROM public.games WHERE status = 'na_fila'
    LOOP
        position_counter := 1;
        
        -- Update queue positions for this cartomante
        FOR game_record IN 
            SELECT id FROM public.games 
            WHERE status = 'na_fila' AND cartomante = game_record.cartomante
            ORDER BY game_date, payment_time
        LOOP
            UPDATE public.games 
            SET queue_position = position_counter 
            WHERE id = game_record.id;
            
            position_counter := position_counter + 1;
        END LOOP;
    END LOOP;
END $$;

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
-- Add constraint to ensure only valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'employee'));