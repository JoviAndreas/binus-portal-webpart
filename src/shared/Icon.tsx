import * as React from 'react';

export type IconName =
  | 'bookOpen'
  | 'network'
  | 'upload'
  | 'message'
  | 'graduationCap'
  | 'userGraduate'
  | 'users'
  | 'wallet'
  | 'school'
  | 'building'
  | 'wrench'
  | 'grid'
  | 'arrowRight'
  | 'search'
  | 'sparkles';

const PATHS: Record<IconName, React.ReactNode> = {
  bookOpen: (
    <>
      <path d="M2 4h7a3 3 0 0 1 3 3v13" />
      <path d="M22 4h-7a3 3 0 0 0-3 3v13" />
      <path d="M2 4v15h7a3 3 0 0 1 3 1" />
      <path d="M22 4v15h-7a3 3 0 0 0-3 1" />
    </>
  ),
  network: (
    <>
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <path d="M12 8v4" />
      <path d="M5 16v-2h14v2" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
    </>
  ),
  graduationCap: (
    <>
      <path d="M22 10L12 4 2 10l10 6 10-6z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
      <path d="M22 10v6" />
    </>
  ),
  userGraduate: (
    <>
      <path d="M3 8l9-4 9 4-9 4-9-4z" />
      <path d="M7 10v4a5 5 0 0 0 10 0v-4" />
      <path d="M12 12v9" />
      <path d="M8 21h8" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M16 12h6v4h-6a2 2 0 0 1 0-4z" />
    </>
  ),
  school: (
    <>
      <path d="M12 3l10 6-10 6L2 9l10-6z" />
      <path d="M6 11v6a6 6 0 0 0 12 0v-6" />
      <path d="M12 15v6" />
    </>
  ),
  building: (
    <>
      <rect x="3" y="3" width="8" height="18" rx="1" />
      <rect x="13" y="8" width="8" height="13" rx="1" />
      <path d="M6 7h2M6 11h2M6 15h2M16 12h2M16 16h2" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.5l-9 9-3-3 9-9z" />
      <path d="M9 10L3 4l3-3 6 6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 4l.8 2.2L22 7l-2.2.8L19 10l-.8-2.2L16 7l2.2-.8z" />
    </>
  )
};

export interface IIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IIconProps> = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    style={style}
  >
    {PATHS[name]}
  </svg>
);
