-- Ensure trigger to create profiles on new user signups
-- Drop existing trigger if present, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users missing a profile
INSERT INTO public.profiles (user_id, name, role)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'name', 'User') AS name,
       'admin' AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;