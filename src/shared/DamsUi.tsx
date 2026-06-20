import * as React from 'react';
import { tokens } from './tokens';
import { BinusLogo } from './BinusLogo';
import { SubmissionStatus, STATUS_VALUES, BUMPER_VALUES, IEditorInfo } from './damsTypes';

// Reusable binus.ac.id-styled primitives shared by the DAMS VBL webparts.

// One-time CSS injection for states inline styles cannot express (focus, hover,
// placeholder, file button). Mount <DamsStyles/> once at the top of each webpart.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
.dams-scope, .dams-scope *, .dams-scope *::before, .dams-scope *::after { box-sizing: border-box; }
.dams-scope { font-family: ${tokens.font.family}; }
.dams-in {
  width: 100%; padding: 9px 11px;
  font-family: ${tokens.font.family}; font-size: ${tokens.font.body};
  color: ${tokens.color.ink}; background: #fff;
  border: 1px solid ${tokens.color.inputBorder}; border-radius: ${tokens.radius.sm};
  outline: none; transition: border-color .12s, box-shadow .12s;
}
.dams-in:hover { border-color: ${tokens.color.inputHover}; }
.dams-in:focus { border-color: ${tokens.color.focus}; box-shadow: 0 0 0 3px rgba(0,142,211,.16); }
.dams-in::placeholder { color: ${tokens.color.placeholder}; }
select.dams-in {
  -webkit-appearance: none; -moz-appearance: none; appearance: none;
  padding-right: 34px; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8l3.5-3.5' stroke='%23008ED3' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
}
.dams-btn {
  font-family: ${tokens.font.family}; font-weight: 700; letter-spacing: .01em;
  border-radius: ${tokens.radius.sm}; cursor: pointer; transition: background .12s, box-shadow .12s, border-color .12s;
  display: inline-flex; align-items: center; gap: 7px;
}
.dams-btn:disabled { cursor: default; opacity: .55; }
.dams-btn-pri { color: #fff; background: ${tokens.color.blue}; border: 1px solid ${tokens.color.blue}; padding: 11px 22px; font-size: ${tokens.font.body}; }
.dams-btn-pri:not(:disabled):hover { background: ${tokens.color.blueDark}; border-color: ${tokens.color.blueDark}; box-shadow: 0 4px 12px rgba(0,142,211,.28); }
.dams-btn-ghost { color: ${tokens.color.blue}; background: #fff; border: 1px solid ${tokens.color.blue}; padding: 9px 16px; font-size: ${tokens.font.small}; }
.dams-btn-ghost:not(:disabled):hover { background: ${tokens.color.tint}; }
.dams-btn-link { color: ${tokens.color.text}; background: transparent; border: none; padding: 4px 6px; font-size: ${tokens.font.small}; font-weight: 600; }
.dams-btn-link:hover { color: ${tokens.color.danger}; }
.dams-file::-webkit-file-upload-button, .dams-file::file-selector-button {
  font-family: ${tokens.font.family}; font-weight: 700; font-size: ${tokens.font.small};
  color: ${tokens.color.blueDark}; background: ${tokens.color.tint}; border: 1px solid ${tokens.color.tintBorder};
  border-radius: ${tokens.radius.control}; padding: 7px 14px; margin-right: 12px; cursor: pointer;
}
.dams-file::file-selector-button:hover { background: #DCEFFA; }
.dams-opt { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: none; background: transparent; font-family: ${tokens.font.family}; font-size: ${tokens.font.body}; color: ${tokens.color.ink}; text-align: left; cursor: pointer; }
.dams-opt:hover { background: ${tokens.color.tint}; }
.dams-opt-sel { background: ${tokens.color.surfaceAlt}; }
.dams-row { transition: background .1s; }
.dams-row:hover { background: ${tokens.color.tint}; }
`;

export const DamsStyles: React.FC = () => {
  React.useEffect(() => {
    const ID = 'dams-vbl-styles';
    if (document.getElementById(ID)) return;
    const el = document.createElement('style');
    el.id = ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return null;
};

export interface IPillTab<T extends string = string> {
  value: T;
  label: string;
}

export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  variant = 'segment'
}: {
  tabs: IPillTab<T>[];
  value: T;
  onChange: (v: T) => void;
  variant?: 'segment' | 'chip';
}): React.ReactElement {
  if (variant === 'chip') {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            style={{
              padding: '6px 16px',
              fontSize: tokens.font.small,
              fontFamily: tokens.font.family,
              fontWeight: 700,
              border: `1.5px solid ${value === t.value ? tokens.color.blue : tokens.color.line}`,
              borderRadius: tokens.radius.pill,
              cursor: 'pointer',
              background: value === t.value ? tokens.color.blue : '#fff',
              color: value === t.value ? '#fff' : tokens.color.text,
              transition: 'all .15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 4, padding: '2px', background: tokens.color.bgSoft, borderRadius: tokens.radius.pill }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          style={{
            padding: '5px 14px',
            fontSize: tokens.font.small,
            fontFamily: tokens.font.family,
            fontWeight: 700,
            border: 'none',
            borderRadius: tokens.radius.pill,
            background: value === t.value ? '#fff' : 'transparent',
            color: value === t.value ? tokens.color.blue : tokens.color.text,
            cursor: 'pointer',
            boxShadow: value === t.value ? '0 1px 2px rgba(0,0,0,.1)' : 'none',
            transition: 'all .12s'
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// binus.ac.id page chrome: thin blue accent strip, white header band with the
// BINUS lockup on the left and the page title, closed by an orange rule.
export const HeaderBar: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div style={{ background: '#fff', borderRadius: `${tokens.radius.lg} ${tokens.radius.lg} 0 0`, overflow: 'hidden' }}>
    <div style={{ height: 4, background: `linear-gradient(90deg, ${tokens.color.blueDark}, ${tokens.color.blue} 55%, ${tokens.color.blueLight})` }} />
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.space.lg,
        padding: '20px 28px 18px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <BinusLogo height={34} />
        <span style={{ width: 1, height: 30, background: tokens.color.line }} />
        <h1 style={{ fontSize: tokens.font.h2, color: tokens.color.ink, margin: 0, fontWeight: 800, letterSpacing: '-.01em' }}>
          {title}
        </h1>
      </div>
      {right}
    </div>
    <div style={{ height: 3, background: tokens.color.orange }} />
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; pad?: boolean }> = ({ children, style, pad = true }) => (
  <div
    style={{
      background: tokens.color.bg,
      border: `1px solid ${tokens.color.line}`,
      borderRadius: tokens.radius.card,
      boxShadow: tokens.shadow.md,
      padding: pad ? '22px 24px 24px' : 0,
      ...style
    }}
  >
    {children}
  </div>
);

// binus signature: short orange accent bar to the left of a bold ink heading.
export const SectionHead: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div style={{ marginBottom: tokens.space.lg }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 18, borderRadius: 2, background: tokens.color.orange, display: 'inline-block' }} />
      <h3 style={{ fontSize: tokens.font.h3, color: tokens.color.ink, margin: 0, fontWeight: 800, letterSpacing: '-.01em' }}>{children}</h3>
    </div>
    {sub && <p style={{ fontSize: tokens.font.small, color: tokens.color.text, margin: '6px 0 0 14px' }}>{sub}</p>}
  </div>
);

// Back-compat alias (admin webpart imports CardTitle).
export const CardTitle = SectionHead;

export const Field: React.FC<{
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ label, hint, error, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
    <label style={{ fontSize: tokens.font.label, fontWeight: 700, color: tokens.color.ink, letterSpacing: '.01em' }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: tokens.font.micro, lineHeight: 1.4, color: tokens.color.text }}>{hint}</span>}
    {error && <span style={{ fontSize: tokens.font.micro, fontWeight: 700, color: tokens.color.danger }}>{error}</span>}
  </div>
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const { className, ...rest } = props;
  return <input {...rest} className={`dams-in${className ? ' ' + className : ''}`} />;
};

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => {
  const { className, style, ...rest } = props;
  return <textarea {...rest} className={`dams-in${className ? ' ' + className : ''}`} style={{ resize: 'vertical', ...(style || {}) }} />;
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; allowEmpty?: boolean }> = ({
  options,
  allowEmpty,
  className,
  ...props
}) => (
  <select {...props} className={`dams-in${className ? ' ' + className : ''}`}>
    {allowEmpty && <option value="">-</option>}
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const { className, ...rest } = props;
  return <button type="button" {...rest} className={`dams-btn dams-btn-pri${className ? ' ' + className : ''}`} />;
};

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const { className, ...rest } = props;
  return <button type="button" {...rest} className={`dams-btn dams-btn-ghost${className ? ' ' + className : ''}`} />;
};

export const STATUS_LABELS: Record<string, string> = {
  Pending:   'Pending',
  InReview:  'In Review',
  Approved:  'Approved',
  Rejected:  'Rejected',
  NeedsEdit: 'Needs Edit',
  Published: 'Published',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Pending: { bg: '#FDF1E0', fg: '#9A5B0E' },
  InReview: { bg: '#E7F3FB', fg: tokens.color.blueDark },
  NeedsEdit: { bg: tokens.color.dangerBg, fg: tokens.color.danger },
  Approved: { bg: tokens.color.successBg, fg: tokens.color.success },
  Rejected: { bg: '#F1F1F1', fg: tokens.color.text },
  Published: { bg: tokens.color.successBg, fg: '#11663A' }
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const c = STATUS_COLORS[(status as SubmissionStatus)] || { bg: tokens.color.bgSoft, fg: tokens.color.text };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 11px',
        fontSize: tokens.font.micro,
        fontWeight: 700,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.fg}22`,
        borderRadius: tokens.radius.pill
      }}
    >
      {STATUS_LABELS[status || ''] || status || 'Pending'}
    </span>
  );
};

