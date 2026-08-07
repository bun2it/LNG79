import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmOpportunity, type OpportunityStage, type SolutionType } from '../../shared/types/crm';
import {
  TrendingUp, BarChart3, AlertTriangle, CheckCircle2,
  Check, Clock, RefreshCw
} from 'lucide-react';

interface CrmDashboardProps {
  language: 'vi' | 'en';
  userProfile: any;
  onNavigate: (menuId: any) => void;
}

interface DashboardStats {
  totalPipelineValue: number;
  weightedForecast: number;
  wonValue: number;
  winRate: number;
  totalActiveDeals: number;
  byStage: Record<OpportunityStage, { count: number; value: number }>;
  bySolution: Record<SolutionType, { count: number; value: number }>;
  inactiveDeals: (CrmOpportunity & { daysInactive: number })[];
  upcomingTasksCount: number;
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
  lng: { vi: 'Khí thiên nhiên LNG', en: 'LNG Natural Gas' },
  lpg: { vi: 'Khí dầu mỏ hóa lỏng LPG', en: 'LPG Liquid Gas' },
  conversion: { vi: 'Chuyển đổi nhiên liệu', en: 'Fuel Conversion' },
  kitchen: { vi: 'Bếp công nghiệp B2B', en: 'B2B Industrial Kitchen' },
};

const SOLUTION_COLORS: Record<SolutionType, string> = {
  lng: '#0D9488',
  lpg: '#7C3AED',
  conversion: '#F59E0B',
  kitchen: '#DB2777',
};

