import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { Shimmer } from '../../../shared/LoadingFX';
import { Icon } from '../../../shared/Icon';
import { PersonAvatar } from './PersonAvatar';
import { QuickActions } from './QuickActions';
import { BinusPagesApi, ISearchHit, IEmployeeDetail, IEmployeeTraining, IResearchPaper, IOrgPerson, IKnowledgeProfile } from '../api';

export interface IPersonDrawerProps {
  hit: ISearchHit;
  api: BinusPagesApi;
  agentApi: BinusPagesApi;
  webUrl: string;
  onClose: () => void;
}

const styles: { [k: string]: React.CSSProperties } = {
  scrim: {
    position: 'fixed',
    top: 48,
    left: 48,
    right: 0,
    bottom: 0,
    background: 'rgba(2,18,30,.45)',
    backdropFilter: 'blur(3px)',
    zIndex: 100,
    animation: 'bp-fade-up .25s ease both'
  },
  drawer: {
    position: 'fixed',
    top: 48,
    right: 0,
    bottom: 0,
    width: 'min(760px, calc(100vw - 48px))',
    background: tokens.color.bg,
    boxShadow: '-12px 0 32px rgba(2,74,122,.18)',
    zIndex: 101,
    overflowY: 'auto',
    fontFamily: tokens.font.family,
    color: tokens.color.text,
    animation: 'bp-fade-up .35s cubic-bezier(.2,.7,.2,1) both'
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: `1px solid ${tokens.color.border}`,
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start'
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: tokens.color.text,
    padding: 6,
    borderRadius: tokens.radius.sm
  },
  name: { fontSize: 20, fontWeight: 800, color: tokens.color.textDark, lineHeight: 1.2 },
  meta: { fontSize: 13, color: tokens.color.text, marginTop: 4 },
  section: { padding: '20px 24px', borderBottom: `1px solid ${tokens.color.borderSoft}` },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.color.text,
    fontWeight: 700,
    marginBottom: 12
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: 12,
    padding: '6px 0',
    fontSize: 13,
    color: tokens.color.textDark
  },
  rowLabel: { color: tokens.color.text, fontSize: 12 },
  listItem: {
    padding: '10px 12px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    fontSize: 13,
    color: tokens.color.textDark,
    marginBottom: 6
  },
  empty: { fontSize: 13, color: tokens.color.text, fontStyle: 'italic', padding: '4px 0' }
};

const HIDE_FIELDS = new Set([
  'binusianid', 'nip', 'binus_photo', 'photo', 'foto', 'image', 'picture', 'profilepicture'
]);

function fieldOrder(obj: { [k: string]: unknown }): Array<[string, unknown]> {
  return Object.entries(obj).filter(([k, v]) => {
    if (k.startsWith('_')) return false;
    if (HIDE_FIELDS.has(k.toLowerCase())) return false;
    if (v === null || v === undefined || v === '') return false;
    if (typeof v === 'object') return false;
    if (typeof v === 'string' && v.length > 400) return false;
    return true;
  });
}

function humanize(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

const URL_FIELDS = new Set(['binus_scholar', 'scholar', 'scopus', 'orcid', 'linkedin', 'sinta', 'researchgate', 'website', 'web', 'url']);

function asUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z0-9.-]+\.(com|org|net|edu|id|ac\.id|edu\.id|co\.id)(\/.*)?$/i.test(v)) return 'https://' + v;
  return null;
}

const linkPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  background: `${tokens.color.blue}14`,
  color: tokens.color.blue,
  borderRadius: tokens.radius.pill,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
  border: `1px solid ${tokens.color.blue}33`,
  wordBreak: 'break-word',
  width: 'fit-content',
  justifySelf: 'start',
  maxWidth: '100%',
  transition: 'background .15s, border-color .15s'
};

const ExtArrow = (): React.ReactElement => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17L17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

const MailIcon = (): React.ReactElement => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16v16H4z" />
    <path d="M4 6l8 7 8-7" />
  </svg>
);

