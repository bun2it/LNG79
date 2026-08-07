import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmTask, type TaskType } from '../../shared/types/crm';
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

interface CrmCalendarProps {
  language: 'vi' | 'en';
  userProfile: any;
  onNavigateToTasks?: () => void;
}

const TYPE_COLORS: Record<TaskType, string> = {
  call:             '#0D9488',
  meeting:          '#7C3AED',
  survey:           '#0EA5E9',
  proposal:         '#F97316',
  reminder:         '#EAB308',
  document_request: '#6B7280',
  site_visit:       '#D97706',
  deadline:         '#DC2626',
};

const TYPE_LABELS: Record<TaskType, { vi: string; en: string }> = {
  call:             { vi: 'Gọi điện',     en: 'Call'       },
  meeting:          { vi: 'Cuộc họp',     en: 'Meeting'    },
  survey:           { vi: 'Khảo sát',     en: 'Survey'     },
  proposal:         { vi: 'Báo giá',      en: 'Proposal'   },
  reminder:         { vi: 'Nhắc nhở',     en: 'Reminder'   },
  document_request: { vi: 'Hồ sơ',        en: 'Document'   },
  site_visit:       { vi: 'Thực địa',     en: 'Site Visit' },
  deadline:         { vi: 'Deadline',     en: 'Deadline'   },
};

