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

export const SOLUTIONS_PAGE_DATA: Record<string, { title: { vi: string; en: string }; subtitle: { vi: string; en: string }; desc: { vi: string; en: string }; schematic: any[]; faqs: any[]; equipment: any[] }> = {
  'lng-solution': {
    title: { vi: 'Giải pháp trọn gói LNG', en: 'LNG Turnkey Solutions' },
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
      {
        q: {
          vi: 'Giải pháp LNG trọn gói của LNG79 bao gồm những hạng mục nào?',
          en: "What does LNG79's turnkey LNG solution include?"
        },
        a: {
          vi: 'Giải pháp trọn gói của LNG79 bao gồm toàn bộ quy trình từ khảo sát hiện trạng, tư vấn kỹ thuật, thiết kế hệ thống, cung cấp thiết bị, thi công lắp đặt, kiểm định, nghiệm thu, đào tạo vận hành đến bảo trì định kỳ và đảm bảo nguồn cung LNG ổn định.',
          en: 'LNG79 provides a complete turnkey solution covering every stage of the project, including site assessment, engineering design, equipment supply, installation, commissioning, operator training, preventive maintenance, and a reliable LNG supply to ensure long-term operational efficiency.'
        }
      },
      {
        q: {
          vi: 'Doanh nghiệp nào phù hợp để chuyển sang sử dụng LNG?',
          en: 'Which industries are suitable for LNG conversion?'
        },
        a: {
          vi: 'LNG phù hợp với các nhà máy có nhu cầu sử dụng nhiệt lớn như chế biến thực phẩm, dệt nhuộm, giấy, gốm sứ, luyện kim, hóa chất, sản xuất vật liệu xây dựng và các ngành đang sử dụng FO, Diesel, LPG hoặc than làm nhiên liệu.',
          en: 'LNG is an ideal energy solution for industries with significant thermal energy demand, including food processing, textiles, ceramics, metallurgy, chemicals, paper manufacturing, construction materials, and facilities currently using fuel oil (FO), diesel, LPG, or coal.'
        }
      },
      {
        q: {
          vi: 'Chuyển đổi từ FO, Diesel hoặc than sang LNG có phải thay toàn bộ hệ thống không?',
          en: 'Do we need to replace our entire system when converting to LNG?'
        },
        a: {
          vi: 'Không nhất thiết. Phần lớn các lò hơi, lò nung hoặc thiết bị đốt hiện hữu đều có thể được cải tạo hoặc thay đầu đốt để sử dụng LNG. LNG79 sẽ khảo sát và đưa ra phương án tối ưu nhằm tận dụng tối đa thiết bị hiện có, giúp giảm chi phí đầu tư.',
          en: 'Not necessarily. Most existing boilers, furnaces, and thermal equipment can be retrofitted by upgrading or replacing the burner system. LNG79 evaluates your current infrastructure and recommends the most cost-effective conversion approach while maximizing the use of existing assets.'
        }
      },
      {
        q: {
          vi: 'LNG có an toàn khi sử dụng trong nhà máy không?',
          en: 'Is LNG safe for industrial applications?'
        },
        a: {
          vi: 'Có. LNG được lưu trữ trong bồn chuyên dụng ở nhiệt độ thấp và được thiết kế theo các tiêu chuẩn kỹ thuật nghiêm ngặt. Khi được thiết kế, lắp đặt và vận hành đúng quy trình, hệ thống LNG có độ an toàn rất cao. LNG79 tuân thủ đầy đủ các tiêu chuẩn về thiết kế, kiểm định và an toàn vận hành.',
          en: 'Yes. LNG is stored in specially designed cryogenic tanks and handled under strict engineering and safety standards. When properly designed, installed, and operated, LNG systems provide a highly reliable and safe energy solution. LNG79 follows all applicable technical standards and safety regulations throughout every project.'
        }
      },
      {
        q: {
          vi: 'Thời gian triển khai một dự án LNG thường mất bao lâu?',
          en: 'How long does it take to complete an LNG project?'
        },
        a: {
          vi: 'Tùy theo quy mô dự án, thời gian triển khai thường từ 6 đến 16 tuần, bao gồm khảo sát, thiết kế, sản xuất hoặc nhập thiết bị, thi công lắp đặt, chạy thử và bàn giao vận hành.',
          en: 'Project timelines depend on the size and complexity of the installation. Most turnkey LNG projects are completed within 6 to 16 weeks, covering engineering, equipment procurement, installation, commissioning, and final handover.'
        }
      },
      {
        q: {
          vi: 'LNG có giúp doanh nghiệp tiết kiệm chi phí nhiên liệu không?',
          en: 'Can LNG help reduce energy costs?'
        },
        a: {
          vi: 'Trong nhiều trường hợp, LNG giúp doanh nghiệp tối ưu chi phí năng lượng nhờ hiệu suất đốt cao, quá trình cháy ổn định và giảm chi phí bảo trì thiết bị. Mức tiết kiệm cụ thể sẽ phụ thuộc vào loại nhiên liệu đang sử dụng, mức tiêu thụ và điều kiện vận hành của từng nhà máy.',
          en: 'In many cases, yes. LNG offers high combustion efficiency, stable heat output, and lower maintenance requirements compared to conventional fuels. Actual savings depend on your current fuel type, energy consumption, and operating conditions. LNG79 can perform an energy assessment to estimate your potential return on investment.'
        }
      },
      {
        q: {
          vi: 'Sau khi lắp đặt, LNG79 có tiếp tục hỗ trợ vận hành không?',
          en: 'Does LNG79 provide support after project completion?'
        },
        a: {
          vi: 'Có. LNG79 cung cấp dịch vụ hậu mãi toàn diện bao gồm bảo trì định kỳ, kiểm tra hệ thống, hỗ trợ kỹ thuật, xử lý sự cố, đào tạo nhân sự vận hành và đảm bảo nguồn cung LNG liên tục trong suốt quá trình sử dụng.',
          en: 'Absolutely. Our after-sales services include preventive maintenance, system inspections, technical support, emergency response, operator training, and continuous LNG supply to ensure your system operates safely and efficiently throughout its lifecycle.'
        }
      },
      {
        q: {
          vi: 'Nếu nhu cầu sử dụng khí tăng trong tương lai thì hệ thống có thể mở rộng không?',
          en: 'Can the LNG system be expanded in the future?'
        },
        a: {
          vi: 'Có. Ngay từ giai đoạn thiết kế, LNG79 sẽ tính toán khả năng mở rộng công suất để doanh nghiệp có thể nâng cấp hệ thống khi sản lượng tăng mà không phải đầu tư lại toàn bộ.',
          en: 'Yes. LNG79 designs systems with future scalability in mind. If your production capacity increases, the system can be upgraded or expanded with minimal disruption and without replacing the entire installation.'
        }
      },
      {
        q: {
          vi: 'Doanh nghiệp cần chuẩn bị gì trước khi triển khai dự án LNG?',
          en: 'What information is required before starting an LNG project?'
        },
        a: {
          vi: 'Thông thường, doanh nghiệp chỉ cần cung cấp thông tin về mức tiêu thụ nhiên liệu hiện tại, loại thiết bị sử dụng, công suất vận hành và mặt bằng lắp đặt. Đội ngũ kỹ sư của LNG79 sẽ thực hiện khảo sát thực tế, đánh giá kỹ thuật và đề xuất giải pháp phù hợp.',
          en: 'Typically, we require basic information such as your current fuel consumption, equipment specifications, production capacity, and available installation space. Our engineering team will then conduct a detailed site survey and recommend the most suitable LNG solution for your facility.'
        }
      },
      {
        q: {
          vi: 'Vì sao nên lựa chọn LNG79 làm đối tác triển khai giải pháp LNG?',
          en: 'Why should we choose LNG79 as our LNG solutions partner?'
        },
        a: {
          vi: 'LNG79 cung cấp giải pháp EPC trọn gói từ tư vấn đến vận hành, với đội ngũ kỹ sư giàu kinh nghiệm trong lĩnh vực hệ thống khí công nghiệp. Chúng tôi cam kết giải pháp tối ưu về kỹ thuật, đảm bảo an toàn, tiến độ triển khai nhanh, nguồn cung LNG ổn định và dịch vụ hỗ trợ lâu dài sau khi dự án hoàn thành.',
          en: 'LNG79 delivers comprehensive turnkey EPC LNG solutions, combining engineering expertise, high-quality equipment, professional installation, and dependable LNG supply. Our commitment to safety, technical excellence, on-time project delivery, and long-term customer support makes us a trusted partner for industrial energy transformation.'
        }
      }
    ],
    equipment: [
      { vi: 'Bồn chứa lỏng siêu lạnh (2 lớp, cách nhiệt chân không)', en: 'Cryogenic Tank (Double-walled, Vacuum + Perlite)' },
      { vi: 'Thiết bị hóa hơi dàn trao đổi nhiệt tự nhiên (Hợp kim nhôm cánh sao)', en: 'Ambient Air Vaporizer (Aluminum star-fin tube)' },
      { vi: 'Cụm điều áp và đo lưu lượng khí gas (PRMS)', en: 'Pressure Regulating & Metering Station (PRMS)' },
      { vi: 'Hệ thống ESD (Van ngắt khẩn cấp khí nén)', en: 'ESD System (Pneumatic emergency shut-off valves)' },
      { vi: 'Tủ điều khiển tự động SCADA / PLC', en: 'SCADA / PLC Automation Control Panels' }
    ]
  },
  'lpg-solution': {
    title: { vi: 'Giải pháp trọn gói LPG', en: 'LPG Turnkey Solutions' },
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
    faqs: [],
    equipment: [
      { vi: 'Bồn chứa gas LPG (10m³ - 100m³, đặt nổi/đắp đất)', en: 'LPG Storage Tanks (10m³ - 100m³, above/underground)' },
      { vi: 'Thiết bị hóa hơi gas LPG (nước nóng / điện)', en: 'Hot water / Electric LPG Vaporizers' },
      { vi: 'Thiết bị điều áp gas cấp 1 và cấp 2', en: 'Primary and secondary stage pressure regulators' },
      { vi: 'Dàn góp chai gas với van chặn một chiều an toàn', en: 'Gas manifold station with safety non-return valves' },
      { vi: 'Tủ cảnh báo gas trung tâm & Van điện từ tự động ngắt', en: 'Central gas monitoring panel & Solenoid shut-off' }
    ]
  },
  'conversion': {
    title: { vi: 'Cải tạo đầu đốt chuyển đổi nhiên liệu', en: 'Fuel Burner Conversion Solutions' },
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
    faqs: [],
    equipment: [
      { vi: 'Đầu đốt đa nhiên liệu (Weishaupt, Riello, Oilon)', en: 'Multi-fuel gas burners (Weishaupt, Riello, Oilon)' },
      { vi: 'Cụm van an toàn valve train (Van điện từ kép block solenoid)', en: 'Valve train skid (Double safety block solenoid valves)' },
      { vi: 'Thiết bị kiểm soát hiệu suất buồng đốt oxy & carbon', en: 'Oxygen & carbon trim efficiency control units' },
      { vi: 'Cụm đo lưu lượng gas & Trụ xả khí an toàn', en: 'Gas flow metering skids & safety venting stacks' },
      { vi: 'Thiết bị điều khiển áp suất buồng đốt lò hơi', en: 'Furnace draft damper controllers' }
    ]
  },
  'kitchen-solution': {
    title: { vi: 'Thiết kế bếp và Central gas', en: 'Commercial Kitchen & Central Gas' },
    subtitle: { vi: 'Tư vấn layout, thiết kế hệ thống gas trung tâm, hút mùi và phân phối thiết bị bếp inox công nghiệp.', en: 'Commercial kitchen layouts, central gas manifolds, exhaust hoods, and stainless steel catering equipment.' },
    desc: {
      vi: 'Giải pháp bếp công nghiệp đồng bộ một đầu mối chịu trách nhiệm. Thiết kế phân khu một chiều (Kho hàng -> Sơ chế -> Nấu nướng -> Ra món -> Rửa dọn) tránh nhiễm khuẩn chéo, tính toán đường ống hút khói giảm ồn và lắp đặt hệ thống đường ống dẫn gas đạt chuẩn an toàn PCCC.',
      en: 'Commercial kitchen systems with single-point EPC model. We design layout (Warehouse -> Prep -> Cooking -> Serving -> Dishwashing) to prevent biological cross-contamination, integrate ventilation/hoods, and install certified gas pipelines.'
    },
    schematic: [
      { label: { vi: '1. Quy trình 1 chiều', en: '1. One-way Layout' }, desc: { vi: 'Bố trí phân khu bếp tránh chéo luồng', en: 'Avoid cross-flow in kitchen operations' } },
      { label: { vi: '2. Lắp đặt Gas trung tâm', en: '2. Gas Manifold' }, desc: { vi: 'Hệ thống van góp, ống dẫn đúc không hàn', en: 'Seamless high-pressure central gas piping' } },
      { label: { vi: '3. Thiết bị bếp Inox', en: '3. Cooking Equipment' }, desc: { vi: 'Cung cấp bếp Á bếp Âu inox 304 cao cấp', en: 'Heavy-duty SUS304 cookers and burners' } },
      { label: { vi: '4. Hệ thống hút khói', en: '4. Exhaust Hood' }, desc: { vi: 'Quạt hút ly tâm cách âm, lọc dầu mỡ', en: 'Soundproofed extraction fans with oil grease filters' } },
      { label: { vi: '5. Cảm biến rò rỉ gas', en: '5. Leak Detection' }, desc: { vi: 'Đặt cảm biến cạnh thiết bị đun nấu', en: 'Install gas leak alarms near cooker ranges' } },
      { label: { vi: '6. Nghiệm thu bàn giao', en: '6. Commissioning' }, desc: { vi: 'Chạy thử bếp lửa xanh và bàn giao đào tạo', en: 'Test cookers and train culinary staff' } }
    ],
    faqs: [],
    equipment: [
      { vi: 'Bếp gas công nghiệp (bếp Á, bếp Âu và bếp theo yêu cầu)', en: 'Custom commercial gas ranges (Á-Âu burners)' },
      { vi: 'Chụp hút khói công nghiệp tích hợp tiêu âm, giảm tiếng ồn', en: 'Sound-attenuated exhaust canopy hoods' },
      { vi: 'Bàn thao tác inox, chậu rửa, kệ inox và thiết bị sơ chế', en: 'Stainless steel worktables, sinks & shelving' },
      { vi: 'Tủ mát, tủ đông công nghiệp (dạng đứng và âm bàn)', en: 'Industrial reach-in/undercounter chillers & freezers' },
      { vi: 'Hệ thống gas trung tâm, đường ống cấp gas và cảm biến cảnh báo rò rỉ gas', en: 'Central gas manifold piping & gas sensor controls' }
    ]
  }
};

