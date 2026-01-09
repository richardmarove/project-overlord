-- Create tables
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,
  view_count INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON public.activity_logs(action);

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger AS $$
begin
  new.updated_at = now();
  return new;
end;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
begin
  insert into public.admin_profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on auth.users (on_auth_user_created) must be created in the dashboard
-- as extensions often cannot create triggers on auth schema directly in migrations without special permissions.

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Post Policies
CREATE POLICY "Public can view published posts" ON public.posts 
  FOR SELECT USING (published = true);

CREATE POLICY "Staff can view all posts" ON public.posts 
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'viewer'))
    )
  );

CREATE POLICY "Staff can modify posts" ON public.posts 
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    )
  );

-- Profile Policies
CREATE POLICY "Users can view own profile" ON public.admin_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.admin_profiles 
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Users can update own profile" ON public.admin_profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Activity Log Policies
CREATE POLICY "Users can log activity" ON public.activity_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON public.activity_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON public.activity_logs 
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );
