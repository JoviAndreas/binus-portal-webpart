import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { Combobox } from '../../../shared/Combobox';
import {
  sanitizeName,
  parseFilename,
  buildDescription,
  buildTags
} from '../../../shared/sanitize';
import {
  Card,
  CardTitle,
  Field,
  TextInput,
  TextArea,
  PrimaryButton,
  GhostButton,
  MessageBar
} from '../../../shared/DamsUi';
import { IAutofill } from './DamsVblUpload';

export interface IUploadFormProps {
  api: DamsApi;
  initial: IAutofill;
  campuses: string[];
  faculties: string[];
  departments: string[];
}

interface IFormValues {
  Email: string;
  Name: string;
  KodeDosen: string;
  KodeMatakuliah: string;
  NamaMatakuliah: string;
  Topik: string;
  Description: string;
  Week: string;
  Session: string;
  JudulVideo: string;
  RumpunIlmu: string;
  Kampus: string;
  Fakultas: string;
  Jurusan: string;
  Tags: string;
}

type Status = 'idle' | 'uploading' | 'done' | 'error';

const grid2: React.CSSProperties = { display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(12, 1fr)' };
function span(n: number): React.CSSProperties {
  return { gridColumn: `span ${n} / span ${n}` };
}

export const UploadForm: React.FC<IUploadFormProps> = ({ api, initial, campuses, faculties, departments }) => {
  const [values, setValues] = React.useState<IFormValues>({
    Email: initial.email,
    Name: initial.name,
    KodeDosen: initial.kodeDosen,
    KodeMatakuliah: '',
    NamaMatakuliah: '',
    Topik: '',
    Description: '',
    Week: '1',
    Session: '1',
    JudulVideo: '',
    RumpunIlmu: '',
    Kampus: initial.kampus,
    Fakultas: initial.fakultas,
    Jurusan: initial.jurusan,
    Tags: ''
  });
  const [file, setFile] = React.useState<File | null>(null);
  const [lookupQ, setLookupQ] = React.useState('');
  const [looking, setLooking] = React.useState(false);
  const [status, setStatus] = React.useState<Status>('idle');
  const [message, setMessage] = React.useState<string>('');
  const [codeNumber, setCodeNumber] = React.useState<string>('');
  const [link, setLink] = React.useState<string | undefined>(undefined);

  const set = (k: keyof IFormValues, v: string): void => setValues((prev) => ({ ...prev, [k]: v }));

  const doLookup = async (): Promise<void> => {
    const q = lookupQ.trim();
    if (!q) return;
    setLooking(true);
    try {
      const b = await api.lookupBinusian(q);
      if (!b) {
        setMessage(`No lecturer matched "${q}"`);
        setStatus('error');
        return;
      }
      setValues((prev) => ({
        ...prev,
        Email: b.Email || prev.Email,
        Name: b.Name || prev.Name,
        KodeDosen: b.KodeDosen || prev.KodeDosen
      }));
      setStatus('idle');
      setMessage('');
    } finally {
      setLooking(false);
    }
  };

  const onFile = (f: File | null): void => {
    setFile(f);
    if (!f) return;
    const parsed = parseFilename(f.name);
    if (parsed) {
      setValues((prev) => ({
        ...prev,
        KodeMatakuliah: parsed.KodeMatakuliah || prev.KodeMatakuliah,
        Week: parsed.Week ? String(parsed.Week) : prev.Week,
        Session: parsed.Session ? String(parsed.Session) : prev.Session,
        Topik: parsed.Topik || prev.Topik,
        JudulVideo: parsed.JudulVideo || prev.JudulVideo,
        Description: parsed.Description || prev.Description
      }));
    }
  };

  const validate = (): string | null => {
    const required: Array<keyof IFormValues> = [
      'Email', 'Name', 'KodeDosen', 'KodeMatakuliah', 'NamaMatakuliah', 'Topik',
      'JudulVideo', 'RumpunIlmu', 'Kampus', 'Fakultas', 'Jurusan'
    ];
    for (const k of required) {
      if (!values[k] || !String(values[k]).trim()) return `${k} is required.`;
    }
    if (!file) return 'Pick a .mp4 file first.';
    return null;
  };

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMessage(err);
      setStatus('error');
      return;
    }
    const fd = new FormData();
    const finalValues: IFormValues = {
      ...values,
      Description: values.Description || buildDescription(values.Topik),
      Tags: buildTags(values.Tags, values.Kampus)
    };
    (Object.keys(finalValues) as Array<keyof IFormValues>).forEach((k) => fd.append(k, finalValues[k]));
    fd.append('Video', file as File);

    setStatus('uploading');
    setMessage('');
    api
      .submitVideo(fd)
      .then((res) => {
        if (res.ok) {
          setStatus('done');
          setCodeNumber(res.codeNumber);
          setLink(res.linkDamsShare);
        } else {
          setStatus('error');
          setMessage(res.message);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Upload failed. Could not reach the DAMS API.');
      });
  };

  const forbidden = 'Forbidden: * : < > ? \\ / " |';

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>
      {!initial.found && (
        <MessageBar kind="info">
          No binusians record matched <strong>{initial.email}</strong>. Fill the lecturer fields manually or use lookup.
        </MessageBar>
      )}

      <Card>
        <CardTitle>Lecturer</CardTitle>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: tokens.space.sm,
            padding: tokens.space.md,
            background: tokens.color.bgSoft,
            borderRadius: tokens.radius.md,
            marginBottom: tokens.space.md
          }}
        >
          <Field label="Look up by email or Kode Dosen (override autofill)" style={{ flex: 1, minWidth: 260 }}>
            <TextInput
              value={lookupQ}
              onChange={(e) => setLookupQ(e.target.value)}
              placeholder="e.g. tiurida.anita@binus.ac.id or D5979"
            />
          </Field>
          <GhostButton type="button" onClick={() => { doLookup().catch(() => undefined); }} disabled={looking || !lookupQ.trim()}>
            {looking ? 'Looking...' : 'Apply'}
          </GhostButton>
        </div>
        <div style={grid2}>
          <Field label="Email" hint="Contoh: jovi.andreas@binus.edu" style={span(5)}>
            <TextInput maxLength={256} value={values.Email} onChange={(e) => set('Email', e.target.value)} placeholder="username@binus.edu" />
          </Field>
          <Field label="Name" hint="Nama lengkap dengan gelar" style={span(5)}>
            <TextInput maxLength={200} value={values.Name} onChange={(e) => set('Name', e.target.value)} placeholder="Dr. Nama Lengkap, S.T., M.M." />
          </Field>
          <Field label="Kode Dosen" hint="Contoh: D1234" style={span(2)}>
            <TextInput maxLength={10} value={values.KodeDosen} onChange={(e) => set('KodeDosen', e.target.value.toUpperCase())} placeholder="D1234" />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle>Matakuliah</CardTitle>
        <div style={grid2}>
          <Field label="Kode Matakuliah" hint={forbidden} style={span(3)}>
            <TextInput
              maxLength={16}
              value={values.KodeMatakuliah}
              onChange={(e) => set('KodeMatakuliah', sanitizeName(e.target.value).toUpperCase())}
              placeholder="COMP6047"
            />
          </Field>
          <Field label="Nama Matakuliah" hint={`${forbidden}. Tidak boleh diakhiri titik.`} style={span(9)}>
            <TextInput
              maxLength={100}
              value={values.NamaMatakuliah}
              onChange={(e) => set('NamaMatakuliah', sanitizeName(e.target.value))}
              placeholder="Introduction to C Programming I"
            />
          </Field>

          <Field label="Week" hint="Contoh: 02" style={span(2)}>
            <TextInput type="number" min={1} max={99} value={values.Week} onChange={(e) => set('Week', e.target.value)} placeholder="01" />
          </Field>
          <Field label="Session" hint="Contoh: 01" style={span(2)}>
            <TextInput type="number" min={1} max={99} value={values.Session} onChange={(e) => set('Session', e.target.value)} placeholder="01" />
          </Field>
          <Field label="Topik" hint={forbidden} style={span(8)}>
            <TextInput
              maxLength={100}
              value={values.Topik}
              onChange={(e) => set('Topik', sanitizeName(e.target.value))}
              onBlur={(e) => {
                const v = sanitizeName(e.target.value);
                setValues((prev) => ({
                  ...prev,
                  Description: prev.Description || buildDescription(v),
                  JudulVideo: prev.JudulVideo || v.slice(0, 50)
                }));
              }}
              placeholder="Input Output"
            />
          </Field>

          <Field label="Judul Video" hint={`Max 50 chars. ${forbidden}`} style={span(8)}>
            <TextInput
              maxLength={50}
              value={values.JudulVideo}
              onChange={(e) => set('JudulVideo', sanitizeName(e.target.value))}
              placeholder="Mastering the Art of Event Planning"
            />
          </Field>
          <Field label="Rumpun Ilmu" hint="Contoh: Basic Programming" style={span(4)}>
            <TextInput maxLength={100} value={values.RumpunIlmu} onChange={(e) => set('RumpunIlmu', e.target.value)} placeholder="Hospitality Knowledge" />
          </Field>

          <Field label="Description" style={span(12)}>
            <TextArea rows={4} maxLength={4000} value={values.Description} onChange={(e) => set('Description', e.target.value)} placeholder="Video ini membahas tentang ..." />
          </Field>

          <Field
            label="Tags / Keywords"
            hint={`Auto-append: vbl, video based learning, CAMPUS: ${values.Kampus}`}
            style={span(12)}
          >
            <TextInput maxLength={512} value={values.Tags} onChange={(e) => set('Tags', e.target.value)} placeholder="event, hospitality, introduction" />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle sub="Where does this course live in the org structure?">Location</CardTitle>
        <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <Field label="Kampus" hint="Jakarta mencakup Kemanggisan, Alam Sutera, dan Bekasi">
            <Combobox options={campuses} value={values.Kampus} onChange={(v) => set('Kampus', v)} placeholder="Pilih kampus" searchPlaceholder="Cari kampus..." />
          </Field>
          <Field label="Fakultas" hint="Free input allowed.">
            <Combobox options={faculties} value={values.Fakultas} onChange={(v) => set('Fakultas', v)} placeholder="Pilih fakultas" searchPlaceholder="Cari fakultas..." allowFree />
          </Field>
          <Field label="Jurusan" hint="Search by name. Free input allowed.">
            <Combobox options={departments} value={values.Jurusan} onChange={(v) => set('Jurusan', v)} placeholder="Pilih jurusan" searchPlaceholder="Cari jurusan..." allowFree />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle>Video file</CardTitle>
        <input type="file" accept="video/mp4" onChange={(e) => onFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
        {file && (
          <p style={{ fontSize: tokens.font.small, color: tokens.color.text, marginTop: tokens.space.sm }}>
            {file.name} - {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
        <div style={{ marginTop: tokens.space.md }}>
          {status === 'uploading' && <MessageBar kind="info">Uploading, please keep this tab open...</MessageBar>}
          {status === 'done' && (
            <MessageBar kind="success">
              Done. CodeNumber: <strong>{codeNumber}</strong>
              {link && (
                <>
                  {' - '}
                  <a href={link} target="_blank" rel="noreferrer">SharePoint link</a>
                </>
              )}
            </MessageBar>
          )}
          {status === 'error' && <MessageBar kind="error">{message}</MessageBar>}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryButton type="submit" disabled={status === 'uploading'}>
          {status === 'uploading' ? 'Uploading...' : 'Submit'}
        </PrimaryButton>
      </div>
    </form>
  );
};
