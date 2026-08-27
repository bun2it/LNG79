import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowRight, Settings, CheckCircle2, Factory, 
  Flame, HardHat, Search, PenTool, Shield, Play, 
  Rocket, RotateCcw, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface HomeProps {
  setView: (view: string) => void;
  onAddProduct: (prod: any) => void;
  cartItems: any[];
  pages?: any[];
  setPages?: React.Dispatch<React.SetStateAction<any[]>>;
  isVisualEditing?: boolean;
  products?: any[];
}

const PartnerLogoMarquee: React.FC<{ logos?: string[]; names: string[] }> = ({ logos = [], names }) => {
  const entries = (logos.length ? logos : names).map((value, index) => ({
    image: logos.length ? value : '',
    name: names[index] || `Partner ${index + 1}`,
  }));
  if (!entries.length) return null;
  const loop = [...entries, ...entries];
  return <div className="partner-logo-marquee" data-visual-editor-ui aria-label="Partner logos"><div className="partner-logo-track">{loop.map((entry, index) => <div className="partner-logo-tile" key={`${entry.image || entry.name}-${index}`} aria-hidden={index >= entries.length}>{entry.image ? <img src={entry.image} alt={index < entries.length ? entry.name : ''} /> : <span>{entry.name}</span>}</div>)}</div></div>;
};

