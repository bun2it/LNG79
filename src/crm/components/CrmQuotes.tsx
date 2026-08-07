import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmQuote, type QuoteStatus } from '../../shared/types/crm';
import {
  Plus, RefreshCw, X, FileText, CheckCircle, XCircle,
  Clock, Send, Eye, Trash2, Edit, ChevronDown
} from 'lucide-react';
import { AttachmentPanel } from './AttachmentPanel';

interface CrmQuotesProps {
  language: 'vi' | 'en';
  userProfile: any;
  onLogAction?: (msg: string) => void;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<QuoteStatus, { label: { vi: string; en: string }; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  draft:    { label: { vi: 'Nháp',        en: 'Draft'    }, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0',  icon: <FileText size={13} /> },
  sent:     { label: { vi: 'Đã gửi',      en: 'Sent'     }, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE',  icon: <Send size={13} /> },
  accepted: { label: { vi: '✅ Chấp nhận', en: '✅ Accepted' }, color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: <CheckCircle size={13} /> },
  rejected: { label: { vi: '❌ Từ chối',  en: '❌ Rejected' }, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: <XCircle size={13} /> },
  expired:  { label: { vi: '⏰ Hết hạn',  en: '⏰ Expired'  }, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: <Clock size={13} /> },
};

// ─── Quote Form Modal ─────────────────────────────────────────────────────────
interface QuoteFormProps {
  language: 'vi' | 'en';
  userProfile: any;
  quoteToEdit: CrmQuote | null;
  opportunities: any[];
  onSave: () => void;
  onClose: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ language, quoteToEdit, opportunities, onSave, onClose }) => {
  const [form, setForm] = useState({
    opportunity_id: quoteToEdit?.opportunity_id || '',
    amount: quoteToEdit?.amount || 0,
    status: (quoteToEdit?.status || 'draft') as QuoteStatus,
    valid_until: quoteToEdit?.valid_until || '',
    pdf_url: quoteToEdit?.pdf_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.opportunity_id) { setError(T('Vui lòng chọn cơ hội', 'Please select an opportunity')); return; }
    if (!form.amount || form.amount <= 0) { setError(T('Vui lòng nhập số tiền hợp lệ', 'Please enter a valid amount')); return; }
    const client = supabase;
    if (!client) return;
    setSaving(true);
    setError('');
    try {
      if (quoteToEdit) {
        const { error: err } = await client.from('crm_quotes').update({
          opportunity_id: form.opportunity_id,
          amount: form.amount,
          status: form.status,
          valid_until: form.valid_until || null,
          pdf_url: form.pdf_url || null,
        }).eq('id', quoteToEdit.id);
        if (err) throw err;
      } else {
        // Generate quote number: QT-YYYY-XXXXX
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        const quoteNumber = `QT-${year}-${rand}`;
        const { error: err } = await client.from('crm_quotes').insert({
          opportunity_id: form.opportunity_id,
          quote_number: quoteNumber,
          version: 1,
          amount: form.amount,
          status: form.status,
          valid_until: form.valid_until || null,
          pdf_url: form.pdf_url || null,
        });
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

  const T_ = (vi: string, en: string) => language === 'vi' ? vi : en;

  return (
    <div style={formStyles.overlay} onClick={onClose}>
      <div style={formStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={formStyles.header}>
          <span style={formStyles.headerTitle}>
            {quoteToEdit ? T_('Chỉnh sửa báo giá', 'Edit Quote') : T_('Tạo báo giá mới', 'New Quotation')}
          </span>
          <button style={formStyles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={formStyles.body}>
          {error && <div style={formStyles.errorBox}>{error}</div>}

          <div style={formStyles.field}>
            <label style={formStyles.label}>{T_('Cơ hội kinh doanh', 'Opportunity')} *</label>
            <select style={formStyles.select} value={form.opportunity_id} onChange={e => setForm(f => ({ ...f, opportunity_id: e.target.value }))} autoFocus>
              <option value="">{T_('— Chọn cơ hội —', '— Select opportunity —')}</option>
              {opportunities.map((o: any) => (
                <option key={o.id} value={o.id}>{o.opportunity_number} — {o.title}</option>
              ))}
            </select>
          </div>

          <div style={formStyles.row}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T_('Giá trị (VND)', 'Amount (VND)')} *</label>
              <input
                type="number" min="0"
                style={formStyles.input}
                placeholder="0"
                value={form.amount || ''}
                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
              />
            </div>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T_('Trạng thái', 'Status')}</label>
              <select style={formStyles.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as QuoteStatus }))}>
                {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label[language]}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={formStyles.row}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T_('Hiệu lực đến', 'Valid Until')}</label>
              <input type="date" style={formStyles.input} value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
            </div>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T_('Link PDF (tuỳ chọn)', 'PDF URL (optional)')}</label>
              <input type="url" style={formStyles.input} placeholder="https://..." value={form.pdf_url} onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))} />
            </div>
          </div>

          <div style={formStyles.actions}>
            <button type="button" style={formStyles.cancelBtn} onClick={onClose}>{T_('Huỷ', 'Cancel')}</button>
            <button type="submit" style={formStyles.saveBtn} disabled={saving}>
              {saving ? T_('Đang lưu...', 'Saving...') : (quoteToEdit ? T_('Lưu thay đổi', 'Save') : T_('Tạo báo giá', 'Create Quote'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Quote Detail Modal ────────────────────────────────────────────────────────
interface QuoteDetailProps {
  quote: CrmQuote;
  language: 'vi' | 'en';
  userProfile: any;
  formatCurrency: (v: number) => string;
  onClose: () => void;
  onStatusChange: (status: QuoteStatus) => void;
}

const QuoteDetail: React.FC<QuoteDetailProps> = ({ quote, language, userProfile, formatCurrency, onClose, onStatusChange }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  const T = (vi: string, en: string) => language === 'vi' ? vi : en;
  const cfg = STATUS_CONFIG[quote.status];

  return (
    <div style={formStyles.overlay} onClick={onClose}>
      <div style={{ ...formStyles.modal, width: '680px' }} onClick={e => e.stopPropagation()}>
        <div style={formStyles.header}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>{quote.quote_number}</div>
            <span style={formStyles.headerTitle}>{T('Chi tiết báo giá', 'Quotation Details')}</span>
          </div>
          <button style={formStyles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={detailStyles.body}>
          {/* Left: Info */}
          <div style={detailStyles.infoCol}>
            <div style={detailStyles.row}>
              <span style={detailStyles.label}>{T('Cơ hội', 'Opportunity')}</span>
              <span style={detailStyles.val}>{(quote.opportunity as any)?.opportunity_number} — {(quote.opportunity as any)?.title}</span>
            </div>
            <div style={detailStyles.row}>
              <span style={detailStyles.label}>{T('Giá trị', 'Amount')}</span>
              <span style={{ ...detailStyles.val, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{formatCurrency(quote.amount)}</span>
            </div>
            <div style={detailStyles.row}>
              <span style={detailStyles.label}>{T('Phiên bản', 'Version')}</span>
              <span style={detailStyles.val}>v{quote.version}</span>
            </div>
            {quote.valid_until && (
              <div style={detailStyles.row}>
                <span style={detailStyles.label}>{T('Hiệu lực đến', 'Valid Until')}</span>
                <span style={{
                  ...detailStyles.val,
                  color: new Date(quote.valid_until) < new Date() ? '#DC2626' : 'inherit',
                  fontWeight: new Date(quote.valid_until) < new Date() ? 700 : 400,
                }}>
                  {new Date(quote.valid_until).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {new Date(quote.valid_until) < new Date() && ' ⚠️'}
                </span>
              </div>
            )}
            <div style={detailStyles.row}>
              <span style={detailStyles.label}>{T('Trạng thái', 'Status')}</span>
              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    ...detailStyles.statusBtn,
                    color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border
                  }}
                  onClick={() => setStatusOpen(!statusOpen)}
                >
                  {cfg.icon}&nbsp;{cfg.label[language]} <ChevronDown size={12} />
                </button>
                {statusOpen && (
                  <div style={detailStyles.statusDropdown}>
                    {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).filter(s => s !== quote.status).map(s => {
                      const c = STATUS_CONFIG[s];
                      return (
                        <button key={s} style={detailStyles.statusOption} onClick={() => { setStatusOpen(false); onStatusChange(s); }}>
                          <span style={{ color: c.color, fontWeight: 600 }}>{c.label[language]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {quote.pdf_url && (
              <div style={detailStyles.row}>
                <span style={detailStyles.label}>PDF</span>
                <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer" style={detailStyles.pdfLink}>
                  <Eye size={13} /> {T('Xem PDF', 'View PDF')}
                </a>
              </div>
            )}
          </div>
          {/* Right: Attachments */}
          <div style={detailStyles.attachCol}>
            <AttachmentPanel
              entityType="quote"
              entityId={quote.id}
              language={language}
              userProfile={userProfile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CrmQuotes: React.FC<CrmQuotesProps> = ({ language, userProfile }) => {
  const [quotes, setQuotes] = useState<CrmQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<CrmQuote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<CrmQuote | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B ₫`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M ₫`;
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const fetchQuotes = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client
        .from('crm_quotes')
        .select(`*, opportunity:crm_opportunities(id, opportunity_number, title, company:crm_companies(name))`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setQuotes(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    const { data } = await client
      .from('crm_opportunities')
      .select('id, opportunity_number, title')
      .is('deleted_at', null)
      .order('opportunity_number');
    setOpportunities(data || []);
  }, []);

  useEffect(() => { fetchQuotes(); fetchOpportunities(); }, [fetchQuotes, fetchOpportunities]);

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    const client = supabase;
    if (!client) return;
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
    await client.from('crm_quotes').update({ status: newStatus }).eq('id', quoteId);
    if (viewingQuote?.id === quoteId) setViewingQuote(v => v ? { ...v, status: newStatus } : v);
  };

  const handleDelete = async (quoteId: string) => {
    if (!window.confirm(T('Xác nhận xoá báo giá?', 'Confirm delete quote?'))) return;
    const client = supabase;
    if (!client) return;
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
    await client.from('crm_quotes')
      .update({ deleted_at: new Date().toISOString(), deleted_by: userProfile?.id })
      .eq('id', quoteId);
  };

  const filtered = quotes.filter(q => filterStatus === 'all' || q.status === filterStatus);

  // Stats
  const totalValue = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.amount, 0);
  const pendingCount = quotes.filter(q => ['draft', 'sent'].includes(q.status)).length;

  return (
    <div style={mainStyles.container}>
      <div style={mainStyles.header}>
        <div style={mainStyles.headerLeft}>
          <h2 style={mainStyles.title}>{T('Quản lý Báo Giá', 'Quotations')}</h2>
          <div style={mainStyles.statsRow}>
            <span style={mainStyles.statBadge}>
              {T('Tổng đã chốt:', 'Total accepted:')} <strong style={{ color: '#059669' }}>{formatCurrency(totalValue)}</strong>
            </span>
            <span style={mainStyles.statBadge}>
              {pendingCount} {T('đang chờ', 'pending')}
            </span>
          </div>
        </div>
        <div style={mainStyles.headerRight}>
          <select style={mainStyles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">{T('Tất cả trạng thái', 'All Status')}</option>
            {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label[language]}</option>
            ))}
          </select>
          <button style={mainStyles.refreshBtn} onClick={fetchQuotes}><RefreshCw size={14} /></button>
          <button style={mainStyles.addBtn} onClick={() => { setEditingQuote(null); setShowForm(true); }}>
            <Plus size={15} /> {T('Tạo báo giá', 'New Quote')}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={mainStyles.loading}><RefreshCw size={20} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} /><span>{T('Đang tải...', 'Loading...')}</span></div>
      ) : (
        <div style={mainStyles.tableWrapper}>
          <table style={mainStyles.table}>
            <thead>
              <tr style={mainStyles.thead}>
                <th style={mainStyles.th}>{T('Mã báo giá', 'Quote #')}</th>
                <th style={mainStyles.th}>{T('Cơ hội', 'Opportunity')}</th>
                <th style={mainStyles.th}>{T('Doanh nghiệp', 'Company')}</th>
                <th style={mainStyles.th}>{T('Giá trị', 'Amount')}</th>
                <th style={mainStyles.th}>{T('Hiệu lực', 'Valid Until')}</th>
                <th style={mainStyles.th}>{T('Trạng thái', 'Status')}</th>
                <th style={mainStyles.th}>{T('Tạo lúc', 'Created')}</th>
                <th style={mainStyles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={mainStyles.emptyRow}>{T('Chưa có báo giá nào', 'No quotations yet')}</td></tr>
              ) : (
                filtered.map(q => {
                  const cfg = STATUS_CONFIG[q.status];
                  const opp = q.opportunity as any;
                  const isExpired = q.valid_until && new Date(q.valid_until) < new Date() && q.status !== 'accepted';
                  return (
                    <tr key={q.id} style={mainStyles.tr} onClick={() => setViewingQuote(q)}>
                      <td style={mainStyles.td}>
                        <span style={mainStyles.codeChip}>{q.quote_number}</span>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '0.25rem' }}>v{q.version}</span>
                      </td>
                      <td style={mainStyles.td}>{opp?.opportunity_number}</td>
                      <td style={mainStyles.td}>{opp?.company?.name || '—'}</td>
                      <td style={{ ...mainStyles.td, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(q.amount)}</td>
                      <td style={{ ...mainStyles.td, color: isExpired ? '#DC2626' : 'inherit', fontWeight: isExpired ? 700 : 400 }}>
                        {q.valid_until ? new Date(q.valid_until).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        {isExpired && ' ⚠️'}
                      </td>
                      <td style={mainStyles.td}>
                        <span style={{ ...mainStyles.statusBadge, color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                          {cfg.label[language]}
                        </span>
                      </td>
                      <td style={mainStyles.td}>{new Date(q.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}</td>
                      <td style={{ ...mainStyles.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end' }}>
                          <button style={mainStyles.iconBtn} onClick={() => setViewingQuote(q)} title={T('Xem', 'View')}><Eye size={14} color="#0D9488" /></button>
                          <button style={mainStyles.iconBtn} onClick={() => { setEditingQuote(q); setShowForm(true); }} title={T('Sửa', 'Edit')}><Edit size={14} color="#64748b" /></button>
                          <button style={mainStyles.iconBtn} onClick={() => handleDelete(q.id)} title={T('Xoá', 'Delete')}><Trash2 size={14} color="#DC2626" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <QuoteForm
          language={language} userProfile={userProfile}
          quoteToEdit={editingQuote} opportunities={opportunities}
          onSave={fetchQuotes} onClose={() => { setShowForm(false); setEditingQuote(null); }}
        />
      )}
      {viewingQuote && (
        <QuoteDetail
          quote={viewingQuote} language={language} userProfile={userProfile}
          formatCurrency={formatCurrency}
          onClose={() => setViewingQuote(null)}
          onStatusChange={(s) => handleStatusChange(viewingQuote.id, s)}
        />
      )}
    </div>
  );
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
const mainStyles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  title: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' },
  statsRow: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  statBadge: { fontSize: '0.78rem', color: '#64748b' },
  filterSelect: { fontSize: '0.8rem', padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' },
  refreshBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#64748b' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem', backgroundColor: '#0D9488', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '4rem', color: '#64748b', fontSize: '0.875rem' },
  tableWrapper: { overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  thead: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '0.625rem 0.875rem', textAlign: 'left' as const, fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const },
  tr: { borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.1s' },
  td: { padding: '0.75rem 0.875rem', fontSize: '0.82rem', color: '#334155' },
  emptyRow: { padding: '3rem', textAlign: 'center' as const, color: '#94a3b8', fontSize: '0.85rem' },
  codeChip: { fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' },
  statusBadge: { fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px', border: '1px solid' },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer' },
} as const;

const formStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '560px', maxWidth: '95vw', overflow: 'hidden' },
  header: { padding: '1rem 1.25rem', backgroundColor: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: '0.9rem', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' },
  body: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  errorBox: { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '0.6rem 0.875rem', fontSize: '0.8rem', color: '#DC2626' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  row: { display: 'flex', gap: '0.75rem' },
  label: { fontSize: '0.75rem', fontWeight: 600, color: '#374151' },
  input: { padding: '0.45rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', color: '#1e293b' },
  select: { padding: '0.45rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', backgroundColor: '#ffffff', cursor: 'pointer', color: '#1e293b' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' },
  cancelBtn: { padding: '0.5rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '7px', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#374151' },
  saveBtn: { padding: '0.5rem 1.5rem', backgroundColor: '#0D9488', border: 'none', borderRadius: '7px', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
} as const;

const detailStyles = {
  body: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', padding: '1.25rem' },
  infoCol: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  attachCol: {},
  row: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  label: { fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  val: { fontSize: '0.85rem', color: '#1e293b' },
  statusBtn: { display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.75rem', border: '1px solid', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', background: 'none' },
  statusDropdown: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 999, minWidth: '160px', overflow: 'hidden', marginTop: '0.25rem' },
  statusOption: { display: 'block', width: '100%', textAlign: 'left' as const, background: 'none', border: 'none', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem' },
  pdfLink: { display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#0D9488', fontSize: '0.8rem', fontWeight: 700 },
} as const;
