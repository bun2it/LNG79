import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmLeadSource, type CrmIndustry } from '../../shared/types/crm';
import { RefreshCw, Plus, Edit2 } from 'lucide-react';

interface CrmSettingsProps {
  language: 'vi' | 'en';
  userProfile?: any;
  onLogAction?: (msg: string) => void;
}

export const CrmSettings: React.FC<CrmSettingsProps> = ({ language, userProfile: _userProfile, onLogAction }) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'industries'>('sources');
  const [sources, setSources] = useState<CrmLeadSource[]>([]);
  const [industries, setIndustries] = useState<CrmIndustry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettingsData = async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      if (activeTab === 'sources') {
        const { data, error } = await client
          .from('crm_lead_sources')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        setSources(data || []);
      } else {
        const { data, error } = await client
          .from('crm_industries')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        setIndustries(data || []);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, [activeTab]);

  const handleOpenCreate = () => {
    setMode('create');
    setSelectedId(null);
    setName('');
    setCode('');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setMode('edit');
    setSelectedId(item.id);
    setName(item.name);
    setCode(item.code);
    setIsActive(item.is_active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client || !name.trim() || !code.trim()) return;
    setSaving(true);
    const table = activeTab === 'sources' ? 'crm_lead_sources' : 'crm_industries';
    const payload = {
      name: name.trim(),
      code: code.trim().toLowerCase().replace(/\s+/g, '_'),
      is_active: isActive,
    };

    try {
      if (mode === 'create') {
        const { error } = await client.from(table).insert(payload);
        if (error) throw error;
        if (onLogAction) onLogAction(`Created ${activeTab === 'sources' ? 'Lead Source' : 'Industry'} entry: ${name}`);
      } else {
        if (!selectedId) return;
        const { error } = await client.from(table).update(payload).eq('id', selectedId);
        if (error) throw error;
        if (onLogAction) onLogAction(`Updated ${activeTab === 'sources' ? 'Lead Source' : 'Industry'} metadata: ${name}`);
      }
      setModalOpen(false);
      fetchSettingsData();
    } catch (err: any) {
      alert(language === 'vi' ? `Lỗi: ${err.message}` : `Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: any) => {
    const client = supabase;
    if (!client) return;
    const table = activeTab === 'sources' ? 'crm_lead_sources' : 'crm_industries';
    try {
      const { error } = await client
        .from(table)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      if (error) throw error;
      fetchSettingsData();
      if (onLogAction) onLogAction(`Toggled status for ${item.name}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.pageTitle}>{language === 'vi' ? 'Cấu Hình Hệ Thống CRM' : 'CRM Settings'}</h2>
          <p style={s.pageSubtitle}>
            {language === 'vi' ? 'Quản trị các danh mục lookup và tham số hoạt động' : 'Configure CRM lookup tables and settings'}
          </p>
        </div>
        <button onClick={handleOpenCreate} style={s.createBtn}>
          <Plus size={14} />
          {language === 'vi' ? 'Thêm cấu hình' : 'Add Option'}
        </button>
      </div>

      {/* Tabs */}
      <div style={s.tabsRow}>
        <button
          onClick={() => setActiveTab('sources')}
          style={{ ...s.tab, borderBottomColor: activeTab === 'sources' ? 'var(--color-teal)' : 'transparent', color: activeTab === 'sources' ? 'var(--color-teal)' : '#64748b', fontWeight: activeTab === 'sources' ? 600 : 400 }}
        >
          {language === 'vi' ? 'Nguồn Lead (Lead Sources)' : 'Lead Sources'}
        </button>
        <button
          onClick={() => setActiveTab('industries')}
          style={{ ...s.tab, borderBottomColor: activeTab === 'industries' ? 'var(--color-teal)' : 'transparent', color: activeTab === 'industries' ? 'var(--color-teal)' : '#64748b', fontWeight: activeTab === 'industries' ? 600 : 400 }}
        >
          {language === 'vi' ? 'Ngành nghề (Industries)' : 'Industries'}
        </button>
      </div>

      {/* Main Grid */}
      <div style={s.body}>
        {loading ? (
          <div style={s.loading}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
            <span>{language === 'vi' ? 'Đang tải thiết lập...' : 'Loading settings...'}</span>
          </div>
        ) : (
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead>
                <tr style={s.trHead}>
                  <th style={s.th}>{language === 'vi' ? 'Tên danh mục' : 'Name'}</th>
                  <th style={s.th}>{language === 'vi' ? 'Mã hệ thống (Code)' : 'System Code'}</th>
                  <th style={s.th}>{language === 'vi' ? 'Trạng thái hoạt động' : 'Status'}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'sources' ? sources : industries).map((item) => (
                  <tr key={item.id} style={s.tr}>
                    <td style={s.td}><strong>{item.name}</strong></td>
                    <td style={s.td}><code style={s.code}>{item.code}</code></td>
                    <td style={s.td}>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        style={{
                          ...s.statusBadge,
                          backgroundColor: item.is_active ? '#ECFDF5' : '#FEF2F2',
                          color: item.is_active ? '#059669' : '#DC2626',
                          borderColor: item.is_active ? '#A7F3D0' : '#FCA5A5',
                        }}
                      >
                        {item.is_active ? (language === 'vi' ? 'Đang kích hoạt' : 'Active') : (language === 'vi' ? 'Tạm ẩn' : 'Inactive')}
                      </button>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <button onClick={() => handleOpenEdit(item)} style={s.editBtn} title={language === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div style={s.overlay}>
          <div style={s.modal} className="animate-fade-in">
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                {mode === 'create'
                  ? (language === 'vi' ? 'Thêm Mới Thiết Lập' : 'Create Setting Entry')
                  : (language === 'vi' ? 'Cập Nhật Thiết Lập' : 'Edit Setting Entry')}
              </h3>
              <button style={s.closeBtn} onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={s.modalBody}>
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Tên hiển thị *' : 'Display Name *'}</label>
                  <input
                    type="text" className="form-input" required autoFocus
                    placeholder={activeTab === 'sources' ? 'e.g. Email Inquiry' : 'e.g. Chemical Manufacturing'}
                    value={name} onChange={e => {
                      setName(e.target.value);
                      if (mode === 'create') {
                        setCode(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
                      }
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Mã Code (Chữ thường, không dấu) *' : 'System Identifier Code *'}</label>
                  <input
                    type="text" className="form-input" required
                    placeholder="e.g. email_inquiry"
                    value={code} onChange={e => setCode(e.target.value)}
                    disabled={mode === 'edit'}
                  />
                </div>

                <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox" id="isActive" checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '0.825rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                    {language === 'vi' ? 'Kích hoạt hoạt động (Cho phép chọn trong form)' : 'Activate entry (Allow selection in form fields)'}
                  </label>
                </div>
              </div>

              <div style={s.modalFooter}>
                <button type="button" className="btn btn-outline" disabled={saving} onClick={() => setModalOpen(false)}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-teal" disabled={saving || !name.trim() || !code.trim()}>
                  {saving ? '...' : (language === 'vi' ? 'Lưu cấu hình' : 'Save Entry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem 0.75rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#fff',
  },
  pageTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  pageSubtitle: {
    margin: '0.2rem 0 0',
    fontSize: '0.8rem',
    color: '#64748b',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--color-teal)',
    border: 'none',
    color: '#fff',
    padding: '0.5rem 0.9rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabsRow: {
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    padding: '0 1.5rem',
    display: 'flex',
    gap: '1.5rem',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '0.85rem 0.25rem',
    cursor: 'pointer',
    fontSize: '0.825rem',
    transition: 'all 0.15s',
  },
  body: {
    flex: 1,
    padding: '1.5rem',
    overflowY: 'auto' as const,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '4rem 1rem',
    color: '#64748b',
    fontSize: '0.85rem',
  },
  tableCard: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  },
  trHead: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '0.75rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.825rem',
    color: '#334155',
  },
  code: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    padding: '0.15rem 0.35rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
  },
  statusBadge: {
    border: '1px solid',
    borderRadius: '20px',
    padding: '0.15rem 0.5rem',
    fontSize: '0.725rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  editBtn: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    padding: '0.3rem',
    cursor: 'pointer',
    color: '#475569',
    display: 'inline-flex',
  },
  overlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  modalHeader: {
    backgroundColor: '#0f172a',
    padding: '1rem 1.25rem',
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  modalFooter: {
    borderTop: '1px solid #e2e8f0',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
};