export const Home: React.FC<HomeProps> = ({ setView, onAddProduct, cartItems, pages, setPages, isVisualEditing, products }) => {
  const { language, t } = useLanguage();
  const [activeProcessStep, setActiveProcessStep] = useState<number>(0);
  const [activeProcessLoopIndex, setActiveProcessLoopIndex] = useState<number>(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const processSteps = [
    { title: t('step1'), desc: t('step1Desc') },
    { title: t('step2'), desc: t('step2Desc') },
    { title: t('step3'), desc: t('step3Desc') },
    { title: t('step4'), desc: t('step4Desc') },
    { title: t('step5'), desc: t('step5Desc') },
    { title: t('step6'), desc: t('step6Desc') },
    { title: t('step7'), desc: t('step7Desc') }
  ];

  const handleNav = (view: string) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const homePage = pages?.find(p => p.slug === '/' || p.id === 'p-1');
  const blocks = homePage?.blocks || [];
  const processBlock = blocks?.find((b: any) => b.id === 'b-process');
  const processStepsList = (language === 'vi' ? processBlock?.itemsVi : processBlock?.itemsEn)
    ?.split(',')
    ?.map((s: any) => s.trim())
    ?.filter(Boolean) || [];

  // Auto-scroll loop effect
  useEffect(() => {
    if (isVisualEditing || !processStepsList.length) return;
    const timer = setInterval(() => {
      setActiveProcessLoopIndex(prev => (prev + 1) % processStepsList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [processStepsList.length, isVisualEditing]);

  // Center active item scroll effect
  useEffect(() => {
    if (isVisualEditing || !processStepsList.length) return;
    const container = containerRef.current;
    const activeEl = stepRefs.current[activeProcessLoopIndex];
    if (container && activeEl) {
      const containerWidth = container.clientWidth;
      const activeWidth = activeEl.clientWidth;
      const activeLeft = activeEl.offsetLeft;
      const targetScrollLeft = activeLeft - (containerWidth / 2) + (activeWidth / 2);
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeProcessLoopIndex, isVisualEditing, processStepsList.length]);

  const getStepIcon = (index: number) => {
    switch (index % 7) {
      case 0: return <Search size={22} />;
      case 1: return <PenTool size={22} />;
      case 2: return <Settings size={22} />;
      case 3: return <Shield size={22} />;
      case 4: return <Play size={22} />;
      case 5: return <Rocket size={22} />;
      default: return <RotateCcw size={22} />;
    }
  };

  // Mock featured products for homepage
  const featuredProducts = [
    {
      id: 'lng-tank-1',
      name: { vi: 'Bồn Chứa Cryogenic LNG', en: 'Cryogenic LNG Storage Tank' },
      category: 'LNG',
      specs: { vi: 'Dung tích: 5m³ - 150m³, Tiêu chuẩn ASME', en: 'Capacity: 5m³ - 150m³, ASME Standard' },
      origin: 'Korea / Japan'
    },
    {
      id: 'lpg-vap-1',
      name: { vi: 'Bộ Hóa Hơi LPG Cưỡng Bức', en: 'Electric LPG Vaporizer' },
      category: 'LPG',
      specs: { vi: 'Công suất: 30kg/h - 1000kg/h', en: 'Capacity: 30kg/h - 1000kg/h' },
      origin: 'Algas-SDI (USA)'
    },
    {
      id: 'pr-skid-1',
      name: { vi: 'Cụm Điều Áp & Đo Lường (PRMS)', en: 'Pressure Regulating & Metering Skid' },
      category: 'Valves',
      specs: { vi: 'Áp suất vào: 1-9 bar, Ra: 0.1-0.5 bar', en: 'Inlet: 1-9 bar, Outlet: 0.1-0.5 bar' },
      origin: 'Europe / Vietnam Assembly'
    },
    {
      id: 'kitchen-range-1',
      name: { vi: 'Bếp Âu 4 Họng Có Lò Nướng', en: '4-Burner European Gas Range' },
      category: 'Kitchen',
      specs: { vi: 'Vật liệu: Inox 304, Đánh lửa tự động', en: 'Material: Stainless Steel 304, Auto Ignition' },
      origin: 'Malaysia / Italy'
    }
  ];

  const dynamicFeatured = products && products.length > 0
    ? products.filter(p => p.visible !== false).slice(0, 4)
    : [];
  const listFeatured = dynamicFeatured.length > 0 ? dynamicFeatured : featuredProducts;

  const renderEditableText = (
    blockId: string, 
    field: 'titleVi' | 'titleEn' | 'subtitleVi' | 'subtitleEn' | 'contentVi' | 'contentEn' | 'ctaVi' | 'ctaEn' | 'itemsVi' | 'itemsEn',
    currentVal: string,
    tagName: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div',
    extraStyle: React.CSSProperties = {}
  ) => {
    const Tag = tagName;
    const fieldBase = field.replace(/(Vi|En)$/, '');
    const contentKey = `home.block.${blockId}.${fieldBase}`;

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
          if (setPages && pages) {
            const updated = pages.map((p: any) => {
              if (p.id === 'p-1') {
                return {
                  ...p,
                  blocks: p.blocks.map((b: any) =>
                    b.id === blockId ? { ...b, [field]: text } : b
                  )
                };
              }
              return p;
            });
            setPages(updated);
          }
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





  if (blocks.length > 0) {
    return (
      <div style={{ width: '100%' }}>
        {blocks.map((block: any, idx: number) => {
          switch (block.type) {
            case 'hero':
              if (block.id === 'b-cta') {
                return (
                  <section key={block.id || idx} className="section" style={{ backgroundColor: 'var(--color-teal)', color: 'var(--color-white)', textAlign: 'center', padding: '4rem 1.5rem' }}>
                    <div className="container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
                      {renderEditableText(block.id, language === 'vi' ? 'titleVi' : 'titleEn', language === 'vi' ? block.titleVi : block.titleEn, 'h2', { fontSize: '2rem', margin: 0, fontWeight: 700, color: 'var(--color-white)' })}
                      {renderEditableText(block.id, language === 'vi' ? 'subtitleVi' : 'subtitleEn', language === 'vi' ? block.subtitleVi : block.subtitleEn, 'p', { opacity: 0.9, fontSize: '1.1rem', margin: 0 })}
                      <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-orange)', borderColor: 'var(--color-orange)', color: 'var(--color-white)', marginTop: '0.5rem' }} onClick={() => handleNav('contact')}>
                        {renderEditableText(block.id, language === 'vi' ? 'ctaVi' : 'ctaEn', language === 'vi' ? block.ctaVi || 'Liên hệ' : block.ctaEn || 'Contact Us', 'span')}
                      </button>
                    </div>
                  </section>
                );
              }
              return (
                <section key={block.id || idx} style={{ ...styles.hero, backgroundImage: block.image ? `url(${block.image})` : undefined, backgroundPosition: block.imageAlignmentY !== undefined ? `center ${block.imageAlignmentY}%` : 'center', backgroundSize: block.imageScale !== undefined ? `${block.imageScale}%` : 'cover', minHeight: '80vh', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <div style={styles.heroOverlay}></div>
                  <div className="container" style={styles.heroContainer}>
                    <div style={styles.heroText}>
                      <span style={styles.heroBadge}>
                        🛡️ {language === 'vi' ? 'Tổng thầu EPC - Tiêu chuẩn ASME & EN' : 'EPC Contractor - ASME & EN Standards'}
                      </span>
                      {renderEditableText(block.id, language === 'vi' ? 'titleVi' : 'titleEn', language === 'vi' ? block.titleVi : block.titleEn, 'h1', { fontSize: '3rem', fontWeight: 800, color: 'var(--home-on-surface)', marginBottom: '1.5rem' })}
                      {renderEditableText(block.id, language === 'vi' ? 'subtitleVi' : 'subtitleEn', language === 'vi' ? block.subtitleVi : block.subtitleEn, 'p', { fontSize: '1.2rem', color: 'var(--home-on-surface)', marginBottom: '2rem', opacity: 0.9 })}
                      <div style={styles.heroButtons}>
                        <button className="btn btn-primary" onClick={() => handleNav('contact')}>
                          {renderEditableText(block.id, language === 'vi' ? 'ctaVi' : 'ctaEn', language === 'vi' ? block.ctaVi || 'Nhận tư vấn' : block.ctaEn || 'Get Consultation', 'span')} <ArrowRight size={18} style={{ display: 'inline', marginLeft: '0.25rem' }} />
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleNav('lng-solution')}>
                          {language === 'vi' ? 'Giải pháp khí' : 'Gas Solutions'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            case 'stats':
              if (block.id === 'b-clients') {
                return (
                  <section key={block.id || idx} style={styles.clients}>
                    <div className="container" style={styles.clientsContainer}>
                      {renderEditableText(block.id, language === 'vi' ? 'titleVi' : 'titleEn', language === 'vi' ? block.titleVi : block.titleEn, 'span', { fontSize: '0.85rem', color: 'var(--color-text-muted)', letterSpacing: '2px', fontWeight: 700, display: 'block', marginBottom: '1rem', textAlign: 'center' })}
                      
                      <PartnerLogoMarquee logos={block.logos} names={(language === 'vi' ? block.itemsVi : block.itemsEn)?.split(',').map((partner: string) => partner.trim()).filter(Boolean) || []} />
                    </div>
                  </section>
                );
              }
              return (
                <section key={block.id || idx} className="section home-adaptive-section" style={{ backgroundColor: 'var(--home-surface)', color: 'var(--home-on-surface)' }}>
                  <div className="container">
                    <div className="section-title-wrap">
                      {renderEditableText(block.id, language === 'vi' ? 'titleVi' : 'titleEn', language === 'vi' ? block.titleVi : block.titleEn, 'h2', { color: 'var(--home-on-surface)', fontSize: '2rem', fontWeight: 800, textAlign: 'center' })}
                    </div>
                    {isVisualEditing ? (
                      <div style={{ width: '100%', marginTop: '1.5rem' }}>
                        <small style={{ color: 'var(--color-teal)', display: 'block', textAlign: 'center', marginBottom: '0.5rem' }}>[Sửa số liệu & nhãn cách nhau bằng dấu phẩy. Ví dụ: "85+ Dự-án, 100% PCCC"]</small>
                        {renderEditableText(block.id, language === 'vi' ? 'itemsVi' : 'itemsEn', language === 'vi' ? block.itemsVi : block.itemsEn, 'div', { display: 'flex', justifyContent: 'center', padding: '0.5rem', border: '1px dashed var(--color-teal)', borderRadius: '4px', color: 'var(--home-on-surface)' })}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'space-around', marginTop: '2rem' }}>
                        {(language === 'vi' ? block.itemsVi : block.itemsEn)?.split(',').map((stat: string, i: number) => {
                          const parts = stat.trim().split(' ');
                          const val = parts[0];
                          const label = parts.slice(1).join(' ');
                          return (
                            <div key={i} style={{ textAlign: 'center', minWidth: '180px' }}>
                              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-teal)' }}>{val}</div>
                              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>{label}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            case 'features':
              if (block.id === 'b-process') {
                const steps = (language === 'vi' ? block.itemsVi : block.itemsEn)?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
                return (
                  <section key={block.id || idx} className="section section-dark home-adaptive-section" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="container" style={{ position: 'relative' }}>
                      <div className="section-title-wrap">
                        {renderEditableText(block.id, language === 'vi' ? 'titleVi' : 'titleEn', language === 'vi' ? block.titleVi : block.titleEn, 'h2', { color: 'var(--home-on-surface)', fontSize: '2.25rem', fontWeight: 800, textAlign: 'center', marginBottom: '2.5rem' })}
                      </div>
                      
                      {isVisualEditing ? (
                        <div style={{ width: '100%', marginTop: '1.5rem' }}>
                          <small style={{ color: 'var(--color-teal)', display: 'block', textAlign: 'center', marginBottom: '0.5rem' }}>[Sửa quy trình phân tách bằng dấu phẩy]</small>
                          {renderEditableText(block.id, language === 'vi' ? 'itemsVi' : 'itemsEn', language === 'vi' ? block.itemsVi : block.itemsEn, 'div', { display: 'flex', justifyContent: 'center', padding: '0.5rem', border: '1px dashed var(--color-teal)', borderRadius: '4px', color: 'var(--home-on-surface)' })}
                        </div>
                      ) : (
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                          {/* Navigation Chevrons */}
                          <button 
                            type="button" 
                            className="carousel-nav-btn prev"
                            onClick={() => setActiveProcessLoopIndex(prev => (prev - 1 + steps.length) % steps.length)}
                            style={{
                              position: 'absolute',
                              left: '0',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              backdropFilter: 'blur(4px)',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}
                          >
                            <ChevronLeft size={24} />
                          </button>

                          {/* Steps Cards Wrapper */}
                          <div style={{
                            display: 'flex',
                            overflowX: 'auto',
                            gap: '2.5rem',
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            paddingLeft: 'calc(50% - 150px)',
                            paddingRight: 'calc(50% - 150px)',
                            paddingTop: '2.5rem',
                            paddingBottom: '2.5rem',
                            width: '100%',
                            alignItems: 'center',
                            scrollBehavior: 'smooth'
                          }} ref={containerRef} className="process-carousel-wrapper">
                            {steps.map((step: string, i: number) => {
                              const isActive = i === activeProcessLoopIndex;
                              return (
                                <div 
                                  key={i} 
                                  ref={(el) => { stepRefs.current[i] = el; }}
                                  onClick={() => setActiveProcessLoopIndex(i)}
                                  className="home-adaptive-panel" 
                                  style={{
                                    flex: '0 0 300px',
                                    backgroundColor: isActive ? 'var(--home-surface-raised)' : 'var(--home-surface)',
                                    padding: '2.25rem 2rem',
                                    borderRadius: 'var(--border-radius-lg)',
                                    border: isActive ? '2px solid var(--color-teal)' : '1px solid var(--home-surface-border)',
                                    transform: isActive ? 'scale(1.15)' : 'scale(0.92)',
                                    opacity: isActive ? 1 : 0.5,
                                    zIndex: isActive ? 5 : 1,
                                    boxShadow: isActive ? '0 15px 35px rgba(20, 184, 166, 0.25)' : 'none',
                                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    scrollSnapAlign: 'center',
                                    userSelect: 'none'
                                  }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem'
                                  }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-teal)', fontWeight: 800 }}>STEP 0{i + 1}</span>
                                  </div>
                                  <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    backgroundColor: isActive ? 'var(--color-teal)' : 'rgba(20, 184, 166, 0.08)',
                                    color: isActive ? '#fff' : 'var(--color-teal)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1.25rem',
                                    transition: 'all 0.5s ease',
                                    boxShadow: isActive ? '0 0 20px rgba(20, 184, 166, 0.4)' : 'none'
                                  }}>
                                    {getStepIcon(i)}
                                  </div>
                                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--home-on-surface)', fontSize: '1.2rem', fontWeight: 700 }}>{step.trim()}</h4>
                                  
                                  {isActive && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      fontSize: '0.75rem',
                                      color: 'var(--color-teal)',
                                      marginTop: '1.25rem',
                                      fontWeight: 'bold',
                                      backgroundColor: 'rgba(20, 184, 166, 0.08)',
                                      padding: '0.25rem 0.65rem',
                                      borderRadius: '20px',
                                      border: '1px solid rgba(20, 184, 166, 0.2)'
                                    }}>
                                      <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--color-teal)',
                                        display: 'inline-block'
                                      }} className="pulse-dot-indicator" />
                                      <span>{language === 'vi' ? 'Đang triển khai' : 'Active Stage'}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <button 
                            type="button" 
                            className="carousel-nav-btn next"
                            onClick={() => setActiveProcessLoopIndex(prev => (prev + 1) % steps.length)}
                            style={{
                              position: 'absolute',
                              right: '0',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              backdropFilter: 'blur(4px)',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}
                          >
                            <ChevronRight size={24} />
                          </button>
                        </div>
                      )}

                      {/* Dots Indicators */}
                      {!isVisualEditing && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          marginTop: '1.5rem',
                        }}>
                          {steps.map((_: any, i: number) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveProcessLoopIndex(i)}
                              style={{
                                height: '8px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                padding: 0,
                                backgroundColor: i === activeProcessLoopIndex ? 'var(--color-teal)' : 'rgba(255,255,255,0.2)',
                                width: i === activeProcessLoopIndex ? '20px' : '8px',
                              }}
                              aria-label={`Go to step ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                );
              }
              return (
                <section key={block.id || idx} className="section" style={{ backgroundColor: 'var(--color-gray-bg)' }}>
                  <div className="container">
                    <div className="section-title-wrap">
                      {renderEditableText(block.id, language === 'vi' ? 'titleVi' : 'titleEn', language === 'vi' ? block.titleVi : block.titleEn, 'h2', { fontSize: '2rem', fontWeight: 800, textAlign: 'center', color: 'var(--color-text-main)' })}
                    </div>
                    {isVisualEditing ? (
                      <div style={{ width: '100%', marginTop: '1.5rem' }}>
                        <small style={{ color: 'var(--color-teal)', display: 'block', textAlign: 'center', marginBottom: '0.5rem' }}>[Sửa các mục cách nhau bằng dấu chấm phẩy, Tiêu đề:Mô tả cách nhau bằng dấu hai chấm. Ví dụ: "Dịch vụ:Thi công lắp đặt; Bảo dưỡng:Kiểm tra thiết bị"]</small>
                        {renderEditableText(block.id, language === 'vi' ? 'itemsVi' : 'itemsEn', language === 'vi' ? block.itemsVi : block.itemsEn, 'div', { display: 'flex', justifyContent: 'center', padding: '0.5rem', border: '1px dashed var(--color-teal)', borderRadius: '4px', color: 'var(--color-text-main)' })}
                      </div>
                    ) : (
                      <div className="grid-2">
                        {(language === 'vi' ? block.itemsVi : block.itemsEn)?.split(';').map((item: string, idx2: number) => {
                          const parts = item.split(':');
                          const title = parts[0];
                          const desc = parts.slice(1).join(':');
                          return (
                            <div key={idx2} className="card" style={styles.divisionCard}>
                              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>{title?.trim()}</h3>
                              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{desc?.trim()}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            case 'text':
              return (
                <section key={block.id || idx} className="section">
                  <div className="container" style={{ maxWidth: '800px' }}>
                    {renderEditableText(block.id, language === 'vi' ? 'titleVi' : 'titleEn', language === 'vi' ? block.titleVi : block.titleEn, 'h2', { fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem' })}
                    <div style={{ color: 'var(--color-text-main)', fontSize: '1.05rem', lineHeight: 1.8, marginTop: '1.5rem', whiteSpace: 'pre-line' }}>
                      {renderEditableText(block.id, language === 'vi' ? 'contentVi' : 'contentEn', language === 'vi' ? block.contentVi : block.contentEn, 'div')}
                    </div>
                  </div>
                </section>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div className="container" style={styles.heroContainer}>
          <div style={styles.heroText}>
            <span style={styles.heroBadge}>
              🛡️ {language === 'vi' ? 'Tổng thầu EPC - Tiêu chuẩn ASME & EN' : 'EPC Contractor - ASME & EN Standards'}
            </span>
            <h1 style={styles.heroTitle}>{t('heroTitle')}</h1>
            <h2 style={styles.heroSubtitle}>{t('heroSubtitle')}</h2>
            <p style={styles.heroDesc}>{t('heroDesc')}</p>
            <div style={styles.heroButtons}>
              <button className="btn btn-primary" onClick={() => handleNav('contact')}>
                {t('heroBtnConsult')} <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={() => handleNav('lng-solution')}>
                {t('heroBtnSolutions')}
              </button>
              <a href="#" className="btn btn-outline" style={{ color: 'var(--home-on-surface)', borderColor: 'var(--home-outline)' }}>
                {t('heroBtnProfile')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Client Grid */}
      <section style={styles.clients}>
        <div className="container" style={styles.clientsContainer}>
          <span style={styles.clientsTitle}>{language === 'vi' ? 'ĐỐI TÁC CHIẾN LƯỢC & KHÁCH HÀNG' : 'STRATEGIC PARTNERS & CLIENTS'}</span>
          <PartnerLogoMarquee names={['COCA-COLA VN', 'SABECO BREWERY', 'HYUNDAI STEEL', 'VINPEARL RESORTS', 'CJ FOODS', 'SAMSUNG ELECTRONICS']} />
        </div>
      </section>

      {/* Core Business Divisions */}
      <section className="section" style={{ backgroundColor: 'var(--color-gray-bg)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{t('bizTitle')}</h2>
            <p className="section-subtitle">{t('bizSubtitle')}</p>
          </div>

          <div className="grid-2">
            {/* Division 1: Energy */}
            <div className="card" style={styles.divisionCard} onClick={() => handleNav('lng-solution')}>
              <div style={styles.divIconBox}>
                <Flame size={32} color="var(--color-teal)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('bizEnergyTitle')}</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', minHeight: '80px' }}>
                {t('bizEnergyDesc')}
              </p>
              <ul style={styles.divList}>
                <li><CheckCircle2 size={16} color="var(--color-teal)" /> {language === 'vi' ? 'Thiết kế trạm tồn chứa & hóa hơi LNG' : 'LNG Storage & Vaporization Design'}</li>
                <li><CheckCircle2 size={16} color="var(--color-teal)" /> {language === 'vi' ? 'Hệ thống bồn và đường ống khí cấp LPG' : 'LPG Tank & Piping Installation'}</li>
                <li><CheckCircle2 size={16} color="var(--color-teal)" /> {language === 'vi' ? 'Bộ tính toán chuyển đổi năng lượng sạch' : 'Fuel Conversion Engineering'}</li>
              </ul>
              <div style={styles.divLink}>
                <span>{language === 'vi' ? 'Xem các giải pháp năng lượng' : 'Explore Energy Solutions'}</span>
                <ArrowRight size={18} />
              </div>
            </div>

            {/* Division 2: Kitchen */}
            <div className="card" style={styles.divisionCard} onClick={() => handleNav('kitchen-solution')}>
              <div style={styles.divIconBox}>
                <Settings size={32} color="var(--color-orange)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('bizKitchenTitle')}</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', minHeight: '80px' }}>
                {t('bizKitchenDesc')}
              </p>
              <ul style={styles.divList}>
                <li><CheckCircle2 size={16} color="var(--color-orange)" /> {language === 'vi' ? 'Tư vấn sơ đồ layout bếp công nghiệp' : 'Commercial Kitchen Layout Design'}</li>
                <li><CheckCircle2 size={16} color="var(--color-orange)" /> {language === 'vi' ? 'Thiết bị bếp Âu - Á công suất lớn' : 'High-capacity Cooking Equipment'}</li>
                <li><CheckCircle2 size={16} color="var(--color-orange)" /> {language === 'vi' ? 'Lắp đặt gas trung tâm tích hợp hệ thống báo rò rỉ' : 'Central Gas Piping & Leak Alarm Safety'}</li>
              </ul>
              <div style={styles.divLink}>
                <span style={{ color: 'var(--color-orange)' }}>{language === 'vi' ? 'Xem giải pháp bếp công nghiệp' : 'Explore Kitchen Solutions'}</span>
                <ArrowRight size={18} color="var(--color-orange)" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Turnkey Process Timeline */}
      <section className="section section-dark home-adaptive-section">
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{t('processTitle')}</h2>
            <p className="section-subtitle">{t('processSubtitle')}</p>
          </div>

          <div style={styles.processContainer}>
            {/* Timeline Steps Header */}
            <div className="process-steps-grid">
              {processSteps.map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveProcessStep(idx)}
                  style={{
                    ...styles.processTabButton,
                    ...(activeProcessStep === idx ? styles.processTabActive : {})
                  }}
                >
                  <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Step 0{idx + 1}</span>
                  <span style={{ fontWeight: 6, fontSize: '0.9rem' }}>{step.title.split('. ')[1]}</span>
                </div>
              ))}
            </div>

            {/* Timeline Active Content */}
            <div className="process-content-box">
              <div style={styles.processContentText}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-teal)' }}>
                  {processSteps[activeProcessStep].title}
                </h3>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, opacity: 0.9 }}>
                  {processSteps[activeProcessStep].desc}
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button className="btn btn-teal" onClick={() => handleNav('contact')}>
                    {language === 'vi' ? 'Liên hệ khảo sát hiện trường' : 'Request Site Survey'}
                  </button>
                </div>
              </div>
              <div className="process-graphic-box">
                <HardHat size={120} color="var(--color-orange)" style={{ opacity: 0.15 }} />
                <span style={styles.graphicNumber}>0{activeProcessStep + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Served Industries */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{language === 'vi' ? 'Ngành Nghề Phục Vụ' : 'Industries We Serve'}</h2>
            <p className="section-subtitle">{language === 'vi' ? 'Các giải pháp nhiệt năng và gas của chúng tôi được ứng dụng rộng rãi trong nhiều lĩnh vực công nghiệp và thương mại.' : 'Our thermal & gas systems are highly integrated into industrial and commercial facilities.'}</p>
          </div>

          <div className="grid-3">
            <div style={styles.industryCard}>
              <Factory size={28} color="var(--color-teal)" />
              <h4>{language === 'vi' ? 'Sản xuất thực phẩm & Sữa' : 'Food Processing & Dairy'}</h4>
              <p>{language === 'vi' ? 'Cấp nhiệt cho nồi hơi tiệt trùng, tủ sấy lò quay dùng khí gas sạch.' : 'Sterilizers, pasteurizers, and industrial ovens using high-quality LNG/LPG.'}</p>
            </div>
            <div style={styles.industryCard}>
              <Factory size={28} color="var(--color-teal)" />
              <h4>{language === 'vi' ? 'Dệt nhuộm & Sợi vải' : 'Textile & Synthetic Yarns'}</h4>
              <p>{language === 'vi' ? 'Hóa hơi gas liên tục đảm bảo nhiệt trị ổn định cho máy sấy, máy căng kim.' : 'Continuous vaporization ensuring steady heating for stenter and dryer lines.'}</p>
            </div>
            <div style={styles.industryCard}>
              <Factory size={28} color="var(--color-teal)" />
              <h4>{language === 'vi' ? 'Gốm sứ, Gạch men & Thủy tinh' : 'Ceramics, Tiles & Glass'}</h4>
              <p>{language === 'vi' ? 'Thiết kế trạm trung tâm cấp gas cho lò nung hầm nung liên tục.' : 'Kilns and smelting furnace fuel supplying from central bulk gas skids.'}</p>
            </div>
            <div style={styles.industryCard}>
              <Factory size={28} color="var(--color-teal)" />
              <h4>{language === 'vi' ? 'Luyện kim & Xử lý nhiệt' : 'Metal & Heat Treatment'}</h4>
              <p>{language === 'vi' ? 'Hệ thống bảo vệ khí gas trộn, tôi kim loại khí trơ an toàn tuyệt đối.' : 'Safe mixing gases for metals annealing, tempering, and coating lines.'}</p>
            </div>
            <div style={styles.industryCard}>
              <Factory size={28} color="var(--color-teal)" />
              <h4>{language === 'vi' ? 'Khách sạn, Resort & Casino' : 'Hotels, Resorts & Casinos'}</h4>
              <p>{language === 'vi' ? 'Tư vấn bếp công nghiệp Âu - Á và bồn cấp gas trung tâm ngầm hóa.' : 'Commercial high-end cooking layout integrated with underground gas tanks.'}</p>
            </div>
            <div style={styles.industryCard}>
              <Factory size={28} color="var(--color-teal)" />
              <h4>{language === 'vi' ? 'Bếp ăn công nghiệp nhà máy' : 'Central Factory Kitchens'}</h4>
              <p>{language === 'vi' ? 'Thi công bếp nấu công suất lớn phục vụ hàng ngàn suất ăn công nhân.' : 'High-volume cooking ranges supplying thousands of worker meals daily.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="section" style={{ backgroundColor: 'var(--color-gray-bg)', borderTop: '1px solid var(--color-gray-border)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{language === 'vi' ? 'Thiết Bị Kỹ Thuật Nổi Bật' : 'Featured Technical Products'}</h2>
            <p className="section-subtitle">{t('prodCenterDesc')}</p>
          </div>

          <div className="grid-4" style={{ marginBottom: '3rem' }}>
            {listFeatured.map((prod) => {
              const inCart = cartItems.some(i => i.id === prod.id);
              return (
                <div key={prod.id} className="card" style={styles.productCard}>
                  <span style={styles.prodCat}>{prod.category}</span>
                  <h4 style={styles.prodName}>{prod.name[language]}</h4>
                  <div style={styles.prodSpecList}>
                    <p><strong>{t('prodSpec')}:</strong> {prod.specs[language]}</p>
                    <p><strong>{t('prodOrigin')}:</strong> {prod.origin}</p>
                  </div>
                  <button 
                    className={`btn ${inCart ? 'btn-outline' : 'btn-teal'} btn-sm`} 
                    style={{ width: '100%', marginTop: '1.5rem' }}
                    onClick={() => !inCart && onAddProduct(prod)}
                  >
                    {inCart ? t('prodInQuote') : t('prodAddQuote')}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-secondary" onClick={() => handleNav('products')}>
              {language === 'vi' ? 'Xem toàn bộ catalogue sản phẩm' : 'Explore Full Equipment Catalog'}
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Tool Redirect Section */}
      <section className="section section-dark home-adaptive-section" style={styles.calculatorSection}>
        <div style={styles.calculatorSectionOverlay}></div>
        <div className="container" style={styles.calcSectionContent}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', color: 'var(--home-on-surface)' }}>
            {language === 'vi' ? 'Bạn đang tìm cách tối ưu hóa chi phí năng lượng?' : 'Looking to optimize your thermal energy costs?'}
          </h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.85, maxWidth: '800px', margin: '0 auto 2.5rem' }}>
            {language === 'vi' 
              ? 'Sử dụng bộ công cụ tính toán hiệu quả năng lượng để ước tính chi phí tiết kiệm khi chuyển từ dầu DO, than sang LNG/LPG sạch.' 
              : 'Try our fuel conversion calculators to estimate annual savings and carbon reduction from transitioning DO, coal or LPG.'}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => handleNav('calculator')}>
              {language === 'vi' ? 'Sử dụng máy tính chuyển đổi' : 'Use saving calculator'}
            </button>
            <button className="btn btn-secondary" onClick={() => handleNav('contact')}>
              {language === 'vi' ? 'Đăng ký nhận Company Profile' : 'Request Company Profile'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  hero: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop")', // high tech engineering background
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '8rem 0 7rem',
    color: 'var(--home-on-surface)',
    textAlign: 'left',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'var(--home-hero-image)',
    backgroundColor: 'var(--home-hero-color)',
    filter: 'var(--banner-overlay-filter, none)',
    transform: 'var(--banner-overlay-transform, none)',
    zIndex: 1,
  },
  heroContainer: {
    position: 'relative',
    zIndex: 2,
  },
  heroText: {
    maxWidth: '750px',
  },
  heroBadge: {
    display: 'inline-block',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--color-teal)',
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--border-radius-full)',
    border: '1px solid rgba(13, 148, 136, 0.3)',
    textTransform: 'uppercase',
    marginBottom: '1.5rem',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 800,
    lineHeight: 1.15,
    color: 'var(--home-on-surface)',
    marginBottom: '0.5rem',
    fontFamily: 'var(--font-heading)',
  },
  heroSubtitle: {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: 'var(--color-teal)',
    marginBottom: '1.5rem',
    fontFamily: 'var(--font-heading)',
  },
  heroDesc: {
    fontSize: '1.1rem',
    opacity: 0.85,
    lineHeight: 1.7,
    marginBottom: '2.5rem',
  },
  heroButtons: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  clients: {
    backgroundColor: 'var(--home-surface)',
    borderBottom: '1px solid var(--home-surface-border)',
    padding: '2rem 0',
  },
  clientsContainer: {
    display: 'block',
  },
  clientsTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--color-teal)',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  clientsGrid: {
    display: 'flex',
    gap: '2.5rem',
    flexWrap: 'wrap',
    color: 'var(--home-on-surface-muted)',
    opacity: 0.72,
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  divisionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    cursor: 'pointer',
  },
  divIconBox: {
    backgroundColor: 'var(--color-gray-bg)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '1.5rem',
    border: '1px solid var(--color-gray-border)',
  },
  divList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: 0,
    margin: '0 0 2rem 0',
    fontSize: '0.9rem',
  },
  divListLi: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  divLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--color-teal)',
    marginTop: 'auto',
  },
  processContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    marginTop: '2rem',
  },

  processTabButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0.75rem 0.5rem',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    color: 'var(--home-on-surface-muted)',
    opacity: 0.7,
    transition: 'var(--transition-fast)',
    textAlign: 'left',
  },
  processTabActive: {
    color: 'var(--color-teal)',
    borderBottomColor: 'var(--color-teal)',
    opacity: 1,
  },

  processContentText: {
    display: 'flex',
    flexDirection: 'column',
  },

  graphicNumber: {
    position: 'absolute',
    fontSize: '6rem',
    fontWeight: 900,
    color: 'var(--home-graphic-number)',
    fontFamily: 'var(--font-heading)',
  },
  industryCard: {
    backgroundColor: 'var(--color-gray-card)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '2rem 1.5rem',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    transition: 'var(--transition-normal)',
  },
  productCard: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
  },
  prodCat: {
    fontSize: '0.7rem',
    fontWeight: 700,
    backgroundColor: 'var(--color-teal-light)',
    color: 'var(--color-teal)',
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
    alignSelf: 'flex-start',
    marginBottom: '1rem',
    textTransform: 'uppercase',
  },
  prodName: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--color-text-main)',
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },
  prodSpecList: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  calculatorSection: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    textAlign: 'center',
    padding: '6rem 0',
  },
  calculatorSectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--home-calculator-overlay)',
    zIndex: 1,
  },
  calcSectionContent: {
    position: 'relative',
    zIndex: 2,
  }
};
// List item visual alignment styling
styles.divList = {
  ...styles.divList,
  paddingLeft: 0,
};
