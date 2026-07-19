import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Users, Layers, Settings, FileSpreadsheet, Check, 
  Trash2, Plus, Edit, RefreshCw, TrendingUp, Flame, ChefHat 
} from 'lucide-react';

interface LeadItem {
  id: string;
  type: 'calculator' | 'wizard' | 'quote';
  company: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  date: string;
  status: 'new' | 'contacted' | 'survey' | 'closed';
  details: string;
}

interface AdminDashboardProps {
  leads: LeadItem[];
  onUpdateStatus: (id: string, status: LeadItem['status']) => void;
  onDeleteLead: (id: string) => void;
  fuelSettings: { lngPrice: number; lpgPrice: number };
  onUpdateSettings: (settings: { lngPrice: number; lpgPrice: number }) => void;
}

const AUDIT_FUELS: { [key: string]: { name: { vi: string; en: string }; lhv: number; co2Factor: number; defaultPrice: number; defaultEff: number } } = {
  DO: { name: { vi: 'Dầu Diesel (DO)', en: 'Diesel Oil (DO)' }, lhv: 36, co2Factor: 2.68, defaultPrice: 20000, defaultEff: 82 },
  FO: { name: { vi: 'Dầu Mè / Dầu nặng (FO)', en: 'Fuel Oil (FO)' }, lhv: 40, co2Factor: 3.10, defaultPrice: 16000, defaultEff: 80 },
  COAL: { name: { vi: 'Than đá', en: 'Coal' }, lhv: 20, co2Factor: 2.40, defaultPrice: 4500, defaultEff: 68 },
  LPG_OLD: { name: { vi: 'LPG Hiện tại', en: 'Current LPG' }, lhv: 46, co2Factor: 3.00, defaultPrice: 26000, defaultEff: 85 },
  ELEC: { name: { vi: 'Điện công nghiệp', en: 'Electricity' }, lhv: 3.6, co2Factor: 0.82, defaultPrice: 2200, defaultEff: 95 }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  leads, onUpdateStatus, onDeleteLead, fuelSettings, onUpdateSettings
}) => {
  const { language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('cms_logged_in') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'leads' | 'products' | 'settings'>('leads');
  const [lngInput, setLngInput] = useState(fuelSettings.lngPrice);
  const [lpgInput, setLpgInput] = useState(fuelSettings.lpgPrice);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  const [auditFuel, setAuditFuel] = useState('DO');
  const [auditCons, setAuditCons] = useState(50000);
  const [auditEff, setAuditEff] = useState(82);
  const [auditPrice, setAuditPrice] = useState(20000);

  const currentAuditFuel = AUDIT_FUELS[auditFuel];
  const monthlyEnergy = auditCons * currentAuditFuel.lhv * (auditEff / 100);
  const annualEnergy = monthlyEnergy * 12;
  const annualOldCost = auditCons * auditPrice * 12;
  const oldCo2 = (auditCons * currentAuditFuel.co2Factor * 12) / 1000;

  const lngNeeded = annualEnergy / (50 * 0.92);
  const lngCost = lngNeeded * fuelSettings.lngPrice;
  const lngCo2 = (lngNeeded * 2.75) / 1000;
  const lngSavings = annualOldCost - lngCost;
  const co2Saved = Math.max(0, oldCo2 - lngCo2);

  const calcVapSize = Math.ceil(((lngNeeded / 12) / 250) * 1.5);
  const calcTankSize = Math.ceil(((lngNeeded / 12) / 1000) * 0.4);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      maximumFractionDigits: 0
    }).format(val);
  };
  const formatNumber = (val: number, decimals = 0) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      sessionStorage.setItem('cms_logged_in', 'true');
      setAuthError('');
    } else {
      setAuthError(language === 'vi' ? 'Sai tài khoản hoặc mật khẩu!' : 'Invalid username or password!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('cms_logged_in');
  };

  // Statistics
  const newLeads = leads.filter(l => l.status === 'new').length;
  const surveyLeads = leads.filter(l => l.status === 'survey').length;
  const closedLeads = leads.filter(l => l.status === 'closed').length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ lngPrice: lngInput, lpgPrice: lpgInput });
    alert(language === 'vi' ? 'Đã cập nhật hệ số giá nhiên liệu thành công!' : 'Fuel calculator settings updated successfully!');
  };

  const getStatusLabel = (status: LeadItem['status']) => {
    const labels = {
      new: { vi: 'Mới nhận', en: 'New Lead', color: '#3B82F6', bg: '#EFF6FF' },
      contacted: { vi: 'Đã liên hệ', en: 'Contacted', color: '#F59E0B', bg: '#FEF3C7' },
      survey: { vi: 'Lịch khảo sát', en: 'Site Survey', color: '#8B5CF6', bg: '#F5F3FF' },
      closed: { vi: 'Thành công', en: 'Closed Won', color: '#10B981', bg: '#ECFDF5' }
    };
    return labels[status];
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard} className="animate-fade-in">
          <div style={styles.loginHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Flame size={24} color="var(--color-orange)" />
              <ChefHat size={24} color="var(--color-teal)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-navy)', textAlign: 'center', margin: 0 }}>
              {language === 'vi' ? 'Cổng Bảo Mật CMS' : 'CMS Security Portal'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.25rem', marginBottom: 0 }}>
              {language === 'vi' ? 'Đăng nhập quyền quản trị trạm cấp khí & bếp' : 'Sign in to access energy & kitchen controls'}
            </p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            {authError && (
              <div style={styles.errorAlert}>
                <span>⚠️ {authError}</span>
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{language === 'vi' ? 'Tài khoản *' : 'Username *'}</label>
              <input 
                type="text" 
                className="form-input" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{language === 'vi' ? 'Mật khẩu *' : 'Password *'}</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-teal" style={{ width: '100%', marginTop: '0.5rem' }}>
              {language === 'vi' ? 'Đăng Nhập' : 'Sign In'}
            </button>

            <div style={styles.credentialsHint}>
              <span>💡 {language === 'vi' ? 'Tài khoản demo: admin / mật khẩu: admin123' : 'Demo account: admin / password: admin123'}</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'left' }}>
      <div style={styles.header}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-navy)' }}>
            {language === 'vi' ? 'Hệ Thống Quản Trị Website (CMS)' : 'Website Administration Portal (CMS)'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {language === 'vi' ? 'Quản lý thông tin yêu cầu, sản phẩm catalog và cấu hình hệ số máy tính.' : 'Manage client leads, catalog hardware, and adjust calculator pricing parameters.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={styles.versionBadge}>Mock CMS v1.0</span>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={handleLogout}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--color-navy-accent)' }}
          >
            {language === 'vi' ? 'Đăng xuất' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <TrendingUp size={24} color="var(--color-teal)" />
          <div>
            <span style={styles.statLabel}>{language === 'vi' ? 'Tổng Số Leads' : 'Total Leads'}</span>
            <span style={styles.statValue}>{leads.length}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <Users size={24} color="#3B82F6" />
          <div>
            <span style={styles.statLabel}>{language === 'vi' ? 'Yêu cầu mới' : 'New Requests'}</span>
            <span style={styles.statValue}>{newLeads}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <RefreshCw size={24} color="#8B5CF6" />
          <div>
            <span style={styles.statLabel}>{language === 'vi' ? 'Cần khảo sát' : 'Pending Survey'}</span>
            <span style={styles.statValue}>{surveyLeads}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <Check size={24} color="#10B981" />
          <div>
            <span style={styles.statLabel}>{language === 'vi' ? 'Chốt thành công' : 'Deals Won'}</span>
            <span style={styles.statValue}>{closedLeads}</span>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('leads')} 
          style={{...styles.tabBtn, ...(activeTab === 'leads' ? styles.tabBtnActive : {})}}
        >
          <Users size={16} /> {language === 'vi' ? 'Hộp thư Leads (Yêu cầu)' : 'Leads Inbox'}
        </button>
        <button 
          onClick={() => setActiveTab('products')} 
          style={{...styles.tabBtn, ...(activeTab === 'products' ? styles.tabBtnActive : {})}}
        >
          <Layers size={16} /> {language === 'vi' ? 'Danh mục sản phẩm' : 'Product Inventory'}
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          style={{...styles.tabBtn, ...(activeTab === 'settings' ? styles.tabBtnActive : {})}}
        >
          <Settings size={16} /> {language === 'vi' ? 'Cấu hình hệ số' : 'Calculator Tuning'}
        </button>
      </div>

      {/* Tab Contents */}
      <div style={styles.tabContent}>
        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div className="animate-fade-in">
            <div style={styles.tableHeader}>
              <h3 style={{ fontSize: '1.2rem' }}>{language === 'vi' ? 'Danh Sách Lead Khách Hàng' : 'Customer Inquiries & Leads'}</h3>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => alert(language === 'vi' ? 'Đang xuất báo cáo CSV...' : 'Exporting leads to CSV...')}
              >
                <FileSpreadsheet size={16} /> {language === 'vi' ? 'Xuất Excel (CSV)' : 'Export CSV'}
              </button>
            </div>

            {leads.length === 0 ? (
              <div style={styles.emptyBox}>
                <p>{language === 'vi' ? 'Chưa có yêu cầu tư vấn nào được ghi nhận.' : 'No customer inquiries recorded yet.'}</p>
              </div>
            ) : (
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>{language === 'vi' ? 'Thời gian' : 'Date'}</th>
                      <th style={styles.th}>{language === 'vi' ? 'Nguồn' : 'Source'}</th>
                      <th style={styles.th}>{language === 'vi' ? 'Doanh nghiệp' : 'Company'}</th>
                      <th style={styles.th}>{language === 'vi' ? 'Đại diện' : 'Contact'}</th>
                      <th style={styles.th}>{language === 'vi' ? 'Tỉnh thành' : 'Province'}</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const statusInfo = getStatusLabel(lead.status);
                      return (
                        <tr key={lead.id} style={styles.tr}>
                          <td style={styles.td}>{lead.date}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: lead.type === 'calculator' ? '#FEF3C7' : lead.type === 'wizard' ? '#E0F2FE' : '#D1FAE5',
                              color: lead.type === 'calculator' ? '#B45309' : lead.type === 'wizard' ? '#0369A1' : '#047857'
                            }}>
                              {lead.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}><strong>{lead.company}</strong></td>
                          <td style={styles.td}>
                            <div>{lead.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{lead.phone} | {lead.email}</div>
                          </td>
                          <td style={styles.td}>{lead.location}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: statusInfo.bg,
                              color: statusInfo.color
                            }}>
                              {statusInfo[language === 'vi' ? 'vi' : 'en']}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button 
                                className="btn btn-outline btn-sm"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => setSelectedLead(lead)}
                              >
                                {language === 'vi' ? 'Chi tiết' : 'View'}
                              </button>
                              <button 
                                className="btn btn-outline btn-sm"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#EF4444' }}
                                onClick={() => onDeleteLead(lead.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS INVENTORY TAB */}
        {activeTab === 'products' && (
          <div className="animate-fade-in">
            <div style={styles.tableHeader}>
              <h3 style={{ fontSize: '1.2rem' }}>{language === 'vi' ? 'Quản Lý Danh Mục Thiết Bị Bếp & Gas' : 'Manage Gas & Kitchen Equipment Catalog'}</h3>
              <button 
                className="btn btn-teal btn-sm"
                onClick={() => alert(language === 'vi' ? 'Thêm mới thiết bị...' : 'Add new product...')}
              >
                <Plus size={16} /> {language === 'vi' ? 'Thêm sản phẩm mới' : 'Add New Product'}
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {language === 'vi' 
                ? 'Đây là danh sách thiết bị hiển thị ngoài trang Sản phẩm. Phiên bản chính sẽ đồng bộ qua API của cơ sở dữ liệu Strapi CMS.' 
                : 'This inventory represents the external Product Center view. Production values sync dynamically over Strapi CMS APIs.'}
            </p>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>{language === 'vi' ? 'Tên thiết bị' : 'Equipment Name'}</th>
                  <th style={styles.th}>{language === 'vi' ? 'Phân loại' : 'Category'}</th>
                  <th style={styles.th}>{language === 'vi' ? 'Xuất xứ' : 'Origin'}</th>
                  <th style={styles.th}>{language === 'vi' ? 'Thông số kỹ thuật' : 'Specifications'}</th>
                  <th style={styles.th}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tr}>
                  <td style={styles.td}>lng-tank-1</td>
                  <td style={styles.td}><strong>Cryogenic LNG Storage Tank</strong></td>
                  <td style={styles.td}>LNG</td>
                  <td style={styles.td}>Korea / Japan</td>
                  <td style={styles.td}>5m³ - 150m³, ASME Standard</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-outline btn-sm" style={{ padding: '0.25rem' }}><Edit size={12} /></button>
                      <button className="btn btn-outline btn-sm" style={{ padding: '0.25rem', color: '#EF4444' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.td}>lpg-vap-1</td>
                  <td style={styles.td}><strong>Electric LPG Vaporizer</strong></td>
                  <td style={styles.td}>LPG</td>
                  <td style={styles.td}>USA</td>
                  <td style={styles.td}>30kg/h - 1000kg/h</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-outline btn-sm" style={{ padding: '0.25rem' }}><Edit size={12} /></button>
                      <button className="btn btn-outline btn-sm" style={{ padding: '0.25rem', color: '#EF4444' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.td}>cooking-range-1</td>
                  <td style={styles.td}><strong>3-Burner Wok Range with Blower</strong></td>
                  <td style={styles.td}>Kitchen</td>
                  <td style={styles.td}>Malaysia</td>
                  <td style={styles.td}>SUS304, 3x48000 kcal/h</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-outline btn-sm" style={{ padding: '0.25rem' }}><Edit size={12} /></button>
                      <button className="btn btn-outline btn-sm" style={{ padding: '0.25rem', color: '#EF4444' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* SETTINGS ADJUSTER TAB */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in admin-settings-grid">
            {/* Left side: Config form */}
            <div style={styles.configCol}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-navy)' }}>
                {language === 'vi' ? 'Cấu Hình Giá Nhiên Liệu Mặc Định' : 'Tune Calculator Pricing Parameters'}
              </h3>

              <form onSubmit={handleSaveSettings} style={styles.form}>
                <div className="form-group">
                  <label className="form-label">
                    {language === 'vi' ? 'Giá bán LNG mặc định (VNĐ / kg) *' : 'Default LNG Price (VND / kg) *'}
                  </label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={lngInput}
                    onChange={(e) => setLngInput(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <span style={styles.inputHelp}>
                    {language === 'vi' ? 'Giá LNG thị trường hiện giao động khoảng 17,000đ - 22,000đ/kg' : 'Market rates typically fluctuate around 17,000 - 22,000 VND/kg'}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'vi' ? 'Giá bán LPG mặc định (VNĐ / kg) *' : 'Default LPG Price (VND / kg) *'}
                  </label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={lpgInput}
                    onChange={(e) => setLpgInput(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <span style={styles.inputHelp}>
                    {language === 'vi' ? 'Giá LPG dân dụng và công nghiệp dao động 21,000đ - 26,000đ/kg' : 'Industrial LPG averages 21,000 - 26,000 VND/kg'}
                  </span>
                </div>

                <button type="submit" className="btn btn-teal" style={{ marginTop: '1rem', width: '100%' }}>
                  {language === 'vi' ? 'Lưu cấu hình mặc định' : 'Save Default Factors'}
                </button>
              </form>
            </div>

            {/* Right side: Calculator Auditor Simulator */}
            <div style={styles.auditorCol}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-navy)' }}>
                {language === 'vi' ? 'Trình Thẩm Định Công Thức & Giả Lập' : 'Calculator Formula Auditor & Simulator'}
              </h3>
              
              <div style={styles.auditorInputsRow}>
                <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'vi' ? 'Nhiên liệu' : 'Fuel'}</label>
                  <select 
                    className="form-select" 
                    style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    value={auditFuel}
                    onChange={(e) => {
                      setAuditFuel(e.target.value);
                      const f = AUDIT_FUELS[e.target.value];
                      setAuditPrice(f.defaultPrice);
                      setAuditEff(f.defaultEff);
                      if (e.target.value === 'ELEC') setAuditCons(500000);
                      else if (e.target.value === 'COAL') setAuditCons(150000);
                      else setAuditCons(50000);
                    }}
                  >
                    {Object.keys(AUDIT_FUELS).map((k) => (
                      <option key={k} value={k}>{AUDIT_FUELS[k].name[language === 'vi' ? 'vi' : 'en']}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'vi' ? 'Lượng dùng / tháng' : 'Monthly Cons.'}</label>
                  <input 
                    type="number" 
                    className="form-input"
                    style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    value={auditCons}
                    onChange={(e) => setAuditCons(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '80px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'vi' ? 'Hiệu suất (%)' : 'Boiler Eff (%)'}</label>
                  <input 
                    type="number" 
                    className="form-input"
                    style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    value={auditEff}
                    onChange={(e) => setAuditEff(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'vi' ? 'Đơn giá cũ' : 'Old Unit Cost'}</label>
                  <input 
                    type="number" 
                    className="form-input"
                    style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    value={auditPrice}
                    onChange={(e) => setAuditPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Math Auditing Table */}
              <div style={styles.mathAuditBox}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-teal)', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-teal-glow)', paddingBottom: '0.25rem' }}>
                  {language === 'vi' ? 'Hệ thống tính toán chi tiết (Bước trung gian):' : 'Intermediate Variable Calculations (Auditing Sheet):'}
                </h4>
                
                <div style={styles.mathLine}>
                  <span><strong>1. Nhiệt lượng có ích / tháng:</strong></span>
                  <span style={styles.mathFormula}>Q_use = Cons * LHV * Eff</span>
                  <span style={styles.mathValue}>{formatNumber(monthlyEnergy)} MJ</span>
                </div>

                <div style={styles.mathLine}>
                  <span><strong>2. Chi phí nhiên liệu cũ / năm:</strong></span>
                  <span style={styles.mathFormula}>C_old = Cons * Price * 12</span>
                  <span style={styles.mathValue}>{formatCurrency(annualOldCost)} VNĐ</span>
                </div>

                <div style={styles.mathLine}>
                  <span><strong>3. LNG thay thế / năm:</strong></span>
                  <span style={styles.mathFormula}>M_lng = Q_use * 12 / (50 * 0.92)</span>
                  <span style={styles.mathValue}>{formatNumber(lngNeeded)} kg</span>
                </div>

                <div style={styles.mathLine}>
                  <span><strong>4. Chi phí LNG mới / năm:</strong></span>
                  <span style={styles.mathFormula}>C_lng = M_lng * {fuelSettings.lngPrice}đ</span>
                  <span style={styles.mathValue}>{formatCurrency(lngCost)} VNĐ</span>
                </div>

                <div style={{ ...styles.mathLine, borderBottom: '1px dashed var(--color-gray-border)', paddingBottom: '0.5rem' }}>
                  <span><strong>5. Tiết kiệm chi phí / năm:</strong></span>
                  <span style={styles.mathFormula}>Savings = C_old - C_lng</span>
                  <span style={{ ...styles.mathValue, color: lngSavings > 0 ? '#10B981' : '#EF4444', fontSize: '0.95rem' }}>
                    {formatCurrency(lngSavings)} VNĐ
                  </span>
                </div>

                <div style={{ ...styles.mathLine, paddingTop: '0.5rem' }}>
                  <span><strong>6. Giảm phát thải CO2 / năm:</strong></span>
                  <span style={styles.mathFormula}>CO2_saved = CO2_old - CO2_lng</span>
                  <span style={styles.mathValue}>{formatNumber(co2Saved, 1)} Tấn</span>
                </div>

                <div style={styles.mathLine}>
                  <span><strong>7. Công suất Dàn hóa hơi:</strong></span>
                  <span style={styles.mathFormula}>Cap = Math.ceil(M_lng/12 / 250 * 1.5)</span>
                  <span style={styles.mathValue}>{calcVapSize} Nm³/h</span>
                </div>

                <div style={styles.mathLine}>
                  <span><strong>8. Dung tích bồn chứa gợi ý:</strong></span>
                  <span style={styles.mathFormula}>Vol = Math.ceil(M_lng/12 / 1000 * 0.4)</span>
                  <span style={styles.mathValue}>{calcTankSize} m³</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-white)' }}>
                {language === 'vi' ? 'Chi Tiết Yêu Cầu Gửi Từ Website' : 'Website Lead Submission Details'}
              </h3>
              <button onClick={() => setSelectedLead(null)} style={styles.closeBtn}>Close</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalMetaGrid}>
                <div><strong>{language === 'vi' ? 'Doanh nghiệp:' : 'Company:'}</strong> {selectedLead.company}</div>
                <div><strong>{language === 'vi' ? 'Đại diện liên hệ:' : 'Contact Representative:'}</strong> {selectedLead.name}</div>
                <div><strong>{language === 'vi' ? 'Số điện thoại:' : 'Phone Number:'}</strong> {selectedLead.phone}</div>
                <div><strong>{language === 'vi' ? 'Địa chỉ Email:' : 'Email Address:'}</strong> {selectedLead.email}</div>
                <div><strong>{language === 'vi' ? 'Tỉnh thành dự án:' : 'Project Location:'}</strong> {selectedLead.location}</div>
                <div><strong>{language === 'vi' ? 'Ngày gửi:' : 'Date submitted:'}</strong> {selectedLead.date}</div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
                  {language === 'vi' ? 'Nội dung chi tiết yêu cầu:' : 'Detailed parameters / message:'}
                </h4>
                <div style={styles.messageBox}>
                  {selectedLead.details}
                </div>
              </div>

              <div style={styles.statusUpdateBox}>
                <span style={{ fontSize: '0.85rem', fontWeight: 6 }}>
                  {language === 'vi' ? 'Cập nhật trạng thái xử lý:' : 'Update action status:'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {(['new', 'contacted', 'survey', 'closed'] as const).map((status) => (
                    <button
                      key={status}
                      className={`btn btn-sm ${selectedLead.status === status ? 'btn-teal' : 'btn-outline'}`}
                      onClick={() => {
                        onUpdateStatus(selectedLead.id, status);
                        setSelectedLead({ ...selectedLead, status });
                      }}
                    >
                      {getStatusLabel(status)[language === 'vi' ? 'vi' : 'en']}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '2px solid var(--color-gray-border)',
    paddingBottom: '1.5rem',
  },
  versionBadge: {
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    backgroundColor: 'var(--color-gray-card)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: 'var(--shadow-sm)',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  statValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--color-navy)',
    marginTop: '0.15rem',
  },
  tabBar: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '0.75rem',
    marginBottom: '2rem',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    padding: '0.6rem 1.25rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'var(--transition-fast)',
  },
  tabBtnActive: {
    backgroundColor: 'var(--color-teal-glow)',
    color: 'var(--color-teal)',
  },
  tabContent: {
    backgroundColor: 'var(--color-gray-card)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '2rem',
    boxShadow: 'var(--shadow-sm)',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thRow: {
    borderBottom: '2px solid var(--color-gray-border)',
    backgroundColor: 'var(--color-gray-bg)',
  },
  th: {
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid var(--color-gray-border)',
    transition: 'background var(--transition-fast)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-main)',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.2rem 0.4rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-full)',
  },
  emptyBox: {
    padding: '4rem 2rem',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputHelp: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.25rem',
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
    maxWidth: '650px',
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
  },
  modalMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-main)',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '1rem',
  },
  messageBox: {
    backgroundColor: 'var(--color-gray-bg)',
    border: '1px solid var(--color-gray-border)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    whiteSpace: 'pre-wrap',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  statusUpdateBox: {
    marginTop: '1.5rem',
    borderTop: '1px solid var(--color-gray-border)',
    paddingTop: '1.25rem',
  },
  loginOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    padding: '2rem 0',
  },
  loginCard: {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: 'var(--color-gray-card)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-premium)',
    overflow: 'hidden',
  },
  loginHeader: {
    padding: '1.5rem',
    backgroundColor: 'var(--color-gray-bg)',
    borderBottom: '1px solid var(--color-gray-border)',
    textAlign: 'center',
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 600,
    textAlign: 'center',
  },
  credentialsHint: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: '0.5rem',
  },
  configCol: {},
  auditorCol: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
  },
  auditorInputsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    backgroundColor: 'var(--color-gray-bg)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-gray-border)',
  },
  mathAuditBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mathLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  mathFormula: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-muted)',
    fontSize: '0.7rem',
    backgroundColor: 'var(--color-gray-bg)',
    padding: '0.15rem 0.3rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  mathValue: {
    fontWeight: 600,
    color: 'var(--color-navy)',
  }
};
