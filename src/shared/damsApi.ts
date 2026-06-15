import { AadHttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import {
  IMeInfo,
  IBinusianInfo,
  ISubmission,
  IStatusHistory,
  ISubmissionPatch,
  IListResult,
  IListFilter
} from './damsTypes';

export type SubmitResult =
  | { ok: true; codeNumber: string; linkDamsShare?: string; raw: unknown }
  | { ok: false; status: number; message: string };

// AadHttpClient wrapper for the DAMS API. One factory client, lazily acquired.
export class DamsApi {
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

  private url(path: string): string {
    return `${this.apiBase.replace(/\/$/, '')}${path}`;
  }

  private async getJson<T>(path: string): Promise<T | null> {
    const c = await this.getClient();
    const r: HttpClientResponse = await c.get(this.url(path), AadHttpClient.configurations.v1);
    if (!r.ok) return null;
    return (await r.json()) as T;
  }

  public me(): Promise<IMeInfo | null> {
    return this.getJson<IMeInfo>('/Me');
  }

  public lookupBinusian(q: string): Promise<IBinusianInfo | null> {
    if (!q) return Promise.resolve(null);
    return this.getJson<IBinusianInfo>(`/Binusian?q=${encodeURIComponent(q)}`);
  }

  public async getCampuses(): Promise<string[]> {
    const data = await this.getJson<string[]>('/VideoSubmission/Campuses');
    return data || ['Jakarta', 'Senayan', 'BiOn', 'Malang', 'Bandung', 'Semarang', 'Medan'];
  }

  public async getFaculties(): Promise<string[]> {
    const data = await this.getJson<string[]>('/VideoSubmission/Faculties');
    return data || [];
  }

  public async getDepartments(): Promise<string[]> {
    const data = await this.getJson<string[]>('/VideoSubmission/Departments');
    return data || [];
  }

  public async submitVideo(form: FormData): Promise<SubmitResult> {
    const c = await this.getClient();
    // Do not set Content-Type: the browser adds the multipart boundary.
    const opts: IHttpClientOptions = { body: form as unknown as string };
    const r = await c.post(this.url('/VideoSubmission'), AadHttpClient.configurations.v1, opts);
    const text = await r.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch (e) { /* not json */ }
    if (!r.ok) {
      return {
        ok: false,
        status: r.status,
        message: typeof parsed === 'string' ? parsed : (text || r.statusText)
      };
    }
    const obj = (parsed || {}) as Record<string, unknown>;
    const codeNumber = (obj.codeNumber || obj.CodeNumber || '') as string;
    const linkDamsShare = (obj.linkDamsShare || obj.LinkDamsShare) as string | undefined;
    return { ok: true, codeNumber, linkDamsShare, raw: parsed };
  }

  public async listSubmissions(filter: IListFilter): Promise<IListResult | null> {
    const qs = new URLSearchParams();
    if (filter.status) qs.set('status', filter.status);
    if (filter.dosen) qs.set('dosen', filter.dosen);
    if (filter.kodeMK) qs.set('kodeMK', filter.kodeMK);
    if (filter.q) qs.set('q', filter.q);
    qs.set('page', String(filter.page || 1));
    qs.set('pageSize', String(filter.pageSize || 50));
    return this.getJson<IListResult>(`/Submissions?${qs.toString()}`);
  }

  public getSubmission(id: string): Promise<ISubmission | null> {
    return this.getJson<ISubmission>(`/Submissions/${encodeURIComponent(id)}`);
  }

  public getHistory(id: string): Promise<IStatusHistory[] | null> {
    return this.getJson<IStatusHistory[]>(`/Submissions/${encodeURIComponent(id)}/history`);
  }

  public async patchSubmission(id: string, patch: ISubmissionPatch): Promise<ISubmission | null> {
    const c = await this.getClient();
    const opts: IHttpClientOptions = {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    };
    const r = await c.fetch(this.url(`/Submissions/${encodeURIComponent(id)}`), AadHttpClient.configurations.v1, {
      ...opts,
      method: 'PATCH'
    });
    if (!r.ok) return null;
    return (await r.json()) as ISubmission;
  }
}
