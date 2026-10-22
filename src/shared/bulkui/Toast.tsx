import * as React from 'react';
import { tokens } from '../tokens';

export type ToastKind = 'success' | 'warn' | 'error';
export interface IToast {
  id: number;
  kind: ToastKind;
  title: string;
  text?: string;
  details?: { code: string; reason: string }[];
}

const TOAST_MS = 6000;
const DETAILS_COLLAPSED = 3;

const ToastItem: React.FC<{ toast: IToast; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  const [hover, setHover] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [left, setLeft] = React.useState(TOAST_MS);
  const paused = hover || expanded;

  React.useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setLeft((l) => l - 100), 100);
    return () => window.clearInterval(t);
  }, [paused]);

  React.useEffect(() => { if (left <= 0) onClose(toast.id); }, [left, onClose, toast.id]);

  const color = toast.kind === 'success' ? tokens.color.success : toast.kind === 'error' ? tokens.color.danger : tokens.color.orange;
  const details = toast.details || [];
  const hiddenCount = details.length - DETAILS_COLLAPSED;
  const shownDetails = expanded ? details : details.slice(0, DETAILS_COLLAPSED);

  return (
    <div
      role="status"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', overflow: 'hidden', background: '#fff', border: `1px solid ${tokens.color.line}`, borderRadius: 10,
        boxShadow: tokens.shadow.lg, padding: '12px 30px 14px 12px', display: 'flex', gap: 11, pointerEvents: 'auto'
      }}
    >
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, color: '#fff', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, marginTop: 1 }}>
        {toast.kind === 'success' ? '✓' : '!'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: tokens.font.small, color: tokens.color.ink }}>{toast.title}</div>
        {toast.text && <div style={{ fontSize: tokens.font.micro, color: tokens.color.text, marginTop: 2, lineHeight: 1.45 }}>{toast.text}</div>}
        {details.length > 0 && (
          <>
            <div style={{ marginTop: 5, maxHeight: expanded ? 120 : undefined, overflowY: expanded ? 'auto' : undefined, borderTop: `1px solid ${tokens.color.line}`, paddingTop: 5 }}>
              {shownDetails.map((d) => (
                <div key={d.code} style={{ fontSize: tokens.font.micro, color: tokens.color.text, padding: '1px 0' }}>
                  <b style={{ color: tokens.color.ink }}>{d.code}</b> - {d.reason}
                </div>
              ))}
            </div>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{ background: 'none', border: 'none', padding: 0, marginTop: 4, cursor: 'pointer', color: tokens.color.blue, fontWeight: 700, fontSize: tokens.font.micro }}
              >
                {expanded ? 'show less' : `+${hiddenCount} more`}
              </button>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onClose(toast.id)}
        style={{ position: 'absolute', right: 8, top: 4, background: 'none', border: 'none', fontSize: 18, lineHeight: 1, color: '#9AA6B2', cursor: 'pointer' }}
      >
        &times;
      </button>
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 3, background: color, width: `${Math.max(0, (left / TOAST_MS) * 100)}%`, transition: 'width .1s linear' }} />
    </div>
  );
};

export const ToastStack: React.FC<{ toasts: IToast[]; onClose: (id: number) => void }> = ({ toasts, onClose }) => (
  <div style={{ position: 'fixed', right: 24, bottom: 72, width: 380, maxWidth: 'calc(100vw - 32px)', zIndex: 600, display: 'flex', flexDirection: 'column-reverse', gap: 10, pointerEvents: 'none' }}>
    {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={onClose} />)}
  </div>
);

export const useToasts = (): { toasts: IToast[]; push: (t: Omit<IToast, 'id'>) => void; close: (id: number) => void } => {
  const [toasts, setToasts] = React.useState<IToast[]>([]);
  const idRef = React.useRef(0);
  const push = React.useCallback((t: Omit<IToast, 'id'>): void => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((prev) => [...prev, { ...t, id }].slice(-4));
  }, []);
  const close = React.useCallback((id: number): void => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, push, close };
};
