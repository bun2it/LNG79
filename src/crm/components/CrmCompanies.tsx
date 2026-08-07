import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmCompany, type CrmIndustry } from '../../shared/types/crm';
import { 
  Briefcase, Plus, Search, Edit, Trash2
} from 'lucide-react';

interface CrmCompaniesProps {
  language: 'vi' | 'en';
  onLogAction?: (msg: string) => void;
}

export const CrmCompanies: React.FC<CrmCompaniesProps> = ({ language, onLogAction }) => {
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [industries, setIndustries] = useState<CrmIndustry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('Vietnam');
  const [status, setStatus] = useState<'prospect' | 'customer' | 'inactive' | 'partner' | 'supplier'>('prospect');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    const client = supabase;
    if (!client) return;

    try {
      const { data: companiesData, error } = await client
        .from('crm_companies')
        .select(`
          *,
          industry:crm_industries(*)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(companiesData || []);

      const { data: indData } = await client
        .from('crm_industries')
        .select('*')
        .eq('is_active', true);
      setIndustries(indData || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;

    const parsedTags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      name: name.trim(),
      industry_id: industryId || null,
      tax_code: taxCode.trim(),
      website: website.trim(),
      address: address.trim(),
      province: province.trim(),
      country: country.trim(),
      status,
      notes: notes.trim(),
      tags: parsedTags
    };

    try {
      if (modalMode === 'create') {
        const { error } = await client
          .from('crm_companies')
          .insert(payload);

        if (error) throw error;
        if (onLogAction) onLogAction(`Manually created B2B Company: ${name}`);
      } else {
        if (!selectedCompanyId) return;
        const { error } = await client
          .from('crm_companies')
          .update(payload)
          .eq('id', selectedCompanyId);

        if (error) throw error;
        if (onLogAction) onLogAction(`Updated B2B Company metadata for ID: ${selectedCompanyId}`);
      }

      setModalOpen(false);
      resetForm();
      fetchCompanies();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleEdit = (company: CrmCompany) => {
    setModalMode('edit');
    setSelectedCompanyId(company.id);
    setName(company.name);
    setIndustryId(company.industry_id || '');
    setTaxCode(company.tax_code || '');
    setWebsite(company.website || '');
    setAddress(company.address || '');
    setProvince(company.province || '');
    setCountry(company.country || 'Vietnam');
    setStatus(company.status);
    setNotes(company.notes || '');
    setTagInput(company.tags?.join(', ') || '');
    setModalOpen(true);
  };

  const handleDelete = async (companyId: string, companyName: string) => {
    const client = supabase;
    if (!client) return;
    if (!confirm(language === 'vi' ? `Bạn có chắc muốn xoá doanh nghiệp "${companyName}" không? (Dữ liệu sẽ được chuyển vào thùng rác)` : `Are you sure you want to delete "${companyName}"? (Moved to trash bin)`)) return;

    try {
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user.id || null;

      const { error } = await client
        .from('crm_companies')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', companyId);

      if (error) throw error;
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      if (onLogAction) onLogAction(`Soft-deleted B2B Company ID: ${companyId}`);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setName('');
    setIndustryId('');
    setTaxCode('');
    setWebsite('');
    setAddress('');
    setProvince('');
    setCountry('Vietnam');
    setStatus('prospect');
    setNotes('');
    setTagInput('');
    setSelectedCompanyId(null);
  };

  // Filters application
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.company_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.tax_code || '').includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesIndustry = filterIndustry === 'all' || c.industry_id === filterIndustry;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'prospect': return { vi: 'Khách tiềm năng', en: 'Prospect', bg: '#EFF6FF', color: '#1D4ED8' };
      case 'customer': return { vi: 'Khách hàng chính thức', en: 'Customer', bg: '#ECFDF5', color: '#047857' };
      case 'inactive': return { vi: 'Ngừng giao dịch', en: 'Inactive', bg: '#F3F4F6', color: '#374151' };
      case 'partner': return { vi: 'Đối tác chiến lược', en: 'Partner', bg: '#F5F3FF', color: '#6D28D9' };
      case 'supplier': return { vi: 'Nhà cung cấp', en: 'Supplier', bg: '#FFF7ED', color: '#C2410C' };
      default: return { vi: status, en: status, bg: '#fff', color: '#000' };
    }
  };

  return (
    <div style={styles.container}>
      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={styles.searchBlock}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={language === 'vi' ? 'Tìm kiếm doanh nghiệp (Tên, mã KH, số thuế)...' : 'Search companies (Name, code, tax)...'} 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={styles.filters}>
          <select style={styles.selectFilter} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}</option>
            <option value="prospect">{language === 'vi' ? 'Khách tiềm năng' : 'Prospect'}</option>
            <option value="customer">{language === 'vi' ? 'Khách hàng chính thức' : 'Customer'}</option>
            <option value="inactive">{language === 'vi' ? 'Ngừng giao dịch' : 'Inactive'}</option>
            <option value="partner">{language === 'vi' ? 'Đối tác chiến lược' : 'Partner'}</option>
            <option value="supplier">{language === 'vi' ? 'Nhà cung cấp' : 'Supplier'}</option>
          </select>

          <select style={styles.selectFilter} value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}>
            <option value="all">{language === 'vi' ? 'Tất cả ngành nghề' : 'All Industries'}</option>
            {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>

          <button 
            style={styles.createBtn}
            onClick={() => { setModalMode('create'); resetForm(); setModalOpen(true); }}
          >
            <Plus size={16} />
            <span>{language === 'vi' ? 'Thêm công ty' : 'Add Company'}</span>
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div style={styles.tableResponsive}>
        {loading ? (
          <div style={styles.loading}>{language === 'vi' ? 'Đang tải danh sách...' : 'Loading companies list...'}</div>
        ) : filteredCompanies.length === 0 ? (
          <div style={styles.emptyState}>
            <Briefcase size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <p>{language === 'vi' ? 'Không tìm thấy doanh nghiệp nào' : 'No companies found matching filters'}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>{language === 'vi' ? 'Mã số KH' : 'Cust ID'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Doanh nghiệp' : 'Company Name'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Ngành nghề' : 'Industry'}</th>
                <th style={styles.th}>{language === 'vi' ? 'MST / Website' : 'Tax / Web'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Địa chỉ' : 'Address'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((c) => {
                const label = getStatusLabel(c.status);
                return (
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.companyNum}>{c.company_number}</span>
                    </td>
                    <td style={styles.td}>
                      <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                      {c.tags && c.tags.length > 0 && (
                        <div style={styles.tagGrid}>
                          {c.tags.map(t => <span key={t} style={styles.tagBadge}>#{t}</span>)}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      {c.industry?.name || '—'}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.8rem' }}>🏢 {c.tax_code || '—'}</div>
                      {c.website && (
                        <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" style={styles.webLink}>
                          🌐 {c.website}
                        </a>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        fontSize: '0.725rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px',
                        backgroundColor: label.bg, color: label.color
                      }}>
                        {label[language]}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>📍 {c.address} ({c.province})</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button style={styles.actionBtn} onClick={() => handleEdit(c)} title="Chỉnh sửa">
                          <Edit size={14} color="#64748b" />
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDelete(c.id, c.name)} title="Xoá">
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>
                {modalMode === 'create' 
                  ? (language === 'vi' ? 'Thêm Mới Doanh Nghiệp' : 'Add B2B Company') 
                  : (language === 'vi' ? 'Cập Nhật Doanh Nghiệp' : 'Edit Company Data')}
              </h3>
              <button style={styles.modalClose} onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={styles.modalBody}>
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Tên doanh nghiệp *' : 'Company Name *'}</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Ngành nghề' : 'Industry'}</label>
                    <select className="form-select" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
                      <option value="">— Select Industry —</option>
                      {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Mã số thuế' : 'Tax Code'}</label>
                    <input type="text" className="form-input" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input type="text" className="form-input" value={website} placeholder="www.domain.com" onChange={(e) => setWebsite(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Trạng thái doanh nghiệp' : 'Account Status'}</label>
                    <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                      <option value="prospect">Prospect (Tiềm năng)</option>
                      <option value="customer">Customer (Chính thức)</option>
                      <option value="inactive">Inactive (Ngừng gd)</option>
                      <option value="partner">Partner (Đối tác)</option>
                      <option value="supplier">Supplier (Nhà cc)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Địa chỉ trụ sở' : 'Street Address'}</label>
                    <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Tỉnh thành' : 'Province'}</label>
                    <input type="text" className="form-input" value={province} onChange={(e) => setProvince(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Quốc gia' : 'Country'}</label>
                    <input type="text" className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Phân loại (Tags - Phân tách bằng dấu phẩy)' : 'Tags (Comma separated)'}</label>
                  <input type="text" className="form-input" placeholder="vip, fdi, steel" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Ghi chú bổ sung' : 'Internal Notes'}</label>
                  <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-teal" disabled={!name}>
                  {language === 'vi' ? 'Lưu Lại' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  searchBlock: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: '300px',
    flexGrow: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '0.45rem 0.75rem 0.45rem 2.25rem',
    fontSize: '0.825rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    outline: 'none',
  },
  filters: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  selectFilter: {
    padding: '0.45rem 1.5rem 0.45rem 0.75rem',
    fontSize: '0.825rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--color-teal)',
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableResponsive: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.825rem',
  },
  thRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '0.75rem 1rem',
    fontWeight: 600,
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    '&:hover': {
      backgroundColor: '#f8fafc',
    }
  },
  td: {
    padding: '0.75rem 1rem',
    verticalAlign: 'middle',
  },
  companyNum: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
  },
  tagGrid: {
    display: 'flex',
    gap: '0.25rem',
    marginTop: '0.25rem',
    flexWrap: 'wrap',
  },
  tagBadge: {
    fontSize: '0.65rem',
    color: 'var(--color-teal)',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    padding: '0.05rem 0.25rem',
    borderRadius: '3px',
  },
  webLink: {
    color: 'var(--color-teal)',
    textDecoration: 'none',
    fontSize: '0.75rem',
    display: 'block',
    marginTop: '0.15rem',
  },
  actionBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    padding: '0.25rem',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid #fca5a5',
    padding: '0.25rem',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loading: {
    padding: '3rem',
    textAlign: 'center',
    color: '#64748b',
  },
  emptyState: {
    padding: '4rem 1rem',
    textAlign: 'center',
    color: '#94a3b8',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '650px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    backgroundColor: '#0f172a',
    padding: '1rem 1.25rem',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  modalFooter: {
    borderTop: '1px solid #e2e8f0',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
} as const;
