import { photos } from './tokens';

export interface IFeaturedItem {
  title: string;
  desc: string;
  href: string;
  image: string;
}

const PHOTO_KEYS: { [k: string]: string } = {
  kmap: photos.kmap,
  competition: photos.competition,
  ideation: photos.ideation,
  heroBg: photos.heroBg,
  banner: photos.banner
};

export const DEFAULT_FEATURED: IFeaturedItem[] = [
  {
    title: 'Knowledge Mapping 2.0',
    desc: 'New Knowledge Mapping Application for your Unit / Study Program',
    href: '/SitePages/Knowledge-Mapping-App.aspx',
    image: 'kmap'
  },
  {
    title: 'Competition Catalog',
    desc: 'Discover the ongoing competitions and share your competition information to other Binusians',
    href: '/SitePages/Competition-Catalog.aspx',
    image: 'competition'
  },
  {
    title: 'Ideation System',
    desc: 'Share your idea and thoughts, and form a team to innovate',
    href: '/SitePages/Ideation-System.aspx',
    image: 'ideation'
  }
];

export function resolveImage(key: string): string {
  if (!key) return PHOTO_KEYS.kmap;
  return PHOTO_KEYS[key] || key;
}

export function parseFeatured(raw: string | undefined): IFeaturedItem[] {
  if (!raw || !raw.trim()) return DEFAULT_FEATURED;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.length) return DEFAULT_FEATURED;
    return arr.slice(0, 6).map((x: Partial<IFeaturedItem>) => ({
      title: x.title || '',
      desc: x.desc || '',
      href: x.href || '#',
      image: x.image || 'kmap'
    }));
  } catch {
    return DEFAULT_FEATURED;
  }
}

export function defaultFeaturedJson(): string {
  return JSON.stringify(DEFAULT_FEATURED, null, 2);
}
