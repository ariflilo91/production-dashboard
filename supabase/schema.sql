-- Run this in Supabase SQL Editor → New query → Run
-- Fixes "row violates row-level security" errors

-- Drop old conflicting policies
do $$ begin
  drop policy if exists "Read access for authenticated" on projects;
  drop policy if exists "Read access for authenticated" on episodes;
  drop policy if exists "Read access for authenticated" on departments;
  drop policy if exists "Read access for authenticated" on stages;
  drop policy if exists "Read access for authenticated" on tasks;
  drop policy if exists "Read access for authenticated" on holidays;
  drop policy if exists "Full access for service role" on projects;
  drop policy if exists "Full access for service role" on episodes;
  drop policy if exists "Full access for service role" on departments;
  drop policy if exists "Full access for service role" on stages;
  drop policy if exists "Full access for service role" on tasks;
  drop policy if exists "Full access for service role" on holidays;
  drop policy if exists "Anon read" on projects;
  drop policy if exists "Anon read" on episodes;
  drop policy if exists "Anon read" on departments;
  drop policy if exists "Anon read" on stages;
  drop policy if exists "Anon read" on tasks;
  drop policy if exists "Anon read" on holidays;
  drop policy if exists "Write access for authenticated" on projects;
  drop policy if exists "Write access for authenticated" on episodes;
  drop policy if exists "Write access for authenticated" on departments;
  drop policy if exists "Write access for authenticated" on stages;
  drop policy if exists "Write access for authenticated" on tasks;
  drop policy if exists "Write access for authenticated" on holidays;
  drop policy if exists "Allow all for anon" on projects;
  drop policy if exists "Allow all for anon" on episodes;
  drop policy if exists "Allow all for anon" on departments;
  drop policy if exists "Allow all for anon" on stages;
  drop policy if exists "Allow all for anon" on tasks;
  drop policy if exists "Allow all for anon" on holidays;
exception when others then null;
end $$;

-- Create open policies (internal studio tool — no auth needed yet)
create policy "open" on projects  for all using (true) with check (true);
create policy "open" on episodes  for all using (true) with check (true);
create policy "open" on departments for all using (true) with check (true);
create policy "open" on tasks     for all using (true) with check (true);
create policy "open" on holidays  for all using (true) with check (true);

-- Stages table may or may not exist
do $$ begin
  create policy "open" on stages for all using (true) with check (true);
exception when others then null;
end $$;
