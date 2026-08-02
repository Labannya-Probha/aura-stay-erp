ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name text;

COMMENT ON COLUMN public.app_users.created_by IS 'Staff creator user id for tenant account provisioning history.';
COMMENT ON COLUMN public.app_users.created_by_name IS 'Display name captured when the staff account was created.';
