-- Migration: Support 'go' (Cờ Vây / Weiqi) in game_rooms
begin;

alter table public.game_rooms 
  drop constraint if exists game_rooms_game_type_check;

alter table public.game_rooms 
  add constraint game_rooms_game_type_check 
  check (game_type in ('chess', 'xiangqi', 'go'));

commit;
