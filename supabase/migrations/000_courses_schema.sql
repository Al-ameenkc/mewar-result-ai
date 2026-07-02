-- Mewar Result AI — ensure courses table has required columns
-- Run this FIRST in the Supabase SQL Editor.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  faculty text not null,
  department text not null,
  level text not null,
  semester text not null,
  code text not null,
  title text not null,
  units integer not null default 3,
  max_exam integer not null default 60,
  max_ca integer not null default 30,
  max_attendance integer not null default 10,
  created_at timestamptz not null default now()
);

alter table public.courses add column if not exists max_exam integer not null default 60;
alter table public.courses add column if not exists max_ca integer not null default 30;
alter table public.courses add column if not exists max_attendance integer not null default 10;

create table if not exists public.analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  faculty text not null,
  department text not null,
  level text not null,
  semester text not null,
  assessment_type text not null default 'Combined',
  scores jsonb not null default '{}'::jsonb,
  courses jsonb not null default '[]'::jsonb,
  ai_analysis jsonb,
  created_at timestamptz not null default now()
);

alter table public.analysis_sessions add column if not exists ai_analysis jsonb;

create index if not exists analysis_sessions_user_id_idx on public.analysis_sessions (user_id);
create index if not exists courses_lookup_idx on public.courses (faculty, department, level, semester);
