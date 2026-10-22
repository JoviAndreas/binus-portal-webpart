import { AadHttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import {
  IMeInfo,
  IBinusianInfo,
  IEditorInfo,
  ISubmission,
  IStatusHistory,
  ISubmissionPatch,
  IBulkPatch,
  IListResult,
  IListFilter
} from './damsTypes';

export type SubmitResult =
  | { ok: true; codeNumber: string; linkDamsShare?: string; raw: unknown }
  | { ok: false; status: number; message: string };

export type BulkPatchResult = { updated: number; failed: { id: string; reason: string }[] };

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

  private async getJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
    const c = await this.getClient();
    const r: HttpClientResponse = await c.get(this.url(path), AadHttpClient.configurations.v1, { signal } as IHttpClientOptions);
    if (!r.ok) return null;
    return (await r.json()) as T;
  }

  public me(): Promise<IMeInfo | null> {
    return this.getJson<IMeInfo>('/Me');
  }

  public listEditors(): Promise<IEditorInfo[] | null> {
    return this.getJson<IEditorInfo[]>('/Editors');
  }

  public mySubmissions(email: string): Promise<ISubmission[] | null> {
    if (!email) return Promise.resolve(null);
    return this.getJson<ISubmission[]>(`/Submissions/me?email=${encodeURIComponent(email)}`);
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

  public searchDosens(q: string, signal?: AbortSignal): Promise<{ KodeDosen: string; Name: string | null; Email: string | null; Kampus: string | null; Fakultas: string | null; Jurusan: string | null; Count: number }[] | null> {
    return this.getJson(`/Submissions/dosens?q=${encodeURIComponent(q)}`, signal);
  }

  public getThumbs(ids: string[]): Promise<Record<string, Record<string, string>> | null> {
    return this.getJson(`/Submissions/thumbs?ids=${ids.map(encodeURIComponent).join(',')}`);
  }

  public searchMatakuliah(q: string, signal?: AbortSignal): Promise<{ KodeMatakuliah: string; NamaMatakuliah: string | null; RumpunIlmu: string | null; Count: number }[] | null> {
    return this.getJson(`/Submissions/matakuliah?q=${encodeURIComponent(q)}`, signal);
  }

  public async createTempUploadSession(fileName: string, videoIndex: number): Promise<import('./damsTypes').ITempUploadSessionResult | null> {
    const c = await this.getClient();
    const r = await c.post(
      this.url('/VideoSubmission/temp-upload-session'),
      AadHttpClient.configurations.v1,
      { body: JSON.stringify({ FileName: fileName, VideoIndex: videoIndex }) as unknown as string, headers: { 'Content-Type': 'application/json' } } as IHttpClientOptions
    );
    if (!r.ok) return null;
    return r.json() as Promise<import('./damsTypes').ITempUploadSessionResult>;
  }

  public async createUploadSession(data: import('./damsTypes').IUploadSessionRequest): Promise<import('./damsTypes').IUploadSessionResult | null> {
    const c = await this.getClient();
    const r = await c.post(
      this.url('/VideoSubmission/upload-session'),
      AadHttpClient.configurations.v1,
      { body: JSON.stringify(data) as unknown as string, headers: { 'Content-Type': 'application/json' } } as IHttpClientOptions
    );
    if (!r.ok) return null;
    return r.json() as Promise<import('./damsTypes').IUploadSessionResult>;
  }

  public async completeUpload(recordId: string): Promise<SubmitResult> {
    const c = await this.getClient();
    const r = await c.post(
      this.url(`/VideoSubmission/${recordId}/complete`),
      AadHttpClient.configurations.v1,
      {} as IHttpClientOptions
    );
    const text = await r.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch (e) { /* not json */ }
    if (!r.ok) return { ok: false, status: r.status, message: text || r.statusText };
    const obj = (parsed || {}) as Record<string, unknown>;
    return { ok: true, codeNumber: (obj.codeNumber || obj.CodeNumber || '') as string, raw: parsed };
  }

  private buildSubmissionQs(filter: IListFilter): URLSearchParams {
    const qs = new URLSearchParams();
    qs.set('assetType', filter.assetType || 'vbl');
    if (filter.status) qs.set('status', filter.status);
    if (filter.dosen) qs.set('dosen', filter.dosen);
    if (filter.kodeMK) qs.set('kodeMK', filter.kodeMK);
    if (filter.q) qs.set('q', filter.q);
    if (filter.fakultas) qs.set('fakultas', filter.fakultas);
    if (filter.jurusan) qs.set('jurusan', filter.jurusan);
    if (filter.pic) qs.set('pic', filter.pic);
    if (filter.assignedTo) qs.set('assignedTo', filter.assignedTo);
    if (filter.excludeStatus) qs.set('excludeStatus', 'true');
    if (filter.unassigned) qs.set('unassigned', 'true');
    if (filter.year) qs.set('year', String(filter.year));
    if (filter.sortDir) qs.set('sortDir', filter.sortDir);
    return qs;
  }

  public async listSubmissions(filter: IListFilter, signal?: AbortSignal): Promise<IListResult | null> {
    const qs = this.buildSubmissionQs(filter);
    qs.set('page', String(filter.page || 1));
    qs.set('pageSize', String(filter.pageSize || 50));
    return this.getJson<IListResult>(`/Submissions?${qs.toString()}`, signal);
  }

  public async exportExcel(filter: IListFilter): Promise<void> {
    const qs = this.buildSubmissionQs(filter);
    const c = await this.getClient();
    const r: HttpClientResponse = await c.get(this.url(`/Submissions/export?${qs.toString()}`), AadHttpClient.configurations.v1);
    if (!r.ok) throw new Error(`Export failed: ${r.status}`);
    const blob = await r.blob();
    const label = filter.year ? `submissions_${filter.year}` : 'submissions_all';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${label}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  public getSubmission(id: string): Promise<ISubmission | null> {
    return this.getJson<ISubmission>(`/Submissions/${encodeURIComponent(id)}`);
  }

  public getHistory(id: string): Promise<IStatusHistory[] | null> {
    return this.getJson<IStatusHistory[]>(`/Submissions/${encodeURIComponent(id)}/history`);
  }

  public async patchSubmission(id: string, patch: ISubmissionPatch): Promise<{ ok: true; data: ISubmission } | { ok: false; status: number; message: string }> {
    const c = await this.getClient();
    const opts: IHttpClientOptions = {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    };
    let r: HttpClientResponse;
    try {
      r = await c.fetch(this.url(`/Submissions/${encodeURIComponent(id)}`), AadHttpClient.configurations.v1, {
        ...opts,
        method: 'PATCH'
      });
    } catch (e) {
      return { ok: false, status: 0, message: 'Network error.' };
    }
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try {
        const body = await r.text();
        if (body) {
          try {
            const parsed = JSON.parse(body);
            msg = parsed.error || parsed.title || parsed.message || body.slice(0, 200);
          } catch {
            msg = body.slice(0, 200);
          }
        }
      } catch {
        /* ignore body read errors */
      }
      return { ok: false, status: r.status, message: msg };
    }
    try {
      const data = (await r.json()) as ISubmission;
      return { ok: true, data };
    } catch (e) {
      return { ok: false, status: r.status, message: 'Bad response body.' };
    }
  }

  public async bulkPatch(body: IBulkPatch): Promise<BulkPatchResult | null> {
    const c = await this.getClient();
    const opts: IHttpClientOptions = {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Ids: body.ids, Patch: body.patch })
    };
    const r = await c.fetch(this.url('/Submissions/bulk'), AadHttpClient.configurations.v1, {
      ...opts,
      method: 'PATCH'
    });
    if (!r.ok) return null;
    return (await r.json()) as BulkPatchResult;
  }

  public async getLookup(category: string): Promise<{ id: number; value: string; sortOrder: number }[] | null> {
    const res = await this.getJson<{ Id: number; Value: string; SortOrder: number }[]>(`/Lookup/${encodeURIComponent(category)}`);
    if (!res) return null;
    return res.map((r) => ({ id: r.Id, value: r.Value, sortOrder: r.SortOrder }));
  }

  public async addLookup(category: string, value: string): Promise<{ id: number; value: string } | null> {
    const c = await this.getClient();
    const r = await c.fetch(this.url(`/Lookup/${encodeURIComponent(category)}`), AadHttpClient.configurations.v1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || `Add failed: ${r.status}`);
    }
    const added = await r.json() as { Id: number; Value: string };
    return { id: added.Id, value: added.Value };
  }

  public async renameLookup(category: string, id: number, value: string): Promise<void> {
    const c = await this.getClient();
    const r = await c.fetch(this.url(`/Lookup/${encodeURIComponent(category)}/${id}`), AadHttpClient.configurations.v1, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || `Rename failed: ${r.status}`);
    }
  }

  public async deleteLookup(category: string, id: number): Promise<void> {
    const c = await this.getClient();
    const r = await c.fetch(this.url(`/Lookup/${encodeURIComponent(category)}/${id}`), AadHttpClient.configurations.v1, {
      method: 'DELETE',
    });
    if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
  }

  public async getEditors(): Promise<{ id: number; email: string; name: string | null; jabatan: string | null; isAdmin: boolean }[] | null> {
    const res = await this.getJson<{ Id: number; Email: string; Name: string | null; Jabatan: string | null; IsAdmin: boolean }[]>('/Editors');
    if (!res) return null;
    return res.map((r) => ({ id: r.Id, email: r.Email, name: r.Name, jabatan: r.Jabatan, isAdmin: r.IsAdmin }));
  }

  public async addEditor(email: string, name: string, jabatan: string, isAdmin: boolean): Promise<{ id: number; email: string; name: string | null; jabatan: string | null; isAdmin: boolean } | null> {
    const c = await this.getClient();
    const r = await c.fetch(this.url('/Editors'), AadHttpClient.configurations.v1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, jabatan, isAdmin }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || `Add failed: ${r.status}`);
    }
    const added = await r.json() as { Id: number; Email: string; Name: string | null; Jabatan: string | null; IsAdmin: boolean };
    return { id: added.Id, email: added.Email, name: added.Name, jabatan: added.Jabatan, isAdmin: added.IsAdmin };
  }

  public async renameEditor(id: number, email: string, name: string, jabatan: string, isAdmin: boolean): Promise<void> {
    const c = await this.getClient();
    const r = await c.fetch(this.url(`/Editors/${id}`), AadHttpClient.configurations.v1, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, jabatan, isAdmin }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || `Update failed: ${r.status}`);
    }
  }

  public async deleteEditor(id: number): Promise<void> {
    const c = await this.getClient();
    const r = await c.fetch(this.url(`/Editors/${id}`), AadHttpClient.configurations.v1, {
      method: 'DELETE',
    });
    if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
  }
}
