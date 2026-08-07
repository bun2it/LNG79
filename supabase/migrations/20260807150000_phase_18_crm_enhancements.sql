-- Phase 18: B2B CRM tables & integrations
-- This migration updates the public.profiles role validations, updates public.leads policies for sales/managers,
-- and creates crm_lead_sources, crm_industries, crm_companies, crm_contacts, crm_opportunities, crm_tasks,
-- crm_activities, crm_attachments, crm_quotes, crm_contracts, crm_notifications, and crm_audit_logs.

begin;

-- 1. Update public.profiles role constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (
  role in ('owner', 'admin', 'editor', 'translator', 'marketing', 'sales', 'manager')
);

-- 2. Create crm_lead_sources lookup table
create table public.crm_lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.crm_lead_sources enable row level security;
grant select, insert, update, delete on public.crm_lead_sources to authenticated;

create policy crm_lead_sources_all_policy
on public.crm_lead_sources
for all
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

-- Seed default lead sources
insert into public.crm_lead_sources (name, code) values
  ('Website Contact Form', 'website_contact'),
  ('Website Quotation Request', 'website_quotation'),
  ('Website Fuel Calculator', 'website_calculator'),
  ('Website Project Survey', 'website_survey'),
  ('Phone Call Hotline', 'phone'),
  ('Walk-in / Office Visit', 'walk_in'),
  ('Trade Show Exhibition', 'trade_show'),
  ('Customer Referral', 'referral'),
  ('Business Partner', 'partner'),
  ('Facebook Messenger', 'facebook'),
  ('Google Ads campaign', 'google_ads'),
  ('LinkedIn outreach', 'linkedin'),
  ('Email inquiry', 'email'),
  ('Manual Input', 'manual'),
  ('CSV Bulk Import', 'csv_import'),
  ('External API', 'api')
on conflict (code) do nothing;


-- 3. Create crm_industries lookup table
create table public.crm_industries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.crm_industries enable row level security;
grant select, insert, update, delete on public.crm_industries to authenticated;

create policy crm_industries_all_policy
on public.crm_industries
for all
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales']));

-- Seed default industries
insert into public.crm_industries (name, code) values
  ('Food & Beverage', 'food'),
  ('Iron & Steel', 'steel'),
  ('Ceramic & Tiles', 'ceramic'),
  ('Textile & Garment', 'textile'),
  ('Chemical & Plastics', 'chemical'),
  ('Hospital & Healthcare', 'hospital'),
  ('Hotel & Resort Hospitality', 'hotel'),
  ('Glass & Refractory', 'glass'),
  ('Agriculture & Feedmills', 'agriculture'),
  ('Paper & Packaging', 'paper'),
  ('Other manufacturing', 'other')
on conflict (code) do nothing;


-- 4. Sequences & helpers for auto-numbering
create sequence crm_company_number_seq start with 100;
create sequence crm_opportunity_number_seq start with 10;

