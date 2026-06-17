import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { IMeInfo, IEditorInfo } from '../../../shared/damsTypes';
import { MessageBar, DamsStyles, HeaderBar } from '../../../shared/DamsUi';
import { SubmissionTable } from './SubmissionTable';
import { SubmissionEditor } from './SubmissionEditor';

export interface IDamsVblAdminProps {
  apiBaseUrl: string;
  apiResourceUri: string;
  aadClientFactory: { getClient: (resource: string) => Promise<AadHttpClient> };
}

export const DamsVblAdmin: React.FC<IDamsVblAdminProps> = ({ apiBaseUrl, apiResourceUri, aadClientFactory }) => {
  const api = React.useMemo(() => new DamsApi(aadClientFactory, apiResourceUri, apiBaseUrl), [
    aadClientFactory,
    apiResourceUri,
    apiBaseUrl
  ]);

  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState<IMeInfo | null>(null);
  const [editors, setEditors] = React.useState<IEditorInfo[]>([]);
  const [error, setError] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.me(), api.listEditors()]).then(([m, edList]) => {
      if (!active) return;
      setMe(m);
      setEditors(edList || []);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError(true);
      setLoading(false);
    });
    return () => { active = false; };
  }, [api]);

  const hasAccess = me && (me.IsAdmin || me.IsEditor);

  return (
    <div
      className="dams-scope"
      style={{
        fontFamily: tokens.font.family,
        color: tokens.color.text,
        background: 'transparent'
      }}
    >
      <DamsStyles />
      <div style={{ background: 'transparent' }}>
        <HeaderBar title="DAMS Review" />
        <div style={{ padding: '24px 24px 28px' }}>
          {loading && <p style={{ color: tokens.color.text }}>Loading...</p>}

          {!loading && (error || !hasAccess) && (
            <MessageBar kind="error">
              No access. {me && me.Email ? `Signed in as ${me.Email}.` : ''} Contact the DAMS administrator.
            </MessageBar>
          )}

          {!loading && hasAccess && me && (
            <>
              <SubmissionTable
                api={api}
                reloadToken={reloadToken}
                onOpenDrawer={(id) => setEditingId(id)}
                me={me}
                editors={editors}
              />
              {editingId && (
                <SubmissionEditor
                  api={api}
                  id={editingId}
                  onClose={() => setEditingId(null)}
                  onSaved={() => setReloadToken((t) => t + 1)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
