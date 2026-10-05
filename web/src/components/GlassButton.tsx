import { useState, type ButtonHTMLAttributes } from 'react';

/** 欢迎区的玻璃按键：光照跟随落点，键盘操作从中心反馈。 */
export function GlassButton({ className = '', disabled, onPointerDown, onKeyDown, onKeyUp, onBlur, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const [keyPressed, setKeyPressed] = useState(false);
  return (
    <button
      {...props}
      className={`welcome-glass ${className}`}
      disabled={disabled}
      data-pressed={keyPressed && !disabled ? '' : undefined}
      onPointerDown={event => {
        if (!disabled && event.button === 0) {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty('--press-x', `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty('--press-y', `${event.clientY - rect.top}px`);
        }
        onPointerDown?.(event);
      }}
      onKeyDown={event => {
        if (!disabled && (event.key === ' ' || event.key === 'Enter')) {
          event.currentTarget.style.setProperty('--press-x', '50%');
          event.currentTarget.style.setProperty('--press-y', '50%');
          setKeyPressed(true);
        }
        onKeyDown?.(event);
      }}
      onKeyUp={event => {
        if (event.key === ' ' || event.key === 'Enter') setKeyPressed(false);
        onKeyUp?.(event);
      }}
      onBlur={event => {
        setKeyPressed(false);
        onBlur?.(event);
      }}
    />
  );
}
