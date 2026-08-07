-- Phase 16: leads table for Contact submissions, Quote requests, and Project Wizard leads
-- Allows anonymous users to submit contact info / quote requests, while restricting view/edit to CMS authenticated roles.

create table public.leads (
  id text primary key,
  type text not null,
  company text not null default '',
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  location text not null default '',
  status text not null default 'new' constraint leads_status_check check (
    status in ('new', 'contacted', 'survey', 'closed')
  ),
  details text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is 'Customer submissions from Contact forms, Quote requests, and Project Wizard.';

-- Enable RLS for leads
alter table public.leads enable row level security;

-- Set up updated_at trigger
create trigger leads_set_updated_at
before update on public.leads
for each row execute function private.set_updated_at();

-- Revoke default public access, then grant select/insert/update/delete explicitly
revoke all on table public.leads from public, anon, authenticated;

-- Allow public/anonymous inserts (for client form submissions)
grant insert on table public.leads to anon, authenticated;

-- Allow select, update, delete for authenticated users (CMS administrators)
grant select, update, delete on table public.leads to authenticated;

-- RLS Policies
-- 1. Public INSERT: Allow anyone (even anonymous visitors) to submit leads
create policy leads_insert_policy
on public.leads
for insert
to anon, authenticated
with check (true);

-- 2. Select: Only owner, admin, or editor can view submissions
create policy leads_select_policy
on public.leads
for select
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- 3. Update: Only owner, admin, or editor can update submission status or details
create policy leads_update_policy
on public.leads
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- 4. Delete: Only owner or admin can permanently delete a lead
create policy leads_delete_policy
on public.leads
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin']));
