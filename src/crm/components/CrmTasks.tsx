import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmTask, type TaskType, type TaskStatus } from '../../shared/types/crm';
import {
  Plus, RefreshCw, X, Check, Clock, PhoneCall, Users,
  ClipboardList, FileText, Bell, MapPin, Calendar,
  AlertCircle, Trash2, Edit, ChevronDown
} from 'lucide-react';

interface CrmTasksProps {
  language: 'vi' | 'en';
  userProfile: any;
  onLogAction?: (msg: string) => void;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TASK_TYPES: { value: TaskType; label: { vi: string; en: string }; icon: React.ReactNode; color: string }[] = [
  { value: 'call',             label: { vi: '📞 Gọi điện',         en: '📞 Phone Call'      }, icon: <PhoneCall size={13} />, color: '#0D9488' },
  { value: 'meeting',          label: { vi: '🤝 Cuộc họp',         en: '🤝 Meeting'         }, icon: <Users size={13} />, color: '#7C3AED' },
  { value: 'survey',           label: { vi: '🏭 Khảo sát thực địa', en: '🏭 Site Survey'    }, icon: <MapPin size={13} />, color: '#0EA5E9' },
  { value: 'proposal',         label: { vi: '📄 Gửi báo giá',      en: '📄 Send Proposal'   }, icon: <FileText size={13} />, color: '#F97316' },
  { value: 'reminder',         label: { vi: '🔔 Nhắc nhở',         en: '🔔 Reminder'        }, icon: <Bell size={13} />, color: '#EAB308' },
  { value: 'document_request', label: { vi: '📋 Yêu cầu hồ sơ',   en: '📋 Document Request'}, icon: <ClipboardList size={13} />, color: '#6B7280' },
  { value: 'site_visit',       label: { vi: '🚗 Đi thực địa',      en: '🚗 Site Visit'      }, icon: <MapPin size={13} />, color: '#D97706' },
  { value: 'deadline',         label: { vi: '⏰ Deadline',          en: '⏰ Deadline'        }, icon: <Clock size={13} />, color: '#DC2626' },
];

const STATUS_COLUMNS: { id: TaskStatus; label: { vi: string; en: string }; color: string; bg: string; border: string }[] = [
  { id: 'todo',    label: { vi: '📋 Cần làm',    en: '📋 To Do'    }, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'doing',   label: { vi: '⚡ Đang làm',   en: '⚡ In Progress' }, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'done',    label: { vi: '✅ Hoàn thành', en: '✅ Done'    }, color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
  { id: 'overdue', label: { vi: '🔴 Quá hạn',   en: '🔴 Overdue' }, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
];

const getTaskIcon = (type: TaskType) => {
  return TASK_TYPES.find(t => t.value === type)?.icon || <ClipboardList size={13} />;
};
const getTaskColor = (type: TaskType) => {
  return TASK_TYPES.find(t => t.value === type)?.color || '#64748b';
};

// ─── Form Modal ───────────────────────────────────────────────────────────────
interface TaskFormProps {
  language: 'vi' | 'en';
  userProfile: any;
  taskToEdit: CrmTask | null;
  companies: any[];
  opportunities: any[];
  onSave: () => void;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ language, userProfile, taskToEdit, opportunities, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: taskToEdit?.title || '',
    task_type: (taskToEdit?.task_type || 'call') as TaskType,
    status: (taskToEdit?.status || 'todo') as TaskStatus,
    due_date: taskToEdit?.due_date ? taskToEdit.due_date.slice(0, 16) : '',
    opportunity_id: taskToEdit?.opportunity_id || '',
    notes: taskToEdit?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError(language === 'vi' ? 'Vui lòng nhập tên đầu việc' : 'Please enter a task title'); return; }
    if (!form.due_date) { setError(language === 'vi' ? 'Vui lòng chọn ngày hạn' : 'Please select a due date'); return; }
    const client = supabase;
    if (!client) return;
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        title: form.title.trim(),
        task_type: form.task_type,
        status: form.status,
        due_date: form.due_date,
        opportunity_id: form.opportunity_id || null,
        notes: form.notes.trim() || null,
        assigned_to: userProfile?.id || null,
      };
      if (taskToEdit) {
        const { error: err } = await client.from('crm_tasks').update(payload).eq('id', taskToEdit.id);
        if (err) throw err;
      } else {
        const { error: err } = await client.from('crm_tasks').insert(payload);
        if (err) throw err;
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  return (
    <div style={formStyles.overlay} onClick={onClose}>
      <div style={formStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={formStyles.header}>
          <span style={formStyles.headerTitle}>
            {taskToEdit ? T('Chỉnh sửa đầu việc', 'Edit Task') : T('Tạo đầu việc mới', 'New Task')}
          </span>
          <button style={formStyles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={formStyles.body}>
          {error && <div style={formStyles.errorBox}>{error}</div>}

          <div style={formStyles.field}>
            <label style={formStyles.label}>{T('Tên đầu việc', 'Task Title')} *</label>
            <input
              style={formStyles.input}
              placeholder={T('VD: Gọi điện xác nhận lịch khảo sát...', 'E.g: Call to confirm survey date...')}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>

          <div style={formStyles.row}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Loại đầu việc', 'Task Type')}</label>
              <select style={formStyles.select} value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value as TaskType }))}>
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label[language]}</option>)}
              </select>
            </div>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Trạng thái', 'Status')}</label>
              <select style={formStyles.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                {STATUS_COLUMNS.filter(s => s.id !== 'overdue').map(s => (
                  <option key={s.id} value={s.id}>{s.label[language]}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={formStyles.row}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Hạn chót', 'Due Date & Time')} *</label>
              <input
                type="datetime-local"
                style={formStyles.input}
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Liên kết cơ hội', 'Link to Opportunity')}</label>
              <select style={formStyles.select} value={form.opportunity_id} onChange={e => setForm(f => ({ ...f, opportunity_id: e.target.value }))}>
                <option value="">{T('— Không liên kết —', '— No link —')}</option>
                {opportunities.map((o: any) => (
                  <option key={o.id} value={o.id}>{o.opportunity_number} — {o.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>{T('Ghi chú', 'Notes')}</label>
            <textarea
              style={{ ...formStyles.input, resize: 'none', minHeight: '70px' }}
              placeholder={T('Nội dung cần chuẩn bị, kết quả mong muốn...', 'Preparation notes, expected outcome...')}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div style={formStyles.actions}>
            <button type="button" style={formStyles.cancelBtn} onClick={onClose}>{T('Huỷ', 'Cancel')}</button>
            <button type="submit" style={formStyles.saveBtn} disabled={saving}>
              {saving ? T('Đang lưu...', 'Saving...') : (taskToEdit ? T('Lưu thay đổi', 'Save Changes') : T('Tạo đầu việc', 'Create Task'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Task Card ────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: CrmTask;
  language: 'vi' | 'en';
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, language, onEdit, onDelete, onChangeStatus }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  const typeColor = getTaskColor(task.task_type);
  const isOverdue = task.status !== 'done' && new Date(task.due_date) < new Date();
  const dueDate = new Date(task.due_date);
  const dueSoon = !isOverdue && task.status !== 'done' && (dueDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000;

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  return (
    <div style={{
      ...cardStyles.card,
      borderLeft: `3px solid ${isOverdue ? '#DC2626' : typeColor}`,
      backgroundColor: isOverdue ? '#FFF5F5' : '#ffffff',
    }}>
      {/* Type badge + title */}
      <div style={cardStyles.top}>
        <span style={{ ...cardStyles.typeBadge, color: typeColor, borderColor: typeColor + '30', backgroundColor: typeColor + '10' }}>
          {getTaskIcon(task.task_type)}&nbsp;
          {TASK_TYPES.find(t => t.value === task.task_type)?.label[language] || task.task_type}
        </span>
      </div>
      <div style={cardStyles.title} onClick={onEdit}>{task.title}</div>

      {/* Linked opportunity */}
      {task.opportunity && (
        <div style={cardStyles.link}>
          🎯 {(task.opportunity as any).opportunity_number} — {(task.opportunity as any).title}
        </div>
      )}

      {/* Notes */}
      {task.notes && (
        <div style={cardStyles.notes}>{task.notes}</div>
      )}

      {/* Footer */}
      <div style={cardStyles.footer}>
        <div style={{
          ...cardStyles.dueTag,
          color: isOverdue ? '#DC2626' : (dueSoon ? '#D97706' : '#64748b'),
          backgroundColor: isOverdue ? '#FEE2E2' : (dueSoon ? '#FEF3C7' : '#f1f5f9'),
        }}>
          <Clock size={10} />
          {dueDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}
          {' '}
          {dueDate.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          {isOverdue && ` · ${T('Quá hạn', 'Overdue')}`}
          {dueSoon && ` · ${T('Sắp đến hạn', 'Due soon')}`}
        </div>

        <div style={cardStyles.actions}>
          {/* Status toggle */}
          <div style={{ position: 'relative' }}>
            <button
              style={cardStyles.actionBtn}
              onClick={() => setStatusOpen(!statusOpen)}
              title={T('Đổi trạng thái', 'Change status')}
            >
              <ChevronDown size={12} />
            </button>
            {statusOpen && (
              <div style={cardStyles.statusDropdown}>
                {STATUS_COLUMNS.filter(s => s.id !== 'overdue' && s.id !== task.status).map(s => (
                  <button key={s.id} style={cardStyles.statusOption} onClick={() => { setStatusOpen(false); onChangeStatus(s.id); }}>
                    <span style={{ color: s.color, fontSize: '0.72rem', fontWeight: 600 }}>{s.label[language]}</span>
                  </button>
                ))}
                {task.status !== 'done' && (
                  <button style={{ ...cardStyles.statusOption, borderTop: '1px solid #f1f5f9' }} onClick={() => { setStatusOpen(false); onChangeStatus('done'); }}>
                    <span style={{ color: '#059669', fontSize: '0.72rem', fontWeight: 600 }}>✅ {T('Đánh dấu hoàn thành', 'Mark Done')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <button style={cardStyles.actionBtn} onClick={onEdit} title={T('Chỉnh sửa', 'Edit')}><Edit size={12} /></button>
          <button style={{ ...cardStyles.actionBtn, color: '#DC2626' }} onClick={onDelete} title={T('Xoá', 'Delete')}><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CrmTasks: React.FC<CrmTasksProps> = ({ language, userProfile, onLogAction }) => {
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<CrmTask | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const T = useCallback((vi: string, en: string) => language === 'vi' ? vi : en, [language]);

  const fetchTasks = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client
        .from('crm_tasks')
        .select(`
          *,
          opportunity:crm_opportunities(id, opportunity_number, title, stage)
        `)
        .is('deleted_at', null)
        .order('due_date', { ascending: true });
      if (error) throw error;

      // Compute overdue status dynamically
      const now = new Date();
      const mapped = (data || []).map(t => ({
        ...t,
        status: (t.status !== 'done' && new Date(t.due_date) < now)
          ? 'overdue' as TaskStatus
          : t.status as TaskStatus,
      }));
      setTasks(mapped);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    const [opps, comps] = await Promise.all([
      client.from('crm_opportunities').select('id, opportunity_number, title').is('deleted_at', null).order('opportunity_number'),
      client.from('crm_companies').select('id, name').is('deleted_at', null).order('name'),
    ]);
    setOpportunities(opps.data || []);
    setCompanies(comps.data || []);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchLookups();
  }, [fetchTasks, fetchLookups]);

  const handleChangeStatus = async (taskId: string, newStatus: TaskStatus) => {
    const client = supabase;
    if (!client) return;
    // Overdue is computed client-side — store as 'todo' if moving back from overdue
    const dbStatus = newStatus === 'overdue' ? 'todo' : newStatus;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await client.from('crm_tasks').update({ status: dbStatus }).eq('id', taskId);
    if (onLogAction) onLogAction(`Task ${taskId} moved to ${newStatus}`);
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm(T('Xác nhận xoá đầu việc này?', 'Confirm delete this task?'))) return;
    const client = supabase;
    if (!client) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await client.from('crm_tasks').update({ deleted_at: new Date().toISOString(), deleted_by: userProfile?.id }).eq('id', taskId);
  };

  const filtered = tasks.filter(t => filterType === 'all' || t.task_type === filterType);

  // Stats
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const todayCount = tasks.filter(t => {
    const d = new Date(t.due_date);
    const now = new Date();
    return d.toDateString() === now.toDateString() && t.status !== 'done';
  }).length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div style={mainStyles.container}>
      {/* ── HEADER ── */}
      <div style={mainStyles.header}>
        <div style={mainStyles.headerLeft}>
          <h2 style={mainStyles.title}>{T('Đầu việc & Lịch hẹn', 'Tasks & Follow-ups')}</h2>
          <div style={mainStyles.statsRow}>
            {overdueCount > 0 && (
              <span style={mainStyles.statBadgeDanger}><AlertCircle size={12} /> {overdueCount} {T('quá hạn', 'overdue')}</span>
            )}
            <span style={mainStyles.statBadge}><Calendar size={12} /> {todayCount} {T('hôm nay', 'today')}</span>
            <span style={{ ...mainStyles.statBadge, borderColor: '#6EE7B7', color: '#059669', backgroundColor: '#ECFDF5' }}>
              <Check size={12} /> {doneCount} {T('đã xong', 'completed')}
            </span>
          </div>
        </div>
        <div style={mainStyles.headerRight}>
          <select style={mainStyles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">{T('Tất cả loại', 'All Types')}</option>
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label[language]}</option>)}
          </select>
          <button style={mainStyles.refreshBtn} onClick={fetchTasks}><RefreshCw size={14} /></button>
          <button style={mainStyles.addBtn} onClick={() => { setEditingTask(null); setShowForm(true); }}>
            <Plus size={15} /> {T('Tạo đầu việc', 'New Task')}
          </button>
        </div>
      </div>

      {/* ── KANBAN BOARD ── */}
      {loading ? (
        <div style={mainStyles.loading}>
          <RefreshCw size={22} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
          <span>{T('Đang tải đầu việc...', 'Loading tasks...')}</span>
        </div>
      ) : (
        <div style={mainStyles.board}>
          {STATUS_COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id);
            return (
              <div key={col.id} style={mainStyles.column}>
                <div style={{ ...mainStyles.colHeader, borderTopColor: col.color }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: col.color }}>{col.label[language]}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    backgroundColor: col.bg, color: col.color,
                    border: `1px solid ${col.border}`,
                    borderRadius: '10px', padding: '0.1rem 0.45rem'
                  }}>{colTasks.length}</span>
                </div>
                <div style={mainStyles.colBody}>
                  {colTasks.length === 0 ? (
                    <div style={mainStyles.emptyCol}>{T('Không có đầu việc', 'No tasks')}</div>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        language={language}
                        onEdit={() => { setEditingTask(task); setShowForm(true); }}
                        onDelete={() => handleDelete(task.id)}
                        onChangeStatus={(s) => handleChangeStatus(task.id, s)}
                      />
                    ))
                  )}

                  {/* Quick Add in To-Do column */}
                  {col.id === 'todo' && (
                    <button
                      style={mainStyles.quickAddBtn}
                      onClick={() => { setEditingTask(null); setShowForm(true); }}
                    >
                      <Plus size={12} /> {T('Thêm đầu việc', 'Add task')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FORM MODAL ── */}
      {showForm && (
        <TaskForm
          language={language}
          userProfile={userProfile}
          taskToEdit={editingTask}
          companies={companies}
          opportunities={opportunities}
          onSave={fetchTasks}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const mainStyles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0'
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  title: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' },
  statsRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  statBadge: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem',
    borderRadius: '20px', border: '1px solid #cbd5e1', color: '#475569', backgroundColor: '#f8fafc'
  },
  statBadgeDanger: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem',
    borderRadius: '20px', border: '1px solid #FECACA', color: '#DC2626', backgroundColor: '#FEF2F2'
  },
  filterSelect: {
    fontSize: '0.8rem', padding: '0.35rem 0.75rem',
    border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', outline: 'none', cursor: 'pointer'
  },
  refreshBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px',
    background: '#fff', cursor: 'pointer', color: '#64748b'
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.45rem 1rem', backgroundColor: '#0D9488', color: '#fff',
    border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer'
  },
  board: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.75rem', flex: 1, alignItems: 'flex-start'
  },
  column: {
    backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden'
  },
  colHeader: {
    padding: '0.625rem 0.75rem', borderTop: '3px solid transparent',
    backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  colBody: {
    padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
    minHeight: '100px', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)'
  },
  emptyCol: {
    padding: '1.5rem 0.5rem', textAlign: 'center',
    fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic'
  },
  quickAddBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
    width: '100%', padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '6px',
    background: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#94a3b8',
    marginTop: '0.25rem',
  },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.75rem', padding: '4rem 1rem', color: '#64748b', fontSize: '0.875rem'
  },
} as const;

const cardStyles = {
  card: {
    backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0',
    padding: '0.625rem 0.75rem', transition: 'box-shadow 0.1s ease',
  },
  top: { marginBottom: '0.3rem' },
  typeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
    fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem',
    borderRadius: '4px', border: '1px solid', letterSpacing: '0.02em',
  },
  title: {
    fontSize: '0.8rem', fontWeight: 600, color: '#1e293b',
    lineHeight: '1.4', marginBottom: '0.25rem', cursor: 'pointer',
  },
  link: { fontSize: '0.68rem', color: '#7C3AED', marginBottom: '0.25rem' },
  notes: { fontSize: '0.72rem', color: '#64748b', marginBottom: '0.35rem', lineHeight: '1.4' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' },
  dueTag: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.4rem',
    borderRadius: '4px',
  },
  actions: { display: 'flex', gap: '0.2rem', alignItems: 'center' },
  actionBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '22px', height: '22px', borderRadius: '4px',
    border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#64748b', padding: 0,
  },
  statusDropdown: {
    position: 'absolute', right: 0, bottom: '26px',
    backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 999, minWidth: '160px', overflow: 'hidden',
  },
  statusOption: {
    display: 'block', width: '100%', textAlign: 'left',
    background: 'none', border: 'none', padding: '0.4rem 0.75rem', cursor: 'pointer',
  },
} as const;

const formStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 1100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    width: '560px', maxWidth: '95vw', overflow: 'hidden',
  },
  header: {
    padding: '1rem 1.25rem', backgroundColor: '#0f172a', color: '#fff',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: '0.9rem', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' },
  body: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  errorBox: {
    backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: '6px', padding: '0.6rem 0.875rem',
    fontSize: '0.8rem', color: '#DC2626',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  row: { display: 'flex', gap: '0.75rem' },
  label: { fontSize: '0.75rem', fontWeight: 600, color: '#374151' },
  input: {
    padding: '0.45rem 0.75rem', fontSize: '0.85rem',
    border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
    fontFamily: 'inherit', color: '#1e293b',
  },
  select: {
    padding: '0.45rem 0.75rem', fontSize: '0.85rem',
    border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
    backgroundColor: '#ffffff', cursor: 'pointer', color: '#1e293b',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' },
  cancelBtn: {
    padding: '0.5rem 1.25rem', border: '1px solid #cbd5e1',
    borderRadius: '7px', background: '#fff', cursor: 'pointer',
    fontSize: '0.85rem', color: '#374151',
  },
  saveBtn: {
    padding: '0.5rem 1.5rem', backgroundColor: '#0D9488',
    border: 'none', borderRadius: '7px', color: '#fff',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
  },
} as const;
