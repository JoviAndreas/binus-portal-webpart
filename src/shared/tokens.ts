export const tokens = {
  color: {
    orange:      'var(--bp-orange)',
    orangeDark:  'var(--bp-orange-dark)',
    blue:        'var(--bp-blue)',
    blueDark:    'var(--bp-blue-dark)',
    blueLight:   'var(--bp-blue-light)',
    text:        'var(--bp-text)',
    textDark:    'var(--bp-text-dark)',
    ink:         'var(--bp-ink)',
    bg:          'var(--bp-bg)',
    bgSoft:      'var(--bp-bg-soft)',
    page:        'var(--bp-page)',
    surfaceAlt:  'var(--bp-surface-alt)',
    tint:        'var(--bp-tint)',
    tintBorder:  'var(--bp-tint-border)',
    border:      'var(--bp-border)',
    line:        'var(--bp-line)',
    inputBorder: 'var(--bp-input-border)',
    inputHover:  'var(--bp-input-hover)',
    borderSoft:  'var(--bp-border-soft)',
    focus:       'var(--bp-focus)',
    placeholder: 'var(--bp-placeholder)',
    danger:      'var(--bp-danger)',
    dangerBg:    'var(--bp-danger-bg)',
    success:     'var(--bp-success)',
    successBg:   'var(--bp-success-bg)',
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
    sm: 'var(--bp-shadow-sm)',
    md: 'var(--bp-shadow-md)',
    lg: 'var(--bp-shadow-lg)',
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
  --bp-orange:       #F3931B;
  --bp-orange-dark:  #E48118;
  --bp-blue:         #008ED3;
  --bp-blue-dark:    #024A7A;
  --bp-blue-light:   #34AEE2;
  --bp-focus:        #008ED3;
  --bp-danger:       #C2362B;
  --bp-success:      #1E7B43;
  --bp-text:         #5E5E5E;
  --bp-text-dark:    #1A1A1A;
  --bp-ink:          #0B2C44;
  --bp-bg:           #FFFFFF;
  --bp-bg-soft:      #F7F7F7;
  --bp-page:         #EEF2F6;
  --bp-surface-alt:  #F4F7FA;
  --bp-tint:         #EAF6FC;
  --bp-tint-border:  #BFE0F2;
  --bp-border:       #E7E7E7;
  --bp-line:         #E4E9ED;
  --bp-input-border: #C7D0D8;
  --bp-input-hover:  #A9B6C0;
  --bp-border-soft:  #F3F3F3;
  --bp-placeholder:  #9AA6B0;
  --bp-danger-bg:    #FBECEC;
  --bp-success-bg:   #E8F6EE;
  --bp-shadow-sm:    0 1px 0 rgba(11,44,68,.04);
  --bp-shadow-md:    0 1px 3px rgba(11,44,68,.08), 0 1px 1px rgba(11,44,68,.04);
  --bp-shadow-lg:    0 6px 20px rgba(11,44,68,.10);
  --bp-font:         "Open Sans","Segoe UI",system-ui,-apple-system,sans-serif;
  --bp-radius-sm:    4px; --bp-radius-md: 6px; --bp-radius-lg: 8px; --bp-radius-pill: 999px;
}
.ms-Fabric.is-dark :root, [data-color-scheme="dark"] :root {
  --bp-text:         #C0C0C0; --bp-text-dark: #F0F0F0; --bp-ink: #D0DDE8;
  --bp-bg:           #1E1E1E; --bp-bg-soft:   #252525; --bp-page: #141414;
  --bp-surface-alt:  #2A2A2A; --bp-tint:      #1A2D3A; --bp-tint-border: #2A4A60;
  --bp-border:       #383838; --bp-line:      #333333; --bp-input-border: #505050;
  --bp-input-hover:  #686868; --bp-border-soft: #2A2A2A; --bp-placeholder: #787878;
  --bp-danger-bg:    #3A1A1A; --bp-success-bg: #1A3024;
  --bp-shadow-sm:    0 1px 0 rgba(0,0,0,.2);
  --bp-shadow-md:    0 1px 3px rgba(0,0,0,.4), 0 1px 1px rgba(0,0,0,.3);
  --bp-shadow-lg:    0 6px 20px rgba(0,0,0,.5);
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
