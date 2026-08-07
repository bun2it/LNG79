import React, { Suspense, useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { QuoteDrawer } from './components/QuoteDrawer';
import { Home } from './pages/Home';
import { Solutions, SOLUTIONS_PAGE_DATA } from './pages/Solutions';
import { Products, PRODUCTS_DATA } from './pages/Products';
import { Projects } from './pages/Projects';
import type { ProjectItem } from './pages/Projects';
import { FuelCalculator } from './components/FuelCalculator';
import { Knowledge } from './pages/Knowledge';
import type { ArticleItem } from './pages/Knowledge';
import { Contact } from './pages/Contact';
import { VisualTextEditor } from './components/VisualTextEditor';
import type { VisualTextEditorHandle } from './components/VisualTextEditor';
import { VisualImageEditor } from './components/VisualImageEditor';
import type { VisualImageEditorHandle } from './components/VisualImageEditor';
import { translateWebsiteContent } from './features/ai/bulkTranslate';
import { CMS_AUTH_EXPIRED_EVENT } from './features/auth/authFetch';
import { getCurrentCmsProfile, supabase } from './lib/supabase';

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));

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
  const visualImageEditorRef = React.useRef<VisualImageEditorHandle>(null);
  const [currentView, setCurrentView] = useState<string>(() => {
    return window.location.pathname.replace(/\/+$/, '') === '/admin' ? 'admin' : 'home';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('lng79_theme') === 'light' ? 'light' : 'dark';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVisualEditing, setIsVisualEditing] = useState<boolean>(false);
  const [hasVisualDraft, setHasVisualDraft] = useState<boolean>(false);
  const [visualSaveNotice, setVisualSaveNotice] = useState<boolean>(false);
  const [visualSaving, setVisualSaving] = useState<boolean>(false);

  const handleSaveVisualEdits = async () => {
    setVisualSaving(true);
    try {
      await Promise.all([
        visualEditorRef.current?.save(),
        visualImageEditorRef.current?.save()
      ]);
      setVisualSaveNotice(true);
      window.setTimeout(() => setVisualSaveNotice(false), 1800);
    } catch (err) {
      console.error('Failed to save visual edits:', err);
    } finally {
      setVisualSaving(false);
    }
  };
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [leads, setLeads] = useState<LeadItem[]>(() => {
    const saved = localStorage.getItem('cms_leads');
    return saved ? JSON.parse(saved) : initialLeads;
  });
  const [fuelSettings, setFuelSettings] = useState(() => {
    const saved = localStorage.getItem('cms_fuel_settings');
    return saved ? JSON.parse(saved) : { lngPrice: 18500, lpgPrice: 23000 };
  });
  const [articles, setArticles] = useState<ArticleItem[]>(() => {
    const saved = localStorage.getItem('cms_articles');
    return saved ? JSON.parse(saved) : initialArticles;
  });
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    const saved = localStorage.getItem('cms_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });
  const [menuItems, setMenuItems] = useState<any[]>([]);
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
    let cancelled = false;
    let unsubscribe: () => void = () => undefined;
    if (supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        const profile = data.session ? await getCurrentCmsProfile() : null;
        if (!cancelled) setIsLoggedIn(Boolean(profile));
      }).catch(() => { if (!cancelled) setIsLoggedIn(false); });
      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          if (!cancelled) setIsLoggedIn(false);
          return;
        }
        window.setTimeout(() => {
          void getCurrentCmsProfile().then((profile) => {
            if (!cancelled) setIsLoggedIn(Boolean(profile));
          });
        }, 0);
      });
      unsubscribe = () => listener.data.subscription.unsubscribe();
    } else {
      fetch('/api/auth/status').then((response) => response.json()).then((result) => { if (!cancelled) setIsLoggedIn(Boolean(result.authenticated)); }).catch(() => undefined);
    }
    const handleExpiredSession = () => {
      setIsLoggedIn(false);
      if (supabase) void supabase.auth.signOut({ scope: 'local' });
    };
    window.addEventListener(CMS_AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => { cancelled = true; unsubscribe(); window.removeEventListener(CMS_AUTH_EXPIRED_EVENT, handleExpiredSession); };
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

  React.useEffect(() => { localStorage.setItem('cms_leads', JSON.stringify(leads)); }, [leads]);
  React.useEffect(() => {
    localStorage.setItem('cms_fuel_settings', JSON.stringify(fuelSettings));
    const saveFuel = async () => {
      const client = supabase;
      if (!client) return;
      try {
        await client
          .from('site_settings')
          .upsert({ key: 'fuel_settings', value: fuelSettings });
      } catch (err) {
        console.error('Failed to auto-save fuel settings to Supabase:', err);
      }
    };
    void saveFuel();
  }, [fuelSettings]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('lng79_theme', theme);
  }, [theme]);

  const [guiSettings, setGuiSettings] = useState(() => {
    const saved = localStorage.getItem('cms_gui_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      darkColor: '#070a13',
      darkOpacity: 85,
      lightColor: '#ffffff',
      lightOpacity: 0,
      logoHeight: 42,
      darkGradientType: 'custom',
      lightGradientType: 'custom',
      ...parsed
    };
  });

  React.useEffect(() => {
    localStorage.setItem('cms_gui_settings', JSON.stringify(guiSettings));
    const saveGui = async () => {
      const client = supabase;
      if (!client) return;
      try {
        await client
          .from('site_settings')
          .upsert({ key: 'gui_settings', value: guiSettings });
      } catch (err) {
        console.error('Failed to auto-save GUI settings to Supabase:', err);
      }
    };
    void saveGui();

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result 
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '7, 10, 19';
    };

    const MESH_GRADIENTS = {
      dark: {
        solid: (rgb: string, alpha: number) => ({
          image: 'none',
          color: `rgba(${rgb}, ${alpha})`
        }),
        aurora: (_rgb: string, alpha: number) => ({
          image: `radial-gradient(circle at 10% 20%, hsla(174, 90%, 45%, ${alpha * 0.15}) 0%, transparent 60%), radial-gradient(circle at 80% 80%, hsla(213, 85%, 35%, ${alpha * 0.20}) 0%, transparent 70%), radial-gradient(circle at 50% 50%, hsla(270, 70%, 40%, ${alpha * 0.12}) 0%, transparent 65%), radial-gradient(circle at 90% 10%, hsla(150, 80%, 40%, ${alpha * 0.10}) 0%, transparent 50%)`,
          color: `hsla(218, 76%, 8%, ${alpha})`
        }),
        volcano: (_rgb: string, alpha: number) => ({
          image: `radial-gradient(circle at 85% 15%, hsla(24, 95%, 45%, ${alpha * 0.22}) 0%, transparent 60%), radial-gradient(circle at 20% 75%, hsla(355, 90%, 40%, ${alpha * 0.18}) 0%, transparent 70%), radial-gradient(circle at 50% 30%, hsla(38, 95%, 55%, ${alpha * 0.15}) 0%, transparent 50%)`,
          color: `hsla(10, 60%, 4%, ${alpha})`
        }),
        steel: (_rgb: string, alpha: number) => ({
          image: `radial-gradient(circle at 0% 100%, hsla(190, 90%, 40%, ${alpha * 0.18}) 0%, transparent 65%), radial-gradient(circle at 100% 0%, hsla(210, 80%, 50%, ${alpha * 0.18}) 0%, transparent 70%), radial-gradient(circle at 50% 80%, hsla(240, 50%, 30%, ${alpha * 0.12}) 0%, transparent 60%)`,
          color: `hsla(225, 45%, 5%, ${alpha})`
        }),
        custom: (_rgb: string, alpha: number) => {
          const baseColor = guiSettings.darkBaseColor || '#070a13';
          const nodes = guiSettings.darkCustomMesh || [
            { color: '#14b8a6', opacity: 20, x: 20, y: 30, size: 60 },
            { color: '#3b82f6', opacity: 25, x: 80, y: 70, size: 70 },
            { color: '#a855f7', opacity: 15, x: 50, y: 50, size: 65 }
          ];
          const baseVal = `rgba(${hexToRgb(baseColor)}, ${alpha})`;
          if (!nodes || nodes.length === 0) {
            return { image: 'none', color: baseVal };
          }
          const rads = nodes.map((node: any) => {
            const nodeAlpha = node.opacity / 100;
            const rgb = hexToRgb(node.color);
            return `radial-gradient(circle at ${node.x}% ${node.y}%, rgba(${rgb}, ${nodeAlpha}) 0%, rgba(${rgb}, 0) ${node.size}%)`;
          });
          return { image: rads.join(', '), color: baseVal };
        }
      },
      light: {
        solid: (rgb: string, alpha: number) => ({
          image: 'none',
          color: alpha === 0 ? 'transparent' : `rgba(${rgb}, ${alpha})`
        }),
        sky: (_rgb: string, alpha: number) => ({
          image: alpha === 0 ? 'none' : `radial-gradient(circle at 15% 15%, hsla(180, 80%, 90%, ${alpha * 0.45}) 0%, transparent 55%), radial-gradient(circle at 80% 85%, hsla(210, 85%, 93%, ${alpha * 0.45}) 0%, transparent 60%), radial-gradient(circle at 50% 40%, hsla(260, 60%, 95%, ${alpha * 0.35}) 0%, transparent 50%)`,
          color: alpha === 0 ? 'transparent' : `rgba(255, 255, 255, ${alpha})`
        }),
        summer: (_rgb: string, alpha: number) => ({
          image: alpha === 0 ? 'none' : `radial-gradient(circle at 80% 20%, hsla(35, 90%, 92%, ${alpha * 0.50}) 0%, transparent 55%), radial-gradient(circle at 20% 80%, hsla(15, 80%, 94%, ${alpha * 0.40}) 0%, transparent 60%), radial-gradient(circle at 50% 50%, hsla(45, 90%, 95%, ${alpha * 0.40}) 0%, transparent 50%)`,
          color: alpha === 0 ? 'transparent' : `rgba(255, 255, 255, ${alpha})`
        }),
        sage: (_rgb: string, alpha: number) => ({
          image: alpha === 0 ? 'none' : `radial-gradient(circle at 10% 90%, hsla(140, 60%, 92%, ${alpha * 0.45}) 0%, transparent 60%), radial-gradient(circle at 90% 10%, hsla(195, 70%, 91%, ${alpha * 0.45}) 0%, transparent 65%), radial-gradient(circle at 50% 70%, hsla(220, 40%, 93%, ${alpha * 0.35}) 0%, transparent 50%)`,
          color: alpha === 0 ? 'transparent' : `rgba(255, 255, 255, ${alpha})`
        }),
        custom: (_rgb: string, alpha: number) => {
          if (alpha === 0) return { image: 'none', color: 'transparent' };
          const baseColor = guiSettings.lightBaseColor || '#ffffff';
          const nodes = guiSettings.lightCustomMesh || [
            { color: '#06b6d4', opacity: 35, x: 15, y: 20, size: 55 },
            { color: '#6366f1', opacity: 25, x: 80, y: 80, size: 60 },
            { color: '#d946ef', opacity: 20, x: 50, y: 40, size: 50 }
          ];
          const baseVal = `rgba(${hexToRgb(baseColor)}, ${alpha})`;
          if (!nodes || nodes.length === 0) {
            return { image: 'none', color: baseVal };
          }
          const rads = nodes.map((node: any) => {
            const nodeAlpha = node.opacity / 100;
            const rgb = hexToRgb(node.color);
            return `radial-gradient(circle at ${node.x}% ${node.y}%, rgba(${rgb}, ${nodeAlpha}) 0%, rgba(${rgb}, 0) ${node.size}%)`;
          });
          return { image: rads.join(', '), color: baseVal };
        }
      }
    };

    const darkType = guiSettings.darkGradientType || 'solid';
    const lightType = guiSettings.lightGradientType || 'solid';
    const darkColorRGB = hexToRgb(guiSettings.darkColor || '#070a13');
    const lightColorRGB = hexToRgb(guiSettings.lightColor || '#ffffff');
    const darkOpacityVal = (guiSettings.darkOpacity !== undefined ? guiSettings.darkOpacity : 85) / 100;
    const lightOpacityVal = (guiSettings.lightOpacity !== undefined ? guiSettings.lightOpacity : 0) / 100;

    const darkGradFunc = MESH_GRADIENTS.dark[darkType as keyof typeof MESH_GRADIENTS.dark] || MESH_GRADIENTS.dark.solid;
    const lightGradFunc = MESH_GRADIENTS.light[lightType as keyof typeof MESH_GRADIENTS.light] || MESH_GRADIENTS.light.solid;

    const darkVal = darkGradFunc(darkColorRGB, darkOpacityVal);
    const lightVal = lightGradFunc(lightColorRGB, lightOpacityVal);

    document.documentElement.style.setProperty('--banner-overlay-dark-image', darkVal.image);
    document.documentElement.style.setProperty('--banner-overlay-dark-color', darkVal.color);
    document.documentElement.style.setProperty('--banner-overlay-light-image', lightVal.image);
    document.documentElement.style.setProperty('--banner-overlay-light-color', lightVal.color);

    const darkFilter = darkType === 'solid' ? 'none' : darkType === 'custom' ? 'blur(40px)' : 'blur(60px)';
    const darkTransform = darkType === 'solid' ? 'none' : darkType === 'custom' ? 'scale(1.1)' : 'scale(1.15)';
    const lightFilter = lightType === 'solid' ? 'none' : lightType === 'custom' ? 'blur(40px)' : 'blur(60px)';
    const lightTransform = lightType === 'solid' ? 'none' : lightType === 'custom' ? 'scale(1.1)' : 'scale(1.15)';

    document.documentElement.style.setProperty('--banner-overlay-dark-filter', darkFilter);
    document.documentElement.style.setProperty('--banner-overlay-dark-transform', darkTransform);
    document.documentElement.style.setProperty('--banner-overlay-light-filter', lightFilter);
    document.documentElement.style.setProperty('--banner-overlay-light-transform', lightTransform);

    const darkHeroImage = darkType === 'solid'
      ? `linear-gradient(to right, ${darkVal.color} 40%, rgba(7, 10, 19, 0.4) 100%)`
      : darkType === 'custom'
        ? darkVal.image
        : `linear-gradient(to right, rgba(7, 10, 19, 0.96) 40%, rgba(7, 10, 19, 0.4) 100%), ${darkVal.image}`;
    const darkHeroColor = darkType === 'solid' ? 'transparent' : darkVal.color;

    const lightHeroImage = lightType === 'solid'
      ? `linear-gradient(90deg, ${lightVal.color === 'transparent' ? 'rgba(239, 247, 255, 0.97)' : lightVal.color} 34%, rgba(222, 238, 255, 0.6) 62%, rgba(221, 249, 243, 0.3) 100%)`
      : lightType === 'custom'
        ? lightVal.image
        : `linear-gradient(90deg, rgba(239, 247, 255, 0.97) 34%, rgba(222, 238, 255, 0.6) 62%, rgba(221, 249, 243, 0.3) 100%), ${lightVal.image}`;
    const lightHeroColor = lightType === 'solid' ? 'transparent' : lightVal.color;

    document.documentElement.style.setProperty('--home-hero-dark-image', darkHeroImage);
    document.documentElement.style.setProperty('--home-hero-dark-color', darkHeroColor);
    document.documentElement.style.setProperty('--home-hero-light-image', lightHeroImage);
    document.documentElement.style.setProperty('--home-hero-light-color', lightHeroColor);
  }, [guiSettings]);

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
    const saveContact = async () => {
      const client = supabase;
      if (!client) return;
      try {
        await client
          .from('site_settings')
          .upsert({ key: 'contact_info', value: contactInfo });
      } catch (err) {
        console.error('Failed to auto-save contact info to Supabase:', err);
      }
    };
    void saveContact();
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
      { id: 'p-2', title: { vi: 'Giải pháp LNG', en: 'LNG Solutions' }, slug: 'lng-solution', excerpt: { vi: 'Hệ thống cấp khí và hóa lỏng', en: 'Gas supply and liquefaction systems' }, status: 'published', visible: true, onMenu: true, searchable: true, faqs: SOLUTIONS_PAGE_DATA['lng-solution'].faqs },
      { id: 'p-3', title: { vi: 'Giải pháp LPG', en: 'LPG Solutions' }, slug: 'lpg-solution', excerpt: { vi: 'Hệ thống cấp gas trung tâm', en: 'Centralized gas supply systems' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-4', title: { vi: 'Cải tạo đầu đốt', en: 'Boiler Conversion' }, slug: 'conversion', excerpt: { vi: 'Chuyển đổi sang nhiên liệu sạch', en: 'Conversion to clean fuel solutions' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-5', title: { vi: 'Thiết kế bếp và Central gas', en: 'Commercial Kitchen' }, slug: 'kitchen-solution', excerpt: { vi: 'Hệ thống bếp công nghiệp', en: 'Commercial kitchen systems' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-6', title: { vi: 'Sản phẩm', en: 'Products' }, slug: 'products', excerpt: { vi: 'Danh mục thiết bị ngành khí và bếp', en: 'Equipment inventory for gas & kitchen systems' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-7', title: { vi: 'Dự án', en: 'Projects' }, slug: 'projects', excerpt: { vi: 'Dự án đã làm', en: 'Projects completed' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-8', title: { vi: 'Thư viện', en: 'Knowledge' }, slug: 'knowledge', excerpt: { vi: 'Tài liệu kỹ thuật và an toàn', en: 'Technical and safety manuals' }, status: 'published', visible: true, onMenu: true, searchable: true },
      { id: 'p-9', title: { vi: 'Liên hệ', en: 'Contact' }, slug: 'contact', excerpt: { vi: 'Liên hệ LNG79', en: 'Contact LNG79' }, status: 'published', visible: true, onMenu: false, searchable: true }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('cms_pages', JSON.stringify(pages));
  }, [pages]);

  React.useEffect(() => {
    let active = true;
    const loadSiteTexts = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('site_texts')
          .select('content_key, value_vi, value_en')
          .eq('status', 'published');
        
        if (error) throw error;
        if (data && data.length > 0 && active) {
          setPages((currentPages) => {
            return currentPages.map((page) => {
              if (page.blocks) {
                const updatedBlocks = page.blocks.map((block: any) => {
                  const updatedBlock = { ...block };
                  const prefix = `${page.slug || 'home'}.block.${block.id}`;
                  
                  const applyText = (fieldBase: string, fieldVi: string, fieldEn: string) => {
                    const matched = data.find((row) => row.content_key === `${prefix}.${fieldBase}`);
                    if (matched) {
                      updatedBlock[fieldVi] = matched.value_vi;
                      updatedBlock[fieldEn] = matched.value_en;
                    }
                  };

                  applyText('title', 'titleVi', 'titleEn');
                  applyText('subtitle', 'subtitleVi', 'subtitleEn');
                  applyText('cta', 'ctaVi', 'ctaEn');
                  applyText('items', 'itemsVi', 'itemsEn');
                  applyText('content', 'contentVi', 'contentEn');

                  return updatedBlock;
                });
                return { ...page, blocks: updatedBlocks };
              }

              const pageSlug = page.slug;
              if (['lng-solution', 'lpg-solution', 'conversion', 'kitchen-solution'].includes(pageSlug)) {
                const updatedPage = { ...page };

                const matchedTitle = data.find((row) => row.content_key === `${pageSlug}.title`);
                if (matchedTitle) {
                  updatedPage.title = { vi: matchedTitle.value_vi, en: matchedTitle.value_en };
                }
                const matchedSubtitle = data.find((row) => row.content_key === `${pageSlug}.subtitle`);
                if (matchedSubtitle) {
                  updatedPage.excerpt = { vi: matchedSubtitle.value_vi, en: matchedSubtitle.value_en };
                }
                const matchedDesc = data.find((row) => row.content_key === `${pageSlug}.desc`);
                if (matchedDesc) {
                  updatedPage.content = { vi: matchedDesc.value_vi, en: matchedDesc.value_en };
                }

                // Load schematic overrides
                const schematicRows = data.filter((row) => row.content_key.startsWith(`${pageSlug}.schematic.`));
                if (schematicRows.length > 0) {
                  const currentSchematic = [...(page.schematic || SOLUTIONS_PAGE_DATA[pageSlug].schematic || [])];
                  schematicRows.forEach((row) => {
                    const parts = row.content_key.split('.');
                    const index = parseInt(parts[2]);
                    const fieldType = parts[3] as 'label' | 'desc';
                    if (!isNaN(index) && currentSchematic[index]) {
                      currentSchematic[index] = {
                        ...currentSchematic[index],
                        [fieldType]: { vi: row.value_vi, en: row.value_en }
                      };
                    }
                  });
                  updatedPage.schematic = currentSchematic;
                }

                // Load FAQ overrides
                const faqRows = data.filter((row) => row.content_key.startsWith(`${pageSlug}.faq.`));
                if (faqRows.length > 0) {
                  const currentFaqs: any[] = [];
                  faqRows.forEach((row) => {
                    const parts = row.content_key.split('.');
                    const index = parseInt(parts[2]);
                    const fieldType = parts[3] as 'q' | 'a';
                    if (!isNaN(index)) {
                      if (!currentFaqs[index]) {
                        currentFaqs[index] = { q: { vi: '', en: '' }, a: { vi: '', en: '' } };
                      }
                      currentFaqs[index] = {
                        ...currentFaqs[index],
                        [fieldType]: { vi: row.value_vi, en: row.value_en }
                      };
                    }
                  });
                  updatedPage.faqs = currentFaqs.filter((item) => {
                    return item && (
                      (item.q?.vi && item.q.vi !== 'Câu hỏi mới') || 
                      item.q?.en || 
                      item.a?.vi || 
                      item.a?.en
                    );
                  });
                }

                // Load equipment overrides
                const equipmentRows = data.filter((row) => row.content_key.startsWith(`${pageSlug}.equipment.`));
                if (equipmentRows.length > 0) {
                  const currentEquipment = [...(page.equipment || SOLUTIONS_PAGE_DATA[pageSlug].equipment || [])];
                  equipmentRows.forEach((row) => {
                    const parts = row.content_key.split('.');
                    const index = parseInt(parts[2]);
                    if (!isNaN(index) && currentEquipment[index]) {
                      currentEquipment[index] = { vi: row.value_vi, en: row.value_en };
                    }
                  });
                  updatedPage.equipment = currentEquipment;
                }

                return updatedPage;
              }

              return page;
            });
          });
        }
      } catch (err) {
        console.error('Failed to load site texts from Supabase:', err);
      }
    };
    void loadSiteTexts();
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    const fetchProducts = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('products')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) {
          const mapped = data.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            specs: item.specs,
            origin: item.origin,
            details: item.details,
            techParams: item.tech_params || [],
            image: item.image,
            visible: item.visible,
            sortOrder: item.sort_order
          }));
          setProducts(mapped);
          localStorage.setItem('cms_products', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Failed to fetch products from Supabase:', err);
      }
    };
    void fetchProducts();
  }, []);

  React.useEffect(() => {
    const fetchProjects = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('projects')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) {
          const mapped = data.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            location: item.location,
            scope: item.scope,
            capacity: item.capacity,
            result: item.result,
            equipments: item.equipments || [],
            image: item.image,
            images: item.images || [],
            visible: item.visible,
            sortOrder: item.sort_order
          }));
          setProjects(mapped);
          localStorage.setItem('cms_projects', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Failed to fetch projects from Supabase:', err);
      }
    };
    void fetchProjects();
  }, []);

  React.useEffect(() => {
    const fetchArticles = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('articles')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) {
          const mapped = data.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            excerpt: item.excerpt,
            content: item.content,
            date: item.date,
            image: item.image,
            images: item.images || [],
            visible: item.visible,
            sortOrder: item.sort_order
          }));
          setArticles(mapped);
          localStorage.setItem('cms_articles', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Failed to fetch articles from Supabase:', err);
      }
    };
    void fetchArticles();
  }, []);

  React.useEffect(() => {
    const loadLogos = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('media_assets')
          .select('bucket_id, storage_path')
          .eq('media_role', 'logo')
          .eq('visible', true)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        if (data) {
          const urls = data.map((item) => {
            const { data: { publicUrl } } = client.storage
              .from(item.bucket_id)
              .getPublicUrl(item.storage_path);
            return publicUrl;
          });
          
          setPages((currentPages) => {
            return currentPages.map((page) => {
              if (page.blocks) {
                const updatedBlocks = page.blocks.map((block: any) => {
                  if (block.id === 'b-clients') {
                    return { ...block, logos: urls };
                  }
                  return block;
                });
                return { ...page, blocks: updatedBlocks };
              }
              return page;
            });
          });
        }
      } catch (err) {
        console.error('Failed to load partner logos:', err);
      }
    };
    void loadLogos();
  }, [pages.length]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('site_settings')
          .select('*');
        if (error) throw error;
        if (data) {
          const contact = data.find((row) => row.key === 'contact_info');
          if (contact) {
            setContactInfo(contact.value);
            localStorage.setItem('cms_contact_info', JSON.stringify(contact.value));
          }
          const fuel = data.find((row) => row.key === 'fuel_settings');
          if (fuel) {
            setFuelSettings(fuel.value);
            localStorage.setItem('cms_fuel_settings', JSON.stringify(fuel.value));
          }
          const gui = data.find((row) => row.key === 'gui_settings');
          if (gui?.value) {
            const merged = {
              darkGradientType: 'custom',
              lightGradientType: 'custom',
              ...gui.value
            };
            setGuiSettings(merged);
            localStorage.setItem('cms_gui_settings', JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings from Supabase:', err);
      }
    };
    void fetchSettings();
  }, []);

  React.useEffect(() => {
    const fetchNavigation = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('navigation_items')
          .select('*')
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        if (data && data.length > 0) {
          const roots = data.filter((item) => !item.parent_id);
          const children = data.filter((item) => item.parent_id);
          const hierarchy = roots.map((root) => {
            const sub = children
              .filter((child) => child.parent_id === root.id)
              .map((child) => ({
                id: child.id,
                label: child.label,
                link: child.path,
                visible: child.visible,
                target: child.target
              }));
            
            return {
              id: root.id,
              label: root.label,
              link: root.path,
              visible: root.visible,
              target: root.target,
              ...(sub.length > 0 ? { children: sub } : {})
            };
          });
          setMenuItems(hierarchy);
        }
      } catch (err) {
        console.error('Failed to load navigation in App.tsx:', err);
      }
    };
    void fetchNavigation();
  }, []);

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

  const handleCreateProduct = async (product: any) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('products')
          .insert({
            id: product.id,
            name: product.name,
            category: product.category,
            specs: product.specs,
            origin: product.origin,
            details: product.details,
            tech_params: product.techParams || [],
            image: product.image,
            visible: product.visible !== false,
            sort_order: product.sortOrder || 0
          });
        if (error) throw error;
      } catch (err) {
        console.error('Failed to create product in Supabase:', err);
      }
    }
    setProducts((current) => [product, ...current]);
  };

  const handleUpdateProduct = async (product: any) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('products')
          .update({
            name: product.name,
            category: product.category,
            specs: product.specs,
            origin: product.origin,
            details: product.details,
            tech_params: product.techParams || [],
            image: product.image,
            visible: product.visible !== false,
            sort_order: product.sortOrder || 0
          })
          .eq('id', product.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update product in Supabase:', err);
      }
    }
    setProducts((current) => current.map((item) => item.id === product.id ? product : item));
  };

  const handleDeleteProduct = async (id: string) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('products')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete product in Supabase:', err);
      }
    }
    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const handleToggleProduct = async (id: string) => {
    const client = supabase;
    let newVisible = false;
    setProducts((current) => {
      const found = current.find((item) => item.id === id);
      if (found) newVisible = found.visible === false;
      return current.map((item) => item.id === id ? { ...item, visible: newVisible } : item);
    });

    if (client) {
      try {
        const { error } = await client
          .from('products')
          .update({ visible: newVisible })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to toggle product visibility in Supabase:', err);
      }
    }
  };

  const handleTranslateAllContent = async (onProgress: (done: number, total: number) => void) => {
    const translated = await translateWebsiteContent(
      { pages, products, projects, articles, contactInfo },
      onProgress,
    );
    setPages(translated.pages);
    setProducts(translated.products);
    setProjects(translated.projects);
    setArticles(translated.articles);
    setContactInfo(translated.contactInfo);
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
  const handleAddArticle = async (article: ArticleItem) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('articles')
          .insert({
            id: article.id,
            title: article.title,
            category: article.category,
            excerpt: article.excerpt,
            content: article.content,
            date: article.date,
            image: article.image,
            images: article.images || [],
            visible: article.visible !== false,
            sort_order: article.sortOrder || 0
          });
        if (error) throw error;
      } catch (err) {
        console.error('Failed to create article in Supabase:', err);
      }
    }
    setArticles((prev) => [article, ...prev]);
  };

  const handleDeleteArticle = async (id: string) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('articles')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete article in Supabase:', err);
      }
    }
    setArticles((prev) => prev.filter((art) => art.id !== id));
  };

  const handleToggleArticleVisibility = async (id: string) => {
    const client = supabase;
    let newVisible = false;
    setArticles((prev) => {
      const found = prev.find((art) => art.id === id);
      if (found) newVisible = !found.visible;
      return prev.map((art) => (art.id === id ? { ...art, visible: newVisible } : art));
    });

    if (client) {
      try {
        const { error } = await client
          .from('articles')
          .update({ visible: newVisible })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to toggle article visibility in Supabase:', err);
      }
    }
  };

  const handleEditArticle = async (updatedArticle: ArticleItem) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('articles')
          .update({
            title: updatedArticle.title,
            category: updatedArticle.category,
            excerpt: updatedArticle.excerpt,
            content: updatedArticle.content,
            date: updatedArticle.date,
            image: updatedArticle.image,
            images: updatedArticle.images || [],
            visible: updatedArticle.visible !== false,
            sort_order: updatedArticle.sortOrder || 0
          })
          .eq('id', updatedArticle.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update article in Supabase:', err);
      }
    }
    setArticles((prev) =>
      prev.map((art) => (art.id === updatedArticle.id ? updatedArticle : art))
    );
  };

  // Project handlers
  const handleAddProject = async (project: ProjectItem) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('projects')
          .insert({
            id: project.id,
            name: project.name,
            category: project.category,
            location: project.location,
            scope: project.scope,
            capacity: project.capacity,
            result: project.result,
            equipments: project.equipments || [],
            image: project.image,
            images: project.images || [],
            visible: project.visible !== false,
            sort_order: project.sortOrder || 0
          });
        if (error) throw error;
      } catch (err) {
        console.error('Failed to create project in Supabase:', err);
      }
    }
    setProjects((prev) => [project, ...prev]);
  };

  const handleDeleteProject = async (id: string) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('projects')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete project in Supabase:', err);
      }
    }
    setProjects((prev) => prev.filter((proj) => proj.id !== id));
  };

  const handleToggleProjectVisibility = async (id: string) => {
    const client = supabase;
    let newVisible = false;
    setProjects((prev) => {
      const found = prev.find((proj) => proj.id === id);
      if (found) newVisible = !found.visible;
      return prev.map((proj) => (proj.id === id ? { ...proj, visible: newVisible } : proj));
    });

    if (client) {
      try {
        const { error } = await client
          .from('projects')
          .update({ visible: newVisible })
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to toggle project visibility in Supabase:', err);
      }
    }
  };

  const handleEditProject = async (updatedProject: ProjectItem) => {
    const client = supabase;
    if (client) {
      try {
        const { error } = await client
          .from('projects')
          .update({
            name: updatedProject.name,
            category: updatedProject.category,
            location: updatedProject.location,
            scope: updatedProject.scope,
            capacity: updatedProject.capacity,
            result: updatedProject.result,
            equipments: updatedProject.equipments || [],
            image: updatedProject.image,
            images: updatedProject.images || [],
            visible: updatedProject.visible !== false,
            sort_order: updatedProject.sortOrder || 0
          })
          .eq('id', updatedProject.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update project in Supabase:', err);
      }
    }
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
        return <Products onAddProduct={handleAddProduct} cartItems={cartItems} products={products} setProducts={setProducts} isVisualEditing={isVisualEditing} pages={pages} />;
      case 'projects':
        return <Projects projects={projects} setProjects={setProjects} isVisualEditing={isVisualEditing} pages={pages} />;
      case 'calculator':
        return (
          <div className="container" style={{ padding: '4rem 1.5rem' }}>
            <FuelCalculator lngPrice={fuelSettings.lngPrice} lpgPrice={fuelSettings.lpgPrice} />
          </div>
        );
      case 'knowledge':
        return <Knowledge articles={articles} setArticles={setArticles} isVisualEditing={isVisualEditing} pages={pages} />;
      case 'contact':
        return (
          <Contact 
            onSubmitLead={(data: any) => handleCreateLead('wizard', data)} 
            contactInfo={contactInfo}
            setContactInfo={setContactInfo}
            isVisualEditing={isVisualEditing}
            pages={pages}
          />
        );
      case 'admin':
        return (
          <Suspense fallback={<div className="cms-route-loading"><span /><strong>{language === 'vi' ? 'Đang tải trang quản trị…' : 'Loading CMS…'}</strong></div>}><AdminDashboard
            leads={leads}
            onUpdateStatus={handleUpdateLeadStatus}
            onDeleteLead={handleDeleteLead}
            onAddLead={handleAddLead}
            fuelSettings={fuelSettings}
            onUpdateSettings={setFuelSettings}
            products={products}
            onAddProduct={handleCreateProduct}
            onEditProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleProduct={handleToggleProduct}
            onTranslateAllContent={handleTranslateAllContent}
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
            guiSettings={guiSettings}
            onUpdateGuiSettings={setGuiSettings}
            onExitCms={() => setView('home')}
          /></Suspense>
        );
      default:
        return <Home setView={setView} onAddProduct={handleAddProduct} cartItems={cartItems} pages={pages} setPages={setPages} isVisualEditing={isVisualEditing} />;
    }
  };

  const hasToolbar = isLoggedIn && currentView !== 'admin';

  return (
    <div 
      ref={appRootRef} 
      className={hasToolbar ? 'visual-editor-active-container' : ''} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        paddingTop: hasToolbar ? '54px' : '0',
        overflowX: 'clip'
      }}
    >
      <VisualTextEditor
        ref={visualEditorRef}
        rootRef={appRootRef}
        isEditing={isVisualEditing}
        currentView={currentView}
        language={language}
        onDirtyChange={setHasVisualDraft}
        onSavingChange={setVisualSaving}
        onSaved={() => {
          setVisualSaveNotice(true);
          window.setTimeout(() => setVisualSaveNotice(false), 1800);
        }}
      />
      <VisualImageEditor
        ref={visualImageEditorRef}
        rootRef={appRootRef}
        isEditing={isVisualEditing}
        currentView={currentView}
        language={language}
      />
      {isLoggedIn && currentView !== 'admin' && (
        <>
          <div data-visual-editor-ui className="visual-editor-toolbar" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999, 
            height: '54px', boxSizing: 'border-box',
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
                onClick={async () => {
                  if (isVisualEditing) await handleSaveVisualEdits();
                  setIsVisualEditing(!isVisualEditing);
                }}
              >
                {isVisualEditing ? 'Tắt Chế Độ Sửa Trực Quan' : 'Bật Chế Độ Sửa Trực Quan'}
              </button>
              {isVisualEditing && (
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  disabled={visualSaving}
                  onClick={handleSaveVisualEdits}
                >
                  {visualSaving ? (language === 'vi' ? 'Đang lưu…' : 'Saving…') : visualSaveNotice ? 'Đã lưu' : hasVisualDraft ? 'Lưu thay đổi •' : 'Lưu thay đổi'}
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
          <div style={{ height: '50px' }} />
        </>
      )}
      {currentView !== 'admin' && <Navbar
        currentView={currentView} 
        setView={setView} 
        cartCount={cartItems.length} 
        toggleCart={() => setCartOpen(!cartOpen)}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        menuItems={menuItems}
        logoUrl={guiSettings.logoUrl}
        logoHeight={guiSettings.logoHeight}
      />}
      
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      {currentView !== 'admin' && <Footer setView={setView} contactInfo={contactInfo} />}

      {currentView !== 'admin' && <QuoteDrawer
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        cartItems={cartItems} 
        onRemoveItem={handleRemoveProduct} 
        onClearCart={handleClearCart} 
        onSubmitLead={(data: any) => handleCreateLead('quote', data)}
      />}
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
