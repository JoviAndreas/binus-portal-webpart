// Client-side file checks for upload and replace. The backend enforces the same rules.
export const NEW_UPLOAD_EXT = ['mp4'];
export const REPLACE_EXT = ['mp4', 'mov', 'm4v', 'webm', 'mkv'];

export const extOf = (name: string): string => {
  const m = /\.([A-Za-z0-9]+)$/.exec(name.trim());
  return m ? m[1].toLowerCase() : '';
};

// The first bytes must match the container the extension claims (catches a renamed deck or archive).
const hasVideoSignature = async (file: File, ext: string): Promise<boolean> => {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (ext === 'mp4' || ext === 'mov' || ext === 'm4v') {
    return head.length >= 12 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70; // "ftyp"
  }
  if (ext === 'webm' || ext === 'mkv') {
    return head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
  }
  return false;
};

// Returns an error message, or null when the file is acceptable.
export async function validateVideoFile(
  file: File,
  opts: { allowedExt: string[]; mustMatchExt?: string | null }
): Promise<string | null> {
  const ext = extOf(file.name);
  const list = opts.allowedExt.map((e) => `.${e}`).join(', ');
  if (file.size === 0) return 'This file is empty.';
  if (opts.allowedExt.indexOf(ext) < 0) {
    return opts.allowedExt.length === 1 ? `Only ${list} video files are accepted.` : `Only video files are accepted (${list}).`;
  }
  if (opts.mustMatchExt && ext !== opts.mustMatchExt) {
    return `The new file must be .${opts.mustMatchExt} like the current one, because the file name stays the same.`;
  }
  let ok = false;
  try { ok = await hasVideoSignature(file, ext); } catch { ok = false; }
  if (!ok) return `This file is not a valid .${ext} video. It may be a different file type that was renamed.`;
  return null;
}
