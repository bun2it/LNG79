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

const getElementValues = (element: Element): string[] => {
  const hasKey = element.hasAttribute('data-content-key') || element.closest('[data-content-key]');
  const hasComplexChildren = element.querySelector('svg, img');
  if (hasKey && !hasComplexChildren) {
    const text = (element as HTMLElement).innerText || element.textContent || '';
    return [text];
  }
  return allDirectTextNodes(element).map((node) => node.data);
};

const hasEditableText = (element: Element): boolean => {
  const values = getElementValues(element);
  return values.some((val) => Boolean(val?.trim()));
};

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
      const saved = { ...readSaved(), ...draftsRef.current };

      root.querySelectorAll(TEXT_SELECTOR).forEach((element) => {
        if (element.closest('[data-visual-editor-ui]')) return;
        const identity = getIdentity(element);
        if (!identity) return;

        const hasKey = element.hasAttribute('data-content-key') || element.closest('[data-content-key]');
        const hasComplexChildren = element.querySelector('svg, img');

        // 1. Check Supabase published overrides first (stable content keys)
        if (supabaseTexts && supabaseTexts[identity]) {
          const overrideValue = language === 'vi' ? supabaseTexts[identity].value_vi : supabaseTexts[identity].value_en;
          if (overrideValue !== undefined && overrideValue !== null) {
            if (hasKey && !hasComplexChildren) {
              (element as HTMLElement).innerText = overrideValue;
            } else {
              const nodes = allDirectTextNodes(element);
              if (nodes.length > 0) {
                nodes[0].data = overrideValue;
                for (let i = 1; i < nodes.length; i++) {
                  nodes[i].data = '';
                }
              }
            }
            return;
          }
        }

        // 2. Check local draft / legacy overrides
        if (saved[identity]) {
          if (hasKey && !hasComplexChildren) {
            const text = saved[identity].join('');
            (element as HTMLElement).innerText = text;
          } else {
            const nodes = allDirectTextNodes(element);
            saved[identity].forEach((value, index) => {
              if (nodes[index]) nodes[index].data = value;
            });
          }
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
        if (language === 'vi') {
          const entriesToTranslate: { id: string; text: string }[] = [];
          Object.keys(drafts).forEach((identity) => {
            if (identity.endsWith('::en') || identity.startsWith('en/')) return;
            const text = drafts[identity].join('').trim();
            if (text) {
              entriesToTranslate.push({ id: identity, text });
            }
          });

          if (entriesToTranslate.length > 0) {
            try {
              let translationsResult: { id: string; text: string }[] = [];
              if (client) {
                const { data, error } = await client.functions.invoke('translate-content', {
                  body: { entries: entriesToTranslate }
                });
                if (error || !data) throw new Error(error?.message || 'Supabase Edge Function translation failed');
                translationsResult = data.translations || [];
              } else {
                const response = await authFetch('/api/ai/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ entries: entriesToTranslate })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Translation failed');
                translationsResult = result.translations || [];
              }

              translationsResult.forEach((item) => {
                const identity = item.id;
                const translatedText = item.text;
                const originalValues = drafts[identity];
                
                const source = originalValues.join('');
                const leading = source.match(/^\s*/)?.[0] || '';
                const trailing = source.match(/\s*$/)?.[0] || '';
                const finalEnText = `${leading}${translatedText.trim()}${trailing}`;
                
                const isStable = !identity.includes('/');
                if (isStable) {
                  drafts[`${identity}::en`] = [finalEnText];
                } else if (identity.startsWith('vi/')) {
                  drafts[identity.replace(/^vi\//, 'en/')] = [finalEnText];
                }
              });
            } catch (err) {
              console.error('Auto-translation failed during save:', err);
            }
          }
        }

        const keys = Object.keys(drafts).filter((identity) => {
          if (identity.endsWith('::en')) return false;
          if (identity.startsWith('en/')) {
            const viKey = identity.replace(/^en\//, 'vi/');
            if (drafts[viKey]) return false;
          }
          return true;
        });

        if (client) {
          const promises = keys.map(async (identity) => {
            const newText = drafts[identity].join('').trim();
            const isStable = !identity.includes('/');
            
            if (isStable) {
              const parts = identity.split('.');
              const pageName = parts[0] || 'home';
              const sectionName = parts[2] || 'section';
              const fieldName = parts[3] || 'field';

              const { data: existing } = await client
                .from('site_texts')
                .select('value_vi, value_en')
                .eq('content_key', identity)
                .maybeSingle();

              let valueVi = existing?.value_vi || '';
              let valueEn = existing?.value_en || '';

              if (language === 'vi') {
                valueVi = newText;
                const translationKey = `${identity}::en`;
                if (drafts[translationKey]) {
                  valueEn = drafts[translationKey].join('').trim();
                }
              } else if (language === 'en') {
                valueEn = newText;
              }

              const updatedRow = {
                content_key: identity,
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
                .eq('content_key', identity)
                .maybeSingle();

              const isEnLegacy = identity.startsWith('en/');
              let valueVi = existing?.value_vi || '';
              let valueEn = existing?.value_en || '';

              if (isEnLegacy) {
                valueEn = newText;
              } else {
                valueVi = newText;
                const translationKey = identity.replace(/^vi\//, 'en/');
                if (drafts[translationKey]) {
                  valueEn = drafts[translationKey].join('').trim();
                }
              }

              const updatedRow = {
                content_key: identity,
                page: 'legacy',
                section: 'legacy',
                field: 'legacy',
                status: 'published',
                value_vi: valueVi,
                value_en: valueEn
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
        }
        
        // Always write to local storage cache to support dual-write
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSaved(), ...drafts }));
        
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
        draftsRef.current[identity] = getElementValues(element);
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
          if (element.tagName.toLowerCase() === 'div' && !element.hasAttribute('data-content-key')) return;
          if (!hasEditableText(element)) return;
          
          if (!element.classList.contains('visual-text-editable')) {
            element.contentEditable = 'true';
            element.spellcheck = true;
            element.classList.add('visual-text-editable');
          }
          
          element.addEventListener('input', handleInput);
          editableElements.push(element);
        });
        if (language === 'vi') {
          const translatableElements = Array.from(root.querySelectorAll<HTMLElement>(TEXT_SELECTOR)).filter((element) => {
            if (element.closest('[data-visual-editor-ui]') || element.closest('input,select,textarea')) return false;
            if (element.tagName.toLowerCase() === 'div' && !element.hasAttribute('data-content-key')) return false;
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
              const viValues = getElementValues(element);
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
