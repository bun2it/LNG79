import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmActivity, type ActivityType } from '../../shared/types/crm';
import {
  Phone, Users, FileText, MessageSquare, Paperclip,
  TrendingUp, RefreshCw, Plus, Search, X, ChevronDown, ChevronUp
} from 'lucide-react';

interface CrmActivitiesProps {
  language: 'vi' | 'en';
  userProfile?: any;
  onLogAction?: (msg: string) => void;
}

// ── Config ──────────────────────────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: React.ComponentType<any>;
  label: { vi: string; en: string };
  color: string;
  bg: string;
}> = {
  phone:       { icon: Phone,        label: { vi: 'Cuộc gọi',       en: 'Phone Call'   }, color: '#3B82F6', bg: '#EFF6FF' },
  meeting:     { icon: Users,        label: { vi: 'Cuộc họp',       en: 'Meeting'      }, color: '#8B5CF6', bg: '#F5F3FF' },
  survey:      { icon: TrendingUp,   label: { vi: 'Khảo sát',       en: 'Site Survey'  }, color: '#0EA5E9', bg: '#F0F9FF' },
  proposal:    { icon: FileText,     label: { vi: 'Gửi báo giá',    en: 'Proposal Sent'}, color: '#F59E0B', bg: '#FFFBEB' },
  negotiation: { icon: MessageSquare,label: { vi: 'Đàm phán',       en: 'Negotiation'  }, color: '#EF4444', bg: '#FEF2F2' },
  email:       { icon: MessageSquare,label: { vi: 'Email',           en: 'Email'        }, color: '#10B981', bg: '#ECFDF5' },
  note:        { icon: FileText,     label: { vi: 'Ghi chú',        en: 'Note'         }, color: '#6B7280', bg: '#F9FAFB' },
  file:        { icon: Paperclip,    label: { vi: 'Đính kèm file',  en: 'File Attached'}, color: '#0D9488', bg: '#F0FDFA' },
  status_change:{ icon: TrendingUp,  label: { vi: 'Thay đổi trạng thái', en: 'Status Changed' }, color: '#F97316', bg: '#FFF7ED' },
};

