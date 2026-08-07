import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmOpportunity, type CrmLeadSource } from '../../shared/types/crm';
import { 
  Plus, Search, Edit, Trash2, Briefcase, TrendingUp
} from 'lucide-react';

interface CrmOpportunitiesProps {
  language: 'vi' | 'en';
  onLogAction?: (msg: string) => void;
  onOpportunityCreated?: () => void;
}

export const CrmOpportunities: React.FC<CrmOpportunitiesProps> = ({ language, onLogAction, onOpportunityCreated }) => {
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<CrmLeadSource[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterSolution, setFilterSolution] = useState<string>('all');

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [solutionType, setSolutionType] = useState<'lng' | 'lpg' | 'conversion' | 'kitchen'>('lng');
  const [dealValue, setDealValue] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [probability, setProbability] = useState(10);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [stage, setStage] = useState<any>('new');
  const [sourceId, setSourceId] = useState('');
  const [notes, setNotes] = useState('');
  const [lostReason, setLostReason] = useState('');

  const fetchOpportunities = async () => {
    setLoading(true);
    const client = supabase;
    if (!client) return;

    try {
      // 1. Fetch opportunities with references
      const { data: oppData, error } = await client
        .from('crm_opportunities')
        .select(`
          *,
          company:crm_companies(id, name, company_number),
          primary_contact:crm_contacts(id, name, email, phone)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load salesperson profile metadata from users table
      const { data: profs } = await client.from('users').select('id, name, email');
      const profileMap = new Map((profs || []).map((p: any) => [p.id, { id: p.id, display_name: p.name, email: p.email }]));
      
      const mapped: CrmOpportunity[] = (oppData || []).map((o: any) => {
        const assignedProfile = o.assigned_to ? profileMap.get(o.assigned_to) : null;
        return {
          ...o,
          assigned_profile: assignedProfile ? { display_name: assignedProfile.display_name, email: assignedProfile.email } : undefined
        };
      });
      setOpportunities(mapped);

      // 2. Fetch companies
      const { data: compData } = await client.from('crm_companies').select('id, name').is('deleted_at', null).order('name');
      setCompanies(compData || []);

      // 3. Fetch contacts
      const { data: contData } = await client.from('crm_contacts').select('id, name, company_id').is('deleted_at', null).order('name');
      setContacts(contData || []);

      // 4. Fetch lead sources
      const { data: srcData } = await client.from('crm_lead_sources').select('*').eq('is_active', true);
      setLeadSources(srcData || []);

      // 5. Fetch salespersons profiles
      const { data: salesData } = await client.from('users').select('id, name').eq('status', 'active');
      setProfiles((salesData || []).map((p: any) => ({ id: p.id, display_name: p.name })));
    } catch (err) {
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Filter contacts by selected company inside the modal
  const filteredModalContacts = contacts.filter(c => c.company_id === companyId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;

    const payload = {
      title: title.trim(),
      company_id: companyId,
      primary_contact_id: contactId || null,
      solution_type: solutionType,
      deal_value: dealValue,
      currency,
      probability,
      expected_close_date: expectedCloseDate || null,
      assigned_to: assignedTo || null,
      stage,
      source_id: sourceId || null,
      notes: notes.trim(),
      lost_reason: stage === 'lost' ? lostReason.trim() : ''
    };

    try {
      if (modalMode === 'create') {
        const { error } = await client
          .from('crm_opportunities')
          .insert(payload);

        if (error) throw error;
        if (onLogAction) onLogAction(`Manually created Opportunity Deal: ${title}`);
      } else {
        if (!selectedOpportunityId) return;
        
        // Load old stage to check if we write status_change log
        const oldDeal = opportunities.find(o => o.id === selectedOpportunityId);

        const { error } = await client
          .from('crm_opportunities')
          .update(payload)
          .eq('id', selectedOpportunityId);

        if (error) throw error;
        
        // Write audit log / status activity if stage changed
        if (oldDeal && oldDeal.stage !== stage) {
          await client.from('crm_activities').insert({
            entity_type: 'opportunity',
            entity_id: selectedOpportunityId,
            activity_type: 'status_change',
            content: language === 'vi' 
              ? `Chuyển trạng thái Deal từ [${oldDeal.stage}] sang [${stage}]`
              : `Deal stage modified from [${oldDeal.stage}] to [${stage}]`
          });
        }

        if (onLogAction) onLogAction(`Updated Opportunity Deal metadata for ID: ${selectedOpportunityId}`);
      }

      setModalOpen(false);
      resetForm();
      fetchOpportunities();
      if (onOpportunityCreated) onOpportunityCreated();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleEdit = (opp: CrmOpportunity) => {
    setModalMode('edit');
    setSelectedOpportunityId(opp.id);
    setTitle(opp.title);
    setCompanyId(opp.company_id);
    setContactId(opp.primary_contact_id || '');
    setSolutionType(opp.solution_type);
    setDealValue(opp.deal_value);
    setCurrency(opp.currency);
    setProbability(opp.probability);
    setExpectedCloseDate(opp.expected_close_date || '');
    setAssignedTo(opp.assigned_to || '');
    setStage(opp.stage);
    setSourceId(opp.source_id || '');
    setNotes(opp.notes || '');
    setLostReason(opp.lost_reason || '');
    setModalOpen(true);
  };

  const handleDelete = async (oppId: string, oppTitle: string) => {
    const client = supabase;
    if (!client) return;
    if (!confirm(language === 'vi' ? `Bạn có chắc muốn xoá cơ hội "${oppTitle}" không?` : `Are you sure you want to delete "${oppTitle}"?`)) return;

    try {
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user.id || null;

      const { error } = await client
        .from('crm_opportunities')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', oppId);

      if (error) throw error;
      setOpportunities(prev => prev.filter(o => o.id !== oppId));
      if (onLogAction) onLogAction(`Soft-deleted Opportunity ID: ${oppId}`);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCompanyId(companies[0]?.id || '');
    setContactId('');
    setSolutionType('lng');
    setDealValue(0);
    setCurrency('VND');
    setProbability(10);
    setExpectedCloseDate('');
    setAssignedTo(profiles[0]?.id || '');
    setStage('new');
    setSourceId('');
    setNotes('');
    setLostReason('');
    setSelectedOpportunityId(null);
  };

  // Filters application
  const filteredOpps = opportunities.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.opportunity_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = filterStage === 'all' || o.stage === filterStage;
    const matchesSolution = filterSolution === 'all' || o.solution_type === filterSolution;

    return matchesSearch && matchesStage && matchesSolution;
  });

  const getStageLabel = (st: string) => {
    const stages: Record<string, { vi: string; en: string; bg: string; color: string }> = {
      new: { vi: 'Mới nhận', en: 'New', bg: '#EFF6FF', color: '#1D4ED8' },
      qualified: { vi: 'Đạt chất lượng', en: 'Qualified', bg: '#F0FDF4', color: '#16A34A' },
      contacted: { vi: 'Đang liên hệ', en: 'Contacted', bg: '#FEF3C7', color: '#D97706' },
      survey: { vi: 'Khảo sát thực địa', en: 'Site Survey', bg: '#F5F3FF', color: '#7C3AED' },
      design: { vi: 'Thiết kế giải pháp', en: 'Solution Design', bg: '#ECFEFF', color: '#0891B2' },
      proposal: { vi: 'Báo giá đề xuất', en: 'Proposal Sent', bg: '#FFF1F2', color: '#E11D48' },
      negotiation: { vi: 'Thương thảo hợp đồng', en: 'Negotiation', bg: '#FFF7ED', color: '#EA580C' },
      review: { vi: 'Duyệt hợp đồng', en: 'Contract Review', bg: '#F0FDFA', color: '#0D9488' },
      dormant: { vi: 'Tạm ngưng / Theo dõi', en: 'Dormant', bg: '#F3F4F6', color: '#4B5563' },
      won: { vi: 'Thành công (Won)', en: 'Closed Won', bg: '#D1FAE5', color: '#065F46' },
      lost: { vi: 'Thất bại (Lost)', en: 'Closed Lost', bg: '#FEE2E2', color: '#991B1B' }
    };
    return stages[st] || { vi: st, en: st, bg: '#fff', color: '#000' };
  };

  const formatCurrency = (val: number, cur: string) => {
    if (cur === 'VND') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(val);
  };

  return (
    <div style={styles.container}>
      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={styles.searchBlock}>
          <Search size={16} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={language === 'vi' ? 'Tìm cơ hội kinh doanh (Tiêu đề, mã Deal, tên công ty)...' : 'Search deals (Title, deal ID, company)...'} 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={styles.filters}>
          <select style={styles.selectFilter} value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
            <option value="all">{language === 'vi' ? 'Tất cả giai đoạn' : 'All Stages'}</option>
            <option value="new">New (Mới)</option>
            <option value="survey">Site Survey (Khảo sát)</option>
            <option value="proposal">Proposal (Báo giá)</option>
            <option value="negotiation">Negotiation (Đàm phán)</option>
            <option value="dormant">Dormant (Tạm hoãn)</option>
            <option value="won">Closed Won (Ký hđ)</option>
            <option value="lost">Closed Lost (Hủy)</option>
          </select>

          <select style={styles.selectFilter} value={filterSolution} onChange={(e) => setFilterSolution(e.target.value)}>
            <option value="all">{language === 'vi' ? 'Tất cả giải pháp' : 'All Solutions'}</option>
            <option value="lng">LNG Solution</option>
            <option value="lpg">LPG Solution</option>
            <option value="conversion">Boiler Conversion</option>
            <option value="kitchen">Commercial Kitchen</option>
          </select>

          <button 
            style={styles.createBtn}
            onClick={() => { setModalMode('create'); resetForm(); setModalOpen(true); }}
          >
            <Plus size={16} />
            <span>{language === 'vi' ? 'Tạo cơ hội' : 'Add Opportunity'}</span>
          </button>
        </div>
      </div>

      {/* OPPORTUNITY TABLE */}
      <div style={styles.tableResponsive}>
        {loading ? (
          <div style={styles.loading}>{language === 'vi' ? 'Đang tải danh sách...' : 'Loading opportunities...'}</div>
        ) : filteredOpps.length === 0 ? (
          <div style={styles.emptyState}>
            <TrendingUp size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <p>{language === 'vi' ? 'Không tìm thấy cơ hội kinh doanh nào' : 'No opportunities matching filters'}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>{language === 'vi' ? 'Mã số Deal' : 'Deal ID'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Cơ hội / Dự án' : 'Deal Title'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Doanh nghiệp' : 'Company Account'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Giải pháp' : 'Solution'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Giá trị Deal' : 'Deal Value'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Giai đoạn' : 'Stage'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Phụ trách' : 'Assigned Owner'}</th>
                <th style={styles.th}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpps.map((opp) => {
                const label = getStageLabel(opp.stage);
                return (
                  <tr key={opp.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.dealNum}>{opp.opportunity_number}</span>
                    </td>
                    <td style={styles.td}>
                      <strong style={{ color: '#0f172a' }}>{opp.title}</strong>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        📅 Hẹn chốt: {opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '—'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <Briefcase size={14} color="#64748b" />
                        <span>{opp.company?.name || '—'}</span>
                      </div>
                      {opp.primary_contact && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          👤 {opp.primary_contact.name}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.solBadge}>{opp.solution_type.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                      <strong>{formatCurrency(opp.deal_value, opp.currency)}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Prob: {opp.probability}% | Forecast: {formatCurrency(opp.deal_value * (opp.probability / 100), opp.currency)}
                      </div>
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
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        👤 {opp.assigned_profile?.display_name || 'Unassigned'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button style={styles.actionBtn} onClick={() => handleEdit(opp)} title="Chỉnh sửa">
                          <Edit size={14} color="#64748b" />
                        </button>
                        <button style={styles.deleteBtn} onClick={() => handleDelete(opp.id, opp.title)} title="Xoá">
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
                  ? (language === 'vi' ? 'Thêm Cơ Hội Kinh Doanh (Deal)' : 'Open New Sales Deal') 
                  : (language === 'vi' ? 'Cập Nhật Cơ Hội' : 'Edit Opportunity Detail')}
              </h3>
              <button style={styles.modalClose} onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={styles.modalBody}>
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Tiêu đề cơ hội / Tên dự án *' : 'Deal / Project Title *'}</label>
                  <input type="text" className="form-input" placeholder="e.g. ABC Factory - Boiler conversion phase 2" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Doanh nghiệp liên kết *' : 'Company Account *'}</label>
                    <select className="form-select" value={companyId} onChange={(e) => { setCompanyId(e.target.value); setContactId(''); }} required>
                      <option value="">— Select Company —</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Người liên hệ đại diện' : 'Primary Contact'}</label>
                    <select className="form-select" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                      <option value="">— Select Contact —</option>
                      {filteredModalContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.position})</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Giải pháp nhiên liệu' : 'Solution category'}</label>
                    <select className="form-select" value={solutionType} onChange={(e) => setSolutionType(e.target.value as any)}>
                      <option value="lng">LNG Solution</option>
                      <option value="lpg">LPG Solution</option>
                      <option value="conversion">Boiler Conversion</option>
                      <option value="kitchen">Commercial Kitchen</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Giá trị cơ hội (VNĐ)' : 'Deal value'}</label>
                    <input type="number" className="form-input" value={dealValue} onChange={(e) => setDealValue(Number(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="VND">VND (VN Đồng)</option>
                      <option value="USD">USD ($ Đô la)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Giai đoạn phễu' : 'Pipeline Stage'}</label>
                    <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value as any)}>
                      <option value="new">New (Mới nhận)</option>
                      <option value="qualified">Qualified (Đạt chất lượng)</option>
                      <option value="contacted">Contacted (Đang liên hệ)</option>
                      <option value="survey">Site Survey (Khảo sát thực địa)</option>
                      <option value="design">Solution Design (Thiết kế)</option>
                      <option value="proposal">Proposal (Báo giá đề xuất)</option>
                      <option value="negotiation">Negotiation (Đàm phán)</option>
                      <option value="review">Contract Review (Duyệt hđ)</option>
                      <option value="dormant">Dormant (Tạm hoãn/Theo dõi)</option>
                      <option value="won">Closed Won (Ký hđ thành công)</option>
                      <option value="lost">Closed Lost (Deal thất bại)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Khả năng chốt (%)' : 'Probability (%)'}</label>
                    <input type="number" min="0" max="100" className="form-input" value={probability} onChange={(e) => setProbability(Number(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Lịch chốt dự kiến' : 'Expected Close Date'}</label>
                    <input type="date" className="form-input" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
                  </div>
                </div>

                {stage === 'lost' && (
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#EF4444' }}>{language === 'vi' ? 'Lý do thất bại *' : 'Lost Reason *'}</label>
                    <input type="text" className="form-input" style={{ borderColor: '#FCA5A5' }} value={lostReason} onChange={(e) => setLostReason(e.target.value)} required />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Nguồn Deal' : 'Lead Source'}</label>
                    <select className="form-select" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                      <option value="">— Select Source —</option>
                      {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Nhân sự phụ trách' : 'Assigned Salesperson'}</label>
                    <select className="form-select" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                      <option value="">— Select Owner —</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Ghi chú / Thảo luận dự án' : 'Internal Notes'}</label>
                  <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-teal" disabled={!title || !companyId}>
                  {language === 'vi' ? 'Lưu Lại' : 'Save Deal'}
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
  dealNum: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
  },
  solBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.1rem 0.35rem',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    borderRadius: '4px',
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