export const CrmDashboard: React.FC<CrmDashboardProps> = ({ language, userProfile, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B ₫`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M ₫`;
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const fetchDashboardData = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      // 1. Fetch all active/non-deleted opportunities
      const { data: opportunities, error: oppsError } = await client
        .from('crm_opportunities')
        .select(`
          *,
          company:crm_companies(id, name),
          primary_contact:crm_contacts(id, name, phone)
        `)
        .is('deleted_at', null);

      if (oppsError) throw oppsError;

      // 2. Fetch all activities to calculate inactivity
      const { data: activities, error: actError } = await client
        .from('crm_activities')
        .select('entity_id, created_at')
        .eq('entity_type', 'opportunity')
        .order('created_at', { ascending: false });

      if (actError) throw actError;

      // 3. Fetch task counts (todo/doing/overdue) for logged-in user
      const { count: taskCount } = await client
        .from('crm_tasks')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .neq('status', 'done')
        .eq('assigned_to', userProfile?.id || null);

      // Processing Stats
      const oppList = opportunities || [];
      const actList = activities || [];

      let totalPipeline = 0;
      let weightedForecast = 0;
      let wonValue = 0;
      let totalActive = 0;
      let wonCount = 0;
      let lostCount = 0;

      const byStage: Record<OpportunityStage, { count: number; value: number }> = {
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

      const bySolution: Record<SolutionType, { count: number; value: number }> = {
        lng: { count: 0, value: 0 },
        lpg: { count: 0, value: 0 },
        conversion: { count: 0, value: 0 },
        kitchen: { count: 0, value: 0 },
      };

      // Group activities by opportunity_id
      const latestActivityMap: Record<string, string> = {};
      actList.forEach(act => {
        if (!latestActivityMap[act.entity_id]) {
          latestActivityMap[act.entity_id] = act.created_at;
        }
      });

      const inactiveDeals: (CrmOpportunity & { daysInactive: number })[] = [];
      const now = new Date();

      oppList.forEach(opp => {
        const stage = opp.stage as OpportunityStage;
        const sol = opp.solution_type as SolutionType;

        // Stats by stage
        if (byStage[stage]) {
          byStage[stage].count += 1;
          byStage[stage].value += opp.deal_value;
        }

        // Stats by solution
        if (bySolution[sol]) {
          bySolution[sol].count += 1;
          bySolution[sol].value += opp.deal_value;
        }

        if (opp.stage === 'won') {
          wonValue += opp.deal_value;
          wonCount += 1;
        } else if (opp.stage === 'lost') {
          lostCount += 1;
        } else {
          totalPipeline += opp.deal_value;
          weightedForecast += opp.deal_value * (opp.probability / 100);
          totalActive += 1;

          // Inactivity calculation (only for open deals)
          const lastInteraction = latestActivityMap[opp.id] || opp.updated_at || opp.created_at;
          const daysInactive = Math.floor(
            (now.getTime() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysInactive >= 14) {
            inactiveDeals.push({
              ...opp,
              daysInactive,
            });
          }
        }
      });

      // Calculate win rate
      const closedCount = wonCount + lostCount;
      const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

      // Sort inactive deals by days inactive desc
      inactiveDeals.sort((a, b) => b.daysInactive - a.daysInactive);

      setStats({
        totalPipelineValue: totalPipeline,
        weightedForecast,
        wonValue,
        winRate,
        totalActiveDeals: totalActive,
        byStage,
        bySolution,
        inactiveDeals: inactiveDeals.slice(0, 5), // Top 5 critical ones
        upcomingTasksCount: taskCount || 0,
      });

    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={24} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
        <span>{T('Đang tải dữ liệu tổng quan...', 'Loading dashboard stats...')}</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={styles.container}>
      {/* ── METRICS GRID ── */}
      <div style={styles.metricsGrid}>
        <div style={styles.card}>
          <div style={styles.cardIconBox}><TrendingUp size={20} color="#0D9488" /></div>
          <div style={styles.cardContent}>
            <span style={styles.cardLabel}>{T('Dự báo doanh số (Weighted)', 'Weighted Forecast')}</span>
            <h3 style={{ ...styles.cardValue, color: '#0D9488' }}>{formatCurrency(stats.weightedForecast)}</h3>
            <span style={styles.cardSubtext}>{T('Dựa trên khả năng chốt của từng deal', 'Weighted by deal probabilities')}</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBox}><CheckCircle2 size={20} color="#059669" /></div>
          <div style={styles.cardContent}>
            <span style={styles.cardLabel}>{T('Đã ký (Closed Won)', 'Revenue Secured')}</span>
            <h3 style={{ ...styles.cardValue, color: '#059669' }}>{formatCurrency(stats.wonValue)}</h3>
            <span style={styles.cardSubtext}>{T('Tổng giá trị hợp đồng đã chốt', 'Total value of won deals')}</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBox}><BarChart3 size={20} color="#3B82F6" /></div>
          <div style={styles.cardContent}>
            <span style={styles.cardLabel}>{T('Tổng Pipeline Đang Mở', 'Open Pipeline Size')}</span>
            <h3 style={{ ...styles.cardValue, color: '#3B82F6' }}>{formatCurrency(stats.totalPipelineValue)}</h3>
            <span style={styles.cardSubtext}>{T(`${stats.totalActiveDeals} cơ hội đang thương thảo`, `${stats.totalActiveDeals} active opportunities`)}</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIconBox}><Check size={20} color="#7C3AED" /></div>
          <div style={styles.cardContent}>
            <span style={styles.cardLabel}>{T('Tỷ lệ chốt thành công', 'Win Rate')}</span>
            <h3 style={{ ...styles.cardValue, color: '#7C3AED' }}>{stats.winRate}%</h3>
            <span style={styles.cardSubtext}>{T('Số deal thắng / Tổng số deal đóng', 'Closed Won / Total Closed deals')}</span>
          </div>
        </div>
      </div>

      <div style={styles.splitGrid}>
        {/* LEFT COLUMN: Pipeline Funnel & Breakdown */}
        <div style={styles.leftCol}>
          {/* Sales Funnel Chart */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h4 style={styles.sectionTitle}>📊 {T('Phễu Bán Hàng B2B', 'Sales Funnel')}</h4>
              <button style={styles.navLink} onClick={() => onNavigate('pipeline')}>
                {T('Xem pipeline →', 'View pipeline →')}
              </button>
            </div>
            <div style={styles.funnelContainer}>
              {Object.entries(stats.byStage)
                .filter(([stage]) => !['won', 'lost', 'dormant'].includes(stage))
                .map(([stage, data], index) => {
                  const percentage = stats.totalPipelineValue > 0
                    ? Math.max(15, Math.round((data.value / stats.totalPipelineValue) * 100))
                    : 15;
                  return (
                    <div key={stage} style={styles.funnelRow}>
                      <span style={styles.funnelLabel}>{STAGE_LABELS[stage as OpportunityStage][language]}</span>
                      <div style={styles.funnelBarWrapper}>
                        <div style={{
                          ...styles.funnelBar,
                          width: `${percentage}%`,
                          backgroundColor: `hsla(${200 + index * 15}, 80%, 45%, 0.85)`
                        }}>
                          <span style={styles.funnelBarValue}>{formatCurrency(data.value)}</span>
                        </div>
                      </div>
                      <span style={styles.funnelCount}>{data.count} deals</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Solution Breakdown */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h4 style={styles.sectionTitle}>💼 {T('Cơ cấu theo Giải pháp', 'Solution Breakdown')}</h4>
            </div>
            <div style={styles.solutionList}>
              {(Object.keys(stats.bySolution) as SolutionType[]).map(sol => {
                const data = stats.bySolution[sol];
                const pct = stats.totalPipelineValue + stats.wonValue > 0
                  ? Math.round((data.value / (stats.totalPipelineValue + stats.wonValue)) * 100)
                  : 0;

                return (
                  <div key={sol} style={styles.solutionItem}>
                    <div style={styles.solutionMeta}>
                      <span style={{ ...styles.dotIndicator, backgroundColor: SOLUTION_COLORS[sol] }} />
                      <span style={styles.solutionName}>{SOLUTION_LABELS[sol][language]}</span>
                      <span style={styles.solutionPct}>{pct}%</span>
                    </div>
                    <div style={styles.solutionBarBg}>
                      <div style={{ ...styles.solutionBarFill, width: `${pct}%`, backgroundColor: SOLUTION_COLORS[sol] }} />
                    </div>
                    <div style={styles.solutionFooter}>
                      <span style={styles.solutionCount}>{data.count} deals</span>
                      <span style={styles.solutionVal}>{formatCurrency(data.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Alerts & Tasks */}
        <div style={styles.rightCol}>
          {/* Critical Alerts (No activity > 14 days) */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h4 style={{ ...styles.sectionTitle, color: '#DC2626' }}>
                <AlertTriangle size={15} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                {T('Cảnh báo Đình trệ (>14 ngày)', 'Stagnant Deal Alerts')}
              </h4>
              <span style={styles.alertCountBadge}>{stats.inactiveDeals.length}</span>
            </div>
            <div style={styles.alertList}>
              {stats.inactiveDeals.length === 0 ? (
                <div style={styles.emptyBox}>
                  <CheckCircle2 size={24} color="#059669" />
                  <p style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.5rem' }}>
                    {T('Tuyệt vời! Không có deal nào bị đình trệ.', 'Excellent! No stagnant deals.')}
                  </p>
                </div>
              ) : (
                stats.inactiveDeals.map(opp => (
                  <div key={opp.id} style={styles.alertItem} onClick={() => onNavigate('pipeline')}>
                    <div style={styles.alertItemHeader}>
                      <span style={styles.alertTitle}>{opp.title}</span>
                      <span style={styles.alertBadge}>{opp.daysInactive} {T('ngày im ắng', 'days inactive')}</span>
                    </div>
                    <div style={styles.alertItemMeta}>
                      <span>🏢 {opp.company?.name || '—'}</span>
                      <span>💰 {formatCurrency(opp.deal_value)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tasks Panel */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h4 style={styles.sectionTitle}>⏰ {T('Việc cần làm của bạn', 'My Tasks')}</h4>
              <button style={styles.navLink} onClick={() => onNavigate('tasks')}>
                {T('Xem lịch hẹn →', 'View calendar →')}
              </button>
            </div>
            <div style={styles.todoBox}>
              <div style={styles.todoMeta}>
                <Clock size={16} color="#64748b" />
                <span style={styles.todoText}>
                  {stats.upcomingTasksCount > 0
                    ? T(`Bạn có ${stats.upcomingTasksCount} việc chưa hoàn thành.`, `You have ${stats.upcomingTasksCount} pending tasks.`)
                    : T('Bạn đã hoàn thành tất cả công việc!', 'All caught up! No pending tasks.')}
                </span>
              </div>
              <button style={styles.todoActionBtn} onClick={() => onNavigate('tasks')}>
                {T('Đi tới Quản lý việc', 'Go to Task Manager')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    display: 'flex',
    gap: '0.875rem',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardValue: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 800,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardSubtext: {
    fontSize: '0.65rem',
    color: '#64748b',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '1rem 1.25rem',
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
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  navLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#0D9488',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: 0,
  },
  funnelContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
  funnelRow: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 60px',
    alignItems: 'center',
    gap: '0.75rem',
  },
  funnelLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: 600,
  },
  funnelBarWrapper: {
    backgroundColor: '#f1f5f9',
    height: '24px',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0.5rem',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  funnelBarValue: {
    fontSize: '0.68rem',
    color: '#ffffff',
    fontWeight: 700,
  },
  funnelCount: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    textAlign: 'right',
  },
  solutionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  solutionItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  solutionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  dotIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  solutionName: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#334155',
    flex: 1,
  },
  solutionPct: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#64748b',
  },
  solutionBarBg: {
    height: '5px',
    backgroundColor: '#f1f5f9',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  solutionBarFill: {
    height: '100%',
    borderRadius: '2px',
  },
  solutionFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: '#94a3b8',
  },
  solutionCount: {},
  solutionVal: {
    fontWeight: 600,
    color: '#475569',
  },
  alertCountBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: '10px',
    padding: '0.05rem 0.4rem',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  emptyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    textAlign: 'center',
  },
  alertItem: {
    padding: '0.625rem',
    border: '1px solid #fee2e2',
    borderRadius: '6px',
    backgroundColor: '#fff5f5',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    transition: 'background-color 0.1s',
    '&:hover': {
      backgroundColor: '#fef2f2',
    }
  },
  alertItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  alertTitle: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#991b1b',
  },
  alertBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#dc2626',
    whiteSpace: 'nowrap',
  },
  alertItemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: '#7f1d1d',
    opacity: 0.8,
  },
  todoBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  todoMeta: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  todoText: {
    fontSize: '0.78rem',
    color: '#475569',
    lineHeight: '1.4',
  },
  todoActionBtn: {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#475569',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s',
    '&:hover': {
      backgroundColor: '#f1f5f9',
    }
  }
} as const;
