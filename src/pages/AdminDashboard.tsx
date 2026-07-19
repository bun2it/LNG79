import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Users, Layers, Settings, FileSpreadsheet, Check, 
  Trash2, Plus, Edit, RefreshCw, TrendingUp 
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  leads, onUpdateStatus, onDeleteLead, fuelSettings, onUpdateSettings
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'leads' | 'products' | 'settings'>('leads');
  const [lngInput, setLngInput] = useState(fuelSettings.lngPrice);
  const [lpgInput, setLpgInput] = useState(fuelSettings.lpgPrice);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

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
        <span style={styles.versionBadge}>Mock CMS v1.0</span>
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
          <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
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

              <button type="submit" className="btn btn-teal" style={{ marginTop: '1rem' }}>
                {language === 'vi' ? 'Lưu cấu hình mặc định' : 'Save Default Factors'}
              </button>
            </form>
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
  }
};