const STATUS_PILL_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  Pending:    { bg: '#E7F3FB', fg: tokens.color.blueDark,  border: tokens.color.blue },
  InReview:   { bg: '#FFF8E1', fg: '#9A5B0E',              border: '#F3931B' },
  NeedsEdit:  { bg: tokens.color.dangerBg, fg: tokens.color.danger, border: tokens.color.danger },
  Approved:   { bg: tokens.color.successBg, fg: tokens.color.success, border: tokens.color.success },
  Rejected:   { bg: '#F1F1F1', fg: tokens.color.text,      border: '#999' },
  Published:  { bg: '#E8F5E9', fg: '#11663A',              border: '#2E7D32' }
};

export const StatusPills: React.FC<{
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div role="radiogroup" style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
    {STATUS_VALUES.map((s) => {
      const c = STATUS_PILL_COLORS[s] || { bg: tokens.color.bgSoft, fg: tokens.color.text, border: '#aaa' };
      const active = value === s;
      return (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={active}
          disabled={disabled}
          onClick={() => onChange(s)}
          style={{
            padding: '2px 7px',
            fontSize: '10.5px',
            fontFamily: tokens.font.family,
            fontWeight: 700,
            border: `1px solid ${active ? c.border : tokens.color.line}`,
            borderRadius: tokens.radius.pill,
            cursor: disabled ? 'default' : 'pointer',
            background: active ? c.bg : '#fff',
            color: active ? c.fg : tokens.color.text,
            opacity: disabled ? 0.55 : 1,
            transition: 'all .1s',
            whiteSpace: 'nowrap'
          }}
        >
          {STATUS_LABELS[s] || s}
        </button>
      );
    })}
  </div>
);

