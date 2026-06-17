import * as React from 'react';
import { tokens } from './tokens';
import { BinusLogo } from './BinusLogo';
import { SubmissionStatus } from './damsTypes';

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
.dams-btn-ghost { color: ${tokens.color.blue}; background: #fff; border: 1px solid ${tokens.color.blue}; padding: 8px 16px; font-size: ${tokens.font.small}; }
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

const STATUS_COLORS: Record<SubmissionStatus, { bg: string; fg: string }> = {
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
      {status || 'Pending'}
    </span>
  );
};

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
