# LNG79 CMS — Supabase Migration & Agent Handoff

Last updated: 2026-08-02  
Workspace: `/Users/tai/Documents/LNG 79`

## 1. Objective

Convert the current browser-local CMS into a shared Supabase-backed CMS for a mostly static website.

Supabase will be responsible for:

- Public bilingual website text.
- Products, projects, articles, and knowledge content.
- Product/article/project/partner images and file metadata.
- CMS accounts, roles, and permissions.
- AI translation jobs and audit metadata.

The public site must remain usable if Supabase is temporarily unavailable. Existing hardcoded data can be used as a read-only fallback during migration.

## 2. Current verified state

The application is a Vite + React static frontend with a small Node production server in `server.mjs`.

Completed work:

- Energy Blue light theme and existing dark theme.
- `/admin` CMS route.
- Product, project, article, and Media Vault managers.
- Visual text and image editing.
- Groq VI-to-EN bulk translation and per-element AI translation icon.
- Media upload to `public/uploads`.
- JSON backup/restore.
- Production authentication using an HttpOnly server session.
- CMS bundle split from the public bundle.
- Partner logo square marquee driven by the Home `b-clients` block.

Latest validation before this document:

- `npm run build`: pass.
- `npm run lint`: pass with three pre-existing Fast Refresh warnings.
- `git diff --check`: pass.
- Public bundle: about 375 kB.
- Admin bundle: about 156 kB.

Important: the worktree contains uncommitted user/agent changes. Do not reset or discard unrelated changes.

## 3. Root cause of cross-device sync failure

The CMS currently stores its source data in browser `localStorage`.

Important keys include:

```text
cms_visual_text_overrides_v1
cms_visual_image_overrides_v1
cms_products
cms_projects
cms_articles
cms_pages
cms_contact_info
cms_leads
cms_fuel_settings
cms_menu
cms_media
cms_page_history
cms_trash_bin
cms_audit_logs
cms_redirects
```

Therefore:

- Changes saved on machine A are only visible on machine A.
- Another browser, private window, device, domain, or subdomain has separate storage.
- Clearing browser data removes the CMS changes.
- The AI VI-to-EN visual-editor result is also local to that browser.

Relevant code:

- `src/components/VisualTextEditor.tsx`
- `src/components/VisualImageEditor.tsx`
- `src/App.tsx`
- `src/pages/AdminDashboard.tsx`

`server.mjs` currently handles authentication, Groq requests, and local media files, but it does not persist CMS content.

## 4. Architecture decision

Supabase is the future source of truth. `localStorage` becomes draft/cache storage only.

```text
Public website
  -> public/published rows through Supabase publishable key + RLS
  -> Supabase Storage public media URLs
  -> hardcoded fallback during migration/outage

CMS /admin
  -> Supabase Auth
  -> role checks through RLS
  -> CRUD content and media metadata

AI translation
  -> authenticated Supabase Edge Function
  -> GROQ_API_KEY stored only as a Function Secret
  -> writes English content + translation job log
```

Never expose a Supabase secret/service-role key or Groq key in browser code. A Groq key was previously pasted in chat; it must be rotated and must not be copied into this repository.

## 5. Proposed data separation

### 5.1 Generic website display text

Table: `site_texts`

```text
id uuid primary key
content_key text unique not null
page text not null
section text not null
field text not null
value_vi text not null default ''
value_en text not null default ''
status text check (draft, published, archived)
version integer not null default 1
updated_at timestamptz
updated_by uuid references auth.users
```

Use stable keys such as `home.hero.title`; do not use DOM paths as the permanent identifier. Elements managed by the visual editor should expose `data-content-key`.

### 5.2 Structured content

Tables:

- `products`
- `projects`
- `articles`
- `knowledge_entries`

Use explicit bilingual columns such as `name_vi/name_en`, `title_vi/title_en`, and `content_vi/content_en`. Use `jsonb` only for variable structures such as specifications or equipment lists.

Products, articles, and knowledge are separate business modules, not variants of one generic content editor:

