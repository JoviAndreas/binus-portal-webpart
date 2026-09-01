import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { Icon } from '../../../shared/Icon';
import { Shimmer, Underline } from '../../../shared/LoadingFX';
import { PersonAvatar } from './PersonAvatar';
import { QuickActions } from './QuickActions';
import { PersonDrawer } from './PersonDrawer';
import { BinusPagesApi, ISearchHit, ISnapshotEntry } from '../api';

export interface IBinusPagesProps {
  heading: string;
  subheading: string;
  apiBaseUrl: string;
  apiResourceUri: string;
  agentBaseUrl: string;
  agentResourceUri: string;
  aadClientFactory: { getClient: (resource: string) => Promise<AadHttpClient> };
  webUrl: string;
  currentUserEmail: string;
}

type Mode = 'simple' | 'advanced';
type GroupBy = 'none' | 'dep';
const PAGE_SIZE = 12;

const RECENT_KEY = 'bp:binuspages:recent';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string): string[] {
  const prev = loadRecent();
  const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  return next;
}

function removeRecent(q: string): string[] {
  const next = loadRecent().filter((x) => x.toLowerCase() !== q.toLowerCase());
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  return next;
}

function clearRecent(): string[] {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* storage blocked */
  }
  return [];
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function snapToHit(s: ISnapshotEntry): ISearchHit {
  return {
    binusianId: s.id,
    nama: s.name?.trim() || s.id,
    namaDep: s.dep,
    namaBu: s.bu,
    namaDiv: s.div,
    namaGroupbu: s.groupbu,
    email: s.email,
    nip: s.nip || ''
  };
}

function localFilter(snap: ISnapshotEntry[], q: string, limit = 200): ISearchHit[] {
  const qq = q.toLowerCase();
  const out: ISearchHit[] = [];
  for (const s of snap) {
    if (
      s.name?.toLowerCase().includes(qq) ||
      s.email?.toLowerCase().includes(qq) ||
      s.dep?.toLowerCase().includes(qq) ||
      s.id?.toLowerCase().includes(qq)
    ) {
      out.push(snapToHit(s));
      if (out.length >= limit) break;
    }
  }
  return out;
}

const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  border: 'none',
  background: active ? tokens.color.blue : tokens.color.bg,
  color: active ? '#fff' : tokens.color.textDark,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
});

