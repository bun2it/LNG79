-- Phase 3: protected CMS profiles, roles, and RLS foundation.
-- The oldest existing Auth user is bootstrapped as the active owner.
-- Every later/new user remains pending until an owner explicitly activates it.

create schema if not exists private;
revoke all on schema private from public, anon;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'translator'
    constraint profiles_role_check check (role in ('owner', 'admin', 'editor', 'translator')),
  status text not null default 'pending'
    constraint profiles_status_check check (status in ('pending', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Protected CMS identity, role, and account status linked one-to-one with auth.users.';
comment on column public.profiles.role is 'Authorization role. Never derive this value from user_metadata.';

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create or replace function private.current_user_has_cms_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and status = 'active'
        and role = any (allowed_roles)
    );
$$;

revoke all on function private.current_user_has_cms_role(text[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_user_has_cms_role(text[]) to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_select_for_managers
on public.profiles
for select
to authenticated
using ((select private.current_user_has_cms_role(array['owner', 'admin'])));

create policy profiles_update_own_display_name
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    'translator',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

with ranked_users as (
  select
    id,
    coalesce(email, '') as email,
    nullif(raw_user_meta_data ->> 'display_name', '') as display_name,
    row_number() over (order by created_at, id) as user_rank
  from auth.users
)
insert into public.profiles (id, email, display_name, role, status)
select
  id,
  email,
  display_name,
  case when user_rank = 1 then 'owner' else 'translator' end,
  case when user_rank = 1 then 'active' else 'pending' end
from ranked_users
on conflict (id) do nothing;
