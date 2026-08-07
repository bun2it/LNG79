import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmOpportunity, type CrmActivity, type OpportunityStage, type ActivityType } from '../../shared/types/crm';
import {
  X, Mail, Building2, User, Calendar,
  MessageSquare, PhoneCall, Users, ClipboardList, FileText,
  Send, TrendingUp, Tag, Edit, Check
} from 'lucide-react';
import { AttachmentPanel } from './AttachmentPanel';

interface OpportunityDrawerProps {
  opportunity: CrmOpportunity;
  language: 'vi' | 'en';
  userProfile: any;
  pipelineStages: { id: OpportunityStage; label: { vi: string; en: string }; color: string; bg: string; border: string }[];
  onClose: () => void;
  onUpdate: (updated: CrmOpportunity) => void;
  onMoveStage: (newStage: OpportunityStage) => void;
  formatCurrency: (val: number, cur: string) => string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  phone:        <PhoneCall size={14} color="#0D9488" />,
  meeting:      <Users size={14} color="#7C3AED" />,
  survey:       <ClipboardList size={14} color="#0EA5E9" />,
  proposal:     <FileText size={14} color="#F97316" />,
  negotiation:  <TrendingUp size={14} color="#EF4444" />,
  email:        <Mail size={14} color="#3B82F6" />,
  note:         <MessageSquare size={14} color="#64748b" />,
  file:         <FileText size={14} color="#6B7280" />,
  status_change:<Tag size={14} color="#8B5CF6" />,
};

const ACTIVITY_OPTIONS: { value: ActivityType; label: { vi: string; en: string } }[] = [
  { value: 'phone',        label: { vi: '📞 Ghi cuộc gọi',        en: '📞 Phone Call'       }},
  { value: 'meeting',      label: { vi: '🤝 Cuộc họp / Gặp mặt', en: '🤝 Meeting'          }},
  { value: 'survey',       label: { vi: '🏭 Khảo sát thực địa',   en: '🏭 Site Survey'     }},
  { value: 'proposal',     label: { vi: '📄 Gửi báo giá',         en: '📄 Proposal Sent'   }},
  { value: 'negotiation',  label: { vi: '⚖️ Đàm phán giá',        en: '⚖️ Negotiation'     }},
  { value: 'email',        label: { vi: '✉️ Email trao đổi',       en: '✉️ Email'            }},
  { value: 'note',         label: { vi: '📝 Ghi chú nội bộ',      en: '📝 Internal Note'   }},
];

