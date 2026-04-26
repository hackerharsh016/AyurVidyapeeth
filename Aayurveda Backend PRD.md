**Backend PRD — Convert Your Ayurveda Frontend Prototype into Fully Functional Supabase App**

**Goal:** Keep the **same frontend UI** you already built, but replace all mock/localStorage flows with real backend functionality using **Supabase**.

This is the correct next move.

Your frontend becomes production-capable with:

* Real auth
* Real users
* Real enrollments
* Real progress tracking
* Real creator uploads
* Real admin approvals
* Real database
* Real storage
* Real roles

**1. Architecture Overview**

**Frontend (Already Built)**

* React / Vite
* Tailwind
* Router
* Zustand

**Backend (Now Add)**

* Supabase Auth
* Supabase PostgreSQL
* Supabase Storage
* Row Level Security
* Edge Functions (optional)

**2. Migration Strategy (Important)**

Do **NOT** rebuild frontend.

Only replace:

mock data → supabase tables
localStorage auth → Supabase auth
fake enrollments → DB enrollments
fake progress → DB progress
course uploads → Storage + DB
admin approvals → DB status updates

This saves weeks.

**3. Supabase Project Setup**

Create project:

ayurveda-edtech

Enable:

* Email auth
* Google auth optional
* Storage buckets
* RLS

**4. Database Schema (Production Ready)**

**profiles**

Every auth user gets profile.

create table profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full\_name text,
 email text,
 college text,
 year text,
 avatar\_url text,
 role text default 'student',
 created\_at timestamptz default now()
);

Roles:

student
creator
admin

**courses**

create table courses (
 id uuid primary key default gen\_random\_uuid(),
 creator\_id uuid references profiles(id),
 title text not null,
 subtitle text,
 description text,
 price numeric default 0,
 thumbnail\_url text,
 category text,
 level text,
 status text default 'pending',
 rating numeric default 0,
 students\_count int default 0,
 created\_at timestamptz default now()
);

Status:

draft
pending
published
rejected

**course\_sections**

create table course\_sections (
 id uuid primary key default gen\_random\_uuid(),
 course\_id uuid references courses(id) on delete cascade,
 title text,
 sort\_order int
);

**lessons**

create table lessons (
 id uuid primary key default gen\_random\_uuid(),
 section\_id uuid references course\_sections(id) on delete cascade,
 title text,
 video\_url text,
 duration int,
 is\_preview boolean default false,
 sort\_order int
);

**enrollments**

create table enrollments (
 id uuid primary key default gen\_random\_uuid(),
 user\_id uuid references profiles(id),
 course\_id uuid references courses(id),
 payment\_status text default 'paid',
 enrolled\_at timestamptz default now(),
 unique(user\_id, course\_id)
);

**progress**

create table progress (
 id uuid primary key default gen\_random\_uuid(),
 user\_id uuid references profiles(id),
 lesson\_id uuid references lessons(id),
 watched\_seconds int default 0,
 completed boolean default false,
 updated\_at timestamptz default now(),
 unique(user\_id, lesson\_id)
);

**reviews**

create table reviews (
 id uuid primary key default gen\_random\_uuid(),
 course\_id uuid references courses(id),
 user\_id uuid references profiles(id),
 rating int,
 comment text,
 created\_at timestamptz default now()
);

**directory\_entries**

create table directory\_entries (
 id uuid primary key default gen\_random\_uuid(),
 type text,
 title text,
 slug text unique,
 sanskrit\_name text,
 summary text,
 content jsonb,
 created\_at timestamptz default now()
);

**wishlists**

create table wishlists (
 id uuid primary key default gen\_random\_uuid(),
 user\_id uuid references profiles(id),
 course\_id uuid references courses(id),
 unique(user\_id, course\_id)
);

**5. Storage Buckets**

Create:

**course-thumbnails**

For images

**lecture-videos**

For videos

**profile-avatars**

For user photos

**6. Authentication Flow**

Replace fake login.

**Signup**

* email
* password
* full\_name
* college
* year

Then auto create profile row.

**Login**

Supabase signInWithPassword()

**Session persistence**

automatic.

**7. Frontend Changes Required**

**OLD:**

localStorage.setItem("user")

**NEW:**

supabase.auth.signInWithPassword()

**OLD:**

mockCourses

**NEW:**

supabase.from("courses").select("\*")

**8. Functional Modules**

**A. Courses Marketplace**

**Browse courses**

Only published:

select \* from courses where status='published'

**Course detail**

Fetch:

* course
* creator
* sections
* lessons
* reviews

**B. Enrollment**

When Buy clicked:

Prototype mode:

direct DB insert.

insert into enrollments

Later add Razorpay.

After enroll:

redirect /learning

**C. Learning Dashboard**

Show enrolled courses:

join enrollments + courses

**D. Progress Tracking**

When lesson completed:

upsert progress

Then progress bar updates live.

**E. Creator Dashboard**

Show only creator’s courses.

Upload new course:

status = pending

**F. Admin Panel**

Admins can:

* approve courses
* reject courses
* manage users
* add directory entries

**9. Row Level Security (Critical)**

**profiles**

Users can edit own profile.

**courses**

Published readable by all.

Creators manage own.

Admins manage all.

**enrollments**

Users only see own enrollments.

**progress**

Users only see own progress.

**reviews**

Authenticated insert.

**10. Example RLS Policies**

**courses read**

status='published'
OR auth.uid()=creator\_id

**own enrollments**

auth.uid() = user\_id

**11. Replace Prototype Pages with Real Data**

**Home**

Use live queries:

* featured courses
* top creators
* popular directory entries

**Directory**

Search real DB.

**Courses**

Live filtering.

**Learning**

Real enrolled data.

**Profile**

Real profile row.

**Creator**

Real stats.

**Admin**

Real moderation tools.

**12. Zustand Store Upgrade**

**authStore**

user
profile
login()
signup()
logout()

**courseStore**

courses
fetchCourses()
enroll()

**learningStore**

myCourses
progress
markComplete()

**13. SQL Seed Data**

Add:

**Courses**

* Dravyaguna Basics
* Panchakarma Masterclass
* Sharir Rachana Crash Course

**Directory**

* Pranavaha Srotas
* Rasavaha Srotas
* Vata Dosha

**14. Performance Plan**

Use:

* pagination
* indexes
* caching
* lazy image loading

Indexes:

courses(status)
courses(category)
directory\_entries(slug)
enrollments(user\_id)
progress(user\_id)

**15. Security Notes**

Must implement:

* file size limits
* video MIME checks
* admin route guards
* sanitize HTML content

**16. Build Order (Recommended)**

**Phase 1**

Auth + Profiles

**Phase 2**

Courses + Listings

**Phase 3**

Enrollments + Learning

**Phase 4**

Creator Uploads

**Phase 5**

Admin Panel

**Phase 6**

Payments