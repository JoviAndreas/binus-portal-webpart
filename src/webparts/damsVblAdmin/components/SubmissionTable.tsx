import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ISubmission, IEditorInfo, IMeInfo, ISubmissionPatch } from '../../../shared/damsTypes';
import {
  StatusPills,
  PicCombo,
  GhostButton,
  PrimaryButton,
  MessageBar,
  TextInput,
  Field
} from '../../../shared/DamsUi';

type FilterChip = 'myqueue' | 'unassigned' | 'allactive' | 'published';

const CHIP_LABELS: Record<FilterChip, string> = {
  myqueue:    'My queue',
  unassigned: 'Unassigned',
  allactive:  'All active',
  published:  'Published'
};

export interface ISubmissionTableProps {
  api: DamsApi;
  reloadToken: number;
  onOpenDrawer: (id: string) => void;
  me: IMeInfo;
  editors: IEditorInfo[];
}

const PAGE_SIZE = 30;

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 10px',
  fontSize: tokens.font.label,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: tokens.color.text,
  background: tokens.color.surfaceAlt,
  borderBottom: `1px solid ${tokens.color.line}`,
  whiteSpace: 'nowrap'
};

const td: React.CSSProperties = {
  padding: '9px 10px',
  fontSize: tokens.font.small,
  color: tokens.color.ink,
  borderBottom: `1px solid ${tokens.color.line}`,
  verticalAlign: 'middle'
};

// Bulk action popover wrapper
const BulkPopover: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({ open, onClose, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 400,
        background: '#fff',
        border: `1px solid ${tokens.color.line}`,
        borderRadius: tokens.radius.card,
        boxShadow: tokens.shadow.lg,
        padding: tokens.space.md,
        marginTop: 6,
        minWidth: 240
      }}
    >
      {children}
    </div>
  );
};

