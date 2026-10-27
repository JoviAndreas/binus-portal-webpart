import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';
import { GhostButton, PrimaryButton } from '../../../shared/DamsUi';
import { uploadChunked } from '../../../shared/chunkUpload';
import { extractFrames } from '../../../shared/frames';
import { validateVideoFile, extOf, REPLACE_EXT } from '../../../shared/videoValidation';

type Stage = 'confirm' | 'uploading' | 'frames' | 'done' | 'error';

const mb = (n: number): string => `${(n / 1048576).toFixed(n >= 104857600 ? 0 : 1)} MB`;

const Step: React.FC<{ state: 'todo' | 'active' | 'done' | 'failed'; title: string; detail?: string }> = ({ state, title, detail }) => {
  const color = state === 'done' ? tokens.color.success : state === 'failed' ? tokens.color.danger : state === 'active' ? tokens.color.blue : tokens.color.line;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: state === 'todo' ? 'transparent' : color, border: `2px solid ${color}`, color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        {state === 'done' ? '✓' : state === 'failed' ? '!' : state === 'active' ? <span className="dams-spinner" style={{ width: 10, height: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,.4)', borderTopColor: '#fff' }} /> : ''}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: tokens.font.small, fontWeight: 600, color: state === 'todo' ? tokens.color.text : tokens.color.ink }}>{title}</div>
        {detail && <div style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>{detail}</div>}
      </div>
    </div>
  );
};

export const ReplaceVideoModal: React.FC<{
  api: DamsApi;
  id: string;
  code: string;
  file: File;
  onClose: (replaced: boolean) => void;
}> = ({ api, id, code, file, onClose }) => {
  const [stage, setStage] = React.useState<Stage>('confirm');
  const [current, setCurrent] = React.useState<{ name: string | null; size: number | null } | null>(null);
  const [loaded, setLoaded] = React.useState(0);
  const [speed, setSpeed] = React.useState(0);
  const [frameDone, setFrameDone] = React.useState(0);
  const [error, setError] = React.useState('');
  const [failedAt, setFailedAt] = React.useState<'upload' | 'frames'>('upload');
  const [replaced, setReplaced] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const busy = stage === 'uploading' || stage === 'frames';

  React.useEffect(() => {
    let active = true;
    api.getMediaUrl(id).then((m) => { if (active && m) setCurrent({ name: m.Name, size: m.Size }); }).catch(() => undefined);
    return () => { active = false; };
  }, [api, id]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape' && !busy) onClose(replaced); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, replaced, onClose]);

  React.useEffect(() => {
    const warn = (e: BeforeUnloadEvent): void => { if (busy) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  React.useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const runFrames = async (): Promise<void> => {
    setStage('frames');
    setFrameDone(0);
    try {
      const frames = await extractFrames(file, (n) => setFrameDone(n));
      const ok = await api.uploadFrames(id, frames);
      if (!ok) throw new Error('The server did not accept the preview frames.');
      setStage('done');
    } catch (e) {
      setFailedAt('frames');
      setError((e as Error).message || 'Could not generate previews.');
      setStage('error');
    }
  };

  const runUpload = async (): Promise<void> => {
    setError('');
    setLoaded(0);
    setStage('uploading');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const session = await api.createReplaceSession(id, file.name);
      if ('error' in session) throw new Error(session.error);
      await uploadChunked(file, session.UploadUrl, (p) => { setLoaded(p.loaded); setSpeed(p.speedBps); }, ctrl.signal);
      const done = await api.completeReplace(id, file.size);
      if (!done.ok) throw new Error(done.message);
      setReplaced(true);
      await runFrames();
    } catch (e) {
      if ((e as Error).name === 'AbortError') { onClose(false); return; }
      setFailedAt('upload');
      setError((e as Error).message || 'Upload failed.');
      setStage('error');
    }
  };

  const cancelUpload = (): void => { if (abortRef.current) abortRef.current.abort(); };

  const curExt = current && current.name ? extOf(current.name) : '';

  // Only a video of the same type as the current file may replace it.
  const [invalid, setInvalid] = React.useState('');
  React.useEffect(() => {
    if (!current || !current.name) return;
    if (REPLACE_EXT.indexOf(curExt) < 0) { setInvalid('Only video files can be replaced. The current file on this row is not a video.'); return; }
    let active = true;
    validateVideoFile(file, { allowedExt: REPLACE_EXT, mustMatchExt: curExt }).then((err) => { if (active) setInvalid(err || ''); }).catch(() => undefined);
    return () => { active = false; };
  }, [current, file, curExt]);
  const pct = file.size > 0 ? Math.min(100, (loaded / file.size) * 100) : 0;

  const uploadState = stage === 'confirm' ? 'todo' : stage === 'uploading' ? 'active' : stage === 'error' && failedAt === 'upload' ? 'failed' : 'done';
  const frameState = stage === 'frames' ? 'active' : stage === 'done' ? 'done' : stage === 'error' && failedAt === 'frames' ? 'failed' : 'todo';

  return (
    <div role="dialog" aria-modal="true" aria-label="Replace video" style={{ position: 'fixed', inset: 0, zIndex: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={() => { if (!busy) onClose(replaced); }} style={{ position: 'absolute', inset: 0, background: 'rgba(11,44,68,.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: tokens.radius.card, boxShadow: tokens.shadow.lg, padding: '24px 28px', width: 'min(480px, 92%)', borderTop: `4px solid ${stage === 'error' ? tokens.color.danger : tokens.color.orange}` }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 16, color: tokens.color.ink }}>
          {stage === 'done' ? 'Video replaced' : stage === 'error' ? (failedAt === 'frames' ? 'Video replaced, previews failed' : 'Replace failed') : busy ? `Replacing video for ${code}...` : `Replace video for ${code}?`}
        </h4>

        {stage === 'confirm' && (
          <>
            <div style={{ background: tokens.color.tint, borderRadius: 6, padding: '10px 12px', fontSize: tokens.font.small, color: tokens.color.ink, lineHeight: 1.6 }}>
              <div><b>Current:</b> {current && current.name ? `${current.name}${current.size ? ` (${mb(current.size)})` : ''}` : 'loading...'}</div>
              <div><b>New:</b> {file.name} ({mb(file.size)})</div>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: tokens.font.small, color: tokens.color.text, lineHeight: 1.5 }}>
              The file name and share links stay the same. The previous version stays in SharePoint version history. Preview frames are regenerated.
            </p>
            {invalid && (
              <div role="alert" style={{ background: tokens.color.dangerBg, color: tokens.color.danger, borderLeft: `3px solid ${tokens.color.danger}`, padding: '7px 10px', fontSize: tokens.font.small, fontWeight: 600, margin: '10px 0 0' }}>
                {invalid}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.space.sm, marginTop: 18 }}>
              <GhostButton type="button" onClick={() => onClose(false)}>Cancel</GhostButton>
              <PrimaryButton type="button" disabled={!!invalid || !current} onClick={() => { void runUpload(); }}>Replace video</PrimaryButton>
            </div>
          </>
        )}

        {stage !== 'confirm' && (
          <>
            <Step
              state={uploadState}
              title="Upload video"
              detail={stage === 'uploading' ? `${pct.toFixed(0)}% - ${mb(loaded)} of ${mb(file.size)}${speed > 0 ? ` - ${(speed / 1048576).toFixed(1)} MB/s` : ''}` : uploadState === 'done' ? `${mb(file.size)} uploaded` : undefined}
            />
            {stage === 'uploading' && (
              <div style={{ height: 6, borderRadius: 3, background: tokens.color.line, overflow: 'hidden', margin: '2px 0 6px 30px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: tokens.color.blue, transition: 'width .2s linear' }} />
              </div>
            )}
            <Step state={frameState} title="Generate preview frames" detail={stage === 'frames' ? `${frameDone} of 4 frames` : frameState === 'done' ? '4 frames saved' : undefined} />
            {stage === 'error' && <div style={{ marginTop: 8, padding: '8px 10px', background: tokens.color.dangerBg, color: tokens.color.danger, fontSize: tokens.font.micro, borderRadius: 4 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.space.sm, marginTop: 16 }}>
              {stage === 'uploading' && <GhostButton type="button" onClick={cancelUpload}>Cancel upload</GhostButton>}
              {stage === 'frames' && <span style={{ fontSize: tokens.font.micro, color: tokens.color.text }}>Keep this window open until frames are saved.</span>}
              {stage === 'error' && failedAt === 'upload' && <PrimaryButton type="button" onClick={() => { void runUpload(); }}>Retry</PrimaryButton>}
              {stage === 'error' && failedAt === 'frames' && <PrimaryButton type="button" onClick={() => { void runFrames(); }}>Retry previews</PrimaryButton>}
              {(stage === 'done' || stage === 'error') && <GhostButton type="button" onClick={() => onClose(replaced)}>Close</GhostButton>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
