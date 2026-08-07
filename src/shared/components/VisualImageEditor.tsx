import React, { useCallback, useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { MediaPickerDialog } from '../../cms/components/MediaPickerDialog';
import { supabase } from '../supabase/supabase';

const STORAGE_KEY = 'cms_visual_image_overrides_v1';

interface VisualImageEditorProps {
  rootRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  currentView: string;
  language: string;
}

export interface VisualImageEditorHandle {
  save: () => Promise<void>;
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

export const VisualImageEditor = forwardRef<VisualImageEditorHandle, VisualImageEditorProps>(
  ({ rootRef, isEditing, currentView, language }, ref) => {
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [activeAlignmentTarget, setActiveAlignmentTarget] = useState<HTMLElement | null>(null);
    const [alignmentValue, setAlignmentValue] = useState<number>(50);
    const [scaleValue, setScaleValue] = useState<number>(100);
    const draftsRef = useRef<Record<string, string>>({});
    const [dbImages, setDbImages] = useState<Record<string, string>>({});

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
      if (element instanceof HTMLImageElement) {
        element.src = url;
        const key = identityFor(element);
        if (key) {
          draftsRef.current[key] = url;
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readOverrides(), [key]: url }));
        }
        setTarget(null);
      } else {
        element.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
        const key = identityFor(element);
        const overrides = readOverrides();
        const existingOffset = overrides[key + '-y-offset'] || '50';
        const existingScale = overrides[key + '-scale'] || '100';
        setAlignmentValue(parseInt(existingOffset));
        setScaleValue(parseInt(existingScale));
        element.style.backgroundPosition = `center ${existingOffset}%`;
        element.style.backgroundSize = existingScale === '100' ? 'cover' : `${existingScale}%`;
        setActiveAlignmentTarget(element);
        setTarget(null);
      }
    }, [identityFor]);

    // Load from database on mount
    useEffect(() => {
      const fetchImages = async () => {
        const client = supabase;
        if (!client) return;
        try {
          const { data, error } = await client
            .from('site_texts')
            .select('content_key, value_vi')
            .eq('section', 'image-override')
            .eq('status', 'published');
          if (!error && data) {
            const dict: Record<string, string> = {};
            data.forEach((row) => {
              dict[row.content_key] = row.value_vi;
            });
            setDbImages(dict);
          }
        } catch (err) {
          console.error('Failed to load image overrides from database:', err);
        }
      };
      void fetchImages();
    }, []);

    const applySaved = useCallback(() => {
      const overrides = { ...readOverrides(), ...dbImages, ...draftsRef.current };
      findImages().forEach((element) => {
        const key = identityFor(element);
        const url = overrides[key];
        if (!url) return;
        if (element instanceof HTMLImageElement) {
          element.src = url;
        } else {
          element.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
          const yOffset = overrides[key + '-y-offset'] || '50';
          const scaleVal = overrides[key + '-scale'] || '100';
          element.style.backgroundPosition = `center ${yOffset}%`;
          element.style.backgroundSize = scaleVal === '100' ? 'cover' : `${scaleVal}%`;
        }
      });
    }, [findImages, identityFor, dbImages]);

    useEffect(() => {
      applySaved();
    }, [applySaved, dbImages]);

    // Expose save function to parent component
    useImperativeHandle(ref, () => ({
      save: async () => {
        const drafts = draftsRef.current;
        const client = supabase;
        if (Object.keys(drafts).length === 0) return;

        try {
          if (client) {
            const promises = Object.entries(drafts).map(async ([key, url]) => {
              let fieldVal = 'src';
              if (key.endsWith('-y-offset')) fieldVal = 'y-offset';
              else if (key.endsWith('-scale')) fieldVal = 'scale';

              const updatedRow = {
                content_key: key,
                page: currentView,
                section: 'image-override',
                field: fieldVal,
                status: 'published',
                value_vi: url,
                value_en: url
              };
              const { error } = await client
                .from('site_texts')
                .upsert(updatedRow, { onConflict: 'content_key' });
              if (error) throw error;
            });
            await Promise.all(promises);
          }
          setDbImages((current) => ({ ...current, ...drafts }));
          draftsRef.current = {};
        } catch (err) {
          console.error('Failed to save image overrides to database:', err);
        }
      }
    }));

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
    }, [findImages, isEditing]);

    return (
      <>
        <MediaPickerDialog open={Boolean(target)} language={language === 'en' ? 'en' : 'vi'} onClose={() => setTarget(null)} onSelect={(url) => { if (target) setImage(target, url); }} />
        
        {activeAlignmentTarget && (
          <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: '#fff',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            padding: '1.25rem',
            width: '320px',
            border: '1px solid var(--color-gray-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontFamily: 'Inter, sans-serif'
          }} data-visual-editor-ui="true">
            <div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-navy)' }}>
                {language === 'vi' ? 'Cắt & Thu Phóng Banner (Ultrawide)' : 'Banner Crop & Zoom'}
              </strong>
            </div>

            {/* Focal Y Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>{language === 'vi' ? 'Tiêu điểm Y' : 'Focal Point Y'}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-teal)' }}>{alignmentValue}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={alignmentValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setAlignmentValue(val);
                  activeAlignmentTarget.style.backgroundPosition = `center ${val}%`;
                }}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8' }}>
                <span>{language === 'vi' ? 'Trên (Top)' : 'Top'}</span>
                <span>{language === 'vi' ? 'Giữa' : 'Center'}</span>
                <span>{language === 'vi' ? 'Dưới (Bottom)' : 'Bottom'}</span>
              </div>
            </div>

            {/* Zoom / Scale Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>{language === 'vi' ? 'Thu phóng (Zoom)' : 'Zoom / Scale'}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-teal)' }}>{scaleValue}%</span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="200" 
                value={scaleValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setScaleValue(val);
                  activeAlignmentTarget.style.backgroundSize = val === 100 ? 'cover' : `${val}%`;
                }}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8' }}>
                <span>100% (Cover)</span>
                <span>150%</span>
                <span>200%</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-gray-border)', paddingTop: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-teal btn-sm"
                onClick={() => {
                  const key = identityFor(activeAlignmentTarget);
                  if (key) {
                    const url = activeAlignmentTarget.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                    draftsRef.current[key] = url;
                    draftsRef.current[key + '-y-offset'] = String(alignmentValue);
                    draftsRef.current[key + '-scale'] = String(scaleValue);
                    
                    const localOverrides = readOverrides();
                    localOverrides[key] = url;
                    localOverrides[key + '-y-offset'] = String(alignmentValue);
                    localOverrides[key + '-scale'] = String(scaleValue);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(localOverrides));
                  }
                  setActiveAlignmentTarget(null);
                }}
              >
                {language === 'vi' ? 'Hoàn tất' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
);
