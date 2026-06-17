import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ISubmission, IStatusHistory, ISubmissionPatch, STATUS_VALUES, BUMPER_VALUES } from '../../../shared/damsTypes';
import { Field, TextInput, TextArea, Select, PrimaryButton, GhostButton, MessageBar, StatusBadge } from '../../../shared/DamsUi';
import { HistoryTimeline } from './HistoryTimeline';

export interface ISubmissionEditorProps {
  api: DamsApi;
  id: string;
  onClose: () => void;
  onSaved: (updated: ISubmission) => void;
}

const QUALITY = ['1', '2', '3', '4', '5'];

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
    api.patchSubmission(id, patch).then((updated) => {
      setSaving(false);
      if (!updated) {
        setMessage({ kind: 'error', text: 'Save failed. Check the values and your admin access.' });
        return;
      }
      setSub(updated);
      setPatch({});
      setMessage({ kind: 'success', text: 'Saved.' });
      onSaved(updated);
      api.getHistory(id).then((h) => setHistory(h)).catch(() => undefined);
    }).catch(() => {
      setSaving(false);
      setMessage({ kind: 'error', text: 'Save failed. Could not reach the DAMS API.' });
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,.4)' }} />
      <div
        className="dams-scope"
        style={{
          position: 'relative',
          width: 'min(560px, 100%)',
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
            padding: '18px 24px',
            borderBottom: `3px solid ${tokens.color.orange}`,
            position: 'sticky',
            top: 0,
            background: tokens.color.bg,
            zIndex: 1
          }}
        >
          <h3 style={{ margin: 0, fontSize: tokens.font.h3, color: tokens.color.ink, fontWeight: 800 }}>Submission</h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: tokens.color.text, lineHeight: 1 }}>
            x
          </button>
        </div>
        <div style={{ padding: tokens.space.lg }}>

        {loading && <p style={{ color: tokens.color.text }}>Loading...</p>}
        {!loading && !sub && <MessageBar kind="error">Submission not found.</MessageBar>}

        {!loading && sub && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm, flexWrap: 'wrap' }}>
              <strong style={{ color: tokens.color.ink }}>{sub.CodeNumber}</strong>
              <StatusBadge status={sub.Status} />
              {sub.LinkDamsShare && (
                <a href={sub.LinkDamsShare} target="_blank" rel="noreferrer" style={{ fontSize: tokens.font.small }}>
                  Open in DAMS
                </a>
              )}
            </div>

            <div style={{ fontSize: tokens.font.small, color: tokens.color.text, lineHeight: 1.7 }}>
              <div>{sub.Name} ({sub.KodeDosen}) - {sub.Email}</div>
              <div>{sub.KodeMatakuliah} - {sub.NamaMatakuliah}</div>
              <div>Kampus {sub.Kampus} / {sub.Fakultas} / {sub.Jurusan}</div>
              <div>Week {sub.Week} Session {sub.Session}</div>
              {sub.SubmissionTime && <div>Submitted {new Date(sub.SubmissionTime).toLocaleString()}</div>}
              {sub.ReviewedBy && <div>Reviewed by {sub.ReviewedBy} {sub.ReviewedAt ? `at ${new Date(sub.ReviewedAt).toLocaleString()}` : ''}</div>}
            </div>

            <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Field label="Status">
                <Select options={STATUS_VALUES as unknown as string[]} value={cur('Status', sub.Status || 'Pending') as string} onChange={(e) => setP('Status', e.target.value)} />
              </Field>
              <Field label="Status Bumper">
                <Select allowEmpty options={BUMPER_VALUES} value={cur('StatusAdaBumper', sub.StatusAdaBumper || '') as string} onChange={(e) => setP('StatusAdaBumper', e.target.value)} />
              </Field>
              <Field label="PIC Editing">
                <TextInput maxLength={100} value={cur('PicEditing', sub.PicEditing || '') as string} onChange={(e) => setP('PicEditing', e.target.value)} />
              </Field>
              <Field label="QC">
                <TextInput maxLength={100} value={cur('Qc', sub.Qc || '') as string} onChange={(e) => setP('Qc', e.target.value)} />
              </Field>
              <Field label="Kualitas Video">
                <Select allowEmpty options={QUALITY} value={cur('KualitasVideo', sub.KualitasVideo || '') as string} onChange={(e) => setP('KualitasVideo', e.target.value)} />
              </Field>
              <Field label="Kualitas Audio">
                <Select allowEmpty options={QUALITY} value={cur('KualitasAudio', sub.KualitasAudio || '') as string} onChange={(e) => setP('KualitasAudio', e.target.value)} />
              </Field>
              <Field label="Kualitas Konten">
                <Select allowEmpty options={QUALITY} value={cur('KualitasKonten', sub.KualitasKonten || '') as string} onChange={(e) => setP('KualitasKonten', e.target.value)} />
              </Field>
              <Field label="Butuh Edit">
                <Select options={['No', 'Yes']} value={(cur('ButuhEdit', !!sub.ButuhEdit) ? 'Yes' : 'No')} onChange={(e) => setP('ButuhEdit', e.target.value === 'Yes')} />
              </Field>
            </div>

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
            <Field label="Review Note">
              <TextArea rows={3} maxLength={2000} value={cur('ReviewNote', sub.ReviewNote || '') as string} onChange={(e) => setP('ReviewNote', e.target.value)} />
            </Field>

            {message && <MessageBar kind={message.kind}>{message.text}</MessageBar>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.space.sm }}>
              <GhostButton type="button" onClick={onClose}>Close</GhostButton>
              <PrimaryButton type="button" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </PrimaryButton>
            </div>

            <div style={{ borderTop: `1px solid ${tokens.color.line}`, paddingTop: tokens.space.md }}>
              <h4 style={{ margin: `0 0 ${tokens.space.md}`, fontSize: tokens.font.body, color: tokens.color.ink, fontWeight: 700 }}>Status history</h4>
              <HistoryTimeline history={history} loading={historyLoading} />
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