const BUMPER_SHORT: Record<string, string> = {
  'Ada Bumper':       'Ada',
  'Tidak Ada Bumper': 'Tidak Ada',
  'Tidak Berlaku':    'N/A'
};

export const BumperSegmented: React.FC<{
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div
    role="radiogroup"
    style={{
      display: 'inline-flex',
      border: `1px solid ${tokens.color.blue}`,
      borderRadius: tokens.radius.control,
      overflow: 'hidden'
    }}
  >
    {BUMPER_VALUES.map((b, i) => {
      const active = value === b;
      return (
        <button
          key={b}
          type="button"
          role="radio"
          aria-checked={active}
          disabled={disabled}
          onClick={() => onChange(b)}
          title={b}
          style={{
            padding: '4px 8px',
            fontSize: '10.5px',
            fontFamily: tokens.font.family,
            fontWeight: 700,
            border: 'none',
            borderLeft: i > 0 ? `1px solid ${tokens.color.blue}` : 'none',
            cursor: disabled ? 'default' : 'pointer',
            background: active ? tokens.color.blue : '#fff',
            color: active ? '#fff' : tokens.color.blue,
            opacity: disabled ? 0.55 : 1,
            transition: 'all .1s',
            whiteSpace: 'nowrap'
          }}
        >
          {BUMPER_SHORT[b] || b}
        </button>
      );
    })}
  </div>
);

