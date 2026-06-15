import { AadHttpClient, HttpClientResponse } from '@microsoft/sp-http';

export interface ISearchHit {
  binusianId?: string;
  nama?: string;
  namaDep?: string;
  nip?: string;
  weight?: number;
  email?: string;
  leadBinusianId?: string;
  leadEmail?: string;
  [k: string]: unknown;
}

export interface IEmployeeDto {
  binusianId?: string;
  email?: string;
  name?: string;
  position?: string;
  department?: string;
  businessUnit?: string;
  jobBand?: string;
  leadBinusianId?: string;
  leadEmail?: string;
  businessUnitGroup?: string;
  departmentGroup?: string;
  subBusinessUnit?: string;
  lokasiKerja?: string;
}

export interface ISnapshotEntry {
  id: string;
  nip: string;
  name: string;
  email: string;
  dep: string;
  role: string;
}

export interface IEmployeeDetail { [k: string]: unknown }
export interface IEmployeeTraining { [k: string]: unknown }
export interface IResearchPaper { [k: string]: unknown }

export class BinusPagesApi {
  private clientPromise: Promise<AadHttpClient> | null = null;

  constructor(
    private factory: { getClient: (resource: string) => Promise<AadHttpClient> },
    private resource: string,
    private apiBase: string
  ) {}

  private getClient(): Promise<AadHttpClient> {
    if (!this.clientPromise) this.clientPromise = this.factory.getClient(this.resource);
    return this.clientPromise;
  }

  private async getJson<T>(path: string): Promise<T | null> {
    const url = `${this.apiBase.replace(/\/$/, '')}${path}`;
    const c = await this.getClient();
    const r: HttpClientResponse = await c.get(url, AadHttpClient.configurations.v1);
    if (!r.ok) return null;
    return (await r.json()) as T;
  }

  search(q: string): Promise<ISearchHit[] | null> {
    return this.getJson<ISearchHit[]>(`/Search?search=${encodeURIComponent(q)}`);
  }

  snapshot(): Promise<ISnapshotEntry[] | null> {
    return this.getJson<ISnapshotEntry[]>(`/Search/snapshot`);
  }

  warm(): Promise<unknown> {
    return this.getJson<unknown>(`/Search?search=`).catch(() => null);
  }

  popular(limit = 50): Promise<ISnapshotEntry[] | null> {
    return this.getJson<ISnapshotEntry[]>(`/Search/popular?limit=${limit}`);
  }

  async click(binusianId: string): Promise<void> {
    if (!binusianId) return;
    try {
      const url = `${this.apiBase.replace(/\/$/, '')}/Search/click`;
      const c = await this.getClient();
      await c.post(url, AadHttpClient.configurations.v1, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binusianId })
      });
    } catch { /* silent */ }
  }

  searchAdvanced(p: {
    keyword1: string;
    keyword2?: string;
    conditional?: string;
    category1?: string;
    category2?: string;
  }): Promise<ISearchHit[] | null> {
    const qs = new URLSearchParams({
      keyword1: p.keyword1,
      keyword2: p.keyword2 || '',
      conditional: p.conditional || '',
      category1: p.category1 || '',
      category2: p.category2 || ''
    }).toString();
    return this.getJson<ISearchHit[]>(`/Search/advanced?${qs}`);
  }

  detail(binusianid: string, nip: string): Promise<IEmployeeDetail[] | null> {
    return this.getJson<IEmployeeDetail[]>(
      `/EmployeeDetail?binusianid=${encodeURIComponent(binusianid)}&nip=${encodeURIComponent(nip)}`
    );
  }

  trainings(binusianid: string, nip: string): Promise<IEmployeeTraining[] | null> {
    return this.getJson<IEmployeeTraining[]>(
      `/EmployeeTrainings?binusianid=${encodeURIComponent(binusianid)}&nip=${encodeURIComponent(nip)}`
    );
  }

  researchPapers(kdDosen: string): Promise<IResearchPaper[] | null> {
    if (!kdDosen) return Promise.resolve(null);
    return this.getJson<IResearchPaper[]>(`/ResearchPapers/${encodeURIComponent(kdDosen)}`);
  }
}
