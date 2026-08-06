-- Phase 8: ai_translation_jobs table and policies.

create table public.ai_translation_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' constraint ai_translation_jobs_status_check check (status in ('pending', 'processing', 'completed', 'failed')),
  requester_id uuid references auth.users (id) on delete set null,
  source_text text not null,
  translated_text text,
  model text not null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_translation_jobs is 'Log of AI translations performed inside the CMS.';

-- Enable RLS
alter table public.ai_translation_jobs enable row level security;

-- Set up updated_at trigger
create trigger ai_translation_jobs_set_updated_at
before update on public.ai_translation_jobs
for each row execute function private.set_updated_at();

-- Revoke and Grant access
revoke all on table public.ai_translation_jobs from public, anon, authenticated;
grant select, insert, update on public.ai_translation_jobs to authenticated;

-- RLS Policies
-- 1. SELECT: Active CMS roles can view translation logs
create policy ai_translation_jobs_select_cms
on public.ai_translation_jobs
for select
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']));

-- 2. INSERT: Active CMS roles can insert translation logs
create policy ai_translation_jobs_insert_cms
on public.ai_translation_jobs
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']));

-- 3. UPDATE: Active CMS roles can update translation logs (e.g. status, error, translated_text)
create policy ai_translation_jobs_update_cms
on public.ai_translation_jobs
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']));
