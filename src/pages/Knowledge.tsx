import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, AlertTriangle, ShieldCheck, Flame, ChefHat } from 'lucide-react';

interface ArticleItem {
  id: string;
  title: { vi: string; en: string };
  category: 'energy' | 'safety' | 'kitchen';
  excerpt: { vi: string; en: string };
  content: { vi: string; en: string };
  date: string;
}

const ARTICLES_DATA: ArticleItem[] = [
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
    date: '2026-06-15'
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
    date: '2026-07-02'
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
    date: '2026-07-10'
  }
];

export const Knowledge: React.FC = () => {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [readingArticle, setReadingArticle] = useState<ArticleItem | null>(null);

  const categories = [
    { id: 'all', label: { vi: 'Tất cả chủ đề', en: 'All Topics' } },
    { id: 'energy', label: { vi: 'Công nghệ Khí & Nhiệt', en: 'Gas & Thermal Tech' }, icon: <Flame size={16} /> },
    { id: 'safety', label: { vi: 'An toàn PCCC', en: 'Fire & Gas Safety' }, icon: <AlertTriangle size={16} /> },
    { id: 'kitchen', label: { vi: 'Thiết kế Bếp công nghiệp', en: 'Kitchen Design' }, icon: <ChefHat size={16} /> }
  ];

  const filteredArticles = ARTICLES_DATA.filter((art) => 
    activeCategory === 'all' || art.category === activeCategory
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <div className="container" style={styles.bannerContainer}>
          <h1 style={styles.bannerTitle}>{language === 'vi' ? 'Thư Viện Kiến Thức Kỹ Thuật' : 'Technical Knowledge Library'}</h1>
          <p style={styles.bannerSubtitle}>
            {language === 'vi' 
              ? 'Tài liệu hướng dẫn chuyên sâu về năng lượng khí đốt công nghiệp và tiêu chuẩn bếp thương mại.' 
              : 'In-depth manuals and engineering guides regarding industrial gas power and kitchen systems.'}
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          {/* Category Tabs */}
          <div style={styles.tabContainer}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  ...styles.tabBtn,
                  ...(activeCategory === cat.id ? styles.tabBtnActive : {})
                }}
              >
                {cat.icon && <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>{cat.icon}</span>}
                {cat.label[language]}
              </button>
            ))}
          </div>

          {/* Article Cards Grid */}
          <div className="grid-3" style={{ marginTop: '2.5rem' }}>
            {filteredArticles.map((art) => (
              <div key={art.id} className="card" style={styles.artCard}>
                <div style={styles.artMeta}>
                  <span style={styles.artCat}>{art.category.toUpperCase()}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={12} />
                    <span>{art.date}</span>
                  </div>
                </div>

                <h3 style={styles.artTitle}>{art.title[language]}</h3>
                <p style={styles.artExcerpt}>{art.excerpt[language]}</p>

                <button 
                  onClick={() => setReadingArticle(art)} 
                  style={styles.readMoreBtn}
                >
                  {language === 'vi' ? 'Đọc bài viết đầy đủ' : 'Read Full Manual'} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Detail Overlay Modal */}
      {readingArticle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-white)' }}>
                {readingArticle.title[language]}
              </h3>
              <button onClick={() => setReadingArticle(null)} style={styles.closeBtn}>Close</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={styles.artCat}>{readingArticle.category.toUpperCase()}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Date: {readingArticle.date}</span>
              </div>
              
              <div style={styles.contentParagraphs}>
                {readingArticle.content[language]}
              </div>

              <div style={styles.safetyCallout}>
                <ShieldCheck size={20} color="var(--color-teal)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', margin: 0 }}>
                  {language === 'vi' 
                    ? 'Tất cả các tài liệu kỹ thuật đều được đội ngũ Kỹ sư An toàn Gas của chúng tôi biên soạn và đối soát với quy chuẩn hiện hành.' 
                    : 'All manuals are verified by our gas safety engineering board to comply with active fire hazard codes.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '5rem 0 4rem',
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
  bannerTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
    fontFamily: 'var(--font-heading)',
  },
  bannerSubtitle: {
    fontSize: '1.1rem',
    opacity: 0.85,
  },
  tabContainer: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '1.25rem',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: '1px solid var(--color-gray-border)',
    padding: '0.5rem 1.25rem',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
    transition: 'var(--transition-fast)',
  },
  tabBtnActive: {
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-navy)',
  },
  artCard: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    padding: '1.5rem',
  },
  artMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginBottom: '1rem',
  },
  artCat: {
    fontWeight: 700,
    color: 'var(--color-teal)',
    backgroundColor: 'var(--color-teal-light)',
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  artTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },
  artExcerpt: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
    minHeight: '80px',
  },
  readMoreBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-orange)',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.875rem',
    marginTop: 'auto',
    textAlign: 'left',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 2500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '600px',
    backgroundColor: 'var(--color-gray-card)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-premium)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-white)',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  modalBody: {
    padding: '1.5rem',
    textAlign: 'left',
  },
  contentParagraphs: {
    fontSize: '0.95rem',
    lineHeight: 1.7,
    color: 'var(--color-text-main)',
    marginBottom: '1.5rem',
  },
  safetyCallout: {
    display: 'flex',
    gap: '0.75rem',
    backgroundColor: 'rgba(13, 148, 136, 0.06)',
    border: '1px solid rgba(13, 148, 136, 0.2)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    alignItems: 'center',
  }
};
