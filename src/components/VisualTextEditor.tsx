import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { authFetch } from '../features/auth/authFetch';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'cms_visual_text_overrides_v1';
const TEXT_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,span,div,li,button,a,label,small,strong,em,b,th,td,option';

type TextOverrides = Record<string, string[]>;

export interface VisualTextEditorHandle {
  save: () => void;
}

interface VisualTextEditorProps {
  rootRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  currentView: string;
  language: string;
  onDirtyChange?: (dirty: boolean) => void;
  onSaved?: () => void;
  onSavingChange?: (saving: boolean) => void;
}

const readSaved = (): TextOverrides => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const allDirectTextNodes = (element: Element): Text[] =>
  Array.from(element.childNodes).filter(
    (node): node is Text => node.nodeType === Node.TEXT_NODE
  );

const hasEditableText = (element: Element): boolean =>
  allDirectTextNodes(element).some((node) => Boolean(node.textContent?.trim()));

const elementPath = (element: Element, boundary: Element): string => {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== boundary) {
    const parent: Element | null = current.parentElement;
    if (!parent) break;
    const sameTag = Array.from(parent.children).filter((child) => child.tagName === current?.tagName);
    parts.unshift(`${current.tagName.toLowerCase()}:${sameTag.indexOf(current)}`);
    current = parent;
  }

  return parts.join('/');
};

