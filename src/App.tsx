import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { QuoteDrawer } from './components/QuoteDrawer';
import { Home } from './pages/Home';
import { Solutions } from './pages/Solutions';
import { Products, PRODUCTS_DATA } from './pages/Products';
import { Projects } from './pages/Projects';
import type { ProjectItem } from './pages/Projects';
import { FuelCalculator } from './components/FuelCalculator';
import { Knowledge } from './pages/Knowledge';
import type { ArticleItem } from './pages/Knowledge';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/AdminDashboard';
import { VisualTextEditor } from './components/VisualTextEditor';
import type { VisualTextEditorHandle } from './components/VisualTextEditor';
import { VisualImageEditor } from './components/VisualImageEditor';

interface LeadItem {
  id: string;
  type: 'calculator' | 'wizard' | 'quote';
  company: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  date: string;
  status: 'new' | 'contacted' | 'survey' | 'closed';
  details: string;
}

const initialLeads: LeadItem[] = [
  {
    id: 'lead-1',
    type: 'wizard',
    company: 'VinaMilk Binh Duong',
    name: 'Nguyễn Văn Hùng',
    phone: '0987654321',
    email: 'hung.nguyen@vinamilk.com.vn',
    location: 'Bình Dương',
    date: '2026-07-15',
    status: 'new',
    details: 'Ngành: Thực phẩm & Đồ uống\nGiải pháp quan tâm: Turnkey LNG Solution\nNhu cầu tiêu thụ: 45 tấn/tháng\nLoại dự án: Đầu tư mới\nTimeline: 3-6 tháng'
  },
  {
    id: 'lead-2',
    type: 'quote',
    company: 'Hoa Sen Group',
    name: 'Trần Minh Đức',
    phone: '0909123456',
    email: 'duc.tran@hoasengroup.vn',
    location: 'Vũng Tàu',
    date: '2026-07-18',
    status: 'contacted',
    details: 'Yêu cầu báo giá thiết bị:\n- Bồn Chứa Cryogenic LNG (Dung tích: 5m³ - 150m³, Tiêu chuẩn ASME)\n- Dàn Hóa Hơi LNG Dạng Cánh Nhôm (Công suất: 100 Nm³/h - 8000 Nm³/h)'
  }
];

