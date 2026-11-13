-- House Quest: Josh & Nat
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.
-- Safe to run once on a fresh project.

-- ---------- Tables ----------

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  xp          int  not null default 20,
  recurrence  text not null default 'daily' check (recurrence in ('daily','weekly','once')),
  icon        text not null default '✨',
  category    text not null default 'home',
  archived    boolean not null default false,
  sort        int  not null default 100,
  created_at  timestamptz not null default now()
);

create table if not exists public.completions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid references public.tasks(id) on delete set null,
  title         text not null,
  icon          text not null default '✨',
  by_who        text not null check (by_who in ('josh','nat','together')),
  xp            int  not null,
  completed_at  timestamptz not null default now()
);

create index if not exists completions_completed_at_idx on public.completions (completed_at desc);

-- key/value settings: house name, avatar configs
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------- Views (used by the app and the widget) ----------

create or replace view public.house_stats as
select
  coalesce(sum(xp), 0)::int as total_xp,
  count(*)::int             as total_quests
from public.completions;

-- one row per day the house completed at least one quest (Del Mar time)
create or replace view public.completion_days as
select distinct (completed_at at time zone 'America/Los_Angeles')::date as day
from public.completions
order by day desc;

-- ---------- Access ----------
-- This is a private two-person app with no logins. Anyone who has the app's
-- URL and anon key can read and write. Fine for chores; don't store secrets.

alter table public.tasks       enable row level security;
alter table public.completions enable row level security;
alter table public.settings    enable row level security;

drop policy if exists "house all" on public.tasks;
drop policy if exists "house all" on public.completions;
drop policy if exists "house all" on public.settings;

create policy "house all" on public.tasks       for all to anon using (true) with check (true);
create policy "house all" on public.completions for all to anon using (true) with check (true);
create policy "house all" on public.settings    for all to anon using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update, delete on public.tasks, public.completions, public.settings to anon;
grant select on public.house_stats     to anon;
grant select on public.completion_days to anon;

-- ---------- Realtime (so both phones update live) ----------

do $$
begin
  begin alter publication supabase_realtime add table public.tasks;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.completions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.settings;    exception when duplicate_object then null; end;
end $$;

-- ---------- Announcements ----------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  from_who    text not null check (from_who in ('josh','nat')),
  emoji       text not null default '📣',
  text        text not null check (char_length(text) <= 120),
  created_at  timestamptz not null default now()
);
create index if not exists announcements_created_at_idx on public.announcements (created_at desc);

alter table public.announcements enable row level security;
drop policy if exists "house all" on public.announcements;
create policy "house all" on public.announcements for all to anon using (true) with check (true);
grant select, insert, update, delete on public.announcements to anon;

do $$
begin
  begin alter publication supabase_realtime add table public.announcements; exception when duplicate_object then null; end;
end $$;

-- ---------- Starter quests ----------
-- Edit freely here or in the app later.

insert into public.tasks (title, xp, recurrence, icon, category, sort)
select * from (values
  ('Walk Ocean',                         20, 'daily',  '🐺', 'pets', 10),
  ('Feed the party (Elliott, Ocean, Hiccup)', 10, 'daily', '🥣', 'pets', 20),
  ('Scoop Elliott''s litter',            10, 'daily',  '🐈', 'pets', 30),
  ('Fresh hay & water for Hiccup',       10, 'daily',  '🐇', 'pets', 40),
  ('Clear the Dish Pit',                 20, 'daily',  '🍽️', 'home', 50),
  ('Training session (gym)',             35, 'daily',  '🏋️', 'gains', 60),
  ('Hit the protein goal',               10, 'daily',  '🥩', 'gains', 70),
  ('Defeat Laundry Mountain',            35, 'weekly', '🧺', 'home', 80),
  ('Vacuum the Husky Fur Storm',         35, 'weekly', '🌪️', 'home', 90),
  ('Deep clean Hiccup''s hutch',         35, 'weekly', '🧹', 'pets', 100),
  ('Brush Ocean (the undercoat boss)',   35, 'weekly', '🪮', 'pets', 110),
  ('Trash & recycling night',            20, 'weekly', '🗑️', 'home', 120),
  ('Grocery supply run',                 35, 'weekly', '🛒', 'home', 130),
  ('Meal prep for the week',             60, 'weekly', '🍱', 'gains', 140),
  ('Visit across the street',            20, 'weekly', '🏡', 'family', 160)
) as v(title, xp, recurrence, icon, category, sort)
where not exists (select 1 from public.tasks);

insert into public.settings (key, value) values
  ('house', '{"name":"House of Josh & Nat"}'::jsonb)
on conflict (key) do nothing;
