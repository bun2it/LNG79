import { authFetch } from '../auth/authFetch';
import { supabase } from '../../lib/supabase';

export interface TranslationEntry { id: string; text: string }

interface TranslationTarget extends TranslationEntry { targetPath: Array<string | number> }

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const collectVietnameseText = (root: unknown): TranslationTarget[] => {
  const entries: TranslationTarget[] = [];
  const walk = (value: unknown, path: Array<string | number>) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...path, index]));
      return;
    }
    if (!isObject(value)) return;
    if (typeof value.vi === 'string' && typeof value.en === 'string' && value.vi.trim()) {
      entries.push({ id: entries.length.toString(), text: value.vi, targetPath: [...path, 'en'] });
    }
    Object.entries(value).forEach(([key, child]) => {
      if (key === 'vi' || key === 'en') return;
      if (key.endsWith('Vi') && typeof child === 'string' && child.trim()) {
        const englishKey = `${key.slice(0, -2)}En`;
        if (englishKey in value) entries.push({ id: entries.length.toString(), text: child, targetPath: [...path, englishKey] });
        return;
      }
      walk(child, [...path, key]);
    });
  };
  walk(root, []);
  return entries;
};

const setAtPath = (root: unknown, path: Array<string | number>, value: string) => {
  let cursor = root as Record<string | number, unknown>;
  path.slice(0, -1).forEach((segment) => { cursor = cursor[segment] as Record<string | number, unknown>; });
  cursor[path[path.length - 1]] = value;
};

export const translateWebsiteContent = async <T,>(content: T, onProgress?: (done: number, total: number) => void): Promise<T> => {
  const translated = structuredClone(content);
  const entries = collectVietnameseText(translated);
  const batchSize = 40;
  let done = 0;
  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = entries.slice(index, index + batchSize);
    let translations: TranslationEntry[] = [];
    const client = supabase;
    if (client) {
      const { data, error } = await client.functions.invoke('translate-content', {
        body: { entries: batch.map(({ id, text }) => ({ id, text })) }
      });
      if (error || !data) throw new Error(error?.message || 'Supabase Edge Function translation failed');
      translations = data.translations || [];
    } else {
      const response = await authFetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: batch.map(({ id, text }) => ({ id, text })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Groq translation failed');
      translations = result.translations || [];
    }
    const byId = new Map<string, string>(translations.map((item: TranslationEntry) => [item.id, item.text]));
    batch.forEach((entry) => {
      const value = byId.get(entry.id);
      if (value) setAtPath(translated, entry.targetPath, value);
    });
    done += batch.length;
    onProgress?.(done, entries.length);
  }
  return translated;
};
