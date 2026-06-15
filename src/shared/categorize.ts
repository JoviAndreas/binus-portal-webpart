import { ICategoriesConfig } from './categoriesConfig';

export interface IResolvedCategory {
  key: string;
  label: string;
  color: string;
  icon: string;
}

export function categorize(
  title: string,
  url: string,
  cfg: ICategoriesConfig
): IResolvedCategory {
  const hay = `${title} ${url}`.toLowerCase();
  const titleLower = title.toLowerCase().trim();
  const overrideKey = cfg.overrides[titleLower];
  if (overrideKey) {
    const c = cfg.categories.find((x) => x.key === overrideKey);
    if (c) return { key: c.key, label: c.label, color: c.color, icon: c.icon };
  }
  for (const c of cfg.categories) {
    for (const m of c.match) {
      try {
        if (new RegExp(m, 'i').test(hay)) {
          return { key: c.key, label: c.label, color: c.color, icon: c.icon };
        }
      } catch {
        /* invalid regex, skip */
      }
    }
  }
  return {
    key: 'other',
    label: cfg.otherLabel || 'Other',
    color: cfg.otherColor || '#6B7280',
    icon: cfg.otherIcon || 'grid'
  };
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
