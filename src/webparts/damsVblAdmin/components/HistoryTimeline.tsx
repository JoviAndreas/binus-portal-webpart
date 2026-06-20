import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { IStatusHistory } from '../../../shared/damsTypes';
import { STATUS_LABELS } from '../../../shared/DamsUi';

const STATUS_ICON_COLOR: Record<string, string> = {
  Pending:    '#f59e0b',
  InReview:   '#3b82f6',
  Approved:   '#10b981',
  Rejected:   '#ef4444',
};

const STATUS_ICON_BG: Record<string, string> = {
  Pending:    '#fef3c7',
  InReview:   '#dbeafe',
  Approved:   '#d1fae5',
  Rejected:   '#fee2e2',
};

function StatusIcon({ status }: { status: string }): React.ReactElement {
  const color = STATUS_ICON_COLOR[status] || tokens.color.text;
  const size = 16;
  switch (status) {
    case 'Pending':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
          <path d="M8 4.5V8l2.5 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'InReview':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <ellipse cx="8" cy="8.5" rx="6" ry="4" stroke={color} strokeWidth="1.5"/>
          <circle cx="8" cy="8.5" r="1.5" fill={color}/>
        </svg>
      );
    case 'Approved':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
          <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'Rejected':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5" fill={tokens.color.text} opacity="0.4"/>
        </svg>
      );
  }
}

function fmtAt(iso: string): string {
  const s = iso.includes('+') || iso.endsWith('Z') ? iso : iso + '+07:00';
  const d = new Date(s);
  const day = d.toLocaleDateString('id-ID', { weekday: 'short' });
  const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day}, ${date}, ${hh}.${mm}`;
}

export const HistoryTimeline: React.FC<{ history: IStatusHistory[] | null; loading: boolean }> = ({ history, loading }) => {
  if (loading) return <p style={{ fontSize: tokens.font.small, color: tokens.color.text }}>Loading history...</p>;
  if (!history || history.length === 0) {
    return <p style={{ fontSize: tokens.font.small, color: tokens.color.text }}>No history yet.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {history.map((h, i) => {
        const isLast = i === history.length - 1;
        const iconColor = STATUS_ICON_COLOR[h.ToStatus] || '#94a3b8';
        const iconBg = STATUS_ICON_BG[h.ToStatus] || '#f1f5f9';
        const label = STATUS_LABELS[h.ToStatus] || h.ToStatus;
        return (
          <div key={h.Id} style={{ display: 'flex', gap: 12 }}>
            {/* Left: icon + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: iconBg,
                border: `1.5px solid ${iconColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <StatusIcon status={h.ToStatus} />
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 12, background: '#e2e8f0', marginTop: 2, marginBottom: 2 }} />
              )}
            </div>
            {/* Right: content */}
            <div style={{ paddingBottom: isLast ? 0 : 16, paddingTop: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {h.FromStatus && (
                  <>
                    <span style={{
                      fontSize: tokens.font.label,
                      color: STATUS_ICON_COLOR[h.FromStatus] || tokens.color.text,
                      fontWeight: 500,
                    }}>
                      {STATUS_LABELS[h.FromStatus] || h.FromStatus}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
                <span style={{
                  fontSize: tokens.font.label,
                  color: iconColor,
                  fontWeight: 700,
                }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize: tokens.font.micro, color: tokens.color.text, marginTop: 2 }}>
                {h.ActorEmail} &middot; {fmtAt(h.At)}
              </div>
              {h.Note && (
                <div style={{
                  fontSize: tokens.font.small,
                  color: tokens.color.ink,
                  marginTop: 4,
                  padding: '4px 8px',
                  background: '#f8fafc',
                  borderLeft: `2px solid ${iconColor}`,
                  borderRadius: 2,
                }}>
                  {h.Note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
