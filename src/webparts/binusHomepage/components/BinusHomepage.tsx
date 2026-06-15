import * as React from 'react';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { BinusHero } from '../../binusHero/components/BinusHero';
import { BinusAppLauncher } from '../../binusAppLauncher/components/BinusAppLauncher';
import { Icon, IconName } from '../../../shared/Icon';
import { ICategoriesConfig } from '../../../shared/categoriesConfig';
import { IFeaturedItem } from '../../../shared/featuredConfig';
import { Underline } from '../../../shared/LoadingFX';

export interface IBinusHomepageProps {
  heroTitle: string;
  heroSubtitle: string;
  launcherHeading: string;
  launcherSubheading: string;
  listTitle: string;
  webUrl: string;
  spHttpClient: SPHttpClient;
  config: ICategoriesConfig;
  newsListTitle: string;
  featured: IFeaturedItem[];
}

type QuickLink = { label: string; href: string; icon: IconName };
const QUICK_LINKS: QuickLink[] = [
  { label: 'Binuspedia', href: '/binuspedia/SitePages/Home.aspx', icon: 'bookOpen' },
  { label: 'Org Structure', href: '/resources/Organization Structure  Job Description/Forms/AllItems.aspx', icon: 'network' },
  { label: 'Upload VBL', href: 'https://uploadvbl.apps.binus.ac.id/', icon: 'upload' },
  { label: 'Send Feedback', href: 'https://forms.office.com/Pages/ResponsePage.aspx?id=Y7mFNLqCb0qBD7XMIm_4mB0qVKUyctBFrmPcpI9b-9BUQ01VQVpROTZROTVEQjBBT1NCVlBEWENFRy4u', icon: 'message' }
];

interface INewsItem {
  id: number;
  title: string;
  url: string;
  description: string;
  modified: string;
}

const styles: { [k: string]: React.CSSProperties } = {
  wrap: { padding: '0 0 32px', background: tokens.color.bgSoft, minHeight: '100vh' },
  heroPad: { padding: '24px 24px 0', maxWidth: 1280, margin: '0 auto' },
  quickRow: {
    maxWidth: 1200,
    margin: '24px auto 0',
    padding: '0 24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6
  },
  quick: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    background: tokens.color.bg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    textDecoration: 'none',
    color: tokens.color.textDark,
    fontWeight: 500,
    fontSize: 13,
    transition: 'border-color .15s, color .15s, background .15s'
  },
  launcherPad: { padding: '8px 24px 0', maxWidth: 1280, margin: '0 auto' },
  newsSection: { maxWidth: 1200, margin: '32px auto 0', padding: '0 32px' },
  newsHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  newsHeading: { fontSize: 20, fontWeight: 700, color: tokens.color.textDark },
  newsLink: { fontSize: 13, color: tokens.color.blue, textDecoration: 'none' },
  newsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 14
  },
  newsCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '16px 18px',
    background: tokens.color.bg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    textDecoration: 'none',
    color: tokens.color.textDark
  },
  newsDate: { fontSize: 11, color: tokens.color.text, letterSpacing: 0.3 },
  newsTitle: { fontSize: 15, fontWeight: 700, color: tokens.color.textDark, lineHeight: 1.35 },
  newsDesc: { fontSize: 13, color: tokens.color.text, lineHeight: 1.5 }
};

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export const BinusHomepage: React.FC<IBinusHomepageProps> = (p) => {
  const [news, setNews] = React.useState<INewsItem[]>([]);

  React.useEffect(() => {
    let alive = true;
    if (!p.newsListTitle) return;
    const camlUrl = `${p.webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
      p.newsListTitle
    )}')/items?$select=Id,Title,FileRef,Description,Modified&$orderby=Modified desc&$top=3`;
    p.spHttpClient
      .get(camlUrl, SPHttpClient.configurations.v1, {
        headers: { Accept: 'application/json;odata=nometadata' }
      })
      .then((r: SPHttpClientResponse) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d || !d.value) return;
        setNews(
          d.value.map((x: { Id: number; Title?: string; FileRef?: string; Description?: string; Modified?: string }) => ({
            id: x.Id,
            title: x.Title || '',
            url: x.FileRef || '#',
            description: x.Description || '',
            modified: x.Modified || ''
          }))
        );
      })
      .catch(() => { /* silent: news is optional */ });
    return () => { alive = false; };
  }, [p.webUrl, p.newsListTitle]);

  return (
    <main className="bp-root" style={styles.wrap}>
      <div style={styles.heroPad}>
        <BinusHero title={p.heroTitle} subtitle={p.heroSubtitle} featured={p.featured} />
      </div>

      <div style={styles.quickRow}>
        {QUICK_LINKS.map((q) => (
          <a
            key={q.label}
            href={q.href}
            style={styles.quick}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = tokens.color.blue;
              (e.currentTarget as HTMLAnchorElement).style.color = tokens.color.blue;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = tokens.color.border;
              (e.currentTarget as HTMLAnchorElement).style.color = tokens.color.textDark;
            }}
          >
            <Icon name={q.icon} size={15} strokeWidth={2} />
            <span>{q.label}</span>
          </a>
        ))}
      </div>

      {news.length > 0 && (
        <section style={styles.newsSection}>
          <div style={styles.newsHead}>
            <h2 style={styles.newsHeading}><Underline>Latest from the Portal</Underline></h2>
            <a href={`/SitePages/Forms/ByAuthor.aspx`} style={styles.newsLink}>See all</a>
          </div>
          <div style={styles.newsGrid}>
            {news.map((n, i) => (
              <a
                key={n.id}
                href={n.url}
                style={{ ...styles.newsCard, animationDelay: `${i * 90}ms` }}
                className="bp-fade-up"
              >
                <span style={styles.newsDate}>{fmtDate(n.modified)}</span>
                <span style={styles.newsTitle}>{n.title}</span>
                {n.description && <span style={styles.newsDesc}>{n.description}</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      <div style={styles.launcherPad}>
        <BinusAppLauncher
          heading={p.launcherHeading}
          subheading={p.launcherSubheading}
          listTitle={p.listTitle}
          webUrl={p.webUrl}
          spHttpClient={p.spHttpClient}
          config={p.config}
        />
      </div>
    </main>
  );
};