export const ToggleSwitch: React.FC<{
  value?: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}> = ({ value, onChange, disabled, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <button
      type="button"
      role="switch"
      aria-checked={!!value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      style={{
        width: 34,
        height: 18,
        borderRadius: 9,
        border: 'none',
        padding: 0,
        background: value ? tokens.color.blue : tokens.color.line,
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        transition: 'background .15s',
        opacity: disabled ? 0.55 : 1,
        flexShrink: 0
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)'
        }}
      />
    </button>
    {label && <span style={{ fontSize: tokens.font.small, color: tokens.color.ink }}>{label}</span>}
  </div>
);

export const PicCombo: React.FC<{
  value?: string;
  editors: IEditorInfo[];
  onChange: (email: string) => void;
  disabled?: boolean;
}> = ({ value, editors, onChange, disabled }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const current = editors.find((e) => e.Email.toLowerCase() === (value || '').toLowerCase());
  const displayName = current
    ? current.Name.split(' ')[0]
    : value
    ? value.split('@')[0]
    : 'Unassigned';
  const initials = current
    ? current.Name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()
    : displayName.slice(0, 2).toUpperCase();

  const filtered = editors.filter(
    (e) =>
      !search ||
      e.Name.toLowerCase().includes(search.toLowerCase()) ||
      e.Email.toLowerCase().includes(search.toLowerCase())
  );

  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null);

  React.useEffect(() => {
    if (!open) { setCoords(null); return; }
    const update = (): void => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setCoords({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 220) });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const handler = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      const pop = document.getElementById('dams-pic-popover');
      if (pop && pop.contains(target)) return;
      setOpen(false);
      setSearch('');
    };
    document.addEventListener('mousedown', handler);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 9px 3px 5px',
          border: `1px solid ${tokens.color.line}`,
          borderRadius: tokens.radius.pill,
          background: '#fff',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '11px',
          fontFamily: tokens.font.family,
          color: tokens.color.ink,
          opacity: disabled ? 0.55 : 1,
          transition: 'border-color .1s'
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: value ? tokens.color.blue : tokens.color.line,
            color: value ? '#fff' : tokens.color.text,
            fontSize: '9px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {initials}
        </span>
        {displayName}
      </button>
      {open && coords && (
        <div
          id="dams-pic-popover"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            minWidth: coords.width,
            maxHeight: 260,
            overflowY: 'auto',
            background: '#fff',
            border: `1px solid ${tokens.color.line}`,
            borderRadius: tokens.radius.card,
            boxShadow: tokens.shadow.lg
          }}
        >
          <div style={{ padding: '7px 8px', borderBottom: `1px solid ${tokens.color.line}` }}>
            <input
              className="dams-in"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px' }}
              autoFocus
            />
          </div>
          {filtered.map((e) => (
            <button
              key={e.Email}
              type="button"
              className={`dams-opt${e.Email.toLowerCase() === (value || '').toLowerCase() ? ' dams-opt-sel' : ''}`}
              onClick={() => { onChange(e.Email); setOpen(false); setSearch(''); }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: tokens.color.blue,
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {e.Name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()}
              </span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.ink }}>{e.Name}</div>
                <div style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>{e.Jabatan}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.text }}>
              No editors found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

let _ssId = 0;
export const SearchableSelect: React.FC<{
  value?: string;
  options: string[];
  /** Extra searchable text per option value (e.g. name+email for a code) */
  optionMeta?: Record<string, string>;
  /** Optional display label per option value */
  optionLabel?: Record<string, string>;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}> = ({ value, options, optionMeta, optionLabel, onChange, placeholder = 'All', disabled, style }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const popId = React.useRef(`dams-ss-${++_ssId}`).current;
  const POP_W = 240;

  const q = search.toLowerCase();
  const filtered = options.filter((o) => {
    if (!q) return true;
    if (o.toLowerCase().includes(q)) return true;
    if (optionMeta?.[o]?.toLowerCase().includes(q)) return true;
    return false;
  });

  React.useEffect(() => {
    if (!open) { setCoords(null); return; }
    const update = (): void => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const w = Math.max(r.width, POP_W);
      const left = Math.min(r.left, window.innerWidth - w - 8);
      setCoords({ top: r.bottom + 4, left: Math.max(8, left), width: w });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const handler = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (document.getElementById(popId)?.contains(target)) return;
      setOpen(false); setSearch('');
    };
    document.addEventListener('mousedown', handler);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, popId]);

  const displayValue = value ? (optionLabel?.[value] || value) : undefined;

  return (
    <div ref={ref} style={{ display: 'inline-block', ...style }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 9px',
          border: `1px solid ${value ? tokens.color.blue : tokens.color.line}`,
          borderRadius: tokens.radius.pill,
          background: value ? tokens.color.tint : '#fff',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '11px',
          fontFamily: tokens.font.family,
          color: value ? tokens.color.blueDark : tokens.color.text,
          fontWeight: value ? 700 : 400,
          whiteSpace: 'nowrap',
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {displayValue || placeholder}
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            style={{ marginLeft: 4, fontWeight: 700, color: tokens.color.text, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </span>
        )}
      </button>
      {open && coords && (
        <div
          id={popId}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            width: coords.width,
            maxHeight: 280,
            overflowY: 'auto',
            background: '#fff',
            border: `1px solid ${tokens.color.line}`,
            borderRadius: tokens.radius.card,
            boxShadow: tokens.shadow.lg
          }}
        >
          <div style={{ padding: '7px 8px', borderBottom: `1px solid ${tokens.color.line}`, position: 'sticky', top: 0, background: '#fff' }}>
            <input
              className="dams-in"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>
          {value && (
            <button type="button" className="dams-opt" onClick={() => { onChange(''); setOpen(false); setSearch(''); }}>
              <span style={{ fontSize: tokens.font.small, color: tokens.color.text, fontStyle: 'italic' }}>Clear</span>
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              className={`dams-opt${o === value ? ' dams-opt-sel' : ''}`}
              onClick={() => { onChange(o); setOpen(false); setSearch(''); }}
            >
              <div>
                <div style={{ fontSize: tokens.font.small, color: tokens.color.ink, fontWeight: o === value ? 700 : 400 }}>
                  {optionLabel?.[o] || o}
                </div>
                {optionMeta?.[o] && (
                  <div style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>{optionMeta[o]}</div>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.text }}>No results.</div>
          )}
        </div>
      )}
    </div>
  );
};

