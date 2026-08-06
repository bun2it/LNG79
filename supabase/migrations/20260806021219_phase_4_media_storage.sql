-- Phase 4: Create Supabase Storage / media tables and policies.

-- 1. Create media_assets table
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  storage_path text not null,
  mime_type text not null,
  file_size bigint not null,
  width integer,
  height integer,
  title text,
  alt_text text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_bucket_path_unique unique (bucket_id, storage_path)
);

comment on table public.media_assets is 'Metadata of files uploaded to Supabase Storage.';

-- Enable RLS
alter table public.media_assets enable row level security;

-- 2. Create content_media table (join table linking entities to media_assets)
create table public.content_media (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_assets (id) on delete cascade,
  entity_type text not null constraint content_media_entity_type_check check (entity_type in ('product', 'project', 'article', 'partner', 'knowledge_entry')),
  entity_id text not null,
  media_role text not null default 'gallery' constraint content_media_role_check check (media_role in ('cover', 'gallery', 'logo', 'document')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_media_entity_role_media_unique unique (entity_type, entity_id, media_id, media_role)
);

comment on table public.content_media is 'Join table linking CMS entities (products, projects, articles, etc.) to media assets.';

-- Enable RLS
alter table public.content_media enable row level security;

-- 3. Setup updated_at triggers
create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function private.set_updated_at();

create trigger content_media_set_updated_at
before update on public.content_media
for each row execute function private.set_updated_at();

-- 4. Set up database indexes for performance (Recommended in review to do at creation time)
create index media_assets_bucket_id_idx on public.media_assets (bucket_id);
create index content_media_lookup_idx on public.content_media (entity_type, entity_id);

-- 5. Revoke and Grant table access
revoke all on table public.media_assets from public, anon, authenticated;
grant select on table public.media_assets to anon, authenticated;
grant insert, update, delete on table public.media_assets to authenticated;

revoke all on table public.content_media from public, anon, authenticated;
grant select on table public.content_media to anon, authenticated;
grant insert, update, delete on table public.content_media to authenticated;

-- 6. RLS Policies for media_assets
-- Everyone can view media asset metadata
create policy media_assets_select_public
on public.media_assets
for select
to public
using (true);

-- Active owners, admins, and editors can insert media asset metadata
create policy media_assets_insert_cms
on public.media_assets
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- Active owners, admins, and editors can update media asset metadata
create policy media_assets_update_cms
on public.media_assets
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- Active owners, admins, and editors can delete media asset metadata
create policy media_assets_delete_cms
on public.media_assets
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- 7. RLS Policies for content_media
-- Everyone can view entity-media relationships
create policy content_media_select_public
on public.content_media
for select
to public
using (true);

-- Active owners, admins, and editors can insert entity-media relationships
create policy content_media_insert_cms
on public.content_media
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- Active owners, admins, and editors can update entity-media relationships
create policy content_media_update_cms
on public.content_media
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- Active owners, admins, and editors can delete entity-media relationships
create policy content_media_delete_cms
on public.content_media
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- 8. Initialize Storage Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('website-media', 'website-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('private-documents', 'private-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

-- 9. Storage RLS Policies for website-media bucket
-- Allow public select/downloads from website-media
create policy website_media_select_public
on storage.objects
for select
to public
using (bucket_id = 'website-media');

-- Allow insert to website-media for authenticated users with active CMS roles
create policy website_media_insert_cms
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'website-media'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
);

-- Allow update to website-media for authenticated users with active CMS roles
create policy website_media_update_cms
on storage.objects
for update
to authenticated
using (
  bucket_id = 'website-media'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
)
with check (
  bucket_id = 'website-media'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
);

-- Allow delete from website-media for authenticated users with active CMS roles
create policy website_media_delete_cms
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'website-media'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
);

-- 10. Storage RLS Policies for private-documents bucket
-- Allow select from private-documents for authenticated users with active CMS roles
create policy private_documents_select_cms
on storage.objects
for select
to authenticated
using (
  bucket_id = 'private-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
);

-- Allow insert to private-documents for authenticated users with active CMS roles
create policy private_documents_insert_cms
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'private-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
);

-- Allow update to private-documents for authenticated users with active CMS roles
create policy private_documents_update_cms
on storage.objects
for update
to authenticated
using (
  bucket_id = 'private-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
)
with check (
  bucket_id = 'private-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
);

-- Allow delete from private-documents for authenticated users with active CMS roles
create policy private_documents_delete_cms
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'private-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'editor'])
);
