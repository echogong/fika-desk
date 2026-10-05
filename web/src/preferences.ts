type Preference = 'theme' | 'layout' | 'seen-completions' | 'workspaces-collapsed';

export const preferenceKey = (name: Preference): string => `fika-desk.${name}`;
const previousKey = (name: Preference): string => `multiagent.${name}`;

/** Preserve saved layouts, theme and completion state when an existing browser upgrades. */
export function readPreference(name: Preference, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): string | null {
  const current = storage.getItem(preferenceKey(name));
  if (current !== null) return current;
  const previous = storage.getItem(previousKey(name));
  if (previous !== null) {
    // A full or read-only store should not prevent loading an existing preference.
    try { storage.setItem(preferenceKey(name), previous); } catch {}
  }
  return previous;
}

export function writePreference(name: Preference, value: string): void {
  localStorage.setItem(preferenceKey(name), value);
}

/** Include events from older, still-open tabs during the upgrade. */
export function isPreferenceKey(name: Preference, key: string | null): boolean {
  return key === preferenceKey(name) || key === previousKey(name);
}
