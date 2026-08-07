import React from 'react';
import { authFetch } from '../../features/auth/authFetch';
import { supabase } from '../../shared/supabase/supabase';

export interface MediaLibraryImage { name: string; url: string }

export const MediaPickerDialog: React.FC<{
  open: boolean;
  value?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
  language?: 'vi' | 'en';
}> = ({ open, value, onSelect, onClose, language = 'vi' }) => {
  const [library, setLibrary] = React.useState<MediaLibraryImage[]>([]);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  const loadLibrary = React.useCallback(async () => {
    setError('');
    const client = supabase;
    try {
      if (client) {
        const { data: assets, error: dbError } = await client
          .from('media_assets')
          .select('bucket_id, storage_path, mime_type')
          .order('created_at', { ascending: false });
        if (dbError) throw dbError;
        
        const libraryItems: MediaLibraryImage[] = (assets || [])
          .filter((asset) => asset.mime_type.startsWith('image/'))
          .map((asset) => {
            const { data: { publicUrl } } = client.storage
              .from(asset.bucket_id)
              .getPublicUrl(asset.storage_path);
            return {
              name: asset.storage_path.replace(/^\d+-/, ''),
              url: publicUrl,
            };
          });
        setLibrary(libraryItems);
      } else {
        const response = await authFetch('/api/uploads');
        if (!response.ok) throw new Error('Không thể đọc thư viện ảnh trên host.');
        const hosted: MediaLibraryImage[] = (await response.json()).filter((asset: MediaLibraryImage) => /\.(jpe?g|png|webp|gif|svg)$/i.test(asset.name));
        let cmsImages: MediaLibraryImage[] = [];
        try {
          cmsImages = JSON.parse(localStorage.getItem('cms_media') || '[]')
            .filter((asset: { fileType?: string }) => asset.fileType?.startsWith('image/'))
            .map((asset: { fileName: string; url: string }) => ({ name: asset.fileName, url: asset.url }));
        } catch { /* Ignore malformed legacy metadata. */ }
        setLibrary([...hosted, ...cmsImages].filter((image, index, items) => items.findIndex((item) => item.url === image.url) === index));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đọc thư viện ảnh.');
    }
  }, []);

  React.useEffect(() => { if (open) void loadLibrary(); }, [loadLibrary, open]);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    const client = supabase;
    try {
      if (client) {
        const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
        if (!allowedTypes.has(file.type)) {
          throw new Error(language === 'vi' ? 'Chỉ hỗ trợ JPG, PNG, WebP, GIF hoặc PDF.' : 'Only JPG, PNG, WebP, GIF, or PDF are supported.');
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(language === 'vi' ? 'Ảnh không được vượt quá 10 MB.' : 'Image size must not exceed 10 MB.');
        }

        const fileExt = file.name.split('.').pop() || '';
        const cleanBaseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60);
        const storagePath = `${Date.now()}-${cleanBaseName}.${fileExt}`;

        let dimensions: { width: number; height: number } | null = null;
        if (file.type.startsWith('image/')) {
          dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
          });
        }

        const { error: uploadError } = await client.storage
          .from('website-media')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = client.storage
          .from('website-media')
          .getPublicUrl(storagePath);

        const { data: userData } = await client.auth.getUser();
        const { error: dbError } = await client
          .from('media_assets')
          .insert({
            bucket_id: 'website-media',
            storage_path: storagePath,
            mime_type: file.type,
            file_size: file.size,
            width: dimensions?.width || null,
            height: dimensions?.height || null,
            title: file.name.replace(/\.[^.]+$/, ''),
            alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
            uploaded_by: userData?.user?.id || null
          });

        if (dbError) throw dbError;

        const newAsset: MediaLibraryImage = {
          name: storagePath.replace(/^\d+-/, ''),
          url: publicUrl
        };

        setLibrary((current) => [newAsset, ...current]);
        onSelect(newAsset.url);
        onClose();
      } else {
        const response = await authFetch('/api/uploads', { method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload ảnh thất bại.');
        setLibrary((current) => [result, ...current]);
        onSelect(result.url);
        onClose();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Upload ảnh thất bại.');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;
  const filtered = library.filter((image) => image.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="image-library-backdrop" data-visual-editor-ui onMouseDown={onClose}>
      <div className="image-library-modal" role="dialog" aria-modal="true" aria-label="Media Vault" onMouseDown={(event) => event.stopPropagation()}>
        <div className="image-library-header"><div><h3>{language === 'vi' ? 'Media Vault' : 'Media Vault'}</h3><p>{language === 'vi' ? 'Chọn ảnh có sẵn hoặc tải ảnh mới lên host.' : 'Choose an existing image or upload a new one.'}</p></div><button type="button" className="image-library-close" aria-label="Close" onClick={onClose}>×</button></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="media-picker-toolbar">
            <input className="form-input" placeholder={language === 'vi' ? 'Tìm theo tên ảnh…' : 'Search image name…'} value={query} onChange={(event) => setQuery(event.target.value)} />
            <label className="btn btn-primary image-library-upload">{uploading ? (language === 'vi' ? 'Đang tải…' : 'Uploading…') : (language === 'vi' ? 'Tải ảnh mới' : 'Upload image')}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} /></label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text"
              className="form-input" 
              placeholder={language === 'vi' ? 'Hoặc dán URL hình ảnh trực tiếp tại đây...' : 'Or paste image URL directly here...'} 
              id="direct-media-url-input"
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="btn btn-teal"
              onClick={() => {
                const url = (document.getElementById('direct-media-url-input') as HTMLInputElement)?.value?.trim();
                if (url) {
                  onSelect(url);
                  onClose();
                }
              }}
            >
              {language === 'vi' ? 'Xác nhận URL' : 'Confirm URL'}
            </button>
          </div>
        </div>

        {error && <p className="image-library-error">{error}</p>}
        
        <div className="image-library-grid">
          {filtered.map((image) => (
            <div key={image.url} style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
              <button 
                type="button" 
                className={`image-library-item ${value === image.url ? 'is-selected' : ''}`} 
                onClick={() => { onSelect(image.url); onClose(); }} 
                title={image.name}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <img src={image.url} alt="" />
                <span>{image.name}</span>
              </button>
              <button
                type="button"
                aria-label={language === 'vi' ? 'Xoá ảnh' : 'Delete image'}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xoá ảnh này vĩnh viễn?' : 'Are you sure you want to permanently delete this image?')) return;
                  
                  const client = supabase;
                  try {
                    if (client) {
                      const pathSegments = image.url.split('/');
                      const storagePath = decodeURIComponent(pathSegments[pathSegments.length - 1]);
                      
                      const { error: storageError } = await client.storage
                        .from('website-media')
                        .remove([storagePath]);
                      if (storageError) console.error('Storage delete issue:', storageError);

                      const { error: dbError } = await client
                        .from('media_assets')
                        .delete()
                        .eq('storage_path', storagePath);
                      if (dbError) throw dbError;
                    } else {
                      const cmsMedia = JSON.parse(localStorage.getItem('cms_media') || '[]');
                      const updated = cmsMedia.filter((x: any) => x.url !== image.url);
                      localStorage.setItem('cms_media', JSON.stringify(updated));
                    }
                    void loadLibrary();
                  } catch (err) {
                    alert(language === 'vi' ? 'Không thể xoá ảnh.' : 'Failed to delete image.');
                    console.error(err);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                ×
              </button>
            </div>
          ))}
          {!error && filtered.length === 0 && <p className="image-library-empty">{language === 'vi' ? 'Không tìm thấy ảnh.' : 'No images found.'}</p>}
        </div>
      </div>
    </div>
  );
};
