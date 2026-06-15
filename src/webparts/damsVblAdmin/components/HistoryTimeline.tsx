import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { IStatusHistory } from '../../../shared/damsTypes';
import { StatusBadge } from '../../../shared/DamsUi';

export const HistoryTimeline: React.FC<{ history: IStatusHistory[] | null; loading: boolean }> = ({ history, loading }) => {
  if (loading) return <p style={{ fontSize: tokens.font.small, color: tokens.color.text }}>Loading history...</p>;
  if (!history || history.length === 0) {
    return <p style={{ fontSize: tokens.font.small, color: tokens.color.text }}>No history yet.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>
      {history.map((h) => (
        <div key={h.Id} style={{ display: 'flex', gap: tokens.space.md }}>
          <div
            style={{
              width: 10,
              height: 10,
              marginTop: 6,
              borderRadius: '50%',
              background: tokens.color.blue,
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
              {h.FromStatus && <StatusBadge status={h.FromStatus} />}
              {h.FromStatus && <span style={{ color: tokens.color.text }}>{'->'}</span>}
              <StatusBadge status={h.ToStatus} />
            </div>
            <div style={{ fontSize: '12px', color: tokens.color.text, marginTop: 4 }}>
              {h.ActorEmail} - {new Date(h.At).toLocaleString()}
            </div>
            {h.Note && <div style={{ fontSize: tokens.font.small, color: tokens.color.textDark, marginTop: 2 }}>{h.Note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
