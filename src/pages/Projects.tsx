import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Filter, MapPin, Zap } from 'lucide-react';

export interface ProjectItem {
  id: string;
  name: { vi: string; en: string };
  category: 'lng' | 'lpg' | 'conversion' | 'kitchen';
  location: { vi: string; en: string };
  scope: { vi: string; en: string };
  capacity: { vi: string; en: string };
  result: { vi: string; en: string };
  equipments: string[];
  image?: string;
  images?: string[];
  visible?: boolean;
  sortOrder?: number;
}

interface ProjectsProps {
  projects: ProjectItem[];
  setProjects?: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
  isVisualEditing?: boolean;
}

export const Projects: React.FC<ProjectsProps> = ({ projects, setProjects, isVisualEditing }) => {
  const { language, t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: t('projFilterAll') },
    { id: 'lng', label: 'LNG Solutions' },
    { id: 'lpg', label: 'LPG Solutions' },
    { id: 'conversion', label: t('fuelConv') },
    { id: 'kitchen', label: t('commKitchen') }
  ];

  const filteredProjects = projects
    .filter((proj) => proj.visible !== false)
    .filter((proj) => activeFilter === 'all' || proj.category === activeFilter)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div style={{ width: '100%' }}>
      {/* Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <div className="container" style={styles.bannerContainer}>
          <h1 style={styles.bannerTitle}>{t('projTitle')}</h1>
          <p style={styles.bannerSubtitle}>{t('projSubtitle')}</p>
        </div>
      </section>

      {/* Grid and filters */}
      <section className="section" style={{ backgroundColor: 'var(--color-gray-card)' }}>
        <div className="container">
          {/* Filters */}
          <div style={styles.filterBar}>
            <Filter size={18} color="var(--color-teal)" />
            <div style={styles.btnGroup}>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  style={{
                    ...styles.filterBtn,
                    ...(activeFilter === filter.id ? styles.filterBtnActive : {})
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project List Grid */}
          <div style={styles.list}>
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="card project-card-layout" style={{ padding: '2rem' }}>
                {/* Left side: details */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
                  {isVisualEditing && setProjects ? (
                    <h3
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText;
                        const list = projects.map((p) => p.id === proj.id ? { ...p, name: { ...p.name, [language]: text } } : p);
                        setProjects(list);
                      }}
                      style={{ ...styles.projectTitle, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {proj.name[language]}
                    </h3>
                  ) : (
                    <h3 style={styles.projectTitle}>{proj.name[language]}</h3>
                  )}
                  
                  <div style={styles.metaRow}>
                    <div style={styles.metaItem}>
                      <MapPin size={16} color="var(--color-teal)" />
                      {isVisualEditing && setProjects ? (
                        <span
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            const text = e.currentTarget.innerText;
                            const list = projects.map((p) => p.id === proj.id ? { ...p, location: { ...p.location, [language]: text } } : p);
                            setProjects(list);
                          }}
                          style={{ outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                        >
                          {proj.location[language]}
                        </span>
                      ) : (
                        <span>{proj.location[language]}</span>
                      )}
                    </div>
                    <div style={styles.metaItem}>
                      <Zap size={16} color="var(--color-orange)" />
                      {isVisualEditing && setProjects ? (
                        <span
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            const text = e.currentTarget.innerText;
                            const list = projects.map((p) => p.id === proj.id ? { ...p, capacity: { ...p.capacity, [language]: text } } : p);
                            setProjects(list);
                          }}
                          style={{ outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                        >
                          {proj.capacity[language]}
                        </span>
                      ) : (
                        <span>{proj.capacity[language]}</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.detailsBox}>
                    <p>
                      <strong>{t('projScope')}:</strong>{" "}
                      {isVisualEditing && setProjects ? (
                        <span
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            const text = e.currentTarget.innerText;
                            const list = projects.map((p) => p.id === proj.id ? { ...p, scope: { ...p.scope, [language]: text } } : p);
                            setProjects(list);
                          }}
                          style={{ outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                        >
                          {proj.scope[language]}
                        </span>
                      ) : (
                        <span>{proj.scope[language]}</span>
                      )}
                    </p>
                    <p style={{ marginTop: '0.75rem' }}>
                      <strong>{t('projResult')}:</strong>{" "}
                      {isVisualEditing && setProjects ? (
                        <span
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            const text = e.currentTarget.innerText;
                            const list = projects.map((p) => p.id === proj.id ? { ...p, result: { ...p.result, [language]: text } } : p);
                            setProjects(list);
                          }}
                          style={{ outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                        >
                          {proj.result[language]}
                        </span>
                      ) : (
                        <span>{proj.result[language]}</span>
                      )}
                    </p>
                  </div>

                  <div style={styles.eqBox}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main)', marginRight: '0.5rem' }}>
                      {language === 'vi' ? 'Thiết bị chính lắp đặt:' : 'Key installed equipment:'}
                    </span>
                    <div style={styles.tagWrap}>
                      {proj.equipments.map((eq, i) => (
                        <span key={i} style={styles.tag}>{eq}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: Image */}
                <div className="project-img-container" style={{ position: 'relative' }}>
                  <img 
                    src={proj.image || "https://images.unsplash.com/photo-1581094128547-1388d1397865?q=80&w=600&auto=format&fit=crop"} 
                    alt={proj.name[language]} 
                    className="project-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581094128547-1388d1397865?q=80&w=600&auto=format&fit=crop";
                    }}
                  />
                  {(proj.images?.length ?? 0) > 1 && <div className="project-gallery-strip">{proj.images!.slice(1, 5).map((url) => <img key={url} src={url} alt="" />)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '5rem 0 4rem',
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
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '1.25rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  filterBtn: {
    background: 'none',
    border: '1px solid var(--color-gray-border)',
    padding: '0.4rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
    transition: 'var(--transition-fast)',
  },
  filterBtnActive: {
    backgroundColor: 'var(--color-teal)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-teal)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  projectCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    padding: '2rem',
  },
  projectTitle: {
    fontSize: '1.25rem',
    color: 'var(--color-text-main)',
    marginBottom: '0.75rem',
  },
  metaRow: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  detailsBox: {
    backgroundColor: 'var(--color-gray-bg)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '1.25rem',
    width: '100%',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    border: '1px solid var(--color-gray-border)',
  },
  eqBox: {
    marginTop: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tagWrap: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--color-teal-light)',
    color: 'var(--color-teal)',
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
    fontWeight: 600,
  }
};