export const DosenCombo: React.FC<{
  value?: string;
  valueMeta?: string;
  onSearch: (q: string, signal: AbortSignal) => Promise<{ KodeDosen: string; Name: string; Email: string }[]>;
  onChange: (kode: string, meta: string) => void;
  onClear: () => void;
  placeholder?: string;
}> = ({ value, valueMeta, onSearch, onChange, onClear, placeholder = 'Kode Dosen' }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<{ KodeDosen: string; Name: string; Email: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const popId = React.useRef(`dams-dc-${Math.random().toString(36).slice(2)}`).current;
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchReqRef = React.useRef(0);
  const abortRef = React.useRef<AbortController | null>(null);
  const POP_W = 280;

  React.useEffect(() => {
    if (!open) { setCoords(null); return; }
    const update = (): void => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const w = Math.max(r.width, POP_W);
      const left = Math.min(r.left, window.innerWidth - w - 8);
      setCoords({ top: r.bottom + 4, left: Math.max(8, left), width: w });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const handler = (e: MouseEvent): void => {
      if (ref.current?.contains(e.target as Node)) return;
      if (document.getElementById(popId)?.contains(e.target as Node)) return;
      setOpen(false); setSearch(''); setResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, popId]);

  React.useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const reqId = ++searchReqRef.current;
      setLoading(true);
      onSearch(search, ctrl.signal).then((r) => {
        if (searchReqRef.current !== reqId) return;
        setResults(r || []);
        setLoading(false);
      }).catch(() => {
        if (searchReqRef.current !== reqId) return;
        setLoading(false);
      });
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, open]);

  return (
    <div ref={ref} style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 9px',
          border: `1px solid ${value ? tokens.color.blue : tokens.color.line}`,
          borderRadius: tokens.radius.pill,
          background: value ? tokens.color.tint : '#fff',
          cursor: 'pointer',
          fontSize: '11px',
          fontFamily: tokens.font.family,
          color: value ? tokens.color.blueDark : tokens.color.text,
          fontWeight: value ? 700 : 400,
          whiteSpace: 'nowrap',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {value || placeholder}
        {value && (
          <span onClick={(e) => { e.stopPropagation(); onClear(); }} style={{ marginLeft: 4, fontWeight: 700, color: tokens.color.text, lineHeight: 1, flexShrink: 0 }}>×</span>
        )}
      </button>
      {open && coords && (
        <div
          id={popId}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999, width: coords.width, maxHeight: 300, overflowY: 'auto', background: '#fff', border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.card, boxShadow: tokens.shadow.lg }}
        >
          <div style={{ padding: '7px 8px', borderBottom: `1px solid ${tokens.color.line}`, position: 'sticky', top: 0, background: '#fff' }}>
            <input
              className="dams-in"
              type="text"
              placeholder="Name, email, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>
          {value && (
            <button type="button" className="dams-opt" onClick={() => { onClear(); setOpen(false); setSearch(''); setResults([]); }}>
              <span style={{ fontSize: tokens.font.small, color: tokens.color.text, fontStyle: 'italic' }}>Clear</span>
            </button>
          )}
          {loading && <div style={{ padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.text }}>Searching...</div>}
          {!loading && results.map((d) => (
            <button
              key={d.KodeDosen + d.Email}
              type="button"
              className={`dams-opt${d.KodeDosen === value ? ' dams-opt-sel' : ''}`}
              onClick={() => { onChange(d.KodeDosen, `${d.Name} · ${d.Email}`); setOpen(false); setSearch(''); setResults([]); }}
            >
              <div>
                <div style={{ fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.ink }}>{d.KodeDosen}</div>
                <div style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>{d.Name} · {d.Email}</div>
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && search && (
            <div style={{ padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.text }}>No results.</div>
          )}
          {!loading && results.length === 0 && !search && (
            <div style={{ padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.text }}>Type to search...</div>
          )}
        </div>
      )}
    </div>
  );
};

