-- Aayurveda EdTech Production Schema Snapshot

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  college text,
  year text,
  avatar_url text,
  role text default 'student',
  created_at timestamptz default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id),
  title text not null,
  subtitle text,
  description text,
  price numeric default 0,
  thumbnail_url text,
  category text,
  level text,
  status text default 'pending',
  rating numeric default 0,
  students_count int default 0,
  created_at timestamptz default now()
);

create table course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text,
  sort_order int
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references course_sections(id) on delete cascade,
  title text,
  video_url text,
  duration int,
  is_preview boolean default false,
  sort_order int
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  course_id uuid references courses(id),
  payment_status text default 'paid',
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  lesson_id uuid references lessons(id),
  watched_seconds int default 0,
  completed boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  user_id uuid references profiles(id),
  rating int,
  comment text,
  created_at timestamptz default now()
);

create table directory_entries (
  id uuid primary key default gen_random_uuid(),
  type text,
  title text,
  slug text unique,
  sanskrit_name text,
  summary text,
  content jsonb,
  created_at timestamptz default now()
);

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  course_id uuid references courses(id),
  unique(user_id, course_id)
);

-- RLS setup
alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_sections enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table progress enable row level security;
alter table reviews enable row level security;
alter table directory_entries enable row level security;
alter table wishlists enable row level security;

-- Add initial policies for RLS
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Published courses are viewable by everyone" on courses for select using (status = 'published');
create policy "Creators can see their own courses" on courses for select using (auth.uid() = creator_id);
create policy "Creators can insert/update their own courses" on courses for insert with check (auth.uid() = creator_id);
create policy "Creators can update their own courses" on courses for update using (auth.uid() = creator_id);

create policy "Sections of viewable courses are viewable" on course_sections for select using (
  exists (select 1 from courses where courses.id = course_sections.course_id and (status = 'published' or creator_id = auth.uid()))
);

create policy "Lessons of viewable sections are viewable" on lessons for select using (
  exists (
    select 1 from course_sections
    join courses on courses.id = course_sections.course_id
    where course_sections.id = lessons.section_id and (courses.status = 'published' or courses.creator_id = auth.uid())
  )
);

create policy "Directory is viewable by everyone" on directory_entries for select using (true);

create policy "Users can view own enrollments" on enrollments for select using (auth.uid() = user_id);
create policy "Users can enroll themselves" on enrollments for insert with check (auth.uid() = user_id);

create policy "Users can view own progress" on progress for select using (auth.uid() = user_id);
create policy "Users can insert/update own progress" on progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on progress for update using (auth.uid() = user_id);

create policy "Users can manage own wishlists" on wishlists for all using (auth.uid() = user_id);

create policy "Reviews viewable by everyone" on reviews for select using (true);
create policy "Users manage own reviews" on reviews for all using (auth.uid() = user_id);

-- trigger for profile creation
create function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function update_updated_at_column()
returns trigger as $$
begin
    NEW.updated_at = now();
    RETURN NEW;
end;
$$ language 'plpgsql';

create trigger update_progress_updated_at before update on progress for each row execute procedure update_updated_at_column();