export const Solutions: React.FC<SolutionsProps> = ({ subView, setView, pages, setPages, isVisualEditing }) => {
  const { language } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const pageMap: { [key: string]: string } = {
    'lng-solution': 'p-2',
    'lpg-solution': 'p-3',
    'conversion': 'p-4',
    'kitchen-solution': 'p-5'
  };
  const pageId = pageMap[subView];
  const pageObj = pages?.find(p => p.id === pageId);
  const pageData = SOLUTIONS_PAGE_DATA;

  const getSolutionField = (field: 'title' | 'subtitle' | 'desc') => {
    if (pageObj) {
      if (field === 'title') {
        return pageObj.title?.[language] || pageData[subView].title[language];
      }
      if (field === 'subtitle') {
        return pageObj.excerpt?.[language] || pageData[subView].subtitle[language];
      }
      if (field === 'desc') {
        return pageObj.content?.[language] || pageData[subView].desc[language];
      }
    }
    return pageData[subView][field][language];
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

  const getEquipment = (): any[] => {
    return pageObj?.equipment || pageData[subView].equipment;
  };

  const setEquipmentField = (index: number, val: string) => {
    if (setPages && pages) {
      const currentEquipment = [...getEquipment()];
      currentEquipment[index] = {
        ...(currentEquipment[index] || {}),
        [language]: val
      };
      const updated = pages.map((p: any) => {
        if (p.id === pageId) {
          return { ...p, equipment: currentEquipment };
        }
        return p;
      });
      setPages(updated);
    }
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
    const contentKey = `${subView}.${field}`;
    if (!isVisualEditing) {
      return <Tag data-content-key={contentKey} style={extraStyle}>{currentVal}</Tag>;
    }
    return (
      <Tag
        data-content-key={contentKey}
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

  const data = pageData[subView];

  return (
    <div style={{ width: '100%' }}>
      {/* Banner */}
      <section style={{
        ...styles.banner,
        backgroundImage: pageObj?.bannerImage ? `url(${pageObj.bannerImage})` : styles.banner.backgroundImage,
        backgroundPosition: pageObj?.bannerAlignmentY !== undefined ? `center ${pageObj.bannerAlignmentY}%` : 'center',
        backgroundSize: pageObj?.bannerScale !== undefined ? `${pageObj.bannerScale}%` : 'cover'
      }}>
        <div style={styles.bannerOverlay}></div>
        <div className="container" style={styles.bannerContainer}>
          <span style={styles.bannerTag}>{language === 'vi' ? 'Phạm vi Kỹ thuật EPC' : 'EPC Scope of Engineering'}</span>
          {renderEditableText('title', 'h1', { fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' })}
          {renderEditableText('subtitle', 'p', { fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', margin: 0 })}
        </div>
      </section>

      {/* Main Content Details */}
      <section className="section" style={{ backgroundColor: 'var(--color-gray-card)' }}>
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
                {getEquipment().map((item, index) => (
                  <li key={index}>
                    🔹{' '}
                    {isVisualEditing ? (
                      <span
                        data-content-key={`${subView}.equipment.${index}`}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => setEquipmentField(index, e.currentTarget.innerText)}
                        style={{ outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                      >
                        {item[language]}
                      </span>
                    ) : (
                      <span data-content-key={`${subView}.equipment.${index}`}>{item[language]}</span>
                    )}
                  </li>
                ))}
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
                      data-content-key={`${subView}.schematic.${index}.label`}
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setSchematicField(index, 'label', e.currentTarget.innerText)}
                      style={{ ...styles.flowTitle, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {step.label[language]}
                    </h4>
                  ) : (
                    <h4 data-content-key={`${subView}.schematic.${index}.label`} style={styles.flowTitle}>{step.label[language]}</h4>
                  )}
                  {isVisualEditing ? (
                    <p
                      data-content-key={`${subView}.schematic.${index}.desc`}
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setSchematicField(index, 'desc', e.currentTarget.innerText)}
                      style={{ ...styles.flowDesc, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {step.desc[language]}
                    </p>
                  ) : (
                    <p data-content-key={`${subView}.schematic.${index}.desc`} style={styles.flowDesc}>{step.desc[language]}</p>
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
      <section className="section" style={{ backgroundColor: 'var(--color-gray-card)' }}>
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
                        data-content-key={`${subView}.faq.${idx}.q`}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => setFaqField(idx, 'q', e.currentTarget.innerText)}
                        style={{ ...styles.faqQuestion, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                      >
                        {faq.q[language]}
                      </span>
                    ) : (
                      <span data-content-key={`${subView}.faq.${idx}.q`} style={styles.faqQuestion}>{faq.q[language]}</span>
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
                          data-content-key={`${subView}.faq.${idx}.a`}
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => setFaqField(idx, 'a', e.currentTarget.innerText)}
                          style={{ outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                        >
                          {faq.a[language]}
                        </p>
                      ) : (
                        <p data-content-key={`${subView}.faq.${idx}.a`}>{faq.a[language]}</p>
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
    color: 'var(--banner-text)',
    textAlign: 'left',
    overflow: 'hidden',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'var(--banner-overlay-image)',
    backgroundColor: 'var(--banner-overlay-color)',
    filter: 'var(--banner-overlay-filter, none)',
    transform: 'var(--banner-overlay-transform, none)',
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
    color: 'var(--color-text-main)',
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
    color: 'var(--color-text-main)',
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
    border: '1px solid var(--color-gray-border)',
    backdropFilter: 'blur(8px)',
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
    color: 'var(--color-text-main)',
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
    color: 'var(--color-text-main)',
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
