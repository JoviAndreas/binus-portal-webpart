import * as React from 'react';
import { MSGraphClientFactory } from '@microsoft/sp-http';
import { tokens, patterns, photos } from '../../../shared/tokens';
import { BinusLogo } from '../../../shared/BinusLogo';
import { LampGlow, ConstellationImage, Underline } from '../../../shared/LoadingFX';
import { IFeaturedItem, resolveImage } from '../../../shared/featuredConfig';

export interface IBinusHeroProps {
  title: string;
  subtitle: string;
  featured: IFeaturedItem[];
  userDisplayName?: string;
  userEmail?: string;
  msGraphClientFactory?: MSGraphClientFactory;
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(s: string): string {
  if (!s) return '';
  return s.split(/\s+/)[0];
}

const styles: { [k: string]: React.CSSProperties } = {
  root: {
    position: 'relative',
    padding: '44px 32px 48px',
    background: tokens.color.blueDark,
    color: '#fff',
    borderRadius: tokens.radius.lg,
    overflow: 'hidden'
  },
  bgPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(180deg, ${tokens.color.blueDark}CC 0%, ${tokens.color.blueDark}80 100%), ${patterns.dots}`,
    pointerEvents: 'none'
  },
  inner: { position: 'relative', maxWidth: 1200, margin: '0 auto' },
  topRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 },
  title: { fontSize: 36, lineHeight: 1.18, marginBottom: 10, color: '#fff', fontWeight: 800, maxWidth: 720 },
  subtitle: { fontSize: 15, opacity: 0.85, maxWidth: 640, marginBottom: 32 },
  cards: {
    display: 'grid',
    gridTemplateColumns: '1.7fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 14,
    marginTop: 28,
    minHeight: 320
  },
  card: {
    background: 'rgba(255,255,255,.10)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,.18)',
    color: '#fff',
    borderRadius: tokens.radius.md,
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform .18s ease, background .18s ease, border-color .18s ease'
  },
  cardFeatured: { gridRow: 'span 2', minHeight: 320 },
  cardImg: { flex: 1, minHeight: 80, overflow: 'hidden' },
  cardImgFeatured: { flex: 1.6, minHeight: 180 },
  cardBody: { padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  cardBodyFeatured: { padding: '18px 22px 22px' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#fff' },
  cardTitleFeatured: { fontSize: 22 },
  cardDesc: { fontSize: 13, opacity: 0.85, lineHeight: 1.5 }
};

export const BinusHero: React.FC<IBinusHeroProps> = ({ title, subtitle, featured, userDisplayName, userEmail, msGraphClientFactory }) => {
  const items = featured && featured.length ? featured : [];
  const showAsymmetric = items.length === 3;
  const [jobTitle, setJobTitle] = React.useState<string>('');

  React.useEffect(() => {
    if (!msGraphClientFactory) return;
    let alive = true;
    void msGraphClientFactory.getClient('3')
      .then((c) => c.api('/me').select('jobTitle,displayName,department').get())
      .then((u: { jobTitle?: string }) => { if (alive) setJobTitle(u?.jobTitle || ''); })
      .catch(() => { /* silent */ });
    return () => { alive = false; };
  }, [msGraphClientFactory]);

  const name = firstName(userDisplayName || '');
  const greeting = name ? `${timeOfDay()}, ${name}` : '';

  return (
    <section className="bp-root" style={styles.root}>
      <LampGlow src={photos.heroBg} targetOpacity={0.32} />
      <div style={styles.bgPattern} />
      <div style={styles.inner}>
        <div className="bp-fade-up" style={styles.topRow}>
          <BinusLogo height={34} color="#fff" monochrome />
          <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,.35)', display: 'inline-block' }} />
          <span style={{ fontSize: 14, opacity: 0.85, fontWeight: 600, letterSpacing: 0.5 }}>Portal</span>
        </div>
        {greeting && (
          <div className="bp-fade-up" style={{ ...styles.subtitle, animationDelay: '60ms', marginBottom: 4, opacity: 0.95 }}>
            {greeting}{jobTitle ? ` · ${jobTitle}` : ''}
          </div>
        )}
        <h1 className="bp-fade-up" style={{ ...styles.title, animationDelay: '120ms' }}>
          <Underline>{title}</Underline>
        </h1>
        {subtitle && (
          <p className="bp-fade-up" style={{ ...styles.subtitle, animationDelay: '220ms' }}>{subtitle}</p>
        )}
        {items.length > 0 && (
          <div
            style={{
              ...styles.cards,
              gridTemplateColumns: showAsymmetric ? '1.7fr 1fr' : `repeat(${Math.min(items.length, 4)}, 1fr)`,
              gridTemplateRows: showAsymmetric ? '1fr 1fr' : '1fr'
            }}
          >
            {items.map((f, i) => {
              const isFeatured = showAsymmetric && i === 0;
              const baseDelay = 280 + i * 120;
              return (
                <a
                  key={f.title + i}
                  href={f.href}
                  className="bp-fade-up"
                  style={{
                    ...styles.card,
                    ...(isFeatured ? styles.cardFeatured : {}),
                    animationDelay: `${baseDelay}ms`
                  }}
                >
                  <ConstellationImage
                    src={resolveImage(f.image)}
                    delay={baseDelay + 80}
                    overlay={`linear-gradient(180deg, transparent 40%, rgba(2,74,122,.55) 100%)`}
                    style={{
                      ...styles.cardImg,
                      ...(isFeatured ? styles.cardImgFeatured : {})
                    }}
                    alt={f.title}
                  />
                  <div style={{ ...styles.cardBody, ...(isFeatured ? styles.cardBodyFeatured : {}) }}>
                    <span style={{ ...styles.cardTitle, ...(isFeatured ? styles.cardTitleFeatured : {}) }}>{f.title}</span>
                    <span style={styles.cardDesc}>{f.desc}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
