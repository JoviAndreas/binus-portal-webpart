import { IconName } from './Icon';
import { tokens } from './tokens';

export interface ICategoryDef {
  key: string;
  label: string;
  color: string;
  icon: IconName;
  match: string[];
}

export interface ICategoriesConfig {
  categories: ICategoryDef[];
  overrides: { [titleLower: string]: string };
  otherLabel?: string;
  otherColor?: string;
  otherIcon?: IconName;
}

export const DEFAULT_CONFIG: ICategoriesConfig = {
  categories: [
    {
      key: 'academic',
      label: 'Academic',
      color: tokens.color.blue,
      icon: 'graduationCap',
      match: [
        'binusmaya', 'newbinusmaya', 'online ?learning', '\\bol\\b', 'bulc', 'ol\\.binus',
        'onlinelearning', 'lms', 'enrichment', 'hsep', 'monitoring perkuliahan', 'ami',
        'english language services', 'corpu', 'blended', 'questionnaire', 'cbt', 'cbl'
      ]
    },
    {
      key: 'operations',
      label: 'Operations',
      color: tokens.color.blueDark,
      icon: 'wrench',
      match: [
        'finance', 'human ?capital', '\\bhc\\b', 'employee', 'recruitment', 'rectorate',
        'staff', 'corporate ?learning', 'professional ?development', 'mail', 'general affair',
        'gfservice', 'admission', 'payment', 'legal', 'lost and found', 'marketing intelligence',
        'pos commercial', 'room reservation', 'cms', 'budget', 'scdc', 'akreditasi', 'biduk'
      ]
    },
    {
      key: 'schools',
      label: 'Schools',
      color: tokens.color.orange,
      icon: 'school',
      match: [
        'binus-school', 'school serpong', 'school simprug', 'school bekasi', 'simprug',
        'serpong', 'bekasi', 'kalbis', 'rise', 'queue', 'parent desk', 'student desk',
        'staff desk', 'm-?sis', 'e-?desk', 'boarders', 'library', 'antrian', 'srsc',
        'tv wall', 'sac', 'qmc', 'collaboration', 'megastore'
      ]
    },
    {
      key: 'group',
      label: 'BINUS Group',
      color: tokens.color.orangeDark,
      icon: 'building',
      match: [
        'binus group', 'binus university', 'binus\\.edu', 'binus\\.ac\\.id', 'business school',
        'research', 'international', 'extension', 'consulting', 'creates', 'center',
        'binuscenter', 'binuscareer', 'teachforindonesia', 'ayosekolah', 'kaj\\.or\\.id',
        'square', 'bnsd', 'base\\.binus', 'website job expo', 'alumni', 'graduate', 'doctorate',
        'binus career', 'yammer', 'portal', 'km portal'
      ]
    }
  ],
  overrides: {},
  otherLabel: 'Other',
  otherColor: '#6B7280',
  otherIcon: 'grid'
};

export function parseConfig(raw: string | undefined): ICategoriesConfig {
  if (!raw || !raw.trim()) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.categories)) return DEFAULT_CONFIG;
    return {
      categories: parsed.categories.map((c: ICategoryDef) => ({
        key: c.key,
        label: c.label || c.key,
        color: c.color || tokens.color.blue,
        icon: c.icon || 'grid',
        match: Array.isArray(c.match) ? c.match : []
      })),
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
      otherLabel: parsed.otherLabel || 'Other',
      otherColor: parsed.otherColor || '#6B7280',
      otherIcon: parsed.otherIcon || 'grid'
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function defaultConfigJson(): string {
  return JSON.stringify(DEFAULT_CONFIG, null, 2);
}