const ENTITY_LABELS: Record<string, { vi: string; en: string }> = {
  lead:        { vi: 'Lead',        en: 'Lead'        },
  company:     { vi: 'Doanh nghiệp',en: 'Company'     },
  contact:     { vi: 'Liên hệ',    en: 'Contact'     },
  opportunity: { vi: 'Cơ hội',     en: 'Opportunity' },
  task:        { vi: 'Đầu việc',   en: 'Task'        },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr: string, language: 'vi' | 'en'): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (language === 'vi') {
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 30) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  } else {
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US');
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export const CrmActivities: React.FC<CrmActivitiesProps> = ({ language, userProfile, onLogAction }) => {
  const [activities, setActivities] = useState<(CrmActivity & {
    entity_name?: string;
    creator_name?: string;
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newType, setNewType] = useState<ActivityType>('note');
  const [newEntityType, setNewEntityType] = useState<CrmActivity['entity_type']>('opportunity');
  const [newEntitySearch, setNewEntitySearch] = useState('');
  const [newEntityId, setNewEntityId] = useState('');
  const [newEntityResults, setNewEntityResults] = useState<{ id: string; label: string }[]>([]);
  const [newContent, setNewContent] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client
        .from('crm_activities')
        .select(`
          *,
          creator:users!crm_activities_created_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Enrich with entity names in a second pass
      const enriched = await Promise.all((data || []).map(async (act: any) => {
        let entity_name = act.entity_id;
        try {
          if (act.entity_type === 'opportunity') {
            const { data: opp } = await client
              .from('crm_opportunities').select('title, opportunity_number').eq('id', act.entity_id).maybeSingle();
            if (opp) entity_name = `${opp.opportunity_number} – ${opp.title}`;
          } else if (act.entity_type === 'company') {
            const { data: co } = await client
              .from('crm_companies').select('name, company_number').eq('id', act.entity_id).maybeSingle();
            if (co) entity_name = `${co.company_number} – ${co.name}`;
          } else if (act.entity_type === 'contact') {
            const { data: con } = await client
              .from('crm_contacts').select('name').eq('id', act.entity_id).maybeSingle();
            if (con) entity_name = con.name;
          } else if (act.entity_type === 'lead') {
            entity_name = `Lead #${act.entity_id}`;
          } else if (act.entity_type === 'task') {
            const { data: tsk } = await client
              .from('crm_tasks').select('title').eq('id', act.entity_id).maybeSingle();
            if (tsk) entity_name = tsk.title;
          }
        } catch { /* ignore enrichment errors */ }
        return {
          ...act,
          entity_name,
          creator_name: act.creator?.name || act.creator?.email || (language === 'vi' ? 'Hệ thống' : 'System'),
        };
      }));

      setActivities(enriched);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // ── Entity search for create modal ───────────────────────────────────────

  useEffect(() => {
    const client = supabase;
    if (!client || !newEntitySearch.trim()) { setNewEntityResults([]); return; }
    const q = `%${newEntitySearch.trim()}%`;
    const timer = setTimeout(async () => {
      try {
        if (newEntityType === 'opportunity') {
          const { data } = await client.from('crm_opportunities').select('id, title, opportunity_number').ilike('title', q).limit(6);
          setNewEntityResults((data || []).map(d => ({ id: d.id, label: `${d.opportunity_number} – ${d.title}` })));
        } else if (newEntityType === 'company') {
          const { data } = await client.from('crm_companies').select('id, name, company_number').ilike('name', q).limit(6);
          setNewEntityResults((data || []).map(d => ({ id: d.id, label: `${d.company_number} – ${d.name}` })));
        } else if (newEntityType === 'contact') {
          const { data } = await client.from('crm_contacts').select('id, name').ilike('name', q).limit(6);
          setNewEntityResults((data || []).map(d => ({ id: d.id, label: d.name })));
        } else {
          setNewEntityResults([]);
        }
      } catch { setNewEntityResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [newEntitySearch, newEntityType]);

  // ── Create Activity ───────────────────────────────────────────────────────

  const handleCreate = async () => {
    const client = supabase;
    if (!client || !newContent.trim()) return;
    setCreateLoading(true);
    try {
      const payload: any = {
        entity_type: newEntityType,
        entity_id: newEntityId || `manual-${Date.now()}`,
        activity_type: newType,
        content: newContent.trim(),
        created_by: userProfile?.id || null,
      };
      const { error } = await client.from('crm_activities').insert(payload);
      if (error) throw error;
      setNewContent(''); setNewEntitySearch(''); setNewEntityId('');
      setNewType('note'); setNewEntityType('opportunity');
      setCreateOpen(false);
      fetchActivities();
      if (onLogAction) onLogAction(`Activity logged: ${newType}`);
    } catch (err: any) {
      alert(language === 'vi' ? `Lỗi: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = activities.filter(a => {
    if (filterType !== 'all' && a.activity_type !== filterType) return false;
    if (filterEntity !== 'all' && a.entity_type !== filterEntity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.content.toLowerCase().includes(q) && !(a.entity_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={s.container}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.pageTitle}>{language === 'vi' ? 'Nhật Ký Chăm Sóc' : 'Activity Log'}</h2>
          <p style={s.pageSubtitle}>
            {language === 'vi'
              ? `${filtered.length} hoạt động được ghi nhận`
              : `${filtered.length} activities recorded`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button onClick={fetchActivities} style={s.iconBtn} title={language === 'vi' ? 'Làm mới' : 'Refresh'}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setCreateOpen(true)} style={s.createBtn}>
            <Plus size={14} />
            {language === 'vi' ? 'Ghi hoạt động' : 'Log Activity'}
          </button>
        </div>
      </div>

      {/* ── Toolbar: Filters + Search ── */}
      <div style={s.toolbar}>
        {/* Activity type filter chips */}
        <div style={s.chipRow}>
          <button
            style={{ ...s.chip, ...(filterType === 'all' ? s.chipActive : {}) }}
            onClick={() => setFilterType('all')}
          >
            {language === 'vi' ? 'Tất cả' : 'All'}
          </button>
          {(Object.keys(ACTIVITY_CONFIG) as ActivityType[]).map(type => {
            const cfg = ACTIVITY_CONFIG[type];
            return (
              <button
                key={type}
                style={{
                  ...s.chip,
                  ...(filterType === type ? { backgroundColor: cfg.color, color: '#fff', borderColor: cfg.color } : {}),
                }}
                onClick={() => setFilterType(filterType === type ? 'all' : type)}
              >
                {language === 'vi' ? cfg.label.vi : cfg.label.en}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Entity type selector */}
          <select
            style={s.select}
            value={filterEntity}
            onChange={e => setFilterEntity(e.target.value)}
          >
            <option value="all">{language === 'vi' ? 'Tất cả đối tượng' : 'All entities'}</option>
            {Object.entries(ENTITY_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{language === 'vi' ? val.vi : val.en}</option>
            ))}
          </select>

          {/* Search */}
          <div style={s.searchWrap}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm nội dung...' : 'Search content...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={s.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={s.searchClear}><X size={12} /></button>
            )}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div style={s.timeline}>
        {loading ? (
          <div style={s.center}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
            <p style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '0.875rem' }}>
              {language === 'vi' ? 'Đang tải nhật ký...' : 'Loading activity log...'}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.center}>
            <FileText size={40} style={{ color: '#cbd5e1', marginBottom: '0.75rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {language === 'vi' ? 'Chưa có hoạt động nào được ghi nhận' : 'No activities recorded yet'}
            </p>
            <button onClick={() => setCreateOpen(true)} style={{ ...s.createBtn, marginTop: '1rem' }}>
              <Plus size={13} />
              {language === 'vi' ? 'Ghi hoạt động đầu tiên' : 'Log first activity'}
            </button>
          </div>
        ) : (
          <div style={s.feed}>
            {filtered.map((act, idx) => {
              const cfg = ACTIVITY_CONFIG[act.activity_type];
              const Icon = cfg.icon;
              const isExpanded = expanded.has(act.id);
              const isLong = act.content.length > 160;

              return (
                <div key={act.id} style={s.feedItem}>
                  {/* Vertical line connector */}
                  {idx < filtered.length - 1 && <div style={s.connector} />}

                  {/* Icon dot */}
                  <div style={{ ...s.iconDot, backgroundColor: cfg.bg, border: `2px solid ${cfg.color}` }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>

                  {/* Card */}
                  <div style={s.card}>
                    <div style={s.cardTop}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ ...s.typeBadge, backgroundColor: cfg.bg, color: cfg.color }}>
                          {language === 'vi' ? cfg.label.vi : cfg.label.en}
                        </span>
                        <span style={s.entityBadge}>
                          {language === 'vi' ? ENTITY_LABELS[act.entity_type].vi : ENTITY_LABELS[act.entity_type].en}
                          {act.entity_name && ` · ${act.entity_name}`}
                        </span>
                      </div>
                      <span style={s.timeLabel}>
                        {formatRelativeTime(act.created_at, language)}
                      </span>
                    </div>

                    <div style={s.cardContent}>
                      {isLong && !isExpanded
                        ? act.content.slice(0, 160) + '…'
                        : act.content}
                    </div>

                    <div style={s.cardFooter}>
                      <span style={s.creatorLabel}>
                        🧑 {act.creator_name}
                      </span>
                      {isLong && (
                        <button onClick={() => toggleExpand(act.id)} style={s.expandBtn}>
                          {isExpanded
                            ? <><ChevronUp size={12} /> {language === 'vi' ? 'Thu gọn' : 'Collapse'}</>
                            : <><ChevronDown size={12} /> {language === 'vi' ? 'Xem thêm' : 'Expand'}</>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Activity Modal ── */}
      {createOpen && (
        <div style={s.overlay}>
          <div style={s.modal} className="animate-fade-in">
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {language === 'vi' ? 'Ghi Nhật Ký Hoạt Động' : 'Log New Activity'}
              </h3>
              <button style={s.closeBtn} onClick={() => setCreateOpen(false)}>×</button>
            </div>

            <div style={s.modalBody}>
              {/* Activity type */}
              <div className="form-group">
                <label className="form-label">{language === 'vi' ? 'Loại hoạt động *' : 'Activity type *'}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(Object.keys(ACTIVITY_CONFIG) as ActivityType[])
                    .filter(t => t !== 'status_change')
                    .map(type => {
                      const cfg = ACTIVITY_CONFIG[type];
                      const active = newType === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setNewType(type)}
                          style={{
                            padding: '0.3rem 0.65rem', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '0.775rem', fontWeight: 600,
                            backgroundColor: active ? cfg.color : cfg.bg,
                            color: active ? '#fff' : cfg.color,
                            border: `1.5px solid ${cfg.color}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          {language === 'vi' ? cfg.label.vi : cfg.label.en}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Entity type + search */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Đối tượng' : 'Entity type'}</label>
                  <select
                    className="form-select"
                    value={newEntityType}
                    onChange={e => {
                      setNewEntityType(e.target.value as CrmActivity['entity_type']);
                      setNewEntitySearch(''); setNewEntityId(''); setNewEntityResults([]);
                    }}
                  >
                    {Object.entries(ENTITY_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{language === 'vi' ? val.vi : val.en}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">
                    {newEntityId
                      ? (language === 'vi' ? '✅ Đã chọn' : '✅ Selected')
                      : (language === 'vi' ? 'Tìm kiếm đối tượng (tùy chọn)' : 'Search entity (optional)')}
                  </label>
                  {newEntityId ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: '#0f172a', fontWeight: 500, flex: 1 }}>
                        {newEntityResults.find(r => r.id === newEntityId)?.label || newEntitySearch}
                      </span>
                      <button
                        onClick={() => { setNewEntityId(''); setNewEntitySearch(''); setNewEntityResults([]); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-input"
                        value={newEntitySearch}
                        onChange={e => setNewEntitySearch(e.target.value)}
                        placeholder={language === 'vi' ? 'Nhập tên để tìm...' : 'Type to search...'}
                        disabled={newEntityType === 'lead' || newEntityType === 'task'}
                      />
                      {newEntityResults.length > 0 && (
                        <div style={s.dropdown}>
                          {newEntityResults.map(r => (
                            <div
                              key={r.id}
                              style={s.dropdownItem}
                              onClick={() => { setNewEntityId(r.id); setNewEntitySearch(r.label); setNewEntityResults([]); }}
                            >
                              {r.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label">{language === 'vi' ? 'Nội dung ghi chú *' : 'Activity notes *'}</label>
                <textarea
                  className="form-input"
                  rows={4}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder={
                    newType === 'phone'
                      ? (language === 'vi' ? 'Đã gọi điện cho khách hàng. Khách quan tâm đến giải pháp LNG, hẹn gặp mặt vào thứ 6 tuần sau...' : 'Called customer. They are interested in LNG solution, scheduled meeting for next Friday...')
                      : newType === 'meeting'
                      ? (language === 'vi' ? 'Đã gặp mặt trực tiếp tại văn phòng. Thảo luận về nhu cầu lò hơi công suất 5T/h...' : 'In-person meeting at their office. Discussed boiler requirements 5T/h capacity...')
                      : (language === 'vi' ? 'Nhập nội dung hoạt động...' : 'Enter activity details...')
                  }
                />
              </div>
            </div>

            <div style={s.modalFooter}>
              <button className="btn btn-outline" disabled={createLoading} onClick={() => setCreateOpen(false)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                className="btn btn-teal"
                disabled={createLoading || !newContent.trim()}
                onClick={handleCreate}
              >
                {createLoading
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                  : (language === 'vi' ? 'Lưu hoạt động' : 'Save Activity')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    gap: '0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  toolbar: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.6rem',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.35rem',
  },
  chip: {
    padding: '0.25rem 0.65rem',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  chipActive: {
    backgroundColor: '#0f172a',
    color: '#fff',
    borderColor: '#0f172a',
  },
  select: {
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8rem',
    color: '#334155',
    background: '#fff',
    cursor: 'pointer',
  },
  searchWrap: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    paddingLeft: '26px',
    paddingRight: '26px',
    paddingTop: '0.35rem',
    paddingBottom: '0.35rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.8rem',
    width: '200px',
    outline: 'none',
  },
  searchClear: {
    position: 'absolute' as const,
    right: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
  },
  timeline: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1.25rem 1.5rem',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
  },
  feedItem: {
    display: 'flex',
    gap: '1rem',
    position: 'relative' as const,
    paddingBottom: '1.25rem',
  },
  connector: {
    position: 'absolute' as const,
    left: '19px',
    top: '40px',
    bottom: '0',
    width: '2px',
    backgroundColor: '#e2e8f0',
  },
  iconDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.875rem 1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  typeBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  entityBadge: {
    fontSize: '0.75rem',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '0.1rem 0.5rem',
    borderRadius: '4px',
  },
  timeLabel: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  cardContent: {
    fontSize: '0.85rem',
    color: '#334155',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap' as const,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.6rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed #f1f5f9',
  },
  creatorLabel: {
    fontSize: '0.72rem',
    color: '#94a3b8',
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.72rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
    padding: '0',
  },
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1rem',
    textAlign: 'center' as const,
  },
  iconBtn: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '0.45rem',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--color-teal)',
    border: 'none',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
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
    maxWidth: '560px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: '90vh',
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
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 100,
    maxHeight: '180px',
    overflowY: 'auto' as const,
  },
  dropdownItem: {
    padding: '0.6rem 0.875rem',
    fontSize: '0.825rem',
    color: '#334155',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.1s',
  },
};
