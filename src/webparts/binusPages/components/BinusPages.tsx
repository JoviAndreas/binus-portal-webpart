import * as React from 'react';
import { AadHttpClient, HttpClientResponse } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { Icon } from '../../../shared/Icon';
import { Shimmer, Underline } from '../../../shared/LoadingFX';

export interface IBinusPagesProps {
  heading: string;
  subheading: string;
  apiBaseUrl: string;
  apiResourceUri: string;
  aadClientFactory: { getClient: (resource: string) => Promise<AadHttpClient> };
}

interface ISearchHit {
  binusianId?: string;
  nama?: string;
  namaDep?: string;
  nip?: string;
  weight?: number;
  email?: string;
  position?: string;
  [k: string]: unknown;
}

const styles: { [k: string]: React.CSSProperties } = {
  root: { padding: '32px 8px', background: tokens.color.bg },
  header: { maxWidth: 1200, margin: '0 auto 20px', padding: '0 8px' },
  heading: { fontSize: 26, marginBottom: 6, color: tokens.color.textDark },
  sub: { color: tokens.color.text, fontSize: 14 },
  toolbar: { maxWidth: 1200, margin: '0 auto 18px', padding: '0 8px', display: 'flex', gap: 12 },
  searchWrap: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 14, color: tokens.color.text, pointerEvents: 'none' },
  search: {
    width: '100%',
    padding: '12px 14px 12px 40px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    background: tokens.color.bgSoft,
    fontSize: 14,
    outline: 'none',
    fontFamily: tokens.font.family,
    color: tokens.color.textDark
  },
  grid: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '14px 16px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    background: tokens.color.bg,
    textDecoration: 'none',
    color: tokens.color.textDark,
    transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease'
  },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.pill,
    background: `${tokens.color.blue}1A`,
    color: tokens.color.blue,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    flex: '0 0 auto'
  },
  name: { fontSize: 14, fontWeight: 700, color: tokens.color.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  email: { fontSize: 12, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 12, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', padding: 40, color: tokens.color.text, fontSize: 14 },
  err: { textAlign: 'center', padding: 24, color: '#B91C1C', background: '#FEE2E2', borderRadius: tokens.radius.md, maxWidth: 600, margin: '0 auto' }
};

function initials(s: string): string {
  return (s || '?')
    .replace(/[^A-Za-z ]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export const BinusPages: React.FC<IBinusPagesProps> = (props) => {
  const [q, setQ] = React.useState('');
  const debounced = useDebouncedValue(q, 350);
  const [hits, setHits] = React.useState<ISearchHit[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setErr(null);
    if (!debounced.trim()) { setHits(null); return; }
    setLoading(true);
    const url = `${props.apiBaseUrl.replace(/\/$/, '')}/Search?search=${encodeURIComponent(debounced.trim())}`;
    props.aadClientFactory
      .getClient(props.apiResourceUri)
      .then((c) => c.get(url, AadHttpClient.configurations.v1))
      .then((r: HttpClientResponse) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data: ISearchHit[]) => { if (alive) { setHits(data || []); setLoading(false); } })
      .catch((e: Error) => { if (alive) { setErr(e.message || String(e)); setLoading(false); } });
    return () => { alive = false; };
  }, [debounced, props.apiBaseUrl, props.apiResourceUri, props.aadClientFactory]);

  const mailHref = (hit: ISearchHit): string | undefined =>
    hit.email ? `mailto:${hit.email}` : undefined;

  return (
    <section className="bp-root" style={styles.root}>
      <div style={styles.header}>
        <h2 style={styles.heading}><Underline>{props.heading}</Underline></h2>
        {props.subheading && <p style={styles.sub}>{props.subheading}</p>}
      </div>
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}><Icon name="search" size={16} /></span>
          <input
            style={styles.search}
            placeholder="Search name, email, department"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
          />
        </div>
      </div>

      {err && <div style={styles.err}>Failed to load: {err}</div>}

      {loading && (
        <div style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => <Shimmer key={i} height={82} />)}
        </div>
      )}

      {!loading && hits && hits.length === 0 && !err && (
        <div style={styles.empty}>No matches for &quot;{debounced}&quot;.</div>
      )}

      {!loading && hits && hits.length > 0 && (
        <div style={styles.grid}>
          {hits.slice(0, 60).map((h, i) => {
            const mail = mailHref(h);
            const Wrapper = mail ? 'a' : 'div';
            const wrapperProps: React.HTMLAttributes<HTMLElement> & { href?: string } = {
              className: 'bp-fade-up',
              style: { ...styles.card, animationDelay: `${Math.min(i, 12) * 30}ms` },
              onMouseEnter: (e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = tokens.shadow.md;
                (e.currentTarget as HTMLElement).style.borderColor = tokens.color.blue;
              },
              onMouseLeave: (e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
                (e.currentTarget as HTMLElement).style.borderColor = tokens.color.border;
              }
            };
            if (mail) wrapperProps.href = mail;
            const name = h.nama || 'Unnamed';
            const dep = h.namaDep || '';
            const nip = h.nip || h.binusianId || '';
            return (
              <Wrapper key={(h.binusianId || '') + i} {...wrapperProps}>
                <div style={styles.avatarRow}>
                  <span style={styles.avatar}>{initials(name)}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={styles.name}>{name}</span>
                    {h.email && <span style={styles.email}>{h.email}</span>}
                  </span>
                </div>
                {dep && <span style={styles.meta}>{dep}</span>}
                {nip && <span style={{ ...styles.meta, fontSize: 11, opacity: 0.8 }}>NIP {nip}</span>}
              </Wrapper>
            );
          })}
        </div>
      )}

      {!loading && !hits && !err && (
        <div style={styles.empty}>Start typing to search BinusPages.</div>
      )}
    </section>
  );
};