const initialArticles: ArticleItem[] = [
  {
    id: 'art-1',
    title: { vi: 'Khí tự nhiên hóa lỏng LNG là gì? Tiềm năng thay thế than đá', en: 'What is LNG? The Potential to Replace Coal in Industry' },
    category: 'energy',
    excerpt: {
      vi: 'Khám phá cấu tạo hóa học, nhiệt trị và hiệu suất sinh năng lượng của khí hóa lỏng LNG so với các nhiên liệu hóa thạch truyền thống.',
      en: 'Explore the chemical structure, heat value, and thermal efficiency of LNG compared to traditional fossil fuels.'
    },
    content: {
      vi: 'Khí tự nhiên hóa lỏng LNG (Liquefied Natural Gas) chủ yếu là Methane (CH4) siêu tinh khiết. Nhiệt trị trung bình đạt 50 MJ/kg (12,000 kcal/kg). Khi đốt, LNG giảm 35-40% lượng phát thải CO2 so với than đá, loại bỏ hoàn toàn SOx và hạt bụi mịn PM2.5. Đây là xu hướng bắt buộc đối với các doanh nghiệp FDI hướng tới mục tiêu ESG.',
      en: 'Liquefied Natural Gas (LNG) is ultra-pure methane (CH4). It features a high heating value of 50 MJ/kg (12,000 kcal/kg). Combustion of LNG generates 35-40% less CO2 than coal, with zero SOx or PM2.5 particulate emissions. Converting to LNG is a critical step for factories pursuing ESG compliance.'
    },
    date: '2026-06-15',
    visible: true
  },
  {
    id: 'art-2',
    title: { vi: 'Quy chuẩn an toàn khoảng cách trạm cấp khí LPG công nghiệp', en: 'Safety Distance Regulations for Industrial LPG Stations' },
    category: 'safety',
    excerpt: {
      vi: 'Tóm tắt các yêu cầu an toàn phòng cháy chữa cháy về ranh giới khoảng cách tối thiểu cho bồn chứa LPG theo tiêu chuẩn quốc gia.',
      en: 'Summary of fire safety codes and minimum safety boundary clearances for bulk LPG storage tanks.'
    },
    content: {
      vi: 'Theo tiêu chuẩn Việt Nam TCVN 7441, khoảng cách an toàn cháy nổ từ bồn chứa gas LPG đến ranh giới nhà máy hoặc nguồn nhiệt tối thiểu dao động từ 3 mét đến 15 mét tùy thuộc thể tích tồn chứa. Ví dụ, bồn chứa LPG từ 10m³ đến 50m³ đòi hỏi khoảng cách an toàn cách ly 15 mét. Trạm gas bắt buộc lắp đặt đầu báo rò rỉ gas phòng nổ kết nối trực tiếp đến van solenoid ngắt khẩn cấp cấp khí đầu nguồn.',
      en: 'According to Vietnam National Standard TCVN 7441, the safety distance from an LPG tank to property lines or ignition sources ranges from 3 to 15 meters depending on tank capacity. For instance, tanks between 10m³ and 50m³ require a 15m safety clearance zone. Stations must integrate flameproof gas detectors interlocked to emergency shut-off valves.'
    },
    date: '2026-07-02',
    visible: true
  },
  {
    id: 'art-3',
    title: { vi: 'Nguyên lý thiết kế bếp công nghiệp theo quy trình một chiều', en: 'Principles of One-Way Commercial Kitchen Layouts' },
    category: 'kitchen',
    excerpt: {
      vi: 'Tại sao bếp nhà hàng khách sạn bắt buộc phải thiết kế theo quy trình khép kín một chiều và cách phân bổ hợp lý các khu chức năng.',
      en: 'Why commercial catering projects must follow a strict one-way workflow, and how to distribute kitchen zones.'
    },
    content: {
      vi: 'Quy trình một chiều trong bếp công nghiệp đảm bảo các công đoạn sơ chế nguyên liệu sống và ra đồ ăn chín không bao giờ giao nhau chéo luồng. Sắp xếp bố cục tuần tự: Khu tiếp nhận -> Kho đông mát -> Khu sơ chế thô -> Khu chế biến tinh -> Khu nấu nướng lò hơi gas -> Khu soạn chia món ăn nóng -> Khu thu gom rửa dọn bát đĩa. Điều này giảm thiểu tối đa rủi ro nhiễm khuẩn sinh học chéo và tối ưu năng suất hoạt động của đầu bếp.',
      en: 'A one-way layout ensures raw materials and finished hot dishes never cross paths, preventing biological contamination. The functional flow matches a logical sequence: Receiving -> Cold storage -> Raw prep -> Fine prep -> Main cooking range line -> Plating & service -> Dishwashing. This minimizes biological hazards and optimizes kitchen staff throughput.'
    },
    date: '2026-07-10',
    visible: true
  }
];

