import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { BinusLogo } from '../../../shared/BinusLogo';
import { DamsApi } from '../../../shared/damsApi';
import { IMeInfo } from '../../../shared/damsTypes';
import { mapCampus, fuzzyPick } from '../../../shared/sanitize';
import { UploadForm } from './UploadForm';
import { BatchUploadForm } from './BatchUploadForm';

export interface IDamsVblUploadProps {
  apiBaseUrl: string;
  apiResourceUri: string;
  aadClientFactory: { getClient: (resource: string) => Promise<AadHttpClient> };
}

export interface IAutofill {
  found: boolean;
  email: string;
  name: string;
  kodeDosen: string;
  kampus: string;
  fakultas: string;
  jurusan: string;
}

type Mode = 'single' | 'batch';

export const DamsVblUpload: React.FC<IDamsVblUploadProps> = ({ apiBaseUrl, apiResourceUri, aadClientFactory }) => {
  const api = React.useMemo(() => new DamsApi(aadClientFactory, apiResourceUri, apiBaseUrl), [
    aadClientFactory,
    apiResourceUri,
    apiBaseUrl
  ]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [me, setMe] = React.useState<IMeInfo | null>(null);
  const [campuses, setCampuses] = React.useState<string[]>([]);
  const [faculties, setFaculties] = React.useState<string[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [autofill, setAutofill] = React.useState<IAutofill | null>(null);
  const [mode, setMode] = React.useState<Mode>('single');

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [meInfo, camp, fac, dep] = await Promise.all([
          api.me(),
          api.getCampuses(),
          api.getFaculties(),
          api.getDepartments()
        ]);
        if (!active) return;
        setMe(meInfo);
        setCampuses(camp);
        setFaculties(fac);
        setDepartments(dep);

        let af: IAutofill = {
          found: false,
          email: (meInfo && meInfo.email) || '',
          name: (meInfo && meInfo.name) || '',
          kodeDosen: '',
          kampus: 'Jakarta',
          fakultas: '',
          jurusan: ''
        };
        if (meInfo && meInfo.email) {
          const b = await api.lookupBinusian(meInfo.email);
          if (b) {
            af = {
              found: true,
              email: b.Email || meInfo.email,
              name: b.Name || meInfo.name || '',
              kodeDosen: b.KodeDosen || '',
              kampus: mapCampus(b.Campus),
              fakultas: fuzzyPick(b.AcadGroupDesc || '', fac) || '',
              jurusan: fuzzyPick(b.AcadOrgDesc || '', dep) || ''
            };
          }
        }
        if (active) setAutofill(af);
      } catch (e) {
        if (active) setError('Failed to load. Make sure you are signed in and have access to the DAMS API.');
      } finally {
        if (active) setLoading(false);
      }
    })().catch(() => { /* handled */ });
    return () => {
      active = false;
    };
  }, [api]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    fontFamily: tokens.font.family,
    fontSize: tokens.font.body,
    fontWeight: 600,
    color: active ? '#fff' : tokens.color.blueDark,
    background: active ? tokens.color.blue : 'transparent',
    border: `1px solid ${active ? tokens.color.blue : tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    cursor: 'pointer'
  });

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
          <h1 style={{ fontSize: tokens.font.h1, color: tokens.color.textDark, margin: '4px 0 0' }}>Upload Video</h1>
        </div>
        <BinusLogo height={36} />
      </header>

      {loading && <p style={{ color: tokens.color.text }}>Loading...</p>}
      {!loading && error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FBECEC',
            color: '#C2362B',
            borderRadius: tokens.radius.sm
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && autofill && (
        <>
          <div style={{ display: 'flex', gap: tokens.space.sm, marginBottom: tokens.space.lg }}>
            <button type="button" style={tabStyle(mode === 'single')} onClick={() => setMode('single')}>
              Single upload
            </button>
            <button type="button" style={tabStyle(mode === 'batch')} onClick={() => setMode('batch')}>
              Batch upload
            </button>
          </div>

          {mode === 'single' ? (
            <UploadForm
              api={api}
              initial={autofill}
              campuses={campuses}
              faculties={faculties}
              departments={departments}
            />
          ) : (
            <BatchUploadForm
              api={api}
              initial={autofill}
              campuses={campuses}
              faculties={faculties}
              departments={departments}
            />
          )}
        </>
      )}
    </div>
  );
};
