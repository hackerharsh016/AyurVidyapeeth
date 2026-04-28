-- Migration: Fix RLS Recursion and Restore Permissions
-- Created at: 2026-04-26

-- 1. HELPER FUNCTION: Check if user is admin (prevents recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" ON profiles 
  FOR ALL USING (public.is_admin());

-- 3. Courses Policies
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

-- 4. Enrollments Policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
CREATE POLICY "Admins can view all enrollments" ON public.enrollments 
  FOR ALL USING (public.is_admin());
