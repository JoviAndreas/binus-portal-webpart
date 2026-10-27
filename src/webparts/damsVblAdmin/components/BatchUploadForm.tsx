import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { Combobox } from '../../../shared/Combobox';
import { sanitizeName, parseFilename, buildDescription, buildTags, mapCampus, fuzzyPick } from '../../../shared/sanitize';
import { Card, CardTitle, Field, TextInput, PrimaryButton, GhostButton, MessageBar } from '../../../shared/DamsUi';
import { IAutofill, IUploadSessionRequest } from '../../../shared/damsTypes';
import { validateVideoFile, NEW_UPLOAD_EXT } from '../../../shared/videoValidation';
// IUploadSessionRequest is used in buildRequestFrom return type

// Generic live-search dropdown with AbortController race prevention
interface ILiveSearchProps<T> {
  placeholder: string;
  onSearch: (q: string, signal: AbortSignal) => Promise<T[] | null>;
  onSelect: (item: T) => void;
  renderOption: (item: T) => { label: string; sublabel?: string; badge?: string };
  debounceMs?: number;
  style?: React.CSSProperties;
}

function LiveSearch<T>(props: ILiveSearchProps<T>): React.ReactElement {
  const { placeholder, onSearch, onSelect, renderOption, debounceMs = 250, style } = props;
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = React.useCallback((term: string): void => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    if (!term.trim()) { setResults([]); setOpen(false); setLoading(false); return; }
    timerRef.current = window.setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const res = await onSearch(term, abortRef.current.signal);
        setResults(res || []);
        setOpen(true);
      } catch {
        // AbortError or network - ignore
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [onSearch, debounceMs]);

  const handleChange = (val: string): void => {
    setQ(val);
    search(val);
  };

  const handleSelect = (item: T): void => {
    setOpen(false);
    setQ('');
    setResults([]);
    onSelect(item);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <div style={{ position: 'relative' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.color.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {loading && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.color.blue} strokeWidth="2" strokeLinecap="round" aria-hidden="true"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', animation: 'bp-spin .8s linear infinite', pointerEvents: 'none' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        )}
        <TextInput value={q} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 30, paddingRight: loading ? 30 : undefined }} />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
          background: tokens.color.bg, border: `1px solid ${tokens.color.line}`,
          borderRadius: tokens.radius.sm, boxShadow: '0 4px 16px rgba(0,0,0,.10)',
          maxHeight: 240, overflowY: 'auto', marginTop: 2
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.text, fontStyle: 'italic' }}>
              No results found.
            </div>
          ) : results.map((item, i) => {
            const opt = renderOption(item);
            return (
              <div
                key={i}
                onMouseDown={() => handleSelect(item)}
                style={{
                  padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  borderBottom: i < results.length - 1 ? `1px solid ${tokens.color.line}` : 'none'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tokens.color.bgSoft; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.ink }}>{opt.label}</div>
                  {opt.sublabel && <div style={{ fontSize: tokens.font.label, color: tokens.color.text }}>{opt.sublabel}</div>}
                </div>
                {opt.badge && <span style={{ fontSize: 11, color: tokens.color.text, background: tokens.color.bgSoft, borderRadius: tokens.radius.sm, padding: '2px 6px', flexShrink: 0 }}>{opt.badge}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface IBatchUploadFormProps {
  api: DamsApi;
  initial: IAutofill;
  campuses: string[];
  faculties: string[];
  departments: string[];
}

type RowStatus = 'pending' | 'uploading' | 'ready' | 'submitting' | 'done' | 'error';

interface IRow {
  id: string;
  file: File | null;
  KodeMatakuliah: string;
  Topik: string;
  Week: string;
  Session: string;
  JudulVideo: string;
  status: RowStatus;
  progress: number;       // confirmed pct (0-100)
  speedBps: number;       // rolling avg bytes/sec from last chunks
  lastChunkAt: number;    // Date.now() when last chunk confirmed
  tempItemId?: string;
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
    status: 'pending',
    progress: 0,
    speedBps: 0,
    lastChunkAt: 0
  };
};

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB = 32 x 320KB (Graph requirement)

const BOOST_MSGS = [
  'Optimizing upload route...',
  'Parallel chunk streaming active',
  'CDN acceleration enabled',
  'Network path optimized',
  'Chunk pipeline boosted',
  'Latency minimized',
];

function injectBoostAnim(): void {
  if (document.getElementById('bp-boost-anim')) return;
  const s = document.createElement('style');
  s.id = 'bp-boost-anim';
  s.textContent = `
    @keyframes bp-zap { 0%,100%{transform:translateY(0) scale(1)} 30%{transform:translateY(-3px) scale(1.2)} 60%{transform:translateY(1px) scale(.95)} }
    @keyframes bp-glow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} 50%{box-shadow:0 0 10px 3px rgba(245,158,11,.35)} }
    @keyframes bp-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes bp-slide { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes bp-pulse-bar { 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes bp-counter { 0%{opacity:0;transform:translateY(-6px)} 10%{opacity:1;transform:translateY(0)} 90%{opacity:1} 100%{opacity:0;transform:translateY(6px)} }
    @keyframes bp-boost-in { from{opacity:0;transform:scale(.8) translateY(2px)} to{opacity:1;transform:scale(1) translateY(0)} }
  `;
  document.head.appendChild(s);
}

const SpeedBoost: React.FC<{ active: boolean }> = ({ active }) => {
  const [phase, setPhase] = React.useState<'idle' | 'activating' | 'on'>('idle');
  const [msgIdx, setMsgIdx] = React.useState(0);
  // speed counter removed — don't show fake MB/s

  React.useEffect(() => { injectBoostAnim(); }, []);

  React.useEffect(() => {
    if (active && phase === 'idle') {
      setPhase('activating');
      const t = setTimeout(() => setPhase('on'), 700);
      return () => clearTimeout(t);
    }
    if (!active) setPhase('idle');
  }, [active]);

  React.useEffect(() => {
    if (phase !== 'on') return;
    const msg = setInterval(() => setMsgIdx((i) => (i + 1) % BOOST_MSGS.length), 2200);
    return () => { clearInterval(msg); };
  }, [phase]);

  if (phase === 'idle') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: `1px solid ${tokens.color.border}`, background: tokens.color.bgSoft, cursor: 'default', userSelect: 'none' }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        <span style={{ fontSize: tokens.font.label, color: tokens.color.text, fontWeight: 600 }}>Speed Boost Available</span>
      </div>
    );
  }

  if (phase === 'activating') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: '1px solid #FCD34D', background: '#FFFBEB', animation: 'bp-glow 1s ease infinite' }}>
        <span style={{ fontSize: 14, display: 'inline-block', animation: 'bp-spin .6s linear infinite' }}>⚡</span>
        <span style={{ fontSize: tokens.font.label, color: '#92400E', fontWeight: 700 }}>Activating boost...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 12px', borderRadius: tokens.radius.md, border: '1px solid #FCD34D', background: '#FFFBEB', animation: 'bp-glow 1.8s ease infinite', minWidth: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, display: 'inline-block', animation: 'bp-zap .7s ease infinite' }}>⚡</span>
        <span style={{ fontSize: tokens.font.label, fontWeight: 700, color: '#92400E' }}>SPEED BOOST ACTIVE</span>
      </div>
      <div style={{ height: 3, borderRadius: 999, background: '#FDE68A', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#F59E0B,#EF4444)', borderRadius: 999, animation: 'bp-pulse-bar 1.2s ease infinite' }} />
      </div>
      <div key={msgIdx} style={{ fontSize: 10, color: '#B45309', animation: 'bp-slide .3s ease' }}>{BOOST_MSGS[msgIdx]}</div>
    </div>
  );
};

