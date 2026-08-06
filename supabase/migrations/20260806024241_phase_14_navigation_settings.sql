-- Phase 14: Navigation & Site Settings

-- 1. NAVIGATION ITEMS TABLE
create table public.navigation_items (
  id text primary key,
  label jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  path text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  parent_id text references public.navigation_items(id) on delete cascade,
  target text not null default '_self',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.navigation_items is 'Site navigation menu items.';

-- Enable RLS for navigation_items
alter table public.navigation_items enable row level security;

-- Set up updated_at trigger for navigation_items
create trigger navigation_items_set_updated_at
before update on public.navigation_items
for each row execute function private.set_updated_at();

-- Revoke and Grant access for navigation_items
revoke all on table public.navigation_items from public, anon, authenticated;
grant select on table public.navigation_items to anon, authenticated;
grant insert, update, delete on table public.navigation_items to authenticated;

-- RLS Policies for navigation_items
create policy navigation_items_select_policy
on public.navigation_items
for select
to public
using (
  visible = true
  or (select auth.uid()) is not null
);

create policy navigation_items_insert_policy
on public.navigation_items
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy navigation_items_update_policy
on public.navigation_items
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy navigation_items_delete_policy
on public.navigation_items
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));


-- 2. SITE SETTINGS TABLE
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is 'Key-value config store for site variables (contact info, fuel prices, SEO tags).';

-- Enable RLS for site_settings
alter table public.site_settings enable row level security;

-- Set up updated_at trigger for site_settings
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function private.set_updated_at();

-- Revoke and Grant access for site_settings
revoke all on table public.site_settings from public, anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

-- RLS Policies for site_settings
create policy site_settings_select_policy
on public.site_settings
for select
to public
using (true);

create policy site_settings_insert_policy
on public.site_settings
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy site_settings_update_policy
on public.site_settings
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy site_settings_delete_policy
on public.site_settings
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- 3. SYNC MEDIA_ASSETS TABLE COLUMNS
alter table public.media_assets add column if not exists media_role text;
alter table public.media_assets add column if not exists visible boolean not null default true;
alter table public.media_assets add column if not exists sort_order integer not null default 0;
