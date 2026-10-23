// Makes the four review frames (bumper at 2s, then 25/50/75%) in the browser from a local video file,
// the same frames the backend serves for the Review table preview.
const FRAME_WIDTH = 320;
const JPEG_QUALITY = 0.55;

export const FRAME_KEYS = ['b', '25', '50', '75'] as const;

const once = (el: HTMLElement, ok: string, ms: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = window.setTimeout(() => { cleanup(); reject(new Error(`Timed out waiting for video ${ok}.`)); }, ms);
    const onOk = (): void => { cleanup(); resolve(); };
    const onErr = (): void => { cleanup(); reject(new Error('This browser cannot decode the video.')); };
    const cleanup = (): void => {
      window.clearTimeout(t);
      el.removeEventListener(ok, onOk);
      el.removeEventListener('error', onErr);
    };
    el.addEventListener(ok, onOk);
    el.addEventListener('error', onErr);
  });

export async function extractFrames(
  file: File,
  onFrame?: (done: number, total: number) => void
): Promise<Record<string, Blob>> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'auto';
  video.playsInline = true;
  video.src = url;
  try {
    await once(video, 'loadedmetadata', 20000);
    const dur = video.duration;
    if (!isFinite(dur) || dur <= 0 || !video.videoWidth) throw new Error('Could not read the video length.');

    const times: Record<string, number> = {
      b: Math.min(2, dur * 0.25),
      '25': dur * 0.25,
      '50': dur * 0.5,
      '75': dur * 0.75
    };
    const w = FRAME_WIDTH;
    const h = Math.max(2, Math.round((FRAME_WIDTH * video.videoHeight) / video.videoWidth / 2) * 2);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');

    const out: Record<string, Blob> = {};
    let n = 0;
    for (const key of FRAME_KEYS) {
      video.currentTime = times[key];
      await once(video, 'seeked', 20000);
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', JPEG_QUALITY));
      if (!blob || blob.size === 0) throw new Error('Could not encode a frame.');
      out[key] = blob;
      n += 1;
      if (onFrame) onFrame(n, FRAME_KEYS.length);
    }
    return out;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
