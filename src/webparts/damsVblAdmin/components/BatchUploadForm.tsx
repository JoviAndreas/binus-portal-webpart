import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { Combobox } from '../../../shared/Combobox';
import { sanitizeName, parseFilename, buildDescription, buildTags, mapCampus, fuzzyPick } from '../../../shared/sanitize';
import { Card, CardTitle, Field, TextInput, PrimaryButton, GhostButton, MessageBar } from '../../../shared/DamsUi';
import { IAutofill } from '../../../shared/damsTypes';

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

const DropZone: React.FC<{ file: File | null; onFile: (f: File | null) => void; style?: React.CSSProperties }> = ({ file, onFile, style }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'video/mp4') onFile(f);
  };

  return (
    <div
      style={{
        ...style,
        border: `2px dashed ${dragging ? tokens.color.blue : file ? tokens.color.success : tokens.color.line}`,
        borderRadius: tokens.radius.md,
        padding: '14px 18px',
        background: dragging ? tokens.color.tint : file ? tokens.color.successBg : tokens.color.bgSoft,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all .15s'
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={file ? tokens.color.success : tokens.color.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {file
          ? <><polyline points="20 6 9 17 4 12" /></>
          : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>
        }
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {file ? (
          <>
            <div style={{ fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: tokens.font.label, color: tokens.color.text }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </>
        ) : (
          <div style={{ fontSize: tokens.font.small, color: tokens.color.text }}>
            Drop <strong>.mp4</strong> here or <span style={{ color: tokens.color.blue, fontWeight: 700 }}>click to browse</span>
          </div>
        )}
      </div>
      {file && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onFile(null); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: tokens.color.text, fontSize: 16, lineHeight: 1, padding: 4 }}>
          &#x2715;
        </button>
      )}
      <input ref={inputRef} type="file" accept="video/mp4" style={{ display: 'none' }} onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.currentTarget.value = ''; }} />
    </div>
  );
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
  const [summary, setSummary] = React.useState<{ shared: IShared; rows: IRow[] } | null>(null);

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
      const kampus = mapCampus(b.Campus);
      const fakultas = fuzzyPick(b.AcadGroupDesc || '', faculties) || shared.Fakultas;
      const jurusan = fuzzyPick(b.AcadOrgDesc || '', departments) || shared.Jurusan;
      setShared((p) => ({
        ...p,
        Email: b.Email || p.Email,
        Name: b.Name || p.Name,
        KodeDosen: b.KodeDosen || p.KodeDosen,
        Kampus: kampus || p.Kampus,
        Fakultas: fakultas,
        Jurusan: jurusan
      }));
      setLookupMsg(`Loaded ${b.Name || ''} (${b.KodeDosen || ''}).`);
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
      const doneRows = rows.filter((r) => r.status === 'done');
      if (doneRows.length > 0) {
        setSummary({ shared: { ...shared }, rows: doneRows });
      }
    }
  };

  const startNewBatch = (): void => {
    setSummary(null);
    setRows([makeRow()]);
    setShared((p) => ({ ...p, KodeMatakuliah: '', NamaMatakuliah: '', RumpunIlmu: '', Tags: '' }));
    setError('');
  };

  const statusColor: Record<RowStatus, string> = {
    pending: tokens.color.text,
    uploading: tokens.color.blue,
    done: tokens.color.success,
    error: tokens.color.danger
  };

  if (summary) {
    return <SummaryView summary={summary} onNew={startNewBatch} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>

      <Card>
        <CardTitle sub="Applied to every video in this batch.">Lecturer</CardTitle>
        {/* Lookup bar */}
        <div style={{ marginBottom: tokens.space.md }}>
          <label style={{ display: 'block', fontSize: tokens.font.label, fontWeight: 700, color: tokens.color.text, marginBottom: 6 }}>
            Search lecturer
          </label>
          <div style={{ display: 'flex', gap: 0 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tokens.color.text}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <TextInput
                value={lookupQ}
                onChange={(e) => setLookupQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !looking && lookupQ.trim()) { e.preventDefault(); void doLookup(); } }}
                placeholder="Email or Kode Dosen, e.g. tiurida.anita@binus.ac.id or D5979"
                style={{ paddingLeft: 34, borderRight: 'none', borderRadius: `${tokens.radius.control} 0 0 ${tokens.radius.control}` }}
              />
            </div>
            <button
              type="button"
              disabled={looking || !lookupQ.trim()}
              onClick={() => { void doLookup(); }}
              style={{
                padding: '0 18px',
                fontSize: tokens.font.small,
                fontFamily: tokens.font.family,
                fontWeight: 700,
                border: `1px solid ${tokens.color.blue}`,
                borderRadius: `0 ${tokens.radius.control} ${tokens.radius.control} 0`,
                background: tokens.color.blue,
                color: '#fff',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                opacity: (looking || !lookupQ.trim()) ? 0.5 : 1
              }}
            >
              {looking ? 'Searching...' : 'Search'}
            </button>
          </div>
          {lookupMsg && (
            <div style={{
              marginTop: 6, fontSize: tokens.font.label,
              color: lookupMsg.startsWith('Loaded') ? tokens.color.success : tokens.color.danger,
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              {lookupMsg.startsWith('Loaded')
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              }
              {lookupMsg}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'end' }}>
          <Field label="Email" style={{ gridColumn: 'span 4 / span 4' }}>
            <TextInput value={shared.Email} onChange={(e) => setS('Email', e.target.value)} placeholder="lecturer@binus.ac.id" />
          </Field>
          <Field label="Name" style={{ gridColumn: 'span 5 / span 5' }}>
            <TextInput value={shared.Name} onChange={(e) => setS('Name', e.target.value)} placeholder="Full name with degree" />
          </Field>
          <Field label="Kode Dosen" style={{ gridColumn: 'span 3 / span 3' }}>
            <TextInput value={shared.KodeDosen} onChange={(e) => setS('KodeDosen', e.target.value.toUpperCase())} placeholder="D1234" />
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
        </div>
      </Card>

      <Card>
        <CardTitle sub="Shared across all videos in this batch.">Course</CardTitle>
        <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'end' }}>
          <Field label="Kode Matakuliah" style={{ gridColumn: 'span 3 / span 3' }}>
            <TextInput value={shared.KodeMatakuliah} onChange={(e) => setS('KodeMatakuliah', sanitizeName(e.target.value).toUpperCase())} placeholder="COMP6047" maxLength={16} />
          </Field>
          <Field label="Nama Matakuliah" style={{ gridColumn: 'span 5 / span 5' }}>
            <TextInput value={shared.NamaMatakuliah} onChange={(e) => setS('NamaMatakuliah', sanitizeName(e.target.value))} placeholder="Introduction to C Programming I" />
          </Field>
          <Field label="Rumpun Ilmu" style={{ gridColumn: 'span 4 / span 4' }}>
            <TextInput value={shared.RumpunIlmu} onChange={(e) => setS('RumpunIlmu', e.target.value)} placeholder="Hospitality Knowledge" />
          </Field>
          <Field label="Tags / Keywords" hint={`Auto-append: vbl, video based learning, CAMPUS: ${shared.Kampus}`} style={{ gridColumn: 'span 12 / span 12' }}>
            <TextInput value={shared.Tags} onChange={(e) => setS('Tags', e.target.value)} placeholder="event, hospitality, introduction" />
          </Field>
        </div>
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
                  <DropZone
                    file={row.file}
                    onFile={(f) => onRowFile(row.id, f)}
                    style={{ marginBottom: tokens.space.md }}
                  />
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
                    <Field label="Judul Video" style={{ gridColumn: 'span 4 / span 4' }}>
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

