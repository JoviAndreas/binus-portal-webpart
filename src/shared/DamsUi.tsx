import * as React from 'react';
import { tokens } from './tokens';
import { SubmissionStatus } from './damsTypes';

// Reusable token-styled primitives shared by the DAMS VBL webparts.

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: tokens.color.bg,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: tokens.radius.lg,
      boxShadow: tokens.shadow.sm,
      padding: tokens.space.lg,
      ...style
    }}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div style={{ marginBottom: tokens.space.md }}>
    <h3 style={{ fontSize: tokens.font.h3, color: tokens.color.textDark, margin: 0, fontWeight: 700 }}>{children}</h3>
    {sub && <p style={{ fontSize: tokens.font.small, color: tokens.color.text, margin: '4px 0 0' }}>{sub}</p>}
  </div>
);

export const Field: React.FC<{
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ label, hint, error, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    <label style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.textDark }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: '12px', lineHeight: 1.4, color: tokens.color.text }}>{hint}</span>}
    {error && <span style={{ fontSize: '12px', fontWeight: 600, color: '#C2362B' }}>{error}</span>}
  </div>
);

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontFamily: tokens.font.family,
  fontSize: tokens.font.body,
  color: tokens.color.textDark,
  background: tokens.color.bg,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.sm,
  outline: 'none',
  boxSizing: 'border-box'
};

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{ ...inputBase, ...(props.style || {}) }} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} style={{ ...inputBase, resize: 'vertical', ...(props.style || {}) }} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; allowEmpty?: boolean }> = ({
  options,
  allowEmpty,
  ...props
}) => (
  <select {...props} style={{ ...inputBase, ...(props.style || {}) }}>
    {allowEmpty && <option value="">-</option>}
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    style={{
      padding: '10px 20px',
      fontFamily: tokens.font.family,
      fontSize: tokens.font.body,
      fontWeight: 600,
      color: '#fff',
      background: props.disabled ? '#9DBFD3' : tokens.color.blue,
      border: 'none',
      borderRadius: tokens.radius.sm,
      cursor: props.disabled ? 'default' : 'pointer',
      ...(props.style || {})
    }}
  />
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    style={{
      padding: '9px 16px',
      fontFamily: tokens.font.family,
      fontSize: tokens.font.body,
      fontWeight: 600,
      color: tokens.color.blueDark,
      background: tokens.color.bg,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: tokens.radius.sm,
      cursor: props.disabled ? 'default' : 'pointer',
      ...(props.style || {})
    }}
  />
);

const STATUS_COLORS: Record<SubmissionStatus, { bg: string; fg: string }> = {
  Pending: { bg: '#FDF1E0', fg: '#9A5B0E' },
  InReview: { bg: '#E7F3FB', fg: '#024A7A' },
  NeedsEdit: { bg: '#FBECEC', fg: '#C2362B' },
  Approved: { bg: '#E8F6EE', fg: '#1E7B43' },
  Rejected: { bg: '#F1F1F1', fg: '#5E5E5E' },
  Published: { bg: '#E8F6EE', fg: '#11663A' }
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const c = STATUS_COLORS[(status as SubmissionStatus)] || { bg: tokens.color.bgSoft, fg: tokens.color.text };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        fontSize: '12px',
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        borderRadius: tokens.radius.pill
      }}
    >
      {status || 'Pending'}
    </span>
  );
};

export const MessageBar: React.FC<{ kind: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({ kind, children }) => {
  const map = {
    error: { bg: '#FBECEC', fg: '#C2362B' },
    success: { bg: '#E8F6EE', fg: '#1E7B43' },
    info: { bg: '#E7F3FB', fg: '#024A7A' }
  };
  const c = map[kind];
  return (
    <div
      style={{
        padding: '10px 14px',
        fontSize: tokens.font.small,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.fg}22`,
        borderRadius: tokens.radius.sm
      }}
    >
      {children}
    </div>
  );
};
