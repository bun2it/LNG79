import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Trash2, Send, CheckCircle } from 'lucide-react';

interface ProductItem {
  id: string;
  name: { vi: string; en: string };
  category: string;
  specs: { vi: string; en: string };
}

interface QuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: ProductItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const QuoteDrawer: React.FC<QuoteDrawerProps> = ({ 
  isOpen, onClose, cartItems, onRemoveItem, onClearCart 
}) => {
  const { language, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company: '',
    contactName: '',
    phone: '',
    email: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.contactName || !form.phone || !form.email) {
      alert(language === 'vi' ? 'Vui lòng điền đủ các thông tin bắt buộc (*)' : 'Please fill all required fields (*)');
      return;
    }
    // Simulate API request
    setSubmitted(true);
    setTimeout(() => {
      onClearCart();
      setSubmitted(false);
      onClose();
    }, 4000);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.drawer} className="animate-fade-in">
        {/* Drawer Header */}
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t('quoteTitle')}</h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>

        {/* Drawer Content */}
        <div style={styles.body}>
          {submitted ? (
            <div style={styles.successContainer}>
              <CheckCircle size={48} color="var(--color-teal)" style={{ marginBottom: '1rem' }} />
              <h4 style={{ marginBottom: '0.5rem' }}>
                {language === 'vi' ? 'Gửi Yêu Cầu Báo Giá Thành Công!' : 'Quote Request Submitted!'}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                {language === 'vi' 
                  ? 'Cảm ơn bạn. Yêu cầu báo giá của bạn đã được chuyển đến bộ phận kinh doanh. Chúng tôi sẽ phản hồi sớm nhất.' 
                  : 'Thank you. Your request has been sent to our sales team. We will get back to you shortly.'}
              </p>
            </div>
          ) : cartItems.length === 0 ? (
            <div style={styles.emptyContainer}>
              <p style={{ color: 'var(--color-text-muted)' }}>{t('quoteEmpty')}</p>
            </div>
          ) : (
            <>
              {/* Product List */}
              <div style={styles.productList}>
                {cartItems.map((item) => (
                  <div key={item.id} style={styles.productCard}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>{item.name[language]}</h5>
                      <span style={styles.productSpec}>{item.specs[language]}</span>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.id)} 
                      style={styles.deleteBtn}
                      title="Remove product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Inquiry Form */}
              <form onSubmit={handleSubmit} style={styles.form}>
                <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                  {language === 'vi' ? 'Thông Tin Doanh Nghiệp' : 'Business Information'}
                </h4>
                
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Tên công ty *' : 'Company Name *'}</label>
                  <input 
                    type="text" 
                    name="company" 
                    className="form-input"
                    value={form.company}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Người đại diện *' : 'Contact Person *'}</label>
                  <input 
                    type="text" 
                    name="contactName" 
                    className="form-input"
                    value={form.contactName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Số điện thoại *' : 'Phone Number *'}</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    className="form-input"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Email liên hệ *' : 'Email Address *'}</label>
                  <input 
                    type="email" 
                    name="email" 
                    className="form-input"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Nội dung chi tiết (công suất, vị trí lắp đặt...)' : 'Inquiry details (capacity, location...)'}</label>
                  <textarea 
                    name="message" 
                    className="form-textarea" 
                    rows={3}
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-teal" style={{ width: '100%', marginTop: '1rem' }}>
                  <Send size={16} /> {t('quoteSendBtn')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 2000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '100%',
    maxWidth: '450px',
    height: '100%',
    backgroundColor: 'var(--color-gray-card)',
    boxShadow: 'var(--shadow-premium)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--color-gray-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-white)',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  },
  emptyContainer: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    padding: '2rem',
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  productCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-gray-border)',
    backgroundColor: 'var(--color-gray-bg)',
  },
  productSpec: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    display: 'block',
    marginTop: '0.15rem',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'var(--transition-fast)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  }
};
