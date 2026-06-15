import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { BinusHero } from '../../binusHero/components/BinusHero';
import { BinusAppLauncher } from '../../binusAppLauncher/components/BinusAppLauncher';

export interface IBinusHomepageProps {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  launcherHeading: string;
  launcherSubheading: string;
  listTitle: string;
  webUrl: string;
  spHttpClient: SPHttpClient;
}

const QUICK_LINKS = [
  { label: 'Binuspedia', href: '/binuspedia/SitePages/Home.aspx', icon: '📚' },
  { label: 'Org Structure', href: '/resources/Organization Structure  Job Description/Forms/AllItems.aspx', icon: '🧭' },
  { label: 'Upload VBL', href: 'https://uploadvbl.apps.binus.ac.id/', icon: '⬆️' },
  { label: 'Send Feedback', href: 'https://forms.office.com/Pages/ResponsePage.aspx?id=Y7mFNLqCb0qBD7XMIm_4mB0qVKUyctBFrmPcpI9b-9BUQ01VQVpROTZROTVEQjBBT1NCVlBEWENFRy4u', icon: '💬' }
];

const styles: { [k: string]: React.CSSProperties } = {
  wrap: { padding: '0 0 48px', background: tokens.color.bgSoft, minHeight: '100vh' },
  heroPad: { padding: '24px 24px 0', maxWidth: 1280, margin: '0 auto' },
  quickRow: {
    maxWidth: 1200,
    margin: '24px auto 0',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12
  },
  quick: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    background: tokens.color.bg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    textDecoration: 'none',
    color: tokens.color.textDark,
    fontWeight: 600,
    transition: 'transform .15s, box-shadow .15s, border-color .15s'
  },
  quickIcon: {
    fontSize: 22,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.sm,
    background: tokens.color.bgSoft
  },
  launcherPad: { padding: '8px 24px 0', maxWidth: 1280, margin: '0 auto' },
  footer: {
    maxWidth: 1200,
    margin: '48px auto 0',
    padding: '24px',
    textAlign: 'center',
    color: tokens.color.text,
    fontSize: 13,
    borderTop: `1px solid ${tokens.color.border}`
  }
};

export const BinusHomepage: React.FC<IBinusHomepageProps> = (p) => {
  return (
    <main className="bp-root" style={styles.wrap}>
      <div style={styles.heroPad}>
        <BinusHero
          title={p.heroTitle}
          subtitle={p.heroSubtitle}
          ctaLabel={p.ctaLabel}
          ctaUrl={p.ctaUrl}
        />
      </div>

      <div style={styles.quickRow}>
        {QUICK_LINKS.map((q) => (
          <a
            key={q.label}
            href={q.href}
            style={styles.quick}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = tokens.shadow.md;
              (e.currentTarget as HTMLAnchorElement).style.borderColor = tokens.color.blue;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = '';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = tokens.color.border;
            }}
          >
            <span style={styles.quickIcon}>{q.icon}</span>
            <span>{q.label}</span>
          </a>
        ))}
      </div>

      <div style={styles.launcherPad}>
        <BinusAppLauncher
          heading={p.launcherHeading}
          subheading={p.launcherSubheading}
          listTitle={p.listTitle}
          webUrl={p.webUrl}
          spHttpClient={p.spHttpClient}
        />
      </div>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} BINA NUSANTARA · BINUS Portal
      </footer>
    </main>
  );
};
