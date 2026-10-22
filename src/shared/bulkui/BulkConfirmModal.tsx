import * as React from 'react';
import { tokens } from '../tokens';
import { GhostButton, PrimaryButton } from '../DamsUi';

export interface IBulkConfirmProps {
  title: string;
  description: React.ReactNode;
  summary: string;
  codes: string[];
  warning?: string;
  noteRequired?: boolean;
  notePlaceholder?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

const CODES_COLLAPSED = 4;

export const BulkConfirmModal: React.FC<IBulkConfirmProps> = ({
  title, description, summary, codes, warning, noteRequired, notePlaceholder, confirmLabel, danger, onConfirm, onCancel
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const blocked = !!noteRequired && !note.trim();
  const shown = expanded ? codes : codes.slice(0, CODES_COLLAPSED);
  const hidden = codes.length - CODES_COLLAPSED;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const chip: React.CSSProperties = {
    background: tokens.color.surfaceAlt, borderRadius: tokens.radius.pill, padding: '1px 8px', fontSize: tokens.font.micro,
    color: tokens.color.text, display: 'inline-block'
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(11,44,68,.35)' }} />
      <div
        style={{
          position: 'relative', background: '#fff', borderRadius: tokens.radius.card, boxShadow: tokens.shadow.lg,
          padding: '24px 28px', maxWidth: 440, width: '92%', borderTop: `4px solid ${danger ? tokens.color.danger : tokens.color.orange}`
        }}
      >
        <h4 style={{ margin: '0 0 6px', fontSize: 16, color: tokens.color.ink }}>{title}</h4>
        <p style={{ margin: '0 0 10px', fontSize: tokens.font.body, color: tokens.color.ink, lineHeight: 1.5 }}>{description}</p>
        <div style={{ background: tokens.color.tint, borderRadius: 6, padding: '9px 12px', margin: '10px 0', fontSize: tokens.font.small, color: tokens.color.ink }}>
          {summary}
        </div>
        {noteRequired && (
          <div style={{ marginBottom: 10 }}>
            <textarea
              className="dams-in"
              autoFocus
              value={note}
              placeholder={notePlaceholder || 'Reason (required)'}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => setTouched(true)}
              style={{ height: 60, resize: 'none' }}
            />
            {touched && blocked && <div style={{ color: tokens.color.danger, fontSize: tokens.font.micro, marginTop: 3 }}>Note is required.</div>}
          </div>
        )}
        {warning && (
          <div style={{ background: '#FFF6E5', borderLeft: `3px solid ${tokens.color.orange}`, padding: '7px 10px', fontSize: tokens.font.micro, margin: '8px 0', color: tokens.color.ink }}>
            {warning}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6, maxHeight: expanded ? 120 : undefined, overflowY: expanded ? 'auto' : undefined }}>
          {shown.map((c) => <span key={c} style={chip}>{c}</span>)}
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              style={{ ...chip, background: 'none', border: 'none', color: tokens.color.blue, fontWeight: 700, cursor: 'pointer' }}
            >
              {expanded ? 'show less' : `+${hidden} more`}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.space.sm, marginTop: 14 }}>
          <GhostButton type="button" onClick={onCancel}>Cancel</GhostButton>
          <PrimaryButton
            type="button"
            disabled={blocked}
            onClick={() => { if (blocked) { setTouched(true); return; } onConfirm(note.trim()); }}
            style={danger ? { background: tokens.color.danger, borderColor: tokens.color.danger } : undefined}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
