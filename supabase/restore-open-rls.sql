-- ============================================================
-- ROLLBACK: Restore open RLS policies (no auth required)
-- Run this in Supabase SQL Editor → New query → Run
-- ============================================================

-- Drop all auth-based policies from the auth experiments
do $$ begin
  drop policy if exists "Approved read projects"    on projects;
  drop policy if exists "Admin write projects"      on projects;
  drop policy if exists "Approved read episodes"    on episodes;
  drop policy if exists "Admin write episodes"      on episodes;
  drop policy if exists "Approved read departments" on departments;
  drop policy if exists "Admin write departments"   on departments;
  drop policy if exists "Approved read tasks"       on tasks;
  drop policy if exists "Admin write tasks"         on tasks;
  drop policy if exists "Member update own tasks"   on tasks;
  drop policy if exists "Approved read holidays"    on holidays;
  drop policy if exists "Admin write holidays"      on holidays;
  drop policy if exists "Auth read projects"        on projects;
  drop policy if exists "Auth read episodes"        on episodes;
  drop policy if exists "Auth read departments"     on departments;
  drop policy if exists "Auth read tasks"           on tasks;
  drop policy if exists "Auth read holidays"        on holidays;
  drop policy if exists "open"                      on projects;
  drop policy if exists "open"                      on episodes;
  drop policy if exists "open"                      on departments;
  drop policy if exists "open"                      on tasks;
  drop policy if exists "open"                      on holidays;
exception when others then null;
end $$;

-- Restore simple open policies (internal tool, no login needed)
create policy "open" on projects    for all using (true) with check (true);
create policy "open" on episodes    for all using (true) with check (true);
create policy "open" on departments for all using (true) with check (true);
create policy "open" on tasks       for all using (true) with check (true);
create policy "open" on holidays    for all using (true) with check (true);

-- Done — dashboard works without any login again
select 'RLS restored to open access' as status;
