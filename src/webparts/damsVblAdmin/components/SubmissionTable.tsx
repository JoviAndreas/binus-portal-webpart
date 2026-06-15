import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ISubmission, STATUS_VALUES } from '../../../shared/damsTypes';
import { Field, TextInput, Select, GhostButton, StatusBadge, MessageBar } from '../../../shared/DamsUi';

export interface ISubmissionTableProps {
  api: DamsApi;
  reloadToken: number;
  onRowClick: (id: string) => void;
}

const PAGE_SIZE = 25;

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: tokens.color.text,
  borderBottom: `1px solid ${tokens.color.border}`
};
const td: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: tokens.font.small,
  color: tokens.color.textDark,
  borderBottom: `1px solid ${tokens.color.borderSoft}`,
  verticalAlign: 'middle'
};

export const SubmissionTable: React.FC<ISubmissionTableProps> = ({ api, reloadToken, onRowClick }) => {
  const [status, setStatus] = React.useState('');
  const [dosen, setDosen] = React.useState('');
  const [kodeMK, setKodeMK] = React.useState('');
  const [q, setQ] = React.useState('');
  const [applied, setApplied] = React.useState({ status: '', dosen: '', kodeMK: '', q: '' });
  const [page, setPage] = React.useState(1);

  const [items, setItems] = React.useState<ISubmission[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .listSubmissions({ ...applied, page, pageSize: PAGE_SIZE })
      .then((res) => {
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
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load submissions.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [api, applied, page, reloadToken]);

  const apply = (): void => {
    setPage(1);
    setApplied({ status, dosen, kodeMK, q });
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>
      <div
        style={{
          display: 'grid',
          gap: tokens.space.sm,
          gridTemplateColumns: 'repeat(12, 1fr)',
          alignItems: 'end'
        }}
      >
        <Field label="Status" style={{ gridColumn: 'span 2 / span 2' }}>
          <Select allowEmpty options={STATUS_VALUES as unknown as string[]} value={status} onChange={(e) => setStatus(e.target.value)} />
        </Field>
        <Field label="Kode Dosen" style={{ gridColumn: 'span 2 / span 2' }}>
          <TextInput value={dosen} onChange={(e) => setDosen(e.target.value)} placeholder="D1234" />
        </Field>
        <Field label="Kode MK" style={{ gridColumn: 'span 2 / span 2' }}>
          <TextInput value={kodeMK} onChange={(e) => setKodeMK(e.target.value)} placeholder="COMP6047" />
        </Field>
        <Field label="Search" style={{ gridColumn: 'span 4 / span 4' }}>
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') apply(); }} placeholder="Name, topik, code..." />
        </Field>
        <div style={{ gridColumn: 'span 2 / span 2' }}>
          <GhostButton type="button" onClick={apply} style={{ width: '100%' }}>Filter</GhostButton>
        </div>
      </div>

      {error && <MessageBar kind="error">{error}</MessageBar>}

      <div style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Code</th>
              <th style={th}>Name</th>
              <th style={th}>Dosen</th>
              <th style={th}>Kode MK</th>
              <th style={th}>Topik</th>
              <th style={th}>Status</th>
              <th style={th}>Submitted</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td style={td} colSpan={8}>Loading...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td style={td} colSpan={8}>No submissions match the filters.</td></tr>
            )}
            {!loading && items.map((s) => (
              <tr
                key={s.Id}
                onClick={() => onRowClick(s.Id)}
                style={{ cursor: 'pointer' }}
              >
                <td style={td}>{s.CodeNumber}</td>
                <td style={td}>{s.Name}</td>
                <td style={td}>{s.KodeDosen}</td>
                <td style={td}>{s.KodeMatakuliah}</td>
                <td style={{ ...td, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.Topik}</td>
                <td style={td}><StatusBadge status={s.Status} /></td>
                <td style={td}>{s.SubmissionTime ? new Date(s.SubmissionTime).toLocaleDateString() : ''}</td>
                <td style={td}>
                  <GhostButton type="button" onClick={(e) => { e.stopPropagation(); onRowClick(s.Id); }} style={{ padding: '4px 12px' }}>Edit</GhostButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: tokens.font.small, color: tokens.color.text }}>
          {total} result(s) - page {page} of {pageCount}
        </span>
        <div style={{ display: 'flex', gap: tokens.space.sm }}>
          <GhostButton type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</GhostButton>
          <GhostButton type="button" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</GhostButton>
        </div>
      </div>
    </div>
  );
};
