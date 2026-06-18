import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ISubmission, IEditorInfo, IMeInfo, ISubmissionPatch, STATUS_VALUES } from '../../../shared/damsTypes';
import {
  StatusCombo,
  SearchableSelect,
  DosenCombo,
  PicCombo,
  GhostButton,
  PrimaryButton,
  MessageBar,
  PillTabs,
  ConfirmModal
} from '../../../shared/DamsUi';

type FilterChip = 'myqueue' | 'unassigned' | 'allactive';

const CHIP_LABELS: Record<FilterChip, string> = {
  myqueue:    'My queue',
  unassigned: 'Unassigned',
  allactive:  'All active',
};

export interface ISubmissionTableProps {
  api: DamsApi;
  reloadToken: number;
  onOpenDrawer: (id: string) => void;
  me: IMeInfo;
  editors: IEditorInfo[];
  onTotalChange?: (n: number) => void;
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


export const SubmissionTable: React.FC<ISubmissionTableProps> = ({ api, reloadToken, onOpenDrawer, me, editors, onTotalChange }) => {
  const isSupervisor = me.IsSupervisor;
  const canEdit = me.IsAdmin || me.IsEditor;
  const defaultChip: FilterChip = (me.IsEditor || isSupervisor) ? 'myqueue' : 'allactive';
  const isLecturer = !!me.Email?.toLowerCase().endsWith('@binus.ac.id');

  const [chip, setChip] = React.useState<FilterChip>(defaultChip);
  const [dosenFilter, setDosenFilter] = React.useState('');
  const [dosenFilterMeta, setDosenFilterMeta] = React.useState('');

  // Auto-filter by own KodeDosen for @binus.ac.id users on mount
  React.useEffect(() => {
    if (!isLecturer || !me.Email) return;
    api.lookupBinusian(me.Email).then((info) => {
      if (info?.KodeDosen) {
        setDosenFilter(info.KodeDosen);
        setDosenFilterMeta(`${info.Name || ''} · ${me.Email}`);
      }
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [picFilter, setPicFilter] = React.useState('');
  const [jurusanFilter, setJurusanFilter] = React.useState('');
  const [kodeMKFilter, setKodeMKFilter] = React.useState('');
  const jurusanSeenRef = React.useRef(new Set<string>());
  const kodeMKSeenRef = React.useRef(new Set<string>());
  const [jurusanOptions, setJurusanOptions] = React.useState<string[]>([]);
  const [kodeMKOptions, setKodeMKOptions] = React.useState<string[]>([]);
  const [yearFilter, setYearFilter] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const [items, setItems] = React.useState<ISubmission[]>([]);
  const [total, setTotal] = React.useState(0);
  React.useEffect(() => { onTotalChange?.(total); }, [total, onTotalChange]);
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
  const [bulkPicVal, setBulkPicVal] = React.useState('');
  const [bulkStatusVal, setBulkStatusVal] = React.useState('');
  const [bulkRejectNote, setBulkRejectNote] = React.useState('');
  const [bulkKV, setBulkKV] = React.useState('');
  const [bulkKA, setBulkKA] = React.useState('');
  const [bulkKK, setBulkKK] = React.useState('');
  const [confirmModal, setConfirmModal] = React.useState<{ message: string; onConfirm: () => void } | null>(null);
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const buildFilter = React.useCallback((): Record<string, unknown> => {
    const extra = {
      dosen: dosenFilter || undefined,
      kodeMK: kodeMKFilter || undefined,
      jurusan: jurusanFilter || undefined,
      year: yearFilter ? parseInt(yearFilter, 10) : undefined,
      pic: picFilter || undefined,
      status: statusFilter || undefined,
    };
    const excludeStatus = !statusFilter;
    switch (chip) {
      case 'myqueue':    return { ...extra, assignedTo: me.Email || undefined, excludeStatus, page, pageSize: PAGE_SIZE };
      case 'unassigned': return { ...extra, unassigned: true, excludeStatus, page, pageSize: PAGE_SIZE };
      case 'allactive':  return { ...extra, excludeStatus, page, pageSize: PAGE_SIZE };
    }
  }, [chip, dosenFilter, kodeMKFilter, jurusanFilter, yearFilter, picFilter, statusFilter, me.Email, page]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setItems([]);
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
        const loaded = res.items || [];
        loaded.forEach((s) => {
          if (s.Jurusan) jurusanSeenRef.current.add(s.Jurusan);
          if (s.KodeMatakuliah) kodeMKSeenRef.current.add(s.KodeMatakuliah);
        });
        setJurusanOptions(Array.from(jurusanSeenRef.current).sort());
        setKodeMKOptions(Array.from(kodeMKSeenRef.current).sort());
        setItems(loaded);
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

  const switchChip = (c: FilterChip): void => {
    setChip(c);
    setPage(1);
    setPicFilter('');
    setStatusFilter('');
    jurusanSeenRef.current = new Set();
    kodeMKSeenRef.current = new Set();
    setJurusanOptions([]);
    setKodeMKOptions([]);
  };

  const quickFilter = (field: 'dosen' | 'jurusan' | 'kodeMK', value: string): void => {
    setPage(1);
    if (field === 'dosen') setDosenFilter(value);
    if (field === 'jurusan') setJurusanFilter(value);
    if (field === 'kodeMK') setKodeMKFilter(value);
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
        setBulkLoading(true);
        api.bulkPatch({ ids, patch }).then((result) => {
          setBulkLoading(false);
          if (!result) { setError('Bulk update failed.'); return; }
          if (result.failed.length > 0) setError(`${result.failed.length} row(s) failed.`);
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

  const PaginationBar: React.FC = () => {
    const pageBtn = (p: number, label?: string): React.ReactElement => {
      const active = p === page;
      return (
        <button
          key={label || p}
          type="button"
          onClick={() => setPage(p)}
          style={{
            minWidth: 32, height: 32, padding: '0 8px',
            border: active ? 'none' : `1px solid ${tokens.color.line}`,
            borderRadius: tokens.radius.sm,
            background: active ? tokens.color.blue : 'transparent',
            color: active ? '#fff' : tokens.color.ink,
            fontWeight: active ? 700 : 400,
            fontSize: tokens.font.small,
            cursor: active ? 'default' : 'pointer',
            fontFamily: tokens.font.family,
          }}
        >{label || p}</button>
      );
    };
    const pages: React.ReactElement[] = [];
    const WING = 2;
    const addEllipsis = (key: string): void => {
      pages.push(<span key={key} style={{ padding: '0 4px', color: tokens.color.text, fontSize: tokens.font.small }}>...</span>);
    };
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pages.push(pageBtn(i));
    } else {
      pages.push(pageBtn(1));
      if (page > WING + 2) addEllipsis('el');
      for (let i = Math.max(2, page - WING); i <= Math.min(pageCount - 1, page + WING); i++) pages.push(pageBtn(i));
      if (page < pageCount - WING - 1) addEllipsis('er');
      pages.push(pageBtn(pageCount));
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: tokens.space.sm }}>
        <span style={{ fontSize: tokens.font.small, color: tokens.color.text }}>
          {total} result(s) - page {page} of {pageCount}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <GhostButton type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</GhostButton>
          {pages}
          <GhostButton type="button" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</GhostButton>
        </div>
      </div>
    );
  };
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
const K_FIELDS: (keyof ISubmission)[] = ['KualitasVideo', 'KualitasAudio', 'KualitasKonten'];

  // Display value helpers (merge server state with local override)
  const val = <K extends keyof ISubmission>(s: ISubmission, k: K): ISubmission[K] =>
    (localOverrides[s.Id]?.[k] !== undefined ? localOverrides[s.Id]![k] : s[k]) as ISubmission[K];

  const displayStatus = (s: ISubmission): string =>
    pendingRejected[s.Id] !== undefined ? 'Rejected' : (val(s, 'Status') as string) || 'Pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>

      {/* Filter bar: chips + dropdowns in one row */}
      <div style={{ display: 'flex', gap: tokens.space.sm, flexWrap: 'wrap', alignItems: 'center' }}>
        <PillTabs
          tabs={(Object.keys(CHIP_LABELS) as FilterChip[])
            .filter((c) => canEdit || (c !== 'myqueue' && c !== 'unassigned'))
            .map((c) => ({ value: c, label: CHIP_LABELS[c] }))}
          value={chip}
          onChange={switchChip}
        />
        <div style={{ display: 'flex', gap: tokens.space.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          <DosenCombo
            value={dosenFilter}
            valueMeta={dosenFilterMeta}
            onSearch={(q) => api.searchDosens(q).then((r) => r || [])}
            onChange={(kode, meta) => { setDosenFilter(kode); setDosenFilterMeta(meta); setPage(1); }}
            onClear={() => { setDosenFilter(''); setDosenFilterMeta(''); setPage(1); }}
          />
          <SearchableSelect
            value={picFilter}
            options={editors.map((e) => e.Email).filter(Boolean) as string[]}
            onChange={(v) => { setPicFilter(v); setPage(1); }}
            placeholder="PIC"
            style={{ maxWidth: 180 }}
          />
          <SearchableSelect
            value={jurusanFilter}
            options={jurusanOptions}
            onChange={(v) => { setJurusanFilter(v); setPage(1); }}
            placeholder="Jurusan"
            style={{ maxWidth: 200 }}
          />
          <SearchableSelect
            value={kodeMKFilter}
            options={kodeMKOptions}
            onChange={(v) => { setKodeMKFilter(v); setPage(1); }}
            placeholder="Kode MK"
          />
          <SearchableSelect
            value={yearFilter}
            options={Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i))}
            onChange={(v) => { setYearFilter(v); setPage(1); }}
            placeholder="Year"
            style={{ maxWidth: 100 }}
          />
          <SearchableSelect
            value={statusFilter}
            options={STATUS_VALUES as unknown as string[]}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            placeholder="Status"
            style={{ maxWidth: 130 }}
          />
          {(dosenFilter || picFilter || jurusanFilter || kodeMKFilter || yearFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setDosenFilter(''); setDosenFilterMeta('');
                setPicFilter(''); setJurusanFilter(''); setKodeMKFilter(''); setYearFilter(''); setStatusFilter('');
                setPage(1);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.color.text, fontSize: tokens.font.small, textDecoration: 'underline', whiteSpace: 'nowrap', padding: 0 }}
            >Clear filters</button>
          )}
          <GhostButton
            type="button"
            disabled={exporting}
            onClick={() => {
              setExporting(true);
              const f = buildFilter() as Parameters<typeof api.exportExcel>[0];
              api.exportExcel(f).catch(() => setError('Export failed.')).finally(() => setExporting(false));
            }}
            style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
              <path d="M6 13l2.5 4 2.5-4" />
              <path d="M15 13v4M17 13v4" />
            </svg>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </GhostButton>
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
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: tokens.space.sm,
            flexWrap: 'wrap',
            boxShadow: tokens.shadow.lg
          }}
        >
          <span style={{ fontSize: tokens.font.small, color: '#fff', fontWeight: 700, marginRight: 4, whiteSpace: 'nowrap' }}>
            {selected.size > 0 ? `${selected.size} selected` : 'Select rows to bulk edit'}
          </span>
          <PicCombo value={bulkPicVal} editors={editors} onChange={(v) => setBulkPicVal(v)} disabled={selected.size === 0} />
          <StatusCombo value={bulkStatusVal} onChange={(v) => { setBulkStatusVal(v); setBulkRejectNote(''); }} disabled={selected.size === 0} placeholder="Status..." />
          {bulkStatusVal === 'Rejected' && (
            <input
              className="dams-in"
              type="text"
              placeholder="Rejection reason..."
              value={bulkRejectNote}
              onChange={(e) => setBulkRejectNote(e.target.value)}
              style={{ padding: '4px 8px', fontSize: tokens.font.small, minWidth: 180 }}
            />
          )}
          {/* KV KA KK inline */}
          {(['KV', 'KA', 'KK'] as const).map((lbl, i) => {
            const setters = [setBulkKV, setBulkKA, setBulkKK];
            const vals = [bulkKV, bulkKA, bulkKK];
            const cur = vals[i];
            return (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: tokens.font.micro, color: 'rgba(255,255,255,.6)', marginRight: 2 }}>{lbl}</span>
                {([['1','W'],['3','M'],['5','E']] as const).map(([v, label]) => {
                  const active = cur === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={selected.size === 0}
                      onClick={() => setters[i](active ? '' : v)}
                      style={{
                        padding: '1px 6px',
                        fontWeight: 700,
                        fontSize: tokens.font.micro,
                        border: `1.5px solid ${active ? kColor(v) : 'rgba(255,255,255,.3)'}`,
                        borderRadius: tokens.radius.pill,
                        background: active ? kColor(v) : 'transparent',
                        color: active ? '#fff' : 'rgba(255,255,255,.7)',
                        cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                        opacity: selected.size === 0 ? 0.4 : 1
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <PrimaryButton
            type="button"
            disabled={bulkLoading || selected.size === 0 || (!bulkPicVal && !bulkStatusVal && !bulkKV && !bulkKA && !bulkKK)}
            onClick={() => {
              if (bulkStatusVal === 'Rejected' && !bulkRejectNote.trim()) {
                setError('Rejection reason required for bulk Rejected.');
                return;
              }
              const patch: ISubmissionPatch = {};
              if (bulkPicVal) patch.PicEditing = bulkPicVal;
              if (bulkStatusVal) patch.Status = bulkStatusVal;
              if (bulkStatusVal === 'Rejected' && bulkRejectNote) patch.ReviewNote = bulkRejectNote;
              if (bulkKV) patch.KualitasVideo = bulkKV;
              if (bulkKA) patch.KualitasAudio = bulkKA;
              if (bulkKK) patch.KualitasKonten = bulkKK;
              const label = [
                bulkPicVal && `PIC=${bulkPicVal.split('@')[0]}`,
                bulkStatusVal && `Status=${bulkStatusVal}`,
                bulkKV && `KV=${kLabel(bulkKV)}`,
                bulkKA && `KA=${kLabel(bulkKA)}`,
                bulkKK && `KK=${kLabel(bulkKK)}`
              ].filter(Boolean).join(', ');
              doBulkApply(patch, label);
            }}
            style={{ flexShrink: 0 }}
          >
            Apply
          </PrimaryButton>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: tokens.font.small, flexShrink: 0 }}
            >
              Clear
            </button>
          )}
          {bulkLoading && <span style={{ color: '#fff', fontSize: tokens.font.micro }}>Applying...</span>}
        </div>
      )}

      <PaginationBar />

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
            {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => {
              const sk = (w: number): React.CSSProperties => ({
                width: w, height: 13, borderRadius: 4,
                background: i % 2 === 0 ? tokens.color.line : tokens.color.surfaceAlt,
                display: 'inline-block'
              });
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? undefined : tokens.color.surfaceAlt }}>
                  {isSupervisor && <td style={td}><div style={sk(16)} /></td>}
                  <td style={td}><div style={sk(72)} /></td>
                  <td style={td}><div style={sk(110)} /></td>
                  <td style={td}><div style={sk(150)} /></td>
                  <td style={td}><div style={sk(90)} /></td>
                  <td style={td}><div style={sk(100)} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><div style={{ ...sk(20), margin: '0 auto' }} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><div style={{ ...sk(20), margin: '0 auto' }} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><div style={{ ...sk(20), margin: '0 auto' }} /></td>
                  <td style={td}><div style={sk(32)} /></td>
                </tr>
              );
            })}
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
                      <div>{s.CodeNumber}</div>
                      {(s.LinkDamsShare || s.LinkVideoFromLecturer) && (
                        <a
                          href={s.LinkDamsShare || s.LinkVideoFromLecturer}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(s.LinkDamsShare || s.LinkVideoFromLecturer || '', '_blank', 'noopener,noreferrer'); }}
                          style={{ fontSize: '9px', fontWeight: 400, color: tokens.color.blue, textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                          open video
                        </a>
                      )}
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.ink }}>{s.Name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>{s.KodeDosen}</span>
                        {s.KodeDosen && (
                          <button
                            type="button"
                            data-inline="true"
                            onClick={(e) => { e.stopPropagation(); setDosenFilter(s.KodeDosen!); setDosenFilterMeta(`${s.Name || ''} · ${s.Email || ''}`); setPage(1); }}
                            style={{ fontSize: '9px', padding: '0 4px', border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.pill, background: '#fff', color: tokens.color.text, cursor: 'pointer', lineHeight: 1.6 }}
                          >
                            filter
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.ink }}>{s.KodeMatakuliah}</span>
                        {s.KodeMatakuliah && (
                          <button
                            type="button"
                            data-inline="true"
                            onClick={(e) => { e.stopPropagation(); quickFilter('kodeMK', s.KodeMatakuliah!); }}
                            style={{ fontSize: '9px', padding: '0 4px', border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.pill, background: '#fff', color: tokens.color.text, cursor: 'pointer', lineHeight: 1.6 }}
                          >
                            filter
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: tokens.font.micro, color: tokens.color.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.Topik}
                      </div>
                    </td>
                    <td style={td}>
                      <StatusCombo
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
                      const cur = parseInt(raw || '0', 10);
                      return (
                        <td key={k} style={{ ...td, textAlign: 'center' }}>
                          {canEdit ? (
                            <div data-inline="true" style={{ display: 'flex', gap: 2 }}>
                              {([['1','W'],['3','M'],['5','E']] as const).map(([v, lbl]) => {
                                const active = cur === parseInt(v, 10);
                                return (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); optimisticPatch(s.Id, { [k]: active ? '0' : v } as ISubmissionPatch); }}
                                    style={{
                                      padding: '1px 5px',
                                      fontWeight: 700,
                                      fontSize: tokens.font.micro,
                                      border: `1.5px solid ${active ? kColor(v) : tokens.color.line}`,
                                      borderRadius: tokens.radius.pill,
                                      background: active ? kColor(v) : '#fff',
                                      color: active ? '#fff' : tokens.color.text,
                                      cursor: 'pointer',
                                      lineHeight: 1.5
                                    }}
                                  >
                                    {lbl}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            cur > 0
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

      <PaginationBar />

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
