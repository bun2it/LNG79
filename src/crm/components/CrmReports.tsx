import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type OpportunityStage, type SolutionType } from '../../shared/types/crm';
import { RefreshCw } from 'lucide-react';

interface CrmReportsProps {
  language: 'vi' | 'en';
}

interface OwnerPerformance {
  ownerId: string;
  name: string;
  email: string;
  totalDeals: number;
  wonCount: number;
  wonValue: number;
  openCount: number;
  openValue: number;
  weightedForecast: number;
  winRate: number;
}

interface ReportsData {
  byOwner: OwnerPerformance[];
  bySolution: { type: SolutionType; label: string; count: number; value: number; weighted: number }[];
  byStage: { stage: OpportunityStage; label: string; count: number; value: number }[];
  timeline: { month: string; value: number; count: number }[];
}

const STAGE_LABELS: Record<OpportunityStage, { vi: string; en: string }> = {
  new:         { vi: 'Mới nhận',          en: 'New Lead'        },
  qualified:   { vi: 'Tiềm năng',         en: 'Qualified'       },
  contacted:   { vi: 'Đang liên hệ',      en: 'Contacted'       },
  survey:      { vi: 'Khảo sát',          en: 'Site Survey'     },
  design:      { vi: 'Thiết kế',          en: 'Design'          },
  proposal:    { vi: 'Báo giá',           en: 'Proposal'        },
  negotiation: { vi: 'Đàm phán',          en: 'Negotiation'     },
  review:      { vi: 'Duyệt hợp đồng',   en: 'Contract Review' },
  dormant:     { vi: 'Tạm hoãn',          en: 'Dormant'         },
  won:         { vi: 'Thắng (Ký HĐ)',    en: 'Won (Closed)'    },
  lost:        { vi: 'Thất bại',          en: 'Lost (Closed)'   },
};

const SOLUTION_LABELS: Record<SolutionType, { vi: string; en: string }> = {
  lng: { vi: 'Khí LNG', en: 'LNG Gas' },
  lpg: { vi: 'Khí LPG', en: 'LPG Gas' },
  conversion: { vi: 'Chuyển đổi', en: 'Conversion' },
  kitchen: { vi: 'Bếp CN B2B', en: 'Kitchen B2B' },
};

