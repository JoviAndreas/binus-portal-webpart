import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { Icon } from '../../../shared/Icon';

export interface IQuickActionsProps {
  email?: string;
  nip?: string;
  binusianId?: string;
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.sm,
  background: tokens.color.bg,
  color: tokens.color.textDark,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'border-color .15s, color .15s'
};

function useCopy(): [string | null, (v: string) => void] {
  const [flash, setFlash] = React.useState<string | null>(null);
  const copy = React.useCallback((v: string): void => {
    try {
      void navigator.clipboard.writeText(v);
      setFlash(v);
      setTimeout(() => setFlash(null), 1200);
    } catch {
      /* clipboard denied */
    }
  }, []);
  return [flash, copy];
}

export const QuickActions: React.FC<IQuickActionsProps> = ({ email, nip, binusianId }) => {
  const [flash, copy] = useCopy();
  const stop = (e: React.MouseEvent): void => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {email && (
        <a href={`mailto:${email}`} style={btnStyle} onClick={stop}>
          <Icon name="message" size={12} strokeWidth={2} /> Email
        </a>
      )}
      {email && (
        <a
          href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={btnStyle}
          onClick={stop}
        >
          <Icon name="users" size={12} strokeWidth={2} /> Teams
        </a>
      )}
      {email && (
        <button style={btnStyle} onClick={(e) => { stop(e); copy(email); }}>
          {flash === email ? 'Copied' : 'Copy email'}
        </button>
      )}
      {nip && (
        <button style={btnStyle} onClick={(e) => { stop(e); copy(nip); }}>
          {flash === nip ? 'Copied' : `NIP ${nip}`}
        </button>
      )}
      {binusianId && (
        <button style={btnStyle} onClick={(e) => { stop(e); copy(binusianId); }}>
          {flash === binusianId ? 'Copied' : 'Copy ID'}
        </button>
      )}
    </div>
  );
};
