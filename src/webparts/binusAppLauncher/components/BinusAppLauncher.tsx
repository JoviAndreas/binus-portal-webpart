import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { IAppLink, AppCategory } from '../../../shared/types';
import { AppLinkService } from '../../../shared/AppLinkService';

export interface IBinusAppLauncherProps {
  heading: string;
  subheading: string;
  listTitle: string;
  webUrl: string;
  spHttpClient: SPHttpClient;
}

const CAT_ORDER: AppCategory[] = [
  'Academic',
  'Student',
  'Faculty & Staff',
  'Finance',
  'Library',
  'Schools',
  'BINUS Group',
  'Tools',
  'Other'
];

const CAT_ACCENT: Record<AppCategory, string> = {
  Academic: tokens.color.blue,
  Student: tokens.color.blueLight,
  'Faculty & Staff': tokens.color.blueDark,
  Finance: '#2BAE66',
  Library: '#8E44AD',
  Schools: tokens.color.orange,
  'BINUS Group': tokens.color.orangeDark,
  Tools: '#6B7280',
  Other: '#9CA3AF'
};

const chipStyle = (active: boolean, color: string): React.CSSProperties => ({
  border: `1px solid ${active ? color : tokens.color.border}`,
  background: active ? color : tokens.color.bg,
  color: active ? '#fff' : tokens.color.textDark,
  padding: '7px 14px',
  borderRadius: tokens.radius.pill,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all .15s ease'
});

const iconStyle = (color: string): React.CSSProperties => ({
  width: 36,
  height: 36,
  flex: '0 0 auto',
  borderRadius: tokens.radius.sm,
  background: `${color}1A`,
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 14
});

const styles: { [k: string]: React.CSSProperties } = {
  root: { padding: '32px 8px', background: tokens.color.bg },
  header: { maxWidth: 1200, margin: '0 auto 22px', padding: '0 8px' },
  heading: { fontSize: 28, marginBottom: 6, color: tokens.color.textDark },
  sub: { color: tokens.color.text, fontSize: 15 },
  toolbar: {
    maxWidth: 1200,
    margin: '0 auto 18px',
    padding: '0 8px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  search: {
    flex: '1 1 280px',
    padding: '11px 14px 11px 38px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    background: `${tokens.color.bgSoft} url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="%235E5E5E" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="m15 15-3-3"/></svg>') no-repeat 14px center`,
    fontSize: 14,
    outline: 'none',
    fontFamily: tokens.font.family
  },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catBlock: { maxWidth: 1200, margin: '0 auto', padding: '24px 8px 0' },
  catHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    color: tokens.color.textDark,
    fontSize: 18,
    fontWeight: 700
  },
  catDot: { width: 10, height: 10, borderRadius: 2 },
  catCount: { color: tokens.color.text, fontSize: 13, fontWeight: 500 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12
  },
  tile: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    background: tokens.color.bg,
    textDecoration: 'none',
    color: tokens.color.textDark,
    transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease'
  },
  tileBody: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  tileTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: tokens.color.textDark,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  tileHost: {
    fontSize: 11,
    color: tokens.color.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  loading: { textAlign: 'center', padding: 48, color: tokens.color.text },
  err: {
    textAlign: 'center',
    padding: 24,
    color: '#B91C1C',
    background: '#FEE2E2',
    borderRadius: tokens.radius.md,
    maxWidth: 600,
    margin: '0 auto'
  }
};

function initials(s: string): string {
  return s
    .replace(/binus/i, '')
    .replace(/[^A-Za-z ]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'B';
}

function host(u: string): string {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return u; }
}

export const BinusAppLauncher: React.FC<IBinusAppLauncherProps> = (props) => {
  const [items, setItems] = React.useState<IAppLink[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const [activeCat, setActiveCat] = React.useState<AppCategory | 'All'>('All');

  React.useEffect(() => {
    let alive = true;
    AppLinkService.load(props.spHttpClient, props.webUrl, props.listTitle)
      .then((d) => alive && (setItems(d), setLoading(false)))
      .catch((e) => alive && (setErr(String(e?.message || e)), setLoading(false)));
    return () => { alive = false; };
  }, [props.webUrl, props.listTitle]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((i) => {
      if (activeCat !== 'All' && i.category !== activeCat) return false;
      if (!qq) return true;
      return i.title.toLowerCase().includes(qq) || i.url.toLowerCase().includes(qq);
    });
  }, [items, q, activeCat]);

  const byCat = React.useMemo(() => {
    const map = new Map<AppCategory, IAppLink[]>();
    for (const i of filtered) {
      const a = map.get(i.category) || [];
      a.push(i);
      map.set(i.category, a);
    }
    return map;
  }, [filtered]);

  const cats = CAT_ORDER.filter((c) => (byCat.get(c) || []).length);

  return (
    <section className="bp-root" id="apps" style={styles.root}>
      <div style={styles.header}>
        <h2 style={styles.heading}>{props.heading}</h2>
        <p style={styles.sub}>{props.subheading}</p>
      </div>
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder={`Search ${items.length} apps…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div style={styles.chips}>
          <button
            style={chipStyle(activeCat === 'All', tokens.color.blueDark)}
            onClick={() => setActiveCat('All')}
          >All</button>
          {CAT_ORDER.map((c) => {
            const count = items.filter((i) => i.category === c).length;
            if (!count) return null;
            return (
              <button
                key={c}
                style={chipStyle(activeCat === c, CAT_ACCENT[c])}
                onClick={() => setActiveCat(c)}
              >{c} <span style={{ opacity: 0.65, marginLeft: 4 }}>{count}</span></button>
            );
          })}
        </div>
      </div>

      {loading && <div style={styles.loading}>Loading apps…</div>}
      {err && <div style={styles.err}>Failed to load: {err}</div>}

      {!loading && !err && cats.map((c) => {
        const list = byCat.get(c) || [];
        return (
          <div key={c} style={styles.catBlock}>
            <div style={styles.catHead}>
              <span style={{ ...styles.catDot, background: CAT_ACCENT[c] }} />
              {c}
              <span style={styles.catCount}>· {list.length}</span>
            </div>
            <div style={styles.grid}>
              {list.map((i) => (
                <a
                  key={i.id}
                  href={i.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.tile}
                  title={i.url}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = tokens.shadow.md;
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = CAT_ACCENT[c];
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = '';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = tokens.color.border;
                  }}
                >
                  <span style={iconStyle(CAT_ACCENT[c])}>{initials(i.title)}</span>
                  <span style={styles.tileBody}>
                    <span style={styles.tileTitle}>{i.title}</span>
                    <span style={styles.tileHost}>{host(i.url)}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
};