const styles: { [k: string]: React.CSSProperties } = {
  root: { padding: '32px 8px', background: tokens.color.bg },
  header: { maxWidth: 1200, margin: '0 auto 16px', padding: '0 8px' },
  heading: { fontSize: 26, marginBottom: 6, color: tokens.color.textDark },
  sub: { color: tokens.color.text, fontSize: 14 },
  toolbar: { maxWidth: 1200, margin: '0 auto 14px', padding: '0 8px', display: 'flex', gap: 12, flexWrap: 'wrap' },
  searchWrap: { flex: '1 1 280px', position: 'relative', display: 'flex', alignItems: 'center' },
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
  toggleGroup: { display: 'inline-flex', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.pill, overflow: 'hidden' },
  advRow: {
    maxWidth: 1200,
    margin: '0 auto 16px',
    padding: '0 8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 8
  },
  advField: {
    padding: '8px 12px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    background: tokens.color.bg,
    fontSize: 13,
    outline: 'none',
    fontFamily: tokens.font.family,
    color: tokens.color.textDark
  },
  recentRow: {
    maxWidth: 1200,
    margin: '0 auto 18px',
    padding: '0 8px',
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  recentLabel: { fontSize: 12, color: tokens.color.text, marginRight: 4 },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    background: tokens.color.bg,
    color: tokens.color.textDark,
    cursor: 'pointer',
    fontSize: 12
  },
  grid: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '14px 16px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    background: tokens.color.bg,
    cursor: 'pointer',
    transition: 'transform .15s, box-shadow .15s, border-color .15s'
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
  name: { fontSize: 14, fontWeight: 700, color: tokens.color.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  email: { fontSize: 12, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 12, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  groupHead: {
    maxWidth: 1200,
    margin: '20px auto 8px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: tokens.color.textDark,
    fontSize: 14,
    fontWeight: 700
  },
  empty: { textAlign: 'center', padding: 40, color: tokens.color.text, fontSize: 14 },
  err: { textAlign: 'center', padding: 24, color: '#B91C1C', background: '#FEE2E2', borderRadius: tokens.radius.md, maxWidth: 600, margin: '0 auto' }
};

export const BinusPages: React.FC<IBinusPagesProps> = (props) => {
  const api = React.useMemo(
    () => new BinusPagesApi(props.aadClientFactory, props.apiResourceUri, props.apiBaseUrl),
    [props.aadClientFactory, props.apiResourceUri, props.apiBaseUrl]
  );
  const agentApi = api;

  const [mode, setMode] = React.useState<Mode>('simple');
  const [groupBy, setGroupBy] = React.useState<GroupBy>('none');
  const [q, setQ] = React.useState('');
  const [keyword2, setKeyword2] = React.useState('');
  const [conditional, setConditional] = React.useState('');
  const [category1, setCategory1] = React.useState('');
  const [category2, setCategory2] = React.useState('');
  const debounced = useDebouncedValue(q, 80);

  const [hits, setHits] = React.useState<ISearchHit[] | null>(null);
  const [page, setPage] = React.useState(1);
  React.useEffect(() => { setPage(1); }, [hits]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [recent, setRecent] = React.useState<string[]>(() => loadRecent());
  const [selected, setSelected] = React.useState<ISearchHit | null>(null);
  const snapRef = React.useRef<ISnapshotEntry[] | null>(null);
  const snapLoadingRef = React.useRef<boolean>(false);
  const warmedRef = React.useRef<boolean>(false);
  const popularRef = React.useRef<ISnapshotEntry[] | null>(null);

  const loadPopular = React.useCallback(async (): Promise<void> => {
    if (popularRef.current) return;
    try {
      const d = await api.popular(50);
      if (d) popularRef.current = d;
    } catch { /* silent */ }
  }, [api]);

  const ensureSnapshot = React.useCallback(async (): Promise<void> => {
    if (snapRef.current || snapLoadingRef.current) return;
    snapLoadingRef.current = true;
    try {
      const data = await api.snapshot();
      if (data) snapRef.current = data;
    } catch { /* fall back to per-query */ }
    snapLoadingRef.current = false;
  }, [api]);

  const handleFocus = React.useCallback((): void => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    void api.warm();
    void ensureSnapshot();
  }, [api, ensureSnapshot]);

  React.useEffect(() => {
    let alive = true;
    setErr(null);

    if (mode !== 'simple') return () => { alive = false; };
    const qq = debounced.trim();
    if (!qq) {
      void Promise.all([loadPopular(), ensureSnapshot()]).then(() => {
        if (!alive) return;
        const pop = popularRef.current;
        if (pop && pop.length > 0) {
          setHits(pop.map((s) => snapToHit(s)));
          return;
        }
        const snap = snapRef.current;
        if (snap && snap.length > 0) {
          setHits(snap.slice(0, 50).map((s) => snapToHit(s)));
          return;
        }
        setHits(null);
      });
      return () => { alive = false; };
    }

    if (snapRef.current) {
      const filtered = localFilter(snapRef.current, qq);
      setHits(filtered);
      setLoading(false);
      setRecent(saveRecent(qq));
      return () => { alive = false; };
    }

    setLoading(true);
    api.search(qq)
      .then((d) => { if (!alive) return; setHits(d || []); setLoading(false); setRecent(saveRecent(qq)); })
      .catch((e: Error) => { if (alive) { setErr(e.message); setLoading(false); } });
    void ensureSnapshot();
    return () => { alive = false; };
  }, [debounced, mode, api, ensureSnapshot]);

  const runAdvanced = React.useCallback((): void => {
    if (!keyword2 && !category1 && !category2 && !q.trim()) return;
    setLoading(true);
    setErr(null);
    api.searchAdvanced({
      keyword1: q.trim(),
      keyword2: keyword2.trim(),
      conditional,
      category1,
      category2
    })
      .then((d) => { setHits(d || []); setLoading(false); })
      .catch((e: Error) => { setErr(e.message); setLoading(false); });
  }, [q, keyword2, conditional, category1, category2, api]);

  const grouped = React.useMemo(() => {
    if (!hits || groupBy === 'none') return null;
    const map = new Map<string, ISearchHit[]>();
    for (const h of hits) {
      const k = (h.namaDep || h.namaDiv || h.namaBu || h.namaGroupbu || '- Unspecified -').trim();
      const a = map.get(k) || [];
      a.push(h);
      map.set(k, a);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [hits, groupBy]);

  const renderCard = (h: ISearchHit, i: number): React.ReactElement => (
    <div
      key={(h.binusianId || '') + i}
      className="bp-fade-up"
      style={{ ...styles.card, animationDelay: `${Math.min(i, 12) * 25}ms` }}
      onClick={() => { setSelected(h); if (h.binusianId) void api.click(h.binusianId); }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = tokens.shadow.md;
        (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.blue;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.border;
      }}
    >
      <div style={styles.cardTop}>
        <PersonAvatar name={h.nama || ''} email={h.email} webUrl={props.webUrl} size={44} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={styles.name}>{h.nama || 'Unnamed'}</span>
          {h.email && <span style={styles.email}>{h.email}</span>}
          {(h.namaDep || h.namaDiv || h.namaBu || h.namaGroupbu) && (
            <span style={styles.meta}>{h.namaDep || h.namaDiv || h.namaBu || h.namaGroupbu}</span>
          )}
        </div>
      </div>
      <QuickActions email={h.email} />
    </div>
  );

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
            placeholder={mode === 'simple' ? 'Search name, email, department' : 'Primary keyword'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'advanced') runAdvanced(); }}
            type="search"
          />
        </div>
        <div style={styles.toggleGroup}>
          <button style={toggleBtnStyle(groupBy === 'none')} onClick={() => setGroupBy('none')}>List</button>
          <button style={toggleBtnStyle(groupBy === 'dep')} onClick={() => setGroupBy('dep')}>By dept</button>
        </div>
      </div>

      {mode === 'advanced' && (
        <div style={styles.advRow}>
          <input style={styles.advField} placeholder="Secondary keyword" value={keyword2} onChange={(e) => setKeyword2(e.target.value)} />
          <select style={styles.advField} value={conditional} onChange={(e) => setConditional(e.target.value)}>
            <option value="">Conditional (AND/OR)</option>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          <select style={styles.advField} value={category1} onChange={(e) => setCategory1(e.target.value)}>
            <option value="">Primary category</option>
            <option value="Name">Name</option>
            <option value="Email">Email</option>
            <option value="Position">Position</option>
            <option value="Department">Department</option>
            <option value="Research">Research</option>
          </select>
          <select style={styles.advField} value={category2} onChange={(e) => setCategory2(e.target.value)}>
            <option value="">Secondary category</option>
            <option value="Name">Name</option>
            <option value="Email">Email</option>
            <option value="Position">Position</option>
            <option value="Department">Department</option>
            <option value="Research">Research</option>
          </select>
          <button style={{ ...toggleBtnStyle(true), borderRadius: tokens.radius.sm }} onClick={runAdvanced}>Run</button>
        </div>
      )}

      {!q && recent.length > 0 && (
        <div style={styles.recentRow}>
          <span style={styles.recentLabel}>Recent:</span>
          {recent.map((r) => (
            <span
              key={r}
              style={{ ...styles.chip, padding: '5px 6px 5px 10px', gap: 4 }}
            >
              <button
                onClick={() => setQ(r)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontSize: 12,
                  padding: 0
                }}
                aria-label={`Search ${r}`}
              >
                <Icon name="search" size={11} /> {r}
              </button>
              <button
                onClick={() => setRecent(removeRecent(r))}
                title={`Remove "${r}" from history`}
                aria-label={`Remove ${r}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: tokens.color.text,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2';
                  (e.currentTarget as HTMLButtonElement).style.color = '#B91C1C';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = tokens.color.text;
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={() => setRecent(clearRecent())}
            style={{
              border: 'none',
              background: 'transparent',
              color: tokens.color.text,
              cursor: 'pointer',
              fontSize: 12,
              textDecoration: 'underline',
              padding: '4px 6px'
            }}
            title="Clear all recent searches"
          >
            Clear all
          </button>
        </div>
      )}

      {err && <div style={styles.err}>Failed to load: {err}</div>}

      {loading && (
        <div style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => <Shimmer key={i} height={110} />)}
        </div>
      )}

      {!loading && hits && hits.length === 0 && !err && (
        <div style={styles.empty}>No matches.</div>
      )}

      {!loading && hits && hits.length > 0 && groupBy === 'none' && (
        <>
          <div style={styles.grid}>
            {hits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(renderCard)}
            {Array.from({ length: Math.max(0, PAGE_SIZE - (hits.length - (page - 1) * PAGE_SIZE)) }).map((_, i) => (
              <div key={`filler-${i}`} style={{ visibility: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
                {renderCard({ nama: 'Filler Name', email: 'filler@binus.edu', namaDep: 'Filler Department' }, i)}
              </div>
            ))}
          </div>
          {hits.length > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button
                style={{ ...toggleBtnStyle(false), opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={{ fontSize: 13, color: tokens.color.text }}>
                Page {page} of {Math.ceil(hits.length / PAGE_SIZE)} ({hits.length} results)
              </span>
              <button
                style={{
                  ...toggleBtnStyle(false),
                  opacity: page >= Math.ceil(hits.length / PAGE_SIZE) ? 0.4 : 1,
                  cursor: page >= Math.ceil(hits.length / PAGE_SIZE) ? 'default' : 'pointer'
                }}
                disabled={page >= Math.ceil(hits.length / PAGE_SIZE)}
                onClick={() => setPage((p) => Math.min(Math.ceil(hits.length / PAGE_SIZE), p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {!loading && hits && hits.length > 0 && grouped && (
        <>
          {grouped.map(([dep, list]) => (
            <div key={dep}>
              <div style={styles.groupHead}>
                <span style={{
                  display: 'inline-flex',
                  width: 22, height: 22,
                  borderRadius: 6,
                  background: `${tokens.color.blue}1A`,
                  color: tokens.color.blue,
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon name="building" size={12} strokeWidth={2} />
                </span>
                {dep}
                <span style={{ fontSize: 12, color: tokens.color.text, fontWeight: 500 }}>{list.length}</span>
              </div>
              <div style={styles.grid}>{list.map(renderCard)}</div>
            </div>
          ))}
        </>
      )}

      {!loading && !hits && !err && (
        <div style={styles.empty}>Start typing to search BinusPages.</div>
      )}

      {selected && (
        <PersonDrawer
          hit={selected}
          api={api}
          agentApi={agentApi}
          webUrl={props.webUrl}
          currentUserEmail={props.currentUserEmail}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
};
