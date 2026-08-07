-- Phase 19: CRM Documents Storage bucket + RLS policies
-- Creates the 'crm-documents' private bucket for Quotes, Contracts, and Opportunity attachments.

begin;

-- 1. Create CRM Documents bucket (private — requires signed URL to access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-documents',
  'crm-documents',
  false,
  52428800, -- 50 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'text/plain',
    'application/zip'
  ]
)
on conflict (id) do nothing;

-- 2. RLS: authenticated CRM users can SELECT (download) their own org's files
create policy crm_documents_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'crm-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales', 'marketing'])
);

-- 3. RLS: INSERT (upload) — sales, manager, admin, owner
create policy crm_documents_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'crm-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);

-- 4. RLS: UPDATE (replace/rename)
create policy crm_documents_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'crm-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
)
with check (
  bucket_id = 'crm-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);

-- 5. RLS: DELETE — manager, admin, owner only
create policy crm_documents_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'crm-documents'
  and private.current_user_has_cms_role(array['owner', 'admin', 'manager'])
);

commit;