export const StatusCombo: React.FC<{
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}> = ({ value, onChange, disabled, placeholder = 'Status...' }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null);

  const c = value ? (STATUS_PILL_COLORS[value as SubmissionStatus] || { bg: tokens.color.bgSoft, fg: tokens.color.text, border: '#aaa' }) : null;

  React.useEffect(() => {
    if (!open) { setCoords(null); return; }
    const update = (): void => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setCoords({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 160) });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const handler = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      const pop = document.getElementById('dams-sc-popover');
      if (pop && pop.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          border: `1.5px solid ${c ? c.border : tokens.color.line}`,
          borderRadius: tokens.radius.pill,
          background: c ? c.bg : '#fff',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '11px',
          fontFamily: tokens.font.family,
          fontWeight: 700,
          color: c ? c.fg : tokens.color.text,
          opacity: disabled ? 0.55 : 1,
          whiteSpace: 'nowrap'
        }}
      >
        {value ? (STATUS_LABELS[value] || value) : placeholder}
      </button>
      {open && coords && (
        <div
          id="dams-sc-popover"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            minWidth: coords.width,
            background: '#fff',
            border: `1px solid ${tokens.color.line}`,
            borderRadius: tokens.radius.card,
            boxShadow: tokens.shadow.lg,
            padding: '6px 0'
          }}
        >
          {STATUS_VALUES.map((s) => {
            const sc = STATUS_PILL_COLORS[s] || { bg: tokens.color.bgSoft, fg: tokens.color.text, border: '#aaa' };
            return (
              <button
                key={s}
                type="button"
                className={`dams-opt${s === value ? ' dams-opt-sel' : ''}`}
                onClick={() => { onChange(s); setOpen(false); }}
              >
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: tokens.radius.pill,
                  background: sc.bg,
                  color: sc.fg,
                  border: `1px solid ${sc.border}`,
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {STATUS_LABELS[s] || s}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const StarRating: React.FC<{
  value?: number;
  max?: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
}> = ({ value = 0, max = 5, onChange, disabled }) => (
  <div style={{ display: 'inline-flex', gap: 2 }}>
    {Array.from({ length: max }, (_, i) => (
      <button
        key={i}
        type="button"
        disabled={disabled || !onChange}
        onClick={() => onChange && onChange(i + 1 === value ? 0 : i + 1)}
        style={{
          width: 22,
          height: 22,
          fontSize: 17,
          lineHeight: 1,
          background: 'transparent',
          border: 'none',
          cursor: (disabled || !onChange) ? 'default' : 'pointer',
          color: i < value ? tokens.color.orange : tokens.color.line,
          padding: 0,
          transition: 'color .1s'
        }}
      >
        {'★'}
      </button>
    ))}
  </div>
);

export const ConfirmModal: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, onConfirm, onCancel }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(11,44,68,.35)' }} />
    <div
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: tokens.radius.card,
        boxShadow: tokens.shadow.lg,
        padding: '28px 32px',
        maxWidth: 400,
        width: '90%',
        borderTop: `4px solid ${tokens.color.orange}`
      }}
    >
      <p style={{ margin: `0 0 ${tokens.space.lg}`, fontSize: tokens.font.body, color: tokens.color.ink, lineHeight: 1.5 }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.space.sm }}>
        <GhostButton type="button" onClick={onCancel}>Cancel</GhostButton>
        <PrimaryButton type="button" onClick={onConfirm}>Confirm</PrimaryButton>
      </div>
    </div>
  </div>
);

export const MessageBar: React.FC<{ kind: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({ kind, children }) => {
  const map = {
    error: { bg: tokens.color.dangerBg, fg: tokens.color.danger, bar: tokens.color.danger },
    success: { bg: tokens.color.successBg, fg: tokens.color.success, bar: tokens.color.success },
    info: { bg: tokens.color.tint, fg: tokens.color.blueDark, bar: tokens.color.blue }
  };
  const c = map[kind];
  return (
    <div
      style={{
        padding: '11px 15px',
        fontSize: tokens.font.small,
        color: c.fg,
        background: c.bg,
        borderLeft: `3px solid ${c.bar}`,
        borderRadius: `0 ${tokens.radius.control} ${tokens.radius.control} 0`
      }}
    >
      {children}
    </div>
  );
};
