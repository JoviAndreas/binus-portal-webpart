import { AppCategory } from './types';

const RULES: Array<{ test: RegExp; cat: AppCategory }> = [
  { test: /binusmaya|newbinusmaya|online ?learning|\bol\b|bulc|ol\.binus|onlinelearning|lms/i, cat: 'Academic' },
  { test: /admission|payment|scdc|student|parent|graduate|doctorate|enrichment|hsep|alumni/i, cat: 'Student' },
  { test: /human ?capital|\bhc\b|employee|recruitment|rectorate|staff|corporate ?learning|professional ?development|teaching|teach for/i, cat: 'Faculty & Staff' },
  { test: /finance|budget|payment|payroll/i, cat: 'Finance' },
  { test: /library|web library/i, cat: 'Library' },
  { test: /school|simprug|serpong|bekasi|kalbis|kindergarten|m-?sis|cbt|cbl|antrian|queue|boarders|e-?desk|desk/i, cat: 'Schools' },
  { test: /university|binus group|binus\.edu|binus\.ac\.id|binus square|business school|research|international|extension|consulting|creates|center|biduk|ayosekolah|rise/i, cat: 'BINUS Group' },
  { test: /portal|km|yammer|mail|general affair|gfservice|career|expo|certified|legal|lost and found|marketing|monitoring|government|akreditasi|questionnaire|tv wall|qmc|sac|collaboration|pos|room reservation|cms|ami|english language|megastore|website|bsis|ops|admission online/i, cat: 'Tools' }
];

export function categorize(title: string, url?: string): AppCategory {
  const hay = `${title} ${url || ''}`;
  for (const r of RULES) if (r.test.test(hay)) return r.cat;
  return 'Other';
}

export function normalizeUrl(u: string): string {
  if (!u) return u;
  let out = u.trim();
  if (/^http:\/\//i.test(out)) {
    const host = out.replace(/^http:\/\//i, '').split('/')[0].toLowerCase();
    if (/\.binus\.|\.binus-school\.|binus\.edu|binus\.ac\.id|binuscenter|binusconsulting|binuscareer|teachforindonesia|ayosekolah|kalbis\.ac\.id|rise-id\.com|kaj\.or\.id/.test(host)) {
      out = 'https://' + out.substring(7);
    }
  }
  return out;
}

export function dedupKey(item: { url: string; title: string }): string {
  try {
    const u = new URL(item.url);
    return (u.host + u.pathname).toLowerCase().replace(/\/+$/, '');
  } catch {
    return item.title.toLowerCase().trim();
  }
}
