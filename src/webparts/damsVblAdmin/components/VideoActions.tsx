import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { ReplaceVideoModal } from './ReplaceVideoModal';

const DOWNLOAD = 'M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z';
const UPLOAD = 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z';

const IconBtn: React.FC<{ d: string; label: string; onClick: () => void; disabled?: boolean; busy?: boolean }> = ({ d, label, onClick, disabled, busy }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled || busy}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      width: 28, height: 28, borderRadius: 6, border: `1px solid ${tokens.color.line}`, background: '#fff',
      color: disabled ? tokens.color.line : tokens.color.blue, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0
    }}
  >
    {busy
      ? <span className="dams-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
      : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>}
  </button>
);

// Download straight to disk, or replace the video in place (same name and share links).
export const VideoActions: React.FC<{
  api: DamsApi;
  id: string;
  code: string;
  canReplace: boolean;
  onReplaced: () => void;
  onError: (message: string) => void;
}> = ({ api, id, code, canReplace, onReplaced, onError }) => {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  const download = async (): Promise<void> => {
    setDownloading(true);
    try {
      const m = await api.getMediaUrl(id);
      if (!m || !m.Url) { onError('Could not get the download link.'); return; }
      const a = document.createElement('a');
      a.href = m.Url;
      if (m.Name) a.download = m.Name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      onError('Could not start the download.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div data-inline="true" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', gap: 6 }}>
      <IconBtn d={DOWNLOAD} label="Download video" onClick={() => { void download(); }} busy={downloading} />
      <IconBtn
        d={UPLOAD}
        label={canReplace ? 'Replace video (keeps file name and share links)' : 'Only an admin or the assigned editor can replace this video'}
        disabled={!canReplace}
        onClick={() => { if (fileRef.current) fileRef.current.click(); }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="video/*,.mp4,.mov,.m4v,.mkv,.webm"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          e.target.value = '';
          if (f) setFile(f);
        }}
      />
      {file && (
        <ReplaceVideoModal
          api={api}
          id={id}
          code={code}
          file={file}
          onClose={(replaced) => { setFile(null); if (replaced) onReplaced(); }}
        />
      )}
    </div>
  );
};
