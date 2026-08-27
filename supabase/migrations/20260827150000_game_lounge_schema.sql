-- Migration: Game Lounge (Cờ Vua & Cờ Tướng) multiplayer rooms and realtime sync
-- Creates public.game_rooms table, enables RLS, and adds to supabase_realtime publication.

begin;

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  game_type text not null constraint game_rooms_game_type_check check (game_type in ('chess', 'xiangqi')),
  room_name text not null,
  time_limit_minutes integer not null default 10,
  host_user_id uuid not null references public.users(id) on delete cascade,
  guest_user_id uuid references public.users(id) on delete set null,
  status text not null default 'waiting' constraint game_rooms_status_check check (
    status in ('waiting', 'in_progress', 'finished', 'abandoned')
  ),
  fen text not null,
  current_turn text not null default 'white',
  host_time_remaining integer not null default 600,
  guest_time_remaining integer not null default 600,
  move_history jsonb not null default '[]'::jsonb,
  winner_user_id uuid references public.users(id) on delete set null,
  win_reason text,
  draw_offered_by uuid references public.users(id) on delete set null,
  rematch_requested_by uuid references public.users(id) on delete set null,
  last_move_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.game_rooms is 'Multiplayer chess and xiangqi game rooms for CMS members.';

-- Setup updated_at trigger
create trigger game_rooms_set_updated_at
before update on public.game_rooms
for each row execute function private.set_updated_at();

-- Enable RLS
alter table public.game_rooms enable row level security;

-- Grant permissions
grant select, insert, update, delete on table public.game_rooms to authenticated;

-- RLS Policies
create policy game_rooms_select_policy on public.game_rooms
  for select to authenticated
  using (true);

create policy game_rooms_insert_policy on public.game_rooms
  for insert to authenticated
  with check (host_user_id = auth.uid());

create policy game_rooms_update_policy on public.game_rooms
  for update to authenticated
  using (true)
  with check (true);

create policy game_rooms_delete_policy on public.game_rooms
  for delete to authenticated
  using (
    host_user_id = auth.uid() 
    or private.current_user_has_cms_role(array['owner', 'admin'])
  );

-- Enable Supabase Realtime for instant move broadcast and lobby updates
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'game_rooms'
  ) then
    alter publication supabase_realtime add table public.game_rooms;
  end if;
end $$;

commit;
