import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Phone, Mail, Clock, ShieldAlert } from 'lucide-react';
import { ProjectWizard } from '../components/ProjectWizard';

interface ContactProps {
  onSubmitLead?: (data: any) => void;
  contactInfo?: {
    addressVi: string;
    addressEn: string;
    phone: string;
    email: string;
    hoursVi: string;
    hoursEn: string;
  };
  setContactInfo?: React.Dispatch<React.SetStateAction<any>>;
  isVisualEditing?: boolean;
}

export const Contact: React.FC<ContactProps> = ({ onSubmitLead, contactInfo, setContactInfo, isVisualEditing }) => {
  const { language, t } = useLanguage();

  const defaultContact = {
    addressVi: 'Lô CN-08, Khu Công Nghiệp Sóng Thần 3, Thủ Dầu Một, Bình Dương, Việt Nam',
    addressEn: 'CN-08 Lot, Song Than 3 Industrial Park, Thu Dau Mot, Binh Duong, Vietnam',
    phone: '+84 (0) 274 3801 888',
    email: 'info@lnglpgkitchen-solutions.com',
    hoursVi: 'Hỗ trợ kỹ thuật 24/7. Tiếp nhận khảo sát: 8:00 - 17:30 (Thứ 2 - Thứ 7)',
    hoursEn: 'Technical dispatch 24/7. Site survey scheduling: 8:00 AM - 5:30 PM (Mon - Sat)'
  };

  const info = contactInfo || defaultContact;

  return (
    <div style={{ width: '100%' }}>
      {/* Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <div className="container" style={styles.bannerContainer}>
          <h1 style={styles.bannerTitle}>{t('navContact')}</h1>
          <p style={styles.bannerSubtitle}>
            {language === 'vi' 
              ? 'Liên hệ với đội ngũ kỹ sư của chúng tôi để được tư vấn thiết kế và khảo sát thực địa miễn phí.' 
              : 'Get in touch with our engineering team for customized design consults and free site surveys.'}
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container contact-grid">
          {/* Contact Information */}
          <div style={styles.infoCol}>
            <h3 style={styles.sectionHeader}>{language === 'vi' ? 'Thông Tin Liên Hệ' : 'Headquarters & Info'}</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              {language === 'vi' 
                ? 'Công ty giải pháp công trình năng lượng LNG, LPG và tổng thầu thiết bị bếp công nghiệp một mối chịu trách nhiệm.' 
                : 'Your single-point responsibility EPC partner for LNG/LPG infrastructure and commercial catering systems.'}
            </p>

            <div style={styles.contactCard}>
              <div style={styles.contactItem}>
                <MapPin size={24} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: 4 }} />
                <div>
                  <h4 style={styles.itemTitle}>{language === 'vi' ? 'Văn Phòng & Nhà Xưởng' : 'HQ Office & Workshop'}</h4>
                  {isVisualEditing && setContactInfo ? (
                    <p
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText;
                        setContactInfo((prev: any) => ({ ...prev, [language === 'vi' ? 'addressVi' : 'addressEn']: text }));
                      }}
                      style={{ ...styles.itemDesc, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {language === 'vi' ? info.addressVi : info.addressEn}
                    </p>
                  ) : (
                    <p style={styles.itemDesc}>
                      {language === 'vi' ? info.addressVi : info.addressEn}
                    </p>
                  )}
                </div>
              </div>

              <div style={styles.contactItem}>
                <Phone size={24} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={styles.itemTitle}>{language === 'vi' ? 'Điện thoại đường dây nóng' : 'Telephone Hotline'}</h4>
                  {isVisualEditing && setContactInfo ? (
                    <p
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText;
                        setContactInfo((prev: any) => ({ ...prev, phone: text }));
                      }}
                      style={{ ...styles.itemDesc, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {info.phone}
                    </p>
                  ) : (
                    <p style={styles.itemDesc}>{info.phone}</p>
                  )}
                </div>
              </div>

              <div style={styles.contactItem}>
                <Mail size={24} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={styles.itemTitle}>{language === 'vi' ? 'Hộp thư điện tử' : 'Email Address'}</h4>
                  {isVisualEditing && setContactInfo ? (
                    <p
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText;
                        setContactInfo((prev: any) => ({ ...prev, email: text }));
                      }}
                      style={{ ...styles.itemDesc, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {info.email}
                    </p>
                  ) : (
                    <p style={styles.itemDesc}>{info.email}</p>
                  )}
                </div>
              </div>

              <div style={styles.contactItem}>
                <Clock size={24} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={styles.itemTitle}>{language === 'vi' ? 'Khảo Sát Khẩn Cấp' : 'Emergency & Survey Hours'}</h4>
                  {isVisualEditing && setContactInfo ? (
                    <p
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText;
                        setContactInfo((prev: any) => ({ ...prev, [language === 'vi' ? 'hoursVi' : 'hoursEn']: text }));
                      }}
                      style={{ ...styles.itemDesc, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {language === 'vi' ? info.hoursVi : info.hoursEn}
                    </p>
                  ) : (
                    <p style={styles.itemDesc}>
                      {language === 'vi' ? info.hoursVi : info.hoursEn}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Safety Note Callout */}
            <div style={styles.safetyBox}>
              <ShieldAlert size={24} color="var(--color-orange)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', margin: 0, lineHeight: 1.5 }}>
                <strong>{language === 'vi' ? 'Cảnh báo an toàn:' : 'Safety Warning:'}</strong>{' '}
                {language === 'vi'
                  ? 'Khi phát hiện rò rỉ gas tại cơ sở đun nấu hoặc trạm chứa bồn gas, vui lòng ngắt van khóa tổng khẩn cấp ngay lập tức và gọi hotline hỗ trợ 24/7 của chúng tôi.'
                  : 'In case of gas leak detection near storage tanks or piping manifolds, please shut the emergency manual valves immediately and contact our 24/7 emergency dispatch.'}
              </p>
            </div>
          </div>

          {/* Project Wizard Container */}
          <div style={styles.wizardCol}>
            <ProjectWizard onSubmitLead={onSubmitLead} />
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2070&auto=format&fit=crop")',
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

  infoCol: {
    textAlign: 'left',
  },
  sectionHeader: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: '1rem',
  },
  contactCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  contactItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'start',
  },
  itemTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: '0.25rem',
  },
  itemDesc: {
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
    lineHeight: 1.5,
  },
  safetyBox: {
    backgroundColor: 'rgba(234, 88, 12, 0.06)',
    border: '1px solid rgba(234, 88, 12, 0.2)',
    padding: '1.25rem',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  wizardCol: {
    display: 'flex',
    flexDirection: 'column',
  }
};
