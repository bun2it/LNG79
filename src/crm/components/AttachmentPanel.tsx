import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { Upload, Download, Trash2, File, FileText, Image, RefreshCw } from 'lucide-react';

interface AttachmentPanelProps {
  entityType: 'opportunity' | 'quote' | 'contract' | 'activity';
  entityId: string;
  language: 'vi' | 'en';
  userProfile: any;
  readOnly?: boolean;
}

const BUCKET = 'crm-documents';

  const getFileIcon = (fileName: string) => {
    const extPart = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extPart)) return <Image size={16} color="#0EA5E9" />;
    if (['pdf'].includes(extPart)) return <FileText size={16} color="#EF4444" />;
    if (['doc', 'docx'].includes(extPart)) return <FileText size={16} color="#3B82F6" />;
    if (['xls', 'xlsx'].includes(extPart)) return <FileText size={16} color="#059669" />;
    return <File size={16} color="#64748b" />;
  };

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface Attachment {
  id: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  created_at: string;
  uploaded_by?: string;
}

export const AttachmentPanel: React.FC<AttachmentPanelProps> = ({
  entityType, entityId, language, userProfile, readOnly = false
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const T = (vi: string, en: string) => language === 'vi' ? vi : en;

  const fetchAttachments = async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client
        .from('crm_attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAttachments(data || []);
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const uploadFile = async (file: File) => {
    const client = supabase;
    if (!client) return;
    setUploading(true);
    setUploadProgress(T(`Đang tải lên: ${file.name}`, `Uploading: ${file.name}`));
    try {
      const storagePath = `${entityType}/${entityId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      const { error: uploadError } = await client.storage
        .from(BUCKET)
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { error: dbError } = await client.from('crm_attachments').insert({
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        uploaded_by: userProfile?.id || null,
      });

      if (dbError) {
        // Rollback storage upload if DB fails
        await client.storage.from(BUCKET).remove([storagePath]);
        throw dbError;
      }

      await fetchAttachments();
      setUploadProgress(null);
    } catch (err: any) {
      alert(`${T('Lỗi tải lên:', 'Upload error:')} ${err.message}`);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    const client = supabase;
    if (!client) return;
    try {
      const { data, error } = await client.storage
        .from(BUCKET)
        .createSignedUrl(attachment.storage_path, 60); // 60 second signed URL
      if (error) throw error;
      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      alert(`${T('Không thể tải file:', 'Cannot download:')} ${err.message}`);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!window.confirm(T(`Xoá file "${attachment.file_name}"?`, `Delete "${attachment.file_name}"?`))) return;
    const client = supabase;
    if (!client) return;
    try {
      // Soft delete in DB
      const { error: dbErr } = await client.from('crm_attachments')
        .update({ deleted_at: new Date().toISOString(), deleted_by: userProfile?.id })
        .eq('id', attachment.id);
      if (dbErr) throw dbErr;

      // Remove from storage
      await client.storage.from(BUCKET).remove([attachment.storage_path]);

      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } catch (err: any) {
      alert(`${T('Lỗi xoá file:', 'Delete error:')} ${err.message}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!readOnly) handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>
          📎 {T('Tài liệu đính kèm', 'Attachments')}
          <span style={styles.count}>{attachments.length}</span>
        </span>
        {!readOnly && (
          <div style={styles.headerActions}>
            <button style={styles.refreshBtn} onClick={fetchAttachments}>
              <RefreshCw size={13} />
            </button>
            <button
              style={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={13} />
              {T('Tải lên', 'Upload')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFileSelect(e.target.files)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.txt,.zip"
            />
          </div>
        )}
      </div>

      {/* Drop Zone */}
      {!readOnly && (
        <div
          style={{
            ...styles.dropZone,
            borderColor: dragOver ? '#0D9488' : '#cbd5e1',
            backgroundColor: dragOver ? '#F0FDFA' : '#f8fafc',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div style={styles.uploadingState}>
              <RefreshCw size={16} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#0D9488', fontSize: '0.78rem', fontWeight: 600 }}>{uploadProgress}</span>
            </div>
          ) : (
            <>
              <Upload size={18} color="#94a3b8" />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {T('Kéo thả file hoặc click để chọn', 'Drag & drop or click to select')}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>
                PDF, Word, Excel, Images (max 50MB)
              </span>
            </>
          )}
        </div>
      )}

      {/* Attachment List */}
      {loading ? (
        <div style={styles.loadingBox}>
          <RefreshCw size={14} color="#0D9488" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{T('Đang tải...', 'Loading...')}</span>
        </div>
      ) : attachments.length === 0 ? (
        <div style={styles.emptyBox}>
          <File size={24} color="#e2e8f0" />
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {T('Chưa có tài liệu đính kèm', 'No attachments yet')}
          </span>
        </div>
      ) : (
        <div style={styles.list}>
          {attachments.map(att => (
            <div key={att.id} style={styles.item}>
              <div style={styles.itemIcon}>{getFileIcon(att.file_name)}</div>
              <div style={styles.itemBody}>
                <div style={styles.itemName}>{att.file_name}</div>
                <div style={styles.itemMeta}>
                  {formatBytes(att.file_size)}
                  {att.file_size ? ' · ' : ''}
                  {new Date(att.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </div>
              </div>
              <div style={styles.itemActions}>
                <button
                  style={styles.iconBtn}
                  onClick={() => handleDownload(att)}
                  title={T('Tải xuống', 'Download')}
                >
                  <Download size={13} color="#0D9488" />
                </button>
                {!readOnly && (
                  <button
                    style={styles.iconBtn}
                    onClick={() => handleDelete(att)}
                    title={T('Xoá', 'Delete')}
                  >
                    <Trash2 size={13} color="#DC2626" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', gap: '0.625rem',
    border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.625rem 0.875rem',
    borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: '0.8rem', fontWeight: 700, color: '#374151',
    display: 'flex', alignItems: 'center', gap: '0.35rem',
  },
  count: {
    fontSize: '0.65rem', fontWeight: 700,
    backgroundColor: '#e2e8f0', color: '#64748b',
    borderRadius: '10px', padding: '0.05rem 0.4rem',
  },
  headerActions: { display: 'flex', gap: '0.35rem', alignItems: 'center' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '26px', height: '26px', border: '1px solid #e2e8f0',
    borderRadius: '5px', background: '#fff', cursor: 'pointer', color: '#64748b',
  },
  uploadBtn: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    padding: '0.3rem 0.65rem', backgroundColor: '#0D9488',
    border: 'none', borderRadius: '5px', color: '#fff',
    fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
  },
  dropZone: {
    margin: '0 0.875rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '0.35rem', padding: '1rem',
    border: '1.5px dashed', borderRadius: '6px',
    cursor: 'pointer', transition: 'all 0.15s ease',
  },
  uploadingState: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  loadingBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', padding: '1rem',
  },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.5rem', padding: '1.5rem',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: '0',
    padding: '0 0 0.5rem 0',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: '0.625rem',
    padding: '0.5rem 0.875rem',
    borderTop: '1px solid #f8fafc',
    transition: 'background-color 0.1s ease',
  },
  itemIcon: { flexShrink: 0 },
  itemBody: { flex: 1, overflow: 'hidden' },
  itemName: {
    fontSize: '0.78rem', fontWeight: 600, color: '#1e293b',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  itemMeta: { fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem' },
  itemActions: { display: 'flex', gap: '0.2rem', flexShrink: 0 },
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '26px', height: '26px', borderRadius: '4px',
    border: '1px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer',
  },
} as const;
