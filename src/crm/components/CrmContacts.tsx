import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmContact } from '../../shared/types/crm';
import { 
  Users, Plus, Search, Edit, Trash2, Phone, Mail, 
  Briefcase, Calendar
} from 'lucide-react';

interface CrmContactsProps {
  language: 'vi' | 'en';
  onLogAction?: (msg: string) => void;
}

export const CrmContacts: React.FC<CrmContactsProps> = ({ language, onLogAction }) => {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterDecisionMaker, setFilterDecisionMaker] = useState<string>('all');

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isDecisionMaker, setIsDecisionMaker] = useState(false);
  const [isTechnicalContact, setIsTechnicalContact] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    const client = supabase;
    if (!client) return;

    try {
      // 1. Fetch contacts with company details
      const { data: contactsData, error } = await client
        .from('crm_contacts')
        .select(`
          *,
          company:crm_companies(id, name, company_number)
        `)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(contactsData || []);

      // 2. Fetch companies for select drop down
      const { data: compData } = await client
        .from('crm_companies')
        .select('id, name, company_number')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      setCompanies(compData || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;

    const payload = {
      company_id: companyId,
      name: name.trim(),
      position: position.trim(),
      phone: phone.trim(),
      email: email.trim(),
      department: department.trim(),
      birthday: birthday || null,
      is_decision_maker: isDecisionMaker,
      is_technical_contact: isTechnicalContact
    };

    try {
      if (modalMode === 'create') {
        const { error } = await client
          .from('crm_contacts')
          .insert(payload);

        if (error) throw error;
        if (onLogAction) onLogAction(`Manually created Contact: ${name}`);
      } else {
        if (!selectedContactId) return;
        const { error } = await client
          .from('crm_contacts')
          .update(payload)
          .eq('id', selectedContactId);

        if (error) throw error;
        if (onLogAction) onLogAction(`Updated Contact details for ID: ${selectedContactId}`);
      }

      setModalOpen(false);
      resetForm();
      fetchContacts();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleEdit = (contact: CrmContact) => {
    setModalMode('edit');
    setSelectedContactId(contact.id);
    setCompanyId(contact.company_id);
    setName(contact.name);
    setPosition(contact.position || '');
    setPhone(contact.phone || '');
    setEmail(contact.email || '');
    setDepartment(contact.department || '');
    setBirthday(contact.birthday || '');
    setIsDecisionMaker(contact.is_decision_maker);
    setIsTechnicalContact(contact.is_technical_contact);
    setModalOpen(true);
  };

  const handleDelete = async (contactId: string, contactName: string) => {
    const client = supabase;
    if (!client) return;
    if (!confirm(language === 'vi' ? `Bạn có chắc muốn xoá liên hệ "${contactName}" không?` : `Are you sure you want to delete "${contactName}"?`)) return;

    try {
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user.id || null;

      const { error } = await client
        .from('crm_contacts')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', contactId);

      if (error) throw error;
      setContacts(prev => prev.filter(c => c.id !== contactId));
      if (onLogAction) onLogAction(`Soft-deleted Contact ID: ${contactId}`);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setCompanyId(companies[0]?.id || '');
    setName('');
    setPosition('');
    setPhone('');
    setEmail('');
    setDepartment('');
    setBirthday('');
    setIsDecisionMaker(false);
    setIsTechnicalContact(false);
    setSelectedContactId(null);
  };

  // Filters application
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.phone || '').includes(searchQuery);

    const matchesCompany = filterCompany === 'all' || c.company_id === filterCompany;
    
    let matchesDM = true;
    if (filterDecisionMaker === 'decision') matchesDM = c.is_decision_maker;
    else if (filterDecisionMaker === 'technical') matchesDM = c.is_technical_contact;

    return matchesSearch && matchesCompany && matchesDM;
  });

  return (
    <div style={styles.container}>
      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={styles.searchBlock}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={language === 'vi' ? 'Tìm kiếm liên hệ (Họ tên, email, sđt)...' : 'Search contacts (Name, email, phone)...'} 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={styles.filters}>
          <select style={styles.selectFilter} value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
            <option value="all">{language === 'vi' ? 'Tất cả doanh nghiệp' : 'All Companies'}</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select style={styles.selectFilter} value={filterDecisionMaker} onChange={(e) => setFilterDecisionMaker(e.target.value)}>
            <option value="all">{language === 'vi' ? 'Tất cả phân loại' : 'All Types'}</option>
            <option value="decision">{language === 'vi' ? 'Người quyết định (DM)' : 'Decision Maker'}</option>
            <option value="technical">{language === 'vi' ? 'Liên hệ kỹ thuật' : 'Technical Contact'}</option>
          </select>

          <button 
            style={styles.createBtn}
            onClick={() => { setModalMode('create'); resetForm(); setModalOpen(true); }}
          >
            <Plus size={16} />
            <span>{language === 'vi' ? 'Thêm liên hệ' : 'Add Contact'}</span>
          </button>
        </div>
      </div>

      {/* DATA GRID */}
      {loading ? (
        <div style={styles.loading}>{language === 'vi' ? 'Đang tải danh sách...' : 'Loading contacts list...'}</div>
      ) : filteredContacts.length === 0 ? (
        <div style={styles.emptyState}>
          <Users size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <p>{language === 'vi' ? 'Không tìm thấy người liên hệ nào' : 'No contacts found matching filters'}</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredContacts.map((contact) => (
            <div key={contact.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h4 style={styles.contactName}>{contact.name}</h4>
                  <div style={styles.positionText}>
                    {contact.position || 'Representative'} {contact.department ? `(${contact.department})` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  <button style={styles.actionBtn} onClick={() => handleEdit(contact)} title="Chỉnh sửa">
                    <Edit size={12} color="#64748b" />
                  </button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(contact.id, contact.name)} title="Xoá">
                    <Trash2 size={12} color="#ef4444" />
                  </button>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.companyRow}>
                  <Briefcase size={14} color="#64748b" />
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {contact.company?.name || '—'}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <Phone size={14} color="#94a3b8" />
                  <span>{contact.phone || '—'}</span>
                </div>

                <div style={styles.infoRow}>
                  <Mail size={14} color="#94a3b8" />
                  <span style={{ wordBreak: 'break-all' }}>{contact.email || '—'}</span>
                </div>

                {contact.birthday && (
                  <div style={styles.infoRow}>
                    <Calendar size={14} color="#94a3b8" />
                    <span>🎂 {new Date(contact.birthday).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardFooter}>
                {contact.is_decision_maker && (
                  <span style={{ ...styles.badge, backgroundColor: '#FEF3C7', color: '#B45309' }}>
                    👑 {language === 'vi' ? 'Quyết định' : 'Decision Maker'}
                  </span>
                )}
                {contact.is_technical_contact && (
                  <span style={{ ...styles.badge, backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                    ⚙️ {language === 'vi' ? 'Kỹ thuật' : 'Technical'}
                  </span>
                )}
                {!contact.is_decision_maker && !contact.is_technical_contact && (
                  <span style={{ ...styles.badge, backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                    👤 {language === 'vi' ? 'Liên hệ' : 'Contact'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>
                {modalMode === 'create' 
                  ? (language === 'vi' ? 'Thêm Người Liên Hệ Mới' : 'Add New Contact') 
                  : (language === 'vi' ? 'Cập Nhật Người Liên Hệ' : 'Edit Contact')}
              </h3>
              <button style={styles.modalClose} onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={styles.modalBody}>
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Thuộc công ty / doanh nghiệp *' : 'Company Account *'}</label>
                  <select className="form-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
                    <option value="">— Select Company —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company_number})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Họ và tên người liên hệ *' : 'Contact Full Name *'}</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Chức danh / Vị trí' : 'Job Title'}</label>
                    <input type="text" className="form-input" placeholder="Purchasing Manager" value={position} onChange={(e) => setPosition(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Phòng ban' : 'Department'}</label>
                    <input type="text" className="form-input" placeholder="Procurement" value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Ngày sinh' : 'Birthday'}</label>
                  <input type="date" className="form-input" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isDecisionMaker} onChange={(e) => setIsDecisionMaker(e.target.checked)} />
                    <span>👑 {language === 'vi' ? 'Người quyết định chính (Decision Maker)' : 'Key Decision Maker'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isTechnicalContact} onChange={(e) => setIsTechnicalContact(e.target.checked)} />
                    <span>⚙️ {language === 'vi' ? 'Liên hệ kỹ thuật (Technical lead)' : 'Technical Contact'}</span>
                  </label>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-teal" disabled={!name || !companyId || !phone}>
                  {language === 'vi' ? 'Lưu Lại' : 'Save Contact'}
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
    maxWidth: '220px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '180px',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    }
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.5rem',
  },
  contactName: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  positionText: {
    fontSize: '0.725rem',
    color: '#64748b',
    marginTop: '0.1rem',
  },
  actionBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    padding: '0.2rem',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid #fca5a5',
    padding: '0.2rem',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: '0.5rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  companyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    marginBottom: '0.25rem',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.775rem',
    color: '#475569',
  },
  cardFooter: {
    display: 'flex',
    gap: '0.25rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed #f1f5f9',
  },
  badge: {
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
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
    maxWidth: '550px',
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
