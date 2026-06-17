export const tokens = {
  color: {
    orange: '#F3931B',
    orangeDark: '#E48118',
    blue: '#008ED3',
    blueDark: '#024A7A',
    blueLight: '#34AEE2',
    text: '#5E5E5E',
    textDark: '#1A1A1A',
    ink: '#0B2C44',
    bg: '#FFFFFF',
    bgSoft: '#F7F7F7',
    page: '#EEF2F6',
    surfaceAlt: '#F4F7FA',
    tint: '#EAF6FC',
    tintBorder: '#BFE0F2',
    border: '#E7E7E7',
    line: '#E4E9ED',
    inputBorder: '#C7D0D8',
    inputHover: '#A9B6C0',
    borderSoft: '#F3F3F3',
    focus: '#008ED3',
    placeholder: '#9AA6B0',
    danger: '#C2362B',
    dangerBg: '#FBECEC',
    success: '#1E7B43',
    successBg: '#E8F6EE'
  },
  font: {
    family: '"Open Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
    h1: '32px',
    h2: '23px',
    h3: '18px',
    body: '15px',
    small: '13px',
    label: '12px',
    micro: '11.5px'
  },
  radius: { xs: '3px', sm: '4px', md: '6px', lg: '8px', pill: '999px', control: '4px', card: '8px' },
  shadow: {
    sm: '0 1px 0 rgba(11,44,68,.04)',
    md: '0 1px 3px rgba(11,44,68,.08), 0 1px 1px rgba(11,44,68,.04)',
    lg: '0 6px 20px rgba(11,44,68,.10)'
  },
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' },
  logo: 'https://binus.ac.id/wp-content/uploads/2022/08/logo-binus.svg'
};

function svgDataUri(svg: string): string {
  return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
}

import heroBg from './assets/library-bulbs.jpg';
import cardAisle from './assets/library-aisle.jpg';
import cardShelves from './assets/library-shelves.jpg';
import cardBook from './assets/library-book.jpg';

export const photos = {
  heroBg,
  kmap: cardAisle,
  competition: cardShelves,
  ideation: cardBook,
  banner: cardShelves
};

export const patterns = {
  dots: svgDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='2' cy='2' r='1.2' fill='rgba(255,255,255,.18)'/></svg>`
  ),
  grid: svgDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M60 0H0v60' fill='none' stroke='rgba(255,255,255,.10)' stroke-width='1'/></svg>`
  ),
  diag: svgDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M0 32L32 0' stroke='rgba(255,255,255,.10)' stroke-width='1'/></svg>`
  ),
  arcs: svgDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' preserveAspectRatio='none'>
      <defs>
        <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0' stop-color='%23ffffff' stop-opacity='.10'/>
          <stop offset='1' stop-color='%23ffffff' stop-opacity='0'/>
        </linearGradient>
      </defs>
      <circle cx='80' cy='80' r='260' fill='none' stroke='url(%23g)' stroke-width='2'/>
      <circle cx='80' cy='80' r='360' fill='none' stroke='url(%23g)' stroke-width='2'/>
      <circle cx='540' cy='340' r='220' fill='none' stroke='url(%23g)' stroke-width='2'/>
    </svg>`
  ),
  topo: svgDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' preserveAspectRatio='none'>
      <g fill='none' stroke='rgba(255,255,255,.12)' stroke-width='1.2'>
        <path d='M0 480 Q200 380 400 460 T800 420'/>
        <path d='M0 520 Q200 420 400 500 T800 460'/>
        <path d='M0 560 Q200 460 400 540 T800 500'/>
        <path d='M0 440 Q200 340 400 420 T800 380'/>
        <path d='M0 400 Q200 300 400 380 T800 340'/>
      </g>
    </svg>`
  )
};

export function injectTokens(): void {
  const ID = 'binus-portal-tokens';
  if (document.getElementById(ID)) return;
  const css = `
:root {
  --bp-orange: ${tokens.color.orange};
  --bp-orange-dark: ${tokens.color.orangeDark};
  --bp-blue: ${tokens.color.blue};
  --bp-blue-dark: ${tokens.color.blueDark};
  --bp-blue-light: ${tokens.color.blueLight};
  --bp-text: ${tokens.color.text};
  --bp-text-dark: ${tokens.color.textDark};
  --bp-bg: ${tokens.color.bg};
  --bp-bg-soft: ${tokens.color.bgSoft};
  --bp-border: ${tokens.color.border};
  --bp-border-soft: ${tokens.color.borderSoft};
  --bp-font: ${tokens.font.family};
  --bp-radius-sm: ${tokens.radius.sm};
  --bp-radius-md: ${tokens.radius.md};
  --bp-radius-lg: ${tokens.radius.lg};
  --bp-radius-pill: ${tokens.radius.pill};
  --bp-shadow-sm: ${tokens.shadow.sm};
  --bp-shadow-md: ${tokens.shadow.md};
  --bp-shadow-lg: ${tokens.shadow.lg};
}
.bp-root { font-family: var(--bp-font); color: var(--bp-text); line-height: 1.5; }
.bp-root *, .bp-root *::before, .bp-root *::after { box-sizing: border-box; }
.bp-root h1, .bp-root h2, .bp-root h3 { color: var(--bp-text-dark); margin: 0; font-weight: 700; letter-spacing: -0.01em; }
`;
  const el = document.createElement('style');
  el.id = ID;
  el.textContent = css;
  document.head.appendChild(el);
}