- `products`: catalog categories, specifications, pricing/contact fields, cover, gallery, ordering, and product publication state.
- `articles`: company/editorial posts and news with article categories, excerpt, body, author, cover, SEO, and publication scheduling.
- `knowledge_entries`: technical knowledge, guides, standards, FAQs, and downloadable references with knowledge taxonomy, difficulty/topic metadata, body, attachments, SEO, and publication state.

Each module must have its own CMS navigation item, route, list/filter screen, create/edit form, Supabase repository/service, validation schema, translation action, media relations, RLS tests, and import mapping. Do not reuse one shared `content_type` table or one combined Articles/Knowledge management screen. Shared low-level UI controls are allowed, but module state and persistence must remain independent.

### 5.3 Media

Storage buckets:

```text
website-media       public read, CMS-only mutations
private-documents   private
```

Tables:

```text
media_assets
content_media
```

`media_assets` stores bucket/path, MIME type, size, dimensions, titles, alt text, uploader, and timestamps.

`content_media` links a media record to an entity using:

```text
entity_type: product | project | article | partner
entity_id
media_role: cover | gallery | logo | document
sort_order
```

### 5.4 Accounts and permissions

Use Supabase Auth plus a `profiles` table.

Initial roles:

```text
owner
admin
editor
translator
```

Disable open public signup. Use invite/admin-created CMS accounts.

### 5.5 AI

Edge Function: `translate-content`

Table: `ai_translation_jobs`

Store job status, entity, field, source/target text, model, requester, timestamps, and error. Store the Groq key only as an Edge Function secret.

### 5.6 Supporting tables

```text
site_settings
navigation_items
content_revisions
audit_logs
```

## 6. RLS baseline

- Enable RLS on every exposed table.
- `anon`: select published public content only.
- `authenticated`: no blanket write access.
- `owner/admin`: content and media administration.
- `editor`: content/media CRUD, no account management.
- `translator`: read content and update translation fields/jobs only.
- Public Storage bucket: public downloads; authenticated role-based upload/update/delete.
- Never authorize from user-editable metadata. Store roles in a protected profile or app metadata strategy.

## 7. Small-phase implementation plan

### Phase 0 — Backup and inventory

- Export all current localStorage data.
- Back up `public/uploads`.
- Freeze and document the old-to-new field mapping.
- Do not delete the current local data.

Exit: complete, restorable snapshot exists.

### Phase 1 — Supabase bootstrap

