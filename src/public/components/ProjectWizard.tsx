import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Building2, Cylinder, Flame, ChefHat, Check, 
  ArrowRight, ArrowLeft, Upload, Send 
} from 'lucide-react';

interface ProjectWizardProps {
  onComplete?: () => void;
  onSubmitLead?: (data: any) => void;
}

export const ProjectWizard: React.FC<ProjectWizardProps> = ({ onComplete, onSubmitLead }) => {
  const { language, t } = useLanguage();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    industry: '',
    solution: '',
    consumption: '',
    projectType: 'new', // new | conversion
    timeline: '3-6', // <3 | 3-6 | 6+
    province: '',
    contactName: '',
    companyName: '',
    phone: '',
    email: '',
    fileName: '',
    details: ''
  });

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const selectIndustry = (ind: string) => {
    setFormData({ ...formData, industry: ind });
  };

  const selectSolution = (sol: string) => {
    setFormData({ ...formData, solution: sol });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, fileName: e.target.files[0].name });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactName || !formData.phone || !formData.email || !formData.companyName) {
      alert(language === 'vi' ? 'Vui lòng nhập đầy đủ thông tin liên hệ bắt buộc.' : 'Please fill all required contact fields.');
      return;
    }
    
    if (onSubmitLead) {
      onSubmitLead({
        company: formData.companyName,
        contactName: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        province: formData.province,
        details: `Khảo sát dự án:\nNgành: ${formData.industry}\nGiải pháp: ${formData.solution}\nTiêu thụ dự kiến: ${formData.consumption}\nLoại dự án: ${formData.projectType === 'new' ? 'Đầu tư mới' : 'Cải tạo'}\nTimeline: ${formData.timeline === '3-6' ? '3-6 tháng' : formData.timeline === '<3' ? 'Dưới 3 tháng' : 'Trên 6 tháng'}\nTập tin đính kèm: ${formData.fileName || 'Không có'}\n\nGhi chú: ${formData.details}`
      });
    }

    setSubmitted(true);
  };

  const industries = [
    { id: 'fnb', label: { vi: 'Thực phẩm & Đồ uống', en: 'Food & Beverage' } },
    { id: 'textile', label: { vi: 'Dệt nhuộm & Sợi', en: 'Textile & Yarn' } },
    { id: 'ceramic', label: { vi: 'Gốm sứ & Thủy tinh', en: 'Ceramic & Glass' } },
    { id: 'metal', label: { vi: 'Kim loại & Nhiệt luyện', en: 'Metal & Heat Treatment' } },
    { id: 'hospitality', label: { vi: 'Khách sạn, Resort & Bếp nhà hàng', en: 'Hotel, Resort & Restaurant' } },
    { id: 'chemical', label: { vi: 'Hóa chất & Nhựa', en: 'Chemicals & Plastics' } }
  ];

  const solutions = [
    { id: 'lng', label: { vi: 'Turnkey LNG Solution', en: 'Turnkey LNG Solution' }, icon: <Flame size={20} /> },
    { id: 'lpg', label: { vi: 'Turnkey LPG Solution', en: 'Turnkey LPG Solution' }, icon: <Cylinder size={20} /> },
    { id: 'conversion', label: { vi: 'Chuyển đổi Nhiên liệu', en: 'Fuel Conversion' }, icon: <Flame size={20} color="var(--color-orange)" /> },
    { id: 'kitchen', label: { vi: 'Bếp Công nghiệp & Gas trung tâm', en: 'Kitchen & Central Gas' }, icon: <ChefHat size={20} /> }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.wizardCard}>
        {/* Progress Bar */}
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${(step / 4) * 100}%`}}></div>
        </div>

        {/* Header */}
        <div style={styles.header}>
          <h3 style={{ fontSize: '1.25rem' }}>{t('wizardTitle')}</h3>
          <span style={styles.stepBadge}>Step {step} of 4</span>
        </div>

        {submitted ? (
          <div style={styles.successContainer} className="animate-fade-in">
            <div style={styles.successIcon}><Check size={40} color="var(--color-white)" /></div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {language === 'vi' ? 'Yêu Cầu Đã Được Gửi!' : 'Request Successfully Submitted!'}
            </h4>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', textAlign: 'center', maxWidth: '500px' }}>
              {t('wizardSuccess')}
            </p>
            <div style={styles.summaryCard}>
              <h5 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                {language === 'vi' ? 'Tóm tắt thông tin đã gửi:' : 'Summary of submitted info:'}
              </h5>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li><strong>{language === 'vi' ? 'Ngành:' : 'Industry:'}</strong> {industries.find(i => i.id === formData.industry)?.label[language] || formData.industry}</li>
                <li><strong>{language === 'vi' ? 'Giải pháp:' : 'Solution:'}</strong> {solutions.find(s => s.id === formData.solution)?.label[language] || formData.solution}</li>
                <li><strong>{language === 'vi' ? 'Địa điểm:' : 'Location:'}</strong> {formData.province}</li>
                <li><strong>{language === 'vi' ? 'Công ty:' : 'Company:'}</strong> {formData.companyName}</li>
              </ul>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setSubmitted(false);
                setStep(1);
                setFormData({
                  industry: '', solution: '', consumption: '', projectType: 'new',
                  timeline: '3-6', province: '', contactName: '', companyName: '',
                  phone: '', email: '', fileName: '', details: ''
                });
                if (onComplete) onComplete();
              }}
              style={{ marginTop: '2rem' }}
            >
              {language === 'vi' ? 'Tạo yêu cầu mới' : 'Submit Another Request'}
            </button>
          </div>
        ) : (
          <div style={styles.body}>
            {/* Step 1: Industry Selection */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h4 style={styles.stepTitle}>
                  {language === 'vi' ? 'Chọn ngành nghề kinh doanh của bạn:' : 'Select your industry sector:'}
                </h4>
                <div className="wizard-industry-grid">
                  {industries.map((ind) => (
                    <div 
                      key={ind.id} 
                      onClick={() => selectIndustry(ind.id)}
                      style={{
                        ...styles.optionCard,
                        ...(formData.industry === ind.id ? styles.activeOptionCard : {})
                      }}
                    >
                      <Building2 size={24} color={formData.industry === ind.id ? 'var(--color-teal)' : 'var(--color-text-muted)'} />
                      <span style={styles.optionLabel}>{ind.label[language]}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.actions}>
                  <div></div>
                  <button 
                    className="btn btn-teal" 
                    onClick={nextStep}
                    disabled={!formData.industry}
                    style={{ opacity: formData.industry ? 1 : 0.6 }}
                  >
                    {t('wizardNext')} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Solution Selection */}
            {step === 2 && (
              <div className="animate-fade-in">
                <h4 style={styles.stepTitle}>
                  {language === 'vi' ? 'Bạn đang tìm kiếm giải pháp nào?' : 'Which solution are you interested in?'}
                </h4>
                <div className="wizard-solution-grid">
                  {solutions.map((sol) => (
                    <div 
                      key={sol.id} 
                      onClick={() => selectSolution(sol.id)}
                      style={{
                        ...styles.optionCard,
                        ...(formData.solution === sol.id ? styles.activeOptionCard : {})
                      }}
                    >
                      {sol.icon}
                      <span style={styles.optionLabel}>{sol.label[language]}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.actions}>
                  <button className="btn btn-outline" onClick={prevStep}>
                    <ArrowLeft size={16} /> {t('wizardPrev')}
                  </button>
                  <button 
                    className="btn btn-teal" 
                    onClick={nextStep}
                    disabled={!formData.solution}
                    style={{ opacity: formData.solution ? 1 : 0.6 }}
                  >
                    {t('wizardNext')} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Project Scale and Specifications */}
            {step === 3 && (
              <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                <h4 style={styles.stepTitle}>
                  {language === 'vi' ? 'Quy mô và thông số dự án dự kiến:' : 'Project scale and estimated specifications:'}
                </h4>

                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {language === 'vi' ? 'Mức tiêu thụ năng lượng hàng tháng (ước tính)' : 'Estimated monthly fuel consumption'}
                    </label>
                    <input 
                      type="text" 
                      name="consumption" 
                      placeholder={language === 'vi' ? 'Ví dụ: 30 tấn LPG, 50,000 lít DO...' : 'e.g. 30 tons LPG, 50,000L DO...'}
                      className="form-input"
                      value={formData.consumption}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Loại dự án' : 'Project category'}</label>
                    <select 
                      name="projectType" 
                      className="form-select"
                      value={formData.projectType}
                      onChange={handleInputChange}
                    >
                      <option value="new">{language === 'vi' ? 'Đầu tư mới hoàn toàn' : 'Brand new installation'}</option>
                      <option value="conversion">{language === 'vi' ? 'Cải tạo / Chuyển đổi nhiên liệu' : 'Retrofit / Fuel conversion'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Thời gian triển khai mong muốn' : 'Expected launch timeline'}</label>
                    <select 
                      name="timeline" 
                      className="form-select"
                      value={formData.timeline}
                      onChange={handleInputChange}
                    >
                      <option value="<3">{language === 'vi' ? 'Dưới 3 tháng (Khẩn cấp)' : 'Under 3 months (Urgent)'}</option>
                      <option value="3-6">3 - 6 {language === 'vi' ? 'tháng' : 'months'}</option>
                      <option value="6+">{language === 'vi' ? 'Trên 6 tháng' : 'Over 6 months'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Tỉnh / Thành phố dự án *' : 'Project Location (Province) *'}</label>
                    <input 
                      type="text" 
                      name="province" 
                      placeholder={language === 'vi' ? 'Ví dụ: Bình Dương, Đồng Nai...' : 'e.g. Binh Duong, Dong Nai...'}
                      className="form-input"
                      value={formData.province}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* File Upload Simulation */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">
                    {language === 'vi' ? 'Tải lên sơ đồ mặt bằng hoặc thông số kỹ thuật đầu đốt (nếu có)' : 'Upload layout drawing or burner datasheet (optional)'}
                  </label>
                  <div style={styles.uploadArea}>
                    <input 
                      type="file" 
                      id="wizard-file" 
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      accept=".pdf,.dwg,.png,.jpg,.jpeg,.xlsx"
                    />
                    <label htmlFor="wizard-file" style={styles.uploadLabel}>
                      <Upload size={22} color="var(--color-teal)" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 6 }}>
                        {formData.fileName ? formData.fileName : (language === 'vi' ? 'Chọn tài liệu đính kèm (PDF, DWG, Image...)' : 'Choose drawing/document (PDF, DWG...)')}
                      </span>
                    </label>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button className="btn btn-outline" onClick={prevStep}>
                    <ArrowLeft size={16} /> {t('wizardPrev')}
                  </button>
                  <button 
                    className="btn btn-teal" 
                    onClick={nextStep}
                    disabled={!formData.province}
                    style={{ opacity: formData.province ? 1 : 0.6 }}
                  >
                    {t('wizardNext')} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Contact details */}
            {step === 4 && (
              <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                <h4 style={styles.stepTitle}>
                  {language === 'vi' ? 'Thông tin người liên hệ đại diện:' : 'Representative Contact Information:'}
                </h4>

                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Tên doanh nghiệp *' : 'Company Name *'}</label>
                    <input 
                      type="text" 
                      name="companyName" 
                      className="form-input"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Họ tên người liên hệ *' : 'Contact Person Name *'}</label>
                    <input 
                      type="text" 
                      name="contactName" 
                      className="form-input"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Số điện thoại di động *' : 'Phone Number *'}</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      className="form-input"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Địa chỉ Email *' : 'Email Address *'}</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">{language === 'vi' ? 'Mô tả chi tiết yêu cầu' : 'Detailed descriptions / notes'}</label>
                  <textarea 
                    name="details" 
                    className="form-textarea" 
                    rows={3}
                    placeholder={language === 'vi' ? 'Ví dụ: Cần khảo sát để chuyển đổi lò dầu DO sang bồn LNG...' : 'e.g. Need on-site survey to replace DO burner system with LNG station...'}
                    value={formData.details}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={styles.actions}>
                  <button className="btn btn-outline" onClick={prevStep}>
                    <ArrowLeft size={16} /> {t('wizardPrev')}
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                  >
                    <Send size={16} /> {t('wizardSubmit')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    padding: '2rem 0',
  },
  wizardCard: {
    backgroundColor: 'var(--color-gray-card)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--color-gray-border)',
    boxShadow: 'var(--shadow-premium)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  progressBar: {
    height: '6px',
    backgroundColor: 'var(--color-gray-bg)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--color-teal)',
    transition: 'width var(--transition-normal)',
  },
  header: {
    padding: '1.5rem 2rem',
    borderBottom: '1px solid var(--color-gray-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
  },
  stepBadge: {
    fontSize: '0.85rem',
    fontWeight: 600,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  body: {
    padding: '2rem',
  },
  stepTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    color: 'var(--color-text-main)',
    textAlign: 'left',
  },

  optionCard: {
    border: '2px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'var(--transition-normal)',
    backgroundColor: 'var(--color-gray-card)',
    height: '120px',
  },
  activeOptionCard: {
    borderColor: 'var(--color-teal)',
    backgroundColor: 'var(--color-teal-glow)',
    boxShadow: 'var(--shadow-sm)',
  },
  optionLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--color-gray-border)',
    paddingTop: '1.5rem',
    marginTop: '1rem',
  },
  uploadArea: {
    border: '2px dashed var(--color-gray-border)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: 'var(--color-gray-bg)',
    transition: 'var(--transition-normal)',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    color: 'var(--color-text-main)',
  },
  successContainer: {
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-teal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-glow)',
    marginBottom: '1.5rem',
  },
  summaryCard: {
    backgroundColor: 'var(--color-gray-bg)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '1.25rem',
    width: '100%',
    maxWidth: '450px',
    textAlign: 'left',
  }
};
// Media queries can be handled directly if needed, but standard mobile grids in CSS take care of standard layout flow.
