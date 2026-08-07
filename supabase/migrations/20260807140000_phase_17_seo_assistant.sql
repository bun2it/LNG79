-- Phase 17: SEO Assistant tables and seed data
-- Creates tables: public.seo_pages and public.seo_timeline
-- Seeds initial configuration and timeline metrics for key pages.

create table public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  page_id text not null, -- e.g. 'home', 'p-2' (lng-solution), etc.
  page_type text not null default 'static', -- 'static' | 'product' | 'project' | 'article'
  locale text not null default 'vi' constraint seo_pages_locale_check check (locale in ('vi', 'en')),
  primary_keyword text not null default '',
  secondary_keywords jsonb not null default '[]'::jsonb,
  seo_title text not null default '',
  meta_description text not null default '',
  canonical text not null default '',
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  schema_type text not null default 'WebPage',
  og_image text not null default '',
  seo_score integer not null default 50,
  last_reviewed_at timestamptz not null default now(),
  constraint seo_pages_page_id_locale_unique unique (page_id, locale)
);

comment on table public.seo_pages is 'SEO keywords, metadata, score and configurations for page optimization.';

create table public.seo_timeline (
  id uuid primary key default gen_random_uuid(),
  page_id text not null,
  locale text not null default 'vi',
  event_date date not null default current_date,
  event_type text not null, -- 'edit_title' | 'edit_desc' | 'add_faq' | 'rank_up' | 'ctr_up' | 'other'
  description text not null,
  metrics_diff jsonb, -- e.g. {"ctr_from": 2.1, "ctr_to": 3.8, "pos_from": 12, "pos_to": 8}
  created_at timestamptz not null default now()
);

comment on table public.seo_timeline is 'SEO historical events log linking content edits to performance changes.';

-- Enable RLS
alter table public.seo_pages enable row level security;
alter table public.seo_timeline enable row level security;

-- Set up updated_at trigger for seo_pages
create trigger seo_pages_set_updated_at
before update on public.seo_pages
for each row execute function private.set_updated_at();

-- Revoke default public access, then grant select/insert/update/delete explicitly
revoke all on table public.seo_pages from public, anon, authenticated;
revoke all on table public.seo_timeline from public, anon, authenticated;

-- Allow public reads
grant select on table public.seo_pages to anon, authenticated;
grant select on table public.seo_timeline to anon, authenticated;

-- Allow CMS editors to mutate
grant insert, update, delete on table public.seo_pages to authenticated;
grant insert, update, delete on table public.seo_timeline to authenticated;

-- RLS Policies for seo_pages
create policy seo_pages_select_policy
on public.seo_pages
for select
to public
using (true);

create policy seo_pages_write_policy
on public.seo_pages
for all
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- RLS Policies for seo_timeline
create policy seo_timeline_select_policy
on public.seo_timeline
for select
to public
using (true);

create policy seo_timeline_write_policy
on public.seo_timeline
for all
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));


