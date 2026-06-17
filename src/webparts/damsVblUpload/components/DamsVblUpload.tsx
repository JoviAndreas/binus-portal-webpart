import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { DamsStyles, HeaderBar } from '../../../shared/DamsUi';
import { DamsApi } from '../../../shared/damsApi';
import { IMeInfo } from '../../../shared/damsTypes';
import { mapCampus, fuzzyPick } from '../../../shared/sanitize';
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
        <HeaderBar title="Upload Video" />
        <div style={{ padding: '24px 24px 28px' }}>
          {loading && <p style={{ color: tokens.color.text }}>Loading...</p>}
          {!loading && error && (
            <div
              style={{
                padding: '12px 16px',
                background: '#FBECEC',
                color: '#C2362B',
                borderLeft: '3px solid #C2362B',
                borderRadius: `0 ${tokens.radius.sm} ${tokens.radius.sm} 0`
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && autofill && (
            <BatchUploadForm
              api={api}
              initial={autofill}
              campuses={campuses}
              faculties={faculties}
              departments={departments}
            />
          )}
        </div>
      </div>
    </div>
  );
};
