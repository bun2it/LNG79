-- Phase 15: solution_faqs table — dedicated FAQ entries for each solution page
-- Creates a proper, independent table for managing FAQ items per solution.
-- Seeds all 40 FAQ items (10 per page) for the 4 solution pages.

create table public.solution_faqs (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null constraint solution_faqs_page_slug_check check (
    page_slug in ('lng-solution', 'lpg-solution', 'conversion', 'kitchen-solution')
  ),
  sort_order integer not null default 0,
  question_vi text not null default '',
  question_en text not null default '',
  answer_vi text not null default '',
  answer_en text not null default '',
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.solution_faqs is 'Frequently asked questions for each solution page, managed via CMS.';

-- Auto-update updated_at on changes
create trigger solution_faqs_set_updated_at
before update on public.solution_faqs
for each row execute function private.set_updated_at();

-- Enable RLS
alter table public.solution_faqs enable row level security;

-- Revoke defaults
revoke all on table public.solution_faqs from public, anon, authenticated;

-- Public + anon can read visible FAQs
grant select on table public.solution_faqs to anon, authenticated;
grant insert, update, delete on table public.solution_faqs to authenticated;

-- RLS: Anyone can read visible FAQs; CMS users can read all
create policy solution_faqs_select
on public.solution_faqs
for select
to public
using (
  visible = true
  or (select auth.uid()) is not null
);

-- RLS: Owner/admin/editor can insert
create policy solution_faqs_insert
on public.solution_faqs
for insert
to authenticated
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor']));

-- RLS: Owner/admin/editor/translator can update
create policy solution_faqs_update
on public.solution_faqs
for update
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']))
with check (private.current_user_has_cms_role(array['owner', 'admin', 'editor', 'translator']));

-- RLS: Owner/admin can delete
create policy solution_faqs_delete
on public.solution_faqs
for delete
to authenticated
using (private.current_user_has_cms_role(array['owner', 'admin']));


-- ============================================================
-- SEED DATA: LNG Solution (lng-solution) — 10 items
-- ============================================================
insert into public.solution_faqs (page_slug, sort_order, question_vi, question_en, answer_vi, answer_en) values
(
  'lng-solution', 1,
  'Giải pháp LNG trọn gói của LNG79 bao gồm những hạng mục nào?',
  'What does LNG79''s turnkey LNG solution include?',
  'Giải pháp trọn gói của LNG79 bao gồm toàn bộ quy trình từ khảo sát hiện trạng, tư vấn kỹ thuật, thiết kế hệ thống, cung cấp thiết bị, thi công lắp đặt, kiểm định, nghiệm thu, đào tạo vận hành đến bảo trì định kỳ và đảm bảo nguồn cung LNG ổn định.',
  'LNG79 provides a complete turnkey solution covering every stage of the project, including site assessment, engineering design, equipment supply, installation, commissioning, operator training, preventive maintenance, and a reliable LNG supply to ensure long-term operational efficiency.'
),
(
  'lng-solution', 2,
  'Doanh nghiệp nào phù hợp để chuyển sang sử dụng LNG?',
  'Which industries are suitable for LNG conversion?',
  'LNG phù hợp với các nhà máy có nhu cầu sử dụng nhiệt lớn như chế biến thực phẩm, dệt nhuộm, giấy, gốm sứ, luyện kim, hóa chất, sản xuất vật liệu xây dựng và các ngành đang sử dụng FO, Diesel, LPG hoặc than làm nhiên liệu.',
  'LNG is an ideal energy solution for industries with significant thermal energy demand, including food processing, textiles, ceramics, metallurgy, chemicals, paper manufacturing, construction materials, and facilities currently using fuel oil (FO), diesel, LPG, or coal.'
),
(
  'lng-solution', 3,
  'Chuyển đổi từ FO, Diesel hoặc than sang LNG có phải thay toàn bộ hệ thống không?',
  'Do we need to replace our entire system when converting to LNG?',
  'Không nhất thiết. Phần lớn các lò hơi, lò nung hoặc thiết bị đốt hiện hữu đều có thể được cải tạo hoặc thay đầu đốt để sử dụng LNG. LNG79 sẽ khảo sát và đưa ra phương án tối ưu nhằm tận dụng tối đa thiết bị hiện có, giúp giảm chi phí đầu tư.',
  'Not necessarily. Most existing boilers, furnaces, and thermal equipment can be retrofitted by upgrading or replacing the burner system. LNG79 evaluates your current infrastructure and recommends the most cost-effective conversion approach while maximizing the use of existing assets.'
),
(
  'lng-solution', 4,
  'LNG có an toàn khi sử dụng trong nhà máy không?',
  'Is LNG safe for industrial applications?',
  'Có. LNG được lưu trữ trong bồn chuyên dụng ở nhiệt độ thấp và được thiết kế theo các tiêu chuẩn kỹ thuật nghiêm ngặt. Khi được thiết kế, lắp đặt và vận hành đúng quy trình, hệ thống LNG có độ an toàn rất cao. LNG79 tuân thủ đầy đủ các tiêu chuẩn về thiết kế, kiểm định và an toàn vận hành.',
  'Yes. LNG is stored in specially designed cryogenic tanks and handled under strict engineering and safety standards. When properly designed, installed, and operated, LNG systems provide a highly reliable and safe energy solution. LNG79 follows all applicable technical standards and safety regulations throughout every project.'
),
(
  'lng-solution', 5,
  'Thời gian triển khai một dự án LNG thường mất bao lâu?',
  'How long does it take to complete an LNG project?',
  'Tùy theo quy mô dự án, thời gian triển khai thường từ 6 đến 16 tuần, bao gồm khảo sát, thiết kế, sản xuất hoặc nhập thiết bị, thi công lắp đặt, chạy thử và bàn giao vận hành.',
  'Project timelines depend on the size and complexity of the installation. Most turnkey LNG projects are completed within 6 to 16 weeks, covering engineering, equipment procurement, installation, commissioning, and final handover.'
),
(
  'lng-solution', 6,
  'LNG có giúp doanh nghiệp tiết kiệm chi phí nhiên liệu không?',
  'Can LNG help reduce energy costs?',
  'Trong nhiều trường hợp, LNG giúp doanh nghiệp tối ưu chi phí năng lượng nhờ hiệu suất đốt cao, quá trình cháy ổn định và giảm chi phí bảo trì thiết bị. Mức tiết kiệm cụ thể sẽ phụ thuộc vào loại nhiên liệu đang sử dụng, mức tiêu thụ và điều kiện vận hành của từng nhà máy.',
  'In many cases, yes. LNG offers high combustion efficiency, stable heat output, and lower maintenance requirements compared to conventional fuels. Actual savings depend on your current fuel type, energy consumption, and operating conditions. LNG79 can perform an energy assessment to estimate your potential return on investment.'
),
(
  'lng-solution', 7,
  'Sau khi lắp đặt, LNG79 có tiếp tục hỗ trợ vận hành không?',
  'Does LNG79 provide support after project completion?',
  'Có. LNG79 cung cấp dịch vụ hậu mãi toàn diện bao gồm bảo trì định kỳ, kiểm tra hệ thống, hỗ trợ kỹ thuật, xử lý sự cố, đào tạo nhân sự vận hành và đảm bảo nguồn cung LNG liên tục trong suốt quá trình sử dụng.',
  'Absolutely. Our after-sales services include preventive maintenance, system inspections, technical support, emergency response, operator training, and continuous LNG supply to ensure your system operates safely and efficiently throughout its lifecycle.'
),
(
  'lng-solution', 8,
  'Nếu nhu cầu sử dụng khí tăng trong tương lai thì hệ thống có thể mở rộng không?',
  'Can the LNG system be expanded in the future?',
  'Có. Ngay từ giai đoạn thiết kế, LNG79 sẽ tính toán khả năng mở rộng công suất để doanh nghiệp có thể nâng cấp hệ thống khi sản lượng tăng mà không phải đầu tư lại toàn bộ.',
  'Yes. LNG79 designs systems with future scalability in mind. If your production capacity increases, the system can be upgraded or expanded with minimal disruption and without replacing the entire installation.'
),
(
  'lng-solution', 9,
  'Doanh nghiệp cần chuẩn bị gì trước khi triển khai dự án LNG?',
  'What information is required before starting an LNG project?',
  'Thông thường, doanh nghiệp chỉ cần cung cấp thông tin về mức tiêu thụ nhiên liệu hiện tại, loại thiết bị sử dụng, công suất vận hành và mặt bằng lắp đặt. Đội ngũ kỹ sư của LNG79 sẽ thực hiện khảo sát thực tế, đánh giá kỹ thuật và đề xuất giải pháp phù hợp.',
  'Typically, we require basic information such as your current fuel consumption, equipment specifications, production capacity, and available installation space. Our engineering team will then conduct a detailed site survey and recommend the most suitable LNG solution for your facility.'
),
(
  'lng-solution', 10,
  'Vì sao nên lựa chọn LNG79 làm đối tác triển khai giải pháp LNG?',
  'Why should we choose LNG79 as our LNG solutions partner?',
  'LNG79 cung cấp giải pháp EPC trọn gói từ tư vấn đến vận hành, với đội ngũ kỹ sư giàu kinh nghiệm trong lĩnh vực hệ thống khí công nghiệp. Chúng tôi cam kết giải pháp tối ưu về kỹ thuật, đảm bảo an toàn, tiến độ triển khai nhanh, nguồn cung LNG ổn định và dịch vụ hỗ trợ lâu dài sau khi dự án hoàn thành.',
  'LNG79 delivers comprehensive turnkey EPC LNG solutions, combining engineering expertise, high-quality equipment, professional installation, and dependable LNG supply. Our commitment to safety, technical excellence, on-time project delivery, and long-term customer support makes us a trusted partner for industrial energy transformation.'
);


-- ============================================================
-- SEED DATA: LPG Solution (lpg-solution) — 10 items
-- ============================================================
insert into public.solution_faqs (page_slug, sort_order, question_vi, question_en, answer_vi, answer_en) values
(
  'lpg-solution', 1,
  'Giải pháp LPG của LNG79 bao gồm những hạng mục nào?',
  'What does LNG79''s turnkey LPG solution include?',
  'LNG79 cung cấp giải pháp LPG trọn gói bao gồm khảo sát hiện trạng, tư vấn kỹ thuật, thiết kế hệ thống, cung cấp bồn chứa hoặc giàn bình, đường ống dẫn khí, thiết bị điều áp, lắp đặt, kiểm định, nghiệm thu, đào tạo vận hành và dịch vụ bảo trì định kỳ.',
  'LNG79 provides a complete LPG solution covering site assessment, engineering design, LPG storage tanks or cylinder manifolds, gas piping systems, pressure regulation equipment, installation, inspection, commissioning, operator training, and ongoing maintenance services.'
),
(
  'lpg-solution', 2,
  'Doanh nghiệp nào phù hợp để sử dụng hệ thống LPG?',
  'Which businesses are suitable for an LPG system?',
  'Hệ thống LPG phù hợp với nhà máy sản xuất, khách sạn, nhà hàng, bếp trung tâm, bệnh viện, trường học và nhiều cơ sở thương mại cần nguồn nhiên liệu sạch, ổn định và dễ triển khai.',
  'LPG systems are ideal for manufacturing plants, hotels, restaurants, central kitchens, hospitals, schools, and commercial facilities requiring a clean, reliable, and efficient energy source.'
),
(
  'lpg-solution', 3,
  'Nên lựa chọn bồn LPG hay hệ thống giàn bình LPG?',
  'Should we choose an LPG storage tank or a cylinder manifold system?',
  'Việc lựa chọn phụ thuộc vào mức tiêu thụ khí, diện tích lắp đặt và nhu cầu mở rộng trong tương lai. LNG79 sẽ khảo sát thực tế và tư vấn giải pháp phù hợp nhất nhằm tối ưu chi phí đầu tư và vận hành.',
  'The choice depends on gas consumption, available installation space, and future expansion plans. LNG79 evaluates your requirements and recommends the most cost-effective and efficient solution.'
),
(
  'lpg-solution', 4,
  'Hệ thống LPG có an toàn không?',
  'Is an LPG system safe?',
  'Có. Khi được thiết kế, lắp đặt và vận hành đúng tiêu chuẩn, hệ thống LPG có độ an toàn rất cao. LNG79 sử dụng thiết bị đạt tiêu chuẩn, tích hợp đầy đủ van an toàn, hệ thống điều áp và quy trình kiểm tra nghiêm ngặt trước khi đưa vào vận hành.',
  'Yes. When properly engineered, installed, and maintained, LPG systems are highly safe. LNG79 uses certified equipment, safety valves, pressure regulation systems, and comprehensive testing procedures before commissioning.'
),
(
  'lpg-solution', 5,
  'Mất bao lâu để triển khai một hệ thống LPG?',
  'How long does it take to install an LPG system?',
  'Tùy theo quy mô dự án, thời gian triển khai thường từ 2 đến 8 tuần, bao gồm thiết kế, cung cấp thiết bị, thi công, kiểm định và nghiệm thu.',
  'Depending on project size, most LPG installations are completed within 2 to 8 weeks, including engineering, equipment supply, installation, inspection, and commissioning.'
),
(
  'lpg-solution', 6,
  'LPG có giúp giảm chi phí năng lượng không?',
  'Can LPG help reduce energy costs?',
  'LPG mang lại hiệu suất đốt cao, nhiệt lượng ổn định và ít phát sinh cặn bẩn, giúp giảm chi phí bảo trì thiết bị. LNG79 sẽ phân tích mức tiêu thụ để đánh giá hiệu quả kinh tế cho từng doanh nghiệp.',
  'LPG offers high combustion efficiency, stable heat output, and cleaner operation, reducing equipment maintenance costs. LNG79 can assess your energy consumption and estimate the potential cost savings.'
),
(
  'lpg-solution', 7,
  'LNG79 có cung cấp LPG và dịch vụ bảo trì sau lắp đặt không?',
  'Does LNG79 provide LPG supply and maintenance services?',
  'Có. Ngoài việc thiết kế và lắp đặt hệ thống, LNG79 còn cung cấp LPG ổn định, bảo trì định kỳ, kiểm tra an toàn, hỗ trợ kỹ thuật và xử lý sự cố trong suốt quá trình vận hành.',
  'Yes. In addition to system design and installation, LNG79 provides reliable LPG supply, preventive maintenance, safety inspections, technical support, and emergency services throughout the system''s lifecycle.'
),
(
  'lpg-solution', 8,
  'Hệ thống LPG có thể mở rộng khi nhu cầu tăng không?',
  'Can the LPG system be expanded in the future?',
  'Có. Hệ thống được thiết kế với khả năng nâng cấp hoặc mở rộng công suất khi doanh nghiệp phát triển, giúp giảm chi phí đầu tư trong tương lai.',
  'Yes. Our LPG systems are designed with scalability in mind, allowing additional capacity or equipment to be integrated as your business grows.'
),
(
  'lpg-solution', 9,
  'Doanh nghiệp cần chuẩn bị gì trước khi lắp đặt hệ thống LPG?',
  'What information is required before installing an LPG system?',
  'Doanh nghiệp chỉ cần cung cấp thông tin về nhu cầu sử dụng khí, thiết bị tiêu thụ, mặt bằng lắp đặt và sản lượng vận hành. LNG79 sẽ thực hiện khảo sát thực tế và đề xuất phương án kỹ thuật phù hợp.',
  'We typically require information about your gas consumption, equipment, available installation area, and production requirements. Our engineering team will conduct a site survey and recommend the optimal solution.'
),
(
  'lpg-solution', 10,
  'Vì sao nên lựa chọn LNG79 cho dự án LPG?',
  'Why should we choose LNG79 for our LPG project?',
  'LNG79 sở hữu đội ngũ kỹ sư giàu kinh nghiệm trong lĩnh vực hệ thống khí công nghiệp và thương mại. Chúng tôi cung cấp giải pháp EPC trọn gói, thiết bị chất lượng cao, nguồn cung LPG ổn định và dịch vụ hậu mãi chuyên nghiệp, giúp doanh nghiệp vận hành an toàn và hiệu quả lâu dài.',
  'LNG79 has extensive experience in industrial and commercial gas systems. We deliver complete turnkey EPC solutions, premium-quality equipment, reliable LPG supply, and professional after-sales support to ensure safe, efficient, and long-term operation.'
);


-- ============================================================
-- SEED DATA: Burner Conversion (conversion) — 10 items
-- ============================================================
insert into public.solution_faqs (page_slug, sort_order, question_vi, question_en, answer_vi, answer_en) values
(
  'conversion', 1,
  'LNG79 cung cấp những loại đầu đốt nào?',
  'What types of burners does LNG79 supply?',
  'LNG79 cung cấp đa dạng đầu đốt sử dụng LPG, LNG và khí tự nhiên, phù hợp cho lò hơi, lò nung, lò sấy, buồng đốt và nhiều ứng dụng công nghiệp khác.',
  'LNG79 supplies a wide range of LPG, LNG, and natural gas burners for boilers, furnaces, ovens, dryers, and various industrial heating applications.'
),
(
  'conversion', 2,
  'Làm thế nào để lựa chọn đầu đốt phù hợp?',
  'How do I choose the right burner?',
  'Việc lựa chọn phụ thuộc vào công suất nhiệt, loại nhiên liệu, thiết bị hiện hữu và yêu cầu vận hành. Đội ngũ kỹ sư của LNG79 sẽ khảo sát và đề xuất giải pháp tối ưu cho từng ứng dụng.',
  'The selection depends on your required heat output, fuel type, existing equipment, and operating conditions. LNG79''s engineers will assess your application and recommend the most suitable burner.'
),
(
  'conversion', 3,
  'Đầu đốt có thể chuyển đổi giữa các loại nhiên liệu không?',
  'Can a burner be converted to use different fuels?',
  'Một số dòng đầu đốt có thể được thiết kế hoặc nâng cấp để vận hành với nhiều loại nhiên liệu như LPG, LNG hoặc khí tự nhiên. LNG79 sẽ tư vấn phương án phù hợp với hệ thống của bạn.',
  'Many burners can be configured or upgraded to operate with different gaseous fuels such as LPG, LNG, or natural gas. LNG79 will recommend the most appropriate conversion solution.'
),
(
  'conversion', 4,
  'Có cần thay toàn bộ lò hơi khi thay đầu đốt không?',
  'Do I need to replace my boiler when upgrading the burner?',
  'Không. Trong nhiều trường hợp, chỉ cần thay đầu đốt và điều chỉnh hệ thống điều khiển là có thể tiếp tục sử dụng thiết bị hiện có, giúp tiết kiệm đáng kể chi phí đầu tư.',
  'No. In many cases, only the burner and control system need to be upgraded, allowing you to continue using your existing boiler or furnace while reducing investment costs.'
),
(
  'conversion', 5,
  'Đầu đốt mới có giúp tiết kiệm nhiên liệu không?',
  'Can a new burner reduce fuel consumption?',
  'Có. Đầu đốt hiệu suất cao giúp tối ưu quá trình cháy, giảm tiêu hao nhiên liệu, tăng hiệu suất nhiệt và giảm lượng khí thải so với các đầu đốt cũ.',
  'Yes. High-efficiency burners optimize combustion, improve thermal efficiency, reduce fuel consumption, and lower emissions compared to older burner systems.'
),
(
  'conversion', 6,
  'Đầu đốt có đáp ứng tiêu chuẩn an toàn không?',
  'Are the burners equipped with safety features?',
  'Có. Các đầu đốt do LNG79 cung cấp được trang bị đầy đủ các tính năng an toàn như giám sát ngọn lửa, van ngắt tự động, hệ thống đánh lửa và điều khiển theo các tiêu chuẩn kỹ thuật quốc tế.',
  'Yes. LNG79''s burners include advanced safety features such as flame monitoring, automatic shut-off valves, ignition systems, and control units that comply with international safety standards.'
),
(
  'conversion', 7,
  'LNG79 có hỗ trợ lắp đặt và chạy thử đầu đốt không?',
  'Does LNG79 provide burner installation and commissioning?',
  'Có. Chúng tôi cung cấp dịch vụ lắp đặt, căn chỉnh, chạy thử, tối ưu quá trình đốt và đào tạo vận hành để đảm bảo hệ thống hoạt động ổn định ngay từ đầu.',
  'Yes. We provide installation, burner tuning, commissioning, combustion optimization, and operator training to ensure reliable and efficient system performance.'
),
(
  'conversion', 8,
  'Bao lâu nên bảo trì đầu đốt một lần?',
  'How often should a burner be serviced?',
  'Tần suất bảo trì phụ thuộc vào cường độ vận hành. Thông thường nên kiểm tra định kỳ từ 6 đến 12 tháng để duy trì hiệu suất, đảm bảo an toàn và kéo dài tuổi thọ thiết bị.',
  'Maintenance intervals depend on operating conditions. In most applications, a preventive inspection every 6 to 12 months is recommended to maintain efficiency, safety, and equipment lifespan.'
),
(
  'conversion', 9,
  'LNG79 có cung cấp linh kiện và dịch vụ sửa chữa không?',
  'Does LNG79 provide spare parts and repair services?',
  'Có. Chúng tôi cung cấp phụ tùng chính hãng, dịch vụ bảo trì, sửa chữa và thay thế linh kiện nhằm giảm thời gian dừng máy và đảm bảo hệ thống luôn hoạt động ổn định.',
  'Yes. We supply genuine spare parts, maintenance services, repairs, and component replacement to minimize downtime and ensure reliable operation.'
),
(
  'conversion', 10,
  'Vì sao nên lựa chọn đầu đốt từ LNG79?',
  'Why choose burners supplied by LNG79?',
  'LNG79 cung cấp các giải pháp đầu đốt chất lượng cao với hiệu suất vượt trội, khả năng tiết kiệm năng lượng, độ an toàn cao và dịch vụ kỹ thuật toàn diện từ tư vấn, lắp đặt đến bảo trì lâu dài.',
  'LNG79 delivers high-performance burner solutions that combine energy efficiency, operational safety, reliable performance, and comprehensive technical support—from engineering consultation and installation to long-term maintenance.'
);


-- ============================================================
-- SEED DATA: Commercial Kitchen (kitchen-solution) — 10 items
-- ============================================================
insert into public.solution_faqs (page_slug, sort_order, question_vi, question_en, answer_vi, answer_en) values
(
  'kitchen-solution', 1,
  'LNG79 cung cấp những thiết bị bếp inox chuyên nghiệp nào?',
  'What professional stainless steel kitchen equipment does LNG79 supply?',
  'LNG79 cung cấp đa dạng thiết bị bếp inox như bếp Á, bếp Âu, bếp công nghiệp, bàn inox, chậu rửa, tủ inox, hệ thống hút khói, quầy chế biến và các thiết bị được thiết kế theo yêu cầu.',
  'LNG79 supplies a comprehensive range of stainless steel kitchen equipment, including Asian and Western cooking ranges, commercial stoves, worktables, sinks, cabinets, exhaust hoods, preparation counters, and custom-fabricated equipment.'
),
(
  'kitchen-solution', 2,
  'LNG79 có thiết kế bếp theo yêu cầu không?',
  'Does LNG79 provide custom kitchen design?',
  'Có. Chúng tôi thiết kế và sản xuất thiết bị theo diện tích, quy trình vận hành và nhu cầu thực tế của từng khách hàng nhằm tối ưu không gian và hiệu quả làm việc.',
  'Yes. We design and manufacture stainless steel kitchen equipment based on your available space, workflow, and operational requirements to maximize efficiency and productivity.'
),
(
  'kitchen-solution', 3,
  'Thiết bị inox của LNG79 được làm từ vật liệu gì?',
  'What materials are used in LNG79''s stainless steel equipment?',
  'Thiết bị được sản xuất từ inox chất lượng cao như SUS304 hoặc các vật liệu phù hợp với từng ứng dụng, đảm bảo độ bền, khả năng chống ăn mòn và đáp ứng các tiêu chuẩn vệ sinh an toàn thực phẩm.',
  'Our equipment is manufactured using high-quality stainless steel, such as SUS304, or other suitable grades depending on the application, ensuring durability, corrosion resistance, and food safety compliance.'
),
(
  'kitchen-solution', 4,
  'Thiết bị bếp inox phù hợp với những lĩnh vực nào?',
  'Which industries are suitable for professional stainless steel kitchen equipment?',
  'Sản phẩm phù hợp cho nhà hàng, khách sạn, bếp trung tâm, nhà máy chế biến thực phẩm, bệnh viện, trường học, căng tin và các cơ sở dịch vụ ăn uống chuyên nghiệp.',
  'Our equipment is ideal for restaurants, hotels, central kitchens, food processing plants, hospitals, schools, cafeterias, and other commercial food service facilities.'
),
(
  'kitchen-solution', 5,
  'LNG79 có cung cấp giải pháp bếp trọn gói không?',
  'Does LNG79 provide complete commercial kitchen solutions?',
  'Có. Chúng tôi cung cấp giải pháp từ tư vấn, thiết kế mặt bằng, sản xuất thiết bị, lắp đặt, kết nối hệ thống gas, hút khói, cấp thoát nước đến nghiệm thu và bàn giao hoàn chỉnh.',
  'Yes. We deliver turnkey commercial kitchen solutions, including layout design, equipment manufacturing, installation, gas piping, ventilation, plumbing, commissioning, and final handover.'
),
(
  'kitchen-solution', 6,
  'Thiết bị có đáp ứng tiêu chuẩn vệ sinh an toàn thực phẩm không?',
  'Does the equipment meet food safety standards?',
  'Có. Thiết bị được thiết kế với bề mặt nhẵn, dễ vệ sinh, các góc bo hợp lý và sử dụng vật liệu đạt tiêu chuẩn, giúp đáp ứng các yêu cầu về vệ sinh và an toàn thực phẩm.',
  'Yes. Our equipment features smooth surfaces, hygienic construction, rounded edges, and food-grade materials that facilitate cleaning and comply with commercial food safety requirements.'
),
(
  'kitchen-solution', 7,
  'LNG79 có hỗ trợ lắp đặt và hướng dẫn sử dụng không?',
  'Does LNG79 provide installation and user training?',
  'Có. Đội ngũ kỹ thuật của LNG79 thực hiện lắp đặt, kiểm tra vận hành, hướng dẫn sử dụng và bàn giao hệ thống để đảm bảo thiết bị hoạt động đúng tiêu chuẩn.',
  'Yes. Our technical team handles installation, operational testing, user training, and system handover to ensure your kitchen equipment performs reliably from day one.'
),
(
  'kitchen-solution', 8,
  'Có thể mở rộng hoặc nâng cấp hệ thống bếp sau này không?',
  'Can the kitchen system be expanded in the future?',
  'Có. Các giải pháp của LNG79 được thiết kế với khả năng mở rộng linh hoạt, giúp doanh nghiệp dễ dàng bổ sung thiết bị khi quy mô hoạt động tăng lên.',
  'Yes. Our kitchen solutions are designed for scalability, allowing additional equipment or workstations to be integrated as your business grows.'
),
(
  'kitchen-solution', 9,
  'LNG79 có cung cấp dịch vụ bảo hành và bảo trì không?',
  'Does LNG79 provide warranty and maintenance services?',
  'Có. Chúng tôi cung cấp dịch vụ bảo hành, bảo trì định kỳ, sửa chữa và thay thế linh kiện nhằm đảm bảo thiết bị luôn hoạt động ổn định và bền bỉ.',
  'Yes. We offer warranty coverage, preventive maintenance, repair services, and replacement parts to ensure long-term performance and reliability.'
),
(
  'kitchen-solution', 10,
  'Vì sao nên lựa chọn thiết bị bếp inox chuyên nghiệp của LNG79?',
  'Why choose LNG79''s professional stainless steel kitchen equipment?',
  'LNG79 kết hợp kinh nghiệm thiết kế bếp công nghiệp với năng lực gia công inox chính xác, mang đến các giải pháp bền bỉ, thẩm mỹ, tối ưu quy trình vận hành và đáp ứng các tiêu chuẩn chất lượng cho bếp thương mại hiện đại.',
  'LNG79 combines commercial kitchen expertise with precision stainless steel fabrication to deliver durable, hygienic, and efficient solutions that enhance workflow and meet the highest standards for modern food service operations.'
);