-- ============================================================
-- SEED DATA: seo_pages
-- ============================================================
insert into public.seo_pages (page_id, page_type, locale, primary_keyword, secondary_keywords, seo_title, meta_description, canonical, robots_index, robots_follow, schema_type, seo_score) values
-- Home Page
(
  'home', 'static', 'vi',
  'nhiên liệu công nghiệp', '["bồn gas công nghiệp", "thiết bị bếp công nghiệp", "lắp đặt trạm gas"]'::jsonb,
  'LNG79 - Giải Pháp Năng Lượng Công Nghiệp & Bếp Tập Thể',
  'LNG79 chuyên thiết kế, thi công trạm cấp khí hóa lỏng LNG, LPG công nghiệp và cung cấp lắp đặt trọn gói hệ thống bếp inox công nghiệp đạt chuẩn an toàn chất lượng.',
  'https://lng79.com.vn/', true, true, 'Organization', 85
),
(
  'home', 'static', 'en',
  'industrial energy', '["industrial gas stations", "commercial kitchen equipment", "LNG station installation"]'::jsonb,
  'LNG79 - Industrial Energy & Commercial Kitchen Solutions',
  'LNG79 specializes in design, construction of industrial LNG, LPG stations and turnkey commercial kitchen setups conforming to international safety standards.',
  'https://lng79.com.vn/en', true, true, 'Organization', 82
),
-- LNG Solution
(
  'lng-solution', 'static', 'vi',
  'trạm khí hóa lỏng lng', '["cấp khí lng", "bồn lng siêu lạnh", "đầu đốt lng"]'::jsonb,
  'Giải Pháp LNG Trọn Gói EPC Cho Nhà Máy | LNG79',
  'Tổng thầu EPC lắp đặt trạm cấp khí LNG công nghiệp. Cung cấp bồn chứa siêu lạnh, dàn hóa hơi và hệ thống đường ống an toàn, ổn định nhiên liệu cho nhà máy.',
  'https://lng79.com.vn/solutions/lng', true, true, 'WebPage', 90
),
(
  'lng-solution', 'static', 'en',
  'lng station epc', '["lng storage tank", "cryogenic vaporizer", "industrial lng conversion"]'::jsonb,
  'Turnkey LNG EPC Solutions for Factories | LNG79',
  'EPC general contractor for industrial LNG gas stations. We deliver cryogenic tanks, vaporizers, gas piping systems, and reliable LNG supply for your operations.',
  'https://lng79.com.vn/en/solutions/lng', true, true, 'WebPage', 88
),
-- LPG Solution
(
  'lpg-solution', 'static', 'vi',
  'hệ thống lpg công nghiệp', '["bồn lpg công nghiệp", "giàn bình lpg", "đường ống dẫn gas"]'::jsonb,
  'Hệ Thống Gas Trung Tâm LPG Cho Nhà Máy & Khách Sạn | LNG79',
  'Khảo sát, thiết kế và lắp đặt hệ thống bồn chứa LPG, giàn bình gas trung tâm chất lượng cao, an toàn tuyệt đối cho các cụm công nghiệp và tòa nhà thương mại.',
  'https://lng79.com.vn/solutions/lpg', true, true, 'WebPage', 78
),
(
  'lpg-solution', 'static', 'en',
  'industrial lpg system', '["lpg storage tank", "lpg manifold system", "lpg gas piping"]'::jsonb,
  'Centralized LPG Gas Systems for Factories & Hotels | LNG79',
  'Site assessment, engineering design and installation of industrial LPG storage tanks and cylinder manifolds, ensuring absolute safety for commercial projects.',
  'https://lng79.com.vn/en/solutions/lpg', true, true, 'WebPage', 76
),
-- Burner Conversion
(
  'conversion', 'static', 'vi',
  'cải tạo đầu đốt lò hơi', '["chuyển đổi dầu sang gas", "đầu đốt khí tự nhiên", "tiết kiệm nhiên liệu lò hơi"]'::jsonb,
  'Cải Tạo Đầu Đốt Lò Hơi Chuyển Sang Dùng Gas | LNG79',
  'Dịch vụ thay thế, cải tạo đầu đốt lò hơi từ chạy dầu Diesel, FO, than sang chạy khí gas sạch LNG, LPG. Tiết kiệm nhiên liệu hiệu quả, giảm phát thải môi trường.',
  'https://lng79.com.vn/solutions/conversion', true, true, 'WebPage', 72
),
(
  'conversion', 'static', 'en',
  'boiler burner retrofit', '["oil to gas conversion", "natural gas burner", "energy savings boiler"]'::jsonb,
  'Boiler Burner Retrofitting & Oil-to-Gas Conversion | LNG79',
  'Upgrade boiler burners from diesel, heavy oil (FO), or coal to clean natural gas LNG/LPG. Improve thermal efficiency, reduce emissions and fuel expenditures.',
  'https://lng79.com.vn/en/solutions/conversion', true, true, 'WebPage', 70
),
-- Commercial Kitchen
(
  'kitchen-solution', 'static', 'vi',
  'thiết bị bếp inox công nghiệp', '["bếp á bếp âu", "quạt hút khói bếp", "quầy kệ inox nhà hàng"]'::jsonb,
  'Thiết Kế Thiết Bị Bếp Inox Công Nghiệp Trọn Gói | LNG79',
  'Tổng thầu tư vấn mặt bằng, gia công inox chất lượng cao SUS304 và thi công trọn gói thiết bị bếp ăn tập thể, nhà hàng, khách sạn, hệ thống gas và hút khói đồng bộ.',
  'https://lng79.com.vn/solutions/kitchen', true, true, 'WebPage', 80
),
(
  'kitchen-solution', 'static', 'en',
  'stainless steel kitchen equipment', '["commercial kitchen range", "exhaust hood hood", "restaurant fabrication"]'::jsonb,
  'Turnkey Commercial Stainless Steel Kitchen Design | LNG79',
  'Consulting, custom SUS304 stainless steel fabrication and complete installation for cafeteria kitchens, restaurants, hotels, integrated gas lines, and venting.',
  'https://lng79.com.vn/en/solutions/kitchen', true, true, 'WebPage', 78
),
-- Contact Page
(
  'contact', 'static', 'vi',
  'liên hệ lng79', '["hotline hỗ trợ kỹ thuật", "đặt lịch khảo sát trạm gas"]'::jsonb,
  'Liên Hệ Đội Ngũ Kỹ Sư & Đặt Lịch Khảo Sát | LNG79',
  'Kết nối với đội ngũ tư vấn kỹ thuật của LNG79 để nhận hỗ trợ khảo sát mặt bằng, lập dự toán trạm cấp khí và tư vấn giải pháp bếp inox công nghiệp miễn phí.',
  'https://lng79.com.vn/contact', true, true, 'WebPage', 65
),
(
  'contact', 'static', 'en',
  'contact lng79', '["technical hotline", "schedule gas station survey"]'::jsonb,
  'Contact Our Engineers & Schedule Site Survey | LNG79',
  'Get in touch with LNG79 technical consultants for free site assessments, station engineering drafts, and custom commercial kitchen proposals.',
  'https://lng79.com.vn/en/contact', true, true, 'WebPage', 62
);


