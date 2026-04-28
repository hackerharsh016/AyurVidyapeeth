-- Comprehensive Profiles & Admin RLS Migration

-- 1. Create profiles table if missing
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  college text,
  year text,
  avatar_url text,
  role text default 'student',
  bio text,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on profiles;
create policy "Admins can update any profile" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 4. Courses Policies
drop policy if exists "Admins can see all courses" on courses;
create policy "Admins can see all courses" on courses for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can update any course" on courses;
create policy "Admins can update any course" on courses for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 5. Enrollments Policies
drop policy if exists "Admins can view all enrollments" on enrollments;
create policy "Admins can view all enrollments" on enrollments for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 6. Trigger for automatic profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, college, year)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'college',
    new.raw_user_meta_data->>'year'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
