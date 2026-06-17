import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ISubmission } from '../../../shared/damsTypes';
import { Combobox } from '../../../shared/Combobox';
import { sanitizeName, parseFilename, buildDescription, buildTags, mapCampus, fuzzyPick } from '../../../shared/sanitize';
import { Card, CardTitle, Field, TextInput, TextArea, PrimaryButton, GhostButton, MessageBar } from '../../../shared/DamsUi';
import { IAutofill } from './DamsVblUpload';

export interface IBatchUploadFormProps {
  api: DamsApi;
  initial: IAutofill;
  campuses: string[];
  faculties: string[];
  departments: string[];
}

type RowStatus = 'pending' | 'uploading' | 'done' | 'error';

interface IRow {
  id: string;
  file: File | null;
  KodeMatakuliah: string;
  Topik: string;
  Week: string;
  Session: string;
  JudulVideo: string;
  status: RowStatus;
  message?: string;
  codeNumber?: string;
  link?: string;
}

interface IShared {
  Email: string;
  Name: string;
  KodeDosen: string;
  KodeMatakuliah: string;
  NamaMatakuliah: string;
  RumpunIlmu: string;
  Kampus: string;
  Fakultas: string;
  Jurusan: string;
  Tags: string;
}

let rowSeq = 0;

const makeRow = (): IRow => {
  rowSeq += 1;
  return {
    id: `r${rowSeq}`,
    file: null,
    KodeMatakuliah: '',
    Topik: '',
    Week: '1',
    Session: '1',
    JudulVideo: '',
    status: 'pending'
  };
};