const SummaryView: React.FC<{ summary: { shared: IShared; rows: IRow[] }; onNew: () => void }> = ({ summary, onNew }) => {
  const { shared, rows } = summary;
  const total = rows.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.md, marginBottom: tokens.space.md }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: tokens.color.blue, color: '#fff', fontSize: 22, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 44px' }}>✓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: tokens.font.h3, color: tokens.color.ink, fontWeight: 700 }}>
              {total} video{total === 1 ? '' : 's'} uploaded
            </div>
            <div style={{ fontSize: tokens.font.label, color: tokens.color.text, marginTop: 2 }}>
              Confirmation email sent to <strong>{shared.Email}</strong>. Below is the recap.
            </div>
          </div>
          <PrimaryButton type="button" onClick={onNew}>Upload more videos</PrimaryButton>
        </div>
      </Card>

      <Card>
        <CardTitle sub="These applied to every video in the batch.">Shared details</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: tokens.space.md }}>
          <SumField col={4} label="Lecturer">{shared.Name} {shared.KodeDosen ? `(${shared.KodeDosen})` : ''}</SumField>
          <SumField col={4} label="Email">{shared.Email}</SumField>
          <SumField col={4} label="Kampus">{shared.Kampus}</SumField>
          <SumField col={6} label="Fakultas">{shared.Fakultas}</SumField>
          <SumField col={6} label="Jurusan">{shared.Jurusan}</SumField>
          <SumField col={3} label="Kode MK">{shared.KodeMatakuliah}</SumField>
          <SumField col={5} label="Nama MK">{shared.NamaMatakuliah}</SumField>
          <SumField col={4} label="Rumpun Ilmu">{shared.RumpunIlmu}</SumField>
          <SumField col={12} label="Tags / Keywords">{buildTags(shared.Tags, shared.Kampus)}</SumField>
        </div>
      </Card>

      <Card>
        <CardTitle sub={`${total} item${total === 1 ? '' : 's'} successfully uploaded.`}>Videos uploaded</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>
          {rows.map((r, idx) => (
            <div
              key={r.id}
              style={{
                border: `1px solid ${tokens.color.tintBorder}`,
                background: tokens.color.tint,
                borderRadius: tokens.radius.md,
                padding: tokens.space.md,
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto',
                gap: tokens.space.md,
                alignItems: 'start'
              }}
            >
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: tokens.color.blue, color: '#fff', fontSize: 16, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {idx + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: tokens.space.sm, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: tokens.font.body, fontWeight: 700, color: tokens.color.blueDark }}>{r.codeNumber}</span>
                  <span style={{ fontSize: tokens.font.body, fontWeight: 700, color: tokens.color.ink }}>{r.JudulVideo || r.Topik}</span>
                </div>
                <div style={{ fontSize: tokens.font.label, color: tokens.color.text, marginBottom: tokens.space.sm, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.file ? r.file.name : ''}{r.file ? ` · ${(r.file.size / 1024 / 1024).toFixed(1)} MB` : ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: tokens.space.sm }}>
                  <SumField col={2} label="Week">{r.Week}</SumField>
                  <SumField col={2} label="Session">{r.Session}</SumField>
                  <SumField col={8} label="Topik">{r.Topik}</SumField>
                </div>
              </div>
              {r.link && (
                <a
                  href={r.link}
                  target="_blank"
                  rel="noreferrer"
                  className="dams-btn-ghost"
                  style={{ textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'center' }}
                >
                  Open in SharePoint
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const SumField: React.FC<{ col: number; label: string; children: React.ReactNode }> = ({ col, label, children }) => (
  <div style={{ gridColumn: `span ${col} / span ${col}`, minWidth: 0 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: tokens.color.text, textTransform: 'uppercase', marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontSize: tokens.font.body, color: tokens.color.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {children || '-'}
    </div>
  </div>
);