async function uploadChunked(
  file: File,
  uploadUrl: string,
  onProgress: (confirmedPct: number, speedBps: number, lastChunkAt: number) => void
): Promise<string | null> {
  const total = file.size;
  let start = 0;
  let itemId: string | null = null;
  const recentSpeeds: number[] = [];

  while (start < total) {
    const end = Math.min(start + CHUNK_SIZE, total) - 1;
    const slice = file.slice(start, end + 1);
    let ok = false;
    const t0 = performance.now();
    for (let attempt = 0; attempt < 2; attempt++) {
      const resp = await fetch(uploadUrl, {
        method: 'PUT',
        body: slice,
        headers: { 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(slice.size) }
      });
      if (resp.status === 201 || resp.status === 200) {
        try { const item = await resp.clone().json() as { id?: string }; itemId = item.id || null; } catch { /* */ }
        ok = true; break;
      }
      if (resp.status === 202) { ok = true; break; }
      if (attempt === 1) throw new Error(`Chunk upload failed: HTTP ${resp.status}`);
    }
    if (!ok) throw new Error('Chunk failed after retry.');
    const dt = (performance.now() - t0) / 1000;
    if (dt > 0) {
      recentSpeeds.push(slice.size / dt);
      if (recentSpeeds.length > 4) recentSpeeds.shift();
    }
    const avgSpeed = recentSpeeds.length ? recentSpeeds.reduce((a, b) => a + b) / recentSpeeds.length : 0;
    start = end + 1;
    onProgress((start / total) * 100, avgSpeed, Date.now());
  }
  return itemId;
}

// Pessimistic display curve: always shows less than real.
// real 0-50%: shown = real * 0.6  →  25% real = 15% shown
// real 50%+:  shown = 30 + (real - 50) * 1.4  →  catches up fast (visible "boost"), hits 100 at real 100%
function pessimisticPct(real: number): number {
  if (real >= 100) return 100;
  if (real < 50) return real * 0.6;
  return 30 + (real - 50) * 1.4;
}

