-- Migration: Update public.crm_attachments policies to fix RLS error during soft delete.
-- By splitting the ALL policy into separate SELECT, INSERT, UPDATE, and DELETE policies,
-- we avoid the RETURNING RLS violation when setting deleted_at to a non-null value.

begin;

drop policy if exists crm_attachments_all_policy on public.crm_attachments;

-- 1. SELECT
create policy crm_attachments_select_policy
on public.crm_attachments
for select
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);

-- 2. INSERT
create policy crm_attachments_insert_policy
on public.crm_attachments
for insert
to authenticated
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);

-- 3. UPDATE
create policy crm_attachments_update_policy
on public.crm_attachments
for update
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);

-- 4. DELETE
create policy crm_attachments_delete_policy
on public.crm_attachments
for delete
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);

commit;