export const CrmReports: React.FC<CrmReportsProps> = ({ language }) => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B ₫`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M ₫`;
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const loadReportsData = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      // 1. Fetch opportunities with owner profile info
      const { data: opportunities, error: oppsError } = await client
        .from('crm_opportunities')
        .select(`
          *,
          company:crm_companies(id, name)
        `)
        .is('deleted_at', null);

      if (oppsError) throw oppsError;

      // 2. Fetch all profiles to map users properly
      const { data: profiles, error: profsError } = await client
        .from('users')
        .select('id, name, email');

      if (profsError) throw profsError;

      const oppList = opportunities || [];
      const profList = (profiles || []).map(p => ({ id: p.id, display_name: p.name, email: p.email }));

      // Group by Owner
      const ownerMap: Record<string, OwnerPerformance> = {};
      
      // Initialize with all profiles that have display names
      profList.forEach(p => {
        ownerMap[p.id] = {
          ownerId: p.id,
          name: p.display_name || p.email || 'Unknown',
          email: p.email || '',
          totalDeals: 0,
          wonCount: 0,
          wonValue: 0,
          openCount: 0,
          openValue: 0,
          weightedForecast: 0,
          winRate: 0,
        };
      });

      // Catch-all for unassigned or manual issues
      const unassignedKey = 'unassigned';
      ownerMap[unassignedKey] = {
        ownerId: unassignedKey,
        name: T('Chưa phân công', 'Unassigned'),
        email: '',
        totalDeals: 0,
        wonCount: 0,
        wonValue: 0,
        openCount: 0,
        openValue: 0,
        weightedForecast: 0,
        winRate: 0,
      };

      // Group by Solution
      const solMap: Record<SolutionType, { count: number; value: number; weighted: number }> = {
        lng: { count: 0, value: 0, weighted: 0 },
        lpg: { count: 0, value: 0, weighted: 0 },
        conversion: { count: 0, value: 0, weighted: 0 },
        kitchen: { count: 0, value: 0, weighted: 0 },
      };

      // Group by Stage
      const stageMap: Record<OpportunityStage, { count: number; value: number }> = {
        new: { count: 0, value: 0 },
        qualified: { count: 0, value: 0 },
        contacted: { count: 0, value: 0 },
        survey: { count: 0, value: 0 },
        design: { count: 0, value: 0 },
        proposal: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        review: { count: 0, value: 0 },
        dormant: { count: 0, value: 0 },
        won: { count: 0, value: 0 },
        lost: { count: 0, value: 0 },
      };

      // Group by Month (Created Date)
      const monthlyMap: Record<string, { value: number; count: number }> = {};

      oppList.forEach(opp => {
        const stage = opp.stage as OpportunityStage;
        const sol = opp.solution_type as SolutionType;
        const ownerId = opp.assigned_to || unassignedKey;
        const owner = ownerMap[ownerId] || ownerMap[unassignedKey];

        owner.totalDeals += 1;
        if (stage === 'won') {
          owner.wonCount += 1;
          owner.wonValue += opp.deal_value;
        } else if (stage !== 'lost') {
          owner.openCount += 1;
          owner.openValue += opp.deal_value;
          owner.weightedForecast += opp.deal_value * (opp.probability / 100);
        }

        // Solution stats
        if (solMap[sol]) {
          solMap[sol].count += 1;
          solMap[sol].value += opp.deal_value;
          if (stage !== 'won' && stage !== 'lost') {
            solMap[sol].weighted += opp.deal_value * (opp.probability / 100);
          } else if (stage === 'won') {
            solMap[sol].weighted += opp.deal_value;
          }
        }

        // Stage stats
        if (stageMap[stage]) {
          stageMap[stage].count += 1;
          stageMap[stage].value += opp.deal_value;
        }

        // Monthly stats
        const date = new Date(opp.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { value: 0, count: 0 };
        }
        monthlyMap[monthKey].value += opp.deal_value;
        monthlyMap[monthKey].count += 1;
      });

      // Post-process owner performance win rate
      const byOwnerList = Object.values(ownerMap)
        .filter(owner => owner.totalDeals > 0)
        .map(owner => {
          const closed = owner.wonCount + (owner.totalDeals - owner.openCount - owner.wonCount);
          return {
            ...owner,
            winRate: closed > 0 ? Math.round((owner.wonCount / closed) * 100) : 0,
          };
        });

      // Post-process solution stats
      const bySolutionList = (Object.keys(solMap) as SolutionType[]).map(type => ({
        type,
        label: SOLUTION_LABELS[type][language],
        count: solMap[type].count,
        value: solMap[type].value,
        weighted: solMap[type].weighted,
      }));

      // Post-process stage stats
      const byStageList = (Object.keys(stageMap) as OpportunityStage[]).map(stage => ({
        stage,
        label: STAGE_LABELS[stage][language],
        count: stageMap[stage].count,
        value: stageMap[stage].value,
      }));

      // Post-process monthly timeline
      const timelineList = Object.entries(monthlyMap)
        .map(([month, data]) => ({
          month,
          value: data.value,
          count: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setData({
        byOwner: byOwnerList,
        bySolution: bySolutionList,
        byStage: byStageList,
        timeline: timelineList,
      });

    } catch (err) {
      console.error('Error compiling reports:', err);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={24} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
        <span>{T('Đang biên soạn báo cáo...', 'Compiling reports...')}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={styles.container}>
      {/* Sales Forecast & Weighted Pipeline */}
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🎯 {T('Dự Báo Doanh Thu B2B', 'Sales & Forecast Revenue')}</h3>
          <button style={styles.refreshBtn} onClick={loadReportsData}><RefreshCw size={14} /></button>
        </div>
        
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>{T('Giải pháp', 'Solution')}</th>
                <th style={styles.th}>{T('Số lượng Deal', 'Deals Count')}</th>
                <th style={styles.th}>{T('Tổng Giá trị Deal', 'Total Pipeline Value')}</th>
                <th style={styles.th}>{T('Dự báo có trọng số (Weighted)', 'Weighted Forecast')}</th>
              </tr>
            </thead>
            <tbody>
              {data.bySolution.map(sol => (
                <tr key={sol.type} style={styles.tr}>
                  <td style={styles.td}>
                    <strong style={{ color: '#1e293b' }}>{sol.label}</strong>
                  </td>
                  <td style={styles.td}>{sol.count}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{formatCurrency(sol.value)}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: '#0d9488' }}>{formatCurrency(sol.weighted)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance by Salesperson */}
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>👥 {T('Hiệu Suất Nhân Sự Bán Hàng', 'Salesperson Performance')}</h3>
        </div>
        
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>{T('Nhân viên', 'Owner')}</th>
                <th style={styles.th}>{T('Số Deal tham gia', 'Total Deals')}</th>
                <th style={styles.th}>{T('Đã chốt (Won)', 'Won Count')}</th>
                <th style={styles.th}>{T('Tổng Doanh số chốt', 'Won Revenue')}</th>
                <th style={styles.th}>{T('Đang mở (Open)', 'Open Count')}</th>
                <th style={styles.th}>{T('Doanh số dự báo', 'Forecast (Weighted)')}</th>
                <th style={styles.th}>{T('Tỉ lệ chốt', 'Win Rate')}</th>
              </tr>
            </thead>
            <tbody>
              {data.byOwner.map(owner => (
                <tr key={owner.ownerId} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.ownerInfo}>
                      <span style={styles.ownerName}>{owner.name}</span>
                      {owner.email && <span style={styles.ownerEmail}>{owner.email}</span>}
                    </div>
                  </td>
                  <td style={styles.td}>{owner.totalDeals}</td>
                  <td style={{ ...styles.td, color: '#059669', fontWeight: 600 }}>{owner.wonCount}</td>
                  <td style={{ ...styles.td, color: '#059669', fontWeight: 700 }}>{formatCurrency(owner.wonValue)}</td>
                  <td style={styles.td}>{owner.openCount}</td>
                  <td style={{ ...styles.td, color: '#0d9488', fontWeight: 700 }}>{formatCurrency(owner.weightedForecast)}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.winRateBadge,
                      backgroundColor: owner.winRate >= 70 ? '#ecfdf5' : owner.winRate >= 40 ? '#fffbeb' : '#fef2f2',
                      color: owner.winRate >= 70 ? '#059669' : owner.winRate >= 40 ? '#d97706' : '#dc2626',
                      borderColor: owner.winRate >= 70 ? '#a7f3d0' : owner.winRate >= 40 ? '#fde68a' : '#fecaca',
                    }}>
                      {owner.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Pipeline Growth trend */}
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📈 {T('Tăng Trưởng Pipeline Theo Tháng', 'Monthly Pipeline Growth')}</h3>
        </div>
        
        <div style={styles.timelineGrid}>
          {data.timeline.length === 0 ? (
            <div style={styles.emptyBox}>{T('Chưa có đủ dữ liệu theo tháng', 'Not enough monthly data')}</div>
          ) : (
            data.timeline.map(time => (
              <div key={time.month} style={styles.timelineCard}>
                <div style={styles.timelineMonth}>{time.month}</div>
                <div style={styles.timelineValue}>{formatCurrency(time.value)}</div>
                <div style={styles.timelineCount}>{time.count} {T('deals mới tạo', 'new deals')}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
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
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '0.875rem',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#0f172a',
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
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  thead: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '0.625rem 0.875rem',
    textAlign: 'left' as const,
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap' as const,
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.1s',
    '&:hover': {
      backgroundColor: '#f8fafc',
    }
  },
  td: {
    padding: '0.75rem 0.875rem',
    fontSize: '0.82rem',
    color: '#334155',
  },
  ownerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  ownerName: {
    fontWeight: 600,
    color: '#0f172a',
  },
  ownerEmail: {
    fontSize: '0.68rem',
    color: '#94a3b8',
  },
  winRateBadge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '12px',
    border: '1px solid',
  },
  timelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  timelineCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.875rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  timelineMonth: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  timelineValue: {
    fontSize: '1.05rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  timelineCount: {
    fontSize: '0.68rem',
    color: '#64748b',
  },
  emptyBox: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#cbd5e1',
    fontStyle: 'italic',
  }
} as const;
