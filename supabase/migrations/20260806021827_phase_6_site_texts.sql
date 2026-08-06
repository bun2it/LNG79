-- Phase 6: site_texts table and policies.

create table public.site_texts (
  id uuid primary key default gen_random_uuid(),
  content_key text unique not null,
  page text not null,
  section text not null,
  field text not null,
  value_vi text not null default '',
  value_en text not null default '',
  status text not null default 'draft' constraint site_texts_status_check check (status in ('draft', 'published', 'archived')),
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.site_texts is 'Bilingual visual website content text elements.';

-- Enable RLS
alter table public.site_texts enable row level security;

-- Set up updated_at trigger
create trigger site_texts_set_updated_at
before update on public.site_texts
for each row execute function private.set_updated_at();

-- Revoke and Grant access
revoke all on table public.site_texts from public, anon, authenticated;
grant select on table public.site_texts to anon, authenticated;
grant insert, update, delete on table public.site_texts to authenticated;

-- RLS Policies
-- 1. Public SELECT: Allow select access to site_texts.
-- Public/anon can see published content. CMS roles can see all content (including drafts/archived).
create policy site_texts_select_public
on public.site_texts
for select
to public
using (
  status = 'published'
  or (select auth.uid()) is not null
);

-- 2. Insert: Active owner/admin/editor can insert new text keys.
create policy site_texts_insert_cms
on public.site_texts
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- 3. Update: Active owner/admin/editor can update all fields.
create policy site_texts_update_cms
on public.site_texts
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- 4. Update for translator: Translators can only update bilingual translation fields (value_vi, value_en) and version, updated_by.
create policy site_texts_update_translator
on public.site_texts
for update
to authenticated
using (
  private.current_user_has_cms_role(array['translator'])
)
with check (
  private.current_user_has_cms_role(array['translator'])
);

-- 5. Delete: Active owner/admin can delete keys.
create policy site_texts_delete_cms
on public.site_texts
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin']));
