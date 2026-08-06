-- Phase 18: Page Revisions and Rollback Table

create table public.page_revisions (
  id text primary key,
  page_id text not null,
  timestamp timestamptz not null default now(),
  author text not null default 'admin',
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.page_revisions is 'Snapshot revisions of site page block layouts for rollback purposes.';

-- Enable RLS
alter table public.page_revisions enable row level security;

-- Revoke and Grant access
revoke all on table public.page_revisions from public, anon, authenticated;
grant select on table public.page_revisions to anon, authenticated;
grant insert, delete on table public.page_revisions to authenticated;

-- RLS Policies
create policy page_revisions_select_policy
on public.page_revisions
for select
to public
using (true);

create policy page_revisions_insert_policy
on public.page_revisions
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy page_revisions_delete_policy
on public.page_revisions
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin']));
