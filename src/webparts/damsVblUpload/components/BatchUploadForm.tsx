import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { Combobox } from '../../../shared/Combobox';
import { sanitizeName, parseFilename, buildDescription, buildTags } from '../../../shared/sanitize';
import { Card, CardTitle, Field, TextInput, TextArea, PrimaryButton, MessageBar } from '../../../shared/DamsUi';
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
  file: File;
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
  NamaMatakuliah: string;
  RumpunIlmu: string;
  Kampus: string;
  Fakultas: string;
  Jurusan: string;
  Tags: string;
}

let rowSeq = 0;

export const BatchUploadForm: React.FC<IBatchUploadFormProps> = ({ api, initial, campuses, faculties, departments }) => {
  const [shared, setShared] = React.useState<IShared>({
    Email: initial.email,
    Name: initial.name,
    KodeDosen: initial.kodeDosen,
    NamaMatakuliah: '',
    RumpunIlmu: '',
    Kampus: initial.kampus,
    Fakultas: initial.fakultas,
    Jurusan: initial.jurusan,
    Tags: ''
  });
  const [rows, setRows] = React.useState<IRow[]>([]);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  const setS = (k: keyof IShared, v: string): void => setShared((p) => ({ ...p, [k]: v }));
  const setRow = (id: string, patch: Partial<IRow>): void =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addFiles = (files: FileList | null): void => {
    if (!files) return;
    const next: IRow[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.indexOf('video/') !== 0 && !/\.mp4$/i.test(f.name)) continue;
      const parsed = parseFilename(f.name);
      rowSeq += 1;
      next.push({
        id: `r${rowSeq}`,
        file: f,
        KodeMatakuliah: (parsed && parsed.KodeMatakuliah) || '',
        Topik: (parsed && parsed.Topik) || '',
        Week: parsed && parsed.Week ? String(parsed.Week) : '1',
        Session: parsed && parsed.Session ? String(parsed.Session) : '1',
        JudulVideo: (parsed && parsed.JudulVideo) || '',
        status: 'pending'
      });
    }
    setRows((prev) => [...prev, ...next]);
  };

  const removeRow = (id: string): void => setRows((prev) => prev.filter((r) => r.id !== id));

  const buildForm = (row: IRow): FormData | string => {
    if (!shared.Email || !shared.Name || !shared.KodeDosen) return 'Lecturer fields are required.';
    if (!shared.NamaMatakuliah || !shared.RumpunIlmu || !shared.Kampus || !shared.Fakultas || !shared.Jurusan) {
      return 'Shared course/location fields are required.';
    }
    if (!row.KodeMatakuliah || !row.Topik || !row.JudulVideo) return 'Kode MK, Topik and Judul are required.';
    const fd = new FormData();
    fd.append('Email', shared.Email);
    fd.append('Name', shared.Name);
    fd.append('KodeDosen', shared.KodeDosen);
    fd.append('KodeMatakuliah', row.KodeMatakuliah);
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
      setError('Add at least one .mp4 file.');
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
    }
  };

  const statusColor: Record<RowStatus, string> = {
    pending: tokens.color.text,
    uploading: tokens.color.blue,
    done: '#1E7B43',
    error: '#C2362B'
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
        <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(12, 1fr)' }}>
          <Field label="Email" style={{ gridColumn: 'span 4 / span 4' }}>
            <TextInput value={shared.Email} onChange={(e) => setS('Email', e.target.value)} />
          </Field>
          <Field label="Name" style={{ gridColumn: 'span 5 / span 5' }}>
            <TextInput value={shared.Name} onChange={(e) => setS('Name', e.target.value)} />
          </Field>
          <Field label="Kode Dosen" style={{ gridColumn: 'span 3 / span 3' }}>
            <TextInput value={shared.KodeDosen} onChange={(e) => setS('KodeDosen', e.target.value.toUpperCase())} />
          </Field>
          <Field label="Nama Matakuliah" style={{ gridColumn: 'span 8 / span 8' }}>
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
        <CardTitle sub="Filename pattern {KodeMK}_{WW}{SS}_{Topik}.mp4 prefills the row.">Videos</CardTitle>
        <input type="file" accept="video/mp4" multiple onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ''; }} />
        {error && (
          <div style={{ marginTop: tokens.space.sm }}>
            <MessageBar kind="error">{error}</MessageBar>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.sm, marginTop: tokens.space.md }}>
          {rows.length === 0 && (
            <p style={{ fontSize: tokens.font.small, color: tokens.color.text }}>No files added yet.</p>
          )}
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                padding: tokens.space.md,
                background: tokens.color.bg
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.sm }}>
                <span style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.textDark, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.file.name} - {(row.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: statusColor[row.status] }}>
                    {row.status === 'done' && row.codeNumber ? row.codeNumber : row.status}
                  </span>
                  {row.status === 'pending' && (
                    <button type="button" onClick={() => removeRow(row.id)} style={{ border: 'none', background: 'transparent', color: tokens.color.text, cursor: 'pointer' }}>
                      Remove
                    </button>
                  )}
                </span>
              </div>
              <div style={{ display: 'grid', gap: tokens.space.sm, gridTemplateColumns: 'repeat(12, 1fr)' }}>
                <Field label="Kode MK" style={{ gridColumn: 'span 3 / span 3' }}>
                  <TextInput value={row.KodeMatakuliah} onChange={(e) => setRow(row.id, { KodeMatakuliah: sanitizeName(e.target.value).toUpperCase() })} />
                </Field>
                <Field label="Week" style={{ gridColumn: 'span 1 / span 1' }}>
                  <TextInput type="number" min={1} max={99} value={row.Week} onChange={(e) => setRow(row.id, { Week: e.target.value })} />
                </Field>
                <Field label="Session" style={{ gridColumn: 'span 1 / span 1' }}>
                  <TextInput type="number" min={1} max={99} value={row.Session} onChange={(e) => setRow(row.id, { Session: e.target.value })} />
                </Field>
                <Field label="Topik" style={{ gridColumn: 'span 4 / span 4' }}>
                  <TextInput value={row.Topik} onChange={(e) => setRow(row.id, { Topik: sanitizeName(e.target.value) })} />
                </Field>
                <Field label="Judul Video" style={{ gridColumn: 'span 3 / span 3' }}>
                  <TextInput maxLength={50} value={row.JudulVideo} onChange={(e) => setRow(row.id, { JudulVideo: sanitizeName(e.target.value) })} />
                </Field>
              </div>
              {row.status === 'error' && row.message && (
                <p style={{ fontSize: '12px', color: '#C2362B', marginTop: tokens.space.sm }}>{row.message}</p>
              )}
              {row.status === 'done' && row.link && (
                <p style={{ fontSize: '12px', marginTop: tokens.space.sm }}>
                  <a href={row.link} target="_blank" rel="noreferrer">SharePoint link</a>
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryButton type="button" onClick={() => { runAll().catch(() => undefined); }} disabled={running || rows.length === 0}>
          {running ? 'Uploading...' : `Upload ${rows.length} video(s)`}
        </PrimaryButton>
      </div>
    </div>
  );
};
