import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmOpportunity, type OpportunityStage } from '../../shared/types/crm';
import { ChevronRight, TrendingUp, RefreshCw } from 'lucide-react';
import { OpportunityDrawer } from './OpportunityDrawer';

interface CrmPipelineProps {
  language: 'vi' | 'en';
  userProfile: any;
  onLogAction?: (msg: string) => void;
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

export const CrmPipeline: React.FC<CrmPipelineProps> = ({ language, userProfile, onLogAction }) => {
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<CrmOpportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      setOpportunities(data || []);
    } catch (err) {
      console.error('Error loading pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

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

      {/* KANBAN BOARD */}
      {loading ? (
        <div style={styles.loading}>
          <RefreshCw size={24} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
          <span>{language === 'vi' ? 'Đang tải pipeline...' : 'Loading pipeline...'}</span>
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
} as const;
