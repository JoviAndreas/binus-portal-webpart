import * as React from 'react';
import { tokens } from './tokens';
import { Icon } from './Icon';

export interface IComboboxProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowFree?: boolean;
  emptyText?: string;
}

// Token-styled combobox with type-ahead filter and optional free input.
export const Combobox: React.FC<IComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  allowFree,
  emptyText = 'Nothing found.'
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
          color: value ? tokens.color.textDark : tokens.color.text,
          background: tokens.color.bg,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.sm,
          cursor: 'pointer'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <Icon name="arrowRight" size={14} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
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
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            boxShadow: tokens.shadow.md,
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
              borderBottom: `1px solid ${tokens.color.borderSoft}`,
              padding: '10px 12px',
              fontFamily: tokens.font.family,
              fontSize: tokens.font.body,
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
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.space.sm,
                  padding: '8px 12px',
                  border: 'none',
                  background: o.toLowerCase() === value.toLowerCase() ? tokens.color.bgSoft : 'transparent',
                  fontFamily: tokens.font.family,
                  fontSize: tokens.font.body,
                  color: tokens.color.textDark,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                {o}
              </button>
            ))}
            {customVisible && (
              <button
                type="button"
                onClick={() => pick(search)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  fontFamily: tokens.font.family,
                  fontSize: tokens.font.body,
                  color: tokens.color.blueDark,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
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
