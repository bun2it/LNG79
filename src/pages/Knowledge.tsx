import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, AlertTriangle, ShieldCheck, Flame, ChefHat } from 'lucide-react';

export interface ArticleItem {
  id: string;
  title: { vi: string; en: string };
  category: 'energy' | 'safety' | 'kitchen';
  excerpt: { vi: string; en: string };
  content: { vi: string; en: string };
  date: string;
  visible?: boolean;
  image?: string;
}

interface KnowledgeProps {
  articles: ArticleItem[];
}

export const Knowledge: React.FC<KnowledgeProps> = ({ articles }) => {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [readingArticle, setReadingArticle] = useState<ArticleItem | null>(null);

  const categories = [
    { id: 'all', label: { vi: 'Tất cả chủ đề', en: 'All Topics' } },
    { id: 'energy', label: { vi: 'Công nghệ Khí & Nhiệt', en: 'Gas & Thermal Tech' }, icon: <Flame size={16} /> },
    { id: 'safety', label: { vi: 'An toàn PCCC', en: 'Fire & Gas Safety' }, icon: <AlertTriangle size={16} /> },
    { id: 'kitchen', label: { vi: 'Thiết kế Bếp công nghiệp', en: 'Kitchen Design' }, icon: <ChefHat size={16} /> }
  ];

  const filteredArticles = articles.filter((art) => 
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
              <div key={art.id} className="card" style={{ ...styles.artCard, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {art.image && (
                  <div style={{ width: '100%', height: '180px', overflow: 'hidden', borderBottom: '1px solid var(--color-gray-border)' }}>
                    <img 
                      src={art.image} 
                      alt={art.title[language]} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                )}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
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
                    style={{ ...styles.readMoreBtn, marginTop: 'auto' }}
                  >
                    {language === 'vi' ? 'Đọc bài viết đầy đủ' : 'Read Full Manual'} →
                  </button>
                </div>
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
