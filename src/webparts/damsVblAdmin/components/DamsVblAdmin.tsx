import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { IMeInfo } from '../../../shared/damsTypes';
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
  const [error, setError] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    api.me().then((m) => {
      if (!active) return;
      setMe(m);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError(true);
      setLoading(false);
    });
    return () => { active = false; };
  }, [api]);

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
      <div
        style={{
          background: 'transparent'
        }}
      >
        <HeaderBar title="Admin Review" />
        <div style={{ padding: '24px 24px 28px' }}>
          {loading && <p style={{ color: tokens.color.text }}>Loading...</p>}

          {!loading && (error || !me || !me.isAdmin) && (
            <MessageBar kind="error">
              No admin access. {me && me.email ? `Signed in as ${me.email}.` : ''} Contact the DAMS administrator to be added to the allowlist.
            </MessageBar>
          )}

          {!loading && me && me.isAdmin && (
            <>
              <SubmissionTable api={api} reloadToken={reloadToken} onRowClick={(id) => setEditingId(id)} />
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
