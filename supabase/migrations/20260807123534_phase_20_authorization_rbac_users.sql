-- Phase 20: Authorization module & users table migration
-- Renames public.profiles to public.users, adds new fields, and configures authentication redirection.

begin;

-- 1. Rename profiles table to users
alter table if exists public.profiles rename to users;

-- 2. Rename display_name column to name
alter table if exists public.users rename column display_name to name;

-- 3. Add new columns
alter table public.users add column if not exists username text;
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists account_type text;
alter table public.users add column if not exists company text;
alter table public.users add column if not exists department text;
alter table public.users add column if not exists last_login timestamptz;

-- 4. Migrate old data
update public.users
set 
  username = coalesce(nullif(username, ''), split_part(email, '@', 1)),
  account_type = case 
    when role in ('owner', 'admin', 'editor', 'translator', 'marketing') then 'admin'
    else 'user'
  end
where account_type is null;

-- Fill remaining null names
update public.users
set name = coalesce(name, username, 'User')
where name is null;

-- 5. Add constraints
alter table public.users alter column username set not null;
alter table public.users add constraint users_username_unique unique (username);
alter table public.users alter column account_type set not null;
alter table public.users add constraint users_account_type_check check (account_type in ('admin', 'user'));

-- Drop role column from users table to clean up
alter table public.users drop column if exists role;

-- 6. Recreate helper function private.current_user_has_cms_role to map admin/user types
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
      from public.users
      where id = (select auth.uid())
        and status = 'active'
        and (
          (account_type = 'admin' and ('owner' = any(allowed_roles) or 'admin' = any(allowed_roles) or 'editor' = any(allowed_roles) or 'translator' = any(allowed_roles) or 'marketing' = any(allowed_roles)))
          or
          (account_type = 'user' and ('sales' = any(allowed_roles) or 'manager' = any(allowed_roles)))
        )
    );
$$;

grant execute on function private.current_user_has_cms_role(text[]) to authenticated;

-- 7. Recreate on_auth_user_created trigger function for users table
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, name, email, username, account_type, status)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1)),
    'user',
    'pending'
  );
  return new;
end;
$$;

-- 8. Redefine RLS Policies on users table
drop policy if exists profiles_select_authorized on public.users;
drop policy if exists profiles_update_own_display_name on public.users;
drop policy if exists users_select_authorized on public.users;
drop policy if exists users_update_own on public.users;
drop policy if exists users_admin_all on public.users;

-- Admin has full access to create/read/update/delete any user
create policy users_admin_all
on public.users
for all
to authenticated
using (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
      and status = 'active'
      and account_type = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
      and status = 'active'
      and account_type = 'admin'
  )
);

-- Users can select any active user (needed for assignee dropdowns, etc.)
create policy users_select_authorized
on public.users
for select
to authenticated
using (
  status = 'active' or id = (select auth.uid())
);

-- Users can update their own profile name
create policy users_update_own
on public.users
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

commit;