const initialProjects: ProjectItem[] = [
  {
    id: 'proj-1',
    name: { vi: 'Hệ thống LPG trung tâm cho nhà máy chế biến thực phẩm', en: 'Central LPG system for FDI Food Factory' },
    category: 'lpg',
    location: { vi: 'KCN Thuận Đạo, Long An, Việt Nam', en: 'Thuan Dao IP, Long An, Vietnam' },
    scope: { vi: 'Khảo sát hiện trường, thiết kế P&ID, cung cấp bồn chứa 30m³, thi công đường ống, chạy thử vận hành đầu đốt.', en: 'Site survey, P&ID engineering, supply 30m³ bulk storage tank, gas piping welding, burner commissioning.' },
    capacity: { vi: 'Tiêu thụ 25 tấn LPG / tháng', en: '25 tons LPG per month' },
    result: { vi: 'Hệ thống vận hành an toàn ổn định 100%, được Công an PCCC Long An nghiệm thu chất lượng.', en: '100% reliable gas supply, fully approved by Long An fire department.' },
    equipments: ['30m³ LPG Tank', '300 kg/h Vaporizer', 'Fisher Regulators', 'Honeywell Gas Detectors'],
    image: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?q=80&w=800&auto=format&fit=crop',
    visible: true
  },
  {
    id: 'proj-2',
    name: { vi: 'Trạm hóa hơi & Cấp khí tự nhiên hóa lỏng LNG', en: 'Industrial LNG Regasification Station' },
    category: 'lng',
    location: { vi: 'KCN Mỹ Phước 3, Bình Dương, Việt Nam', en: 'My Phuoc 3 IP, Binh Duong, Vietnam' },
    scope: { vi: 'Thi công móng bồn cryogenic, lắp bồn đứng 50m³, cụm điều áp đo lường PRMS, kiểm định thử kín Nitơ đường ống.', en: 'Cryogenic foundation civil works, install 50m³ vertical tank, PRMS regulating skid, Nitrogen pressure leak test.' },
    capacity: { vi: 'Lưu lượng khí cực đại 1,500 Nm³/h', en: 'Peak capacity 1,500 Nm³/h' },
    result: { vi: 'Tiết kiệm 22% chi phí năng lượng so với khi sử dụng dầu DO trước đây.', en: 'Achieved 22% fuel cost savings compared to previous diesel oil usage.' },
    equipments: ['50m³ Cryogenic Tank', '1500 Nm³/h Ambient Vaporizer', 'Ultrasonic Flowmeter', 'Slam-shut Safety Valves'],
    image: 'https://images.unsplash.com/photo-1581094128547-1388d1397865?q=80&w=800&auto=format&fit=crop',
    visible: true
  },
  {
    id: 'proj-3',
    name: { vi: 'Chuyển đổi lò hơi từ dầu FO sang khí gas sạch LNG', en: 'Boiler Fuel Conversion from FO to LNG' },
    category: 'conversion',
    location: { vi: 'KCN Amata, Đồng Nai, Việt Nam', en: 'Amata IP, Dong Nai, Vietnam' },
    scope: { vi: 'Cải tạo buồng đốt lò hơi 10 tấn/giờ, thay đầu đốt dầu cũ sang đầu đốt gas lưỡng phẩm Weishaupt, lập trình điều khiển tỷ lệ O2 tự động.', en: 'Retrofit 10 T/h steam boiler, replace heavy oil burner with Weishaupt dual-fuel burner, program automated oxygen-trim control.' },
    capacity: { vi: 'Lò hơi công suất 10 tấn hơi / giờ', en: '10 Ton steam per hour capacity' },
    result: { vi: 'Cắt giảm 30% lượng khí phát thải CO2 nhà máy, loại bỏ hoàn toàn muội khói đen.', en: 'Reduced CO2 footprint by 30%, completely eliminated black soot emissions.' },
    equipments: ['Weishaupt Gas Burner', 'Double block solenoid valves', 'O2 Flue gas analyzer controller'],
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop',
    visible: true
  },
  {
    id: 'proj-4',
    name: { vi: 'Thiết kế bếp và gas trung tâm cho khách sạn 5 sao', en: '5-Star Hotel Kitchen & Central Gas System' },
    category: 'kitchen',
    location: { vi: 'Bãi Bắc, Đà Nẵng, Việt Nam', en: 'Bai Bac, Da Nang, Vietnam' },
    scope: { vi: 'Thiết kế layout bếp ăn theo quy trình 1 chiều chống khuẩn chéo, thi công đường dẫn gas Inox đúc từ kho chứa chai gas trung tâm.', en: 'One-way layout design, seamless stainless steel gas piping routed from central cylinder manifold.' },
    capacity: { vi: 'Phục vụ tối đa 1,200 khách / ngày', en: 'Serves up to 1,200 guests daily' },
    result: { vi: 'Khu bếp được bàn giao đúng tiến độ, vận hành tiện lợi và an toàn tuyệt đối.', en: 'Kitchen delivered on schedule, high operational workflow, certified safety.' },
    equipments: ['Commercial Cooking Ranges', 'Exhaust canopy hoods', 'Central gas manifold', 'Gas solenoid safety valves'],
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop',
    visible: true
  }
];