create or replace function public.crm_generate_company_number()
returns trigger as $$
begin
  if new.company_number is null or new.company_number = '' then
    new.company_number := 'CUS-' || lpad(nextval('crm_company_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.crm_generate_opportunity_number()
returns trigger as $$
begin
  if new.opportunity_number is null or new.opportunity_number = '' then
    new.opportunity_number := 'OP-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('crm_opportunity_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;


-- 5. Create crm_companies table
create table public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  company_number text not null unique,
  name text not null,
  industry_id uuid references public.crm_industries(id) on delete set null,
  tax_code text default '',
  website text default '',
  address text default '',
  province text default '',
  country text default 'Vietnam',
  notes text default '',
  status text not null default 'prospect' constraint crm_companies_status_check check (
    status in ('prospect', 'customer', 'inactive', 'partner', 'supplier')
  ),
  tags text[] default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create trigger crm_companies_set_updated_at
before update on public.crm_companies
for each row execute function private.set_updated_at();

create trigger crm_companies_generate_number
before insert on public.crm_companies
for each row execute function public.crm_generate_company_number();

alter table public.crm_companies enable row level security;
grant select, insert, update, delete on public.crm_companies to authenticated;

create policy crm_companies_all_policy
on public.crm_companies
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
  and deleted_at is null
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 6. Create crm_contacts table
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.crm_companies(id) on delete cascade,
  name text not null,
  position text default '',
  phone text default '',
  email text default '',
  department text default '',
  birthday date,
  is_decision_maker boolean not null default false,
  is_technical_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create trigger crm_contacts_set_updated_at
before update on public.crm_contacts
for each row execute function private.set_updated_at();

alter table public.crm_contacts enable row level security;
grant select, insert, update, delete on public.crm_contacts to authenticated;

create policy crm_contacts_all_policy
on public.crm_contacts
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
  and deleted_at is null
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 7. Create crm_opportunities table
create table public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  opportunity_number text not null unique,
  title text not null,
  company_id uuid not null references public.crm_companies(id) on delete cascade,
  primary_contact_id uuid references public.crm_contacts(id) on delete set null,
  solution_type text not null default 'lng' constraint crm_opportunities_solution_check check (
    solution_type in ('lng', 'lpg', 'conversion', 'kitchen')
  ),
  deal_value numeric not null default 0,
  currency text not null default 'VND',
  probability integer not null default 10 constraint crm_opportunities_prob_check check (
    probability between 0 and 100
  ),
  expected_close_date date,
  assigned_to uuid references public.profiles(id) on delete set null,
  stage text not null default 'new' constraint crm_opportunities_stage_check check (
    stage in ('new', 'qualified', 'contacted', 'survey', 'design', 'proposal', 'negotiation', 'review', 'dormant', 'won', 'lost')
  ),
  source_id uuid references public.crm_lead_sources(id) on delete set null,
  lost_reason text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create trigger crm_opportunities_set_updated_at
before update on public.crm_opportunities
for each row execute function private.set_updated_at();

create trigger crm_opportunities_generate_number
before insert on public.crm_opportunities
for each row execute function public.crm_generate_opportunity_number();

alter table public.crm_opportunities enable row level security;
grant select, insert, update, delete on public.crm_opportunities to authenticated;

create policy crm_opportunities_all_policy
on public.crm_opportunities
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
  and deleted_at is null
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 8. Create crm_tasks table
create table public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.crm_opportunities(id) on delete cascade,
  title text not null,
  task_type text not null constraint crm_tasks_type_check check (
    task_type in ('call', 'meeting', 'survey', 'proposal', 'reminder', 'document_request', 'site_visit', 'deadline')
  ),
  status text not null default 'todo' constraint crm_tasks_status_check check (
    status in ('todo', 'doing', 'done', 'overdue')
  ),
  due_date timestamptz not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create trigger crm_tasks_set_updated_at
before update on public.crm_tasks
for each row execute function private.set_updated_at();

alter table public.crm_tasks enable row level security;
grant select, insert, update, delete on public.crm_tasks to authenticated;

create policy crm_tasks_all_policy
on public.crm_tasks
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
  and deleted_at is null
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 9. Create crm_activities table (Polymorphic Activity Logs)
create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null constraint crm_activities_entity_check check (
    entity_type in ('lead', 'company', 'contact', 'opportunity', 'task')
  ),
  entity_id text not null,
  activity_type text not null constraint crm_activities_type_check check (
    activity_type in ('status_change', 'phone', 'meeting', 'survey', 'proposal', 'negotiation', 'email', 'note', 'file')
  ),
  content text not null,
  attachment_url text default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.crm_activities enable row level security;
grant select, insert, update, delete on public.crm_activities to authenticated;

create policy crm_activities_all_policy
on public.crm_activities
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 10. Create crm_attachments table (Polymorphic File Uploads)
create table public.crm_attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null constraint crm_attachments_entity_check check (
    entity_type in ('opportunity', 'quote', 'contract', 'activity')
  ),
  entity_id uuid not null,
  file_name text not null,
  storage_path text not null,
  file_size integer,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

alter table public.crm_attachments enable row level security;
grant select, insert, update, delete on public.crm_attachments to authenticated;

create policy crm_attachments_all_policy
on public.crm_attachments
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
  and deleted_at is null
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 11. Create crm_quotes table
create table public.crm_quotes (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.crm_opportunities(id) on delete cascade,
  quote_number text not null unique,
  version integer not null default 1,
  amount numeric not null default 0,
  status text not null default 'draft' constraint crm_quotes_status_check check (
    status in ('draft', 'sent', 'accepted', 'rejected', 'expired')
  ),
  pdf_url text default '',
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create trigger crm_quotes_set_updated_at
before update on public.crm_quotes
for each row execute function private.set_updated_at();

alter table public.crm_quotes enable row level security;
grant select, insert, update, delete on public.crm_quotes to authenticated;

create policy crm_quotes_all_policy
on public.crm_quotes
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
  and deleted_at is null
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 12. Create crm_contracts table
create table public.crm_contracts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.crm_opportunities(id) on delete cascade,
  contract_number text not null unique,
  value numeric not null default 0,
  status text not null default 'draft' constraint crm_contracts_status_check check (
    status in ('draft', 'review', 'active', 'terminated', 'completed')
  ),
  pdf_url text default '',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create trigger crm_contracts_set_updated_at
before update on public.crm_contracts
for each row execute function private.set_updated_at();

alter table public.crm_contracts enable row level security;
grant select, insert, update, delete on public.crm_contracts to authenticated;

create policy crm_contracts_all_policy
on public.crm_contracts
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
  and deleted_at is null
)
with check (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager', 'sales'])
);


-- 13. Create crm_notifications table
create table public.crm_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  type text not null,
  entity_type text,
  entity_id text,
  created_at timestamptz not null default now()
);

alter table public.crm_notifications enable row level security;
grant select, insert, update, delete on public.crm_notifications to authenticated;

create policy crm_notifications_all_policy
on public.crm_notifications
for all
to authenticated
using (
  auth.uid() = user_id
);


-- 14. Create crm_audit_logs table
create table public.crm_audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  change_type text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

alter table public.crm_audit_logs enable row level security;
grant select, insert on public.crm_audit_logs to authenticated;

create policy crm_audit_logs_all_policy
on public.crm_audit_logs
for all
to authenticated
using (
  private.current_user_has_cms_role(array['owner', 'admin', 'manager'])
);


-- 15. Create indexes for performance on foreign keys
create index idx_crm_companies_industry_id on public.crm_companies(industry_id);
create index idx_crm_contacts_company_id on public.crm_contacts(company_id);
create index idx_crm_opportunities_company_id on public.crm_opportunities(company_id);
create index idx_crm_opportunities_primary_contact_id on public.crm_opportunities(primary_contact_id);
create index idx_crm_opportunities_assigned_to on public.crm_opportunities(assigned_to);
create index idx_crm_opportunities_source_id on public.crm_opportunities(source_id);
create index idx_crm_tasks_opportunity_id on public.crm_tasks(opportunity_id);
create index idx_crm_tasks_assigned_to on public.crm_tasks(assigned_to);
create index idx_crm_activities_entity on public.crm_activities(entity_type, entity_id);
create index idx_crm_attachments_entity on public.crm_attachments(entity_type, entity_id);
create index idx_crm_quotes_opportunity_id on public.crm_quotes(opportunity_id);
create index idx_crm_contracts_opportunity_id on public.crm_contracts(opportunity_id);
create index idx_crm_notifications_user_id on public.crm_notifications(user_id);


-- 16. Alter public.leads table constraints and columns
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check check (
  status in ('new', 'contacted', 'qualified', 'rejected', 'merged')
);

alter table public.leads add column if not exists lead_source_id uuid references public.crm_lead_sources(id) on delete set null;
alter table public.leads add column if not exists converted_company_id uuid references public.crm_companies(id) on delete set null;
alter table public.leads add column if not exists converted_contact_id uuid references public.crm_contacts(id) on delete set null;
alter table public.leads add column if not exists converted_opportunity_id uuid references public.crm_opportunities(id) on delete set null;


-- 17. Recreate public.leads policies to include sales/managers
drop policy if exists leads_select_policy on public.leads;
create policy leads_select_policy
on public.leads
for select
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'sales', 'manager']));

drop policy if exists leads_update_policy on public.leads;
create policy leads_update_policy
on public.leads
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'sales', 'manager']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'sales', 'manager']));

drop policy if exists leads_delete_policy on public.leads;
create policy leads_delete_policy
on public.leads
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'manager']));

commit;
