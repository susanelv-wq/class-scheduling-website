-- Run this in Supabase SQL Editor
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('STUDENT', 'TEACHER', 'ADMIN');
  end if;
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type booking_status as enum ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
  end if;
  if not exists (select 1 from pg_type where typname = 'class_status') then
    create type class_status as enum ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  password text,
  name text not null,
  phone text,
  role user_role not null default 'STUDENT',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text,
  "startTime" text not null,
  "endTime" text not null,
  date date not null,
  room text,
  location text,
  capacity integer not null default 20,
  price double precision not null default 0.0,
  status class_status not null default 'SCHEDULED',
  "teacherId" uuid not null references public.users(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  status booking_status not null default 'PENDING',
  "bookingDate" timestamptz not null default now(),
  "expiresAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "studentId" uuid not null references public.users(id) on delete cascade,
  "classId" uuid not null references public.classes(id) on delete cascade,
  unique ("studentId", "classId")
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  amount double precision not null,
  status payment_status not null default 'PENDING',
  "paymentMethod" text,
  "transactionId" text,
  "paidAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "userId" uuid not null references public.users(id) on delete cascade,
  "bookingId" uuid not null unique references public.bookings(id) on delete cascade
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;

-- Global app settings (single-row table)
create table if not exists public.app_settings (
  id integer primary key default 1,
  "orgName" text not null default 'Indonesian Language Course',
  timezone text not null default 'Asia/Jakarta',
  locale text not null default 'id-ID',
  "currencyCode" text not null default 'IDR',
  "defaultStartHour" integer not null default 8,
  "defaultEndHour" integer not null default 19,
  "defaultClassDurationMinutes" integer not null default 60,
  "defaultCapacity" integer not null default 20,
  "defaultPrice" double precision not null default 0.0,
  "allowStudentBooking" boolean not null default true,
  "bookingWindowDays" integer not null default 60,
  "paymentWindowMinutes" integer not null default 120,
  "cancellationWindowMinutes" integer not null default 0,
  "requirePhone" boolean not null default false,
  "supportEmail" text,
  "supportWhatsApp" text,
  "termsUrl" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1),
  constraint app_settings_hours check ("defaultStartHour" >= 0 and "defaultStartHour" <= 23 and "defaultEndHour" >= 0 and "defaultEndHour" <= 23 and "defaultEndHour" > "defaultStartHour"),
  constraint app_settings_payment_window check ("paymentWindowMinutes" >= 0 and "paymentWindowMinutes" <= 1440),
  constraint app_settings_booking_window check ("bookingWindowDays" >= 1 and "bookingWindowDays" <= 365),
  constraint app_settings_cancellation_window check ("cancellationWindowMinutes" >= 0 and "cancellationWindowMinutes" <= 10080),
  constraint app_settings_defaults check (
    "defaultClassDurationMinutes" >= 15 and "defaultClassDurationMinutes" <= 360
    and "defaultCapacity" >= 1 and "defaultCapacity" <= 200
    and "defaultPrice" >= 0
  )
);

insert into public.app_settings (id)
values (1)
on conflict (id) do nothing;

-- Idempotent upgrades for older installs (safe to run multiple times)
alter table public.app_settings add column if not exists locale text not null default 'id-ID';
alter table public.app_settings add column if not exists "currencyCode" text not null default 'IDR';
alter table public.app_settings add column if not exists "defaultClassDurationMinutes" integer not null default 60;
alter table public.app_settings add column if not exists "defaultCapacity" integer not null default 20;
alter table public.app_settings add column if not exists "defaultPrice" double precision not null default 0.0;
alter table public.app_settings add column if not exists "allowStudentBooking" boolean not null default true;
alter table public.app_settings add column if not exists "bookingWindowDays" integer not null default 60;
alter table public.app_settings add column if not exists "cancellationWindowMinutes" integer not null default 0;
alter table public.app_settings add column if not exists "requirePhone" boolean not null default false;
alter table public.app_settings add column if not exists "supportEmail" text;
alter table public.app_settings add column if not exists "supportWhatsApp" text;
alter table public.app_settings add column if not exists "termsUrl" text;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

create or replace function public.has_role(_user_id uuid, _role user_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = _user_id and u.role = _role
  );
$$;

revoke all on function public.has_role(uuid, user_role) from public;
grant execute on function public.has_role(uuid, user_role) to authenticated;

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile" on public.users
for select using (auth.uid() = id or public.has_role(auth.uid(), 'ADMIN'));

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users
for update using (auth.uid() = id or public.has_role(auth.uid(), 'ADMIN'));

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile" on public.users
for insert with check (auth.uid() = id);

drop policy if exists "any authenticated can read classes" on public.classes;
create policy "any authenticated can read classes" on public.classes
for select using (auth.uid() is not null);

drop policy if exists "teachers and admins can create classes" on public.classes;
create policy "teachers and admins can create classes" on public.classes
for insert with check (
  public.has_role(auth.uid(), 'TEACHER')
  or public.has_role(auth.uid(), 'ADMIN')
);

drop policy if exists "teachers can update own classes admins all" on public.classes;
create policy "teachers can update own classes admins all" on public.classes
for update using (
  public.has_role(auth.uid(), 'ADMIN')
  or ("teacherId" = auth.uid() and public.has_role(auth.uid(), 'TEACHER'))
);

drop policy if exists "teachers can delete own classes admins all" on public.classes;
create policy "teachers can delete own classes admins all" on public.classes
for delete using (
  public.has_role(auth.uid(), 'ADMIN')
  or ("teacherId" = auth.uid() and public.has_role(auth.uid(), 'TEACHER'))
);

drop policy if exists "bookings visible by owner teacher admin" on public.bookings;
create policy "bookings visible by owner teacher admin" on public.bookings
for select using (
  auth.uid() = "studentId"
  or exists (
    select 1
    from public.classes c
    where c.id = "classId" and c."teacherId" = auth.uid()
  )
  or public.has_role(auth.uid(), 'ADMIN')
);

drop policy if exists "students create own bookings" on public.bookings;
create policy "students create own bookings" on public.bookings
for insert with check (
  auth.uid() = "studentId"
  and public.has_role(auth.uid(), 'STUDENT')
);

drop policy if exists "booking owner teacher admin can update" on public.bookings;
create policy "booking owner teacher admin can update" on public.bookings
for update using (
  auth.uid() = "studentId"
  or exists (
    select 1
    from public.classes c
    where c.id = "classId" and c."teacherId" = auth.uid()
  )
  or public.has_role(auth.uid(), 'ADMIN')
);

drop policy if exists "payments visible by owner teacher admin" on public.payments;
create policy "payments visible by owner teacher admin" on public.payments
for select using (
  auth.uid() = "userId"
  or exists (
    select 1
    from public.bookings b
    join public.classes c on c.id = b."classId"
    where b.id = "bookingId" and c."teacherId" = auth.uid()
  )
  or public.has_role(auth.uid(), 'ADMIN')
);

drop policy if exists "payment owner can insert" on public.payments;
create policy "payment owner can insert" on public.payments
for insert with check (auth.uid() = "userId");

drop policy if exists "payment owner can update" on public.payments;
create policy "payment owner can update" on public.payments
for update using (auth.uid() = "userId");

-- Settings policies
drop policy if exists "authenticated can read app settings" on public.app_settings;
create policy "authenticated can read app settings" on public.app_settings
for select using (auth.uid() is not null);

drop policy if exists "admins can update app settings" on public.app_settings;
create policy "admins can update app settings" on public.app_settings
for update using (public.has_role(auth.uid(), 'ADMIN'));
