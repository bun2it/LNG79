import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmOpportunity, type OpportunityStage } from '../../shared/types/crm';
import { ChevronRight, TrendingUp, RefreshCw, List, Kanban, Plus } from 'lucide-react';
import { OpportunityDrawer } from './OpportunityDrawer';

interface CrmPipelineProps {
  language: 'vi' | 'en';
  userProfile: any;
  onLogAction?: (msg: string) => void;
  triggerCreate?: number;
}

// Pipeline stage configuration — order matters
const PIPELINE_STAGES: {
  id: OpportunityStage;
  label: { vi: string; en: string };
  color: string;
  bg: string;
  border: string;
}[] = [
  { id: 'new',         label: { vi: 'Mới nhận',          en: 'New Lead'        }, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'qualified',   label: { vi: 'Tiềm năng',         en: 'Qualified'       }, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { id: 'contacted',   label: { vi: 'Đang liên hệ',      en: 'Contacted'       }, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'survey',      label: { vi: 'Khảo sát',          en: 'Site Survey'     }, color: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC' },
  { id: 'design',      label: { vi: 'Thiết kế',          en: 'Design'          }, color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
  { id: 'proposal',    label: { vi: 'Báo giá',           en: 'Proposal'        }, color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { id: 'negotiation', label: { vi: 'Đàm phán',          en: 'Negotiation'     }, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { id: 'review',      label: { vi: 'Duyệt hợp đồng',   en: 'Contract Review' }, color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
  { id: 'dormant',     label: { vi: 'Tạm hoãn',          en: 'Dormant'         }, color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  { id: 'won',         label: { vi: '✅ Ký hợp đồng',   en: '✅ Closed Won'   }, color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
  { id: 'lost',        label: { vi: '❌ Thất bại',       en: '❌ Closed Lost'  }, color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
];

const SOLUTION_COLORS: Record<string, string> = {
  lng: '#0D9488',
  lpg: '#7C3AED',
  conversion: '#D97706',
  kitchen: '#DB2777',
};

export const CrmPipeline: React.FC<CrmPipelineProps> = ({ language, userProfile, onLogAction, triggerCreate }) => {
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<CrmOpportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Layout View Mode
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Create Opportunity modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);

  // Form State for new Opportunity
  const [newTitle, setNewTitle] = useState('');
  const [newCompanyId, setNewCompanyId] = useState('');
  const [newContactId, setNewContactId] = useState('');
  const [newSolutionType, setNewSolutionType] = useState<'lng' | 'lpg' | 'conversion' | 'kitchen'>('lng');
  const [newDealValue, setNewDealValue] = useState(0);
  const [newProbability, setNewProbability] = useState(10);
  const [newExpectedCloseDate, setNewExpectedCloseDate] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newSourceId, setNewSourceId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Filters
  const [filterSolution, setFilterSolution] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  const fetchOpportunities = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client
        .from('crm_opportunities')
        .select(`
          *,
          company:crm_companies(id, name, company_number, province),
          primary_contact:crm_contacts(id, name, phone, position)
        `)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      
      // Load salesperson profile metadata from users table in background
      const { data: profs } = await client.from('users').select('id, name, email');
      const profileMap = new Map((profs || []).map((p: any) => [p.id, { display_name: p.name, email: p.email }]));
      
      const mapped: CrmOpportunity[] = (data || []).map((o: any) => {
        const assignedProfile = o.assigned_to ? profileMap.get(o.assigned_to) : null;
        return {
          ...o,
          assigned_profile: assignedProfile ? { display_name: assignedProfile.display_name, email: assignedProfile.email } : undefined
        };
      });
      setOpportunities(mapped);
    } catch (err) {
      console.error('Error loading pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Fetch reference metadata for opportunity form dropdowns
  const fetchReferenceData = async () => {
    const client = supabase;
    if (!client) return;
    try {
      const { data: comp } = await client.from('crm_companies').select('id, name').is('deleted_at', null).order('name');
      const { data: cont } = await client.from('crm_contacts').select('id, name, company_id').is('deleted_at', null).order('name');
      const { data: sales } = await client.from('users').select('id, name').eq('status', 'active');
      const { data: sources } = await client.from('crm_lead_sources').select('*').eq('is_active', true);
      setCompanies(comp || []);
      setContacts(cont || []);
      setProfiles((sales || []).map(p => ({ id: p.id, display_name: p.name })));
      setLeadSources(sources || []);
    } catch (err) {
      console.error('Error fetching reference data for pipeline:', err);
    }
  };

  // Open modal on Quick Create trigger
  useEffect(() => {
    if (triggerCreate) {
      fetchReferenceData();
      setCreateModalOpen(true);
    }
  }, [triggerCreate]);

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client || !newTitle.trim() || !newCompanyId) return;
    setCreateLoading(true);
    try {
      const payload = {
        title: newTitle.trim(),
        company_id: newCompanyId,
        primary_contact_id: newContactId || null,
        solution_type: newSolutionType,
        deal_value: newDealValue,
        currency: 'VND',
        probability: newProbability,
        expected_close_date: newExpectedCloseDate || null,
        assigned_to: newAssignedTo || null,
        stage: 'new', // Starts at "new"
        source_id: newSourceId || null,
        notes: newNotes.trim()
      };

      const { data, error } = await client
        .from('crm_opportunities')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await client.from('crm_activities').insert({
        entity_type: 'opportunity',
        entity_id: data.id,
        activity_type: 'status_change',
        content: language === 'vi'
          ? `Tạo mới cơ hội kinh doanh từ Quick Create`
          : `New opportunity created via Quick Create`,
        created_by: userProfile?.id || null,
      });

      setCreateModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewCompanyId('');
      setNewContactId('');
      setNewSolutionType('lng');
      setNewDealValue(0);
      setNewProbability(10);
      setNewExpectedCloseDate('');
      setNewAssignedTo('');
      setNewSourceId('');
      setNewNotes('');

      fetchOpportunities(); // Refresh pipeline list
      if (onLogAction) onLogAction(`Manually created Opportunity: ${newTitle}`);
    } catch (err: any) {
      alert(language === 'vi' ? `Lỗi tạo cơ hội: ${err.message}` : `Failed to create opportunity: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredModalContacts = contacts.filter(c => c.company_id === newCompanyId);

  const handleMoveStage = async (opp: CrmOpportunity, newStage: OpportunityStage) => {
    if (opp.stage === newStage) return;
    const client = supabase;
    if (!client) return;
    setMovingId(opp.id);
    try {
      const oldStage = opp.stage;
      // Optimistic update
      setOpportunities(prev =>
        prev.map(o => o.id === opp.id ? { ...o, stage: newStage } : o)
      );

      const updates: any = { stage: newStage };
      if (newStage === 'won') updates.probability = 100;
      if (newStage === 'lost') updates.probability = 0;

      const { error } = await client
        .from('crm_opportunities')
        .update(updates)
        .eq('id', opp.id);
      if (error) throw error;

      // Log activity
      await client.from('crm_activities').insert({
        entity_type: 'opportunity',
        entity_id: opp.id,
        activity_type: 'status_change',
        content: language === 'vi'
          ? `Deal chuyển từ giai đoạn [${PIPELINE_STAGES.find(s => s.id === oldStage)?.label.vi}] → [${PIPELINE_STAGES.find(s => s.id === newStage)?.label.vi}]`
          : `Stage moved from [${PIPELINE_STAGES.find(s => s.id === oldStage)?.label.en}] → [${PIPELINE_STAGES.find(s => s.id === newStage)?.label.en}]`,
        created_by: userProfile?.id || null,
      });

      if (onLogAction) onLogAction(`Moved deal ${opp.opportunity_number} to ${newStage}`);
    } catch (err: any) {
      // Rollback
      setOpportunities(prev =>
        prev.map(o => o.id === opp.id ? { ...o, stage: opp.stage } : o)
      );
      alert('Failed to move deal: ' + err.message);
    } finally {
      setMovingId(null);
    }
  };

  const handleOpenDrawer = (opp: CrmOpportunity) => {
    setSelectedOpp(opp);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedOpp(null);
    fetchOpportunities(); // Refresh after drawer closes (activities may have been added)
  };

  const handleDrawerUpdate = (updatedOpp: CrmOpportunity) => {
    setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
    setSelectedOpp(updatedOpp);
  };

  const formatCurrency = (val: number, cur: string) => {
    if (cur === 'VND') {
      if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B ₫`;
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M ₫`;
      return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, notation: 'compact' }).format(val);
  };

  const filtered = opportunities.filter(o => {
    const matchSolution = filterSolution === 'all' || o.solution_type === filterSolution;
    const q = filterSearch.toLowerCase();
    const matchSearch = !q ||
      o.title.toLowerCase().includes(q) ||
      o.opportunity_number.toLowerCase().includes(q) ||
      (o.company?.name || '').toLowerCase().includes(q);
    return matchSolution && matchSearch;
  });

  // Calculate total pipeline value per stage
  const stageStats = (stageId: OpportunityStage) => {
    const cards = filtered.filter(o => o.stage === stageId);
    const total = cards.reduce((sum, o) => sum + o.deal_value * (o.probability / 100), 0);
    return { count: cards.length, forecast: total };
  };

  const totalForecast = filtered.reduce((sum, o) => sum + o.deal_value * (o.probability / 100), 0);
  const wonValue = filtered.filter(o => o.stage === 'won').reduce((sum, o) => sum + o.deal_value, 0);

  return (
    <div style={styles.container}>
      {/* TOPBAR */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <div style={styles.statPill}>
            <TrendingUp size={14} color="#0D9488" />
            <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 700 }}>
              {language === 'vi' ? 'Dự báo:' : 'Forecast:'} {formatCurrency(totalForecast, 'VND')}
            </span>
          </div>
          <div style={{ ...styles.statPill, borderColor: '#6EE7B7' }}>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
              {language === 'vi' ? '✅ Đã ký:' : '✅ Won:'} {formatCurrency(wonValue, 'VND')}
            </span>
          </div>
        </div>
        <div style={styles.topRight}>
          {/* List/Kanban Toggle */}
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', marginRight: '0.25rem', height: '28px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.55rem', border: 'none',
                backgroundColor: viewMode === 'kanban' ? '#0f172a' : '#fff',
                color: viewMode === 'kanban' ? '#fff' : '#475569',
                cursor: 'pointer',
              }}
              title={language === 'vi' ? 'Bảng Kanban' : 'Kanban Board'}
            >
              <Kanban size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.55rem', border: 'none',
                backgroundColor: viewMode === 'list' ? '#0f172a' : '#fff',
                color: viewMode === 'list' ? '#fff' : '#475569',
                cursor: 'pointer',
              }}
              title={language === 'vi' ? 'Danh sách rút gọn' : 'Compact List'}
            >
              <List size={14} />
            </button>
          </div>

          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm deal...' : 'Search deals...'}
            style={styles.searchInput}
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
          />
          <select style={styles.selectFilter} value={filterSolution} onChange={e => setFilterSolution(e.target.value)}>
            <option value="all">{language === 'vi' ? 'Tất cả giải pháp' : 'All Solutions'}</option>
            <option value="lng">LNG</option>
            <option value="lpg">LPG</option>
            <option value="conversion">{language === 'vi' ? 'Chuyển đổi' : 'Conversion'}</option>
            <option value="kitchen">{language === 'vi' ? 'Bếp CN' : 'Kitchen'}</option>
          </select>
          <button style={styles.refreshBtn} onClick={() => fetchOpportunities()} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KANBAN BOARD OR LIST VIEW */}
      {loading ? (
        <div style={styles.loading}>
          <RefreshCw size={24} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
          <span>{language === 'vi' ? 'Đang tải pipeline...' : 'Loading pipeline...'}</span>
        </div>
      ) : viewMode === 'list' ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{language === 'vi' ? 'Mã số' : 'ID'}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{language === 'vi' ? 'Cơ hội / Dự án' : 'Title'}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{language === 'vi' ? 'Doanh nghiệp' : 'Company'}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{language === 'vi' ? 'Giải pháp' : 'Solution'}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{language === 'vi' ? 'Giá trị' : 'Value'}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{language === 'vi' ? 'Giai đoạn' : 'Stage'}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{language === 'vi' ? 'Phụ trách' : 'Owner'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(opp => {
                const stageObj = PIPELINE_STAGES.find(s => s.id === opp.stage) || PIPELINE_STAGES[0];
                return (
                  <tr key={opp.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => handleOpenDrawer(opp)}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>{opp.opportunity_number}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{opp.title}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#334155' }}>
                      🏢 {opp.company?.name || '—'}
                      {opp.primary_contact && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>👤 {opp.primary_contact.name}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                      <span style={{ backgroundColor: (SOLUTION_COLORS[opp.solution_type] || '#64748b') + '15', color: (SOLUTION_COLORS[opp.solution_type] || '#64748b'), padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                        {opp.solution_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                      <strong style={{ color: '#0f172a' }}>{formatCurrency(opp.deal_value, opp.currency)}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Prob: {opp.probability}%</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                      <span style={{ backgroundColor: stageObj.bg, color: stageObj.color, border: `1px solid ${stageObj.border}`, padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        {stageObj.label[language]}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                      {opp.assigned_profile?.display_name || 'Unassigned'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.board}>
          {PIPELINE_STAGES.map(stage => {
            const cards = filtered.filter(o => o.stage === stage.id);
            const stats = stageStats(stage.id);

            return (
              <div key={stage.id} style={styles.column}>
                {/* Column Header */}
                <div style={{ ...styles.columnHeader, borderTopColor: stage.color }}>
                  <div>
                    <span style={{ fontSize: '0.775rem', fontWeight: 700, color: stage.color }}>
                      {stage.label[language]}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                      {stats.count} deals
                      {stats.forecast > 0 && (
                        <span style={{ marginLeft: '0.25rem', color: '#64748b' }}>
                          · {formatCurrency(stats.forecast, 'VND')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    backgroundColor: stage.bg, color: stage.color,
                    border: `1px solid ${stage.border}`,
                    borderRadius: '10px', padding: '0.1rem 0.4rem'
                  }}>
                    {stats.count}
                  </span>
                </div>

                {/* Cards */}
                <div style={styles.cardList}>
                  {cards.length === 0 && (
                    <div style={styles.emptyColumn}>
                      <span>{language === 'vi' ? 'Không có deal' : 'No deals'}</span>
                    </div>
                  )}
                  {cards.map(opp => (
                    <DealCard
                      key={opp.id}
                      opp={opp}
                      stage={stage}
                      language={language}
                      isMoving={movingId === opp.id}
                      formatCurrency={formatCurrency}
                      solutionColors={SOLUTION_COLORS}
                      pipelineStages={PIPELINE_STAGES}
                      onOpen={() => handleOpenDrawer(opp)}
                      onMove={(newStage) => handleMoveStage(opp, newStage)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OPPORTUNITY DETAIL DRAWER */}
      {drawerOpen && selectedOpp && (
        <OpportunityDrawer
          opportunity={selectedOpp}
          language={language}
          userProfile={userProfile}
          pipelineStages={PIPELINE_STAGES}
          onClose={handleDrawerClose}
          onUpdate={handleDrawerUpdate}
          onMoveStage={(newStage) => handleMoveStage(selectedOpp, newStage)}
          formatCurrency={formatCurrency}
        />
      )}

      {/* CREATE NEW OPPORTUNITY MODAL (Quick Create Target) */}
      {createModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: '600px' }} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>
                <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {language === 'vi' ? 'Thêm Cơ Hội Bán Hàng Mới' : 'Open New Opportunity'}
              </h3>
              <button type="button" style={styles.modalClose} onClick={() => setCreateModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateOpportunity}>
              <div style={styles.modalBody}>
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Tiêu đề cơ hội / Tên dự án *' : 'Opportunity / Project Title *'}</label>
                  <input
                    type="text" className="form-input" required autoFocus
                    placeholder="e.g. B2B Client - LNG conversion factory"
                    value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Doanh nghiệp liên kết *' : 'Company Account *'}</label>
                    <select className="form-select" value={newCompanyId} onChange={e => { setNewCompanyId(e.target.value); setNewContactId(''); }} required>
                      <option value="">— Select Company —</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Người liên hệ đại diện' : 'Primary Contact'}</label>
                    <select className="form-select" value={newContactId} onChange={e => setNewContactId(e.target.value)}>
                      <option value="">— Select Contact —</option>
                      {filteredModalContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.position})</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Giải pháp nhiên liệu' : 'Solution category'}</label>
                    <select className="form-select" value={newSolutionType} onChange={e => setNewSolutionType(e.target.value as any)}>
                      <option value="lng">LNG Solution</option>
                      <option value="lpg">LPG Solution</option>
                      <option value="conversion">Boiler Conversion</option>
                      <option value="kitchen">Commercial Kitchen</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Giá trị dự toán (VNĐ)' : 'Deal value (VND)'}</label>
                    <input type="number" className="form-input" value={newDealValue} onChange={e => setNewDealValue(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Xác suất chốt (%)' : 'Probability (%)'}</label>
                    <input type="number" className="form-input" min={0} max={100} value={newProbability} onChange={e => setNewProbability(Number(e.target.value))} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Người phụ trách' : 'Assigned Owner'}</label>
                    <select className="form-select" value={newAssignedTo} onChange={e => setNewAssignedTo(e.target.value)}>
                      <option value="">— Select Owner —</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Hạn dự kiến chốt' : 'Expected close date'}</label>
                    <input type="date" className="form-input" value={newExpectedCloseDate} onChange={e => setNewExpectedCloseDate(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Nguồn Deal' : 'Deal source'}</label>
                    <select className="form-select" value={newSourceId} onChange={e => setNewSourceId(e.target.value)}>
                      <option value="">— Select Source —</option>
                      {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Ghi chú thêm' : 'Notes / Description'}</label>
                    <textarea className="form-input" rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} value={newNotes} onChange={e => setNewNotes(e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-outline" disabled={createLoading} onClick={() => setCreateModalOpen(false)}>
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-teal" disabled={createLoading || !newTitle || !newCompanyId}>
                  {createLoading ? '...' : (language === 'vi' ? 'Xác Nhận & Mở Deal' : 'Open Deal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Deal Card ────────────────────────────────────────────────────────────────
interface DealCardProps {
  opp: CrmOpportunity;
  stage: typeof PIPELINE_STAGES[number];
  language: 'vi' | 'en';
  isMoving: boolean;
  formatCurrency: (val: number, cur: string) => string;
  solutionColors: Record<string, string>;
  pipelineStages: typeof PIPELINE_STAGES;
  onOpen: () => void;
  onMove: (newStage: OpportunityStage) => void;
}

const DealCard: React.FC<DealCardProps> = ({
  opp, language, isMoving, formatCurrency, solutionColors, pipelineStages, onOpen, onMove
}) => {
  const [moveOpen, setMoveOpen] = useState(false);

  const isOverdue = opp.expected_close_date &&
    new Date(opp.expected_close_date) < new Date() &&
    opp.stage !== 'won' &&
    opp.stage !== 'lost';

  return (
    <div
      style={{
        ...styles.card,
        opacity: isMoving ? 0.6 : 1,
        borderLeft: `3px solid ${solutionColors[opp.solution_type] || '#64748b'}`
      }}
    >
      {/* Card Header */}
      <div style={styles.cardTitle} onClick={onOpen}>
        <span style={styles.cardTitleText}>{opp.title}</span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem',
          backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '3px'
        }}>
          {opp.solution_type.toUpperCase()}
        </span>
      </div>

      {/* Company */}
      <div style={styles.cardCompany} onClick={onOpen}>
        🏢 {opp.company?.name || '—'}
        {opp.company?.province && (
          <span style={{ color: '#94a3b8', marginLeft: '0.25rem' }}>({opp.company.province})</span>
        )}
      </div>

      {/* Deal Value */}
      <div style={styles.cardValue} onClick={onOpen}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(opp.deal_value, opp.currency)}</span>
        <span style={{ color: '#64748b', fontSize: '0.7rem' }}> · {opp.probability}%</span>
      </div>

      {/* Footer */}
      <div style={styles.cardFooter}>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {isOverdue && (
            <span style={styles.overdueTag}>⚠️ {language === 'vi' ? 'Quá hạn' : 'Overdue'}</span>
          )}
          {opp.expected_close_date && !isOverdue && (
            <span style={styles.dateTag}>
              {new Date(opp.expected_close_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Quick Move Button */}
        <div style={{ position: 'relative' }}>
          <button
            style={styles.moveBtn}
            onClick={(e) => { e.stopPropagation(); setMoveOpen(!moveOpen); }}
            title={language === 'vi' ? 'Chuyển giai đoạn' : 'Move stage'}
            disabled={isMoving}
          >
            <ChevronRight size={12} />
          </button>

          {moveOpen && (
            <div style={styles.moveDropdown}>
              <div style={styles.moveDropdownHeader}>
                {language === 'vi' ? 'Chuyển sang:' : 'Move to:'}
              </div>
              {pipelineStages.filter(s => s.id !== opp.stage).map(s => (
                <button
                  key={s.id}
                  style={styles.moveOption}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveOpen(false);
                    onMove(s.id);
                  }}
                >
                  <span style={{ color: s.color, fontSize: '0.65rem', fontWeight: 600 }}>
                    {s.label[language]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Opportunity number */}
      <div style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: '0.35rem', fontFamily: 'monospace' }}>
        {opp.opportunity_number}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    height: '100%',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    padding: '0 0 0.5rem 0',
    borderBottom: '1px solid #e2e8f0',
  },
  topLeft: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  topRight: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: '#f0fdfa',
    border: '1px solid #99F6E4',
    borderRadius: '20px',
    padding: '0.25rem 0.75rem',
  },
  searchInput: {
    padding: '0.35rem 0.75rem',
    fontSize: '0.8rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    outline: 'none',
    width: '180px',
  },
  selectFilter: {
    padding: '0.35rem 0.75rem',
    fontSize: '0.8rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.35rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    color: '#64748b',
  },
  board: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
    paddingBottom: '1rem',
    flex: 1,
    alignItems: 'flex-start',
  },
  column: {
    minWidth: '220px',
    width: '220px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  columnHeader: {
    padding: '0.625rem 0.75rem',
    borderTop: '3px solid transparent',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardList: {
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minHeight: '80px',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 280px)',
  },
  emptyColumn: {
    padding: '1.5rem 0.5rem',
    textAlign: 'center',
    fontSize: '0.7rem',
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    padding: '0.625rem 0.75rem',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    position: 'relative',
  },
  cardTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.25rem',
    marginBottom: '0.25rem',
  },
  cardTitleText: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#1e293b',
    lineHeight: '1.3',
    flexGrow: 1,
  },
  cardCompany: {
    fontSize: '0.72rem',
    color: '#64748b',
    marginBottom: '0.35rem',
  },
  cardValue: {
    fontSize: '0.78rem',
    marginBottom: '0.35rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.25rem',
  },
  overdueTag: {
    fontSize: '0.65rem',
    fontWeight: 600,
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '0.1rem 0.3rem',
    borderRadius: '4px',
  },
  dateTag: {
    fontSize: '0.65rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '0.1rem 0.3rem',
    borderRadius: '4px',
  },
  moveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    cursor: 'pointer',
    color: '#64748b',
    padding: 0,
  },
  moveDropdown: {
    position: 'absolute',
    right: 0,
    bottom: '26px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
    zIndex: 999,
    minWidth: '160px',
    overflow: 'hidden',
  },
  moveDropdownHeader: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#94a3b8',
    padding: '0.5rem 0.75rem 0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #f1f5f9',
  },
  moveOption: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    padding: '0.4rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: '#334155',
    '&:hover': { backgroundColor: '#f8fafc' },
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '4rem 1rem',
    color: '#64748b',
    fontSize: '0.875rem',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '750px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: '90vh',
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
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.875rem',
  },
  modalFooter: {
    borderTop: '1px solid #e2e8f0',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
} as const;
