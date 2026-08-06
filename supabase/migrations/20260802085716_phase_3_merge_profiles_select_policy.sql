drop policy profiles_select_own on public.profiles;
drop policy profiles_select_for_managers on public.profiles;

create policy profiles_select_authorized
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_has_cms_role(array['owner', 'admin']))
);