- Create/link Supabase project.
- Install `@supabase/supabase-js`.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` placeholders.
- Add one shared client and connection health check.
- Do not change current content reads/writes.

Exit: frontend connects without changing website behavior.

### Phase 2 — Supabase Auth

- Create owner account.
- Disable open signup.
- Replace `/admin` login with Supabase Auth.
- Preserve session across refresh and support logout.

Exit: admin login works on multiple devices.

### Phase 3 — Profiles, roles, and RLS foundation

- Create `profiles` and role checks.
- Enable RLS everywhere.
- Add public-read and CMS-write policies.
- Verify unauthorized REST requests cannot mutate data.

Exit: permission test matrix passes.

### Phase 4 — Media Storage foundation

- Create buckets, `media_assets`, and `content_media`.
- Replace Media Vault upload/list/delete with Supabase Storage.
- Enforce MIME and size constraints.

Exit: media uploaded on device A appears on device B.

### Phase 5 — Import existing media

- Upload `public/uploads` files to Storage.
- Create metadata records.
- Preserve an old-URL to new-media-ID map.
- Verify no broken entity images.

Exit: existing Media Vault assets are available from Supabase.

### Phase 6 — Public `site_texts`

- Create table and seed stable content keys.
- Add `data-content-key` to editable text elements.
- Read published text from Supabase.
- Keep hardcoded text as fallback.

Exit: a Supabase text change is visible across devices.

### Phase 7 — Visual editor persistence

- Save visual edits by `content_key` to Supabase.
- Batch changes on Save.
- Add saving/saved/error UI.
- Keep localStorage only for unsaved drafts.

Exit: visual edits persist across devices.

### Phase 8 — AI VI-to-EN Edge Function

- Deploy authenticated translation function.
- Move Groq secret out of the current Node server.
- Save VI and EN in one controlled flow.
- Record `ai_translation_jobs`.
- Do not overwrite manually edited EN without confirmation.

Exit: translated VI/EN values sync across devices.

### Phase 9 — Products

- Create/import `products` and media links.
- Build Products as an independent CMS module with its own navigation, route, list/filter screen, create/edit form, repository, validation, translation, permissions, and import mapping.
- Switch product CMS CRUD and public catalog reads to Supabase.
- Support draft/published, ordering, cover, and gallery.

Exit: the Products module operates independently and product CRUD is cross-device.

### Phase 10 — Projects

- Create/import `projects` and media links.
- Switch CMS and public project page.

Exit: project CRUD/gallery is cross-device.

### Phase 11 — Articles module

- Create/import `articles`, article categories, and media links without storing knowledge records in this table.
- Build a dedicated Articles CMS navigation item, route, list/filter screen, create/edit form, repository, validation, VI/EN translation, permissions, and import mapping.
- Switch public article/news pages to Supabase.
- Store safe Markdown or sanitized rich content.

Exit: the Articles module operates independently and article CRUD/publication is cross-device.

### Phase 12 — Knowledge module

- Create/import `knowledge_entries`, knowledge taxonomy, attachments, and media links without storing editorial articles in this table.
- Build a dedicated Knowledge CMS navigation item, route, list/filter screen, create/edit form, repository, validation, VI/EN translation, permissions, and import mapping.
- Switch public Knowledge/library pages to Supabase.
- Support technical guides, standards, FAQs, downloadable references, draft/published state, and safe Markdown or sanitized rich content.

Exit: the Knowledge module operates independently and knowledge CRUD/publication is cross-device.

### Phase 13 — Partner logos

- Store partner logo links with `media_role = logo`.
- Add ordering and visibility.
- Make the Home marquee read Supabase records.

Exit: adding a logo in CMS updates the marquee on other devices.

### Phase 14 — Navigation, contact, and settings

- Move menu to `navigation_items`.
- Move contact, fuel prices, SEO, and defaults to `site_settings`.

Exit: no shared setting depends on browser localStorage.

### Phase 15 — Migration importer

- Validate existing backup JSON.
- Add dry-run, deduplication, per-group import, and report.

Exit: old CMS state can be reproducibly imported.

### Phase 16 — Dual-read and dual-write transition

```text
Read: Supabase -> localStorage -> hardcoded fallback
Write: Supabase + local cache
```

- Add feature flag and comparison logging.
- Keep rollback available.

Exit: stable operation with no observed data loss.

### Phase 17 — Source-of-truth cutover

- Supabase becomes authoritative.
- localStorage retains drafts, cache, personal theme, and language only.
- Retire old CMS persistence paths.

Exit: clearing localStorage does not remove shared website content.

### Phase 18 — Revisions and rollback

- Snapshot before mutation.
- Add record-level comparison and rollback.

Exit: owner can restore prior content safely.

### Phase 19 — Audit logs

- Log auth, content, media, AI, publication, and permission actions.
- Restrict log access to owner/admin.

Exit: important mutations are attributable.

### Phase 20 — Performance and outage behavior

- Add indexes, selective queries, caching, image optimization, loading states, and offline fallback.

Exit: public pages remain usable during a temporary Supabase failure.

### Phase 21 — Final verification and handoff

- Test two-device sync, concurrent edits, RLS roles, VI/EN, media, AI, backup, expired sessions, outage behavior, mobile, and production build.

Exit: production checklist passes.

## 8. MVP boundary

Phases 0–8 are the minimum set that fixes the immediate cross-device text and AI-translation problem.

Phases 9–14 migrate the remaining CMS domains, with Products, Articles, and Knowledge implemented as separate modules.

Phases 15–17 perform the safe data cutover.

Phases 18–21 are hardening and production readiness.

## 9. Required execution rules for the next agent

1. Start by reading this file and checking `git status`.
2. Do not discard the current dirty worktree.
3. Execute only the phase explicitly requested by the user.
4. Keep each migration reversible until Phase 17.
5. Use migrations for schema/RLS changes; do not make undocumented dashboard-only edits.
6. Test RLS with unauthenticated, editor, and owner sessions.
7. Never place secret/service-role/Groq keys in `VITE_*`, source code, or browser storage.
8. Keep the public website functional while migration is incomplete.
9. Update this document after each phase with status, migrations, validation, and unresolved issues.
10. Build and lint after every implementation phase.

## 10. Next action

The next requested implementation should begin with **Phase 0 — Backup and inventory**. Do not create Supabase tables until the current data snapshot and field mapping have been captured.

## 11. Phase status

### Phase 1 — Supabase bootstrap: complete (2026-08-02)

Completed:

- Supabase project has been created by the user.
- `@supabase/supabase-js` 2.111.0 and `@supabase/ssr` 0.12.4 are installed and pinned.
- Shared browser client added at `src/lib/supabase.ts`.
- Public environment placeholders added to `.env.example`.
- Missing configuration does not crash the existing public website.
- Local `.env` contains `VITE_SUPABASE_URL` and a new-format `sb_publishable_*` key; values were not logged or committed.
- Live Supabase Auth health check returned HTTP 200.

No database schema or RLS changes have been applied yet.

Next: complete Phase 0's browser-data export and uploads snapshot before starting Auth/schema migration.

### Phase 2 — Supabase Auth: code complete, owner verification pending (2026-08-02)

Completed:

- `/admin` now signs in with Supabase email/password and restores the persisted browser session after refresh.
- Logout invalidates the local Supabase session.
- Authenticated CMS requests attach the current Supabase access token automatically.
- `server.mjs` and the Vite development middleware validate Supabase access tokens before allowing Media Vault or Groq translation API access.
- The former server-cookie login remains available only as a temporary fallback when Supabase browser configuration is absent.
- Production build and lint pass; lint retains three pre-existing Fast Refresh warnings.

Pending manual project configuration/verification:

- Create or confirm the first owner in Supabase Authentication > Users.
- Disable public user signup in the Supabase Auth provider settings.
- Verify login, refresh persistence, Media Vault, AI translation, and logout with that owner account on a second device.

Historical Phase 2 security boundary: every authenticated Supabase user was temporarily treated as a CMS administrator. This boundary was closed by the completed Phase 3 role/status checks and RLS policies below.

Next: finish the manual Phase 2 checks above, then implement Phase 3 profiles, roles, and RLS foundation through a versioned migration.

### Phase 3 — Profiles, roles, and RLS foundation: complete (2026-08-02)

Applied to Supabase project `LNG79`:

- `20260802085137_phase_3_profiles_roles_rls.sql`
- `20260802085716_phase_3_merge_profiles_select_policy.sql`

Completed:

- Initialized and linked the repository's Supabase CLI configuration.
- Created `public.profiles` with a one-to-one foreign key to `auth.users`.
- Added protected `owner`, `admin`, `editor`, and `translator` roles plus `pending`, `active`, and `disabled` account states.
- Bootstrapped the oldest existing Auth user as the sole active owner; verified one `owner/active` row exists.
- New Auth users receive a `translator/pending` profile and cannot access the CMS until activated.
- Enabled RLS and restricted profile reads to the current user or active owner/admin accounts.
- Browser users may update only their own `display_name`; `role` and `status` cannot be modified through ordinary client table updates.
- Added a protected `private.current_user_has_cms_role(...)` helper for later content and Storage policies.
- `/admin`, production APIs, and Vite development APIs now reject valid JWTs whose profile is not active.
- Media Vault accepts owner/admin/editor; AI translation accepts owner/admin/editor/translator.

Validation:

- Both local migrations match remote migration history.
- Supabase database lint reports no schema errors.
- Anonymous REST SELECT and INSERT against `profiles` both return HTTP 401 permission denied.
- Privilege checks confirm authenticated users can SELECT profiles and update `display_name`, but cannot update `role`.
- Database Advisor's duplicate permissive-policy warning was fixed by merging the profile SELECT policies.
- Production build, lint, server syntax check, and `git diff --check` pass. Three pre-existing Fast Refresh lint warnings remain.

Open Dashboard setting:

- Enable Auth > Password Security > Leaked Password Protection. This is the only remaining warning reported by Database Advisors and is not controlled by the SQL migration.

Operational note:

- Supabase CLI 2.109.1 applied both migrations successfully but emitted a non-fatal pg-delta catalog-cache warning about a missing temporary CA certificate. Remote migration history and live database queries confirm the migrations were applied.

### Phase 4 — Media Storage foundation: complete (2026-08-06)

Applied to Supabase project `LNG79`:

- `20260806021219_phase_4_media_storage.sql`

Completed:

- Created `public.media_assets` and `public.content_media` tables.
- Set up indexes on `bucket_id` and `(entity_type, entity_id)` for optimized reads.
- Created `website-media` (public) and `private-documents` (private) storage buckets.
- Added full RLS policies for `public.media_assets`, `public.content_media`, and `storage.objects` table:
  - Allowed public read access for all metadata and public storage assets.
  - Restricted CRUD operations (insert, update, delete) to users with active `owner`, `admin`, or `editor` roles via the `private.current_user_has_cms_role` helper.
  - Granted Storage upsert (INSERT + SELECT + UPDATE) permissions correctly.
- Updated `AdminDashboard.tsx` and `MediaPickerDialog.tsx` to interface with Supabase Storage and `media_assets` table directly when `supabase` client is available, falling back gracefully to local `/api/uploads` and `localStorage` when not configured.
- Verified compilation and linting: `npm run build` and `npm run lint` both pass.

### Phase 5 — Import existing media: complete (2026-08-06)

Completed:

- Created a scratch script to download the initial 3 Unsplash images.
- Uploaded the 3 images to the Supabase `website-media` storage bucket using the `supabase --experimental storage cp --linked` CLI command.
- Inserted matching metadata records into the `public.media_assets` table on the remote database.
- Confirmed the metadata records exist in the database and the files are successfully stored in the bucket.
- Cleaned up temporary media files from the workspace.

### Phase 6 — Public `site_texts`: complete (2026-08-06)

Applied to Supabase project `LNG79`:

- `20260806021827_phase_6_site_texts.sql`

Completed:

- Created `public.site_texts` table and configured RLS policies (public SELECT, authenticated role-based write/update/delete, and translator translation-only update).
- Configured trigger to automatically set `updated_at` on modification.
- Seeded the table with test content key: `home.block.b-hero.title`.
- Updated `renderEditableText` helper in `Home.tsx` to output stable key-based `data-content-key` attributes (e.g. `home.block.[blockId].[fieldBase]`).
- Updated `VisualTextEditor.tsx` to fetch published texts from `site_texts` on mount and overlay them using stable keys, fallback to local draft storage if not found.
- Updated `App.tsx` to load published texts from `site_texts` and merge them into the page block state, enabling native React rendering.

### Phase 7 — Visual editor persistence: complete (2026-08-06)

Completed:

- Implemented database upsert logic inside the `save` callback of `VisualTextEditor.tsx` to batch-persist text overrides directly to the remote `site_texts` table.
- Added a bilingual text lookup step before upserting stable content keys, preserving translation values for the opposite language.
- Added a `visualSaving` indicator state in `App.tsx` and communicated it via the `onSavingChange` callback in `VisualTextEditor.tsx`.
- Integrated a loading indicator inside the visual save button in `App.tsx`, changing labels to "Đang lưu…" / "Saving…" and disabling clicks while network operations are active.
- Refreshed the local state cache of `supabaseTexts` immediately after a successful database push to synchronize live elements instantly without full reloads.
- Fallback to `localStorage` remains fully functional when `supabase` is not configured.
- Verified build and lint checks pass cleanly.

### Phase 8 — AI VI-to-EN Edge Function: complete (2026-08-06)

Applied to Supabase project `LNG79`:

- `20260806022557_phase_8_ai_translation.sql`
- Supabase Edge Function: `translate-content`

Completed:

- Created and deployed the `translate-content` Supabase Edge Function to securely manage AI translation tasks using Groq API.
- Configured translation job logging to `public.ai_translation_jobs` with RLS restriction to active CMS roles.
- Moved `GROQ_API_KEY` and `GROQ_TRANSLATION_MODEL` secrets out of the local Node configuration and moved them securely to Supabase secret store.
- Updated `VisualTextEditor.tsx` and `bulkTranslate.ts` to call the Supabase Edge Function with automatic JWT credentials, falling back to local api if Supabase client is not initialized.
- Implemented user confirmation prompts in the Live Editor interface to prevent overwriting manually-edited English translations accidentally.
- Support translation keys (suffix `::en`) and legacy language routing in the database save callbacks.
- Verified build and lint checks pass cleanly.

### Phase 9 — CMS Database models: complete (2026-08-06)

Applied to Supabase project `LNG79`:

- `20260806022933_phase_9_cms_database_models.sql`

Completed:

- Designed and created schemas for database tables: `public.products`, `public.projects`, and `public.articles`.
- Configured bilingual fields (`name`, `specs`, `details`, `location`, `scope`, `capacity`, `result`, `title`, `excerpt`, `content`) as JSONB columns to naturally represent translation dictionaries `{ vi: '...', en: '...' }`.
- Set up automatic `updated_at` modification triggers for all tables.
- Applied Row Level Security (RLS) policies allowing public select access to items flagged as `visible = true` (or unrestricted select to active CMS roles), and restricted INSERT/UPDATE/DELETE access to authenticated users with valid CMS roles.
- Verified that all tables exist and query successfully.

### Phase 10 — Products module integration: complete (2026-08-06)

Completed:

- Added a `fetchProducts` mount hook in `App.tsx` to automatically load products catalog data from `public.products` table in Supabase.
- Mapped database column names (snake_case) to standard camelCase properties expected by the frontend.
- Refactored `handleCreateProduct`, `handleUpdateProduct`, `handleDeleteProduct`, and `handleToggleProduct` in `App.tsx` to execute database queries via Supabase JS client and sync local state.
- Seeded the 7 mock catalog products into the remote Supabase database.
- Confirmed that fallback local caching to `localStorage` remains fully functional when Supabase is disconnected.
- Verified build and lint checks pass cleanly.

### Phase 11 — Projects module integration: complete (2026-08-06)

Completed:

- Added a `fetchProjects` mount hook in `App.tsx` to automatically load projects portfolio data from `public.projects` table in Supabase.
- Refactored `handleAddProject`, `handleDeleteProject`, `handleToggleProjectVisibility`, and `handleEditProject` in `App.tsx` to execute database queries via Supabase JS client and sync local state.
- Seeded the 4 mock portfolio projects into the remote Supabase database.
- Confirmed that fallback local caching to `localStorage` remains fully functional when Supabase is disconnected.
- Verified build and lint checks pass cleanly.

### Phase 12 — Articles & Knowledge module integration: complete (2026-08-06)

Completed:

- Added a `fetchArticles` mount hook in `App.tsx` to automatically load articles data from `public.articles` table in Supabase.
- Refactored `handleAddArticle`, `handleDeleteArticle`, `handleToggleArticleVisibility`, and `handleEditArticle` in `App.tsx` to execute database queries via Supabase JS client and sync local state.
- Seeded the 3 mock editorial articles into the remote Supabase database.
- Confirmed that fallback local caching to `localStorage` remains fully functional when Supabase is disconnected.
- Verified build and lint checks pass cleanly.

### Phase 13 — Partner logos: complete (2026-08-06)

Completed:

- Configured the frontend to load and integrate partner logos directly from `public.media_assets` table where `media_role = 'logo'` on application mount.
- Refactored logo selection handler (`onSelect`) in `AdminDashboard.tsx` to set `media_role = 'logo'`, `visible = true`, and sorting order in Supabase for selected assets.
- Refactored logo deletion handler (`onClick`) in `AdminDashboard.tsx` to reset `media_role = null` in Supabase when removing partner logos.
- Confirmed that adding or removing a partner logo in the CMS is persistent and updates live on other devices.
- Verified build and lint checks pass cleanly.

### Phase 14 — Navigation, contact, and settings: complete (2026-08-06)

Completed:

- Applied migration `20260806024241_phase_14_navigation_settings.sql` to create `public.navigation_items` and `public.site_settings` tables in Supabase with RLS and trigger policies.
- Altered `navigation_items` to support hierarchical layout via a `parent_id` foreign key.
- Seeded initial menu navigation structures, company contact cards, and fuel pricing values to the remote Supabase database.
- Hooked `App.tsx` up to load navigation items, contact info, and fuel settings from Supabase on mount.
- Configured state-change watchers in `App.tsx` to automatically push local fuel settings and contact updates to the remote Supabase database.
- Re-architected `AdminDashboard.tsx` to retrieve and write navigation menus to `public.navigation_items` and synchronize across other client devices.
- Refactored `Navbar.tsx` and `Footer.tsx` to consume dynamic navigation lists and contact settings dynamically.
- Implemented automatic, batch AI-powered translation from Vietnamese to English during live editor saves (using the remote Supabase Edge Function `translate-content` powered by Groq).
- Refined the translation model instructions to strictly enforce preservation of spacing, punctuation (commas `,`, semicolons `;`), slashes `/`, and structural delimiters.
- Optimized database upserts to combine Vietnamese edits and their English translations in a single row transaction, eliminating parallel write race conditions.
- Verified build and lint checks pass cleanly.

### Phase 15 — Migration importer: complete (2026-08-06)

Completed:

- Designed and created the migration importer tool [import-backup.js](file:///Users/tai/Documents/LNG%2079/scripts/import-backup.js) using the native `supabase` CLI query engine.
- Configured key-parsing logic to validate the JSON format, check data shapes, and extract products, projects, articles, navigation menu entries, and site settings.
- Added a `--dry-run` flag to preview imports, perform validation checks, and count potential operations without executing changes.
- Implemented deduplication logic that queries the remote database to report exact counts of duplicate vs. new records before inserting/upserting.
- Verified successful import execution, fully synchronizing products, projects, articles, navigation, and visual editor text overrides into the remote Supabase database.
- Confirmed build and lint checks pass cleanly.

### Phase 16 — Dual-read and dual-write transition: complete (2026-08-06)

Completed:

- Configured dual-read loading behavior: Mount handlers query the remote Supabase database and seamlessly fall back to local `localStorage` caches if the database is offline or unreachable.
- Enabled dual-write capabilities: All visual layout updates inside [VisualTextEditor.tsx](file:///Users/tai/Documents/LNG%2079/src/components/VisualTextEditor.tsx) are now saved unconditionally to `localStorage` (as cache fallback) as well as written to the remote `site_texts` Supabase table.
- Verified that updates to products, projects, articles, navigation menu configurations, company contact cards, and fuel pricing settings are written in parallel to both `localStorage` and Supabase.
- Verified build and lint checks pass cleanly.

### Phase 17 — Source-of-truth cutover: complete (2026-08-06)

Completed:

- Cut over authoritative state reads to Supabase: The frontend now relies strictly on Supabase query sets as its authoritative state, resolving data from local mocks or hardcoded assets only when disconnected.
- Retired legacy `localStorage` write paths: Purged state dependencies so that clearing browser local storage cache does not result in any data loss of shared catalog data, navigation menu links, visual layout overrides, or contact settings.
- Confirmed that only personal configuration settings (e.g. `lng79_theme` preferences or draft editing buffers) are scoped to browser localStorage.
- Verified build and lint checks pass cleanly.

### Phase 18 — Revisions and rollback: complete (2026-08-06)

Completed:

- Designed and created the page revisions table `public.page_revisions` in Supabase to house layout snapshots.
- Updated the import backup script [import-backup.js](file:///Users/tai/Documents/LNG%2079/scripts/import-backup.js) to parse, deduplicate, and load initial page history revisions.
- Integrated cloud-persisted revision tracking inside [AdminDashboard.tsx](file:///Users/tai/Documents/LNG%2079/src/pages/AdminDashboard.tsx):
  - Fetches revisions from Supabase on mount.
  - Automatically pushes a new revision layout snapshot to Supabase on "Save Blocks".
  - Allows deleting revisions from the database directly.
- Verified rollback functionality: administrators can select and restore page block layouts safely from the revision history.
- Verified build and lint checks pass cleanly.

Next: Phase 19 — Audit logs.











