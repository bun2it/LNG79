import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Shield, ChevronDown, 
  HelpCircle, ArrowRight, Activity 
} from 'lucide-react';

interface SolutionsProps {
  subView: 'lng-solution' | 'lpg-solution' | 'conversion' | 'kitchen-solution';
  setView: (view: string) => void;
  pages?: any[];
  setPages?: React.Dispatch<React.SetStateAction<any[]>>;
  isVisualEditing?: boolean;
}

export const Solutions: React.FC<SolutionsProps> = ({ subView, setView, pages, setPages, isVisualEditing }) => {
  const { language, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const pageMap: { [key: string]: string } = {
    'lng-solution': 'p-2',
    'lpg-solution': 'p-3',
    'conversion': 'p-4',
    'kitchen-solution': 'p-5'
  };
  const pageId = pageMap[subView];
  const pageObj = pages?.find(p => p.id === pageId);

  const getSolutionField = (field: 'title' | 'subtitle' | 'desc') => {
    if (pageObj) {
      if (field === 'title') {
        return pageObj.title?.[language] || pageData[subView].title;
      }
      if (field === 'subtitle') {
        return pageObj.excerpt?.[language] || pageData[subView].subtitle[language];
      }
      if (field === 'desc') {
        return pageObj.content?.[language] || pageData[subView].desc[language];
      }
    }
    return field === 'title' ? pageData[subView].title : pageData[subView][field][language];
  };

  const setSolutionField = (field: 'title' | 'subtitle' | 'desc', val: string) => {
    if (setPages && pages) {
      const updated = pages.map((p: any) => {
        if (p.id === pageId) {
          if (field === 'title') {
            return { ...p, title: { ...(p.title || {}), [language]: val } };
          }
          if (field === 'subtitle') {
            return { ...p, excerpt: { ...(p.excerpt || {}), [language]: val } };
          }
          if (field === 'desc') {
            return { ...p, content: { ...(p.content || {}), [language]: val } };
          }
        }
        return p;
      });
      setPages(updated);
    }
  };

  const getSchematic = (): any[] => {
    return pageObj?.schematic || pageData[subView].schematic;
  };

  const getFaqs = (): any[] => {
    return pageObj?.faqs || pageData[subView].faqs;
  };

  const setSchematicField = (index: number, type: 'label' | 'desc', val: string) => {
    if (setPages && pages) {
      const currentSchematic = [...getSchematic()];
      currentSchematic[index] = {
        ...currentSchematic[index],
        [type]: {
          ...(currentSchematic[index][type] || {}),
          [language]: val
        }
      };
      const updated = pages.map((p: any) => {
        if (p.id === pageId) {
          return { ...p, schematic: currentSchematic };
        }
        return p;
      });
      setPages(updated);
    }
  };

  const setFaqField = (index: number, type: 'q' | 'a', val: string) => {
    if (setPages && pages) {
      const currentFaqs = [...getFaqs()];
      currentFaqs[index] = {
        ...currentFaqs[index],
        [type]: {
          ...(currentFaqs[index][type] || {}),
          [language]: val
        }
      };
      const updated = pages.map((p: any) => {
        if (p.id === pageId) {
          return { ...p, faqs: currentFaqs };
        }
        return p;
      });
      setPages(updated);
    }
  };

  const renderEditableText = (
    field: 'title' | 'subtitle' | 'desc',
    tagName: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div',
    extraStyle: React.CSSProperties = {}
  ) => {
    const Tag = tagName;
    const currentVal = getSolutionField(field);
    if (!isVisualEditing) {
      return <Tag style={extraStyle}>{currentVal}</Tag>;
    }
    return (
      <Tag
        contentEditable={true}
        suppressContentEditableWarning={true}
        onBlur={(e) => {
          const text = e.currentTarget.innerText;
          setSolutionField(field, text);
        }}
        style={{
          ...extraStyle,
          outline: 'none',
          border: '1px dashed var(--color-teal)',
          padding: '0.1rem 0.2rem',
          backgroundColor: 'rgba(13,148,136,0.05)',
          cursor: 'text'
        }}
      >
        {currentVal}
      </Tag>
    );
  };

  const handleNav = (view: string) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Localized Data based on subView
  const pageData = {
    'lng-solution': {
      title: t('lngTurnkey'),
      subtitle: { vi: 'Hệ thống bồn chứa hóa hơi và trạm điều áp khí tự nhiên hóa lỏng LNG hoàn chỉnh.', en: 'Complete cryogenic storage, vaporization, and pressure reduction system for Liquefied Natural Gas.' },
      desc: { 
        vi: 'Chúng tôi cung cấp giải pháp chìa khóa trao tay (turnkey) trọn gói cho trạm cấp khí LNG công nghiệp. Từ thiết kế kết cấu móng bồn, nhập khẩu bồn chứa siêu lạnh (-162°C), thiết bị hóa hơi dàn trao đổi nhiệt tự nhiên đến cụm công nghệ PRMS và kiểm định đưa vào vận hành.',
        en: 'We provide end-to-end turnkey engineering for industrial LNG regasification stations. Our scope covers storage tank civil works, importing high-vacuum cryogenic vessels (-162°C), ambient air vaporizers, PRMS skids, and authority approvals.'
      },
      schematic: [
        { label: { vi: '1. Xe bồn LNG', en: '1. LNG Tanker' }, desc: { vi: 'Vận chuyển LNG lỏng từ cảng/trạm đầu mối', en: 'Transports liquid LNG from import terminal' } },
        { label: { vi: '2. Trạm bơm nạp', en: '2. Unloading Skid' }, desc: { vi: 'Bơm nạp LNG lỏng từ xe vào bồn chứa', en: 'Transfers liquid LNG safely into bulk tank' } },
        { label: { vi: '3. Bồn chứa Cryo', en: '3. Cryogenic Tank' }, desc: { vi: 'Tồn chứa cách nhiệt chân không siêu lạnh', en: 'Vacuum insulated storage at -162°C' } },
        { label: { vi: '4. Bộ hóa hơi', en: '4. Vaporizer' }, desc: { vi: 'Hóa hơi LNG lỏng thành khí gas tự nhiên', en: 'Converts liquid LNG to gaseous natural gas' } },
        { label: { vi: '5. Cụm điều áp PRMS', en: '5. Regulating Skid' }, desc: { vi: 'Giảm áp suất và đo lưu lượng cung cấp', en: 'Regulates delivery pressure and measures flow' } },
        { label: { vi: '6. Đầu đốt lò hơi', en: '6. Boiler Burner' }, desc: { vi: 'Cấp gas sạch sinh nhiệt hiệu quả cao', en: 'Burns natural gas efficiently for thermal energy' } }
      ],
      faqs: [
        { q: { vi: 'Khi nào nhà máy nên đầu tư trạm khí LNG?', en: 'When should a factory invest in an LNG station?' }, a: { vi: 'Khi lượng tiêu thụ nhiên liệu lớn (tối thiểu 30-50 tấn LPG/tháng hoặc tương đương) và không nằm gần đường ống dẫn khí thấp áp của quốc gia.', en: 'When monthly fuel consumption is high (min 30-50 tons LPG equivalent) and there is no direct national natural gas pipeline access nearby.' } },
        { q: { vi: 'Diện tích tối thiểu cần thiết để xây trạm LNG?', en: 'What is the minimum land area required for LNG?' }, a: { vi: 'Một trạm tiêu chuẩn cần diện tích từ 150m² - 400m², đảm bảo khoảng cách an toàn cháy nổ (hành lang an toàn tối thiểu 15 mét từ bồn chứa đến công trình xung quanh).', en: 'A standard station requires 150sqm to 400sqm, satisfying safety clearance boundaries (minimum 15 meters buffer between tank and boundary fences).' } },
        { q: { vi: 'Thời gian thi công hoàn thành một trạm LNG?', en: 'How long does it take to deploy an LNG station?' }, a: { vi: 'Từ lúc thiết kế, thẩm duyệt PCCC, nhập thiết bị áp lực đến kiểm định chạy thử thường mất từ 4 - 6 tháng tùy theo thủ tục cấp phép xây dựng.', en: 'It takes 4 to 6 months including detailed engineering, fire department approvals, importing pressure vessels, installation, and final inspection.' } }
      ]
    },
    'lpg-solution': {
      title: t('lpgTurnkey'),
      subtitle: { vi: 'Hệ thống bồn gas công nghiệp, trạm cấp gas hóa hơi trung tâm cho nhà máy và các dự án thương mại.', en: 'Industrial LPG bulk storage, vaporization skids, and central gas manifolds for factories & commercial real estate.' },
      desc: {
        vi: 'Giải pháp cung cấp gas hóa lỏng LPG tối ưu hóa chi phí đầu tư. Chúng tôi lắp đặt hệ thống bồn chứa đặt nổi/đắp đất bảo vệ cao, hệ thống dàn góp chai gas (cylinder manifold) cho khu bếp thương mại, và hệ thống giám sát cảnh báo rò rỉ gas tự động tích hợp ngắt khẩn cấp.',
        en: 'Optimized LPG gas supply solutions for flexible industrial deployment. We install aboveground/mounded LPG storage tanks, high-pressure vaporizers, multi-cylinder manifold systems for commercial kitchens, and automatic leak-detection systems linked to safety shutdown valves.'
      },
      schematic: [
        { label: { vi: '1. Xe bồn LPG', en: '1. LPG Tanker' }, desc: { vi: 'Vận chuyển và nạp gas lỏng vào bồn', en: 'Delivers bulk LPG directly to site' } },
        { label: { vi: '2. Bồn chứa LPG', en: '2. LPG Bulk Tank' }, desc: { vi: 'Tồn chứa gas lỏng áp suất làm việc 18 bar', en: 'Stores LPG liquid under pressure (18 bar)' } },
        { label: { vi: '3. Bộ hóa hơi LPG', en: '3. LPG Vaporizer' }, desc: { vi: 'Tăng nhiệt độ hóa hơi gas cưỡng bức', en: 'Forces rapid liquid gas vaporization via hot water' } },
        { label: { vi: '4. Bộ điều áp cấp 1', en: '4. 1st-stage Regulator' }, desc: { vi: 'Hạ áp suất gas lỏng xuống áp trung thế', en: 'Reduces vapor pressure to medium levels' } },
        { label: { vi: '5. Hệ van ngắt tự động', en: '5. Safety Solenoid' }, desc: { vi: 'Tự động ngắt khẩn cấp khi phát hiện rò rỉ', en: 'Interlocks with gas detector to shut off instantly' } },
        { label: { vi: '6. Thiết bị sử dụng', en: '6. Gas Appliances' }, desc: { vi: 'Kết nối đầu đốt lò hơi, bếp nấu nhà hàng', en: 'Feeds clean gas to factory boiler or kitchen ranges' } }
      ],
      faqs: [
        { q: { vi: 'Hệ thống bồn chứa gas công nghiệp (LPG Bulk) khác gì với dàn chai gas?', en: 'How does LPG bulk storage differ from cylinder manifolds?' }, a: { vi: 'Bồn gas LPG Bulk phù hợp công suất nhiệt lớn (>3-5 tấn/tháng), tiết kiệm chi phí mua khí gas và công vận chuyển. Dàn góp chai gas (cylinder manifold) dùng cho quy mô vừa và nhỏ như nhà hàng khách sạn có diện tích chật hẹp.', en: 'LPG bulk storage is suited for large thermal loads (>3-5 tons/month) reducing gas unit prices. Cylinder manifolds are optimized for small to medium commercial kitchens with limited ground space.' } },
        { q: { vi: 'Hệ thống gas trung tâm có an toàn không?', en: 'Is a central gas pipeline system safe?' }, a: { vi: 'Cực kỳ an toàn nếu được lắp đầy đủ các thiết bị an toàn: Cảm biến phát hiện rò rỉ gas đặt tại điểm nối, tủ trung tâm báo động khẩn cấp, van điện từ tự động ngắt nguồn cấp gas chính khi có sự cố.', en: 'Extremely safe if installed with standard protection: gas sensors at critical connections, emergency alarm control panel, and main automatic shut-off solenoid valves.' } }
      ]
    },
    'conversion': {
      title: t('fuelConv'),
      subtitle: { vi: 'Dịch vụ cải tạo đầu đốt, chuyển đổi hệ thống đốt hơi từ dầu DO, dầu FO, than đá sang LNG/LPG sạch.', en: 'Burner retrofitting and industrial thermal system conversion from diesel, heavy fuel oil, or coal to clean LNG/LPG.' },
      desc: {
        vi: 'Hỗ trợ doanh nghiệp thực hiện mục tiêu Net-Zero carbon. Chúng tôi phân tích nhiệt trị hiện tại, khảo sát đầu đốt burner cũ, thiết kế phương án cải tiến béc phun gas và tích hợp hệ điều khiển tỉ lệ khí-nhiên liệu tự động giúp tăng hiệu suất đầu đốt lên 10-15%.',
        en: 'Supporting enterprises in achieving Net-Zero carbon targets. We analyze thermal demand, inspect current heavy fuel boilers, design burner head replacements, and integrate automated air-fuel ratio control units, boosting combustion efficiency by 10-15%.'
      },
      schematic: [
        { label: { vi: '1. Phân tích nhiệt trị', en: '1. Thermal Analysis' }, desc: { vi: 'Tính toán hiệu suất đốt hơi thực tế', en: 'Calculate existing boiler heat output' } },
        { label: { vi: '2. Đánh giá lò hơi', en: '2. Boiler Assessment' }, desc: { vi: 'Kiểm tra cấu tạo buồng đốt, đầu đốt cũ', en: 'Inspect furnace combustion space and burner' } },
        { label: { vi: '3. Thiết kế trạm gas', en: '3. Gas Station Design' }, desc: { vi: 'Bố trí trạm chứa và đường khí dẫn lò hơi', en: 'Plan gas storage and piping layout' } },
        { label: { vi: '4. Cải tạo đầu đốt', en: '4. Burner Retrofit' }, desc: { vi: 'Thay đầu kim phun gas, lắp van an toàn khí', en: 'Install gas nozzles and safety train valves' } },
        { label: { vi: '5. Lập trình PLC', en: '5. PLC Integration' }, desc: { vi: 'Điều khiển tự động lưu lượng khí và oxy', en: 'Program automated air-gas ratio controls' } },
        { label: { vi: '6. Vận hành xanh', en: '6. Eco Operation' }, desc: { vi: 'Chạy thử hơi đạt công suất, giảm khói bụi', en: 'Start steam generation with zero soot emission' } }
      ],
      faqs: [
        { q: { vi: 'Tại sao chuyển đổi sang gas lại tiết kiệm chi phí hơn?', en: 'Why is converting to gas more cost-effective?' }, a: { vi: 'LNG/LPG có nhiệt trị cao và hiệu suất cháy triệt để (>90% so với 65-75% của lò than/dầu). Do đó lượng tiêu hao năng lượng thực tế giảm, đồng thời giảm chi phí bảo trì buồng đốt do không bám muội than.', en: 'LNG/LPG offers higher thermal value and complete combustion efficiency (>90% vs 65-75% for coal/FO). This reduces total heat consumption and boiler maintenance costs as there is no ash or soot buildup.' } },
        { q: { vi: 'Có cần thay thế hoàn toàn lò hơi cũ không?', en: 'Do I need to replace the entire boiler?' }, a: { vi: 'Không cần. Hầu hết các lò hơi ghi xích, lò hơi dầu chỉ cần cải tạo/thay thế cụm đầu đốt (burner conversion) và lắp đặt trạm cấp gas bên ngoài, giữ nguyên cấu trúc thân lò hơi để tối ưu chi phí đầu tư.', en: 'No. Most oil or chain grate boilers only require burner conversion (retrofit) and installing the external gas station, keeping the pressure vessel hull to minimize capital expenditure.' } }
      ]
    },
    'kitchen-solution': {
      title: t('commKitchen'),
      subtitle: { vi: 'Tư vấn layout, thiết kế hệ thống gas trung tâm, hút mùi và phân phối thiết bị bếp inox công nghiệp.', en: 'Commercial kitchen layouts, central gas manifolds, exhaust hoods, and stainless steel catering equipment.' },
      desc: {
        vi: 'Giải pháp bếp công nghiệp đồng bộ một đầu mối chịu trách nhiệm. Thiết kế phân khu một chiều (Kho hàng -> Sơ chế -> Nấu nướng -> Ra món -> Rửa dọn) tránh nhiễm khuẩn chéo, tính toán đường ống hút khói giảm ồn và lắp đặt hệ thống đường ống dẫn gas đạt chuẩn an toàn PCCC.',
        en: 'Integrated single-point responsibility commercial kitchen projects. We design professional one-way layouts (Storage -> Prep -> Cooking -> Service -> Wash) to prevent cross-contamination, calculate low-noise exhaust systems, and route commercial gas pipelines conforming to international building codes.'
      },
      schematic: [
        { label: { vi: '1. Quy trình 1 chiều', en: '1. One-way Layout' }, desc: { vi: 'Bố trí phân khu bếp tránh chéo luồng', en: 'Avoid cross-flow in kitchen operations' } },
        { label: { vi: '2. Lắp đặt Gas trung tâm', en: '2. Gas Manifold' }, desc: { vi: 'Hệ thống van góp, ống dẫn đúc không hàn', en: 'Seamless high-pressure central gas piping' } },
        { label: { vi: '3. Thiết bị bếp Inox', en: '3. Cooking Equipment' }, desc: { vi: 'Cung cấp bếp Á bếp Âu inox 304 cao cấp', en: 'Heavy-duty SUS304 cookers and burners' } },
        { label: { vi: '4. Hệ thống hút khói', en: '4. Exhaust Hood' }, desc: { vi: 'Quạt hút ly tâm cách âm, lọc dầu mỡ', en: 'Soundproofed extraction fans with oil grease filters' } },
        { label: { vi: '5. Cảm biến rò rỉ gas', en: '5. Leak Detection' }, desc: { vi: 'Đặt cảm biến cạnh thiết bị đun nấu', en: 'Install gas leak alarms near cooker ranges' } },
        { label: { vi: '6. Nghiệm thu bàn giao', en: '6. Commissioning' }, desc: { vi: 'Chạy thử bếp lửa xanh và bàn giao đào tạo', en: 'Test cookers and train culinary staff' } }
      ],
      faqs: [
        { q: { vi: 'Quy trình một chiều trong bếp công nghiệp là gì?', en: 'What is the one-way process in commercial kitchens?' }, a: { vi: 'Là nguyên tắc sắp xếp các phân khu trong bếp theo một chiều liên tục từ khâu nguyên liệu thô nhập kho, sơ chế, chế biến nấu nướng đến khâu trình bày món và dọn rửa, đảm bảo luồng thực phẩm chín không bao giờ đi ngược qua khu thực phẩm sống.', en: 'It is a layout principle where food moves in a straight sequence from raw delivery, prep, cooking, staging to dishwashing. This ensures prepared food never crosses paths with raw materials, preventing biological contamination.' } }
      ]
    }
  };

  const data = pageData[subView];

  return (
    <div style={{ width: '100%' }}>
      {/* Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <div className="container" style={styles.bannerContainer}>
          <span style={styles.bannerTag}>{language === 'vi' ? 'Phạm vi Kỹ thuật EPC' : 'EPC Scope of Engineering'}</span>
          {renderEditableText('title', 'h1', { fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' })}
          {renderEditableText('subtitle', 'p', { fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', margin: 0 })}
        </div>
      </section>

      {/* Main Content Details */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container solutions-content-grid">
          {/* Detailed text */}
          <div style={styles.descCol}>
            <h3 style={styles.sectionHeader}>{language === 'vi' ? 'Giải Pháp Chìa Khóa Trao Tay' : 'Turnkey Engineering Scope'}</h3>
            {renderEditableText('desc', 'p', { color: 'var(--color-text-main)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' })}
            <div style={styles.capabilityBadgeBox}>
              <div style={styles.capBadge}>
                <Shield size={18} color="var(--color-teal)" />
                <span>{language === 'vi' ? 'Tiêu chuẩn ASME VIII Div.1 & EN 13445' : 'ASME VIII Div.1 & EN 13445 Standards'}</span>
              </div>
              <div style={styles.capBadge}>
                <Activity size={18} color="var(--color-teal)" />
                <span>{language === 'vi' ? 'Nghiệm thu an toàn PCCC cấp tỉnh' : 'Provincial fire safety certificates'}</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => handleNav('contact')} style={{ marginTop: '2rem' }}>
              {language === 'vi' ? 'Liên hệ nhận báo giá trọn gói' : 'Request Turnkey Quote'}
            </button>
          </div>

          {/* Sizing & Quick Specs Panel */}
          <div style={styles.infoCol}>
            <div style={styles.infoCard}>
              <h4 style={{ color: 'var(--color-white)', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-navy-accent)', paddingBottom: '0.75rem', fontSize: '1.1rem' }}>
                {language === 'vi' ? 'Hạng mục thiết bị chính' : 'Primary Equipment Scope'}
              </h4>
              <ul style={styles.infoList}>
                {subView === 'lng-solution' && (
                  <>
                    <li>🔹 Cryogenic Tank (Double-walled, Vacuum + Perlite)</li>
                    <li>🔹 Ambient Air Vaporizer (Aluminum star-fin tube)</li>
                    <li>🔹 Pressure Regulating & Metering Station (PRMS)</li>
                    <li>🔹 ESD System (Pneumatic emergency shut-off valves)</li>
                    <li>🔹 SCADA / PLC Automation Control Panels</li>
                  </>
                )}
                {subView === 'lpg-solution' && (
                  <>
                    <li>🔹 LPG Storage Tanks (10m³ - 100m³, above/underground)</li>
                    <li>🔹 Hot water / Electric LPG Vaporizers</li>
                    <li>🔹 Primary and secondary stage pressure regulators</li>
                    <li>🔹 Gas manifold station with safety non-return valves</li>
                    <li>🔹 Central gas monitoring panel & Solenoid shut-off</li>
                  </>
                )}
                {subView === 'conversion' && (
                  <>
                    <li>🔹 Multi-fuel gas burners (Weishaupt, Riello, Oilon)</li>
                    <li>🔹 Valve train skid (Double safety block solenoid valves)</li>
                    <li>🔹 Oxygen & carbon trim efficiency control units</li>
                    <li>🔹 Gas flow metering skids & safety venting stacks</li>
                    <li>🔹 Furnace draft damper controllers</li>
                  </>
                )}
                {subView === 'kitchen-solution' && (
                  <>
                    <li>🔹 Custom commercial gas ranges (Á-Âu burners)</li>
                    <li>🔹 Sound-attenuated exhaust canopy hoods</li>
                    <li>🔹 Stainless steel worktables, sinks & shelving</li>
                    <li>🔹 Industrial reach-in/undercounter chillers & freezers</li>
                    <li>🔹 Central gas manifold piping & gas sensor controls</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Process Flow Chart */}
      <section className="section" style={{ backgroundColor: 'var(--color-gray-bg)', borderTop: '1px solid var(--color-gray-border)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{language === 'vi' ? 'Sơ Đồ Quy Trình Công Nghệ' : 'Engineering Flow Schematic'}</h2>
            <p className="section-subtitle">{language === 'vi' ? 'Quy trình vận chuyển, công nghệ tồn trữ khí và cấp nhiên liệu cho lò đốt.' : 'The supply chain, storage technology, and fuel delivery process.'}</p>
          </div>

          <div className="solutions-flow-container">
            {getSchematic().map((step, index) => (
              <React.Fragment key={index}>
                <div className="solutions-flow-step-card">
                  <div style={styles.flowNum}>{index + 1}</div>
                  {isVisualEditing ? (
                    <h4
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setSchematicField(index, 'label', e.currentTarget.innerText)}
                      style={{ ...styles.flowTitle, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {step.label[language]}
                    </h4>
                  ) : (
                    <h4 style={styles.flowTitle}>{step.label[language]}</h4>
                  )}
                  {isVisualEditing ? (
                    <p
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setSchematicField(index, 'desc', e.currentTarget.innerText)}
                      style={{ ...styles.flowDesc, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {step.desc[language]}
                    </p>
                  ) : (
                    <p style={styles.flowDesc}>{step.desc[language]}</p>
                  )}
                </div>
                {index < data.schematic.length - 1 && (
                  <div className="solutions-flow-arrow">
                    <ArrowRight size={24} color="var(--color-teal)" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="section-title-wrap">
            <h2 className="section-title">{language === 'vi' ? 'Câu Hỏi Thường Gặp' : 'Technical FAQ'}</h2>
            <p className="section-subtitle">{language === 'vi' ? 'Giải đáp các thắc mắc về tiêu chuẩn an toàn, diện tích bồn chứa và vận hành.' : 'Answers regarding safety regulations, tank capacities, and operations.'}</p>
          </div>

          <div style={styles.faqList}>
            {getFaqs().map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={styles.faqCard}>
                  <button onClick={() => toggleFaq(idx)} style={styles.faqHeader}>
                    <HelpCircle size={18} color="var(--color-teal)" style={{ flexShrink: 0 }} />
                    {isVisualEditing ? (
                      <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => setFaqField(idx, 'q', e.currentTarget.innerText)}
                        style={{ ...styles.faqQuestion, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                      >
                        {faq.q[language]}
                      </span>
                    ) : (
                      <span style={styles.faqQuestion}>{faq.q[language]}</span>
                    )}
                    <ChevronDown size={18} style={{
                      marginLeft: 'auto',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform var(--transition-fast)'
                    }} />
                  </button>
                  {isOpen && (
                    <div style={styles.faqAnswer} className="animate-fade-in">
                      {isVisualEditing ? (
                        <p
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => setFaqField(idx, 'a', e.currentTarget.innerText)}
                          style={{ outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                        >
                          {faq.a[language]}
                        </p>
                      ) : (
                        <p>{faq.a[language]}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=2070&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '6rem 0 5rem',
    color: 'var(--color-white)',
    textAlign: 'left',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    zIndex: 1,
  },
  bannerContainer: {
    position: 'relative',
    zIndex: 2,
  },
  bannerTag: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--color-teal)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
    display: 'block',
  },
  bannerTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
    fontFamily: 'var(--font-heading)',
  },
  bannerSubtitle: {
    fontSize: '1.15rem',
    opacity: 0.85,
    maxWidth: '800px',
  },

  descCol: {
    textAlign: 'left',
  },
  sectionHeader: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: '1rem',
  },
  descParagraph: {
    fontSize: '1.05rem',
    lineHeight: 1.7,
    color: 'var(--color-text-main)',
    marginBottom: '1.5rem',
  },
  capabilityBadgeBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  capBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'var(--color-gray-bg)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-gray-border)',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-navy)',
  },
  infoCol: {
    textAlign: 'left',
  },
  infoCard: {
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-text-light)',
    padding: '2rem',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-md)',
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    fontSize: '0.85rem',
  },


  flowNum: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-teal)',
    color: 'var(--color-white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 700,
    margin: '0 auto 0.75rem',
  },
  flowTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: '0.4rem',
  },
  flowDesc: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.4,
  },

  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'left',
  },
  faqCard: {
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--color-gray-card)',
    overflow: 'hidden',
  },
  faqHeader: {
    width: '100%',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'var(--color-navy)',
    fontWeight: 600,
    fontSize: '1rem',
  },
  faqQuestion: {
    flex: 1,
  },
  faqAnswer: {
    padding: '0 1.5rem 1.25rem 3.25rem',
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
    lineHeight: 1.6,
    borderTop: '1px solid var(--color-gray-border)',
    paddingTop: '1rem',
  }
};
// Export the component
