import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';

// Popup player for "open video": SharePoint's own adaptive player in an iframe.
export const VideoPreviewModal: React.FC<{
  api: DamsApi;
  id: string;
  code: string;
  fallbackUrl?: string;
  onClose: () => void;
}> = ({ api, id, code, fallbackUrl, onClose }) => {
  const [url, setUrl] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [frameReady, setFrameReady] = React.useState(false);

  React.useEffect(() => {
    const ctrl = new AbortController();
    api.getPreviewUrl(id, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      if (r && r.Url) setUrl(r.Url); else setFailed(true);
    }).catch(() => { if (!ctrl.signal.aborted) setFailed(true); });
    return () => ctrl.abort();
  }, [api, id]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const link: React.CSSProperties = { color: tokens.color.blue, fontWeight: 700, fontSize: tokens.font.small, textDecoration: 'none' };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Video ${code}`} style={{ position: 'fixed', inset: 0, zIndex: 510, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(11,44,68,.55)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: tokens.radius.card, boxShadow: tokens.shadow.lg, width: 'min(980px, 94vw)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: `1px solid ${tokens.color.line}` }}>
          <b style={{ color: tokens.color.ink, fontSize: tokens.font.small }}>{code}</b>
          <span style={{ flex: 1 }} />
          {fallbackUrl && <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" style={link}>Open in new tab</a>}
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: tokens.color.text }}>&times;</button>
        </div>
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#0b2c44' }}>
          {url && (
            <iframe
              title={`Video ${code}`}
              src={url}
              allow="autoplay; fullscreen"
              allowFullScreen
              onLoad={() => setFrameReady(true)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          )}
          {!failed && !frameReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#fff', fontSize: tokens.font.small, pointerEvents: 'none' }}>
              <span className="dams-spinner" style={{ width: 28, height: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} />
              Loading video...
            </div>
          )}
          {failed && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', fontSize: tokens.font.small, textAlign: 'center', padding: 24 }}>
              <div>Couldn't load the video preview.</div>
              {fallbackUrl && <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" style={{ ...link, color: '#7cc7f0' }}>Open it in a new tab</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
