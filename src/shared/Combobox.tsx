import * as React from 'react';
import { tokens } from './tokens';

export interface IComboboxProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowFree?: boolean;
  emptyText?: string;
  hasError?: boolean;
}

// Token-styled combobox with type-ahead filter and optional free input.
export const Combobox: React.FC<IComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  allowFree,
  emptyText = 'Nothing found.',
  hasError
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().indexOf(search.toLowerCase()) >= 0);
  const customVisible = allowFree && search && !filtered.some((o) => o.toLowerCase() === search.toLowerCase());

  const pick = (v: string): void => {
    onChange(v);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.space.sm,
          padding: '9px 12px',
          fontFamily: tokens.font.family,
          fontSize: tokens.font.body,
          textAlign: 'left',
          color: value ? tokens.color.ink : '#9AA6B0',
          background: hasError ? '#FFF5F5' : tokens.color.bg,
          border: `1px solid ${hasError ? tokens.color.danger : tokens.color.inputBorder}`,
          borderRadius: tokens.radius.sm,
          cursor: 'pointer'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ flexShrink: 0, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke={tokens.color.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 30,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: tokens.color.bg,
            border: `1px solid ${tokens.color.line}`,
            borderRadius: tokens.radius.card,
            boxShadow: tokens.shadow.lg,
            overflow: 'hidden'
          }}
        >
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              border: 'none',
              borderBottom: `1px solid ${tokens.color.line}`,
              padding: '10px 12px',
              fontFamily: tokens.font.family,
              fontSize: tokens.font.body,
              color: tokens.color.ink,
              outline: 'none'
            }}
          />
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 && !customVisible && (
              <div style={{ padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.text }}>
                {emptyText}
              </div>
            )}
            {filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                className={`dams-opt${o.toLowerCase() === value.toLowerCase() ? ' dams-opt-sel' : ''}`}
              >
                {o}
              </button>
            ))}
            {customVisible && (
              <button
                type="button"
                onClick={() => pick(search)}
                className="dams-opt"
                style={{ color: tokens.color.blue, fontWeight: 700 }}
              >
                Use &quot;{search}&quot; (custom)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
