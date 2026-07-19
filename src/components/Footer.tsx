import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  setView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
  const { language, t } = useLanguage();

  const handleNav = (view: string) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={styles.footer}>
      <div className="container footer-grid">
        {/* Company Info */}
        <div style={styles.col}>
          <h4 style={styles.brandTitle}>LNG & LPG SOLUTIONS</h4>
          <span style={styles.brandSub}>COMMERCIAL KITCHEN SYSTEM</span>
          <p style={styles.brandDesc}>
            {language === 'vi' 
              ? 'Tổng thầu EPC giải pháp tồn chứa, hóa hơi và cung cấp khí hóa lỏng LNG, LPG và thiết kế thi công hệ thống bếp công nghiệp.'
              : 'EPC Contractor for LNG, LPG storage, vaporization & central gas solutions, and design-build commercial kitchens.'}
          </p>
          <div style={styles.complianceBox}>
            <ShieldCheck size={20} color="var(--color-teal)" />
            <div style={styles.complianceText}>
              <span style={{ fontWeight: 6, display: 'block', fontSize: '0.8rem' }}>ISO 9001 & ASME/EN Standard</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                {language === 'vi' ? 'Đảm bảo an toàn kỹ thuật phòng cháy chữa cháy' : 'Certified fire safety & engineering compliance'}
              </span>
            </div>
          </div>
        </div>

        {/* Solutions Links */}
        <div style={styles.col}>
          <h4 style={styles.title}>{t('navSolutions')}</h4>
          <ul style={styles.list}>
            <li><button style={styles.linkBtn} onClick={() => handleNav('lng-solution')}>{t('lngTurnkey')}</button></li>
            <li><button style={styles.linkBtn} onClick={() => handleNav('lpg-solution')}>{t('lpgTurnkey')}</button></li>
            <li><button style={styles.linkBtn} onClick={() => handleNav('conversion')}>{t('fuelConv')}</button></li>
            <li><button style={styles.linkBtn} onClick={() => handleNav('kitchen-solution')}>{t('commKitchen')}</button></li>
            <li><button style={styles.linkBtn} onClick={() => handleNav('calculator')}>{language === 'vi' ? 'Bộ tính toán hiệu quả' : 'Saving Calculator'}</button></li>
          </ul>
        </div>

        {/* Quick Access */}
        <div style={styles.col}>
          <h4 style={styles.title}>{language === 'vi' ? 'Liên kết nhanh' : 'Quick Links'}</h4>
          <ul style={styles.list}>
            <li><button style={styles.linkBtn} onClick={() => handleNav('products')}>{t('navProducts')}</button></li>
            <li><button style={styles.linkBtn} onClick={() => handleNav('projects')}>{t('navProjects')}</button></li>
            <li><button style={styles.linkBtn} onClick={() => handleNav('knowledge')}>{t('navKnowledge')}</button></li>
            <li><button style={styles.linkBtn} onClick={() => handleNav('contact')}>{t('navContact')}</button></li>
            <li><a href="#" style={styles.linkBtn}>{language === 'vi' ? 'Tải Catalogue Thiết bị' : 'Download Catalog (PDF)'}</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div style={styles.col}>
          <h4 style={styles.title}>{t('navContact')}</h4>
          <div style={styles.contactItem}>
            <MapPin size={18} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: 3 }} />
            <span style={styles.contactText}>
              {language === 'vi' 
                ? 'Lô CN-08, Khu Công Nghiệp Sóng Thần 3, Thủ Dầu Một, Bình Dương, Việt Nam'
                : 'CN-08 Lot, Song Than 3 Industrial Park, Thu Dau Mot, Binh Duong, Vietnam'}
            </span>
          </div>
          <div style={styles.contactItem}>
            <Phone size={18} color="var(--color-teal)" style={{ flexShrink: 0 }} />
            <span style={styles.contactText}>+84 (0) 274 3801 888</span>
          </div>
          <div style={styles.contactItem}>
            <Mail size={18} color="var(--color-teal)" style={{ flexShrink: 0 }} />
            <span style={styles.contactText}>info@lnglpgkitchen-solutions.com</span>
          </div>
          <div style={styles.contactItem}>
            <Clock size={18} color="var(--color-teal)" style={{ flexShrink: 0 }} />
            <span style={styles.contactText}>
              {language === 'vi' ? 'Hỗ trợ kỹ thuật khẩn cấp: 24/7' : 'Emergency support line: 24/7'}
            </span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={styles.bottom}>
        <div className="container" style={styles.bottomContainer}>
          <span style={{ fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} LNG/LPG & Commercial Kitchen solutions. All rights reserved.
          </span>
          <div style={styles.bottomLinks}>
            <a href="#" style={styles.bottomLink}>{language === 'vi' ? 'Điều khoản an toàn' : 'Safety Policy'}</a>
            <a href="#" style={styles.bottomLink}>{language === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy'}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  footer: {
    backgroundColor: 'var(--color-navy-dark)',
    color: 'var(--color-text-light)',
    borderTop: '3px solid var(--color-teal)',
    padding: '4rem 0 0',
  },

  col: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  brandTitle: {
    fontSize: '1.1rem',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: 'var(--color-white)',
    marginBottom: '0.1rem',
  },
  brandSub: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--color-teal)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
  },
  brandDesc: {
    fontSize: '0.875rem',
    opacity: 0.75,
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  complianceBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    border: '1px solid rgba(13, 148, 136, 0.2)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '0.75rem',
    width: '100%',
  },
  complianceText: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  title: {
    fontSize: '1.05rem',
    color: 'var(--color-white)',
    marginBottom: '1.5rem',
    fontWeight: 600,
    position: 'relative',
    paddingBottom: '0.5rem',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: 0,
    margin: 0,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-light)',
    opacity: 0.8,
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: 0,
    transition: 'var(--transition-fast)',
    textAlign: 'left',
  },
  contactItem: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1rem',
    alignItems: 'flex-start',
  },
  contactText: {
    fontSize: '0.875rem',
    opacity: 0.85,
    lineHeight: 1.4,
  },
  bottom: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '1.5rem 0',
    backgroundColor: '#05070f',
  },
  bottomContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  bottomLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  bottomLink: {
    fontSize: '0.8rem',
    opacity: 0.6,
    transition: 'var(--transition-fast)',
  }
};
// Note: Responsive grid styles are handled in CSS normally. We will add custom CSS triggers for media queries in index.css as well.
