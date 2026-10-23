// Resumable-session upload straight to SharePoint/OneDrive. Chunks must be a multiple of 320 KiB.
const CHUNK = 10 * 327680; // 3.1 MiB: fine-grained progress, still few requests

export interface IUploadProgress {
  loaded: number;
  total: number;
  speedBps: number;
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function uploadChunked(
  file: File,
  uploadUrl: string,
  onProgress: (p: IUploadProgress) => void,
  signal: AbortSignal
): Promise<void> {
  const total = file.size;
  let start = 0;
  const speeds: number[] = [];

  const cancelSession = (): void => {
    fetch(uploadUrl, { method: 'DELETE' }).catch(() => undefined);
  };

  while (start < total) {
    const end = Math.min(start + CHUNK, total) - 1;
    const slice = file.slice(start, end + 1);
    const t0 = performance.now();
    let done = false;

    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      if (signal.aborted) { cancelSession(); throw new DOMException('Upload cancelled', 'AbortError'); }
      try {
        const resp = await fetch(uploadUrl, {
          method: 'PUT',
          body: slice,
          headers: { 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(slice.size) },
          signal
        });
        if (resp.status === 200 || resp.status === 201 || resp.status === 202) { done = true; break; }
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) throw new Error(`Upload rejected (HTTP ${resp.status}).`);
      } catch (e) {
        if ((e as Error).name === 'AbortError') { cancelSession(); throw e; }
        if (attempt === 2) throw e;
      }
      await wait(800 * (attempt + 1));
    }
    if (!done) throw new Error('Chunk failed after retries.');

    const dt = (performance.now() - t0) / 1000;
    if (dt > 0) {
      speeds.push(slice.size / dt);
      if (speeds.length > 5) speeds.shift();
    }
    start = end + 1;
    onProgress({ loaded: start, total, speedBps: speeds.length ? speeds.reduce((a, b) => a + b) / speeds.length : 0 });
  }
}
