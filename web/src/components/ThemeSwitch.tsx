import { tx, useLocale, localizedLabels } from '../i18n';
import { useRef, type KeyboardEvent } from 'react';
import { setTheme, useStore, type ThemePref } from '../store';
import { Monitor, Moon, Sun } from './Icons';
import './theme-switch.css';

const THEMES = localizedLabels([
  { value: 'light', label: '浅色模式', Icon: Sun },
  { value: 'dark', label: '深色模式', Icon: Moon },
  { value: 'system', label: '跟随系统', Icon: Monitor },
] satisfies { value: ThemePref; label: string; Icon: typeof Sun }[]);

export function ThemeSwitch() {
  useLocale();
  const theme = useStore((s) => s.theme);
  const group = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = THEMES.findIndex(option => option.value === theme);
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = (current + 1) % THEMES.length; break;
      case 'ArrowLeft':
      case 'ArrowUp': next = (current + THEMES.length - 1) % THEMES.length; break;
      case 'Home': next = 0; break;
      case 'End': next = THEMES.length - 1; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    setTheme(THEMES[next]!.value);
    group.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }

  return (
    <div ref={group} className="theme-switch" data-value={theme} role="radiogroup" aria-label={tx("外观配色")} onKeyDown={onKeyDown}>
      <span className="theme-switch-thumb" aria-hidden="true" />
      {THEMES.map(({ value, label, Icon }) => (
        <button key={value} type="button" role="radio" aria-label={label} title={label} aria-checked={theme === value} tabIndex={theme === value ? 0 : -1} onClick={() => setTheme(value)}>
          <Icon />
        </button>
      ))}
    </div>
  );
}
