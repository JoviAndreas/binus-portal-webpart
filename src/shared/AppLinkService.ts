import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IAppLink } from './types';
import { categorize, dedupKey, normalizeUrl } from './categorize';
import { ICategoriesConfig } from './categoriesConfig';

interface ISpAppLinkRaw {
  Id: number;
  Title: string;
  URL: { Url: string; Description?: string };
  Thumbnail?: string;
}

const DEAD_HOSTS = /yammer\.com/i;

export class AppLinkService {
  public static async load(
    client: SPHttpClient,
    webUrl: string,
    listTitle: string,
    config: ICategoriesConfig
  ): Promise<IAppLink[]> {
    const url =
      `${webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')` +
      `/items?$select=Id,Title,URL,Thumbnail&$top=500`;
    const res: SPHttpClientResponse = await client.get(url, SPHttpClient.configurations.v1, {
      headers: { Accept: 'application/json;odata=nometadata' }
    });
    if (!res.ok) throw new Error(`SP list fetch failed: ${res.status}`);
    const data = await res.json();
    const raw: ISpAppLinkRaw[] = data.value || [];
    const seen = new Set<string>();
    const out: IAppLink[] = [];
    for (const r of raw) {
      const link = r.URL?.Url;
      if (!link) continue;
      if (DEAD_HOSTS.test(link)) continue;
      const url2 = normalizeUrl(link);
      const k = dedupKey({ url: url2, title: r.Title });
      if (seen.has(k)) continue;
      seen.add(k);
      let thumb: string | undefined;
      if (r.Thumbnail) {
        try {
          const t = JSON.parse(r.Thumbnail as unknown as string);
          if (t?.serverRelativeUrl) thumb = `${webUrl.replace(/\/$/, '')}${t.serverRelativeUrl}`;
        } catch {
          /* ignore */
        }
      }
      out.push({
        id: r.Id,
        title: r.Title?.trim() || link,
        url: url2,
        thumbnail: thumb,
        category: categorize(r.Title || '', url2, config)
      });
    }
    out.sort((a, b) => a.category.label.localeCompare(b.category.label) || a.title.localeCompare(b.title));
    return out;
  }
}
