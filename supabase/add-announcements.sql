-- House Quest: announcements (run once in Supabase > SQL Editor)
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
