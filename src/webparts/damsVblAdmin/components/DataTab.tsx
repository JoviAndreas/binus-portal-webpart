import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { Card, CardTitle, Field, TextInput, GhostButton, PrimaryButton, MessageBar, ConfirmModal } from '../../../shared/DamsUi';

type LookupItem = { id: number; value: string; sortOrder: number };

interface ILookupSectionProps {
  title: string;
  category: string;
  api: DamsApi;
}

const LookupSection: React.FC<ILookupSectionProps> = ({ title, category, api }) => {
  const [items, setItems] = React.useState<LookupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [addVal, setAddVal] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editVal, setEditVal] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState<{ id: number; label: string } | null>(null);

  const load = (): void => {
    setLoading(true);
    api.getLookup(category).then((res) => {
      setItems(res || []);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load.');
      setLoading(false);
    });
  };

  React.useEffect(() => { load(); }, []);

  const filtered = search
    ? items.filter((i) => i.value.toLowerCase().includes(search.toLowerCase()))
    : items;

  const doAdd = async (): Promise<void> => {
    const v = addVal.trim();
    if (!v) return;
    setAdding(true);
    setError('');
    try {
      const added = await api.addLookup(category, v);
      if (added) setItems((prev) => [...prev, { id: added.id, value: added.value, sortOrder: 0 }].sort((a, b) => a.value.localeCompare(b.value)));
      setAddVal('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: LookupItem): void => {
    setEditId(item.id);
    setEditVal(item.value);
    setError('');
  };

  const doRename = async (): Promise<void> => {
    if (editId === null) return;
    const v = editVal.trim();
    if (!v) return;
    setSaving(true);
    setError('');
    try {
      await api.renameLookup(category, editId, v);
      setItems((prev) => prev.map((i) => i.id === editId ? { ...i, value: v } : i).sort((a, b) => a.value.localeCompare(b.value)));
      setEditId(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: number): Promise<void> => {
    setError('');
    try {
      await api.deleteLookup(category, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editId === id) setEditId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Card>
      <CardTitle sub={`${items.length} items`}>{title}</CardTitle>
      {error && <div style={{ marginBottom: tokens.space.sm }}><MessageBar kind="error">{error}</MessageBar></div>}

      <Field label="Search">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Filter ${title.toLowerCase()}...`}
        />
      </Field>

      <div style={{ marginTop: tokens.space.sm, maxHeight: 320, overflowY: 'auto', border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.sm }}>
        {loading && (
          <div style={{ padding: tokens.space.md, color: tokens.color.text, fontSize: tokens.font.small }}>Loading...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: tokens.space.md, color: tokens.color.text, fontSize: tokens.font.small, fontStyle: 'italic' }}>
            {search ? 'No matches.' : 'Empty. Add below.'}
          </div>
        )}
        {!loading && filtered.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: tokens.space.sm,
              padding: '6px 12px',
              borderBottom: idx < filtered.length - 1 ? `1px solid ${tokens.color.line}` : undefined,
              background: editId === item.id ? tokens.color.tint : (idx % 2 === 1 ? tokens.color.surfaceAlt : undefined),
            }}
          >
            {editId === item.id ? (
              <>
                <input
                  type="text"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void doRename(); if (e.key === 'Escape') setEditId(null); }}
                  autoFocus
                  style={{ flex: 1, padding: '4px 8px', fontSize: tokens.font.small, border: `1px solid ${tokens.color.blue}`, borderRadius: tokens.radius.sm, fontFamily: tokens.font.family, outline: 'none' }}
                />
                <GhostButton type="button" disabled={saving} onClick={() => void doRename()} style={{ padding: '4px 10px', fontSize: tokens.font.label }}>Save</GhostButton>
                <GhostButton type="button" onClick={() => setEditId(null)} style={{ padding: '4px 10px', fontSize: tokens.font.label }}>Cancel</GhostButton>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: tokens.font.small, color: tokens.color.ink }}>{item.value}</span>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  title="Rename"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.color.blue, fontSize: tokens.font.label, padding: '2px 6px', borderRadius: tokens.radius.sm }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete({ id: item.id, label: item.value })}
                  title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.color.danger, fontSize: tokens.font.label, padding: '2px 6px', borderRadius: tokens.radius.sm }}
                >
                  Del
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: tokens.space.sm, marginTop: tokens.space.sm }}>
        <TextInput
          value={addVal}
          onChange={(e) => setAddVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void doAdd(); }}
          placeholder={`Add new ${title.toLowerCase()}...`}
          style={{ flex: 1 }}
        />
        <PrimaryButton type="button" disabled={adding || !addVal.trim()} onClick={() => void doAdd()}>
          {adding ? 'Adding...' : 'Add'}
        </PrimaryButton>
      </div>
      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.label}"?`}
          onConfirm={() => { void doDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Card>
  );
};

type EditorItem = { id: number; email: string; name: string | null; jabatan: string | null };

interface IEditorsSectionProps {
  api: DamsApi;
}

const EditorsSection: React.FC<IEditorsSectionProps> = ({ api }) => {
  const [items, setItems] = React.useState<EditorItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [addEmail, setAddEmail] = React.useState('');
  const [addName, setAddName] = React.useState('');
  const [addJabatan, setAddJabatan] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editEmail, setEditEmail] = React.useState('');
  const [editName, setEditName] = React.useState('');
  const [editJabatan, setEditJabatan] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState<{ id: number; label: string } | null>(null);

  const load = (): void => {
    setLoading(true);
    api.getEditors().then((res) => {
      setItems(res || []);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load.');
      setLoading(false);
    });
  };

  React.useEffect(() => { load(); }, []);

  const filtered = search
    ? items.filter((i) => i.email.toLowerCase().includes(search.toLowerCase()) || (i.name || '').toLowerCase().includes(search.toLowerCase()))
    : items;

  const doAdd = async (): Promise<void> => {
    const email = addEmail.trim();
    if (!email) return;
    setAdding(true);
    setError('');
    try {
      const added = await api.addEditor(email, addName.trim(), addJabatan.trim());
      if (added) setItems((prev) => [...prev, added].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)));
      setAddEmail('');
      setAddName('');
      setAddJabatan('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: EditorItem): void => {
    setEditId(item.id);
    setEditEmail(item.email);
    setEditName(item.name || '');
    setEditJabatan(item.jabatan || '');
    setError('');
  };

  const doSave = async (): Promise<void> => {
    if (editId === null) return;
    const email = editEmail.trim();
    if (!email) return;
    setSaving(true);
    setError('');
    try {
      await api.renameEditor(editId, email, editName.trim(), editJabatan.trim());
      setItems((prev) => prev.map((i) => i.id === editId ? { ...i, email, name: editName.trim(), jabatan: editJabatan.trim() } : i));
      setEditId(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: number): Promise<void> => {
    setError('');
    try {
      await api.deleteEditor(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editId === id) setEditId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Card>
      <CardTitle sub={`${items.length} people`}>Editors</CardTitle>
      {error && <div style={{ marginBottom: tokens.space.sm }}><MessageBar kind="error">{error}</MessageBar></div>}

      <Field label="Search">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by email or name..."
        />
      </Field>

      <div style={{ marginTop: tokens.space.sm, maxHeight: 320, overflowY: 'auto', border: `1px solid ${tokens.color.line}`, borderRadius: tokens.radius.sm }}>
        {loading && (
          <div style={{ padding: tokens.space.md, color: tokens.color.text, fontSize: tokens.font.small }}>Loading...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: tokens.space.md, color: tokens.color.text, fontSize: tokens.font.small, fontStyle: 'italic' }}>
            {search ? 'No matches.' : 'Empty. Add below.'}
          </div>
        )}
        {!loading && filtered.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: tokens.space.sm,
              padding: '6px 12px',
              borderBottom: idx < filtered.length - 1 ? `1px solid ${tokens.color.line}` : undefined,
              background: editId === item.id ? tokens.color.tint : (idx % 2 === 1 ? tokens.color.surfaceAlt : undefined),
            }}
          >
            {editId === item.id ? (
              <>
                <input type="text" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email" style={{ flex: 2, padding: '4px 8px', fontSize: tokens.font.small, border: `1px solid ${tokens.color.blue}`, borderRadius: tokens.radius.sm, fontFamily: tokens.font.family, outline: 'none' }} />
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="name" style={{ flex: 2, padding: '4px 8px', fontSize: tokens.font.small, border: `1px solid ${tokens.color.blue}`, borderRadius: tokens.radius.sm, fontFamily: tokens.font.family, outline: 'none' }} />
                <input type="text" value={editJabatan} onChange={(e) => setEditJabatan(e.target.value)} placeholder="jabatan" style={{ flex: 2, padding: '4px 8px', fontSize: tokens.font.small, border: `1px solid ${tokens.color.blue}`, borderRadius: tokens.radius.sm, fontFamily: tokens.font.family, outline: 'none' }} />
                <GhostButton type="button" disabled={saving} onClick={() => void doSave()} style={{ padding: '4px 10px', fontSize: tokens.font.label }}>Save</GhostButton>
                <GhostButton type="button" onClick={() => setEditId(null)} style={{ padding: '4px 10px', fontSize: tokens.font.label }}>Cancel</GhostButton>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: tokens.font.small, color: tokens.color.ink }}>
                  {item.name || item.email}
                  {item.name && <span style={{ color: tokens.color.text }}> · {item.email}</span>}
                  {item.jabatan && <span style={{ color: tokens.color.text }}> · {item.jabatan}</span>}
                </span>
                <button type="button" onClick={() => startEdit(item)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.color.blue, fontSize: tokens.font.label, padding: '2px 6px', borderRadius: tokens.radius.sm }}>Edit</button>
                <button type="button" onClick={() => setConfirmDelete({ id: item.id, label: item.name || item.email })} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.color.danger, fontSize: tokens.font.label, padding: '2px 6px', borderRadius: tokens.radius.sm }}>Del</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: tokens.space.sm, marginTop: tokens.space.sm }}>
        <TextInput value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@binus.edu" style={{ flex: 2 }} />
        <TextInput value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Name (optional)" style={{ flex: 2 }} />
        <TextInput value={addJabatan} onChange={(e) => setAddJabatan(e.target.value)} placeholder="Jabatan (optional)" style={{ flex: 2 }} />
        <PrimaryButton type="button" disabled={adding || !addEmail.trim()} onClick={() => void doAdd()}>
          {adding ? 'Adding...' : 'Add'}
        </PrimaryButton>
      </div>
      {confirmDelete && (
        <ConfirmModal
          message={`Remove "${confirmDelete.label}" as editor?`}
          onConfirm={() => { void doDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Card>
  );
};

interface IDataTabProps {
  api: DamsApi;
}

export const DataTab: React.FC<IDataTabProps> = ({ api }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.space.lg }}>
      <LookupSection title="Kampus" category="kampus" api={api} />
      <LookupSection title="Fakultas" category="fakultas" api={api} />
      <LookupSection title="Jurusan" category="jurusan" api={api} />
      <div style={{ gridColumn: 'span 3 / span 3' }}>
        <EditorsSection api={api} />
      </div>
    </div>
  );
};
