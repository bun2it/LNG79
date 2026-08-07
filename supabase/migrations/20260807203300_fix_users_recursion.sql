-- Fix infinite recursion in users table RLS policy by checking admin role via security definer function.
create or replace function private.current_user_is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and status = 'active'
      and account_type = 'admin'
  );
$$;

grant execute on function private.current_user_is_admin() to authenticated;

drop policy if exists users_admin_all on public.users;

create policy users_admin_all
on public.users
for all
to authenticated
using (
  private.current_user_is_admin()
)
with check (
  private.current_user_is_admin()
);

-- Grant privileges on users table to authenticated role
grant all on table public.users to authenticated;
grant all on table public.users to service_role;
grant select on table public.users to anon;