export const OpportunityDrawer: React.FC<OpportunityDrawerProps> = ({
  opportunity, language, userProfile, pipelineStages,
  onClose, onUpdate, onMoveStage, formatCurrency
}) => {
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Add activity form
  const [activityType, setActivityType] = useState<ActivityType>('note');
  const [activityContent, setActivityContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stage move dropdown (handled via stageStrip click)
  // Inline edit
  const [editingProbability, setEditingProbability] = useState(false);
  const [probability, setProbability] = useState(opportunity.probability);
  const [editingValue, setEditingValue] = useState(false);
  const [dealValue, setDealValue] = useState(opportunity.deal_value);

  const timelineRef = useRef<HTMLDivElement>(null);

  const fetchActivities = async () => {
    const client = supabase;
    if (!client) return;
    setLoadingActivities(true);
    try {
      const { data, error } = await client
        .from('crm_activities')
        .select('*')
        .eq('entity_type', 'opportunity')
        .eq('entity_id', opportunity.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [opportunity.id]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityContent.trim()) return;
    const client = supabase;
    if (!client) return;
    setSubmitting(true);
    try {
      const { data, error } = await client
        .from('crm_activities')
        .insert({
          entity_type: 'opportunity',
          entity_id: opportunity.id,
          activity_type: activityType,
          content: activityContent.trim(),
          created_by: userProfile?.id || null,
        })
        .select('*')
        .single();
      if (error) throw error;
      setActivities(prev => [data, ...prev]);
      setActivityContent('');
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProbability = async () => {
    const client = supabase;
    if (!client) return;
    try {
      await client.from('crm_opportunities').update({ probability }).eq('id', opportunity.id);
      onUpdate({ ...opportunity, probability });
    } catch (err) {
      console.error(err);
    }
    setEditingProbability(false);
  };

  const handleSaveDealValue = async () => {
    const client = supabase;
    if (!client) return;
    try {
      await client.from('crm_opportunities').update({ deal_value: dealValue }).eq('id', opportunity.id);
      onUpdate({ ...opportunity, deal_value: dealValue });
    } catch (err) {
      console.error(err);
    }
    setEditingValue(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Drawer panel */}
      <div style={styles.drawer} className="animate-fade-in">
        {/* ── HEADER ── */}
        <div style={styles.drawerHeader}>
          <div style={styles.headerLeft}>
            <div style={styles.oppNumber}>{opportunity.opportunity_number}</div>
            <h3 style={styles.oppTitle}>{opportunity.title}</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {/* ── STAGE STRIP ── */}
        <div style={styles.stageStrip}>
          {pipelineStages.map(s => {
            const isActive = s.id === opportunity.stage;
            const isPast = pipelineStages.findIndex(x => x.id === s.id) < pipelineStages.findIndex(x => x.id === opportunity.stage);
            return (
              <button
                key={s.id}
                onClick={() => { if (!isActive) onMoveStage(s.id); }}
                style={{
                  ...styles.stageNode,
                  backgroundColor: isActive ? s.color : (isPast ? '#e2e8f0' : '#f8fafc'),
                  color: isActive ? '#fff' : (isPast ? '#64748b' : '#94a3b8'),
                  borderColor: isActive ? s.color : '#e2e8f0',
                  fontWeight: isActive ? 700 : 400,
                }}
                title={s.label[language]}
              >
                {s.label[language].replace(/✅|❌/g, '').trim()}
              </button>
            );
          })}
        </div>

        {/* ── BODY ── */}
        <div style={styles.drawerBody}>
          {/* LEFT COLUMN — Details */}
          <div style={styles.detailsCol}>
            {/* Key Metrics */}
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>{language === 'vi' ? 'Giá trị Deal' : 'Deal Value'}</div>
                {editingValue ? (
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      style={styles.inlineInput}
                      value={dealValue}
                      onChange={e => setDealValue(Number(e.target.value))}
                      autoFocus
                    />
                    <button style={styles.inlineSaveBtn} onClick={handleSaveDealValue}><Check size={12} /></button>
                  </div>
                ) : (
                  <div style={styles.metricValue} onClick={() => setEditingValue(true)}>
                    {formatCurrency(opportunity.deal_value, opportunity.currency)}
                    <Edit size={11} style={{ marginLeft: '0.25rem', opacity: 0.4 }} />
                  </div>
                )}
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>{language === 'vi' ? 'Khả năng chốt' : 'Win Probability'}</div>
                {editingProbability ? (
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number" min="0" max="100"
                      style={styles.inlineInput}
                      value={probability}
                      onChange={e => setProbability(Number(e.target.value))}
                      autoFocus
                    />
                    <button style={styles.inlineSaveBtn} onClick={handleSaveProbability}><Check size={12} /></button>
                  </div>
                ) : (
                  <div style={styles.metricValue} onClick={() => setEditingProbability(true)}>
                    <div style={styles.probBar}>
                      <div style={{ ...styles.probFill, width: `${probability}%`, backgroundColor: probability >= 70 ? '#059669' : probability >= 40 ? '#D97706' : '#DC2626' }} />
                    </div>
                    {probability}%
                    <Edit size={11} style={{ marginLeft: '0.25rem', opacity: 0.4 }} />
                  </div>
                )}
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>{language === 'vi' ? 'Dự báo doanh thu' : 'Weighted Forecast'}</div>
                <div style={{ ...styles.metricValue, color: '#0D9488' }}>
                  {formatCurrency(opportunity.deal_value * (probability / 100), opportunity.currency)}
                </div>
              </div>
            </div>

            {/* Meta info */}
            <div style={styles.metaSection}>
              {opportunity.company && (
                <div style={styles.metaRow}>
                  <Building2 size={14} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>{language === 'vi' ? 'Doanh nghiệp' : 'Company'}</div>
                    <div style={styles.metaVal}>{opportunity.company.name}</div>
                  </div>
                </div>
              )}
              {opportunity.primary_contact && (
                <div style={styles.metaRow}>
                  <User size={14} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>{language === 'vi' ? 'Người liên hệ' : 'Contact'}</div>
                    <div style={styles.metaVal}>
                      {opportunity.primary_contact.name}
                      {opportunity.primary_contact.position && (
                        <span style={{ color: '#94a3b8', marginLeft: '0.25rem' }}>({opportunity.primary_contact.position})</span>
                      )}
                    </div>
                    {opportunity.primary_contact.phone && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {opportunity.primary_contact.phone}</div>
                    )}
                  </div>
                </div>
              )}
              <div style={styles.metaRow}>
                <Tag size={14} color="#64748b" />
                <div>
                  <div style={styles.metaLabel}>{language === 'vi' ? 'Giải pháp' : 'Solution'}</div>
                  <div style={styles.metaVal}>{opportunity.solution_type.toUpperCase()}</div>
                </div>
              </div>
              {opportunity.expected_close_date && (
                <div style={styles.metaRow}>
                  <Calendar size={14} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>{language === 'vi' ? 'Lịch chốt dự kiến' : 'Expected Close'}</div>
                    <div style={{
                      ...styles.metaVal,
                      color: new Date(opportunity.expected_close_date) < new Date() && opportunity.stage !== 'won' ? '#DC2626' : 'inherit'
                    }}>
                      {new Date(opportunity.expected_close_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}
              {opportunity.assigned_profile && (
                <div style={styles.metaRow}>
                  <User size={14} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>{language === 'vi' ? 'Nhân sự phụ trách' : 'Owner'}</div>
                    <div style={styles.metaVal}>{opportunity.assigned_profile.display_name}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {opportunity.notes && (
              <div style={styles.notesBox}>
                <div style={styles.noteTitle}>📋 {language === 'vi' ? 'Ghi chú dự án' : 'Project Notes'}</div>
                <p style={styles.noteContent}>{opportunity.notes}</p>
              </div>
            )}

            {/* Lost reason */}
            {opportunity.stage === 'lost' && opportunity.lost_reason && (
              <div style={{ ...styles.notesBox, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
                <div style={{ ...styles.noteTitle, color: '#DC2626' }}>❌ {language === 'vi' ? 'Lý do thất bại' : 'Lost Reason'}</div>
                <p style={styles.noteContent}>{opportunity.lost_reason}</p>
              </div>
            )}

            {/* File Attachments */}
            <AttachmentPanel
              entityType="opportunity"
              entityId={opportunity.id}
              language={language}
              userProfile={userProfile}
            />
          </div>

          {/* RIGHT COLUMN — Activity Timeline */}
          <div style={styles.activityCol}>
            <div style={styles.activityHeader}>
              <span style={styles.activityTitle}>
                {language === 'vi' ? '📒 Nhật ký hoạt động' : '📒 Activity Timeline'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{activities.length} {language === 'vi' ? 'ghi chép' : 'entries'}</span>
            </div>

            {/* Add Activity Form */}
            <form onSubmit={handleAddActivity} style={styles.addActivityForm}>
              <select
                style={styles.activitySelect}
                value={activityType}
                onChange={e => setActivityType(e.target.value as ActivityType)}
              >
                {ACTIVITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label[language]}</option>
                ))}
              </select>
              <div style={styles.activityInputRow}>
                <textarea
                  style={styles.activityTextarea}
                  placeholder={language === 'vi' ? 'Ghi lại nội dung trao đổi, kết quả cuộc gọi, thỏa thuận...' : 'Log call results, meeting outcomes, agreements...'}
                  value={activityContent}
                  onChange={e => setActivityContent(e.target.value)}
                  rows={3}
                />
                <button
                  type="submit"
                  style={styles.sendBtn}
                  disabled={submitting || !activityContent.trim()}
                >
                  {submitting ? '...' : <Send size={14} />}
                </button>
              </div>
            </form>

            {/* Timeline */}
            <div style={styles.timeline} ref={timelineRef}>
              {loadingActivities ? (
                <div style={styles.loadingActivities}>
                  {language === 'vi' ? 'Đang tải nhật ký...' : 'Loading timeline...'}
                </div>
              ) : activities.length === 0 ? (
                <div style={styles.emptyTimeline}>
                  <MessageSquare size={28} color="#e2e8f0" />
                  <p>{language === 'vi' ? 'Chưa có hoạt động nào. Hãy ghi chép đầu tiên!' : 'No activities yet. Add the first log!'}</p>
                </div>
              ) : (
                activities.map((act, idx) => (
                  <div key={act.id} style={styles.timelineItem}>
                    <div style={styles.timelineIcon}>
                      {ACTIVITY_ICONS[act.activity_type] || <MessageSquare size={14} color="#64748b" />}
                      {idx < activities.length - 1 && <div style={styles.timelineLine} />}
                    </div>
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.activityTypeBadge}>
                          {ACTIVITY_OPTIONS.find(o => o.value === act.activity_type)?.label[language] || act.activity_type}
                        </span>
                        <span style={styles.timelineDate}>{formatDate(act.created_at)}</span>
                      </div>
                      <p style={styles.timelineText}>{act.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    zIndex: 1000,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '82vw',
    maxWidth: '1100px',
    height: '100vh',
    backgroundColor: '#ffffff',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
    overflowY: 'hidden',
  },
  drawerHeader: {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  oppNumber: {
    fontSize: '0.7rem',
    fontFamily: 'monospace',
    color: '#94a3b8',
    letterSpacing: '0.05em',
  },
  oppTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: '1.3',
    maxWidth: '700px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  stageStrip: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.625rem 1rem',
    overflowX: 'auto',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    flexShrink: 0,
  },
  stageNode: {
    fontSize: '0.65rem',
    fontWeight: 500,
    padding: '0.25rem 0.6rem',
    borderRadius: '20px',
    border: '1px solid',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  drawerBody: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: 0,
    flex: 1,
    overflow: 'hidden',
  },
  detailsCol: {
    borderRight: '1px solid #e2e8f0',
    overflowY: 'auto',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  metricsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  metricCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    padding: '0.625rem 0.875rem',
    border: '1px solid #e2e8f0',
  },
  metricLabel: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  metricValue: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  probBar: {
    height: '4px',
    backgroundColor: '#e2e8f0',
    borderRadius: '2px',
    width: '80px',
    marginRight: '0.5rem',
    overflow: 'hidden',
    flexShrink: 0,
  },
  probFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  inlineInput: {
    width: '90px',
    padding: '0.2rem 0.4rem',
    fontSize: '0.9rem',
    border: '1px solid #0D9488',
    borderRadius: '4px',
    outline: 'none',
  },
  inlineSaveBtn: {
    backgroundColor: '#0D9488',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    padding: '0.2rem 0.4rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  metaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  metaRow: {
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: '0.68rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
  },
  metaVal: {
    fontSize: '0.825rem',
    color: '#1e293b',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  notesBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #FDE68A',
    borderRadius: '6px',
    padding: '0.75rem',
  },
  noteTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#B45309',
    marginBottom: '0.35rem',
  },
  noteContent: {
    fontSize: '0.8rem',
    color: '#78350F',
    margin: 0,
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  activityCol: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  activityHeader: {
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  activityTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  addActivityForm: {
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flexShrink: 0,
    backgroundColor: '#f8fafc',
  },
  activitySelect: {
    fontSize: '0.8rem',
    padding: '0.35rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  activityInputRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-end',
  },
  activityTextarea: {
    flex: 1,
    fontSize: '0.8rem',
    padding: '0.5rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 700,
    minWidth: '40px',
    height: '36px',
    flexShrink: 0,
  },
  timeline: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  loadingActivities: {
    padding: '2rem',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.8rem',
  },
  emptyTimeline: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '3rem 1rem',
    color: '#94a3b8',
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  timelineItem: {
    display: 'flex',
    gap: '0.75rem',
    paddingBottom: '1rem',
  },
  timelineIcon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    width: '24px',
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: '0.35rem',
    minHeight: '20px',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #f1f5f9',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  activityTypeBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
  },
  timelineDate: {
    fontSize: '0.65rem',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  timelineText: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#334155',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
} as const;