// Render-prop component: rAF loop extrapolates from speed, applies pessimistic curve
const SmoothProgress: React.FC<{
  confirmedPct: number;
  speedBps: number;
  totalBytes: number;
  lastChunkAt: number;
  active: boolean;
  children: (pct: number) => React.ReactNode;
}> = ({ confirmedPct, speedBps, totalBytes, lastChunkAt, active, children }) => {
  const [display, setDisplay] = React.useState(pessimisticPct(confirmedPct));
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!active || speedBps <= 0 || totalBytes <= 0) {
      setDisplay(pessimisticPct(confirmedPct));
      return undefined;
    }
    const chunkPct = (CHUNK_SIZE / totalBytes) * 100;
    const rawCeiling = Math.min(confirmedPct + chunkPct * 0.92, 99.9);
    const tick = (): void => {
      const elapsed = (Date.now() - lastChunkAt) / 1000;
      const rawExtrapolated = confirmedPct + (speedBps / totalBytes * 100) * elapsed;
      setDisplay(pessimisticPct(Math.min(rawExtrapolated, rawCeiling)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [confirmedPct, speedBps, totalBytes, lastChunkAt, active]);

  return <React.Fragment>{children(display)}</React.Fragment>;
};

const DropZone: React.FC<{ file: File | null; onFile: (f: File | null) => void; status?: RowStatus; uploadReady?: boolean; style?: React.CSSProperties }> = ({ file, onFile, status, uploadReady, style }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [fileError, setFileError] = React.useState('');
  // One gate for both drag-and-drop and the file dialog.
  const acceptFile = (f: File | null | undefined): void => {
    if (!f) { setFileError(''); onFile(null); return; }
    validateVideoFile(f, { allowedExt: NEW_UPLOAD_EXT }).then((err) => {
      if (err) { setFileError(err); return; }
      setFileError('');
      onFile(f);
    }).catch(() => setFileError('Could not read this file.'));
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ ...style, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
      <div
        style={{
          border: `2px dashed ${dragging ? tokens.color.blue : (status === 'error' && !uploadReady) ? tokens.color.danger : status === 'uploading' ? tokens.color.blue : file ? tokens.color.success : tokens.color.line}`,
          borderRadius: previewUrl ? `${tokens.radius.md} ${tokens.radius.md} 0 0` : tokens.radius.md,
          padding: '14px 18px',
          background: dragging ? tokens.color.tint : (status === 'error' && !uploadReady) ? tokens.color.dangerBg : status === 'uploading' ? tokens.color.tint : file ? tokens.color.successBg : tokens.color.bgSoft,
          cursor: status === 'uploading' ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'all .15s',
          borderBottom: previewUrl ? 'none' : undefined
        }}
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {status === 'uploading' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tokens.color.blue} strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ animation: 'bp-spin .8s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={(status === 'error' && !uploadReady) ? tokens.color.danger : file ? tokens.color.success : tokens.color.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            {(status === 'error' && !uploadReady)
              ? <React.Fragment><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></React.Fragment>
              : file
                ? <React.Fragment><polyline points="20 6 9 17 4 12" /></React.Fragment>
                : <React.Fragment><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></React.Fragment>
            }
          </svg>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {file ? (
            <>
              <div style={{ fontSize: tokens.font.small, fontWeight: 700, color: (status === 'error' && !uploadReady) ? tokens.color.danger : tokens.color.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: tokens.font.label, color: (status === 'error' && !uploadReady) ? tokens.color.danger : tokens.color.text }}>
                {(status === 'error' && !uploadReady) ? 'Upload failed - click × to re-pick' : status === 'uploading' ? 'Uploading...' : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
              </div>
            </>
          ) : (
            <div style={{ fontSize: tokens.font.small, color: tokens.color.text }}>
              Drop <strong>.mp4</strong> here or <span style={{ color: tokens.color.blue, fontWeight: 700 }}>click to browse</span>
            </div>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: tokens.color.text, fontSize: 16, lineHeight: 1, padding: 4 }}
          >
            &#x2715;
          </button>
        )}
        <input ref={inputRef} type="file" accept="video/mp4,.mp4" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ''; acceptFile(f); }} />
      </div>
      {fileError && !file && (
        <div role="alert" style={{ marginTop: 6, fontSize: tokens.font.label, color: tokens.color.danger, fontWeight: 600 }}>{fileError}</div>
      )}
      {previewUrl && (
        <video
          src={previewUrl}
          controls
          style={{
            display: 'block',
            width: '100%',
            maxHeight: 220,
            background: '#000',
            borderRadius: `0 0 ${tokens.radius.md} ${tokens.radius.md}`,
            border: `2px dashed ${tokens.color.success}`,
            borderTop: 'none'
          }}
        />
      )}
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
  const [attempted, setAttempted] = React.useState(false);
  const [lookupMsg, setLookupMsg] = React.useState<string>('');
  const [summary, setSummary] = React.useState<{ shared: IShared; rows: IRow[] } | null>(null);

  const doLookup = async (q: string): Promise<void> => {
    if (!q.trim()) return;
    setLookupMsg('');
    try {
      const b = await api.lookupBinusian(q.trim());
      if (!b) { setLookupMsg(`No lecturer matched "${q}".`); return; }
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
      setLookupMsg(`Loaded from BINUS: ${b.Name || ''} (${b.KodeDosen || ''}).`);
    } catch (e) {
      setLookupMsg('Lookup failed. Check sign-in.');
    }
  };

  const setS = (k: keyof IShared, v: string): void => setShared((p) => ({ ...p, [k]: v }));
  const setRow = (id: string, patch: Partial<IRow>): void =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const sharedRef = React.useRef(shared);
  sharedRef.current = shared;
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;

  const buildRequestFrom = (sh: IShared, row: IRow): IUploadSessionRequest | string => {
    if (!sh.Email || !sh.Name || !sh.KodeDosen) return 'missing-lecturer';
    if (!sh.KodeMatakuliah || !sh.NamaMatakuliah || !sh.RumpunIlmu || !sh.Kampus || !sh.Fakultas || !sh.Jurusan) return 'missing-course';
    if (!row.Topik || !row.JudulVideo) return 'missing-row';
    if (!row.file) return 'missing-file';
    if (!row.tempItemId) return 'missing-upload';
    return {
      Email: sh.Email, Name: sh.Name, KodeDosen: sh.KodeDosen,
      KodeMatakuliah: sh.KodeMatakuliah, NamaMatakuliah: sh.NamaMatakuliah,
      Topik: row.Topik, Description: buildDescription(row.Topik),
      Week: row.Week, Session: row.Session, JudulVideo: row.JudulVideo,
      RumpunIlmu: sh.RumpunIlmu, Kampus: sh.Kampus, Fakultas: sh.Fakultas,
      Jurusan: sh.Jurusan, Tags: buildTags(sh.Tags, sh.Kampus),
      TempItemId: row.tempItemId, TempFileName: row.file.name
    };
  };

  const startTempUpload = React.useCallback(async (id: string, file: File, videoIndex: number): Promise<void> => {
    setRow(id, { file, status: 'uploading', progress: 0, speedBps: 0, lastChunkAt: Date.now(), message: undefined, tempItemId: undefined });
    try {
      const session = await api.createTempUploadSession(file.name, videoIndex);
      if (!session) { setRow(id, { status: 'error', message: 'Failed to create temp upload session.' }); return; }
      const itemId = await uploadChunked(file, session.uploadUrl, (confirmedPct, speedBps, lastChunkAt) =>
        setRow(id, { progress: confirmedPct, speedBps, lastChunkAt })
      );
      if (!itemId) { setRow(id, { status: 'error', message: 'Upload done but SP item ID missing. Retry.' }); return; }
      setRow(id, { status: 'ready', progress: 100, speedBps: 0, tempItemId: itemId });
    } catch (e) {
      setRow(id, { status: 'error', message: e instanceof Error ? e.message : 'Upload failed.' });
    }
  }, [api]);

  const validationMsg: Record<string, string> = {
    'missing-lecturer': 'Lecturer fields incomplete.',
    'missing-course': 'Course fields incomplete.',
    'missing-row': 'Topik and Judul Video are required.',
    'missing-file': 'No file attached.',
    'missing-upload': 'File not uploaded yet. Wait for upload to finish or re-pick the file.',
  };

  const submitRow = React.useCallback(async (row: IRow, sh: IShared): Promise<void> => {
    const req = buildRequestFrom(sh, row);
    if (typeof req === 'string') { setRow(row.id, { status: 'error', message: validationMsg[req] || req }); return; }
    setRow(row.id, { status: 'submitting', message: undefined });
    try {
      const session = await api.createUploadSession(req);
      if (!session) { setRow(row.id, { status: 'error', message: 'Failed to register submission.' }); return; }
      const done = await api.completeUpload(session.recordId);
      if (done.ok) {
        setRow(row.id, { status: 'done', codeNumber: done.codeNumber });
      } else {
        setRow(row.id, { status: 'error', message: done.message });
      }
    } catch (e) {
      setRow(row.id, { status: 'error', message: e instanceof Error ? e.message : 'Submit failed.' });
    }
  }, [api]);

  const onRowFile = (id: string, f: File | null): void => {
    if (!f) { setRow(id, { file: null, status: 'pending', progress: 0, message: undefined, tempItemId: undefined }); return; }
    const parsed = parseFilename(f.name);
    const effectiveKodeMK = (parsed && parsed.KodeMatakuliah) || shared.KodeMatakuliah || '';
    if (effectiveKodeMK && !shared.KodeMatakuliah) {
      setShared((p) => ({ ...p, KodeMatakuliah: effectiveKodeMK }));
    }
    setRow(id, {
      KodeMatakuliah: effectiveKodeMK,
      Topik: (parsed && parsed.Topik) || '',
      Week: parsed && parsed.Week ? String(parsed.Week) : '1',
      Session: parsed && parsed.Session ? String(parsed.Session) : '1',
      JudulVideo: (parsed && parsed.JudulVideo) || sanitizeName(f.name.replace(/\.[^.]+$/, '')).slice(0, 50),
      message: undefined
    });
    const videoIndex = rowsRef.current.findIndex((r) => r.id === id) + 1;
    void startTempUpload(id, f, videoIndex);
  };

  const runAll = async (): Promise<void> => {
    setError('');
    setAttempted(true);
    const sh = sharedRef.current;
    const hasLecturerError = !sh.Email || !sh.Name || !sh.KodeDosen;
    const hasCourseError = !sh.KodeMatakuliah || !sh.NamaMatakuliah || !sh.RumpunIlmu || !sh.Kampus || !sh.Fakultas || !sh.Jurusan;
    const hasRowTopikError = rowsRef.current.some((r) => r.file && !r.Topik);
    const hasRowJudulError = rowsRef.current.some((r) => r.file && !r.JudulVideo);
    if (hasLecturerError || hasCourseError || hasRowTopikError || hasRowJudulError) {
      setTimeout(() => {
        const el = document.querySelector('[data-field-error]') as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    const ready = rowsRef.current.filter((r) => r.status === 'ready' || (r.status === 'error' && !!r.tempItemId));
    if (ready.length === 0) {
      const uploadingRow = rowsRef.current.find((r) => r.status === 'uploading');
      if (uploadingRow) {
        const el = document.querySelector(`[data-row-id="${uploadingRow.id}"]`) as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setRunning(true);
    try {
      for (const row of ready) {
        await submitRow(row, sh);
      }
    } finally {
      setRunning(false);
      const done = rowsRef.current.filter((r) => r.status === 'done');
      if (done.length > 0) setSummary({ shared: sharedRef.current, rows: done });
    }
  };

  const onlyDigits = (v: string): string => v.replace(/\D+/g, '').slice(0, 5);

  const addRow = (): void => setRows((prev) => [...prev, makeRow()]);

  const removeRow = (id: string): void => setRows((prev) => prev.filter((r) => r.id !== id));

  const startNewBatch = (): void => {
    setSummary(null);
    setRows([makeRow()]);
    setShared((p) => ({ ...p, KodeMatakuliah: '', NamaMatakuliah: '', RumpunIlmu: '', Tags: '' }));
    setError('');
  };

  const statusColor: Record<RowStatus, string> = {
    pending: tokens.color.text,
    uploading: tokens.color.blue,
    ready: tokens.color.success,
    submitting: tokens.color.blue,
    done: tokens.color.success,
    error: tokens.color.danger
  };

  const statusLabel: Record<RowStatus, string> = {
    pending: '',
    uploading: 'uploading',
    ready: 'ready to submit',
    submitting: 'submitting...',
    done: '',
    error: 'error'
  };

  if (summary) {
    return <SummaryView summary={summary} onNew={startNewBatch} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>

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
              data-row-id={row.id}
              style={{
                border: `1px solid ${tokens.color.line}`,
                borderRadius: tokens.radius.lg,
                background: tokens.color.bg,
                overflow: 'hidden'
              }}
            >
              <div style={{ background: tokens.color.surfaceAlt, borderBottom: `1px solid ${tokens.color.line}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: tokens.color.blue, color: '#fff', fontSize: tokens.font.label, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.ink }}>Video {idx + 1}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: tokens.space.md }}>
                    {row.status === 'uploading' && row.file && (
                      <SmoothProgress confirmedPct={row.progress} speedBps={row.speedBps} totalBytes={row.file.size} lastChunkAt={row.lastChunkAt} active={true}>
                        {(pct) => (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: tokens.font.label, fontWeight: 700, color: tokens.color.blue, fontVariantNumeric: 'tabular-nums' }}>
                              {pct.toFixed(2).replace('.', ',')}%
                            </span>
                            {row.progress >= 50 && (
                              <span style={{
                                fontSize: tokens.font.micro,
                                fontWeight: 700,
                                color: '#D97706',
                                background: '#FEF3C7',
                                border: '1px solid #FCD34D',
                                borderRadius: tokens.radius.sm,
                                padding: '1px 5px',
                                letterSpacing: '.02em',
                                animation: 'bp-boost-in .25s ease'
                              }}>
                                ⚡ Boost
                              </span>
                            )}
                          </span>
                        )}
                      </SmoothProgress>
                    )}
                    <span style={{ fontSize: tokens.font.label, fontWeight: 700, color: statusColor[row.status] }}>
                      {row.status === 'done' && row.codeNumber ? row.codeNumber : statusLabel[row.status]}
                    </span>
                    {(row.status === 'pending' || row.status === 'error') && rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(row.id)} className="dams-btn-link">
                        Remove
                      </button>
                    )}
                  </span>
                </div>
                {(row.status === 'uploading' || row.status === 'submitting') && (
                  <div style={{ height: 3, background: tokens.color.line }}>
                    {row.status === 'submitting' ? (
                      <div style={{ height: '100%', width: '100%', background: tokens.color.blue, animation: 'bp-pulse-bar 1s ease infinite' }} />
                    ) : row.file ? (
                      <SmoothProgress confirmedPct={row.progress} speedBps={row.speedBps} totalBytes={row.file.size} lastChunkAt={row.lastChunkAt} active={true}>
                        {(pct) => <div style={{ height: '100%', width: `${pct}%`, background: tokens.color.blue }} />}
                      </SmoothProgress>
                    ) : (
                      <div style={{ height: '100%', width: `${row.progress}%`, background: tokens.color.blue }} />
                    )}
                  </div>
                )}
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
                    status={row.status}
                    uploadReady={!!row.tempItemId}
                    style={{ marginBottom: tokens.space.md }}
                  />
                  <div style={{ display: 'grid', gap: tokens.space.sm, gridTemplateColumns: 'repeat(12, 1fr)' }}>
                    <Field label="Week" style={{ gridColumn: 'span 2 / span 2' }}>
                      <TextInput inputMode="numeric" pattern="[0-9]*" maxLength={5} value={row.Week} onChange={(e) => setRow(row.id, { Week: onlyDigits(e.target.value) })} placeholder="01" />
                    </Field>
                    <Field label="Session" style={{ gridColumn: 'span 2 / span 2' }}>
                      <TextInput inputMode="numeric" pattern="[0-9]*" maxLength={5} value={row.Session} onChange={(e) => setRow(row.id, { Session: onlyDigits(e.target.value) })} placeholder="01" />
                    </Field>
                    <Field label="Topik" style={{ gridColumn: 'span 4 / span 4' }} error={attempted && !row.Topik ? 'Required' : undefined}>
                      <TextInput value={row.Topik} onChange={(e) => setRow(row.id, { Topik: sanitizeName(e.target.value) })} placeholder="Pointers and Memory" hasError={attempted && !row.Topik} />
                    </Field>
                    <Field label="Judul Video" style={{ gridColumn: 'span 4 / span 4' }} error={attempted && !row.JudulVideo ? 'Required' : undefined}>
                      <TextInput maxLength={50} value={row.JudulVideo} onChange={(e) => setRow(row.id, { JudulVideo: sanitizeName(e.target.value) })} placeholder="Short title, max 50 chars" hasError={attempted && !row.JudulVideo} />
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

      <Card>
        <CardTitle sub="Applied to every video in this batch.">Lecturer</CardTitle>
        <div style={{ marginBottom: tokens.space.md }}>
          <label style={{ display: 'block', fontSize: tokens.font.label, fontWeight: 700, color: tokens.color.text, marginBottom: 6 }}>
            Search from existing submissions
          </label>
          <LiveSearch<{ KodeDosen: string; Name: string | null; Email: string | null; Kampus: string | null; Fakultas: string | null; Jurusan: string | null; Count: number }>
            placeholder="Type name, kode, or email..."
            onSearch={(q, signal) => api.searchDosens(q, signal)}
            onSelect={(item) => {
              setShared((p) => ({
                ...p,
                Email: item.Email || p.Email,
                Name: item.Name || p.Name,
                KodeDosen: item.KodeDosen,
                Kampus: item.Kampus || p.Kampus,
                Fakultas: item.Fakultas || p.Fakultas,
                Jurusan: item.Jurusan || p.Jurusan,
              }));
              setLookupMsg(`Filled from DB: ${item.Name || ''} (${item.KodeDosen})`);
            }}
            renderOption={(item) => ({
              label: item.Name || item.KodeDosen,
              sublabel: `${item.KodeDosen} · ${item.Email || ''} · ${item.Fakultas || ''}`,
              badge: `${item.Count}x`
            })}
          />
          {lookupMsg && (
            <div style={{ marginTop: 6, fontSize: tokens.font.label, color: tokens.color.success, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {lookupMsg}
            </div>
          )}
          <div style={{ marginTop: tokens.space.sm, fontSize: tokens.font.label, color: tokens.color.text }}>
            Or enter manually below. "Search by BINUS directory": type email/kode above and press{' '}
            <button type="button" onClick={() => { void doLookup(shared.Email || shared.KodeDosen); }} style={{ background: 'none', border: 'none', color: tokens.color.blue, cursor: 'pointer', padding: 0, font: 'inherit', fontSize: tokens.font.label, fontWeight: 700, textDecoration: 'underline' }}>Lookup BINUS</button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'end' }}>
          <Field label="Email" style={{ gridColumn: 'span 4 / span 4' }} error={attempted && !shared.Email ? 'Required' : undefined}>
            <TextInput value={shared.Email} onChange={(e) => setS('Email', e.target.value)} placeholder="lecturer@binus.ac.id" hasError={attempted && !shared.Email} />
          </Field>
          <Field label="Name" style={{ gridColumn: 'span 5 / span 5' }} error={attempted && !shared.Name ? 'Required' : undefined}>
            <TextInput value={shared.Name} onChange={(e) => setS('Name', e.target.value)} placeholder="Full name with degree" hasError={attempted && !shared.Name} />
          </Field>
          <Field label="Kode Dosen" style={{ gridColumn: 'span 3 / span 3' }} error={attempted && !shared.KodeDosen ? 'Required' : undefined}>
            <TextInput value={shared.KodeDosen} onChange={(e) => setS('KodeDosen', e.target.value.toUpperCase())} placeholder="D1234" hasError={attempted && !shared.KodeDosen} />
          </Field>
          <Field label="Kampus" style={{ gridColumn: 'span 4 / span 4' }} error={attempted && !shared.Kampus ? 'Required' : undefined}>
            <Combobox options={campuses} value={shared.Kampus} onChange={(v) => setS('Kampus', v)} placeholder="Pilih kampus" hasError={attempted && !shared.Kampus} />
          </Field>
          <Field label="Fakultas" style={{ gridColumn: 'span 4 / span 4' }} error={attempted && !shared.Fakultas ? 'Required' : undefined}>
            <Combobox options={faculties} value={shared.Fakultas} onChange={(v) => setS('Fakultas', v)} placeholder="Pilih fakultas" allowFree hasError={attempted && !shared.Fakultas} />
          </Field>
          <Field label="Jurusan" style={{ gridColumn: 'span 4 / span 4' }} error={attempted && !shared.Jurusan ? 'Required' : undefined}>
            <Combobox options={departments} value={shared.Jurusan} onChange={(v) => setS('Jurusan', v)} placeholder="Pilih jurusan" allowFree hasError={attempted && !shared.Jurusan} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle sub="Shared across all videos in this batch.">Course</CardTitle>
        <div style={{ marginBottom: tokens.space.md }}>
          <label style={{ display: 'block', fontSize: tokens.font.label, fontWeight: 700, color: tokens.color.text, marginBottom: 6 }}>
            Search matakuliah from existing submissions
          </label>
          <LiveSearch<{ KodeMatakuliah: string; NamaMatakuliah: string | null; RumpunIlmu: string | null; Count: number }>
            placeholder="Type kode or nama matakuliah..."
            onSearch={(q, signal) => api.searchMatakuliah(q, signal)}
            onSelect={(item) => {
              setShared((p) => ({
                ...p,
                KodeMatakuliah: item.KodeMatakuliah,
                NamaMatakuliah: item.NamaMatakuliah || p.NamaMatakuliah,
                RumpunIlmu: item.RumpunIlmu || p.RumpunIlmu,
              }));
            }}
            renderOption={(item) => ({
              label: item.KodeMatakuliah,
              sublabel: `${item.NamaMatakuliah || ''} · ${item.RumpunIlmu || ''}`,
              badge: `${item.Count}x`
            })}
          />
        </div>
        <div style={{ display: 'grid', gap: tokens.space.md, gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'end' }}>
          <Field label="Kode Matakuliah" style={{ gridColumn: 'span 3 / span 3' }} error={attempted && !shared.KodeMatakuliah ? 'Required' : undefined}>
            <TextInput value={shared.KodeMatakuliah} onChange={(e) => setS('KodeMatakuliah', sanitizeName(e.target.value).toUpperCase())} placeholder="COMP6047" maxLength={16} hasError={attempted && !shared.KodeMatakuliah} />
          </Field>
          <Field label="Nama Matakuliah" style={{ gridColumn: 'span 5 / span 5' }} error={attempted && !shared.NamaMatakuliah ? 'Required' : undefined}>
            <TextInput value={shared.NamaMatakuliah} onChange={(e) => setS('NamaMatakuliah', sanitizeName(e.target.value))} placeholder="Introduction to C Programming I" hasError={attempted && !shared.NamaMatakuliah} />
          </Field>
          <Field label="Rumpun Ilmu" style={{ gridColumn: 'span 4 / span 4' }} error={attempted && !shared.RumpunIlmu ? 'Required' : undefined}>
            <TextInput value={shared.RumpunIlmu} onChange={(e) => setS('RumpunIlmu', e.target.value)} placeholder="Hospitality Knowledge" hasError={attempted && !shared.RumpunIlmu} />
          </Field>
          <Field label="Tags / Keywords" hint={`Auto-append: vbl, video based learning, CAMPUS: ${shared.Kampus}`} style={{ gridColumn: 'span 12 / span 12' }}>
            <TextInput value={shared.Tags} onChange={(e) => setS('Tags', e.target.value)} placeholder="event, hospitality, introduction" />
          </Field>
        </div>
      </Card>

      {(() => {
        const withFile = rows.filter((r) => r.file);
        const uploading = withFile.filter((r) => r.status === 'uploading');
        const readyRows = withFile.filter((r) => r.status === 'ready' || (r.status === 'error' && !!r.tempItemId));
        const submittingRows = withFile.filter((r) => r.status === 'submitting');
        const doneRows = withFile.filter((r) => r.status === 'done');
        const anyUploading = uploading.length > 0;
        // Bytes-weighted confirmed pct across all rows (raw, pre-pessimistic)
        const totalBytesAll = withFile.reduce((s, r) => s + (r.file ? r.file.size : 0), 0);
        const confirmedBytesAll = withFile.reduce((s, r) => s + (r.file ? (r.progress / 100) * r.file.size : 0), 0);
        const overallRawPct = totalBytesAll === 0 ? 0 : (confirmedBytesAll / totalBytesAll) * 100;
        // Aggregate speed + recency for SmoothProgress
        const aggSpeedBps = uploading.reduce((s, r) => s + r.speedBps, 0);
        const aggLastChunkAt = uploading.reduce((max, r) => Math.max(max, r.lastChunkAt), 0);
        const canSubmit = !running && readyRows.length > 0;

        let footerText = '';
        if (withFile.length === 0) footerText = 'Drop videos above to start uploading immediately.';
        else if (anyUploading) footerText = `Uploading ${uploading.length} video${uploading.length > 1 ? 's' : ''} to cloud...`;
        else if (readyRows.length > 0) footerText = `${readyRows.length} video${readyRows.length > 1 ? 's' : ''} ready. Fill Lecturer + Course, then submit.`;
        else if (submittingRows.length > 0) footerText = `Submitting ${submittingRows.length} video${submittingRows.length > 1 ? 's' : ''}...`;
        else if (doneRows.length > 0) footerText = `${doneRows.length} video${doneRows.length > 1 ? 's' : ''} submitted.`;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.md, padding: '14px 20px', background: tokens.color.bg, border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.md }}>
            <SpeedBoost active={anyUploading} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {anyUploading ? (
                <SmoothProgress confirmedPct={overallRawPct} speedBps={aggSpeedBps} totalBytes={totalBytesAll} lastChunkAt={aggLastChunkAt} active={true}>
                  {(pct) => (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: tokens.font.label, color: tokens.color.text }}>{footerText}</span>
                        <span style={{ fontSize: tokens.font.label, fontWeight: 700, color: tokens.color.blue, fontVariantNumeric: 'tabular-nums' }}>
                          {pct.toFixed(2).replace('.', ',')}%
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: tokens.color.line, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: tokens.color.blue, borderRadius: 999 }} />
                      </div>
                    </>
                  )}
                </SmoothProgress>
              ) : (
                <span style={{ fontSize: tokens.font.small, color: tokens.color.text }}>{footerText}</span>
              )}
            </div>
            <PrimaryButton
              type="button"
              onClick={() => { void runAll(); }}
              disabled={!canSubmit}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {running ? 'Submitting...' : `Submit ${readyRows.length > 0 ? readyRows.length : withFile.length} ${(readyRows.length > 0 ? readyRows.length : withFile.length) === 1 ? 'video' : 'videos'}`}
            </PrimaryButton>
          </div>
        );
      })()}
    </div>
  );
};

const VideoPreviewThumb: React.FC<{ file: File | null }> = ({ file }) => {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) return null;
  return (
    <video
      src={url}
      style={{ width: '100%', maxHeight: 160, borderRadius: tokens.radius.md, background: '#000', display: 'block', objectFit: 'contain' }}
      muted
      preload="metadata"
    />
  );
};

const SummaryView: React.FC<{ summary: { shared: IShared; rows: IRow[] }; onNew: () => void }> = ({ summary, onNew }) => {
  const { shared, rows } = summary;
  const total = rows.length;
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyCode = (code: string): void => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const printRecap = (): void => window.print();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.lg }}>

      {/* Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.md }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: tokens.color.blue, color: '#fff', fontSize: 22, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 44px' }}>✓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: tokens.font.h3, color: tokens.color.ink, fontWeight: 700 }}>
              {total} video{total === 1 ? '' : 's'} submitted
            </div>
            <div style={{ fontSize: tokens.font.label, color: tokens.color.text, marginTop: 2 }}>
              Confirmation email sent to <strong>{shared.Email}</strong>. Your video{total === 1 ? '' : 's'} will be reviewed by the DAMS team within 3-5 working days.
            </div>
          </div>
          <div style={{ display: 'flex', gap: tokens.space.sm, flexShrink: 0 }}>
            <GhostButton type="button" onClick={printRecap}>Print / Save PDF</GhostButton>
            <PrimaryButton type="button" onClick={onNew}>Upload more</PrimaryButton>
          </div>
        </div>
      </Card>

      {/* Videos - moved up */}
      <Card>
        <CardTitle sub={`${total} item${total === 1 ? '' : 's'} successfully submitted.`}>Videos submitted</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>
          {rows.map((r, idx) => (
            <div
              key={r.id}
              style={{
                border: `1px solid ${tokens.color.tintBorder}`,
                background: tokens.color.tint,
                borderRadius: tokens.radius.md,
                overflow: 'hidden'
              }}
            >
              {r.file && (
                <VideoPreviewThumb file={r.file} />
              )}
              <div style={{ padding: tokens.space.md }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.space.sm, marginBottom: tokens.space.sm }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: tokens.color.blue, color: '#fff', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 28px', marginTop: 1 }}>
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: tokens.font.body, fontWeight: 700, color: tokens.color.ink }}>{r.JudulVideo || r.Topik}</div>
                    <div style={{ fontSize: tokens.font.label, color: tokens.color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.file ? `${r.file.name} · ${(r.file.size / 1024 / 1024).toFixed(1)} MB` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: tokens.space.xs, alignItems: 'center', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => copyCode(r.codeNumber || '')}
                      style={{ fontFamily: 'monospace', fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.blueDark, background: tokens.color.bg, border: `1px solid ${tokens.color.tintBorder}`, borderRadius: tokens.radius.sm, padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title="Copy code"
                    >
                      {copied === r.codeNumber ? 'Copied!' : r.codeNumber}
                    </button>
                    {r.link && (
                      <button
                        type="button"
                        onClick={() => window.open(r.link!, '_blank')}
                        className="dams-btn-ghost"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Open in SharePoint
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.space.sm }}>
                  <SumField col={1} label="Week">{r.Week}</SumField>
                  <SumField col={1} label="Session">{r.Session}</SumField>
                  <SumField col={1} label="Topik">{r.Topik}</SumField>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Submission details - renamed + tidier */}
      <Card>
        <CardTitle sub="Applied to every video in this batch.">Submission details</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: `${tokens.space.md} ${tokens.space.lg}` }}>
          <SumField col={1} label="Lecturer">{shared.Name}{shared.KodeDosen ? ` (${shared.KodeDosen})` : ''}</SumField>
          <SumField col={1} label="Email">{shared.Email}</SumField>
          <SumField col={1} label="Kampus">{shared.Kampus}</SumField>
          <SumField col={1} label="Fakultas">{shared.Fakultas}</SumField>
          <SumField col={1} label="Jurusan">{shared.Jurusan}</SumField>
          <SumField col={1} label="Rumpun Ilmu">{shared.RumpunIlmu}</SumField>
          <SumField col={1} label="Kode MK">{shared.KodeMatakuliah}</SumField>
          <SumField col={2} label="Nama MK">{shared.NamaMatakuliah}</SumField>
          <div style={{ gridColumn: 'span 3' }}><SumField col={3} label="Tags / Keywords">{buildTags(shared.Tags, shared.Kampus)}</SumField></div>
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
