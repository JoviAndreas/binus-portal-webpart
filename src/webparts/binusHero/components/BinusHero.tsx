import * as React from 'react';
import { tokens } from '../../../shared/tokens';

export interface IBinusHeroProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
}

const FEATURED = [
  {
    eyebrow: 'Discover',
    title: 'Knowledge Mapping 2.0',
    desc: 'A new way to map and visualise expertise across your unit and study program.',
    href: '/SitePages/Knowledge-Mapping-2.aspx',
    accent: tokens.color.blue
  },
  {
    eyebrow: 'Compete',
    title: 'Competition Catalog',
    desc: 'Ongoing competitions for Binusians. Share, join, and showcase achievement.',
    href: '/SitePages/Competition-Catalog.aspx',
    accent: tokens.color.orange
  },
  {
    eyebrow: 'Innovate',
    title: 'Ideation System',
    desc: 'Share your ideas, form a team, and build the next BINUS-grown product.',
    href: '/SitePages/Ideation-System.aspx',
    accent: tokens.color.blueLight
  }
];

const styles: { [k: string]: React.CSSProperties } = {
  root: {
    position: 'relative',
    padding: '48px 32px 56px',
    background: `linear-gradient(135deg, ${tokens.color.blueDark} 0%, ${tokens.color.blue} 55%, ${tokens.color.blueLight} 100%)`,
    color: '#fff',
    borderRadius: tokens.radius.lg,
    overflow: 'hidden'
  },
  bgPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'radial-gradient(circle at 12% 18%, rgba(255,255,255,.18) 0, transparent 28%),' +
      'radial-gradient(circle at 88% 82%, rgba(243,147,27,.32) 0, transparent 34%)',
    pointerEvents: 'none'
  },
  inner: { position: 'relative', maxWidth: 1200, margin: '0 auto' },
  topRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 },
  pill: {
    background: 'rgba(255,255,255,.15)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: tokens.radius.pill,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: 700
  },
  title: { fontSize: 40, lineHeight: 1.15, marginBottom: 14, color: '#fff', fontWeight: 800, maxWidth: 760 },
  subtitle: { fontSize: 17, opacity: 0.92, maxWidth: 720, marginBottom: 28 },
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: tokens.color.orange,
    color: '#fff',
    textDecoration: 'none',
    padding: '12px 22px',
    borderRadius: tokens.radius.pill,
    fontWeight: 700,
    boxShadow: '0 8px 22px rgba(243,147,27,.4)',
    transition: 'transform .15s ease, box-shadow .15s ease'
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 36 },
  card: {
    background: 'rgba(255,255,255,.10)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,.18)',
    color: '#fff',
    padding: '20px 22px',
    borderRadius: tokens.radius.md,
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'transform .2s ease, background .2s ease'
  },
  cardEyebrow: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#fff' },
  cardDesc: { fontSize: 13, opacity: 0.85, lineHeight: 1.5 },
  accentBar: { width: 32, height: 3, borderRadius: 2, marginBottom: 4 }
};

export const BinusHero: React.FC<IBinusHeroProps> = ({ title, subtitle, ctaLabel, ctaUrl }) => {
  return (
    <section className="bp-root" style={styles.root}>
      <div style={styles.bgPattern} />
      <div style={styles.inner}>
        <div style={styles.topRow}>
          <img src={tokens.logo} alt="BINUS" style={{ height: 28, filter: 'brightness(0) invert(1)' }} />
          <span style={styles.pill}>BINUS Portal</span>
        </div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{subtitle}</p>
        {ctaLabel && (
          <a href={ctaUrl || '#'} style={styles.cta}>
            {ctaLabel} <span aria-hidden>→</span>
          </a>
        )}
        <div style={styles.cards}>
          {FEATURED.map((f) => (
            <a key={f.title} href={f.href} style={styles.card}>
              <span style={{ ...styles.accentBar, background: f.accent }} />
              <span style={styles.cardEyebrow}>{f.eyebrow}</span>
              <span style={styles.cardTitle}>{f.title}</span>
              <span style={styles.cardDesc}>{f.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
