// 线条图标。只画用得到的几个，跟设计稿一致。
import type { ReactNode } from 'react';

function Icon({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      className="i"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Chevron = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
export const Plus = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const ArrowUp = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
);
export const ImagePlus = ({ size = 16 }: { size?: number }) => (
  <Icon size={size}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8" cy="8" r="1.5" />
    <path d="M3 16l5-5 5 5 3-3 5 5" />
  </Icon>
);
export const Folder = ({ size = 16 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H10l2 2.5h6.5A1.5 1.5 0 0 1 20 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
  </Icon>
);
/** 设置：三条滑杆，和设计稿一致 */
export const Gear = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="17" r="2" />
  </Icon>
);
export const Cpu = ({ size = 16 }: { size?: number }) => (
  <Icon size={size}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
  </Icon>
);
export const Sun = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);
export const Moon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M20.5 13.2A8.5 8.5 0 0 1 10.8 3.5 8.5 8.5 0 1 0 20.5 13.2z" />
  </Icon>
);
export const Monitor = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M12 17v4M8 21h8" />
  </Icon>
);
export const Clock = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 2" />
  </Icon>
);
export const Close = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
// 会话的结束按钮使用像素网格，不改变其他关闭图标的线条风格。
export const PixelClose = ({ size = 14 }: { size?: number }) => (
  <svg className="i pixel-close" width={size} height={size} viewBox="0 0 14 14" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <path d="M1 1h2v2H1zM11 1h2v2h-2zM3 3h2v2H3zM9 3h2v2H9zM5 5h2v2H5zM7 5h2v2H7zM5 7h2v2H5zM7 7h2v2H7zM3 9h2v2H3zM9 9h2v2H9zM1 11h2v2H1zM11 11h2v2h-2z" />
  </svg>
);
export const More = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx="6" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="18" cy="12" r="1.2" />
  </Icon>
);
export const Branch = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <circle cx="7" cy="6" r="2" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="8" r="2" />
    <path d="M7 8v8M17 10c0 4-6 3-10 6" />
  </Icon>
);
export const Pencil = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3" />
    <path d="M13.5 7.5l3 3" />
  </Icon>
);
export const Copy = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Icon>
);
export const Eye = ({ size = 16 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Icon>
);
export const EyeOff = ({ size = 16 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M10 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.2 7.4C3.9 9 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1" />
    <path d="M4 4l16 16" />
  </Icon>
);
/** 执行命令：一个提示符 */
export const Prompt = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M5 7l5 5-5 5M12.5 17H19" />
  </Icon>
);
/** 读文件：一页纸 */
export const Doc = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M6.5 3.5h7l4 4v13h-11z" />
    <path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 16h5" />
  </Icon>
);
/** 思考：一个小火花 */
export const Spark = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.6 6.6l2.3 2.3M15.1 15.1l2.3 2.3M6.6 17.4l2.3-2.3M15.1 8.9l2.3-2.3" />
  </Icon>
);
export const Stop = ({ size = 14 }: { size?: number }) => (
  <svg className="i" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.2" fill="currentColor" />
  </svg>
);
/** 权限：一面盾 */
export const Shield = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 3.5l7 2.6v5.4c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6.1z" />
  </Icon>
);

export const Refresh = ({ size = 16 }: { size?: number }) => <Icon size={size}><path d="M20 7v5h-5M4 17v-5h5M6.2 7a7 7 0 0 1 11.6-1L20 9M4 15l2.2 3A7 7 0 0 0 17.8 17" /></Icon>;
export const Download = ({ size = 16 }: { size?: number }) => <Icon size={size}><path d="M12 3v12M7 10l5 5 5-5M4 16v4h16v-4" /></Icon>;
export const Search = ({ size = 16 }: { size?: number }) => <Icon size={size}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></Icon>;
export const Changes = ({ size = 16 }: { size?: number }) => <Icon size={size}><path d="M5 4v16M19 4v16M9 7h6M12 4v6M9 17h6" /></Icon>;
export const Back = ({ size = 16 }: { size?: number }) => <Icon size={size}><path d="m14 5-7 7 7 7" /></Icon>;

export const Trash = ({ size = 14 }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </Icon>
);
