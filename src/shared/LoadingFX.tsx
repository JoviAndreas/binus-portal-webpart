import * as React from 'react';
import { tokens } from './tokens';

const KEYFRAMES_ID = 'bp-loading-fx';

function injectKeyframes(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const css = `
@keyframes bp-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes bp-img-in { 0% { opacity: 0; transform: scale(1.04); filter: blur(8px); } 100% { opacity: 1; transform: scale(1); filter: blur(0); } }
@keyframes bp-lamp-warm { 0% { opacity: 0; } 100% { opacity: var(--bp-lamp-target, 0.32); } }
@keyframes bp-lamp-flicker { 0%, 100% { opacity: var(--bp-lamp-target, 0.32); } 12% { opacity: calc(var(--bp-lamp-target, 0.32) * 0.6); } 14% { opacity: var(--bp-lamp-target, 0.32); } 60% { opacity: var(--bp-lamp-target, 0.32); } 62% { opacity: calc(var(--bp-lamp-target, 0.32) * 0.75); } 64% { opacity: var(--bp-lamp-target, 0.32); } }
@keyframes bp-shimmer-sweep { from { transform: translateX(-30%); } to { transform: translateX(130%); } }
@keyframes bp-glow-radial { 0% { background-position: 110% -10%; } 100% { background-position: 88% 12%; } }

.bp-fade-up { animation: bp-fade-up .5s cubic-bezier(.2,.7,.2,1) both; }
.bp-lamp { animation: bp-lamp-warm 1.4s cubic-bezier(.2,.7,.2,1) both; }
.bp-shimmer {
  position: relative;
  overflow: hidden;
  background-color: ${tokens.color.bgSoft};
  background-image:
    linear-gradient(${tokens.color.border} 1px, transparent 1px),
    linear-gradient(90deg, ${tokens.color.border} 1px, transparent 1px);
  background-size: 18px 18px;
}
.bp-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(0,142,211,.10) 50%, transparent 70%);
  animation: bp-shimmer-sweep 1.6s linear infinite;
}
`;
  const el = document.createElement('style');
  el.id = KEYFRAMES_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

injectKeyframes();

export interface IConstellationImageProps {
  src: string;
  delay?: number;
  overlay?: string;
  style?: React.CSSProperties;
  className?: string;
  alt?: string;
}

export const ConstellationImage: React.FC<IConstellationImageProps> = ({
  src, delay = 0, overlay, style, className, alt = ''
}) => {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    if (img.complete) { setLoaded(true); return; }
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
  }, [src]);

  return (
    <div
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0c2f4a',
        ...style
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: overlay ? `${overlay}, url("${src}")` : `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'scale(1)' : 'scale(1.03)',
          filter: loaded ? 'blur(0)' : 'blur(6px)',
          transition: `opacity 700ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 900ms cubic-bezier(.2,.7,.2,1) ${delay}ms, filter 700ms cubic-bezier(.2,.7,.2,1) ${delay}ms`
        }}
      />
    </div>
  );
};

// ---- Lamp warm-up bg layer ----
export interface ILampGlowProps {
  src: string;
  targetOpacity?: number;
  style?: React.CSSProperties;
}

export const LampGlow: React.FC<ILampGlowProps> = ({ src, targetOpacity = 0.32, style }) => {
  return (
    <>
      <div
        className="bp-lamp"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none',
          ['--bp-lamp-target' as string]: String(targetOpacity),
          ...style
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 88% 12%, rgba(255,219,138,.30) 0%, rgba(255,219,138,.10) 22%, transparent 45%)',
          backgroundSize: '220% 220%',
          animation: 'bp-glow-radial 1.6s ease-out both',
          pointerEvents: 'none'
        }}
      />
    </>
  );
};

// ---- Graph-paper shimmer skeleton ----
export interface IShimmerProps {
  height?: number | string;
  style?: React.CSSProperties;
}
export const Shimmer: React.FC<IShimmerProps> = ({ height = 80, style }) => (
  <div
    className="bp-shimmer"
    style={{
      width: '100%',
      height,
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.color.border}`,
      ...style
    }}
  />
);

// ---- No-op kept for compatibility; just renders children plain ----
export const Underline: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={style}>{children}</span>
);