-- ============================================================
-- SEED DATA: seo_timeline (Simulated history events)
-- ============================================================
insert into public.seo_timeline (page_id, locale, event_date, event_type, description, metrics_diff) values
-- LNG Solutions Timeline
(
  'lng-solution', 'vi', '2026-08-02', 'edit_title',
  'Thay đổi thẻ tiêu đề SEO (Meta Title) từ mặc định thành cụm từ chứa từ khóa chính "Giải Pháp LNG Trọn Gói EPC Cho Nhà Máy | LNG79"',
  '{}'::jsonb
),
(
  'lng-solution', 'vi', '2026-08-05', 'add_faq',
  'Bổ sung khối 10 câu hỏi thường gặp (FAQ) đầy đủ chi tiết bằng cả tiếng Việt và tiếng Anh lên cơ sở dữ liệu để kích hoạt FAQ Schema trên Google Search.',
  '{}'::jsonb
),
(
  'lng-solution', 'vi', '2026-08-08', 'ctr_up',
  'Dữ liệu Search Console ghi nhận CTR trung bình tăng đáng kể nhờ hiển thị kết quả phong phú (Rich Snippet) của bộ FAQ Schema.',
  '{"ctr_from": 2.1, "ctr_to": 3.8}'::jsonb
),
(
  'lng-solution', 'vi', '2026-08-15', 'rank_up',
  'Vị trí trung bình (Average Position) của từ khóa chính "trạm khí hóa lỏng lng" thăng hạng lọt vào top 10 sau khi tối ưu hóa mật độ từ khóa trong bài viết.',
  '{"pos_from": 12, "pos_to": 8}'::jsonb
),

-- Home Page Timeline
(
  'home', 'vi', '2026-07-20', 'edit_desc',
  'Tối ưu lại thẻ Mô tả SEO (Meta Description) chứa đầy đủ thông tin về 3 trụ cột dịch vụ (LNG, LPG, Bếp công nghiệp) để thu hút người dùng nhấp chuột.',
  '{}'::jsonb
),
(
  'home', 'vi', '2026-07-28', 'ctr_up',
  'CTR cải thiện rõ rệt từ 1.8% lên 2.9% do đoạn mô tả mô tả đúng mục đích tìm kiếm của khách hàng.',
  '{"ctr_from": 1.8, "ctr_to": 2.9}'::jsonb
),

-- LPG Solutions Timeline
(
  'lpg-solution', 'vi', '2026-08-01', 'edit_title',
  'Cập nhật tiêu đề trang chi tiết, sửa từ "Giải pháp LPG" thành tiêu đề đầy đủ "Hệ Thống Gas Trung Tâm LPG Cho Nhà Máy & Khách Sạn | LNG79" để cạnh tranh hơn.',
  '{}'::jsonb
);