export const AppContent: React.FC = () => {
  const { language } = useLanguage();
  const appRootRef = React.useRef<HTMLDivElement>(null);
  const visualEditorRef = React.useRef<VisualTextEditorHandle>(null);
  const [currentView, setCurrentView] = useState<string>(() => {
    return window.location.pathname.replace(/\/+$/, '') === '/admin' ? 'admin' : 'home';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('lng79_theme') === 'light' ? 'light' : 'dark';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('cms_logged_in') === 'true';
  });
  const [isVisualEditing, setIsVisualEditing] = useState<boolean>(false);
  const [hasVisualDraft, setHasVisualDraft] = useState<boolean>(false);
  const [visualSaveNotice, setVisualSaveNotice] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [fuelSettings, setFuelSettings] = useState({ lngPrice: 18500, lpgPrice: 23000 });
  const [articles, setArticles] = useState<ArticleItem[]>(() => {
    const saved = localStorage.getItem('cms_articles');
    return saved ? JSON.parse(saved) : initialArticles;
  });
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    const saved = localStorage.getItem('cms_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });
  const [products, setProducts] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_products');
    return saved ? JSON.parse(saved) : PRODUCTS_DATA;
  });

  const setView = React.useCallback((view: string) => {
    setCurrentView(view);
    const isAdminPath = window.location.pathname.replace(/\/+$/, '') === '/admin';
    if (view === 'admin' && !isAdminPath) {
      window.history.pushState({ view: 'admin' }, '', '/admin');
    } else if (view !== 'admin' && isAdminPath) {
      window.history.pushState({ view }, '', '/');
    }
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentView(window.location.pathname.replace(/\/+$/, '') === '/admin' ? 'admin' : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('cms_products', JSON.stringify(products));
  }, [products]);

  React.useEffect(() => {
    localStorage.setItem('cms_articles', JSON.stringify(articles));
  }, [articles]);

  React.useEffect(() => {
    localStorage.setItem('cms_projects', JSON.stringify(projects));
  }, [projects]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('lng79_theme', theme);
  }, [theme]);

  const [contactInfo, setContactInfo] = useState(() => {
    const saved = localStorage.getItem('cms_contact_info');
    return saved ? JSON.parse(saved) : {
      addressVi: 'Lô CN-08, Khu Công Nghiệp Sóng Thần 3, Thủ Dầu Một, Bình Dương, Việt Nam',
      addressEn: 'CN-08 Lot, Song Than 3 Industrial Park, Thu Dau Mot, Binh Duong, Vietnam',
      phone: '+84 (0) 274 3801 888',
      email: 'info@lnglpgkitchen-solutions.com',
      hoursVi: 'Hỗ trợ kỹ thuật 24/7. Tiếp nhận khảo sát: 8:00 - 17:30 (Thứ 2 - Thứ 7)',
      hoursEn: 'Technical dispatch 24/7. Site survey scheduling: 8:00 AM - 5:30 PM (Mon - Sat)'
    };
  });

  React.useEffect(() => {
    localStorage.setItem('cms_contact_info', JSON.stringify(contactInfo));
  }, [contactInfo]);

  const [pages, setPages] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_pages');
    if (saved) {
      const parsed = JSON.parse(saved);
      const home = parsed.find((p: any) => p.id === 'p-1');
      if (!home || !home.blocks || home.blocks.length === 0 || home.blocks.some((b: any) => b.id === 'b-1') || parsed.some((p: any) => !p.title || typeof p.title.vi !== 'string')) {
        localStorage.removeItem('cms_pages');
      } else {
        return parsed;
      }
    }
    return [
      {
        id: 'p-1',
        title: { vi: 'Trang chủ', en: 'Home' },
        slug: 'home',
        excerpt: { vi: 'Trang chủ website LNG79', en: 'Homepage of LNG79 website' },
        status: 'published',
        visible: true,
        onMenu: true,
        searchable: true,
        blocks: [
          {
            id: 'b-hero',
            type: 'hero',
            titleVi: 'Tổng Thầu Thiết Kế Thi Công Trạm Khí LNG/LPG',
            titleEn: 'EPC Turnkey LNG/LPG Terminal Station Contractor',
            subtitleVi: 'Đảm bảo tiến độ thi công vượt trội, thiết bị nhập khẩu chính hãng, tiêu chuẩn an toàn PCCC.',
            subtitleEn: 'Outstanding construction engineering, premium certified imported components, TCVN safety compliant.',
            image: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?q=80&w=800&auto=format&fit=crop',
            ctaVi: 'Nhận Báo Giá Thiết Kế',
            ctaEn: 'Request Engineering Estimate'
          },
          {
            id: 'b-clients',
            type: 'stats',
            titleVi: 'ĐỐI TÁC CHIẾN LƯỢC & KHÁCH HÀNG',
            titleEn: 'STRATEGIC PARTNERS & CLIENTS',
            itemsVi: 'COCA-COLA VN, SABECO BREWERY, HYUNDAI STEEL, VINPEARL RESORTS, CJ FOODS, SAMSUNG ELECTRONICS',
            itemsEn: 'COCA-COLA VN, SABECO BREWERY, HYUNDAI STEEL, VINPEARL RESORTS, CJ FOODS, SAMSUNG ELECTRONICS'
          },
          {
            id: 'b-divisions',
            type: 'features',
            titleVi: 'Lĩnh Vực Hoạt Động Chính',
            titleEn: 'Core Business Divisions',
            itemsVi: 'Giải Pháp Năng Lượng Khí LNG/LPG: Cung cấp trạm hóa hơi và bồn chứa; Hệ Thống Bếp Công Nghiệp: Thiết kế bếp nhà hàng khách sạn một chiều',
            itemsEn: 'LNG/LPG Gas Energy: regasification skids and storage tanks; Commercial Kitchen Systems: one-way food preparation flows'
          },
          {
            id: 'b-process',
            type: 'features',
            titleVi: 'Quy Trình Thi Công Trọn Gói EPC',
            titleEn: 'Turnkey EPC Workflow Steps',
            itemsVi: 'Khảo sát hiện trạng, Thiết kế P&ID bản vẽ, Thi công lắp đặt thiết bị, Nghiệm thu PCCC an toàn, Chạy thử vận hành, Bàn giao kỹ thuật, Bảo dưỡng định kỳ',
            itemsEn: 'Site survey, P&ID drawing design, Equipment installation, Safety approvals, Trial runs, Operations handover, Routine maintenance'
          },
          {
            id: 'b-industries',
            type: 'features',
            titleVi: 'Ngành Nghề Phục Vụ',
            titleEn: 'Industries We Serve',
            itemsVi: 'Nhà máy sản xuất FDI: Trạm cấp gas trung tâm; Luyện kim & Gốm sứ: Năng lượng lò nung hiệu năng cao; Chuyển đổi lò hơi: Chuyển đổi từ dầu FO/than sang gas LNG sạch',
            itemsEn: 'FDI Manufacturing: centralized gas infrastructure; Metallurgy & Ceramics: high-efficiency thermal kilns; Boiler Fuel Conversion: converting FO/coal to clean LNG'
          },
          {
            id: 'b-stats',
            type: 'stats',
            titleVi: 'LNG79 Qua Những Con Số',
            titleEn: 'LNG79 By The Numbers',
            itemsVi: '85+ Dự án đã cấp khí, 100% Đạt kiểm định PCCC, 15+ Năm kinh nghiệm vận hành',
            itemsEn: '85+ Gas stations running, 100% Certified safety audits, 15+ Years expert crew'
          },
          {
            id: 'b-cta',
            type: 'hero',
            titleVi: 'Bạn Cần Tư Vấn Thiết Kế Hoặc Nhận Báo Giá?',
            titleEn: 'Need Design Consultation or Custom Quote?',
            subtitleVi: 'Chúng tôi sẵn sàng khảo sát thực tế và đưa ra bài toán kinh tế tiết kiệm nhất cho doanh nghiệp.',
            subtitleEn: 'We offer free site survey audits and cost saving projections tailored for your facility.',
            ctaVi: 'Gửi yêu cầu ngay',
            ctaEn: 'Submit RFQ Now'
          }
        ]
      },
      { id: 'p-2', title: { vi: 'Giải pháp LNG', en: 'LNG Solutions' }, slug: 'lng-solution', excerpt: { vi: 'Hệ thống cấp khí và hóa lỏng', en: 'Gas supply and liquefaction systems' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-3', title: { vi: 'Giải pháp LPG', en: 'LPG Solutions' }, slug: 'lpg-solution', excerpt: { vi: 'Hệ thống cấp gas trung tâm', en: 'Centralized gas supply systems' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-4', title: { vi: 'Cải tạo đầu đốt', en: 'Boiler Conversion' }, slug: 'conversion', excerpt: { vi: 'Chuyển đổi sang nhiên liệu sạch', en: 'Conversion to clean fuel solutions' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-5', title: { vi: 'Thiết kế bếp và Central gas', en: 'Commercial Kitchen' }, slug: 'kitchen-solution', excerpt: { vi: 'Hệ thống bếp công nghiệp', en: 'Commercial kitchen systems' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-6', title: { vi: 'Sản phẩm', en: 'Products' }, slug: 'products', excerpt: { vi: 'Danh mục thiết bị ngành khí và bếp', en: 'Equipment inventory for gas & kitchen systems' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-7', title: { vi: 'Dự án', en: 'Projects' }, slug: 'projects', excerpt: { vi: 'Dự án đã làm', en: 'Projects completed' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-8', title: { vi: 'Thư viện', en: 'Knowledge' }, slug: 'knowledge', excerpt: { vi: 'Tài liệu kỹ thuật và an toàn', en: 'Technical and safety manuals' }, status: 'published', visible: true, onMenu: true, searchable: true }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('cms_pages', JSON.stringify(pages));
  }, [pages]);

  const handleAddProduct = (product: any) => {
    setCartItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
    setCartOpen(true);
  };

  const handleRemoveProduct = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCreateLead = (type: 'calculator' | 'wizard' | 'quote', data: any) => {
    const newLead: LeadItem = {
      id: 'lead-' + Date.now(),
      type,
      company: data.company || 'N/A',
      name: data.contactName || 'N/A',
      phone: data.phone || 'N/A',
      email: data.email || 'N/A',
      location: data.location || data.province || 'Bình Dương',
      date: new Date().toISOString().split('T')[0],
      status: 'new',
      details: data.details || ''
    };
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleUpdateLeadStatus = (id: string, status: LeadItem['status']) => {
    setLeads((prev) => 
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    );
  };

  const handleDeleteLead = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  };

  const handleAddLead = (lead: LeadItem) => {
    setLeads((prev) => [lead, ...prev]);
  };

  // Article handlers
  const handleAddArticle = (article: ArticleItem) => {
    setArticles((prev) => [article, ...prev]);
  };

  const handleDeleteArticle = (id: string) => {
    setArticles((prev) => prev.filter((art) => art.id !== id));
  };

  const handleToggleArticleVisibility = (id: string) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === id ? { ...art, visible: !art.visible } : art))
    );
  };

  const handleEditArticle = (updatedArticle: ArticleItem) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === updatedArticle.id ? updatedArticle : art))
    );
  };

  // Project handlers
  const handleAddProject = (project: ProjectItem) => {
    setProjects((prev) => [project, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((proj) => proj.id !== id));
  };

  const handleToggleProjectVisibility = (id: string) => {
    setProjects((prev) =>
      prev.map((proj) => (proj.id === id ? { ...proj, visible: !proj.visible } : proj))
    );
  };

  const handleEditProject = (updatedProject: ProjectItem) => {
    setProjects((prev) =>
      prev.map((proj) => (proj.id === updatedProject.id ? updatedProject : proj))
    );
  };

  // Render the current view page
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home setView={setView} onAddProduct={handleAddProduct} cartItems={cartItems} pages={pages} setPages={setPages} isVisualEditing={isVisualEditing} />;
      case 'lng-solution':
        return <Solutions subView="lng-solution" setView={setView} pages={pages} setPages={setPages} isVisualEditing={isVisualEditing} />;
      case 'lpg-solution':
        return <Solutions subView="lpg-solution" setView={setView} pages={pages} setPages={setPages} isVisualEditing={isVisualEditing} />;
      case 'conversion':
        return <Solutions subView="conversion" setView={setView} pages={pages} setPages={setPages} isVisualEditing={isVisualEditing} />;
      case 'kitchen-solution':
        return <Solutions subView="kitchen-solution" setView={setView} pages={pages} setPages={setPages} isVisualEditing={isVisualEditing} />;
      case 'products':
        return <Products onAddProduct={handleAddProduct} cartItems={cartItems} products={products} setProducts={setProducts} isVisualEditing={isVisualEditing} />;
      case 'projects':
        return <Projects projects={projects} setProjects={setProjects} isVisualEditing={isVisualEditing} />;
      case 'calculator':
        return (
          <div className="container" style={{ padding: '4rem 1.5rem' }}>
            <FuelCalculator lngPrice={fuelSettings.lngPrice} lpgPrice={fuelSettings.lpgPrice} />
          </div>
        );
      case 'knowledge':
        return <Knowledge articles={articles} setArticles={setArticles} isVisualEditing={isVisualEditing} />;
      case 'contact':
        return (
          <Contact 
            onSubmitLead={(data: any) => handleCreateLead('wizard', data)} 
            contactInfo={contactInfo}
            setContactInfo={setContactInfo}
            isVisualEditing={isVisualEditing}
          />
        );
      case 'admin':
        return (
          <AdminDashboard 
            leads={leads}
            onUpdateStatus={handleUpdateLeadStatus}
            onDeleteLead={handleDeleteLead}
            onAddLead={handleAddLead}
            fuelSettings={fuelSettings}
            onUpdateSettings={setFuelSettings}
            articles={articles}
            onAddArticle={handleAddArticle}
            onDeleteArticle={handleDeleteArticle}
            onToggleArticle={handleToggleArticleVisibility}
            onEditArticle={handleEditArticle}
            projects={projects}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onToggleProject={handleToggleProjectVisibility}
            onEditProject={handleEditProject}
            pages={pages}
            onUpdatePages={setPages}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        );
      default:
        return <Home setView={setView} onAddProduct={handleAddProduct} cartItems={cartItems} pages={pages} setPages={setPages} isVisualEditing={isVisualEditing} />;
    }
  };

  return (
    <div ref={appRootRef} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <VisualTextEditor
        ref={visualEditorRef}
        rootRef={appRootRef}
        isEditing={isVisualEditing}
        currentView={currentView}
        language={language}
        onDirtyChange={setHasVisualDraft}
        onSaved={() => {
          setVisualSaveNotice(true);
          window.setTimeout(() => setVisualSaveNotice(false), 1800);
        }}
      />
      <VisualImageEditor
        rootRef={appRootRef}
        isEditing={isVisualEditing}
        currentView={currentView}
        language={language}
      />
      {isLoggedIn && (
        <div data-visual-editor-ui style={{
          position: 'sticky', top: 0, zIndex: 1000, 
          backgroundColor: '#0F172A', color: '#fff', 
          padding: '0.75rem 1.5rem', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '2px solid var(--color-teal)',
          fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-teal)' }}>🛠️ LNG79 Live Editor</span>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
              Logged in as Administrator
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn"
              style={{
                fontSize: '0.8rem', padding: '0.4rem 0.8rem', cursor: 'pointer',
                backgroundColor: isVisualEditing ? 'var(--color-orange)' : 'var(--color-teal)',
                color: 'var(--color-white)', border: 'none', borderRadius: '4px'
              }}
              onClick={() => {
                if (isVisualEditing) visualEditorRef.current?.save();
                setIsVisualEditing(!isVisualEditing);
              }}
            >
              {isVisualEditing ? 'Tắt Chế Độ Sửa Trực Quan' : 'Bật Chế Độ Sửa Trực Quan'}
            </button>
            {isVisualEditing && (
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={() => visualEditorRef.current?.save()}
              >
                {visualSaveNotice ? 'Đã lưu' : hasVisualDraft ? 'Lưu thay đổi •' : 'Lưu thay đổi'}
              </button>
            )}
            <button
              className="btn btn-outline"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => {
                setView('admin');
                setIsVisualEditing(false);
              }}
            >
              Go to CMS Dashboard
            </button>
          </div>
        </div>
      )}
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        cartCount={cartItems.length} 
        toggleCart={() => setCartOpen(!cartOpen)}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      <Footer setView={setView} />

      <QuoteDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        cartItems={cartItems} 
        onRemoveItem={handleRemoveProduct} 
        onClearCart={handleClearCart} 
        onSubmitLead={(data: any) => handleCreateLead('quote', data)}
      />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