export const BatchUploadForm: React.FC<IBatchUploadFormProps> = ({ api, initial, campuses, faculties, departments }) => {
  const [shared, setShared] = React.useState<IShared>({
    Email: initial.email,
    Name: initial.name,
    KodeDosen: initial.kodeDosen,
    KodeMatakuliah: '',
    NamaMatakuliah: '',
    RumpunIlmu: '',
    Kampus: initial.kampus,
    Fakultas: initial.fakultas,
    Jurusan: initial.jurusan,
    Tags: ''
  });
  const [rows, setRows] = React.useState<IRow[]>([makeRow()]);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [lookupQ, setLookupQ] = React.useState('');
  const [looking, setLooking] = React.useState(false);
  const [lookupMsg, setLookupMsg] = React.useState<string>('');
  const [history, setHistory] = React.useState<ISubmission[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const refreshHistory = React.useCallback(async (email: string): Promise<void> => {
    if (!email) return;
    setHistoryLoading(true);
    try {
      const res = await api.mySubmissions(email);
      setHistory(Array.isArray(res) ? res : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    if (shared.Email) {
      void refreshHistory(shared.Email);
    }
  }, [shared.Email, refreshHistory]);

  const doLookup = async (): Promise<void> => {
    const q = lookupQ.trim();
    if (!q) return;
    setLooking(true);
    setLookupMsg('');
    try {
      const b = await api.lookupBinusian(q);
      if (!b) {
        setLookupMsg(`No lecturer matched "${q}".`);
        return;
      }
      const kampus = mapCampus(b.campus);
      const fakultas = fuzzyPick(b.acadGroupDesc || '', faculties) || shared.Fakultas;
      const jurusan = fuzzyPick(b.acadOrgDesc || '', departments) || shared.Jurusan;
      setShared((p) => ({
        ...p,
        Email: b.email || p.Email,
        Name: b.name || p.Name,
        KodeDosen: b.kodeDosen || p.KodeDosen,
        Kampus: kampus || p.Kampus,
        Fakultas: fakultas,
        Jurusan: jurusan
      }));
      setLookupMsg(`Loaded ${b.name || ''} (${b.kodeDosen || ''}).`);
    } catch (e) {
      setLookupMsg('Lookup failed. Check sign-in.');
    } finally {
      setLooking(false);
    }
  };

  const setS = (k: keyof IShared, v: string): void => setShared((p) => ({ ...p, [k]: v }));
  const setRow = (id: string, patch: Partial<IRow>): void =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onRowFile = (id: string, f: File | null): void => {
    if (!f) return;
    const parsed = parseFilename(f.name);
    setRow(id, {
      file: f,
      KodeMatakuliah: (parsed && parsed.KodeMatakuliah) || '',
      Topik: (parsed && parsed.Topik) || '',
      Week: parsed && parsed.Week ? String(parsed.Week) : '1',
      Session: parsed && parsed.Session ? String(parsed.Session) : '1',
      JudulVideo: (parsed && parsed.JudulVideo) || ''
    });
    if (parsed && parsed.KodeMatakuliah && !shared.KodeMatakuliah) {
      setShared((p) => ({ ...p, KodeMatakuliah: parsed.KodeMatakuliah! }));
    }
  };

  const onlyDigits = (v: string): string => v.replace(/\D+/g, '').slice(0, 5);

  const addRow = (): void => setRows((prev) => [...prev, makeRow()]);

  const removeRow = (id: string): void => setRows((prev) => prev.filter((r) => r.id !== id));

  const buildForm = (row: IRow): FormData | string => {
    if (!shared.Email || !shared.Name || !shared.KodeDosen) return 'Lecturer fields are required.';
    if (!shared.KodeMatakuliah || !shared.NamaMatakuliah || !shared.RumpunIlmu || !shared.Kampus || !shared.Fakultas || !shared.Jurusan) {
      return 'Shared course/location fields are required.';
    }
    if (!row.Topik || !row.JudulVideo) return 'Topik and Judul are required.';
    if (!row.file) return 'Pick a .mp4 file for this row.';
    const fd = new FormData();
    fd.append('Email', shared.Email);
    fd.append('Name', shared.Name);
    fd.append('KodeDosen', shared.KodeDosen);
    fd.append('KodeMatakuliah', shared.KodeMatakuliah);
    fd.append('NamaMatakuliah', shared.NamaMatakuliah);
    fd.append('Topik', row.Topik);
    fd.append('Description', buildDescription(row.Topik));
    fd.append('Week', row.Week);
    fd.append('Session', row.Session);
    fd.append('JudulVideo', row.JudulVideo);
    fd.append('RumpunIlmu', shared.RumpunIlmu);
    fd.append('Kampus', shared.Kampus);
    fd.append('Fakultas', shared.Fakultas);
    fd.append('Jurusan', shared.Jurusan);
    fd.append('Tags', buildTags(shared.Tags, shared.Kampus));
    fd.append('Video', row.file);
    return fd;
  };

  const runAll = async (): Promise<void> => {
    setError('');
    if (rows.length === 0) {
      setError('Add at least one video row.');
      return;
    }
    setRunning(true);
    try {
      for (const row of rows) {
        if (row.status === 'done') continue;
        const fd = buildForm(row);
        if (typeof fd === 'string') {
          setRow(row.id, { status: 'error', message: fd });
          continue;
        }
        setRow(row.id, { status: 'uploading', message: undefined });
        try {
          const res = await api.submitVideo(fd);
          if (res.ok) {
            setRow(row.id, { status: 'done', codeNumber: res.codeNumber, link: res.linkDamsShare });
          } else {
            setRow(row.id, { status: 'error', message: res.message });
          }
        } catch (e) {
          setRow(row.id, { status: 'error', message: 'Upload failed.' });
        }
      }
    } finally {
      setRunning(false);
      if (shared.Email) void refreshHistory(shared.Email);
      setHistoryOpen(true);
    }
  };

  function statusBg(s: string | undefined): string {
    switch ((s || '').toLowerCase()) {
      case 'published':
      case 'approved':
        return '#E3F4E3';
      case 'rejected':
        return '#FBECEC';
      case 'inreview':
      case 'needsedit':
        return '#FFF4DA';
      default:
        return tokens.color.tint;
    }
  }
  function statusText(s: string | undefined): string {
    switch ((s || '').toLowerCase()) {
      case 'published':
      case 'approved':
        return '#1E7A1E';
      case 'rejected':
        return '#A82A1F';
      case 'inreview':
      case 'needsedit':
        return '#8B5A00';
      default:
        return tokens.color.blueDark;
    }
  }

  const statusColor: Record<RowStatus, string> = {
    pending: tokens.color.text,
    uploading: tokens.color.blue,
    done: tokens.color.success,
    error: tokens.color.danger
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>
      {!initial.found && (
        <MessageBar kind="info">
          No binusians record matched <strong>{initial.email}</strong>. Fill the shared lecturer fields manually.
        </MessageBar>
      )}

      <Card>
        <CardTitle sub="Applied to every video in this batch.">Shared fields</CardTitle>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: tokens.space.sm,
            padding: tokens.space.md,
            marginBottom: tokens.space.md,
            background: tokens.color.bgSoft,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: tokens.radius.md
          }}
        >
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: tokens.color.text, fontWeight: 600 }}>
              Look up by email or Kode Dosen (override autofill)
            </label>
            <div style={{ position: 'relative' }}>
              <TextInput
                value={lookupQ}
                onChange={(e) => setLookupQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !looking && lookupQ.trim()) {
                    e.preventDefault();
                    void doLookup();
                  }
                }}
                placeholder="e.g. tiurida.anita@binus.ac.id or D5979"
                style={{ paddingRight: 42 }}
              />
              {lookupQ.trim() && !looking && (
                <span
                  title="Press Enter to lookup"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    color: tokens.color.blue,
                    background: tokens.color.tint,
                    border: `1px solid ${tokens.color.tintBorder}`,
                    borderRadius: 4,
                    padding: '2px 6px',
                    pointerEvents: 'none',
                    fontFamily: tokens.font.family
                  }}
                >
                  ↵ Enter
                </span>
              )}
            </div>
          </div>
          <GhostButton
            type="button"
            disabled={looking || !lookupQ.trim()}
            onClick={() => { void doLookup(); }}
          >
            {looking ? 'Looking...' : 'Apply'}
          </GhostButton>
          {lookupMsg && (
            <div style={{ flex: '0 0 100%', fontSize: 12, color: tokens.color.text }}>{lookupMsg}</div>
          )}
        </div>
        <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(12, 1fr)' }}>
          <Field label="Email" style={{ gridColumn: 'span 4 / span 4' }}>
            <TextInput value={shared.Email} onChange={(e) => setS('Email', e.target.value)} placeholder="lecturer@binus.ac.id" />
          </Field>
          <Field label="Name" style={{ gridColumn: 'span 5 / span 5' }}>
            <TextInput value={shared.Name} onChange={(e) => setS('Name', e.target.value)} placeholder="Full name with degree" />
          </Field>
          <Field label="Kode Dosen" style={{ gridColumn: 'span 3 / span 3' }}>
            <TextInput value={shared.KodeDosen} onChange={(e) => setS('KodeDosen', e.target.value.toUpperCase())} placeholder="D1234" />
          </Field>
          <Field label="Kode Matakuliah" style={{ gridColumn: 'span 3 / span 3' }}>
            <TextInput value={shared.KodeMatakuliah} onChange={(e) => setS('KodeMatakuliah', sanitizeName(e.target.value).toUpperCase())} placeholder="COMP6047" maxLength={16} />
          </Field>
          <Field label="Nama Matakuliah" style={{ gridColumn: 'span 5 / span 5' }}>
            <TextInput value={shared.NamaMatakuliah} onChange={(e) => setS('NamaMatakuliah', sanitizeName(e.target.value))} placeholder="Introduction to C Programming I" />
          </Field>
          <Field label="Rumpun Ilmu" style={{ gridColumn: 'span 4 / span 4' }}>
            <TextInput value={shared.RumpunIlmu} onChange={(e) => setS('RumpunIlmu', e.target.value)} placeholder="Hospitality Knowledge" />
          </Field>
          <Field label="Kampus" style={{ gridColumn: 'span 4 / span 4' }}>
            <Combobox options={campuses} value={shared.Kampus} onChange={(v) => setS('Kampus', v)} placeholder="Pilih kampus" />
          </Field>
          <Field label="Fakultas" style={{ gridColumn: 'span 4 / span 4' }}>
            <Combobox options={faculties} value={shared.Fakultas} onChange={(v) => setS('Fakultas', v)} placeholder="Pilih fakultas" allowFree />
          </Field>
          <Field label="Jurusan" style={{ gridColumn: 'span 4 / span 4' }}>
            <Combobox options={departments} value={shared.Jurusan} onChange={(v) => setS('Jurusan', v)} placeholder="Pilih jurusan" allowFree />
          </Field>
          <Field label="Tags / Keywords" hint={`Auto-append: vbl, video based learning, CAMPUS: ${shared.Kampus}`} style={{ gridColumn: 'span 12 / span 12' }}>
            <TextArea rows={2} value={shared.Tags} onChange={(e) => setS('Tags', e.target.value)} placeholder="event, hospitality, introduction" />
          </Field>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: historyOpen ? tokens.space.sm : 0 }}>
          <CardTitle sub={shared.Email ? `Recent submissions by ${shared.Email}.` : 'Sign in to view history.'}>Upload history</CardTitle>
          <button
            type="button"
            className="dams-btn-link"
            onClick={() => setHistoryOpen((v) => !v)}
          >
            {historyOpen ? `Hide (${history.length})` : `Show ${history.length} past upload${history.length === 1 ? '' : 's'}`}
          </button>
        </div>
        {historyOpen && (
          <div>
            {historyLoading && (
              <p style={{ fontSize: tokens.font.label, color: tokens.color.text, margin: 0 }}>Loading...</p>
            )}
            {!historyLoading && history.length === 0 && (
              <p style={{ fontSize: tokens.font.label, color: tokens.color.text, margin: 0 }}>
                No past uploads yet. Your submissions will appear here.
              </p>
            )}
            {!historyLoading && history.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                {history.slice(0, 50).map((h) => (
                  <div
                    key={h.Id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr auto auto',
                      gap: tokens.space.md,
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: tokens.color.bg,
                      border: `1px solid ${tokens.color.line}`,
                      borderRadius: tokens.radius.md
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: tokens.font.label, color: tokens.color.blueDark, fontWeight: 700 }}>
                      {h.CodeNumber || '-'}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: tokens.font.body, fontWeight: 600, color: tokens.color.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(h.KodeMatakuliah || '') + (h.Topik ? ' - ' + h.Topik : '')}
                      </div>
                      <div style={{ fontSize: tokens.font.label, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.FileName || ''}{h.Week ? ` · Week ${h.Week} Sesi ${h.Session}` : ''}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: statusBg(h.Status),
                        color: statusText(h.Status),
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {h.Status || 'Pending'}
                    </span>
                    {h.LinkDamsShare ? (
                      <a
                        href={h.LinkDamsShare}
                        target="_blank"
                        rel="noreferrer"
                        className="dams-btn-link"
                        style={{ textDecoration: 'none' }}
                      >
                        Open
                      </a>
                    ) : <span />}
                  </div>
                ))}
                {history.length > 50 && (
                  <p style={{ fontSize: tokens.font.label, color: tokens.color.text, margin: 0 }}>
                    Showing 50 most recent of {history.length} uploads.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle sub="Filename pattern {KodeMK}_{WW}{SS}_{Topik}.mp4 prefills row fields automatically.">Videos</CardTitle>
        {error && (
          <div style={{ marginBottom: tokens.space.sm }}>
            <MessageBar kind="error">{error}</MessageBar>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.sm }}>
          {rows.map((row, idx) => (
            <div
              key={row.id}
              style={{
                border: `1px solid ${tokens.color.line}`,
                borderRadius: tokens.radius.lg,
                background: tokens.color.bg,
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: tokens.color.surfaceAlt, borderBottom: `1px solid ${tokens.color.line}` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: tokens.color.blue, color: '#fff', fontSize: tokens.font.label, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.ink }}>Video {idx + 1}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: tokens.space.md }}>
                  <span style={{ fontSize: tokens.font.label, fontWeight: 700, color: statusColor[row.status] }}>
                    {row.status === 'done' && row.codeNumber ? row.codeNumber : row.status !== 'pending' ? row.status : ''}
                  </span>
                  {row.status === 'pending' && rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(row.id)} className="dams-btn-link">
                      Remove
                    </button>
                  )}
                </span>
              </div>
              <div style={{ padding: tokens.space.md }}>
              {row.status === 'done' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.md, padding: tokens.space.md, background: tokens.color.tint, border: `1px solid ${tokens.color.tintBorder}`, borderRadius: tokens.radius.md }}>
                  <span style={{ width: 36, height: 36, borderRadius: '50%', background: tokens.color.blue, color: '#fff', fontSize: 18, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 36px' }}>✓</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: tokens.font.body, fontWeight: 700, color: tokens.color.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.file ? row.file.name : row.JudulVideo}
                    </div>
                    <div style={{ fontSize: tokens.font.label, color: tokens.color.text, marginTop: 2 }}>
                      Uploaded as <strong style={{ fontFamily: 'monospace', color: tokens.color.blueDark }}>{row.codeNumber}</strong>
                      {row.file && <> · {(row.file.size / 1024 / 1024).toFixed(1)} MB</>}
                    </div>
                  </div>
                  {row.link && (
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noreferrer"
                      className="dams-btn-ghost"
                      style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      Open in SharePoint
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: tokens.space.md }}>
                    <input
                      type="file"
                      className="dams-file"
                      accept="video/mp4"
                      onChange={(e) => { onRowFile(row.id, e.target.files && e.target.files[0] ? e.target.files[0] : null); e.currentTarget.value = ''; }}
                    />
                    {row.file && (
                      <span style={{ fontSize: tokens.font.label, color: tokens.color.text, marginLeft: tokens.space.sm }}>
                        {row.file.name} - {(row.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gap: tokens.space.sm, gridTemplateColumns: 'repeat(12, 1fr)' }}>
                    <Field label="Week" style={{ gridColumn: 'span 2 / span 2' }}>
                      <TextInput inputMode="numeric" pattern="[0-9]*" maxLength={5} value={row.Week} onChange={(e) => setRow(row.id, { Week: onlyDigits(e.target.value) })} placeholder="01" />
                    </Field>
                    <Field label="Session" style={{ gridColumn: 'span 2 / span 2' }}>
                      <TextInput inputMode="numeric" pattern="[0-9]*" maxLength={5} value={row.Session} onChange={(e) => setRow(row.id, { Session: onlyDigits(e.target.value) })} placeholder="01" />
                    </Field>
                    <Field label="Topik" style={{ gridColumn: 'span 4 / span 4' }}>
                      <TextInput value={row.Topik} onChange={(e) => setRow(row.id, { Topik: sanitizeName(e.target.value) })} placeholder="Pointers and Memory" />
                    </Field>
                    <Field label="Judul Video" style={{ gridColumn: 'span 3 / span 3' }}>
                      <TextInput maxLength={50} value={row.JudulVideo} onChange={(e) => setRow(row.id, { JudulVideo: sanitizeName(e.target.value) })} placeholder="Short title, max 50 chars" />
                    </Field>
                  </div>
                  {row.status === 'error' && row.message && (
                    <p style={{ fontSize: tokens.font.label, color: tokens.color.danger, marginTop: tokens.space.sm }}>{row.message}</p>
                  )}
                </>
              )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: tokens.space.md }}>
          <GhostButton type="button" onClick={addRow}>
            + Add video
          </GhostButton>
        </div>
      </Card>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: tokens.space.md,
          padding: '16px 20px',
          background: '#fff',
          border: `1px solid ${tokens.color.line}`,
          borderRadius: tokens.radius.lg,
          boxShadow: tokens.shadow.md
        }}
      >
        <span style={{ fontSize: tokens.font.small, color: tokens.color.text }}>
          {(() => { const n = rows.filter((r) => r.file).length; return `${n} ${n === 1 ? 'video' : 'videos'} attached. Shared fields apply to all.`; })()}
        </span>
        <PrimaryButton
          type="button"
          onClick={() => { runAll().catch(() => undefined); }}
          disabled={running || rows.filter((r) => r.file).length === 0}
        >
          {running ? 'Uploading...' : (() => { const n = rows.filter((r) => r.file).length; return `Upload ${n} ${n === 1 ? 'video' : 'videos'}`; })()}
        </PrimaryButton>
      </div>
    </div>
  );
};
