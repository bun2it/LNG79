-- Phase 9: CMS Database Models for products, projects, and articles

-- 1. PRODUCTS TABLE
create table public.products (
  id text primary key,
  name jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  category text not null,
  specs jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  origin text not null default '',
  details jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  tech_params jsonb not null default '[]'::jsonb,
  image text,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Catalog of industrial gas equipment and commercial kitchen products.';

-- Enable RLS for products
alter table public.products enable row level security;

-- Set up updated_at trigger for products
create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();

-- Revoke and Grant access for products
revoke all on table public.products from public, anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

-- RLS Policies for products
create policy products_select_policy
on public.products
for select
to public
using (
  visible = true
  or (select auth.uid()) is not null
);

create policy products_insert_policy
on public.products
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy products_update_policy
on public.products
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']));

create policy products_delete_policy
on public.products
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin']));


-- 2. PROJECTS TABLE
create table public.projects (
  id text primary key,
  name jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  category text not null constraint projects_category_check check (category in ('lng', 'lpg', 'conversion', 'kitchen')),
  location jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  scope jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  capacity jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  result jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  equipments jsonb not null default '[]'::jsonb,
  image text,
  images jsonb not null default '[]'::jsonb,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.projects is 'Portfolio of completed EPC installations and boiler conversions.';

-- Enable RLS for projects
alter table public.projects enable row level security;

-- Set up updated_at trigger for projects
create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

-- Revoke and Grant access for projects
revoke all on table public.projects from public, anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;

-- RLS Policies for projects
create policy projects_select_policy
on public.projects
for select
to public
using (
  visible = true
  or (select auth.uid()) is not null
);

create policy projects_insert_policy
on public.projects
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy projects_update_policy
on public.projects
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']));

create policy projects_delete_policy
on public.projects
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin']));


-- 3. ARTICLES TABLE
create table public.articles (
  id text primary key,
  title jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  category text not null constraint articles_category_check check (category in ('energy', 'safety', 'kitchen')),
  excerpt jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  content jsonb not null default '{"vi": "", "en": ""}'::jsonb,
  date text not null,
  image text,
  images jsonb not null default '[]'::jsonb,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.articles is 'Editorial articles, news, and safety bulletins.';

-- Enable RLS for articles
alter table public.articles enable row level security;

-- Set up updated_at trigger for articles
create trigger articles_set_updated_at
before update on public.articles
for each row execute function private.set_updated_at();

-- Revoke and Grant access for articles
revoke all on table public.articles from public, anon, authenticated;
grant select on table public.articles to anon, authenticated;
grant insert, update, delete on table public.articles to authenticated;

-- RLS Policies for articles
create policy articles_select_policy
on public.articles
for select
to public
using (
  visible = true
  or (select auth.uid()) is not null
);

create policy articles_insert_policy
on public.articles
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

create policy articles_update_policy
on public.articles
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']));

create policy articles_delete_policy
on public.articles
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin']));
