import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type CrmContract, type ContractStatus } from '../../shared/types/crm';
import {
  Plus, RefreshCw, X, FileCheck, CheckCircle, XCircle,
  Clock, Eye, Trash2, Edit, ChevronDown
} from 'lucide-react';
import { AttachmentPanel } from './AttachmentPanel';

interface CrmContractsProps {
  language: 'vi' | 'en';
  userProfile: any;
  onLogAction?: (msg: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ContractStatus, { label: { vi: string; en: string }; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  draft:      { label: { vi: 'Nháp',          en: 'Draft'       }, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0',  icon: <FileCheck size={13} /> },
  review:     { label: { vi: '🔍 Đang duyệt', en: '🔍 Under Review' }, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: <Clock size={13} /> },
  active:     { label: { vi: '✅ Đang hiệu lực', en: '✅ Active'  }, color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: <CheckCircle size={13} /> },
  terminated: { label: { vi: '❌ Đã chấm dứt', en: '❌ Terminated' }, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: <XCircle size={13} /> },
  completed:  { label: { vi: '🏁 Hoàn thành',  en: '🏁 Completed'  }, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: <CheckCircle size={13} /> },
};

// ─── Contract Form Modal ──────────────────────────────────────────────────────
interface ContractFormProps {
  language: 'vi' | 'en';
  userProfile: any;
  contractToEdit: CrmContract | null;
  opportunities: any[];
  onSave: () => void;
  onClose: () => void;
}

const ContractForm: React.FC<ContractFormProps> = ({ language, contractToEdit, opportunities, onSave, onClose }) => {
  const [form, setForm] = useState({
    opportunity_id: contractToEdit?.opportunity_id || '',
    value: contractToEdit?.value || 0,
    status: (contractToEdit?.status || 'draft') as ContractStatus,
    start_date: contractToEdit?.start_date || '',
    end_date: contractToEdit?.end_date || '',
    pdf_url: contractToEdit?.pdf_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.opportunity_id) { setError(T('Vui lòng chọn cơ hội', 'Please select an opportunity')); return; }
    if (!form.value || form.value <= 0) { setError(T('Vui lòng nhập giá trị hợp lệ', 'Please enter a valid contract value')); return; }
    const client = supabase;
    if (!client) return;
    setSaving(true);
    setError('');
    try {
      if (contractToEdit) {
        const { error: err } = await client.from('crm_contracts').update({
          opportunity_id: form.opportunity_id,
          value: form.value,
          status: form.status,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          pdf_url: form.pdf_url || null,
        }).eq('id', contractToEdit.id);
        if (err) throw err;
      } else {
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        const contractNumber = `CT-${year}-${rand}`;
        const { error: err } = await client.from('crm_contracts').insert({
          opportunity_id: form.opportunity_id,
          contract_number: contractNumber,
          value: form.value,
          status: form.status,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
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

  return (
    <div style={formStyles.overlay} onClick={onClose}>
      <div style={formStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={formStyles.header}>
          <span style={formStyles.headerTitle}>
            {contractToEdit ? T('Chỉnh sửa hợp đồng', 'Edit Contract') : T('Tạo hợp đồng mới', 'New Contract')}
          </span>
          <button style={formStyles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={formStyles.body}>
          {error && <div style={formStyles.errorBox}>{error}</div>}

          <div style={formStyles.field}>
            <label style={formStyles.label}>{T('Cơ hội kinh doanh', 'Opportunity')} *</label>
            <select style={formStyles.select} value={form.opportunity_id} onChange={e => setForm(f => ({ ...f, opportunity_id: e.target.value }))} autoFocus>
              <option value="">{T('— Chọn cơ hội —', '— Select opportunity —')}</option>
              {opportunities.map((o: any) => (
                <option key={o.id} value={o.id}>{o.opportunity_number} — {o.title}</option>
              ))}
            </select>
          </div>

          <div style={formStyles.row}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Giá trị HĐ (VND)', 'Contract Value (VND)')} *</label>
              <input type="number" min="0" style={formStyles.input} placeholder="0"
                value={form.value || ''} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
            </div>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Trạng thái', 'Status')}</label>
              <select style={formStyles.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContractStatus }))}>
                {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label[language]}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={formStyles.row}>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Ngày bắt đầu', 'Start Date')}</label>
              <input type="date" style={formStyles.input} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div style={{ ...formStyles.field, flex: 1 }}>
              <label style={formStyles.label}>{T('Ngày kết thúc', 'End Date')}</label>
              <input type="date" style={formStyles.input} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>{T('Link PDF hợp đồng (tuỳ chọn)', 'Contract PDF URL (optional)')}</label>
            <input type="url" style={formStyles.input} placeholder="https://..." value={form.pdf_url} onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))} />
          </div>

          <div style={formStyles.actions}>
            <button type="button" style={formStyles.cancelBtn} onClick={onClose}>{T('Huỷ', 'Cancel')}</button>
            <button type="submit" style={formStyles.saveBtn} disabled={saving}>
              {saving ? T('Đang lưu...', 'Saving...') : (contractToEdit ? T('Lưu thay đổi', 'Save') : T('Tạo hợp đồng', 'Create Contract'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Contract Detail Modal ────────────────────────────────────────────────────
interface ContractDetailProps {
  contract: CrmContract;
  language: 'vi' | 'en';
  userProfile: any;
  formatCurrency: (v: number) => string;
  onClose: () => void;
  onStatusChange: (status: ContractStatus) => void;
}

const ContractDetail: React.FC<ContractDetailProps> = ({ contract, language, userProfile, formatCurrency, onClose, onStatusChange }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  const T = (vi: string, en: string) => language === 'vi' ? vi : en;
  const cfg = STATUS_CONFIG[contract.status];

  const daysRemaining = contract.end_date
    ? Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={formStyles.overlay} onClick={onClose}>
      <div style={{ ...formStyles.modal, width: '720px' }} onClick={e => e.stopPropagation()}>
        <div style={formStyles.header}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>{contract.contract_number}</div>
            <span style={formStyles.headerTitle}>{T('Chi tiết hợp đồng', 'Contract Details')}</span>
          </div>
          <button style={formStyles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={detailStyles.body}>
          {/* Left: Info */}
          <div style={detailStyles.infoCol}>
            <div style={detailStyles.row}>
              <span style={detailStyles.label}>{T('Cơ hội', 'Opportunity')}</span>
              <span style={detailStyles.val}>{(contract.opportunity as any)?.opportunity_number} — {(contract.opportunity as any)?.title}</span>
            </div>
            <div style={detailStyles.row}>
              <span style={detailStyles.label}>{T('Giá trị hợp đồng', 'Contract Value')}</span>
              <span style={{ ...detailStyles.val, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{formatCurrency(contract.value)}</span>
            </div>
            <div style={detailStyles.row}>
              <span style={detailStyles.label}>{T('Trạng thái', 'Status')}</span>
              <div style={{ position: 'relative' }}>
                <button
                  style={{ ...detailStyles.statusBtn, color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                  onClick={() => setStatusOpen(!statusOpen)}
                >
                  {cfg.icon}&nbsp;{cfg.label[language]} <ChevronDown size={12} />
                </button>
                {statusOpen && (
                  <div style={detailStyles.statusDropdown}>
                    {(Object.keys(STATUS_CONFIG) as ContractStatus[]).filter(s => s !== contract.status).map(s => {
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
            {contract.start_date && (
              <div style={detailStyles.row}>
                <span style={detailStyles.label}>{T('Ngày bắt đầu', 'Start Date')}</span>
                <span style={detailStyles.val}>{new Date(contract.start_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            {contract.end_date && (
              <div style={detailStyles.row}>
                <span style={detailStyles.label}>{T('Ngày kết thúc', 'End Date')}</span>
                <div>
                  <span style={{ ...detailStyles.val, color: daysRemaining !== null && daysRemaining < 30 && contract.status === 'active' ? '#DC2626' : 'inherit' }}>
                    {new Date(contract.end_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  {daysRemaining !== null && contract.status === 'active' && (
                    <div style={{ fontSize: '0.72rem', color: daysRemaining < 0 ? '#DC2626' : (daysRemaining < 30 ? '#D97706' : '#059669'), marginTop: '0.15rem', fontWeight: 600 }}>
                      {daysRemaining < 0
                        ? `⚠️ ${T('Đã quá hạn', 'Expired')}`
                        : daysRemaining === 0
                          ? `⚠️ ${T('Hết hạn hôm nay', 'Expires today')}`
                          : `${T('Còn', 'Remaining:')} ${daysRemaining} ${T('ngày', 'days')}`}
                    </div>
                  )}
                </div>
              </div>
            )}
            {contract.pdf_url && (
              <div style={detailStyles.row}>
                <span style={detailStyles.label}>PDF</span>
                <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" style={detailStyles.pdfLink}>
                  <Eye size={13} /> {T('Xem hợp đồng', 'View Contract')}
                </a>
              </div>
            )}
          </div>
          {/* Right: Attachments */}
          <div style={detailStyles.attachCol}>
            <AttachmentPanel
              entityType="contract"
              entityId={contract.id}
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
export const CrmContracts: React.FC<CrmContractsProps> = ({ language, userProfile }) => {
  const [contracts, setContracts] = useState<CrmContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<CrmContract | null>(null);
  const [viewingContract, setViewingContract] = useState<CrmContract | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B ₫`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M ₫`;
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const fetchContracts = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client
        .from('crm_contracts')
        .select(`*, opportunity:crm_opportunities(id, opportunity_number, title, company:crm_companies(name))`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setContracts(data || []);
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

  useEffect(() => { fetchContracts(); fetchOpportunities(); }, [fetchContracts, fetchOpportunities]);

  const handleStatusChange = async (contractId: string, newStatus: ContractStatus) => {
    const client = supabase;
    if (!client) return;
    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: newStatus } : c));
    await client.from('crm_contracts').update({ status: newStatus }).eq('id', contractId);
    if (viewingContract?.id === contractId) setViewingContract(v => v ? { ...v, status: newStatus } : v);
  };

  const handleDelete = async (contractId: string) => {
    if (!window.confirm(T('Xác nhận xoá hợp đồng?', 'Confirm delete contract?'))) return;
    const client = supabase;
    if (!client) return;
    setContracts(prev => prev.filter(c => c.id !== contractId));
    await client.from('crm_contracts')
      .update({ deleted_at: new Date().toISOString(), deleted_by: userProfile?.id })
      .eq('id', contractId);
  };

  const filtered = contracts.filter(c => filterStatus === 'all' || c.status === filterStatus);

  const activeValue = contracts.filter(c => c.status === 'active').reduce((s, c) => s + c.value, 0);
  const expiringCount = contracts.filter(c => {
    if (c.status !== 'active' || !c.end_date) return false;
    return Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;
  }).length;

  return (
    <div style={mainStyles.container}>
      <div style={mainStyles.header}>
        <div style={mainStyles.headerLeft}>
          <h2 style={mainStyles.title}>{T('Quản lý Hợp Đồng', 'Contracts')}</h2>
          <div style={mainStyles.statsRow}>
            <span style={mainStyles.statBadge}>
              {T('Đang hiệu lực:', 'Active value:')} <strong style={{ color: '#059669' }}>{formatCurrency(activeValue)}</strong>
            </span>
            {expiringCount > 0 && (
              <span style={{ ...mainStyles.statBadge, color: '#D97706', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '20px', padding: '0.15rem 0.5rem' }}>
                ⚠️ {expiringCount} {T('hợp đồng sắp hết hạn (≤30 ngày)', 'expiring soon (≤30 days)')}
              </span>
            )}
          </div>
        </div>
        <div style={mainStyles.headerRight}>
          <select style={mainStyles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">{T('Tất cả trạng thái', 'All Status')}</option>
            {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label[language]}</option>
            ))}
          </select>
          <button style={mainStyles.refreshBtn} onClick={fetchContracts}><RefreshCw size={14} /></button>
          <button style={mainStyles.addBtn} onClick={() => { setEditingContract(null); setShowForm(true); }}>
            <Plus size={15} /> {T('Tạo hợp đồng', 'New Contract')}
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
                <th style={mainStyles.th}>{T('Số HĐ', 'Contract #')}</th>
                <th style={mainStyles.th}>{T('Cơ hội', 'Opportunity')}</th>
                <th style={mainStyles.th}>{T('Doanh nghiệp', 'Company')}</th>
                <th style={mainStyles.th}>{T('Giá trị', 'Value')}</th>
                <th style={mainStyles.th}>{T('Thời hạn', 'Duration')}</th>
                <th style={mainStyles.th}>{T('Trạng thái', 'Status')}</th>
                <th style={mainStyles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={mainStyles.emptyRow}>{T('Chưa có hợp đồng nào', 'No contracts yet')}</td></tr>
              ) : (
                filtered.map(c => {
                  const cfg = STATUS_CONFIG[c.status];
                  const opp = c.opportunity as any;
                  const daysLeft = c.end_date ? Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                  const isExpiring = c.status === 'active' && daysLeft !== null && daysLeft <= 30;
                  return (
                    <tr key={c.id} style={mainStyles.tr} onClick={() => setViewingContract(c)}>
                      <td style={mainStyles.td}>
                        <span style={mainStyles.codeChip}>{c.contract_number}</span>
                      </td>
                      <td style={mainStyles.td}>{opp?.opportunity_number}</td>
                      <td style={mainStyles.td}>{opp?.company?.name || '—'}</td>
                      <td style={{ ...mainStyles.td, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(c.value)}</td>
                      <td style={mainStyles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          {c.start_date && <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{new Date(c.start_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                          {c.end_date && (
                            <span style={{ fontSize: '0.72rem', color: isExpiring ? '#D97706' : '#64748b', fontWeight: isExpiring ? 700 : 400 }}>
                              → {new Date(c.end_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {isExpiring && ` (${daysLeft}d)`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={mainStyles.td}>
                        <span style={{ ...mainStyles.statusBadge, color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                          {cfg.label[language]}
                        </span>
                      </td>
                      <td style={{ ...mainStyles.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end' }}>
                          <button style={mainStyles.iconBtn} onClick={() => setViewingContract(c)} title={T('Xem', 'View')}><Eye size={14} color="#0D9488" /></button>
                          <button style={mainStyles.iconBtn} onClick={() => { setEditingContract(c); setShowForm(true); }} title={T('Sửa', 'Edit')}><Edit size={14} color="#64748b" /></button>
                          <button style={mainStyles.iconBtn} onClick={() => handleDelete(c.id)} title={T('Xoá', 'Delete')}><Trash2 size={14} color="#DC2626" /></button>
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
        <ContractForm
          language={language} userProfile={userProfile}
          contractToEdit={editingContract} opportunities={opportunities}
          onSave={fetchContracts} onClose={() => { setShowForm(false); setEditingContract(null); }}
        />
      )}
      {viewingContract && (
        <ContractDetail
          contract={viewingContract} language={language} userProfile={userProfile}
          formatCurrency={formatCurrency}
          onClose={() => setViewingContract(null)}
          onStatusChange={(s) => handleStatusChange(viewingContract.id, s)}
        />
      )}
    </div>
  );
};

// ─── Shared Styles ─────────────────────────────────────────────────────────────
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
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '580px', maxWidth: '95vw', overflow: 'hidden' },
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
  val: { fontSize: '0.85rem', color: '#1e293b', display: 'flex', alignItems: 'center' },
  statusBtn: { display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.75rem', border: '1px solid', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', background: 'none' },
  statusDropdown: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 999, minWidth: '160px', overflow: 'hidden', marginTop: '0.25rem' },
  statusOption: { display: 'block', width: '100%', textAlign: 'left' as const, background: 'none', border: 'none', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem' },
  pdfLink: { display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#0D9488', fontSize: '0.8rem', fontWeight: 700 },
} as const;
