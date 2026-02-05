-- ============================================================
-- ChairTime Database Schema
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users — the user IS the business)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  email text not null default '',
  phone text default '',
  address text default '',
  city text default '',
  slug text unique,
  description text default '',
  currency text not null default 'EUR',
  timezone text not null default 'Europe/Dublin',
  booking_notice integer not null default 24, -- hours in advance
  cancellation_policy text default 'Free cancellation up to 24 hours before your appointment.',
  logo_url text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Business owner can CRUD their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Public: anyone can SELECT profiles by slug (for public booking page)
create policy "Public can view profiles by slug"
  on public.profiles for select
  using (slug is not null);

-- ============================================================
-- STAFF
-- ============================================================
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text default '',
  phone text default '',
  role text not null default 'stylist' check (role in ('owner', 'stylist', 'assistant')),
  avatar text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "Business owner can manage staff"
  on public.staff for all
  using (auth.uid() = business_id);

-- Public: anyone can view active staff (for public booking page)
create policy "Public can view active staff"
  on public.staff for select
  using (is_active = true);

-- ============================================================
-- SERVICE CATEGORIES
-- ============================================================
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_categories enable row level security;

create policy "Business owner can manage categories"
  on public.service_categories for all
  using (auth.uid() = business_id);

-- Public: anyone can view categories (for public booking page)
create policy "Public can view service categories"
  on public.service_categories for select
  using (true);

-- ============================================================
-- SERVICES
-- ============================================================
create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  duration integer not null default 30, -- minutes
  price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "Business owner can manage services"
  on public.services for all
  using (auth.uid() = business_id);

-- Public: anyone can view active services (for public booking page)
create policy "Public can view active services"
  on public.services for select
  using (is_active = true);

-- ============================================================
-- CLIENTS
-- ============================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text default '',
  phone text default '',
  notes text,
  tags text[] default '{}',
  loyalty_points integer not null default 0,
  total_visits integer not null default 0,
  total_spent numeric(10, 2) not null default 0,
  last_visit date,
  preferred_staff_id uuid references public.staff(id) on delete set null,
  no_show_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Business owner can manage clients"
  on public.clients for all
  using (auth.uid() = business_id);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  price numeric(10, 2) not null default 0,
  notes text,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Business owner can manage bookings"
  on public.bookings for all
  using (auth.uid() = business_id);

-- Public: anyone can INSERT bookings (for public booking page)
create policy "Public can create bookings"
  on public.bookings for insert
  with check (true);

-- ============================================================
-- BOOKING SETTINGS
-- ============================================================
create table public.booking_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references auth.users(id) on delete cascade,
  advance_booking_days integer not null default 30,
  slot_interval integer not null default 30, -- minutes
  auto_confirm boolean not null default false,
  require_deposit boolean not null default false,
  deposit_amount numeric(10, 2) not null default 0,
  cancellation_hours integer not null default 24,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_settings enable row level security;

create policy "Business owner can manage booking settings"
  on public.booking_settings for all
  using (auth.uid() = business_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null default '',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Business owner can manage activities"
  on public.activities for all
  using (auth.uid() = business_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.staff
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.service_categories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.services
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.bookings
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.booking_settings
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.activities
  for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, business_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'business_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_profiles_slug on public.profiles(slug);
create index idx_staff_business on public.staff(business_id);
create index idx_service_categories_business on public.service_categories(business_id);
create index idx_services_business on public.services(business_id);
create index idx_services_category on public.services(category_id);
create index idx_clients_business on public.clients(business_id);
create index idx_clients_email on public.clients(business_id, email);
create index idx_bookings_business on public.bookings(business_id);
create index idx_bookings_date on public.bookings(business_id, date);
create index idx_bookings_client on public.bookings(client_id);
create index idx_bookings_status on public.bookings(business_id, status);
create index idx_activities_business on public.activities(business_id);