function linkLabel(field: string, raw: string): string {
  const f = field.toLowerCase();
  if (f === 'binus_scholar' || f === 'scholar') return 'BINUS Scholar';
  if (f === 'scopus') return 'Scopus';
  if (f === 'orcid') return 'ORCID';
  if (f === 'linkedin') return 'LinkedIn';
  if (f === 'sinta') return 'SINTA';
  if (f === 'researchgate') return 'ResearchGate';
  try {
    const u = new URL(raw);
    return u.host.replace(/^www\./, '') + (u.pathname && u.pathname !== '/' ? u.pathname : '');
  } catch {
    return raw;
  }
}

const ValueCell: React.FC<{ field: string; value: unknown }> = ({ field, value }) => {
  const str = String(value).trim();
  if (!str || str === '-' || str === '_' || str === 'N/A' || str.toLowerCase() === 'null') return <span>—</span>;
  const href = asUrl(str);
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={linkPillStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = `${tokens.color.blue}26`;
          (e.currentTarget as HTMLAnchorElement).style.borderColor = `${tokens.color.blue}66`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = `${tokens.color.blue}14`;
          (e.currentTarget as HTMLAnchorElement).style.borderColor = `${tokens.color.blue}33`;
        }}
      >
        <span>{linkLabel(field, href)}</span>
        <ExtArrow />
      </a>
    );
  }
  if (field.toLowerCase() === 'email' || /^\S+@\S+\.\S+$/.test(str)) {
    return (
      <a href={`mailto:${str}`} style={linkPillStyle}>
        <MailIcon />
        <span>{str}</span>
      </a>
    );
  }
  return <span>{str}</span>;
};

