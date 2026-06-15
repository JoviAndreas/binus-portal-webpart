import * as React from 'react';

interface IIllustrationProps {
  primary: string;
  accent?: string;
  style?: React.CSSProperties;
}

export const KnowledgeMapArt: React.FC<IIllustrationProps> = ({ primary, accent = '#fff', style }) => (
  <svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block', ...style }} aria-hidden="true">
    <defs>
      <linearGradient id="km-bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={primary} />
        <stop offset="1" stopColor={primary} stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <rect width="600" height="360" fill="url(#km-bg)" />
    <g stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" fill="none">
      <line x1="180" y1="120" x2="300" y2="180" />
      <line x1="300" y1="180" x2="430" y2="100" />
      <line x1="300" y1="180" x2="430" y2="240" />
      <line x1="300" y1="180" x2="170" y2="260" />
      <line x1="430" y1="100" x2="500" y2="200" />
      <line x1="430" y1="240" x2="500" y2="200" />
      <line x1="170" y1="260" x2="100" y2="200" />
      <line x1="180" y1="120" x2="100" y2="200" />
    </g>
    <g fill={accent}>
      <circle cx="180" cy="120" r="9" />
      <circle cx="430" cy="100" r="9" />
      <circle cx="500" cy="200" r="9" />
      <circle cx="430" cy="240" r="9" />
      <circle cx="170" cy="260" r="9" />
      <circle cx="100" cy="200" r="9" />
    </g>
    <circle cx="300" cy="180" r="22" fill={accent} />
    <circle cx="300" cy="180" r="14" fill={primary} />
  </svg>
);

export const TrophyArt: React.FC<IIllustrationProps> = ({ primary, accent = '#fff', style }) => (
  <svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block', ...style }} aria-hidden="true">
    <defs>
      <linearGradient id="tr-bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={primary} />
        <stop offset="1" stopColor={primary} stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <rect width="600" height="360" fill="url(#tr-bg)" />
    <g fill={accent} opacity="0.9">
      <path d="M260 100h80c6 0 10 4 10 10v50c0 35-22 64-50 64s-50-29-50-64v-50c0-6 4-10 10-10z" />
      <path d="M240 130h-20c-12 0-20 8-20 20v10c0 18 14 32 32 32 6 0 12-2 16-4" fill="none" stroke={accent} strokeWidth="6" />
      <path d="M360 130h20c12 0 20 8 20 20v10c0 18-14 32-32 32-6 0-12-2-16-4" fill="none" stroke={accent} strokeWidth="6" />
      <rect x="280" y="220" width="40" height="30" />
      <rect x="240" y="246" width="120" height="14" rx="3" />
      <path d="M250 270h100l-10 24h-80z" />
    </g>
    <g fill={accent} opacity="0.45">
      <circle cx="120" cy="80" r="3" />
      <circle cx="480" cy="60" r="4" />
      <circle cx="500" cy="280" r="3" />
      <circle cx="90" cy="260" r="4" />
      <path d="M150 200l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" />
      <path d="M460 320l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
    </g>
  </svg>
);

export const IdeaArt: React.FC<IIllustrationProps> = ({ primary, accent = '#fff', style }) => (
  <svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block', ...style }} aria-hidden="true">
    <defs>
      <linearGradient id="id-bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={primary} />
        <stop offset="1" stopColor={primary} stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <rect width="600" height="360" fill="url(#id-bg)" />
    <g stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9">
      <path d="M300 100c-44 0-72 32-72 70 0 28 16 46 28 60 6 8 8 14 8 22v8h72v-8c0-8 2-14 8-22 12-14 28-32 28-60 0-38-28-70-72-70z" fill={accent} fillOpacity="0.15" />
      <line x1="278" y1="280" x2="322" y2="280" />
      <line x1="285" y1="296" x2="315" y2="296" />
    </g>
    <g stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.6">
      <line x1="300" y1="56" x2="300" y2="76" />
      <line x1="210" y1="92" x2="226" y2="106" />
      <line x1="390" y1="92" x2="374" y2="106" />
      <line x1="175" y1="170" x2="195" y2="170" />
      <line x1="425" y1="170" x2="405" y2="170" />
    </g>
    <g fill={accent} opacity="0.35">
      <circle cx="120" cy="280" r="40" />
      <circle cx="500" cy="290" r="50" />
    </g>
  </svg>
);

export const CityArt: React.FC<IIllustrationProps> = ({ primary, accent = '#fff', style }) => (
  <svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block', ...style }} aria-hidden="true">
    <rect width="1600" height="600" fill={primary} />
    <g fill={accent} opacity="0.08">
      <rect x="0" y="380" width="160" height="220" />
      <rect x="170" y="320" width="120" height="280" />
      <rect x="300" y="260" width="140" height="340" />
      <rect x="450" y="350" width="100" height="250" />
      <rect x="560" y="200" width="180" height="400" />
      <rect x="750" y="280" width="130" height="320" />
      <rect x="890" y="180" width="160" height="420" />
      <rect x="1060" y="320" width="140" height="280" />
      <rect x="1210" y="240" width="170" height="360" />
      <rect x="1390" y="340" width="120" height="260" />
      <rect x="1520" y="280" width="80" height="320" />
    </g>
    <g fill={accent} opacity="0.18">
      {Array.from({ length: 80 }).map((_, i) => {
        const x = (i * 89) % 1600;
        const y = 200 + ((i * 47) % 360);
        const w = 4;
        const h = 6;
        return <rect key={i} x={x} y={y} width={w} height={h} />;
      })}
    </g>
    <g stroke={accent} strokeOpacity="0.10" strokeWidth="1" fill="none">
      <path d="M0 540 Q400 500 800 540 T1600 520" />
      <path d="M0 580 Q400 540 800 580 T1600 560" />
    </g>
  </svg>
);
