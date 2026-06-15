// Shared input sanitizers and VBL filename helpers, ported from the DAMS web frontend.

// Chars forbidden by SharePoint/DAMS for file + folder names.
export const INVALID_CHARS_REGEX = /[*:<>?\\/"|]/g;

export function sanitizeName(input: string): string {
  return input.replace(INVALID_CHARS_REGEX, '');
}

// Strip forbidden chars + trailing dots.
export function sanitizeFileSafe(input: string): string {
  return input.replace(INVALID_CHARS_REGEX, '').replace(/\.+$/, '');
}

export interface IParsedFilename {
  KodeMatakuliah?: string;
  Week?: number;
  Session?: number;
  Topik?: string;
  JudulVideo?: string;
  Description?: string;
}

// Pattern: {KodeMK}_{WW}{SS}_{Topik}.mp4
export const FILENAME_PATTERN = /^([A-Za-z]+\d+)_(\d{2})(\d{2})_(.+)\.mp4$/i;

export function parseFilename(name: string): IParsedFilename | null {
  const m = name.match(FILENAME_PATTERN);
  if (!m) return null;
  const kode = m[1];
  const week = m[2];
  const session = m[3];
  const topik = m[4].replace(/_/g, ' ').trim();
  return {
    KodeMatakuliah: kode.toUpperCase(),
    Week: Number(week),
    Session: Number(session),
    Topik: topik,
    JudulVideo: topik.slice(0, 50),
    Description: buildDescription(topik)
  };
}

export function buildDescription(topik: string): string {
  return `Video ini membahas tentang ${topik}`;
}

export function buildTags(baseTags: string, kampus: string): string {
  const required = ['vbl', 'video based learning', `CAMPUS: ${kampus}`];
  const existing = (baseTags || '').split(',').map((t) => t.trim()).filter(Boolean);
  for (const r of required) {
    if (!existing.some((e) => e.toLowerCase() === r.toLowerCase())) existing.push(r);
  }
  return existing.join(', ');
}

// Campus code (binuspages) -> VBL campus value.
const CAMPUS_MAP: Record<string, string> = {
  CSKMG: 'Jakarta',
  CSALS: 'Jakarta',
  CSBKS: 'Jakarta',
  CSJWC: 'Senayan',
  CSBOL: 'BiOn',
  CSMLG: 'Malang',
  CSBDG: 'Bandung',
  CSSMG: 'Semarang',
  CSMDN: 'Medan'
};

export function mapCampus(code: string | null | undefined): string {
  if (!code) return 'Jakarta';
  return CAMPUS_MAP[code.toUpperCase()] || 'Jakarta';
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
}

// Pick the best token-overlap match from a list (used to fuzzy-match faculty/department).
export function fuzzyPick(needle: string, haystack: string[]): string | null {
  if (!needle || haystack.length === 0) return null;
  const nTokens: Record<string, boolean> = {};
  for (const t of tokenize(needle)) nTokens[t] = true;
  let best: { v: string; score: number } | null = null;
  for (const v of haystack) {
    const hTokens: Record<string, boolean> = {};
    for (const t of tokenize(v)) hTokens[t] = true;
    let score = 0;
    for (const t of Object.keys(nTokens)) if (hTokens[t]) score++;
    if (score > 0 && (best === null || score > best.score)) best = { v, score };
  }
  return best ? best.v : null;
}
