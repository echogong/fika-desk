/** 对话署名的小咖啡杯：杯身固定，只有当前运行中的回复有蒸汽动效。 */
export function CoffeeMark({ working = false }: { working?: boolean }) {
  return (
    <svg className="coffee-mark" data-working={working || undefined} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <g className="coffee-steam">
        <path d="M8.2 7.1c-1.3-1.1 1.1-2.2 0-3.6" />
        <path className="coffee-steam-late" d="M12.4 7.1c-1.3-1.1 1.1-2.2 0-3.6" />
      </g>
      <path d="M17.5 10.3h1.2a2.6 2.6 0 0 1 0 5.2h-1.2" />
      <path className="coffee-cup" d="M4.5 9.5h13v4.7a4.3 4.3 0 0 1-4.3 4.3H8.8a4.3 4.3 0 0 1-4.3-4.3z" />
      <path className="coffee-surface" d="M7 11.8h8" />
      <path d="M3.5 20.5h15" />
    </svg>
  );
}
