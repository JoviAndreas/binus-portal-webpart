import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { IAppLink } from '../../../shared/types';
import { AppLinkService } from '../../../shared/AppLinkService';
import { Icon, IconName } from '../../../shared/Icon';
import { ICategoriesConfig } from '../../../shared/categoriesConfig';
import { Shimmer, Underline } from '../../../shared/LoadingFX';

const PIN_KEY = 'bp:applauncher:pins';

function loadPins(): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch { return new Set(); }
}

function savePins(s: Set<string>): void {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(Array.from(s))); } catch { /* ignore */ }
}

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/>
  </svg>
);

async function addAppToList(client: SPHttpClient, webUrl: string, listTitle: string, title: string, url: string): Promise<boolean> {
  const ep = `${webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`;
  const body = JSON.stringify({ Title: title, URL: { Url: url, Description: url } });
  const res = await client.post(ep, SPHttpClient.configurations.v1, {
    headers: { Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=nometadata' },
    body
  });
  return res.ok;
}

export interface IBinusAppLauncherProps {
  heading: string;
  subheading: string;
  listTitle: string;
  webUrl: string;
  spHttpClient: SPHttpClient;
  config: ICategoriesConfig;
}

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
  justifyContent: 'center'
});

const styles: { [k: string]: React.CSSProperties } = {
  root: { padding: '32px 8px', background: tokens.color.bg },
  header: { maxWidth: 1200, margin: '0 auto 22px', padding: '0 8px' },
  heading: { fontSize: 26, marginBottom: 6, color: tokens.color.textDark },
  sub: { color: tokens.color.text, fontSize: 14 },
  toolbar: {
    maxWidth: 1200,
    margin: '0 auto 18px',
    padding: '0 8px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchWrap: { flex: '1 1 280px', position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 14, color: tokens.color.text, pointerEvents: 'none' },
  search: {
    width: '100%',
    padding: '11px 14px 11px 40px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    background: tokens.color.bgSoft,
    fontSize: 14,
    outline: 'none',
    fontFamily: tokens.font.family,
    color: tokens.color.textDark
  },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catBlock: { maxWidth: 1200, margin: '0 auto', padding: '24px 8px 0' },
  catHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    color: tokens.color.textDark,
    fontSize: 16,
    fontWeight: 700
  },
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
  tileTitle: { fontSize: 14, fontWeight: 600, color: tokens.color.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tileHost: { fontSize: 11, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  loading: { textAlign: 'center', padding: 48, color: tokens.color.text },
  err: { textAlign: 'center', padding: 24, color: '#B91C1C', background: '#FEE2E2', borderRadius: tokens.radius.md, maxWidth: 600, margin: '0 auto' }
};

function host(u: string): string {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return u; }
}

export const BinusAppLauncher: React.FC<IBinusAppLauncherProps> = (props) => {
  const [items, setItems] = React.useState<IAppLink[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const [activeCat, setActiveCat] = React.useState<string>('all');
  const [pins, setPins] = React.useState<Set<string>>(() => loadPins());
  const [addOpen, setAddOpen] = React.useState(false);
  const [addTitle, setAddTitle] = React.useState('');
  const [addUrl, setAddUrl] = React.useState('');
  const [addBusy, setAddBusy] = React.useState(false);
  const [addErr, setAddErr] = React.useState<string | null>(null);

  const reload = React.useCallback((): void => {
    setLoading(true);
    AppLinkService.load(props.spHttpClient, props.webUrl, props.listTitle, props.config)
      .then((d) => { setItems(d); setLoading(false); })
      .catch((e) => { setErr(String(e?.message || e)); setLoading(false); });
  }, [props.spHttpClient, props.webUrl, props.listTitle, props.config]);

  React.useEffect(() => {
    let alive = true;
    AppLinkService.load(props.spHttpClient, props.webUrl, props.listTitle, props.config)
      .then((d) => alive && (setItems(d), setLoading(false)))
      .catch((e) => alive && (setErr(String(e?.message || e)), setLoading(false)));
    return () => { alive = false; };
  }, [props.webUrl, props.listTitle, props.config, props.spHttpClient]);

  const togglePin = (id: string): void => {
    const next = new Set(pins);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPins(next);
    savePins(next);
  };

  const pinnedItems = React.useMemo(
    () => items.filter((i) => pins.has(String(i.id))),
    [items, pins]
  );

  async function submitAdd(): Promise<void> {
    const t = addTitle.trim();
    let u = addUrl.trim();
    if (!t) { setAddErr('Title required'); return; }
    if (!u) { setAddErr('URL required'); return; }
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    setAddBusy(true); setAddErr(null);
    try {
      const ok = await addAppToList(props.spHttpClient, props.webUrl, props.listTitle, t, u);
      if (!ok) { setAddErr('Failed to save (check permissions)'); setAddBusy(false); return; }
      setAddOpen(false); setAddTitle(''); setAddUrl(''); setAddBusy(false);
      reload();
    } catch (e) {
      setAddErr(String((e as Error).message || e));
      setAddBusy(false);
    }
  }

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((i) => {
      if (activeCat !== 'all' && i.category.key !== activeCat) return false;
      if (!qq) return true;
      return i.title.toLowerCase().includes(qq) || i.url.toLowerCase().includes(qq);
    });
  }, [items, q, activeCat]);

  const order = React.useMemo(() => [...props.config.categories.map((c) => c.key), 'other'], [props.config]);

  const byCat = React.useMemo(() => {
    const map = new Map<string, IAppLink[]>();
    for (const i of filtered) {
      const a = map.get(i.category.key) || [];
      a.push(i);
      map.set(i.category.key, a);
    }
    return map;
  }, [filtered]);

  return (
    <section className="bp-root" id="apps" style={styles.root}>
      <div style={styles.header}>
        <h2 style={styles.heading}><Underline>{props.heading}</Underline></h2>
        {props.subheading && <p style={styles.sub}>{props.subheading}</p>}
      </div>
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}><Icon name="search" size={16} /></span>
          <input style={styles.search} placeholder="Search apps" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            border: `1px solid ${tokens.color.blue}`,
            background: tokens.color.bg,
            color: tokens.color.blue,
            padding: '8px 14px', borderRadius: tokens.radius.pill,
            fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
        >+ Add app</button>
        <div style={styles.chips}>
          <button
            style={chipStyle(activeCat === 'all', tokens.color.blueDark)}
            onClick={() => setActiveCat('all')}
          >All</button>
          {props.config.categories.map((c) => {
            const count = items.filter((i) => i.category.key === c.key).length;
            if (!count) return null;
            const active = activeCat === c.key;
            return (
              <button key={c.key} style={chipStyle(active, c.color)} onClick={() => setActiveCat(c.key)}>
                {c.label} <span style={{ opacity: 0.65, marginLeft: 4 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 8px 0' }}>
          <div style={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Shimmer key={i} height={66} />
            ))}
          </div>
        </div>
      )}
      {err && <div style={styles.err}>Failed to load: {err}</div>}

      {!loading && !err && pinnedItems.length > 0 && (
        <div style={styles.catBlock}>
          <div style={styles.catHead}>
            <span style={{
              display: 'inline-flex', width: 26, height: 26,
              alignItems: 'center', justifyContent: 'center',
              borderRadius: 7,
              background: `${tokens.color.orange}1A`,
              color: tokens.color.orange
            }}>
              <StarIcon filled />
            </span>
            Pinned
            <span style={styles.catCount}>{pinnedItems.length}</span>
          </div>
          <div style={styles.grid}>
            {pinnedItems.map((i) => (
              <div key={'pin' + i.id} style={{ position: 'relative' }}>
                <a
                  href={i.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.tile}
                  title={i.url}
                >
                  <span style={iconStyle(i.category.color)}>
                    <Icon name={i.category.icon as IconName} size={18} strokeWidth={2} />
                  </span>
                  <span style={styles.tileBody}>
                    <span style={styles.tileTitle}>{i.title}</span>
                    <span style={styles.tileHost}>{host(i.url)}</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(String(i.id)); }}
                  title="Unpin"
                  style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: tokens.color.orange, cursor: 'pointer', padding: 4 }}
                >
                  <StarIcon filled />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !err && order.map((key) => {
        const list = byCat.get(key) || [];
        if (!list.length) return null;
        const cat = list[0].category;
        return (
          <div key={key} style={styles.catBlock}>
            <div style={styles.catHead}>
              <span style={{
                display: 'inline-flex',
                width: 26,
                height: 26,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 7,
                background: `${cat.color}1A`,
                color: cat.color
              }}>
                <Icon name={cat.icon as IconName} size={14} strokeWidth={2} />
              </span>
              {cat.label}
              <span style={styles.catCount}>{list.length}</span>
            </div>
            <div style={styles.grid}>
              {list.map((i) => {
                const id = String(i.id);
                const pinned = pins.has(id);
                return (
                  <div key={i.id} style={{ position: 'relative' }}>
                    <a
                      href={i.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.tile}
                      title={i.url}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = tokens.shadow.md;
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = cat.color;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.transform = '';
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = tokens.color.border;
                      }}
                    >
                      <span style={iconStyle(cat.color)}>
                        <Icon name={cat.icon as IconName} size={18} strokeWidth={2} />
                      </span>
                      <span style={styles.tileBody}>
                        <span style={styles.tileTitle}>{i.title}</span>
                        <span style={styles.tileHost}>{host(i.url)}</span>
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(id); }}
                      title={pinned ? 'Unpin' : 'Pin to favorites'}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: pinned ? tokens.color.orange : tokens.color.text, cursor: 'pointer', padding: 4, opacity: pinned ? 1 : 0.55 }}
                    >
                      <StarIcon filled={pinned} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {addOpen && (
        <div onClick={() => !addBusy && setAddOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,18,30,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: tokens.color.bg, borderRadius: tokens.radius.md, padding: 24, width: 'min(440px, 90vw)', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <h3 style={{ margin: '0 0 12px', color: tokens.color.textDark, fontSize: 18 }}>Add an app</h3>
            <p style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 13 }}>Add a tile to the <strong>{props.listTitle}</strong> list.</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: tokens.color.textDark, marginBottom: 4 }}>Name</label>
              <input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="BINUSMAYA" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 14, fontFamily: tokens.font.family, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: tokens.color.textDark, marginBottom: 4 }}>URL</label>
              <input value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="https://example.binus.ac.id" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 14, fontFamily: tokens.font.family, boxSizing: 'border-box' }} />
            </div>
            {addErr && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 12 }}>{addErr}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" disabled={addBusy} onClick={() => setAddOpen(false)} style={{ padding: '8px 16px', border: `1px solid ${tokens.color.border}`, background: tokens.color.bg, color: tokens.color.textDark, borderRadius: tokens.radius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="button" disabled={addBusy} onClick={submitAdd} style={{ padding: '8px 16px', border: 'none', background: tokens.color.orange, color: '#fff', borderRadius: tokens.radius.sm, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: addBusy ? 0.6 : 1 }}>{addBusy ? 'Saving…' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
