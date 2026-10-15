-- ==============================================================================
-- EduHunters Supabase Database Schema (Idempotent & Production-Ready)
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/prblcytpdlfgvransoqr/sql/new
-- ==============================================================================

-- 1. ORDERS TABLE (Course Enrollments, Transactions & Approvals)
create table if not exists public.eduhunters_orders (
  id text primary key,
  invoice_number text,
  customer_name text,
  customer_phone text,
  customer_email text,
  course_name text,
  course_slug text,
  amount numeric default 0,
  payment_method text default 'bKash',
  trx_id text,
  status text default 'PENDING',
  is_approved boolean default false,
  raw_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. USERS TABLE (Student Profiles & Enrolled Courses)
create table if not exists public.eduhunters_users (
  id text primary key,
  email text,
  name text,
  phone text,
  role text default 'student',
  enrolled_courses jsonb default '[]'::jsonb,
  raw_data jsonb,
  last_active_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 3. SITE DATA TABLE (Hero Slider, Courses, Settings)
create table if not exists public.eduhunters_site (
  id text primary key,
  data jsonb,
  updated_at timestamptz default now()
);

-- 4. QUIZ SUBMISSIONS TABLE (Class Quizzes, Attempts, Time Tracking & Leaderboards)
create table if not exists public.eduhunters_quiz_submissions (
  id text primary key,
  student_id text,
  student_name text,
  student_phone text,
  student_email text,
  course_id text,
  course_slug text,
  course_name text,
  lesson_id text,
  lesson_title text,
  quiz_id text,
  score numeric default 0,
  total_marks numeric default 0,
  percentage numeric default 0,
  correct_count integer default 0,
  wrong_count integer default 0,
  skipped_count integer default 0,
  time_taken_seconds integer default 0,
  is_first_attempt boolean default true,
  is_live_window boolean default true,
  attempt_number integer default 1,
  raw_answers jsonb default '[]'::jsonb,
  submitted_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - PERMISSIVE PUBLIC POLICIES FOR WEB CLIENT
-- ==============================================================================

alter table public.eduhunters_orders enable row level security;
drop policy if exists "Allow public access to eduhunters_orders" on public.eduhunters_orders;
create policy "Allow public access to eduhunters_orders" 
  on public.eduhunters_orders for all using (true) with check (true);

alter table public.eduhunters_users enable row level security;
drop policy if exists "Allow public access to eduhunters_users" on public.eduhunters_users;
create policy "Allow public access to eduhunters_users" 
  on public.eduhunters_users for all using (true) with check (true);

alter table public.eduhunters_site enable row level security;
drop policy if exists "Allow public access to eduhunters_site" on public.eduhunters_site;
create policy "Allow public access to eduhunters_site" 
  on public.eduhunters_site for all using (true) with check (true);

alter table public.eduhunters_quiz_submissions enable row level security;
drop policy if exists "Allow public access to eduhunters_quiz_submissions" on public.eduhunters_quiz_submissions;
create policy "Allow public access to eduhunters_quiz_submissions" 
  on public.eduhunters_quiz_submissions for all using (true) with check (true);

-- ==============================================================================
-- REPLICA IDENTITY (Required for Supabase Realtime UPDATE/DELETE payloads)
-- Fixes "table does not have replica identity full" warnings/errors in Realtime
-- ==============================================================================

alter table public.eduhunters_orders replica identity full;
alter table public.eduhunters_users replica identity full;
alter table public.eduhunters_site replica identity full;
alter table public.eduhunters_quiz_submissions replica identity full;

-- ==============================================================================
-- SAFE IDEMPOTENT SUPABASE REALTIME PUBLICATION
-- Only adds tables if not already in the publication (prevents abort errors)
-- ==============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'eduhunters_orders'
  ) then
    alter publication supabase_realtime add table public.eduhunters_orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'eduhunters_users'
  ) then
    alter publication supabase_realtime add table public.eduhunters_users;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'eduhunters_site'
  ) then
    alter publication supabase_realtime add table public.eduhunters_site;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'eduhunters_quiz_submissions'
  ) then
    alter publication supabase_realtime add table public.eduhunters_quiz_submissions;
  end if;
end $$;
