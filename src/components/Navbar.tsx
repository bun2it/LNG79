import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Menu, X, ChevronDown, Flame, ChefHat, 
  ShoppingCart, Languages 
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  cartCount: number;
  toggleCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, cartCount, toggleCart }) => {
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
          <div className="nav-logo-icon">
            <Flame size={20} className="icon-flame" />
            <ChefHat size={20} className="icon-chef" />
          </div>
          <div className="nav-logo-text">
            <span className="nav-logo-title">LNG & LPG SYSTEM</span>
            <span className="nav-logo-subtitle">COMMERCIAL KITCHEN SOLUTION</span>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="nav-links">
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
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
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

          {/* Mobile Menu Toggle */}
          <button className="nav-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
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
          </div>
        </div>
      )}
    </nav>
  );
};
