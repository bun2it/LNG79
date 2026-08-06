import React, { useCallback, useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { MediaPickerDialog } from './admin/MediaPickerDialog';
import { supabase } from '../lib/supabase';

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
      if (element instanceof HTMLImageElement) element.src = url;
      else element.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
      const key = identityFor(element);
      if (key) {
        draftsRef.current[key] = url;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readOverrides(), [key]: url }));
      }
      setTarget(null);
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
        if (element instanceof HTMLImageElement) element.src = url;
        else element.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
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
              const updatedRow = {
                content_key: key,
                page: currentView,
                section: 'image-override',
                field: 'src',
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

    return <MediaPickerDialog open={Boolean(target)} language={language === 'en' ? 'en' : 'vi'} onClose={() => setTarget(null)} onSelect={(url) => { if (target) setImage(target, url); }} />;
  }
);
