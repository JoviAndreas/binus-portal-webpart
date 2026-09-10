import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { IMeInfo, IEditorInfo, IAutofill } from '../../../shared/damsTypes';
import { MessageBar, DamsStyles, PillTabs } from '../../../shared/DamsUi';
import { mapCampus, fuzzyPick } from '../../../shared/sanitize';
import { SubmissionTable } from './SubmissionTable';
import { SubmissionEditor } from './SubmissionEditor';
import { DataTab } from './DataTab';
import { BatchUploadForm } from './BatchUploadForm';

export interface IDamsVblAdminProps {
  apiBaseUrl: string;
  apiResourceUri: string;
  aadClientFactory: { getClient: (resource: string) => Promise<AadHttpClient> };
  links?: { label: string; url: string }[];
}

type Tab = 'review' | 'upload' | 'data';

const TAB_LABELS: Record<Tab, string> = { review: 'Review', upload: 'Upload', data: 'Data' };

function roleLabel(me: IMeInfo): { text: string; bg: string; fg: string } {
  if (me.IsAdmin)  return { text: 'Admin',  bg: '#FEE9D1', fg: '#9A4800' };
  if (me.IsEditor) return { text: 'Editor', bg: tokens.color.tint, fg: tokens.color.blueDark };
  return                  { text: 'Viewer', bg: tokens.color.bgSoft, fg: tokens.color.text };
}

