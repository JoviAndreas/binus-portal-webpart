import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { Shimmer } from '../../../shared/LoadingFX';
import { Icon } from '../../../shared/Icon';
import { PersonAvatar } from './PersonAvatar';
import { QuickActions } from './QuickActions';
import { BinusPagesApi, ISearchHit, IEmployeeDetail, IEmployeeTraining, IResearchPaper } from '../api';

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
    width: 'min(520px, calc(100vw - 48px))',
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

const linkStyle: React.CSSProperties = {
  color: tokens.color.blue,
  textDecoration: 'none',
  borderBottom: `1px dotted ${tokens.color.blue}`,
  wordBreak: 'break-all'
};

const ValueCell: React.FC<{ field: string; value: unknown }> = ({ field, value }) => {
  const str = String(value).trim();
  if (!str) return <span>—</span>;
  const isUrlField = URL_FIELDS.has(field.toLowerCase());
  const href = isUrlField ? asUrl(str) || str : asUrl(str);
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        {str}
      </a>
    );
  }
  if (field.toLowerCase() === 'email' || /^\S+@\S+\.\S+$/.test(str)) {
    return <a href={`mailto:${str}`} style={linkStyle}>{str}</a>;
  }
  return <span>{str}</span>;
};

export const PersonDrawer: React.FC<IPersonDrawerProps> = ({ hit, api, agentApi, webUrl, onClose }) => {
  const [detail, setDetail] = React.useState<IEmployeeDetail[] | null | undefined>(undefined);
  const [trainings, setTrainings] = React.useState<IEmployeeTraining[] | null | undefined>(undefined);
  const [papers, setPapers] = React.useState<IResearchPaper[] | null | undefined>(undefined);

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

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Trainings</div>
          {trainings === undefined && <Shimmer height={50} />}
          {trainings === null && <div style={styles.empty}>Not available.</div>}
          {trainings && trainings.length === 0 && <div style={styles.empty}>No trainings recorded.</div>}
          {trainings && trainings.slice(0, 8).map((t, i) => {
            const o = t as { [k: string]: unknown };
            const title =
              (o['nama_pelatihan'] as string) ||
              (o['namaPelatihan'] as string) ||
              (o['trainingName'] as string) ||
              (o['nama'] as string) ||
              JSON.stringify(o).slice(0, 80);
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

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Research Papers</div>
          {papers === undefined && <Shimmer height={50} />}
          {papers === null && <div style={styles.empty}>Not available.</div>}
          {papers && papers.length === 0 && <div style={styles.empty}>No research papers found.</div>}
          {papers && papers.slice(0, 8).map((p, i) => {
            const o = p as { [k: string]: unknown };
            const title =
              (o['title'] as string) ||
              (o['judul'] as string) ||
              (o['namaPaper'] as string) ||
              JSON.stringify(o).slice(0, 80);
            const year = (o['tahun'] as string | number) || (o['year'] as string | number) || '';
            return (
              <div key={i} style={styles.listItem}>
                <div style={{ fontWeight: 600 }}>{title}</div>
                {year !== '' && <div style={{ fontSize: 11, color: tokens.color.text, marginTop: 2 }}>{year}</div>}
              </div>
            );
          })}
        </section>
      </aside>
    </>
  );
};
