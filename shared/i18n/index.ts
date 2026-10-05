import { catalog } from './catalog';

export const LOCALES = ['zh-CN', 'zh-TW', 'en', 'sv', 'ja'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'zh-CN';
export const LANGUAGE_KEY = 'fika-desk.locale';
export const LANGUAGE_NAMES: Record<Locale, string> = {
  'zh-CN': '简体中文', 'zh-TW': '繁體中文', en: 'English', sv: 'Svenska', ja: '日本語',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function readLocale(storage?: Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'setItem'>>): Locale {
  try {
    const current = storage?.getItem(LANGUAGE_KEY);
    const saved = current ?? storage?.getItem('multiagent.locale');
    if (current == null && isLocale(saved)) {
      try { storage?.setItem?.(LANGUAGE_KEY, saved); } catch {}
    }
    return isLocale(saved) ? saved : DEFAULT_LOCALE;
  } catch { return DEFAULT_LOCALE; }
}

/** Values are interpolated once: user text, code, IDs and paths are never translated. */
export function translate(locale: Locale, source: string, values: readonly unknown[] = []): string {
  const key = source.trim();
  const entry = Object.hasOwn(catalog, key) ? catalog[key] : undefined;
  const index = LOCALES.indexOf(locale) - 1;
  const template = index >= 0 && entry ? source.slice(0, source.indexOf(key)) + entry[index] + source.slice(source.indexOf(key) + key.length) : source;
  return template.replace(/\{(\d+)\}/g, (match, position: string) => Number(position) < values.length ? String(values[Number(position)] ?? '') : match);
}
