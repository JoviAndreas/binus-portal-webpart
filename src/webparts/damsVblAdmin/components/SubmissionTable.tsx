import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ISubmissionListItem, IEditorInfo, IMeInfo, ISubmissionPatch, STATUS_VALUES } from '../../../shared/damsTypes';
import {
  StatusCombo,
  SearchableSelect,
  DosenCombo,
  PicCombo,
  GhostButton,
  PrimaryButton,
  MessageBar,
  PillTabs,
  ConfirmModal,
  STATUS_LABELS
} from '../../../shared/DamsUi';
import { BulkConfirmModal, ToastStack, useToasts } from '../../../shared/bulkui';
import { AudioPreview } from './AudioPreview';
import { VideoActions } from './VideoActions';
import { VideoPreviewModal } from './VideoPreviewModal';

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

const PAGE_SIZE = 20;

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


const PREVIEW_FRAMES: [string, string][] = [['b', 'BUMPER'], ['25', '25%'], ['50', '50%'], ['75', '75%']];
const FRAME_W = 110;
const FRAME_H = 62;
const WIDE_W = FRAME_W * 4 + 12;

const IconVideo: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3" />
  </svg>
);
const IconDoc: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconWarn: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" />
  </svg>
);

const WideNotice: React.FC<{ icon: React.ReactNode; title: string; text: React.ReactNode; danger?: boolean }> = ({ icon, title, text, danger }) => (
  <div
    style={{
      width: WIDE_W, height: FRAME_H, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderRadius: 3,
      border: `1px dashed ${danger ? tokens.color.danger : tokens.color.line}`,
      background: danger ? tokens.color.dangerBg : tokens.color.surfaceAlt,
      color: danger ? tokens.color.danger : tokens.color.text
    }}
  >
    <span style={{ flex: '0 0 auto', display: 'inline-flex' }}>{icon}</span>
    <div>
      <div style={{ fontSize: tokens.font.small, fontWeight: 700, color: danger ? tokens.color.danger : tokens.color.ink }}>{title}</div>
      <div style={{ fontSize: tokens.font.micro }}>{text}</div>
    </div>
  </div>
);

type ThumbState = 'loading' | 'done' | 'error';