const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const CrmCalendar: React.FC<CrmCalendarProps> = ({ language, onNavigateToTasks }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<CrmTask[]>([]);

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const fetchTasks = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      // Load tasks for 2 months around current view
      const start = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1).toISOString();
      const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 2, 0).toISOString();

      const { data, error } = await client
        .from('crm_tasks')
        .select(`*, opportunity:crm_opportunities(id, opportunity_number, title)`)
        .is('deleted_at', null)
        .neq('status', 'done')
        .gte('due_date', start)
        .lte('due_date', end)
        .order('due_date', { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error loading calendar tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [viewDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Build calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build 6-row grid
  const grid: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => {
      const d = new Date(t.due_date);
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    setSelectedDayTasks(getTasksForDate(date));
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
    // Will refresh via useEffect
  };

  const weekdays = language === 'vi' ? WEEKDAYS_VI : WEEKDAYS_EN;
  const monthLabel = language === 'vi' ? MONTHS_VI[month] : MONTHS_EN[month];

  // Summary alerts
  const overdueCount = tasks.filter(t => new Date(t.due_date) < today).length;
  const thisWeekEnd = new Date(today); thisWeekEnd.setDate(today.getDate() + 7);
  const thisWeekCount = tasks.filter(t => {
    const d = new Date(t.due_date);
    return d >= today && d <= thisWeekEnd;
  }).length;

  return (
    <div style={styles.container}>
      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>{T('Lịch hoạt động', 'Activity Calendar')}</h2>
          <div style={styles.alertRow}>
            {overdueCount > 0 && (
              <div style={styles.alertBadge}>
                <AlertCircle size={12} />
                {overdueCount} {T('đầu việc quá hạn', 'overdue tasks')}
                {onNavigateToTasks && (
                  <button style={styles.alertLink} onClick={onNavigateToTasks}>
                    {T('→ Xem ngay', '→ View')}
                  </button>
                )}
              </div>
            )}
            {thisWeekCount > 0 && (
              <div style={styles.weekBadge}>
                📅 {thisWeekCount} {T('việc trong tuần này', 'tasks this week')}
              </div>
            )}
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.todayBtn} onClick={goToday}>{T('Hôm nay', 'Today')}</button>
          <div style={styles.navGroup}>
            <button style={styles.navBtn} onClick={prevMonth}><ChevronLeft size={16} /></button>
            <span style={styles.monthLabel}>{monthLabel} {year}</span>
            <button style={styles.navBtn} onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>
          <button style={styles.refreshBtn} onClick={fetchTasks}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div style={styles.body}>
        {/* ── CALENDAR GRID ── */}
        <div style={styles.calendarSection}>
          {/* Weekday headers */}
          <div style={styles.weekdayRow}>
            {weekdays.map(d => (
              <div key={d} style={styles.weekdayCell}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          {loading ? (
            <div style={styles.loadingBox}>
              <RefreshCw size={20} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
              <span>{T('Đang tải lịch...', 'Loading calendar...')}</span>
            </div>
          ) : (
            <div style={styles.grid}>
              {grid.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} style={styles.emptyCell} />;

                const dayTasks = getTasksForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDay?.toDateString() === date.toDateString();
                const isPast = date < today && !isToday;
                const hasOverdue = dayTasks.some(t => new Date(t.due_date) < today);

                return (
                  <div
                    key={date.toISOString()}
                    style={{
                      ...styles.dayCell,
                      backgroundColor: isSelected ? '#F0FDFA' : (isToday ? '#EFF6FF' : '#ffffff'),
                      borderColor: isSelected ? '#0D9488' : (isToday ? '#3B82F6' : '#e2e8f0'),
                      opacity: isPast && dayTasks.length === 0 ? 0.45 : 1,
                      cursor: dayTasks.length > 0 ? 'pointer' : 'default',
                    }}
                    onClick={() => handleDayClick(date)}
                  >
                    <div style={{
                      ...styles.dayNumber,
                      color: isToday ? '#3B82F6' : (isPast ? '#94a3b8' : '#1e293b'),
                      fontWeight: isToday ? 800 : 500,
                      backgroundColor: isToday ? '#EFF6FF' : 'transparent',
                    }}>
                      {date.getDate()}
                      {isToday && <span style={styles.todayDot} />}
                    </div>

                    {/* Task chips — show max 3, then "+N" */}
                    <div style={styles.chipList}>
                      {dayTasks.slice(0, 3).map(t => (
                        <div
                          key={t.id}
                          style={{
                            ...styles.chip,
                            backgroundColor: TYPE_COLORS[t.task_type] + '18',
                            borderLeft: `2px solid ${TYPE_COLORS[t.task_type]}`,
                            color: TYPE_COLORS[t.task_type],
                          }}
                        >
                          {TYPE_LABELS[t.task_type][language]} · {t.title.length > 16 ? t.title.slice(0, 16) + '…' : t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div style={styles.moreChip}>+{dayTasks.length - 3} {T('nữa', 'more')}</div>
                      )}
                      {hasOverdue && dayTasks.length > 0 && (
                        <div style={styles.overdueIndicator}>⚠️</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SIDE PANEL: Selected day tasks ── */}
        <div style={styles.sidePanel}>
          {selectedDay ? (
            <>
              <div style={styles.sidePanelHeader}>
                <span style={styles.sidePanelDate}>
                  {selectedDay.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
                <span style={styles.sidePanelCount}>
                  {selectedDayTasks.length} {T('đầu việc', 'tasks')}
                </span>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div style={styles.sidePanelEmpty}>
                  <span>✅</span>
                  <p>{T('Không có lịch hẹn vào ngày này', 'No tasks scheduled for this day')}</p>
                </div>
              ) : (
                <div style={styles.taskList}>
                  {selectedDayTasks.map(task => {
                    const dueTime = new Date(task.due_date);
                    const isTaskOverdue = dueTime < today;
                    return (
                      <div
                        key={task.id}
                        style={{
                          ...styles.taskItem,
                          borderLeft: `3px solid ${TYPE_COLORS[task.task_type]}`,
                          backgroundColor: isTaskOverdue ? '#FFF5F5' : '#f8fafc',
                        }}
                      >
                        <div style={styles.taskItemHeader}>
                          <span style={{ ...styles.taskTypeBadge, color: TYPE_COLORS[task.task_type] }}>
                            {TYPE_LABELS[task.task_type][language]}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: isTaskOverdue ? '#DC2626' : '#64748b', fontWeight: isTaskOverdue ? 700 : 400 }}>
                            {dueTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            {isTaskOverdue && ' ⚠️'}
                          </span>
                        </div>
                        <div style={styles.taskItemTitle}>{task.title}</div>
                        {task.opportunity && (
                          <div style={styles.taskItemOpp}>
                            🎯 {(task.opportunity as any).opportunity_number} — {(task.opportunity as any).title}
                          </div>
                        )}
                        {task.notes && (
                          <div style={styles.taskItemNotes}>{task.notes}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={styles.sidePanelEmpty}>
              <span style={{ fontSize: '2rem' }}>📅</span>
              <p style={{ textAlign: 'center' }}>
                {T('Chọn một ngày để xem lịch hẹn', 'Click a day to view its tasks')}
              </p>
            </div>
          )}

          {/* Upcoming tasks summary */}
          <div style={styles.upcomingSection}>
            <div style={styles.upcomingTitle}>{T('📋 Việc sắp đến', '📋 Coming Up')}</div>
            {tasks.slice(0, 6).map(task => {
              const d = new Date(task.due_date);
              const isOver = d < today;
              return (
                <div key={task.id} style={styles.upcomingItem} onClick={() => handleDayClick(d)}>
                  <span style={{
                    ...styles.upcomingDot,
                    backgroundColor: isOver ? '#DC2626' : TYPE_COLORS[task.task_type]
                  }} />
                  <div style={styles.upcomingBody}>
                    <div style={styles.upcomingName}>{task.title}</div>
                    <div style={{ ...styles.upcomingDate, color: isOver ? '#DC2626' : '#64748b' }}>
                      {d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })} · {TYPE_LABELS[task.task_type][language]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0'
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  title: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' },
  alertRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  alertBadge: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem',
    backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '20px'
  },
  alertLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#DC2626', fontWeight: 700, fontSize: '0.72rem', textDecoration: 'underline',
  },
  weekBadge: {
    fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem',
    backgroundColor: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: '20px'
  },
  navGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  navBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', border: '1px solid #e2e8f0',
    borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#475569',
  },
  monthLabel: { fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', minWidth: '140px', textAlign: 'center' },
  todayBtn: {
    padding: '0.35rem 0.875rem', border: '1px solid #0D9488',
    borderRadius: '6px', color: '#0D9488', background: '#F0FDFA',
    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
  },
  refreshBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px',
    background: '#fff', cursor: 'pointer', color: '#64748b',
  },

  body: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', flex: 1, overflow: 'hidden' },

  calendarSection: { display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden' },
  weekdayRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '0.35rem' },
  weekdayCell: {
    textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
    color: '#94a3b8', padding: '0.3rem 0', textTransform: 'uppercase', letterSpacing: '0.05em'
  },
  loadingBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.75rem', padding: '4rem', color: '#64748b', fontSize: '0.875rem',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', overflowY: 'auto' },
  emptyCell: { minHeight: '90px', backgroundColor: 'transparent' },
  dayCell: {
    minHeight: '90px', borderRadius: '6px', border: '1px solid',
    padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem',
    transition: 'border-color 0.1s ease, background-color 0.1s ease',
  },
  dayNumber: {
    fontSize: '0.78rem', fontWeight: 500, width: '22px', height: '22px',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', flexShrink: 0,
  },
  todayDot: {
    position: 'absolute', bottom: '-2px', left: '50%',
    transform: 'translateX(-50%)', width: '4px', height: '4px',
    backgroundColor: '#3B82F6', borderRadius: '50%',
  },
  chipList: { display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, overflow: 'hidden' },
  chip: {
    fontSize: '0.58rem', fontWeight: 600, padding: '0.1rem 0.3rem',
    borderRadius: '2px', lineHeight: '1.4', overflow: 'hidden',
    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  },
  moreChip: {
    fontSize: '0.58rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '0.3rem',
  },
  overdueIndicator: { fontSize: '0.6rem', marginTop: 'auto' },

  // Side panel
  sidePanel: {
    borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0',
  },
  sidePanelHeader: {
    padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff',
    display: 'flex', flexDirection: 'column', gap: '0.15rem',
  },
  sidePanelDate: { fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' },
  sidePanelCount: { fontSize: '0.68rem', color: '#94a3b8' },
  sidePanelEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.78rem', flex: 1,
  },
  taskList: { overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  taskItem: { padding: '0.625rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' },
  taskItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' },
  taskTypeBadge: { fontSize: '0.65rem', fontWeight: 700 },
  taskItemTitle: { fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.15rem' },
  taskItemOpp: { fontSize: '0.68rem', color: '#7C3AED', marginBottom: '0.15rem' },
  taskItemNotes: { fontSize: '0.7rem', color: '#64748b', lineHeight: '1.4' },

  // Upcoming
  upcomingSection: {
    borderTop: '1px solid #e2e8f0', padding: '0.75rem',
    display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: '#ffffff',
  },
  upcomingTitle: { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' },
  upcomingItem: {
    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
    padding: '0.3rem 0', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
  },
  upcomingDot: { width: '8px', height: '8px', borderRadius: '50%', marginTop: '4px', flexShrink: 0 },
  upcomingBody: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  upcomingName: { fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' },
  upcomingDate: { fontSize: '0.65rem' },
} as const;
