-- Migration: Update public.leads policies to include sales and manager roles.
-- This ensures that CRM users with sales or manager roles can view and update leads.

begin;

drop policy if exists leads_select_policy on public.leads;
drop policy if exists leads_update_policy on public.leads;

-- 1. Select: Allow owner, admin, editor, sales, and manager to view submissions
create policy leads_select_policy
on public.leads
for select
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'sales', 'manager'])
);

-- 2. Update: Allow owner, admin, editor, sales, and manager to update status/details
create policy leads_update_policy
on public.leads
for update
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'sales', 'manager'])
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'sales', 'manager'])
);

commit;
