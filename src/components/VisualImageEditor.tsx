import React, { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'cms_visual_image_overrides_v1';

interface LibraryImage { name: string; url: string }
interface VisualImageEditorProps {
  rootRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  currentView: string;
  language: string;
}

const pathFor = (element: Element, boundary: Element) => {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== boundary) {
    const parent: Element | null = current.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children).filter((child) => child.tagName === current?.tagName);
    parts.unshift(`${current.tagName.toLowerCase()}:${siblings.indexOf(current)}`);
    current = parent;
  }
  return parts.join('/');
};

const readOverrides = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

export const VisualImageEditor: React.FC<VisualImageEditorProps> = ({ rootRef, isEditing, currentView, language }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const identityFor = useCallback((element: Element) => {
    const nav = element.closest('nav');
    const footer = element.closest('footer');
    const main = element.closest('main');
    const boundary = nav || footer || main || rootRef.current;
    if (!boundary) return '';
    const scope = nav ? 'global-nav' : footer ? 'global-footer' : `page-${currentView}`;
    return `${language}/${scope}/${pathFor(element, boundary)}`;
  }, [currentView, language, rootRef]);

  const findImages = useCallback(() => {
    const root = rootRef.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>('img, main *, footer *')).filter((element) => {
      if (element.closest('[data-visual-editor-ui]')) return false;
      if (element.tagName === 'IMG') return true;
      return getComputedStyle(element).backgroundImage.includes('url(');
    });
  }, [rootRef]);

  const setImage = useCallback((element: HTMLElement, url: string) => {
    if (element instanceof HTMLImageElement) element.src = url;
    else element.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
    const key = identityFor(element);
    if (key) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readOverrides(), [key]: url }));
    setTarget(null);
  }, [identityFor]);

  const loadLibrary = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/uploads');
      if (!response.ok) throw new Error('Không thể đọc thư viện ảnh trên host.')
      const hosted: LibraryImage[] = await response.json();
      let cmsImages: LibraryImage[] = [];
      try {
        cmsImages = JSON.parse(localStorage.getItem('cms_media') || '[]')
          .filter((asset: { fileType?: string }) => asset.fileType?.startsWith('image/'))
          .map((asset: { fileName: string; url: string }) => ({ name: asset.fileName, url: asset.url }));
      } catch { /* Ignore malformed legacy CMS media. */ }
      const merged = [...hosted, ...cmsImages].filter((image, index, items) => items.findIndex((item) => item.url === image.url) === index);
      setLibrary(merged);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đọc thư viện ảnh.')
    }
  }, []);

  useEffect(() => {
    const overrides = readOverrides();
    findImages().forEach((element) => {
      const url = overrides[identityFor(element)];
      if (!url) return;
      if (element instanceof HTMLImageElement) element.src = url;
      else element.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
    });
  }, [findImages, identityFor]);

  useEffect(() => {
    if (!isEditing) return;
    const buttons: HTMLButtonElement[] = [];
    const refreshPositions = () => {
      const elements = findImages();
      buttons.forEach((button) => button.remove());
      buttons.length = 0;
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.visualEditorUi = 'true';
        button.className = 'visual-image-edit-button';
        button.setAttribute('aria-label', 'Thay đổi hình ảnh');
        button.title = 'Thay đổi hình ảnh';
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/><path d="M4 4h16v16H4z"/></svg>';
        button.style.left = `${window.scrollX + rect.right - 42}px`;
        button.style.top = `${window.scrollY + rect.top + 8}px`;
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          setTarget(element);
          void loadLibrary();
        });
        document.body.appendChild(button);
        buttons.push(button);
      });
    };
    refreshPositions();
    window.addEventListener('resize', refreshPositions);
    window.addEventListener('scroll', refreshPositions, true);
    return () => {
      window.removeEventListener('resize', refreshPositions);
      window.removeEventListener('scroll', refreshPositions, true);
      buttons.forEach((button) => button.remove());
    };
  }, [findImages, isEditing, loadLibrary]);

  const upload = async (file?: File) => {
    if (!file || !target) return;
    setUploading(true);
    setError('');
    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload ảnh thất bại.');
      setLibrary((current) => [result, ...current]);
      setImage(target, result.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Upload ảnh thất bại.')
    } finally {
      setUploading(false);
    }
  };

  if (!target) return null;
  return (
    <div className="image-library-backdrop" data-visual-editor-ui onMouseDown={() => setTarget(null)}>
      <div className="image-library-modal" role="dialog" aria-modal="true" aria-label="Thư viện hình ảnh" onMouseDown={(event) => event.stopPropagation()}>
        <div className="image-library-header">
          <div><h3>Thư viện hình ảnh</h3><p>Chọn ảnh có sẵn hoặc tải ảnh mới lên host.</p></div>
          <button className="image-library-close" aria-label="Đóng" onClick={() => setTarget(null)}>×</button>
        </div>
        <label className="btn btn-primary image-library-upload">
          {uploading ? 'Đang tải lên…' : 'Tải ảnh mới'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} />
        </label>
        {error && <p className="image-library-error">{error}</p>}
        <div className="image-library-grid">
          {library.map((image) => (
            <button key={image.url} className="image-library-item" onClick={() => setImage(target, image.url)} title={image.name}>
              <img src={image.url} alt="" />
            </button>
          ))}
          {!error && library.length === 0 && <p className="image-library-empty">Chưa có ảnh trong thư viện.</p>}
        </div>
      </div>
    </div>
  );
};
