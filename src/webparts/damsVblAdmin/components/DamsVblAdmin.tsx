import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { BinusLogo } from '../../../shared/BinusLogo';
import { DamsApi } from '../../../shared/damsApi';
import { IMeInfo } from '../../../shared/damsTypes';
import { MessageBar } from '../../../shared/DamsUi';
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
      className="bp-root"
      style={{
        fontFamily: tokens.font.family,
        color: tokens.color.text,
        background: tokens.color.bgSoft,
        padding: tokens.space.lg,
        borderRadius: tokens.radius.lg
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.space.md,
          marginBottom: tokens.space.lg
        }}
      >
        <div>
          <p
            style={{
              fontSize: tokens.font.small,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: tokens.color.orange,
              margin: 0
            }}
          >
            DAMS - Video Based Learning
          </p>
          <h1 style={{ fontSize: tokens.font.h1, color: tokens.color.textDark, margin: '4px 0 0' }}>Admin Review</h1>
        </div>
        <BinusLogo height={36} />
      </header>

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
  );
};
