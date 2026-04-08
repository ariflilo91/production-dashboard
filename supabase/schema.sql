-- Run this in Supabase SQL Editor → New query → Run
-- Fixes RLS + adds function to seed new projects with default departments + holidays

do $$ begin
  drop policy if exists "open" on projects;
  drop policy if exists "open" on episodes;
  drop policy if exists "open" on departments;
  drop policy if exists "open" on tasks;
  drop policy if exists "open" on holidays;
exception when others then null;
end $$;

create policy "open" on projects    for all using (true) with check (true);
create policy "open" on episodes    for all using (true) with check (true);
create policy "open" on departments for all using (true) with check (true);
create policy "open" on tasks       for all using (true) with check (true);
create policy "open" on holidays    for all using (true) with check (true);

create or replace function seed_project_defaults(p_project_id uuid)
returns void language plpgsql as $$
begin
  insert into departments (project_id, name, full_name, sort_order, group_name) values
    (p_project_id, 'Script',     'Script',         1,  'Pre-production'),
    (p_project_id, 'Storyboard', 'Storyboard',     2,  'Pre-production'),
    (p_project_id, 'Concept',    'Concept design', 3,  'Pre-production'),
    (p_project_id, 'Modeling',   'Modeling',       4,  'Pre-production'),
    (p_project_id, 'Animation',  'Animation',      5,  'Production'),
    (p_project_id, 'Recording',  'Recording',      6,  'Production'),
    (p_project_id, 'Scoring',    'Scoring',        7,  'Production'),
    (p_project_id, 'Mixing',     'Mixing',         8,  'Production'),
    (p_project_id, 'Render',     'Render',         9,  'Post-production'),
    (p_project_id, 'Comp',       'Compositing',    10, 'Post-production');

  insert into holidays (project_id, date, name, type) values
    (p_project_id, '2026-01-01', 'New Year''s Day',                 'ph'),
    (p_project_id, '2026-01-29', 'Chinese New Year',                'ph'),
    (p_project_id, '2026-01-30', 'Chinese New Year (2nd day)',      'ph'),
    (p_project_id, '2026-03-30', 'Hari Raya Aidilfitri',           'ph'),
    (p_project_id, '2026-03-31', 'Hari Raya (2nd day)',            'ph'),
    (p_project_id, '2026-04-06', 'Hari Raya (replacement)',        'ph'),
    (p_project_id, '2026-05-01', 'Labour Day',                     'ph'),
    (p_project_id, '2026-05-12', 'Wesak Day',                      'ph'),
    (p_project_id, '2026-05-20', 'Nuzul Al-Quran',                 'ph'),
    (p_project_id, '2026-06-01', 'Yang Di-Pertuan Agong Birthday', 'ph'),
    (p_project_id, '2026-06-06', 'Hari Raya Aidiladha',            'ph'),
    (p_project_id, '2026-06-26', 'Awal Muharram',                  'ph'),
    (p_project_id, '2026-08-31', 'Merdeka Day',                    'ph'),
    (p_project_id, '2026-09-16', 'Malaysia Day',                   'ph'),
    (p_project_id, '2026-10-20', 'Deepavali',                      'ph'),
    (p_project_id, '2026-12-25', 'Christmas Day',                  'ph');
end;
$$;