const PreviewBody: React.FC<{
  frames: Record<string, string> | undefined;
  status: ThumbState | undefined;
  isDoc: boolean;
  onRetry: () => void;
}> = ({ frames, status, isDoc, onRetry }) => {
  if (isDoc) {
    return <WideNotice icon={<IconDoc size={26} />} title="No video preview" text="This submission is a document, not a video." />;
  }
  if (status === 'error') {
    return (
      <WideNotice
        danger
        icon={<IconWarn size={26} />}
        title="Couldn't load previews"
        text={<>Network or server error. <button type="button" data-inline="true" onClick={(e) => { e.stopPropagation(); onRetry(); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: tokens.color.blue, fontWeight: 700, fontSize: tokens.font.micro }}>Retry</button></>}
      />
    );
  }
  const loading = !status || status === 'loading';
  const fetching = status === 'loading';
  if (!loading && (!frames || Object.keys(frames).length === 0)) {
    return <WideNotice icon={<IconVideo size={26} />} title="No preview yet" text="Frames haven't been generated for this video." />;
  }
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {PREVIEW_FRAMES.map(([k, label]) => {
        const src = frames?.[k];
        const isBumper = k === 'b';
        const missing = !loading && !src;
        const box: React.CSSProperties = {
          position: 'relative', width: FRAME_W, height: FRAME_H, borderRadius: 3, overflow: 'hidden', flex: '0 0 auto', boxSizing: 'border-box',
          border: isBumper ? `2px ${missing ? 'dashed' : 'solid'} ${tokens.color.orange}` : `1px ${missing ? 'dashed' : 'solid'} ${tokens.color.line}`,
          background: tokens.color.surfaceAlt,
          display: missing || fetching ? 'flex' : undefined, alignItems: 'center', justifyContent: 'center', flexDirection: fetching ? 'column' : undefined, gap: 4, color: tokens.color.text
        };
        return (
          <div key={k} className={loading ? 'dams-shimmer' : undefined} style={box} aria-busy={fetching || undefined}>
            {fetching && <span className="dams-spinner" role="progressbar" aria-label="Loading preview" />}
            {fetching && isBumper && <span style={{ fontSize: 9, fontWeight: 700, color: tokens.color.blueDark }}>Loading...</span>}
            {src && <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            {missing && <IconVideo size={20} />}
            {!loading && (
              <span style={{ position: 'absolute', left: 3, bottom: 3, background: missing ? tokens.color.text : isBumper ? tokens.color.orange : 'rgba(20,30,50,.75)', color: '#fff', fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3 }}>{label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Asks for its row's frames only once the row scrolls near the viewport.
const PreviewCell: React.FC<{
  id: string;
  frames: Record<string, string> | undefined;
  status: ThumbState | undefined;
  isDoc: boolean;
  onNeed: (id: string) => void;
  onRetry: () => void;
}> = ({ id, frames, status, isDoc, onNeed, onRetry }) => {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = hostRef.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  React.useEffect(() => {
    if (visible && !status && !isDoc) onNeed(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, status, isDoc, id]);

  return (
    <div ref={hostRef}>
      <PreviewBody frames={frames} status={status} isDoc={isDoc} onRetry={onRetry} />
    </div>
  );
};

const VIDEO_EXT = /\.(mp4|mov|m4v|mkv|avi|wmv|webm|mpg|mpeg)$/i;
const isDocumentRow = (s: ISubmissionListItem): boolean => !!s.FileName && !VIDEO_EXT.test(s.FileName.trim());

export const SubmissionTable: React.FC<ISubmissionTableProps> = ({ api, reloadToken, onOpenDrawer, me, editors, onTotalChange }) => {
  const isAdmin = me.IsAdmin;
  const canEdit = me.IsAdmin || me.IsEditor;
  const defaultChip: FilterChip = (me.IsEditor || isAdmin) ? 'myqueue' : 'allactive';
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
  const [fakultasFilter, setFakultasFilter] = React.useState('');
  const [jurusanFilter, setJurusanFilter] = React.useState('');
  const [kodeMKFilter, setKodeMKFilter] = React.useState('');
  const [fakultasOptions, setFakultasOptions] = React.useState<string[]>([]);
  const [jurusanOptions, setJurusanOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    api.getFaculties().then((list) => {
      if (list.length) setFakultasOptions(list);
    }).catch(() => undefined);
    api.getDepartments().then((list) => {
      if (list.length) setJurusanOptions(list);
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [yearFilter, setYearFilter] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState<boolean>(() => {
    try { return window.localStorage.getItem('vbl-review-preview') === '1'; } catch { return false; }
  });
  const [thumbs, setThumbs] = React.useState<Record<string, Record<string, string>>>({});
  const [thumbsStatus, setThumbsStatus] = React.useState<Record<string, ThumbState>>({});
  const [videoPreview, setVideoPreview] = React.useState<{ id: string; code: string; fallback: string } | null>(null);
  const [replacedAt, setReplacedAt] = React.useState<Record<string, number>>({});
  const onVideoReplaced = (id: string): void => {
    const lower = id.toLowerCase();
    setThumbs((prev) => { const n = { ...prev }; delete n[lower]; return n; });
    setThumbsStatus((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setReplacedAt((prev) => ({ ...prev, [id]: Date.now() }));
  };
  const thumbQueueRef = React.useRef<Set<string>>(new Set());
  const thumbTimerRef = React.useRef<number | null>(null);
  const thumbAbortRef = React.useRef<AbortController | null>(null);
  const retryThumbs = (): void => {
    setThumbsStatus((prev) => {
      const n = { ...prev };
      items.forEach((s) => { if (n[s.Id] === 'error') delete n[s.Id]; });
      return n;
    });
  };
  const togglePreview = (): void => {
    setPreviewMode((v) => {
      try { window.localStorage.setItem('vbl-review-preview', v ? '0' : '1'); } catch { /* ignore */ }
      return !v;
    });
  };
  const [page, setPage] = React.useState(1);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  const reqIdRef = React.useRef(0);
  const [items, setItems] = React.useState<ISubmissionListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  React.useEffect(() => { onTotalChange?.(total); }, [total, onTotalChange]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Optimistic local overrides per row
  const [localOverrides, setLocalOverrides] = React.useState<Record<string, Partial<ISubmissionListItem>>>({});
  // Per-row inline error flash
  const [rowErrors, setRowErrors] = React.useState<Record<string, string>>({});
  // Per-row "Copied!" flash after copying the DAMS link
  const [copiedLinkId, setCopiedLinkId] = React.useState<string | null>(null);
  const copyDamsLink = (id: string, link: string): void => {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId((cur) => (cur === id ? null : cur)), 1800);
    });
  };
  // Pending Rejected: rowId -> rejection reason being typed
  const [pendingRejected, setPendingRejected] = React.useState<Record<string, string>>({});
  // Intercept: open drawer while rows selected
  const [openIntercept, setOpenIntercept] = React.useState<string | null>(null);

  // Bulk selection (admin only)
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkPopup, setBulkPopup] = React.useState<{ kind: 'pic' | 'status' | 'KV' | 'KA' | 'KK'; value: string } | null>(null);
  const { toasts, push: pushToast, close: closeToast } = useToasts();
  const [confirmModal, setConfirmModal] = React.useState<{ message: string; onConfirm: () => void } | null>(null);
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const buildFilter = React.useCallback((): Record<string, unknown> => {
    const extra = {
      dosen: dosenFilter || undefined,
      kodeMK: kodeMKFilter || undefined,
      fakultas: fakultasFilter || undefined,
      jurusan: jurusanFilter || undefined,
      year: yearFilter ? parseInt(yearFilter, 10) : undefined,
      pic: picFilter || undefined,
      status: statusFilter || undefined,
    };
    const excludeStatus = !statusFilter;
    switch (chip) {
      case 'myqueue':    return { ...extra, assignedTo: me.Email || undefined, excludeStatus, page, pageSize: PAGE_SIZE, sortDir };
      case 'unassigned': return { ...extra, unassigned: true, excludeStatus, page, pageSize: PAGE_SIZE, sortDir };
      case 'allactive':  return { ...extra, excludeStatus, page, pageSize: PAGE_SIZE, sortDir };
    }
  }, [chip, dosenFilter, kodeMKFilter, fakultasFilter, jurusanFilter, yearFilter, picFilter, statusFilter, me.Email, page, sortDir]);

  React.useEffect(() => {
    const reqId = ++reqIdRef.current;
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    setLocalOverrides({});
    setRowErrors({});
    setPendingRejected({});
    setSelected(new Set());
    api.listSubmissions(buildFilter() as Parameters<typeof api.listSubmissions>[0], ctrl.signal).then((res) => {
      if (reqIdRef.current !== reqId) return;
      if (!res) {
        setError('Failed to load submissions.');
        setItems([]);
        setTotal(0);
      } else {
        const loaded = res.items || [];
        setItems(loaded);
        setTotal(res.total || 0);
      }
      setLoading(false);
    }).catch((err) => {
      if (ctrl.signal.aborted || reqIdRef.current !== reqId) return;
      setError('Failed to load submissions.');
      setLoading(false);
    });
    return () => { ctrl.abort(); };
  }, [api, buildFilter, reloadToken]);

  const switchChip = (c: FilterChip): void => {
    setChip(c);
    setPage(1);
    setPicFilter('');
    setStatusFilter('');
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
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...(patch as Partial<ISubmissionListItem>) } }));
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
    if (selected.has(id)) { openBulk('status', newStatus); return; }
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

  // Selection helpers (admin only)
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
  const canSelectRow = (s: ISubmissionListItem): boolean =>
    isAdmin || (canEdit && !!me.Email && (s.PicEditing || '').toLowerCase() === me.Email.toLowerCase());
  const onRowClick = (e: React.MouseEvent, id: string): void => {
    if (!canEdit) return;
    const row = items.find((s) => s.Id === id);
    if (!row || !canSelectRow(row)) return;
    if (isInlineControl(e.target)) return;
    e.preventDefault();
    if (e.shiftKey) rangeSelect(id); else toggleSelect(id);
  };
  const selectableItems = React.useMemo(() => items.filter(canSelectRow), [items, isAdmin, canEdit, me.Email]);
  const toggleSelectAll = (): void => {
    setSelected((prev) => prev.size === selectableItems.length && selectableItems.length > 0 ? new Set() : new Set(selectableItems.map((s) => s.Id)));
  };

  // Bulk edit: changing one control opens a popup; confirming applies it to every selected row.
  type BulkKind = 'pic' | 'status' | 'KV' | 'KA' | 'KK';
  const openBulk = (kind: BulkKind, value: string): void => {
    if (selected.size === 0) return;
    setBulkPopup({ kind, value });
  };
  const cancelBulk = (): void => { setBulkPopup(null); };
  const bulkDescribe = (kind: BulkKind, value: string): { field: string; valueLabel: string } => {
    if (kind === 'pic') return { field: 'PIC Editor', valueLabel: value };
    if (kind === 'status') return { field: 'Status', valueLabel: STATUS_LABELS[value] || value };
    const names: Record<string, string> = { KV: 'Kualitas Video (KV)', KA: 'Kualitas Audio (KA)', KK: 'Kualitas Konten (KK)' };
    return { field: names[kind], valueLabel: value === '0' ? 'Cleared' : kLabel(value) };
  };
  const confirmBulk = (note: string): void => {
    if (!bulkPopup) return;
    const { kind, value } = bulkPopup;
    const patch: ISubmissionPatch = {};
    if (kind === 'pic') patch.PicEditing = value;
    if (kind === 'status') { patch.Status = value; if (value === 'Rejected') patch.ReviewNote = note; }
    if (kind === 'KV') patch.KualitasVideo = value;
    if (kind === 'KA') patch.KualitasAudio = value;
    if (kind === 'KK') patch.KualitasKonten = value;
    const ids = Array.from(selected);
    const codeOf = (id: string): string => items.find((s) => s.Id === id)?.CodeNumber || id.slice(0, 8);
    const d = bulkDescribe(kind, value);
    setBulkPopup(null);
    setBulkLoading(true);
    api.bulkPatch({ ids, patch }).then((result) => {
      setBulkLoading(false);
      if (!result) {
        pushToast({ kind: 'error', title: 'Bulk update failed', text: 'The server did not accept the request. Nothing was changed.' });
        return;
      }
      const failed = result.failed || [];
      if (failed.length === 0) {
        pushToast({ kind: 'success', title: `Updated ${result.updated} row${result.updated === 1 ? '' : 's'}`, text: `${d.field}: ${d.valueLabel}` });
      } else {
        const details = failed.map((f) => ({ code: codeOf(f.id), reason: f.reason }));
        if (result.updated > 0) {
          pushToast({ kind: 'warn', title: `Updated ${result.updated} of ${ids.length} rows`, text: `${failed.length} row${failed.length === 1 ? '' : 's'} failed.`, details });
        } else {
          const groups: Record<string, number> = {};
          failed.forEach((f) => { const r = f.reason.replace(/\.$/, ''); groups[r] = (groups[r] || 0) + 1; });
          pushToast({ kind: 'error', title: `${failed.length} row${failed.length === 1 ? '' : 's'} failed`, text: Object.keys(groups).map((r) => `${r} (${groups[r]})`).join(', '), details });
        }
      }
      setLocalOverrides({});
      setSelected(new Set());
      api.listSubmissions(buildFilter() as Parameters<typeof api.listSubmissions>[0]).then((res) => {
        if (res) { setItems(res.items || []); setTotal(res.total || 0); }
      }).catch(() => undefined);
    }).catch(() => {
      setBulkLoading(false);
      pushToast({ kind: 'error', title: 'Bulk update failed', text: 'Network or server error. Nothing was changed.' });
    });
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const PaginationBar = (): React.ReactElement => {
    const pageBtn = (p: number, label?: string): React.ReactElement => {
      const active = p === page;
      return (
        <button
          key={label || p}
          type="button"
          onClick={() => setPage(p)}
          style={{
            minWidth: 32, height: 32, padding: '0 8px', userSelect: 'none',
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
          <button
            type="button"
            title={sortDir === 'desc' ? 'Newest first - click for oldest first' : 'Oldest first - click for newest first'}
            onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 4, border: `1px solid ${tokens.color.line}`,
              background: tokens.color.bg, cursor: 'pointer',
              fontSize: tokens.font.label, color: tokens.color.text,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              {sortDir === 'desc'
                ? <path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M6 10V2M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
            {sortDir === 'desc' ? 'Newest' : 'Oldest'}
          </button>
          <GhostButton type="button" style={{ userSelect: 'none' }} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</GhostButton>
          {pages}
          <GhostButton type="button" style={{ userSelect: 'none' }} disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</GhostButton>
        </div>
      </div>
    );
  };
  const showPicCol = isAdmin || canEdit;
  const previewOn = canEdit && previewMode;
  const colCount = (isAdmin ? (showPicCol ? 11 : 10) : (showPicCol ? 10 : 9)) + (previewOn ? 2 : 0) + (canEdit ? 1 : 0);

  // Rows ask for their frames (needThumb) as they scroll into view; requests are batched
  // and all in-flight work is cancelled when the page, filters or Preview mode change.
  const flushThumbs = (): void => {
    thumbTimerRef.current = null;
    const ids = Array.from(thumbQueueRef.current).slice(0, 8);
    ids.forEach((id) => thumbQueueRef.current.delete(id));
    if (thumbQueueRef.current.size > 0) thumbTimerRef.current = window.setTimeout(flushThumbs, 60);
    if (ids.length === 0) return;
    if (!thumbAbortRef.current) thumbAbortRef.current = new AbortController();
    const ctrl = thumbAbortRef.current;
    const mark = (st: ThumbState): void => {
      setThumbsStatus((prev) => {
        const n = { ...prev };
        ids.forEach((id) => { n[id] = st; });
        return n;
      });
    };
    mark('loading');
    api.getThumbs(ids, ctrl.signal).then((res) => {
      if (ctrl.signal.aborted) return;
      if (res === null) { mark('error'); return; }
      setThumbs((prev) => ({ ...prev, ...res }));
      mark('done');
    }).catch(() => { if (!ctrl.signal.aborted) mark('error'); });
  };
  const needThumb = (id: string): void => {
    thumbQueueRef.current.add(id);
    if (thumbTimerRef.current === null) thumbTimerRef.current = window.setTimeout(flushThumbs, 120);
  };

  React.useEffect(() => {
    setThumbsStatus((prev) => {
      if (!Object.keys(prev).some((k) => prev[k] === 'loading')) return prev;
      const n = { ...prev };
      Object.keys(n).forEach((k) => { if (n[k] === 'loading') delete n[k]; });
      return n;
    });
    return () => {
      if (thumbAbortRef.current) { thumbAbortRef.current.abort(); thumbAbortRef.current = null; }
      thumbQueueRef.current.clear();
      if (thumbTimerRef.current !== null) { window.clearTimeout(thumbTimerRef.current); thumbTimerRef.current = null; }
    };
  }, [items, previewOn]);

  const fmtDate = (iso?: string): string => {
    if (!iso) return '';
    // DB stores WIB (UTC+7) naive — append offset so browser parses correctly
    const s = iso.includes('+') || iso.endsWith('Z') ? iso : iso + '+07:00';
    const d = new Date(s);
    const day = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day}, ${date}, ${hh}.${mm}`;
  };

  const kLabel = (v: string | undefined): string => {
    const n = parseInt(v || '0', 10);
    if (n <= 1) return 'Weak';
    if (n <= 3) return 'Moderate';
    return 'Excellent';
  };
  const kColor = (v: string | undefined): string => {
    const n = parseInt(v || '0', 10);
    if (n <= 1) return tokens.color.danger;
    if (n <= 3) return tokens.color.orange;
    return '#16a34a';
  };
const K_FIELDS: (keyof ISubmissionListItem)[] = ['KualitasVideo', 'KualitasAudio', 'KualitasKonten'];
const K_KIND: Record<string, 'KV' | 'KA' | 'KK'> = { KualitasVideo: 'KV', KualitasAudio: 'KA', KualitasKonten: 'KK' };

  // Display value helpers (merge server state with local override)
  const val = <K extends keyof ISubmissionListItem>(s: ISubmissionListItem, k: K): ISubmissionListItem[K] =>
    (localOverrides[s.Id]?.[k] !== undefined ? localOverrides[s.Id]![k] : s[k]) as ISubmissionListItem[K];

  const displayStatus = (s: ISubmissionListItem): string =>
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
            onSearch={(q, signal) => api.searchDosens(q, signal).then((r) => r || [])}
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
            value={fakultasFilter}
            options={fakultasOptions}
            onChange={(v) => { setFakultasFilter(v); setPage(1); }}
            placeholder="Fakultas"
            style={{ maxWidth: 200 }}
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
            options={[]}
            onSearch={(q) => api.searchMatakuliah(q).then((list) => (list || []).map((m) => ({
              value: m.KodeMatakuliah,
              label: m.NamaMatakuliah ? `${m.KodeMatakuliah} - ${m.NamaMatakuliah}` : m.KodeMatakuliah,
              meta: m.NamaMatakuliah || undefined,
            })))}
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
            optionLabel={STATUS_LABELS}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            placeholder="Status"
            style={{ maxWidth: 130 }}
          />
          {(dosenFilter || picFilter || fakultasFilter || jurusanFilter || kodeMKFilter || yearFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setDosenFilter(''); setDosenFilterMeta('');
                setPicFilter(''); setFakultasFilter(''); setJurusanFilter(''); setKodeMKFilter(''); setYearFilter(''); setStatusFilter('');
                setPage(1);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.color.text, fontSize: tokens.font.small, textDecoration: 'underline', whiteSpace: 'nowrap', padding: 0 }}
            >Clear filters</button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={togglePreview}
              aria-pressed={previewMode}
              title="Show video frame previews (bumper, 25%, 50%, 75%)"
              style={{
                marginLeft: 'auto', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                padding: '7px 12px', borderRadius: tokens.radius.pill, fontSize: tokens.font.small, fontWeight: 600,
                border: `1px solid ${previewMode ? tokens.color.blue : tokens.color.line}`,
                background: previewMode ? tokens.color.blue : '#fff',
                color: previewMode ? '#fff' : tokens.color.text
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 16l-5-5-8 8" />
              </svg>
              Preview {previewMode ? 'on' : 'off'}
            </button>
          )}
          <GhostButton
            type="button"
            disabled={exporting}
            onClick={() => {
              setExporting(true);
              const f = buildFilter() as Parameters<typeof api.exportExcel>[0];
              api.exportExcel(f).catch(() => setError('Export failed.')).finally(() => setExporting(false));
            }}
            style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: canEdit ? 0 : 'auto' }}
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

      {/* Bulk bar (editor+admin; PicEditing reassign is admin-only, always visible; actions disabled when no selection) */}
      {canEdit && (
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
            {selected.size > 0 ? `Bulk edit mode - ${selected.size} selected` : 'Select rows to bulk edit'}
          </span>
          <span style={{ fontSize: tokens.font.micro, color: 'rgba(255,255,255,.75)' }}>
            {selected.size > 0
              ? 'Editing a selected row applies to all selected rows. Editing an unselected row changes only that row.'
              : 'Tick a row, then edit one of the selected rows to update them all at once.'}
          </span>
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

      {PaginationBar()}

      {/* Table */}
      <div style={{ overflowX: 'auto', border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.card, boxShadow: tokens.shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: (canEdit ? (showPicCol ? 1300 : 1190) : (showPicCol ? 1260 : 1150)) + (previewOn ? 730 : 0) + (canEdit ? 84 : 0) }}>
          <thead>
            <tr>
              {canEdit && (
                <th style={{ ...th, width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === selectableItems.length && selectableItems.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th style={{ ...th, width: 110 }}>Code</th>
              <th style={{ ...th, minWidth: 160 }}>Submitter</th>
              <th style={{ ...th, minWidth: 200 }}>MK / Topik</th>
              {previewOn && (
                <th style={{ ...th, minWidth: 470 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Preview
                    {items.some((s) => thumbsStatus[s.Id] === 'loading') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: tokens.color.blue, textTransform: 'none', letterSpacing: 0 }}>
                        <span className="dams-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        Loading {items.filter((s) => thumbsStatus[s.Id] === 'loading').length} rows...
                      </span>
                    )}
                  </span>
                </th>
              )}
              {previewOn && <th style={{ ...th, minWidth: 260 }}>Audio</th>}
              <th style={{ ...th, width: 90 }}>Week / Sesi</th>
              <th style={{ ...th, minWidth: 140 }}>Status</th>
              {showPicCol && <th style={{ ...th, minWidth: 110 }}>PIC Editor</th>}
              <th style={{ ...th, width: 38, textAlign: 'center' }}><span title="Kualitas Video"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="15" height="10" rx="2"/><path d="M17 9l5-2v10l-5-2"/></svg></span></th>
              <th style={{ ...th, width: 38, textAlign: 'center' }}><span title="Kualitas Audio"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></span></th>
              <th style={{ ...th, width: 38, textAlign: 'center' }}><span title="Kualitas Konten"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span></th>
              {canEdit && <th style={{ ...th, width: 84 }}>Video</th>}
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
                  {canEdit && <td style={td}><div style={sk(16)} /></td>}
                  <td style={td}><div style={sk(72)} /></td>
                  <td style={td}><div style={sk(110)} /></td>
                  <td style={td}><div style={sk(150)} /></td>
                  {previewOn && <td style={td}><div style={{ ...sk(440), height: 62 }} /></td>}
                  {previewOn && <td style={td}><div style={{ ...sk(200), height: 40 }} /></td>}
                  <td style={td}><div style={sk(60)} /></td>
                  <td style={td}><div style={sk(90)} /></td>
                  {showPicCol && <td style={td}><div style={sk(80)} /></td>}
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
                      cursor: canEdit && canSelectRow(s) ? 'pointer' : 'default',
                      userSelect: canEdit && canSelectRow(s) ? 'none' : undefined
                    }}
                    onClick={(e) => onRowClick(e, s.Id)}
                  >
                    {canEdit && (
                      <td style={{ ...td, padding: '9px 10px' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(s.Id)}
                          disabled={!canSelectRow(s)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(s.Id); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: canSelectRow(s) ? 'pointer' : 'not-allowed' }}
                        />
                      </td>
                    )}
                    <td style={{ ...td, fontSize: tokens.font.micro, fontWeight: 700, color: tokens.color.blueDark }}>
                      <div>{s.CodeNumber}</div>
                      {(s.LinkDamsShare || s.LinkVideoFromLecturer) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = s.LinkDamsShare || s.LinkVideoFromLecturer || '';
                            if (canEdit && s.LinkDamsShare) setVideoPreview({ id: s.Id, code: s.CodeNumber || s.Id.slice(0, 8), fallback: link });
                            else window.open(link, '_blank');
                          }}
                          style={{ fontSize: '9px', fontWeight: 400, color: tokens.color.blue, textDecoration: 'none', whiteSpace: 'nowrap', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          open video
                        </button>
                      )}
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: tokens.font.small, fontWeight: 600, color: tokens.color.ink }}>{s.Name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
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
                        {s.SubmissionTime && (
                          <span style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>{fmtDate(s.SubmissionTime)}</span>
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
                    {previewOn && (
                      <td style={td}>
                        <PreviewCell
                          id={s.Id}
                          onNeed={needThumb}
                          frames={thumbs[s.Id.toLowerCase()]}
                          status={thumbsStatus[s.Id]}
                          isDoc={isDocumentRow(s)}
                          onRetry={retryThumbs}
                        />
                      </td>
                    )}
                    {previewOn && (
                      <td style={td}>
                        {isDocumentRow(s) ? <span style={{ color: tokens.color.text, fontSize: tokens.font.micro }}>No audio</span> : <AudioPreview key={`${s.Id}:${replacedAt[s.Id] || 0}`} api={api} id={s.Id} />}
                      </td>
                    )}
                    <td style={{ ...td, whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {(s.Week || s.Session) && (
                        <div style={{ fontSize: tokens.font.micro, fontWeight: 600, color: tokens.color.ink }}>
                          {(s.Week || '-').padStart(2, '0')}/{(s.Session || '-').padStart(2, '0')}
                        </div>
                      )}
                      {s.LinkDamsShare && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); copyDamsLink(s.Id, s.LinkDamsShare!); }}
                          style={{ fontSize: '9px', fontWeight: 400, color: copiedLinkId === s.Id ? tokens.color.success : tokens.color.blue, textDecoration: 'none', whiteSpace: 'nowrap', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 2 }}
                        >
                          {copiedLinkId === s.Id ? 'Copied!' : 'copy DAMS link'}
                        </button>
                      )}
                    </td>
                    <td style={td}>
                      <StatusCombo
                        value={displayStatus(s)}
                        onChange={(newStatus) => handleStatusChange(s.Id, newStatus)}
                        disabled={!canEdit}
                      />
                      {rowErr && <div style={{ fontSize: tokens.font.micro, color: tokens.color.danger, marginTop: 3 }}>{rowErr}</div>}
                    </td>
                    {showPicCol && (
                      <td style={td}>
                        <PicCombo
                          value={val(s, 'PicEditing') as string}
                          editors={editors}
                          onChange={(email) => { if (selected.has(s.Id)) openBulk('pic', email); else optimisticPatch(s.Id, { PicEditing: email }); }}
                          disabled={!isAdmin}
                        />
                      </td>
                    )}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const next = active ? '0' : v;
                                      if (selected.has(s.Id)) openBulk(K_KIND[k as string], next);
                                      else optimisticPatch(s.Id, { [k]: next } as ISubmissionPatch);
                                    }}
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
                    {canEdit && (
                      <td style={td}>
                        <VideoActions
                          api={api}
                          id={s.Id}
                          code={s.CodeNumber || s.Id.slice(0, 8)}
                          canReplace={canSelectRow(s)}
                          onReplaced={() => onVideoReplaced(s.Id)}
                          onError={(m) => setError(m)}
                        />
                      </td>
                    )}
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

      {PaginationBar()}

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

      {bulkPopup && (() => {
        const { kind, value } = bulkPopup;
        const n = selected.size;
        const rows = items.filter((s) => selected.has(s.Id));
        const d = bulkDescribe(kind, value);
        const rowsWord = n === 1 ? 'row' : 'rows';
        const subsWord = n === 1 ? 'submission' : 'submissions';
        const otherPic = kind === 'pic' ? rows.filter((s) => s.PicEditing && s.PicEditing.toLowerCase() !== value.toLowerCase()).length : 0;
        const isReject = kind === 'status' && value === 'Rejected';
        return (
          <BulkConfirmModal
            title={kind === 'pic' ? `Reassign ${n} ${subsWord}?` : isReject ? `Reject ${n} ${subsWord}?` : `Update ${n} ${subsWord}?`}
            description={isReject
              ? <>All selected rows will be set to <b>Rejected</b> with the note below.</>
              : kind === 'pic'
                ? <>Assign <b>PIC Editor</b> to <b>{value}</b> for all selected rows.</>
                : kind === 'status'
                  ? <>Change <b>Status</b> to <b>{d.valueLabel}</b> for all selected rows.</>
                  : <>Set <b>{d.field}</b> to <b>{d.valueLabel}</b> for all selected rows.</>}
            summary={`${d.field}: ${d.valueLabel}`}
            codes={rows.map((s) => s.CodeNumber || s.Id.slice(0, 8))}
            warning={otherPic > 0 ? `${otherPic} row${otherPic === 1 ? ' is' : 's are'} currently assigned to someone else. ${otherPic === 1 ? 'It' : 'They'} will be reassigned.` : undefined}
            noteRequired={isReject}
            notePlaceholder="Reason for rejection (required)"
            danger={isReject}
            confirmLabel={kind === 'pic' ? `Reassign ${n} ${rowsWord}` : isReject ? `Reject ${n} ${rowsWord}` : `Update ${n} ${rowsWord}`}
            onConfirm={confirmBulk}
            onCancel={cancelBulk}
          />
        );
      })()}
      {videoPreview && (
        <VideoPreviewModal
          api={api}
          id={videoPreview.id}
          code={videoPreview.code}
          fallbackUrl={videoPreview.fallback}
          onClose={() => setVideoPreview(null)}
        />
      )}
      <ToastStack toasts={toasts} onClose={closeToast} />
    </div>
  );
};
