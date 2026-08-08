-- Migration: Fix RLS policy violations during soft delete (UPDATE ... RETURNING) on CRM tables.
-- Drops crm_*_all_policy and replaces them with split SELECT, INSERT, UPDATE, DELETE policies.
-- By removing "deleted_at is null" constraint from the SELECT policy USING clause (leaving it to role check only),
-- we allow the PostgREST UPDATE RETURNING request to return the updated record (with deleted_at set) without RLS errors.

begin;

-- =========================================================================
-- 1. crm_companies
-- =========================================================================
drop policy if exists crm_companies_all_policy on public.crm_companies;

create policy crm_companies_select_policy on public.crm_companies
  for select to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_companies_insert_policy on public.crm_companies
  for insert to authenticated
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_companies_update_policy on public.crm_companies
  for update to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']))
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_companies_delete_policy on public.crm_companies
  for delete to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));


-- =========================================================================
-- 2. crm_contacts
-- =========================================================================
drop policy if exists crm_contacts_all_policy on public.crm_contacts;

create policy crm_contacts_select_policy on public.crm_contacts
  for select to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_contacts_insert_policy on public.crm_contacts
  for insert to authenticated
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_contacts_update_policy on public.crm_contacts
  for update to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']))
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_contacts_delete_policy on public.crm_contacts
  for delete to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));


-- =========================================================================
-- 3. crm_opportunities
-- =========================================================================
drop policy if exists crm_opportunities_all_policy on public.crm_opportunities;

create policy crm_opportunities_select_policy on public.crm_opportunities
  for select to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_opportunities_insert_policy on public.crm_opportunities
  for insert to authenticated
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_opportunities_update_policy on public.crm_opportunities
  for update to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']))
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_opportunities_delete_policy on public.crm_opportunities
  for delete to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));


-- =========================================================================
-- 4. crm_tasks
-- =========================================================================
drop policy if exists crm_tasks_all_policy on public.crm_tasks;

create policy crm_tasks_select_policy on public.crm_tasks
  for select to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_tasks_insert_policy on public.crm_tasks
  for insert to authenticated
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_tasks_update_policy on public.crm_tasks
  for update to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']))
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_tasks_delete_policy on public.crm_tasks
  for delete to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));


-- =========================================================================
-- 5. crm_quotes
-- =========================================================================
drop policy if exists crm_quotes_all_policy on public.crm_quotes;

create policy crm_quotes_select_policy on public.crm_quotes
  for select to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_quotes_insert_policy on public.crm_quotes
  for insert to authenticated
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_quotes_update_policy on public.crm_quotes
  for update to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']))
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_quotes_delete_policy on public.crm_quotes
  for delete to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));


-- =========================================================================
-- 6. crm_contracts
-- =========================================================================
drop policy if exists crm_contracts_all_policy on public.crm_contracts;

create policy crm_contracts_select_policy on public.crm_contracts
  for select to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_contracts_insert_policy on public.crm_contracts
  for insert to authenticated
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_contracts_update_policy on public.crm_contracts
  for update to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']))
  with check (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

create policy crm_contracts_delete_policy on public.crm_contracts
  for delete to authenticated
  using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

commit;
