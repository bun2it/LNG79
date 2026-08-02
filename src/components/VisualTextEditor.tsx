import React, { forwardRef, useCallback, useEffect, useRef } from 'react';

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
  ({ rootRef, isEditing, currentView, language, onDirtyChange, onSaved }, ref) => {
    const draftsRef = useRef<TextOverrides>({});

    const getIdentity = useCallback((element: Element) => {
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
        if (!identity || !saved[identity]) return;
        const nodes = allDirectTextNodes(element);
        saved[identity].forEach((value, index) => {
          if (nodes[index]) nodes[index].data = value;
        });
      });
    }, [getIdentity, rootRef]);

    const save = useCallback(() => {
      const drafts = draftsRef.current;
      if (Object.keys(drafts).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSaved(), ...drafts }));
      }
      draftsRef.current = {};
      onDirtyChange?.(false);
      onSaved?.();
    }, [onDirtyChange, onSaved]);

    React.useImperativeHandle(ref, () => ({ save }), [save]);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      applySaved();

      const editableElements: HTMLElement[] = [];
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
        root.addEventListener('click', stopAction, true);
      }

      return () => {
        root.classList.remove('visual-editor-active');
        root.removeEventListener('click', stopAction, true);
        editableElements.forEach((element) => {
          element.removeAttribute('contenteditable');
          element.classList.remove('visual-text-editable');
          element.removeEventListener('input', handleInput);
        });
      };
    }, [applySaved, getIdentity, isEditing, onDirtyChange, rootRef]);

    return null;
  }
);

VisualTextEditor.displayName = 'VisualTextEditor';
