-- Fix security linter issues

-- Fix the function search path mutable issue
ALTER FUNCTION public.set_queue_position() SET search_path = public;
ALTER FUNCTION public.update_client_stats() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;