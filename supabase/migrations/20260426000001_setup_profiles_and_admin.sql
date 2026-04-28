-- Migration: Setup Profiles Table and Admin Access (Fixed Recursion & Permissions)
-- Created at: 2026-04-26

-- 1. Create profiles table if it does not exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  college TEXT,
  year TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. HELPER FUNCTION: Check if user is admin (prevents recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" ON profiles 
  FOR ALL USING (public.is_admin());

-- 5. Courses Policies
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON courses;
CREATE POLICY "Published courses are viewable by everyone" ON public.courses 
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Creators can see their own courses" ON courses;
CREATE POLICY "Creators can see their own courses" ON public.courses 
  FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins can see all courses" ON courses;
CREATE POLICY "Admins can see all courses" ON public.courses 
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Creators can manage their own courses" ON courses;
CREATE POLICY "Creators can manage their own courses" ON public.courses 
  FOR ALL USING (auth.uid() = creator_id);

-- 6. Enrollments Policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
CREATE POLICY "Admins can view all enrollments" ON public.enrollments 
  FOR ALL USING (public.is_admin());

-- 7. Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, college, year)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'college',
    NEW.raw_user_meta_data->>'year'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Sync existing users (Data Migration)
INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, raw_user_meta_data->>'full_name', email, 'student' 
FROM auth.users
ON CONFLICT (id) DO NOTHING;
