import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { QuoteDrawer } from './components/QuoteDrawer';
import { Home } from './pages/Home';
import { Solutions } from './pages/Solutions';
import { Products } from './pages/Products';
import { Projects } from './pages/Projects';
import type { ProjectItem } from './pages/Projects';
import { FuelCalculator } from './components/FuelCalculator';
import { Knowledge } from './pages/Knowledge';
import type { ArticleItem } from './pages/Knowledge';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/AdminDashboard';

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
  const [currentView, setView] = useState<string>('home');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [fuelSettings, setFuelSettings] = useState({ lngPrice: 18500, lpgPrice: 23000 });
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles);
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);

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

  // Render the current view page
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home setView={setView} onAddProduct={handleAddProduct} cartItems={cartItems} />;
      case 'lng-solution':
        return <Solutions subView="lng-solution" setView={setView} />;
      case 'lpg-solution':
        return <Solutions subView="lpg-solution" setView={setView} />;
      case 'conversion':
        return <Solutions subView="conversion" setView={setView} />;
      case 'kitchen-solution':
        return <Solutions subView="kitchen-solution" setView={setView} />;
      case 'products':
        return <Products onAddProduct={handleAddProduct} cartItems={cartItems} />;
      case 'projects':
        return <Projects projects={projects.filter((p) => p.visible !== false)} />;
      case 'calculator':
        return (
          <div className="container" style={{ padding: '4rem 1.5rem' }}>
            <FuelCalculator lngPrice={fuelSettings.lngPrice} lpgPrice={fuelSettings.lpgPrice} />
          </div>
        );
      case 'knowledge':
        return <Knowledge articles={articles.filter((a) => a.visible !== false)} />;
      case 'contact':
        return <Contact onSubmitLead={(data: any) => handleCreateLead('wizard', data)} />;
      case 'admin':
        return (
          <AdminDashboard 
            leads={leads}
            onUpdateStatus={handleUpdateLeadStatus}
            onDeleteLead={handleDeleteLead}
            fuelSettings={fuelSettings}
            onUpdateSettings={setFuelSettings}
            articles={articles}
            onAddArticle={handleAddArticle}
            onDeleteArticle={handleDeleteArticle}
            onToggleArticle={handleToggleArticleVisibility}
            projects={projects}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onToggleProject={handleToggleProjectVisibility}
          />
        );
      default:
        return <Home setView={setView} onAddProduct={handleAddProduct} cartItems={cartItems} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        cartCount={cartItems.length} 
        toggleCart={() => setCartOpen(!cartOpen)} 
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
