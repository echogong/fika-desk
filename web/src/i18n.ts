import { useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, LANGUAGE_KEY, isLocale, readLocale, translate, type Locale } from '../../shared/i18n';
export { LANGUAGE_NAMES, LOCALES, type Locale } from '../../shared/i18n';

function browserStorage(): Storage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch { return undefined; }
}

let locale = readLocale(browserStorage());
const listeners = new Set<() => void>();
export const getLocale = (): Locale => locale;

function applyLocale(next: Locale): void {
  const changed = locale !== next;
  locale = next;
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  if (changed) for (const listener of listeners) listener();
}

/** Preferences stay local to this browser; switching does not restart sessions. */
export function setLocale(next: Locale): void {
  if (!isLocale(next)) return;
  try { browserStorage()?.setItem(LANGUAGE_KEY, next); } catch { /* Still works when storage is unavailable. */ }
  applyLocale(next);
}

export function useLocale(): Locale {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, getLocale, () => DEFAULT_LOCALE);
}

export const tx = (source: string, values?: readonly unknown[]): string => translate(locale, source, values);

/** Only for static UI label tables; service data and conversation text stay untouched. */
export function localizedLabels<T extends object>(labels: T): T {
  const cache = new WeakMap<object, object>();
  const wrap = (value: object): object => {
    const existing = cache.get(value);
    if (existing) return existing;
    const proxy = new Proxy(value, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        return typeof value === 'string' ? tx(value) : value && typeof value === 'object' ? wrap(value) : value;
      },
    });
    cache.set(value, proxy);
    return proxy;
  };
  return wrap(labels) as T;
}

applyLocale(locale);
if (typeof window !== 'undefined') window.addEventListener('storage', (event) => {
  if (event.storageArea && event.storageArea !== browserStorage()) return;
  if (event.key === LANGUAGE_KEY || event.key === 'multiagent.locale') applyLocale(isLocale(event.newValue) ? event.newValue : DEFAULT_LOCALE);
  else if (event.key === null) applyLocale(readLocale(browserStorage()));
});