export const DamsVblAdmin: React.FC<IDamsVblAdminProps> = ({ apiBaseUrl, apiResourceUri, aadClientFactory, links = [] }) => {
  const api = React.useMemo(() => new DamsApi(aadClientFactory, apiResourceUri, apiBaseUrl), [
    aadClientFactory,
    apiResourceUri,
    apiBaseUrl
  ]);

  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState<IMeInfo | null>(null);
  const [editors, setEditors] = React.useState<IEditorInfo[]>([]);
  const [campuses, setCampuses] = React.useState<string[]>([]);
  const [faculties, setFaculties] = React.useState<string[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [autofill, setAutofill] = React.useState<IAutofill | null>(null);
  const [error, setError] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const getInitialTab = (): Tab => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    return t === 'upload' ? 'upload' : 'review';
  };
  const [tab, setTab] = React.useState<Tab>(getInitialTab);
  const [total, setTotal] = React.useState(0);

  const [lookupLoaded, setLookupLoaded] = React.useState(false);

  // Load me + editors on mount (needed for all tabs)
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [m, edList] = await Promise.all([api.me(), api.listEditors()]);
        if (!active) return;
        setMe(m);
        setEditors(edList || []);

        const isPrivileged = !!(m && (m.IsAdmin || m.IsEditor));
        const qsTab = new URLSearchParams(window.location.search).get('tab') as Tab | null;
        if (!qsTab) setTab(isPrivileged ? 'review' : 'upload');

        // Seed autofill with just email/name; campus/faculty/jurusan filled later
        setAutofill({
          found: false,
          email: (m && m.Email) || '',
          name: (m && m.Name) || '',
          kodeDosen: '', kampus: 'Jakarta', fakultas: '', jurusan: ''
        });
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })().catch(() => { /* handled */ });
    return () => { active = false; };
  }, [api]);

  // Load campus/faculty/jurusan only when upload tab is first shown
  React.useEffect(() => {
    if (tab !== 'upload' || lookupLoaded) return;
    let active = true;
    (async () => {
      try {
        const [camp, fac, dep] = await Promise.all([
          api.getCampuses(), api.getFaculties(), api.getDepartments()
        ]);
        if (!active) return;
        setCampuses(camp);
        setFaculties(fac);
        setDepartments(dep);
        setLookupLoaded(true);

        // Enrich autofill with binusian lookup now that we have fac/dep
        setAutofill((prev) => {
          if (!prev || !prev.email) return prev;
          // trigger async enrichment
          api.lookupBinusian(prev.email).then((b) => {
            if (!b || !active) return;
            setAutofill({
              found: true,
              email: b.Email || prev.email,
              name: b.Name || prev.name || '',
              kodeDosen: b.KodeDosen || '',
              kampus: mapCampus(b.Campus),
              fakultas: fuzzyPick(b.AcadGroupDesc || '', fac) || '',
              jurusan: fuzzyPick(b.AcadOrgDesc || '', dep) || ''
            });
          }).catch(() => { /* ignore */ });
          return prev;
        });
      } catch {
        /* non-fatal: dropdowns fall back to defaults */
      }
    })().catch(() => { /* handled */ });
    return () => { active = false; };
  }, [tab, lookupLoaded, api]);

  const hasAccess = !!me;
  const role = me ? roleLabel(me) : null;

  return (
    <div className="dams-scope" style={{ fontFamily: tokens.font.family, color: tokens.color.text, background: 'transparent', padding: '20px 24px' }}>
      <DamsStyles />
      <div style={{ background: 'transparent' }}>
        {/* Compact appbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 14px',
          border: `1px solid ${tokens.color.line}`,
          borderRadius: tokens.radius.card,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(43,43,43,.08)',
          fontFamily: tokens.font.family,
          flexWrap: 'wrap',
          marginBottom: 16
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${tokens.color.blue}, ${tokens.color.blueDark})`,
              color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 14
            }}>
              &#9654;
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: tokens.color.ink }}>DAMS VBL</span>
          </div>

          {/* Pill tabs */}
          <PillTabs<Tab>
            tabs={(Object.keys(TAB_LABELS) as Tab[])
              .filter((t) => t !== 'data' || !!(me && me.IsAdmin))
              .map((t) => ({ value: t, label: TAB_LABELS[t] }))}
            value={tab}
            onChange={(v) => {
              setTab(v);
              const params = new URLSearchParams(window.location.search);
              params.set('tab', v);
              history.replaceState(null, '', '?' + params.toString());
            }}
          />

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Submission count - only on review tab */}
            {tab === 'review' && total > 0 && (
              <span style={{
                fontSize: tokens.font.label,
                color: tokens.color.text,
                paddingRight: 12,
                borderRight: `1px solid ${tokens.color.line}`
              }}>
                <strong style={{ color: tokens.color.ink, fontSize: tokens.font.small }}>{total.toLocaleString()}</strong> submissions
              </span>
            )}

            {/* Quick links */}
            {links.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: `1px solid ${tokens.color.line}` }}>
                {links.map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); window.open(l.url, '_blank', 'noopener,noreferrer'); e.preventDefault(); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: tokens.font.label,
                      fontWeight: 600,
                      color: tokens.color.blueDark,
                      textDecoration: 'none',
                      padding: '3px 8px',
                      borderRadius: tokens.radius.pill,
                      border: `1px solid ${tokens.color.tintBorder}`,
                      background: tokens.color.tint,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {l.label}
                  </a>
                ))}
              </div>
            )}

            {/* Role badge */}
            {role && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: tokens.radius.pill,
                background: role.bg,
                color: role.fg,
                whiteSpace: 'nowrap'
              }}>
                {role.text}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '0 0 28px' }}>
          {loading && <p style={{ color: tokens.color.text }}>Loading...</p>}

          {!loading && (error || !hasAccess) && (
            <MessageBar kind="error">
              No access. {me && me.Email ? `Signed in as ${me.Email}.` : ''} Contact the DAMS administrator.
            </MessageBar>
          )}

          {!loading && hasAccess && me && tab === 'review' && (
            <>
              <SubmissionTable
                api={api}
                reloadToken={reloadToken}
                onOpenDrawer={(id) => setEditingId(id)}
                me={me}
                editors={editors}
                onTotalChange={setTotal}
              />
              {editingId && (
                <SubmissionEditor
                  api={api}
                  id={editingId}
                  canEdit={!!(me.IsAdmin || me.IsEditor)}
                  onClose={() => setEditingId(null)}
                  onSaved={() => setReloadToken((t) => t + 1)}
                />
              )}
            </>
          )}

          {!loading && hasAccess && tab === 'upload' && autofill && (
            <BatchUploadForm
              api={api}
              initial={autofill}
              campuses={campuses}
              faculties={faculties}
              departments={departments}
            />
          )}

          {!loading && hasAccess && me && me.IsAdmin && tab === 'data' && (
            <DataTab api={api} />
          )}
        </div>
      </div>
    </div>
  );
};