// Confirm modal overlay
const ConfirmModal: React.FC<{
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

export const SubmissionTable: React.FC<ISubmissionTableProps> = ({ api, reloadToken, onOpenDrawer, me, editors }) => {
  const isSupervisor = me.IsSupervisor;
  const canEdit = me.IsAdmin || me.IsEditor;
  const defaultChip: FilterChip = (me.IsEditor && !isSupervisor) ? 'myqueue' : 'allactive';

  const [chip, setChip] = React.useState<FilterChip>(defaultChip);
  const [dosen, setDosen] = React.useState('');
  const [kodeMK, setKodeMK] = React.useState('');
  const [fakultas, setFakultas] = React.useState('');
  const [jurusan, setJurusan] = React.useState('');
  const [q, setQ] = React.useState('');
  const [appliedExtra, setAppliedExtra] = React.useState({ dosen: '', kodeMK: '', fakultas: '', jurusan: '', q: '' });
  const [page, setPage] = React.useState(1);

  const [items, setItems] = React.useState<ISubmission[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Optimistic local overrides per row
  const [localOverrides, setLocalOverrides] = React.useState<Record<string, Partial<ISubmission>>>({});
  // Per-row inline error flash
  const [rowErrors, setRowErrors] = React.useState<Record<string, string>>({});
  // Pending Rejected: rowId -> rejection reason being typed
  const [pendingRejected, setPendingRejected] = React.useState<Record<string, string>>({});
  // Intercept: open drawer while rows selected
  const [openIntercept, setOpenIntercept] = React.useState<string | null>(null);

  // Bulk selection (supervisor only)
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkPop, setBulkPop] = React.useState<null | 'pic' | 'status' | 'kv' | 'ka' | 'kk'>(null);
  const [bulkPicVal, setBulkPicVal] = React.useState('');
  const [bulkStatusVal, setBulkStatusVal] = React.useState('');
  const [bulkRejectNote, setBulkRejectNote] = React.useState('');
  const [bulkKVal, setBulkKVal] = React.useState('');
  const [confirmModal, setConfirmModal] = React.useState<{ message: string; onConfirm: () => void } | null>(null);
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const buildFilter = React.useCallback((): Record<string, unknown> => {
    const extra = {
      dosen: appliedExtra.dosen || undefined,
      kodeMK: appliedExtra.kodeMK || undefined,
      fakultas: appliedExtra.fakultas || undefined,
      jurusan: appliedExtra.jurusan || undefined,
      q: appliedExtra.q || undefined
    };
    switch (chip) {
      case 'myqueue':    return { ...extra, assignedTo: me.Email || undefined, excludeStatus: true, page, pageSize: PAGE_SIZE };
      case 'unassigned': return { ...extra, unassigned: true, excludeStatus: true, page, pageSize: PAGE_SIZE };
      case 'allactive':  return { ...extra, excludeStatus: true, page, pageSize: PAGE_SIZE };
      case 'published':  return { ...extra, status: 'Published', page, pageSize: PAGE_SIZE };
    }
  }, [chip, appliedExtra, me.Email, page]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setLocalOverrides({});
    setRowErrors({});
    setPendingRejected({});
    setSelected(new Set());
    api.listSubmissions(buildFilter() as Parameters<typeof api.listSubmissions>[0]).then((res) => {
      if (!active) return;
      if (!res) {
        setError('Failed to load submissions.');
        setItems([]);
        setTotal(0);
      } else {
        setItems(res.items || []);
        setTotal(res.total || 0);
      }
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError('Failed to load submissions.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [api, buildFilter, reloadToken]);

  const applyExtra = (): void => {
    setPage(1);
    setAppliedExtra({ dosen, kodeMK, fakultas, jurusan, q });
  };

  const switchChip = (c: FilterChip): void => {
    setChip(c);
    setPage(1);
  };

  // Optimistic patch helper
  const optimisticPatch = (id: string, patch: ISubmissionPatch): void => {
    // Apply locally
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...(patch as Partial<ISubmission>) } }));
    setRowErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });

    api.patchSubmission(id, patch).then((res) => {
      if (!res.ok) {
        setLocalOverrides((prev) => { const n = { ...prev }; delete n[id]; return n; });
        setRowErrors((prev) => ({ ...prev, [id]: res.message }));
        // Auto-clear error after 6s
        window.setTimeout(() => {
          setRowErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
        }, 6000);
        return;
      }
      setItems((prev) => prev.map((s) => (s.Id === id ? res.data : s)));
      setLocalOverrides((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }).catch((e) => {
      setLocalOverrides((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setRowErrors((prev) => ({ ...prev, [id]: 'Network error.' }));
      window.setTimeout(() => {
        setRowErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
      }, 6000);
      console.error('[dams] patchSubmission failed', e);
    });
  };

  const handleStatusChange = (id: string, newStatus: string): void => {
    if (newStatus === 'Rejected') {
      setPendingRejected((prev) => ({ ...prev, [id]: prev[id] ?? '' }));
      return;
    }
    setPendingRejected((prev) => { const n = { ...prev }; delete n[id]; return n; });
    const sub = items.find((s) => s.Id === id);
    const fromLabel = (localOverrides[id]?.Status ?? sub?.Status) || 'Pending';
    setConfirmModal({
      message: `Change status from ${fromLabel} to ${newStatus}?`,
      onConfirm: () => {
        setConfirmModal(null);
        optimisticPatch(id, { Status: newStatus });
      }
    });
  };

  const confirmRejected = (id: string): void => {
    const note = pendingRejected[id];
    if (!note || !note.trim()) return;
    setPendingRejected((prev) => { const n = { ...prev }; delete n[id]; return n; });
    optimisticPatch(id, { Status: 'Rejected', ReviewNote: note });
  };

  const cancelRejected = (id: string): void => {
    setPendingRejected((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  // Selection helpers (supervisor only)
  const lastClickedRef = React.useRef<string | null>(null);
  const toggleSelect = (id: string): void => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    lastClickedRef.current = id;
  };
  const rangeSelect = (id: string): void => {
    const last = lastClickedRef.current;
    if (!last || last === id) {
      toggleSelect(id);
      return;
    }
    const ids = items.map((s) => s.Id);
    const a = ids.indexOf(last);
    const b = ids.indexOf(id);
    if (a < 0 || b < 0) { toggleSelect(id); return; }
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const range = ids.slice(lo, hi + 1);
    setSelected((prev) => {
      const n = new Set(prev);
      range.forEach((x) => n.add(x));
      return n;
    });
    lastClickedRef.current = id;
  };
  const isInlineControl = (target: EventTarget | null): boolean => {
    let el = target as HTMLElement | null;
    while (el && el.nodeType === 1) {
      const tag = el.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'A' || tag === 'LABEL') return true;
      const role = el.getAttribute && el.getAttribute('role');
      if (role === 'switch' || role === 'radiogroup' || role === 'radio' || role === 'combobox' || role === 'menu') return true;
      if (el.getAttribute && el.getAttribute('data-inline') === 'true') return true;
      el = el.parentElement;
    }
    return false;
  };
  const onRowClick = (e: React.MouseEvent, id: string): void => {
    if (!isSupervisor) return;
    if (isInlineControl(e.target)) return;
    e.preventDefault();
    if (e.shiftKey) rangeSelect(id); else toggleSelect(id);
  };
  const toggleSelectAll = (): void => {
    setSelected((prev) => prev.size === items.length ? new Set() : new Set(items.map((s) => s.Id)));
  };

  // Bulk apply
  const doBulkApply = (patch: ISubmissionPatch, label: string): void => {
    const ids = Array.from(selected);
    setConfirmModal({
      message: `Apply ${label} to ${ids.length} submission(s)?`,
      onConfirm: () => {
        setConfirmModal(null);
        setBulkPop(null);
        setBulkLoading(true);
        api.bulkPatch({ ids, patch }).then((result) => {
          setBulkLoading(false);
          if (!result) { setError('Bulk update failed.'); return; }
          if (result.failed.length > 0) setError(`${result.failed.length} row(s) failed.`);
          // Reload
          setPage(1);
          setLocalOverrides({});
          setSelected(new Set());
          // Trigger re-fetch via counter trick: toggle a local reload
          api.listSubmissions(buildFilter() as Parameters<typeof api.listSubmissions>[0]).then((res) => {
            if (res) { setItems(res.items || []); setTotal(res.total || 0); }
          }).catch(() => undefined);
        }).catch(() => {
          setBulkLoading(false);
          setError('Bulk update failed.');
        });
      }
    });
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const colCount = isSupervisor ? 10 : 9;

  const kLabel = (v: string | undefined): string => {
    const n = parseInt(v || '0', 10);
    if (n <= 1) return 'W';
    if (n <= 3) return 'M';
    return 'E';
  };
  const kColor = (v: string | undefined): string => {
    const n = parseInt(v || '0', 10);
    if (n <= 1) return tokens.color.danger;
    if (n <= 3) return tokens.color.orange;
    return '#16a34a';
  };
  const kCycle = (v: string | undefined): string => {
    const n = parseInt(v || '0', 10);
    if (n === 0) return '1';   // unset → W
    if (n <= 1) return '3';    // W → M
    if (n <= 3) return '5';    // M → E
    return '0';                // E → unset
  };
  const K_FIELDS: (keyof ISubmission)[] = ['KualitasVideo', 'KualitasAudio', 'KualitasKonten'];

  // Display value helpers (merge server state with local override)
  const val = <K extends keyof ISubmission>(s: ISubmission, k: K): ISubmission[K] =>
    (localOverrides[s.Id]?.[k] !== undefined ? localOverrides[s.Id]![k] : s[k]) as ISubmission[K];

  const displayStatus = (s: ISubmission): string =>
    pendingRejected[s.Id] !== undefined ? 'Rejected' : (val(s, 'Status') as string) || 'Pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: tokens.space.sm, flexWrap: 'wrap', alignItems: 'center' }}>
        {(Object.keys(CHIP_LABELS) as FilterChip[])
          .filter((c) => canEdit || (c !== 'myqueue' && c !== 'unassigned'))
          .map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => switchChip(c)}
            style={{
              padding: '6px 16px',
              fontSize: tokens.font.small,
              fontFamily: tokens.font.family,
              fontWeight: 700,
              border: `1.5px solid ${chip === c ? tokens.color.blue : tokens.color.line}`,
              borderRadius: tokens.radius.pill,
              cursor: 'pointer',
              background: chip === c ? tokens.color.blue : '#fff',
              color: chip === c ? '#fff' : tokens.color.text,
              transition: 'all .15s'
            }}
          >
            {CHIP_LABELS[c]}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: tokens.space.sm, alignItems: 'flex-end' }}>
          <Field label="Kode Dosen" style={{ flexShrink: 0 }}>
            <TextInput
              value={dosen}
              onChange={(e) => setDosen(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyExtra(); }}
              placeholder="D1234"
              style={{ width: 90 }}
            />
          </Field>
          <Field label="Kode MK" style={{ flexShrink: 0 }}>
            <TextInput
              value={kodeMK}
              onChange={(e) => setKodeMK(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyExtra(); }}
              placeholder="COMP6047"
              style={{ width: 100 }}
            />
          </Field>
          <Field label="Fakultas" style={{ flexShrink: 0 }}>
            <TextInput
              value={fakultas}
              onChange={(e) => setFakultas(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyExtra(); }}
              placeholder="FDCHT, SOCS..."
              style={{ width: 140 }}
            />
          </Field>
          <Field label="Jurusan" style={{ flexShrink: 0 }}>
            <TextInput
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyExtra(); }}
              placeholder="Hotel Management..."
              style={{ width: 160 }}
            />
          </Field>
          <Field label="Search" style={{ flexShrink: 0 }}>
            <TextInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyExtra(); }}
              placeholder="Name, topik, code..."
              style={{ width: 160 }}
            />
          </Field>
          <GhostButton type="button" onClick={applyExtra} style={{ flexShrink: 0 }}>Search</GhostButton>
        </div>
      </div>

      {error && <MessageBar kind="error">{error}</MessageBar>}

      {/* Bulk bar (supervisor only, always visible; actions disabled when no selection) */}
      {isSupervisor && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: tokens.color.ink,
            borderRadius: tokens.radius.card,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: tokens.space.sm,
            flexWrap: 'wrap',
            boxShadow: tokens.shadow.lg
          }}
        >
          <span style={{ fontSize: tokens.font.small, color: '#fff', fontWeight: 700, marginRight: 4 }}>
            {selected.size > 0 ? `${selected.size} selected` : 'Select rows to bulk edit'}
          </span>
          {/* Assign PIC */}
          <div style={{ position: 'relative' }}>
            <GhostButton
              type="button"
              disabled={bulkLoading || selected.size === 0}
              onClick={() => setBulkPop(bulkPop === 'pic' ? null : 'pic')}
              style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.4)', fontSize: tokens.font.micro, opacity: selected.size === 0 ? 0.4 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}
            >
              Assign PIC
            </GhostButton>
            <BulkPopover open={bulkPop === 'pic'} onClose={() => setBulkPop(null)}>
              <div style={{ marginBottom: tokens.space.sm, fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.ink }}>
                Assign PIC Editing
              </div>
              <PicCombo value={bulkPicVal} editors={editors} onChange={(email) => setBulkPicVal(email)} />
              <div style={{ marginTop: tokens.space.sm }}>
                <PrimaryButton
                  type="button"
                  disabled={!bulkPicVal}
                  onClick={() => doBulkApply({ PicEditing: bulkPicVal }, `PIC = ${bulkPicVal.split('@')[0]}`)}
                >
                  Apply
                </PrimaryButton>
              </div>
            </BulkPopover>
          </div>
          {/* Set Status */}
          <div style={{ position: 'relative' }}>
            <GhostButton
              type="button"
              disabled={bulkLoading || selected.size === 0}
              onClick={() => setBulkPop(bulkPop === 'status' ? null : 'status')}
              style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.4)', fontSize: tokens.font.micro, opacity: selected.size === 0 ? 0.4 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}
            >
              Set Status
            </GhostButton>
            <BulkPopover open={bulkPop === 'status'} onClose={() => setBulkPop(null)}>
              <div style={{ marginBottom: tokens.space.sm, fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.ink }}>
                Set Status
              </div>
              <StatusPills value={bulkStatusVal} onChange={(v) => { setBulkStatusVal(v); setBulkRejectNote(''); }} />
              {bulkStatusVal === 'Rejected' && (
                <div style={{ marginTop: tokens.space.sm }}>
                  <input
                    className="dams-in"
                    type="text"
                    placeholder="Rejection reason (required)..."
                    value={bulkRejectNote}
                    onChange={(e) => setBulkRejectNote(e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', fontSize: tokens.font.small, boxSizing: 'border-box' }}
                    autoFocus
                  />
                </div>
              )}
              <div style={{ marginTop: tokens.space.sm }}>
                <PrimaryButton
                  type="button"
                  disabled={!bulkStatusVal || (bulkStatusVal === 'Rejected' && !bulkRejectNote.trim())}
                  onClick={() => doBulkApply(
                    bulkStatusVal === 'Rejected'
                      ? { Status: bulkStatusVal, ReviewNote: bulkRejectNote }
                      : { Status: bulkStatusVal },
                    `Status = ${bulkStatusVal}`
                  )}
                >
                  Apply
                </PrimaryButton>
              </div>
            </BulkPopover>
          </div>
          {/* Bulk KV/KA/KK */}
          {(['kv', 'ka', 'kk'] as const).map((key, i) => {
            const field = (['KualitasVideo', 'KualitasAudio', 'KualitasKonten'] as const)[i];
            const label = key.toUpperCase();
            return (
              <div key={key} style={{ position: 'relative' }}>
                <GhostButton
                  type="button"
                  disabled={bulkLoading || selected.size === 0}
                  onClick={() => { setBulkPop(bulkPop === key ? null : key); setBulkKVal(''); }}
                  style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.4)', fontSize: tokens.font.micro, opacity: selected.size === 0 ? 0.4 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}
                >
                  {label}
                </GhostButton>
                <BulkPopover open={bulkPop === key} onClose={() => setBulkPop(null)}>
                  <div style={{ marginBottom: tokens.space.sm, fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.ink }}>
                    Set {label}
                  </div>
                  <div style={{ display: 'flex', gap: tokens.space.sm }}>
                    {[['1', 'W'], ['3', 'M'], ['5', 'E']].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBulkKVal(bulkKVal === val ? '' : val)}
                        style={{
                          padding: '5px 14px',
                          fontWeight: 700,
                          fontSize: tokens.font.small,
                          border: `2px solid ${bulkKVal === val ? kColor(val) : tokens.color.line}`,
                          borderRadius: tokens.radius.pill,
                          background: bulkKVal === val ? kColor(val) : '#fff',
                          color: bulkKVal === val ? '#fff' : kColor(val),
                          cursor: 'pointer'
                        }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: tokens.space.sm }}>
                    <PrimaryButton
                      type="button"
                      disabled={!bulkKVal}
                      onClick={() => doBulkApply({ [field]: bulkKVal } as ISubmissionPatch, `${label} = ${kLabel(bulkKVal)}`)}
                    >
                      Apply
                    </PrimaryButton>
                  </div>
                </BulkPopover>
              </div>
            );
          })}
          {bulkLoading && <span style={{ color: '#fff', fontSize: tokens.font.micro }}>Applying...</span>}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: tokens.font.small }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.card, boxShadow: tokens.shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isSupervisor ? 1300 : 1260 }}>
          <thead>
            <tr>
              {isSupervisor && (
                <th style={{ ...th, width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === items.length && items.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th style={{ ...th, width: 110 }}>Code</th>
              <th style={{ ...th, minWidth: 150 }}>Submitter</th>
              <th style={{ ...th, minWidth: 200 }}>MK / Topik</th>
              <th style={{ ...th, minWidth: 220 }}>Status</th>
              <th style={{ ...th, minWidth: 130 }}>PIC</th>
              <th style={{ ...th, width: 38, textAlign: 'center' }}>KV</th>
              <th style={{ ...th, width: 38, textAlign: 'center' }}>KA</th>
              <th style={{ ...th, width: 38, textAlign: 'center' }}>KK</th>
              <th style={{ ...th, width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td style={td} colSpan={colCount}>Loading...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td style={{ ...td, color: tokens.color.text, fontStyle: 'italic' }} colSpan={colCount}>
                  No submissions in this view. Try another filter.
                </td>
              </tr>
            )}
            {!loading && items.map((s) => {
              const rowErr = rowErrors[s.Id];
              const isPendingRejected = pendingRejected[s.Id] !== undefined;
              return (
                <React.Fragment key={s.Id}>
                  <tr
                    style={{
                      background: rowErr ? tokens.color.dangerBg : (selected.has(s.Id) ? tokens.color.tint : undefined),
                      cursor: isSupervisor ? 'pointer' : 'default',
                      userSelect: isSupervisor ? 'none' : undefined
                    }}
                    onClick={(e) => onRowClick(e, s.Id)}
                  >
                    {isSupervisor && (
                      <td style={{ ...td, padding: '9px 10px' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(s.Id)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(s.Id); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td style={{ ...td, fontSize: tokens.font.micro, fontWeight: 700, color: tokens.color.blueDark }}>
                      {s.CodeNumber}
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.ink }}>{s.Name}</div>
                      <div style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>{s.KodeDosen}</div>
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.ink }}>{s.KodeMatakuliah}</div>
                      <div style={{ fontSize: tokens.font.micro, color: tokens.color.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.Topik}
                      </div>
                    </td>
                    <td style={td}>
                      <StatusPills
                        value={displayStatus(s)}
                        onChange={(newStatus) => handleStatusChange(s.Id, newStatus)}
                        disabled={!canEdit}
                      />
                      {rowErr && <div style={{ fontSize: tokens.font.micro, color: tokens.color.danger, marginTop: 3 }}>{rowErr}</div>}
                    </td>
                    <td style={td}>
                      <PicCombo
                        value={val(s, 'PicEditing') as string}
                        editors={editors}
                        onChange={(email) => optimisticPatch(s.Id, { PicEditing: email })}
                        disabled={!isSupervisor}
                      />
                    </td>
                    {K_FIELDS.map((k) => {
                      const raw = val(s, k) as string | undefined;
                      const hasVal = raw && parseInt(raw, 10) > 0;
                      return (
                        <td key={k} style={{ ...td, textAlign: 'center' }}>
                          {canEdit ? (
                            <button
                              type="button"
                              data-inline="true"
                              onClick={(e) => { e.stopPropagation(); optimisticPatch(s.Id, { [k]: kCycle(raw) } as ISubmissionPatch); }}
                              title="Click to cycle W→M→E→unset"
                              style={{
                                background: 'none',
                                border: hasVal ? `1.5px solid ${kColor(raw)}` : `1.5px dashed ${tokens.color.line}`,
                                borderRadius: tokens.radius.pill,
                                padding: '1px 7px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: tokens.font.micro,
                                color: hasVal ? kColor(raw) : tokens.color.line,
                                lineHeight: 1.6
                              }}
                            >
                              {hasVal ? kLabel(raw) : '-'}
                            </button>
                          ) : (
                            hasVal
                              ? <span style={{ fontWeight: 700, fontSize: tokens.font.micro, color: kColor(raw) }}>{kLabel(raw)}</span>
                              : <span style={{ color: tokens.color.line, fontSize: tokens.font.micro }}>-</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={td}>
                      <GhostButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selected.size > 0) { setOpenIntercept(s.Id); return; }
                          onOpenDrawer(s.Id);
                        }}
                        style={{ padding: '3px 10px', fontSize: tokens.font.micro }}
                      >
                        Open
                      </GhostButton>
                    </td>
                  </tr>
                  {isPendingRejected && (
                    <tr style={{ background: tokens.color.dangerBg }}>
                      <td style={{ ...td, padding: '8px 12px', borderTop: 'none' }} colSpan={colCount}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
                          <span style={{ fontSize: tokens.font.small, fontWeight: 700, color: tokens.color.danger, whiteSpace: 'nowrap' }}>
                            Rejection reason required:
                          </span>
                          <input
                            className="dams-in"
                            type="text"
                            placeholder="Describe why this is rejected..."
                            value={pendingRejected[s.Id]}
                            onChange={(e) => setPendingRejected((prev) => ({ ...prev, [s.Id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') confirmRejected(s.Id); if (e.key === 'Escape') cancelRejected(s.Id); }}
                            style={{ flex: 1, padding: '5px 8px', fontSize: tokens.font.small }}
                            autoFocus
                          />
                          <GhostButton
                            type="button"
                            onClick={() => confirmRejected(s.Id)}
                            disabled={!(pendingRejected[s.Id] || '').trim()}
                            style={{ whiteSpace: 'nowrap', fontSize: tokens.font.micro }}
                          >
                            Confirm
                          </GhostButton>
                          <button
                            type="button"
                            onClick={() => cancelRejected(s.Id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: tokens.color.text,
                              fontSize: 16,
                              padding: '0 4px',
                              lineHeight: 1
                            }}
                          >
                            x
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: tokens.font.small, color: tokens.color.text }}>
          {total} result(s) - page {page} of {pageCount}
        </span>
        <div style={{ display: 'flex', gap: tokens.space.sm }}>
          <GhostButton type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</GhostButton>
          <GhostButton type="button" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</GhostButton>
        </div>
      </div>

      {/* Intercept modal: user clicked Open with rows selected */}
      {openIntercept && (
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
          <div onClick={() => setOpenIntercept(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(11,44,68,.35)' }} />
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
            <p style={{ margin: `0 0 ${tokens.space.sm}`, fontSize: tokens.font.body, fontWeight: 700, color: tokens.color.ink }}>
              {selected.size} row(s) selected
            </p>
            <p style={{ margin: `0 0 ${tokens.space.lg}`, fontSize: tokens.font.small, color: tokens.color.text, lineHeight: 1.5 }}>
              Opening a single record will not apply changes to your selection. Use the bulk bar above to update all selected rows. Or open this record anyway?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.space.sm }}>
              <GhostButton type="button" onClick={() => setOpenIntercept(null)}>Go back</GhostButton>
              <PrimaryButton
                type="button"
                onClick={() => {
                  const id = openIntercept;
                  setOpenIntercept(null);
                  onOpenDrawer(id);
                }}
              >
                Open anyway
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};
