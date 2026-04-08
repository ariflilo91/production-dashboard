-- ============================================================
-- AUTH SCHEMA v2 — Open registration with admin approval
-- Run this in Supabase SQL Editor → New query → Run
-- ============================================================

-- 1. Team members table (with approval status)
create table if not exists team_members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text,
  role          text not null default 'member' check (role in ('admin','member')),
  status        text not null default 'pending' check (status in ('pending','approved')),
  avatar_url    text,
  notify_urgent boolean default true,
  notify_weekly boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. Department assignments
create table if not exists department_assignments (
  id             uuid primary key default gen_random_uuid(),
  team_member_id uuid references team_members(id) on delete cascade,
  department_id  uuid references departments(id) on delete cascade,
  project_id     uuid references projects(id) on delete cascade,
  created_at     timestamptz default now(),
  unique (team_member_id, department_id)
);

-- 3. Add assigned_to to tasks
alter table tasks add column if not exists assigned_to uuid references team_members(id) on delete set null;

-- 4. Enable RLS
alter table team_members enable row level security;
alter table department_assignments enable row level security;

-- Drop old policies first
drop policy if exists "Durioo users can read team"      on team_members;
drop policy if exists "Admins can manage team"          on team_members;
drop policy if exists "Member can update own record"    on team_members;
drop policy if exists "Durioo users can read assignments" on department_assignments;
drop policy if exists "Admins can manage assignments"   on department_assignments;
drop policy if exists "open"                            on team_members;
drop policy if exists "open"                            on department_assignments;

-- Authenticated users can read approved team members
create policy "Auth can read team" on team_members
  for select using (auth.role() = 'authenticated');

-- Admins can do everything on team_members
create policy "Admin full access team" on team_members
  for all using (
    exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')
  ) with check (
    exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')
  );

-- Users can update their own display_name / avatar only
create policy "Member update self" on team_members
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Assignments
create policy "Auth read assignments" on department_assignments
  for select using (auth.role() = 'authenticated');

create policy "Admin manage assignments" on department_assignments
  for all using (
    exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')
  ) with check (
    exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')
  );

-- 5. Main table policies — require approved auth
drop policy if exists "open"                on projects;
drop policy if exists "open"                on episodes;
drop policy if exists "open"                on departments;
drop policy if exists "open"                on tasks;
drop policy if exists "open"                on holidays;
drop policy if exists "Auth read projects"  on projects;
drop policy if exists "Auth read episodes"  on episodes;
drop policy if exists "Auth read departments" on departments;
drop policy if exists "Auth read tasks"     on tasks;
drop policy if exists "Auth read holidays"  on holidays;
drop policy if exists "Admin write projects"    on projects;
drop policy if exists "Admin write episodes"    on episodes;
drop policy if exists "Admin write departments" on departments;
drop policy if exists "Admin write holidays"    on holidays;
drop policy if exists "Admin write tasks"       on tasks;
drop policy if exists "Member update own tasks" on tasks;

-- Approved members can read everything
create policy "Approved read projects"    on projects    for select using (exists (select 1 from team_members where user_id = auth.uid() and status = 'approved'));
create policy "Approved read episodes"    on episodes    for select using (exists (select 1 from team_members where user_id = auth.uid() and status = 'approved'));
create policy "Approved read departments" on departments for select using (exists (select 1 from team_members where user_id = auth.uid() and status = 'approved'));
create policy "Approved read tasks"       on tasks       for select using (exists (select 1 from team_members where user_id = auth.uid() and status = 'approved'));
create policy "Approved read holidays"    on holidays    for select using (exists (select 1 from team_members where user_id = auth.uid() and status = 'approved'));

-- Admins can write everything
create policy "Admin write projects"    on projects    for all using (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')) with check (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved'));
create policy "Admin write episodes"    on episodes    for all using (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')) with check (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved'));
create policy "Admin write departments" on departments for all using (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')) with check (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved'));
create policy "Admin write holidays"    on holidays    for all using (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')) with check (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved'));
create policy "Admin write tasks"       on tasks       for all using (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved')) with check (exists (select 1 from team_members where user_id = auth.uid() and role = 'admin' and status = 'approved'));

-- Members can update tasks assigned to them
create policy "Member update own tasks" on tasks
  for update using (
    assigned_to in (select id from team_members where user_id = auth.uid() and status = 'approved')
  );

-- 6. Auto-register function — NO domain restriction
-- First user = admin + approved, rest = member + pending
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  member_count int;
  user_role    text;
  user_status  text;
  display      text;
begin
  select count(*) into member_count from team_members;

  user_role   := case when member_count = 0 then 'admin'    else 'member'  end;
  user_status := case when member_count = 0 then 'approved' else 'pending' end;
  display     := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into team_members (user_id, email, display_name, role, status, avatar_url)
  values (
    new.id,
    new.email,
    display,
    user_role,
    user_status,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (email) do update
    set user_id    = new.id,
        avatar_url = new.raw_user_meta_data->>'avatar_url',
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
