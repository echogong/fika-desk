import { useId } from 'react';

/** A quiet coffee break between Agent sessions; all colors follow the active theme. */
export function CoffeeIllustration() {
  const id = useId();
  const glow = `${id}-glow`;
  const ceramic = `${id}-ceramic`;
  const glass = `${id}-glass`;
  const shadow = `${id}-shadow`;

  return (
    <svg className="coffee-illustration" viewBox="0 0 320 190" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={shadow}>
          <stop stopColor="var(--coffee-shadow)" />
          <stop offset="0.5" stopColor="var(--coffee-shadow)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--coffee-shadow)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={glow}>
          <stop stopColor="var(--primary)" stopOpacity="0.15" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ceramic} x1="121" y1="91" x2="194" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--latte)" />
          <stop offset="1" stopColor="color-mix(in oklch, var(--latte) 72%, var(--panel))" />
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--panel-2)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--panel)" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="106" rx="144" ry="82" fill={`url(#${glow})`} />

      <g transform="rotate(-8 86 79)">
        <rect x="40" y="49" width="92" height="60" rx="12" fill={`url(#${glass})`} stroke="var(--glass-edge)" />
        <path d="M56 66h29M56 77h52M56 88h38" stroke="var(--ink-3)" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        <circle cx="116" cy="61" r="3" fill="var(--primary)" fillOpacity="0.7" />
      </g>
      <g transform="rotate(8 246 91)">
        <rect x="214" y="65" width="65" height="53" rx="12" fill={`url(#${glass})`} stroke="var(--glass-edge)" />
        <path d="m234 82-8 8 8 8m23-16 8 8-8 8m-10-19-5 22" stroke="var(--ink-3)" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <ellipse cx="163" cy="159" rx="68" ry="12" fill={`url(#${shadow})`} />
      <ellipse cx="160" cy="155" rx="43" ry="5" fill={`url(#${shadow})`} fillOpacity="0.45" />
      <ellipse cx="160" cy="150" rx="59" ry="14" fill="var(--latte)" fillOpacity="0.3" stroke="var(--latte)" strokeOpacity="0.38" />
      <ellipse cx="159" cy="147" rx="40" ry="7" stroke="var(--latte)" strokeOpacity="0.28" />

      <path d="M196 103h8c19 0 19 29-1 29h-12" stroke="var(--latte)" strokeWidth="8" strokeLinecap="round" />
      <path d="M120 98h78l-5 27c-3 16-15 24-34 24s-32-8-35-24l-4-27Z" fill={`url(#${ceramic})`} />
      <path d="m128 106 3 15c2 9 7 15 15 18" stroke="var(--latte)" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="159" cy="98" rx="39" ry="12" fill="var(--latte)" />
      <ellipse cx="159" cy="98" rx="31" ry="7" fill="var(--primary)" />
      <ellipse cx="159" cy="99" rx="27" ry="5" fill="var(--latte-ink)" fillOpacity="0.74" />
      <path d="M146 97c6-2 15-2 21 0" stroke="var(--latte)" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />

      <g stroke="var(--ink-3)" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
        <path d="M150 76c-9-11 9-14 1-26" />
        <path d="M169 73c-7-9 8-13 3-22" />
      </g>
    </svg>
  );
}
