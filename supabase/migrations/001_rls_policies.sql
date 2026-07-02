-- Mewar Result AI — Row Level Security policies
-- Apply in the Supabase SQL editor or via Supabase CLI.

alter table if exists public.courses enable row level security;
alter table if exists public.analysis_sessions enable row level security;

drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read"
  on public.courses
  for select
  to anon, authenticated
  using (true);

drop policy if exists "courses_service_role_write" on public.courses;
create policy "courses_service_role_write"
  on public.courses
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "analysis_sessions_select_own" on public.analysis_sessions;
create policy "analysis_sessions_select_own"
  on public.analysis_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "analysis_sessions_insert_own" on public.analysis_sessions;
create policy "analysis_sessions_insert_own"
  on public.analysis_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "analysis_sessions_delete_own" on public.analysis_sessions;
create policy "analysis_sessions_delete_own"
  on public.analysis_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "analysis_sessions_update_own" on public.analysis_sessions;
create policy "analysis_sessions_update_own"
  on public.analysis_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
