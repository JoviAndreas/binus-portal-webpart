import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';

const VOLUME_KEY = 'vbl-audio-volume';
const MUTE_KEY = 'vbl-audio-muted';

// Only one row plays at a time.
let currentlyPlaying: HTMLAudioElement | null = null;

const readNumber = (key: string, fallback: number): number => {
  try {
    const v = window.localStorage.getItem(key);
    const n = v === null ? NaN : parseFloat(v);
    return isNaN(n) ? fallback : Math.min(1, Math.max(0, n));
  } catch { return fallback; }
};

const fmt = (s: number): string => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r < 10 ? '0' : ''}${r}`;
};

const Icon: React.FC<{ d: string; size?: number }> = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
);
const PLAY = 'M8 5v14l11-7z';
const PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
const VOL = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z';
const MUTE = 'M3 9v6h4l5 5V4L7 9H3zm13 .4L14.6 8 12 10.6 9.4 8 8 9.4 10.6 12 8 14.6 9.4 16 12 13.4 14.6 16 16 14.6 13.4 12z';

export const AudioPreview: React.FC<{ api: DamsApi; id: string }> = ({ api, id }) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const retriedRef = React.useRef(false);
  const [state, setState] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [scrub, setScrub] = React.useState<number | null>(null);
  const [volume, setVolume] = React.useState(() => readNumber(VOLUME_KEY, 0.8));
  const [muted, setMuted] = React.useState(() => readNumber(MUTE_KEY, 0) === 1);

  React.useEffect(() => {
    const a = audioRef.current;
    if (a) { a.volume = volume; a.muted = muted; }
    try {
      window.localStorage.setItem(VOLUME_KEY, String(volume));
      window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch { /* ignore */ }
  }, [volume, muted]);

  React.useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
      if (currentlyPlaying === a) currentlyPlaying = null;
    }
  }, []);

  const mint = async (): Promise<string | null> => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await api.getMediaUrl(id, ctrl.signal);
      return ctrl.signal.aborted || !res ? null : res.Url;
    } catch {
      return null;
    }
  };

  const startPlayback = async (resume: number): Promise<void> => {
    const a = audioRef.current;
    if (!a) return;
    setState('loading');
    const url = await mint();
    if (!url) { setState('error'); return; }
    a.src = url;
    a.volume = volume;
    a.muted = muted;
    const onMeta = (): void => {
      a.removeEventListener('loadedmetadata', onMeta);
      if (resume > 0) a.currentTime = resume;
    };
    a.addEventListener('loadedmetadata', onMeta);
    try {
      if (currentlyPlaying && currentlyPlaying !== a) currentlyPlaying.pause();
      await a.play();
      currentlyPlaying = a;
      setState('ready');
    } catch {
      setState('error');
    }
  };

  const toggle = (): void => {
    const a = audioRef.current;
    if (!a) return;
    if (state === 'idle' || state === 'error') { void startPlayback(0); return; }
    if (state === 'loading') return;
    if (a.paused) {
      if (currentlyPlaying && currentlyPlaying !== a) currentlyPlaying.pause();
      a.play().then(() => { currentlyPlaying = a; }).catch(() => { void startPlayback(a.currentTime); });
    } else {
      a.pause();
    }
  };

  const onSeek = (v: number): void => {
    const a = audioRef.current;
    if (a && state === 'ready') a.currentTime = v;
    setTime(v);
  };

  const shown = scrub !== null ? scrub : time;
  const loading = state === 'loading';
  const btn: React.CSSProperties = {
    width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', flex: '0 0 auto',
    background: tokens.color.blue, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
  };

  return (
    <div data-inline="true" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 230 }}>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setTime(0); }}
        onTimeUpdate={(e) => { if (scrub === null) setTime(e.currentTarget.currentTime); }}
        onLoadedMetadata={(e) => setDuration(isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onDurationChange={(e) => setDuration(isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onPlaying={() => { retriedRef.current = false; }}
        onError={() => {
          const a = audioRef.current;
          if (!a || !a.getAttribute('src')) return;
          if (retriedRef.current) { setState('error'); return; }
          retriedRef.current = true;
          void startPlayback(a.currentTime);
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" style={btn} onClick={toggle} aria-label={playing ? 'Pause audio' : 'Play audio'} title={playing ? 'Pause' : 'Play audio'}>
          {loading ? <span className="dams-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,.4)', borderTopColor: '#fff' }} /> : <Icon d={playing ? PAUSE : PLAY} />}
        </button>
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(shown, duration || 1)}
          disabled={state !== 'ready' || !duration}
          onChange={(e) => setScrub(parseFloat(e.target.value))}
          onMouseUp={() => { if (scrub !== null) { onSeek(scrub); setScrub(null); } }}
          onTouchEnd={() => { if (scrub !== null) { onSeek(scrub); setScrub(null); } }}
          onKeyUp={() => { if (scrub !== null) { onSeek(scrub); setScrub(null); } }}
          style={{ flex: 1, minWidth: 0, accentColor: tokens.color.blue }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: tokens.font.micro, color: tokens.color.text }}>
        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 74 }}>{fmt(shown)} / {duration ? fmt(duration) : '--:--'}</span>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.color.text, padding: 0, display: 'inline-flex' }}
        >
          <Icon d={muted || volume === 0 ? MUTE : VOL} size={16} />
        </button>
        <input
          type="range"
          aria-label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); setMuted(v === 0); }}
          style={{ flex: 1, minWidth: 0, accentColor: tokens.color.blue }}
        />
      </div>
      {state === 'error' && (
        <div style={{ fontSize: tokens.font.micro, color: tokens.color.danger }}>
          Couldn't load audio.{' '}
          <button type="button" onClick={() => void startPlayback(0)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: tokens.color.blue, fontWeight: 700, fontSize: tokens.font.micro }}>Retry</button>
        </div>
      )}
    </div>
  );
};
