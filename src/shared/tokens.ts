export const tokens = {
  color: {
    orange: '#F3931B',
    orangeDark: '#E48118',
    blue: '#008ED3',
    blueDark: '#024A7A',
    blueLight: '#34AEE2',
    text: '#5E5E5E',
    textDark: '#1A1A1A',
    bg: '#FFFFFF',
    bgSoft: '#F7F7F7',
    border: '#E7E7E7',
    borderSoft: '#F3F3F3'
  },
  font: {
    family: '"Open Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
    h1: '32px',
    h2: '24px',
    h3: '18px',
    body: '15px',
    small: '13px'
  },
  radius: { sm: '6px', md: '10px', lg: '16px', pill: '999px' },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,.04), 0 1px 1px rgba(0,0,0,.03)',
    md: '0 4px 12px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04)',
    lg: '0 12px 32px rgba(2,74,122,.12), 0 4px 8px rgba(0,0,0,.04)'
  },
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' },
  logo: 'https://binus.ac.id/wp-content/uploads/2022/08/logo-binus.svg'
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