const PaperItem: React.FC<{ data: { [k: string]: unknown }; index: number }> = ({ data, index }) => {
  const [open, setOpen] = React.useState(false);
  const title = (data['title'] as string) || (data['judul'] as string) || '';
  const date = (data['date'] as string | number) || (data['tahun'] as string | number) || (data['year'] as string | number) || '';
  const ptype = (data['paperTypeName'] as string) || '';
  const journal = (data['journalName'] as string) || '';
  const researchers = (data['researchers'] as string) || '';
  const abstract = (data['abstract'] as string) || (data['Abstract'] as string) || '';
  const keywords = (data['keywords'] as string) || (data['Keywords'] as string) || '';
  const doi = (data['doi'] as string) || (data['DOI'] as string) || '';
  const url = (data['url'] as string) || (data['link'] as string) || '';
  const hasMore = !!(abstract || keywords || doi || url);
  return (
    <div style={styles.listItem}>
      <div style={{ fontWeight: 600 }}>{title || `Item ${index + 1}`}</div>
      {(date || ptype) && (
        <div style={{ fontSize: 11, color: tokens.color.text, marginTop: 4 }}>
          {[date, ptype].filter(Boolean).join(' · ')}
        </div>
      )}
      {journal && <div style={{ fontSize: 11, color: tokens.color.text, marginTop: 2 }}>{journal}</div>}
      {researchers && (
        <div style={{ fontSize: 10, color: tokens.color.text, marginTop: 4, opacity: 0.85, lineHeight: 1.4 }}>
          {researchers}
        </div>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          style={{
            marginTop: 8,
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: tokens.color.blue,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >{open ? 'Hide details' : 'Show more'}</button>
      )}
      {open && (
        <div style={{ marginTop: 8, fontSize: 12, color: tokens.color.textDark, lineHeight: 1.5 }}>
          {abstract && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: tokens.color.text, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Abstract</div>
              <div style={{ marginBottom: 8 }}>{abstract}</div>
            </>
          )}
          {keywords && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: tokens.color.text, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Keywords</div>
              <div style={{ marginBottom: 8 }}>{keywords}</div>
            </>
          )}
          {(doi || url) && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: tokens.color.text, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Link</div>
              {doi && <div style={{ marginBottom: 4 }}>DOI: <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" style={{ color: tokens.color.blue }}>{doi}</a></div>}
              {url && <div><a href={url} target="_blank" rel="noopener noreferrer" style={{ color: tokens.color.blue, wordBreak: 'break-all' }}>{url}</a></div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

type TabKey = 'profile' | 'org' | 'knowledge' | 'papers' | 'trainings';
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'org', label: 'Org' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'papers', label: 'Papers' },
  { key: 'trainings', label: 'Trainings' }
];

export const PersonDrawer: React.FC<IPersonDrawerProps> = ({ hit, api, agentApi, webUrl, onClose }) => {
  const [detail, setDetail] = React.useState<IEmployeeDetail[] | null | undefined>(undefined);
  const [trainings, setTrainings] = React.useState<IEmployeeTraining[] | null | undefined>(undefined);
  const [papers, setPapers] = React.useState<IResearchPaper[] | null | undefined>(undefined);
  const [orgChain, setOrgChain] = React.useState<IOrgPerson[] | null | undefined>(undefined);
  const [kmap, setKmap] = React.useState<IKnowledgeProfile | null | undefined>(undefined);
  const [activeTab, setActiveTab] = React.useState<TabKey>('profile');

  React.useEffect(() => {
    const id = hit.binusianId || '';
    const nip = hit.nip || '';
    if (!id || !nip) {
      setDetail(null);
      setTrainings(null);
      setPapers(null);
      return;
    }
    let alive = true;
    void agentApi.detail(id, nip).then((d) => {
      if (!alive) return;
      setDetail(d);
      const kddsn = d && d.length > 0 ? String((d[0] as { [k: string]: unknown }).kddsn || '').trim() : '';
      if (kddsn) {
        void api.researchPapers(kddsn).then((r) => alive && setPapers(r));
      } else {
        setPapers([]);
      }
    });
    void agentApi.trainings(id, nip).then((d) => alive && setTrainings(d));
    return () => { alive = false; };
  }, [hit.binusianId, hit.nip, api, agentApi]);

  React.useEffect(() => {
    if (activeTab !== 'org' || orgChain !== undefined) return;
    let alive = true;
    void api.orgChain(hit.email || '').then((d) => alive && setOrgChain(d));
    return () => { alive = false; };
  }, [activeTab, hit.email, api, orgChain]);

  React.useEffect(() => {
    if (activeTab !== 'knowledge' || kmap !== undefined) return;
    let alive = true;
    void api.knowledgeProfile(hit.email || '').then((d) => alive && setKmap(d));
    return () => { alive = false; };
  }, [activeTab, hit.email, api, kmap]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const d0 = detail && detail.length > 0 ? (detail[0] as { [k: string]: unknown }) : null;

  return (
    <>
      <div style={styles.scrim} onClick={onClose} />
      <aside className="bp-root" style={styles.drawer} role="dialog" aria-label={hit.nama || 'Profile'}>
        <button style={styles.close} onClick={onClose} aria-label="Close">
          <Icon name="arrowRight" size={18} />
        </button>
        <header style={styles.header}>
          <PersonAvatar name={hit.nama || ''} email={hit.email} webUrl={webUrl} size={64} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={styles.name}>{hit.nama || 'Unknown'}</span>
            {hit.namaDep && <span style={styles.meta}>{hit.namaDep}</span>}
            {hit.email && <span style={styles.meta}>{hit.email}</span>}
            <div style={{ marginTop: 10 }}>
              <QuickActions email={hit.email} nip={hit.nip} binusianId={hit.binusianId} />
            </div>
          </div>
        </header>

        <nav style={{ display: 'flex', gap: 4, padding: '12px 18px 0', borderBottom: `1px solid ${tokens.color.borderSoft}`, overflowX: 'auto' }}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  color: active ? tokens.color.blueDark : tokens.color.text,
                  borderBottom: active ? `2px solid ${tokens.color.orange}` : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >{t.label}</button>
            );
          })}
        </nav>

        {activeTab === 'profile' && (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Profile</div>
            {detail === undefined && <Shimmer height={80} />}
            {detail === null && <div style={styles.empty}>No profile data.</div>}
            {detail && detail.length === 0 && <div style={styles.empty}>No profile data.</div>}
            {d0 &&
              fieldOrder(d0)
                .slice(0, 18)
                .map(([k, v]) => (
                  <div key={k} style={styles.row}>
                    <span style={styles.rowLabel}>{humanize(k)}</span>
                    <ValueCell field={k} value={v} />
                  </div>
                ))}
          </section>
        )}

        {activeTab === 'org' && (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Reporting line</div>
            {orgChain === undefined && <Shimmer height={50} />}
            {orgChain && orgChain.length === 0 && <div style={styles.empty}>No org data.</div>}
            {orgChain && orgChain.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {orgChain.map((p, i) => (
                  <div key={p.id + i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm }}>
                    <PersonAvatar name={p.name} email={p.email} webUrl={webUrl} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: tokens.color.textDark }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: tokens.color.text }}>{p.role || ''}</div>
                      <div style={{ fontSize: 11, color: tokens.color.text }}>{p.dep || ''}</div>
                    </div>
                    {i < orgChain.length - 1 && (
                      <span style={{ fontSize: 18, color: tokens.color.text }}>↑</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'knowledge' && (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Knowledge profile</div>
            {kmap === undefined && <Shimmer height={50} />}
            {kmap === null && <div style={styles.empty}>No knowledge mapping record.</div>}
            {kmap && (
              <>
                <div style={styles.row}><span style={styles.rowLabel}>Name</span><ValueCell field="name" value={kmap.name} /></div>
                <div style={styles.row}><span style={styles.rowLabel}>Email</span><ValueCell field="email" value={kmap.email} /></div>
                <div style={styles.row}><span style={styles.rowLabel}>Division</span><ValueCell field="division" value={kmap.division} /></div>
                <div style={styles.row}><span style={styles.rowLabel}>Department</span><ValueCell field="department" value={kmap.department} /></div>
                <div style={styles.row}><span style={styles.rowLabel}>Position</span><ValueCell field="position" value={kmap.position} /></div>
                <div style={styles.row}><span style={styles.rowLabel}>Band</span><ValueCell field="band" value={kmap.band} /></div>
                {kmap.leadEmail && <div style={styles.row}><span style={styles.rowLabel}>Reports to</span><ValueCell field="email" value={kmap.leadEmail} /></div>}
              </>
            )}
          </section>
        )}

        {activeTab === 'papers' && (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Research papers</div>
            {papers === undefined && <Shimmer height={50} />}
            {papers === null && <div style={styles.empty}>Not available.</div>}
            {papers && papers.length === 0 && <div style={styles.empty}>No research papers found.</div>}
            {papers && papers.slice(0, 50).map((p, i) => <PaperItem key={i} data={p as { [k: string]: unknown }} index={i} />)}
          </section>
        )}

        {activeTab === 'trainings' && (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Trainings</div>
            {trainings === undefined && <Shimmer height={50} />}
            {trainings === null && <div style={styles.empty}>Not available.</div>}
            {trainings && trainings.length === 0 && <div style={styles.empty}>No trainings recorded.</div>}
            {trainings && trainings.slice(0, 50).map((t, i) => {
              const o = t as { [k: string]: unknown };
              const title =
                (o['nama_pelatihan'] as string) ||
                (o['namaPelatihan'] as string) ||
                (o['trainingName'] as string) ||
                (o['nama'] as string) ||
                `Training ${i + 1}`;
              const loc = (o['lokasi'] as string) || '';
              const start = (o['tgl_awal'] as string) || '';
              const yr = start ? new Date(start).getFullYear() : '';
              return (
                <div key={i} style={styles.listItem}>
                  <div style={{ fontWeight: 600 }}>{title}</div>
                  {(loc || yr) && (
                    <div style={{ fontSize: 11, color: tokens.color.text, marginTop: 2 }}>
                      {[loc, yr].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </aside>
    </>
  );
};
