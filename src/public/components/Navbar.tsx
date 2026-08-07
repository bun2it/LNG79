import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Menu, X, ChevronDown, Flame, ChefHat, 
  ShoppingCart, Languages, Sun, Moon, LayoutDashboard, Users
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  cartCount: number;
  toggleCart: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  menuItems?: any[];
  logoUrl?: string;
  logoHeight?: number;
  isLoggedIn?: boolean;
  userProfile?: { account_type: string; name?: string } | null;
  onGoToCms?: () => void;
  onGoToCrm?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, cartCount, toggleCart, theme, toggleTheme, menuItems = [], logoUrl, logoHeight, isLoggedIn, userProfile, onGoToCms, onGoToCrm }) => {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    setView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        {/* Logo */}
        <div className="nav-logo" onClick={() => handleNav('home')}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: `${logoHeight || 42}px`, maxWidth: '240px', objectFit: 'contain' }} />
          ) : (
            <>
              <div className="nav-logo-icon">
                <Flame size={20} className="icon-flame" />
                <ChefHat size={20} className="icon-chef" />
              </div>
              <div className="nav-logo-text">
                <span className="nav-logo-title">LNG & LPG SYSTEM</span>
                <span className="nav-logo-subtitle">COMMERCIAL KITCHEN SOLUTION</span>
              </div>
            </>
          )}
        </div>

        {/* Desktop Links */}
        <div className="nav-links">
          {menuItems && menuItems.length > 0 ? (
            menuItems.filter((item) => item.visible !== false).map((item) => {
              if (item.children && item.children.length > 0) {
                const isActive = item.children.some((child: any) => currentView === child.link);
                return (
                  <div className="nav-dropdown-container" key={item.id}>
                    <button className={`nav-link nav-dropdown-btn ${isActive ? 'active' : ''}`}>
                      {language === 'vi' ? item.label.vi : item.label.en} <ChevronDown size={14} className="dropdown-arrow" />
                    </button>
                    <div className="nav-dropdown-menu">
                      {item.children.filter((child: any) => child.visible !== false).map((child: any) => (
                        <div className="nav-dropdown-item" key={child.id} onClick={() => handleNav(child.link)}>
                          <div className="nav-dropdown-item-title">{language === 'vi' ? child.label.vi : child.label.en}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <button 
                  key={item.id}
                  className={`nav-link ${currentView === item.link ? 'active' : ''}`}
                  onClick={() => handleNav(item.link)}
                >
                  {language === 'vi' ? item.label.vi : item.label.en}
                </button>
              );
            })
          ) : (
            <>
              <button 
                className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => handleNav('home')}
              >
                {t('navHome')}
              </button>

              <div className="nav-dropdown-container">
                <button 
                  className={`nav-link nav-dropdown-btn ${(currentView.includes('solution') || currentView === 'conversion') ? 'active' : ''}`}
                >
                  {t('navSolutions')} <ChevronDown size={14} className="dropdown-arrow" />
                </button>
                
                <div className="nav-dropdown-menu">
                  <div className="nav-dropdown-item" onClick={() => handleNav('lng-solution')}>
                    <div className="nav-dropdown-item-title">{t('lngTurnkey')}</div>
                    <div className="nav-dropdown-item-desc">
                      {language === 'vi' ? 'Trạm tồn chứa khí hóa hơi LNG' : 'Bulk regasification station'}
                    </div>
                  </div>
                  <div className="nav-dropdown-item" onClick={() => handleNav('lpg-solution')}>
                    <div className="nav-dropdown-item-title">{t('lpgTurnkey')}</div>
                    <div className="nav-dropdown-item-desc">
                      {language === 'vi' ? 'Hệ thống bồn, gas hóa hơi công nghiệp' : 'LPG bulk & manifold gas supply'}
                    </div>
                  </div>
                  <div className="nav-dropdown-item" onClick={() => handleNav('conversion')}>
                    <div className="nav-dropdown-item-title">{t('fuelConv')}</div>
                    <div className="nav-dropdown-item-desc">
                      {language === 'vi' ? 'Cải tạo đầu đốt than/FO sang khí sạch' : 'Burner fuel conversion to gas'}
                    </div>
                  </div>
                  <div className="nav-dropdown-item" onClick={() => handleNav('kitchen-solution')}>
                    <div className="nav-dropdown-item-title">{t('commKitchen')}</div>
                    <div className="nav-dropdown-item-desc">
                      {language === 'vi' ? 'Thiết kế bếp và an toàn gas trung tâm' : 'Central gas kitchen integration'}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className={`nav-link ${currentView === 'products' ? 'active' : ''}`}
                onClick={() => handleNav('products')}
              >
                {t('navProducts')}
              </button>

              <button 
                className={`nav-link ${currentView === 'projects' ? 'active' : ''}`}
                onClick={() => handleNav('projects')}
              >
                {t('navProjects')}
              </button>

              <button 
                className={`nav-link ${currentView === 'calculator' ? 'active' : ''}`}
                onClick={() => handleNav('calculator')}
              >
                {language === 'vi' ? 'Bộ tính toán' : 'Calculators'}
              </button>

              <button 
                className={`nav-link ${currentView === 'knowledge' ? 'active' : ''}`}
                onClick={() => handleNav('knowledge')}
              >
                {t('navKnowledge')}
              </button>

              <button 
                className={`nav-link ${currentView === 'contact' ? 'active' : ''}`}
                onClick={() => handleNav('contact')}
              >
                {t('navContact')}
              </button>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            className="nav-theme-btn"
            title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Lang Toggle */}
          <button onClick={toggleLanguage} className="nav-lang-btn" title={t('language')}>
            <Languages size={16} />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Cart Toggle */}
          <button onClick={toggleCart} className="nav-cart-btn" title="View Quote Request">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
          </button>

          {/* Consultation CTA */}
          <button 
            className="btn btn-primary nav-cta-btn" 
            onClick={() => handleNav('contact')}
          >
            {t('btnConsult')}
          </button>

          {/* CMS / CRM Login buttons (shown when logged in) */}
          {isLoggedIn && userProfile && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {(userProfile.account_type === 'admin') && onGoToCms && (
                <button
                  onClick={onGoToCms}
                  title="Vào trang quản trị CMS"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20,184,166,0.5)',
                    color: '#14b8a6', borderRadius: '6px', padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(20,184,166,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(20,184,166,0.15)')}
                >
                  <LayoutDashboard size={13} />
                  CMS
                </button>
              )}
              {(userProfile.account_type === 'admin' || userProfile.account_type === 'user') && onGoToCrm && (
                <button
                  onClick={onGoToCrm}
                  title="Vào phân hệ CRM"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.5)',
                    color: '#818cf8', borderRadius: '6px', padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                >
                  <Users size={13} />
                  CRM
                </button>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button className="nav-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          {menuItems && menuItems.length > 0 ? (
            menuItems.filter((item) => item.visible !== false).map((item) => {
              if (item.children && item.children.length > 0) {
                return (
                  <React.Fragment key={item.id}>
                    <div className="nav-mobile-subheader">{language === 'vi' ? item.label.vi : item.label.en}</div>
                    {item.children.filter((child: any) => child.visible !== false).map((child: any) => (
                      <button className="nav-mobile-sublink" key={child.id} onClick={() => handleNav(child.link)}>
                        {language === 'vi' ? child.label.vi : child.label.en}
                      </button>
                    ))}
                  </React.Fragment>
                );
              }
              return (
                <button key={item.id} className="nav-mobile-link" onClick={() => handleNav(item.link)}>
                  {language === 'vi' ? item.label.vi : item.label.en}
                </button>
              );
            })
          ) : (
            <>
              <button className="nav-mobile-link" onClick={() => handleNav('home')}>{t('navHome')}</button>
              
              <div className="nav-mobile-subheader">{t('navSolutions')}</div>
              <button className="nav-mobile-sublink" onClick={() => handleNav('lng-solution')}>{t('lngTurnkey')}</button>
              <button className="nav-mobile-sublink" onClick={() => handleNav('lpg-solution')}>{t('lpgTurnkey')}</button>
              <button className="nav-mobile-sublink" onClick={() => handleNav('conversion')}>{t('fuelConv')}</button>
              <button className="nav-mobile-sublink" onClick={() => handleNav('kitchen-solution')}>{t('commKitchen')}</button>
              
              <button className="nav-mobile-link" onClick={() => handleNav('products')}>{t('navProducts')}</button>
              <button className="nav-mobile-link" onClick={() => handleNav('projects')}>{t('navProjects')}</button>
              <button className="nav-mobile-link" onClick={() => handleNav('calculator')}>{language === 'vi' ? 'Bộ tính toán' : 'Calculators'}</button>
              <button className="nav-mobile-link" onClick={() => handleNav('knowledge')}>{t('navKnowledge')}</button>
              <button className="nav-mobile-link" onClick={() => handleNav('contact')}>{t('navContact')}</button>
            </>
          )}
          
          <div className="nav-mobile-actions">
            <button onClick={toggleLanguage} className="nav-lang-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              <Languages size={18} style={{ marginRight: 8 }} />
              <span>{language === 'vi' ? 'Tiếng Anh (EN)' : 'Vietnamese (VI)'}</span>
            </button>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={() => handleNav('contact')}
            >
              {t('btnConsult')}
            </button>
            {isLoggedIn && userProfile && (
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                {userProfile.account_type === 'admin' && onGoToCms && (
                  <button
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.4rem', padding: '0.65rem', borderRadius: '8px',
                      background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.4)',
                      color: '#14b8a6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                    }}
                    onClick={() => { onGoToCms(); setMobileMenuOpen(false); }}
                  >
                    <LayoutDashboard size={15} /> CMS
                  </button>
                )}
                {(userProfile.account_type === 'admin' || userProfile.account_type === 'user') && onGoToCrm && (
                  <button
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.4rem', padding: '0.65rem', borderRadius: '8px',
                      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
                      color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                    }}
                    onClick={() => { onGoToCrm(); setMobileMenuOpen(false); }}
                  >
                    <Users size={15} /> CRM
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
