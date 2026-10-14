-- ==============================================================================
-- EduHunters Supabase Database Schema
-- Run this complete script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. ORDERS TABLE (Student Course Enrollments, Transactions & Approvals)
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - PUBLIC ACCESS FOR CLIENT APP
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

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION (Instant Real-time push to Admin Panel)
-- ==============================================================================

alter publication supabase_realtime add table public.eduhunters_orders;
alter publication supabase_realtime add table public.eduhunters_users;
alter publication supabase_realtime add table public.eduhunters_site;
