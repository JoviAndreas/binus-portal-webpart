import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ISubmission, IStatusHistory, ISubmissionPatch } from '../../../shared/damsTypes';
import { Field, TextInput, TextArea, PrimaryButton, GhostButton, MessageBar, StarRating } from '../../../shared/DamsUi';
import { HistoryTimeline } from './HistoryTimeline';

export interface ISubmissionEditorProps {
  api: DamsApi;
  id: string;
  onClose: () => void;
  onSaved: () => void;
}

const starToNum = (v: string | undefined): number => parseInt(v || '0', 10) || 0;

export const SubmissionEditor: React.FC<ISubmissionEditorProps> = ({ api, id, onClose, onSaved }) => {
  const [loading, setLoading] = React.useState(true);
  const [sub, setSub] = React.useState<ISubmission | null>(null);
  const [history, setHistory] = React.useState<IStatusHistory[] | null>(null);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [patch, setPatch] = React.useState<ISubmissionPatch>({});
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setHistoryLoading(true);
    setPatch({});
    api.getSubmission(id).then((s) => {
      if (!active) return;
      setSub(s);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    api.getHistory(id).then((h) => {
      if (!active) return;
      setHistory(h);
      setHistoryLoading(false);
    }).catch(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [api, id]);

  const cur = <K extends keyof ISubmissionPatch>(k: K, fallback: ISubmissionPatch[K]): ISubmissionPatch[K] =>
    (patch[k] !== undefined ? patch[k] : fallback);
  const setP = <K extends keyof ISubmissionPatch>(k: K, v: ISubmissionPatch[K]): void =>
    setPatch((prev) => ({ ...prev, [k]: v }));

  const save = (): void => {
    if (Object.keys(patch).length === 0) {
      setMessage({ kind: 'error', text: 'No changes to save.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    api.patchSubmission(id, patch).then((res) => {
      setSaving(false);
      if (!res.ok) {
        setMessage({ kind: 'error', text: res.message || 'Save failed.' });
        return;
      }
      setSub(res.data);
      setPatch({});
      setMessage({ kind: 'success', text: 'Saved.' });
      onSaved();
      api.getHistory(id).then((h) => setHistory(h)).catch(() => undefined);
    }).catch((e) => {
      setSaving(false);
      setMessage({ kind: 'error', text: 'Save failed. Could not reach the DAMS API.' });
      console.error('[dams] editor save failed', e);
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,.4)' }} />
      <div
        className="dams-scope"
        style={{
          position: 'relative',
          width: 'min(540px, 100%)',
          height: '100%',
          background: tokens.color.bg,
          boxShadow: tokens.shadow.lg,
          overflowY: 'auto',
          fontFamily: tokens.font.family,
          borderTop: `4px solid ${tokens.color.blue}`
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 22px',
            borderBottom: `3px solid ${tokens.color.orange}`,
            position: 'sticky',
            top: 0,
            background: tokens.color.bg,
            zIndex: 1
          }}
        >
          <div>
            <div style={{ fontSize: tokens.font.label, color: tokens.color.text, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              Submission
            </div>
            {sub && (
              <div style={{ fontSize: tokens.font.h3, color: tokens.color.ink, fontWeight: 800, marginTop: 2 }}>
                {sub.CodeNumber || id.slice(0, 8)}
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: tokens.color.text, lineHeight: 1 }}>
            x
          </button>
        </div>

        <div style={{ padding: tokens.space.lg }}>
          {loading && <p style={{ color: tokens.color.text }}>Loading...</p>}
          {!loading && !sub && <MessageBar kind="error">Submission not found.</MessageBar>}

          {!loading && sub && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>
              {/* Meta */}
              <div style={{ fontSize: tokens.font.small, color: tokens.color.text, lineHeight: 1.8 }}>
                <div><strong style={{ color: tokens.color.ink }}>{sub.Name}</strong> ({sub.KodeDosen})</div>
                <div>{sub.KodeMatakuliah} - {sub.NamaMatakuliah}</div>
                <div>Kampus {sub.Kampus} / {sub.Jurusan}</div>
                <div>Week {sub.Week} Sesi {sub.Session}</div>
                {sub.SubmissionTime && <div>Submitted {new Date(sub.SubmissionTime).toLocaleString()}</div>}
                {sub.LinkDamsShare && (
                  <a href={sub.LinkDamsShare} target="_blank" rel="noreferrer" style={{ color: tokens.color.blue, fontSize: tokens.font.small }}>
                    Open in DAMS
                  </a>
                )}
              </div>

              {/* Quality stars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.space.md }}>
                <Field label="Kualitas Video">
                  <StarRating
                    value={starToNum(cur('KualitasVideo', sub.KualitasVideo || '0') as string)}
                    onChange={(v) => setP('KualitasVideo', String(v))}
                  />
                </Field>
                <Field label="Kualitas Audio">
                  <StarRating
                    value={starToNum(cur('KualitasAudio', sub.KualitasAudio || '0') as string)}
                    onChange={(v) => setP('KualitasAudio', String(v))}
                  />
                </Field>
                <Field label="Kualitas Konten">
                  <StarRating
                    value={starToNum(cur('KualitasKonten', sub.KualitasKonten || '0') as string)}
                    onChange={(v) => setP('KualitasKonten', String(v))}
                  />
                </Field>
              </div>

              {/* Review note */}
              <Field label="Review Note">
                <TextArea
                  rows={3}
                  maxLength={2000}
                  placeholder="Notes for the lecturer or production team..."
                  value={cur('ReviewNote', sub.ReviewNote || '') as string}
                  onChange={(e) => setP('ReviewNote', e.target.value)}
                />
              </Field>

              {/* Editable fields */}
              <Field label="Nama Matakuliah">
                <TextInput maxLength={256} value={cur('NamaMatakuliah', sub.NamaMatakuliah || '') as string} onChange={(e) => setP('NamaMatakuliah', e.target.value)} />
              </Field>
              <Field label="Topik">
                <TextInput maxLength={512} value={cur('Topik', sub.Topik || '') as string} onChange={(e) => setP('Topik', e.target.value)} />
              </Field>
              <Field label="Description">
                <TextArea rows={3} maxLength={4000} value={cur('Description', sub.Description || '') as string} onChange={(e) => setP('Description', e.target.value)} />
              </Field>
              <Field label="Tags">
                <TextInput maxLength={512} value={cur('Tags', sub.Tags || '') as string} onChange={(e) => setP('Tags', e.target.value)} />
              </Field>
              <Field label="QC">
                <TextInput maxLength={100} value={cur('Qc', sub.Qc || '') as string} onChange={(e) => setP('Qc', e.target.value)} />
              </Field>

              {message && <MessageBar kind={message.kind}>{message.text}</MessageBar>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.space.sm }}>
                <GhostButton type="button" onClick={onClose}>Close</GhostButton>
                <PrimaryButton type="button" onClick={save} disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </PrimaryButton>
              </div>

              <div style={{ borderTop: `1px solid ${tokens.color.line}`, paddingTop: tokens.space.md }}>
                <div style={{ fontSize: tokens.font.body, color: tokens.color.ink, fontWeight: 700, marginBottom: tokens.space.md }}>
                  Status history
                </div>
                <HistoryTimeline history={history} loading={historyLoading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