export const VisualTextEditor = forwardRef<VisualTextEditorHandle, VisualTextEditorProps>(
  ({ rootRef, isEditing, currentView, language, onDirtyChange, onSaved, onSavingChange }, ref) => {
    const draftsRef = useRef<TextOverrides>({});
    const [supabaseTexts, setSupabaseTexts] = React.useState<Record<string, { value_vi: string; value_en: string }>>({});

    useEffect(() => {
      const fetchTexts = async () => {
        const client = supabase;
        if (!client) return;
        try {
          const { data, error } = await client
            .from('site_texts')
            .select('content_key, value_vi, value_en')
            .eq('status', 'published');
          if (!error && data) {
            const dict: Record<string, { value_vi: string; value_en: string }> = {};
            data.forEach((row) => {
              dict[row.content_key] = { value_vi: row.value_vi, value_en: row.value_en };
            });
            setSupabaseTexts(dict);
          }
        } catch (err) {
          console.error('Failed to fetch site texts from Supabase:', err);
        }
      };
      void fetchTexts();
    }, []);

    const getIdentity = useCallback((element: Element) => {
      const hasKey = element.closest('[data-content-key]');
      if (hasKey) {
        return hasKey.getAttribute('data-content-key');
      }
      const nav = element.closest('nav');
      const footer = element.closest('footer');
      const main = element.closest('main');
      const boundary = nav || footer || main || rootRef.current;
      if (!boundary) return null;
      const scope = nav ? 'global-nav' : footer ? 'global-footer' : `page-${currentView}`;
      return `${language}/${scope}/${elementPath(element, boundary)}`;
    }, [currentView, language, rootRef]);

    const applySaved = useCallback(() => {
      const root = rootRef.current;
      if (!root) return;
      const saved = readSaved();

      root.querySelectorAll(TEXT_SELECTOR).forEach((element) => {
        if (element.closest('[data-visual-editor-ui]')) return;
        const identity = getIdentity(element);
        if (!identity) return;

        // 1. Check Supabase published overrides first (stable content keys)
        if (supabaseTexts && supabaseTexts[identity]) {
          const overrideValue = language === 'vi' ? supabaseTexts[identity].value_vi : supabaseTexts[identity].value_en;
          if (overrideValue !== undefined && overrideValue !== null) {
            const nodes = allDirectTextNodes(element);
            if (nodes.length > 0) {
              nodes[0].data = overrideValue;
              for (let i = 1; i < nodes.length; i++) {
                nodes[i].data = '';
              }
            }
            return;
          }
        }

        // 2. Check local draft / legacy overrides
        if (saved[identity]) {
          const nodes = allDirectTextNodes(element);
          saved[identity].forEach((value, index) => {
            if (nodes[index]) nodes[index].data = value;
          });
        }
      });
    }, [getIdentity, rootRef, supabaseTexts, language]);

    useEffect(() => {
      applySaved();
    }, [applySaved, supabaseTexts, language]);

    const save = useCallback(async () => {
      const drafts = draftsRef.current;
      const client = supabase;
      
      if (Object.keys(drafts).length === 0) {
        onSaved?.();
        return;
      }

      onSavingChange?.(true);
      try {
        if (client) {
          const promises = Object.keys(drafts).map(async (identity) => {
            const newText = drafts[identity].join('').trim();
            const isTranslation = identity.endsWith('::en');
            const cleanIdentity = isTranslation ? identity.slice(0, -4) : identity;
            const isStable = !cleanIdentity.includes('/');
            
            if (isStable) {
              const parts = cleanIdentity.split('.');
              const pageName = parts[0] || 'home';
              const sectionName = parts[2] || 'section';
              const fieldName = parts[3] || 'field';

              const { data: existing } = await client
                .from('site_texts')
                .select('value_vi, value_en')
                .eq('content_key', cleanIdentity)
                .maybeSingle();

              let valueVi = existing?.value_vi || '';
              let valueEn = existing?.value_en || '';

              if (isTranslation) {
                valueEn = newText;
              } else if (language === 'vi') {
                valueVi = newText;
              } else if (language === 'en') {
                valueEn = newText;
              }

              const updatedRow = {
                content_key: cleanIdentity,
                page: pageName,
                section: sectionName,
                field: fieldName,
                status: 'published',
                value_vi: valueVi,
                value_en: valueEn
              };

              const { error } = await client
                .from('site_texts')
                .upsert(updatedRow, { onConflict: 'content_key' });
              
              if (error) throw error;
            } else {
              const { data: existing } = await client
                .from('site_texts')
                .select('value_vi, value_en')
                .eq('content_key', cleanIdentity)
                .maybeSingle();

              const isEnLegacy = cleanIdentity.startsWith('en/');

              const updatedRow = {
                content_key: cleanIdentity,
                page: 'legacy',
                section: 'legacy',
                field: 'legacy',
                status: 'published',
                value_vi: !isEnLegacy ? newText : (existing?.value_vi || ''),
                value_en: isEnLegacy ? newText : (existing?.value_en || '')
              };

              const { error } = await client
                .from('site_texts')
                .upsert(updatedRow, { onConflict: 'content_key' });
              
              if (error) throw error;
            }
          });

          await Promise.all(promises);

          const { data: latestData } = await client
            .from('site_texts')
            .select('content_key, value_vi, value_en')
            .eq('status', 'published');
          
          if (latestData) {
            const dict: Record<string, { value_vi: string; value_en: string }> = {};
            latestData.forEach((row) => {
              dict[row.content_key] = { value_vi: row.value_vi, value_en: row.value_en };
            });
            setSupabaseTexts(dict);
          }
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSaved(), ...drafts }));
        }
        
        draftsRef.current = {};
        onDirtyChange?.(false);
        onSaved?.();
      } catch (err: any) {
        console.error('Error saving text overrides:', err);
        alert(language === 'vi' ? 'Không thể lưu thay đổi lên hệ thống.' : 'Could not save overrides to database.');
      } finally {
        onSavingChange?.(false);
      }
    }, [onDirtyChange, onSaved, onSavingChange, language]);

    React.useImperativeHandle(ref, () => ({ save }), [save]);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      applySaved();

      const editableElements: HTMLElement[] = [];
      const translateButtons: HTMLButtonElement[] = [];
      const handleInput = (event: Event) => {
        const element = event.currentTarget as HTMLElement;
        const identity = getIdentity(element);
        if (!identity) return;
        draftsRef.current[identity] = allDirectTextNodes(element).map((node) => node.data);
        onDirtyChange?.(true);
      };
      const stopAction = (event: Event) => {
        if ((event.target as Element).closest('.visual-text-editable')) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      if (isEditing) {
        root.classList.add('visual-editor-active');
        root.querySelectorAll<HTMLElement>(TEXT_SELECTOR).forEach((element) => {
          if (element.closest('[data-visual-editor-ui]') || element.closest('input,select,textarea')) return;
          if (element.isContentEditable || !hasEditableText(element)) return;
          element.contentEditable = 'true';
          element.spellcheck = true;
          element.classList.add('visual-text-editable');
          element.addEventListener('input', handleInput);
          editableElements.push(element);
        });
        if (language === 'vi') {
          const translatableElements = Array.from(root.querySelectorAll<HTMLElement>(TEXT_SELECTOR)).filter((element) => {
            if (element.closest('[data-visual-editor-ui]') || element.closest('input,select,textarea')) return false;
            return (element.classList.contains('visual-text-editable') || element.isContentEditable) && hasEditableText(element);
          });
          const refreshButtonPositions = () => {
            translatableElements.forEach((element, index) => {
              const button = translateButtons[index];
              if (!button) return;
              const rect = element.getBoundingClientRect();
              button.style.left = `${window.scrollX + rect.right - 13}px`;
              button.style.top = `${window.scrollY + rect.top - 13}px`;
            });
          };
          translatableElements.forEach((element) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.visualEditorUi = 'true';
            button.className = 'visual-ai-translate-button';
            button.setAttribute('aria-label', 'Dịch nội dung này sang tiếng Anh');
            button.title = 'Dịch và đồng bộ sang tiếng Anh';
            button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>';
            button.addEventListener('mousedown', (event) => event.preventDefault());
            button.addEventListener('click', async (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (button.disabled) return;
              const viIdentity = getIdentity(element);
              if (!viIdentity) return;
              const nodes = allDirectTextNodes(element);
              const viValues = nodes.map((node) => node.data);
              const entries = viValues.map((text, index) => ({ id: String(index), text: text.trim() })).filter((entry) => entry.text);
              if (!entries.length) return;

              // Do not overwrite manually edited EN without confirmation
              const client = supabase;
              const isStable = !viIdentity.includes('/');
              let existingEn = false;
              
              try {
                if (client) {
                  const enKey = isStable ? viIdentity : viIdentity.replace(/^vi\//, 'en/');
                  const { data: existing } = await client
                    .from('site_texts')
                    .select('value_en, value_vi')
                    .eq('content_key', enKey)
                    .maybeSingle();

                  if (isStable) {
                    if (existing?.value_en) existingEn = true;
                  } else {
                    if (existing?.value_vi || existing?.value_en) existingEn = true;
                  }
                } else {
                  const saved = readSaved();
                  const enKey = isStable ? `${viIdentity}::en` : viIdentity.replace(/^vi\//, 'en/');
                  if (saved[enKey]) existingEn = true;
                }
              } catch (err) {
                console.error('Error checking existing translation:', err);
              }

              if (existingEn) {
                const confirmOverwrite = window.confirm(
                  language === 'vi' 
                    ? 'Bản dịch tiếng Anh đã tồn tại. Bạn có muốn dịch đè lên bản dịch cũ không?' 
                    : 'An English translation already exists. Do you want to overwrite it?'
                );
                if (!confirmOverwrite) return;
              }

              button.disabled = true;
              button.classList.add('is-loading');
              try {
                let translations: { id: string; text: string }[] = [];
                const client = supabase;
                if (client) {
                  const { data, error } = await client.functions.invoke('translate-content', {
                    body: { entries }
                  });
                  if (error || !data) throw new Error(error?.message || 'Supabase Edge Function translation failed');
                  translations = data.translations || [];
                } else {
                  const response = await authFetch('/api/ai/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error || 'Translation failed');
                  translations = result.translations || [];
                }
                const translated = new Map<string, string>((translations || []).map((item: { id: string; text: string }) => [item.id, item.text]));
                const enValues = viValues.map((source, index) => {
                  const value = translated.get(String(index));
                  if (!value) return source;
                  const leading = source.match(/^\s*/)?.[0] || '';
                  const trailing = source.match(/\s*$/)?.[0] || '';
                  return `${leading}${value.trim()}${trailing}`;
                });
                
                const isStable = !viIdentity.includes('/');
                if (isStable) {
                  draftsRef.current[viIdentity] = viValues;
                  draftsRef.current[`${viIdentity}::en`] = enValues;
                } else {
                  draftsRef.current[viIdentity] = viValues;
                  draftsRef.current[viIdentity.replace(/^vi\//, 'en/')] = enValues;
                }
                onDirtyChange?.(true);
                button.classList.remove('is-loading');
                button.classList.add('is-success');
                window.setTimeout(() => button.classList.remove('is-success'), 1600);
              } catch (reason) {
                button.classList.remove('is-loading');
                button.classList.add('is-error');
                button.title = reason instanceof Error ? reason.message : 'Không thể dịch nội dung';
                window.setTimeout(() => button.classList.remove('is-error'), 2200);
              } finally {
                button.disabled = false;
              }
            });
            document.body.appendChild(button);
            translateButtons.push(button);
          });
          refreshButtonPositions();
          window.addEventListener('resize', refreshButtonPositions);
          window.addEventListener('scroll', refreshButtonPositions, true);
          (root as HTMLElement & { __visualTranslateCleanup?: () => void }).__visualTranslateCleanup = () => {
            window.removeEventListener('resize', refreshButtonPositions);
            window.removeEventListener('scroll', refreshButtonPositions, true);
          };
        }
        root.addEventListener('click', stopAction, true);
      }

      return () => {
        root.classList.remove('visual-editor-active');
        (root as HTMLElement & { __visualTranslateCleanup?: () => void }).__visualTranslateCleanup?.();
        delete (root as HTMLElement & { __visualTranslateCleanup?: () => void }).__visualTranslateCleanup;
        root.removeEventListener('click', stopAction, true);
        translateButtons.forEach((button) => button.remove());
        editableElements.forEach((element) => {
          element.removeAttribute('contenteditable');
          element.classList.remove('visual-text-editable');
          element.removeEventListener('input', handleInput);
        });
      };
    }, [applySaved, getIdentity, isEditing, language, onDirtyChange, rootRef]);

    return null;
  }
);

VisualTextEditor.displayName = 'VisualTextEditor';
