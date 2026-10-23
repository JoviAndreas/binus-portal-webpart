import * as React from 'react';
import { tokens } from '../../../shared/tokens';
import { DamsApi } from '../../../shared/damsApi';

const VOLUME_KEY = 'vbl-audio-volume';
const MUTE_KEY = 'vbl-audio-muted';
const URL_TTL_MS = 40 * 60 * 1000;
const PAUSE_RELEASE_MS = 15000;
const WARM_RELEASE_MS = 6000;
const HOVER_DELAY_MS = 200;

// Only one row may stream at a time. A row claims the slot before it loads or plays;
// claiming drops the previous row's connection. Hover pre-warming never interrupts a row that is playing.
interface Owner { key: string; intent: 'warm' | 'play'; stop: () => void }
let activeOwner: Owner | null = null;
const claim = (o: Owner, intent: 'warm' | 'play'): boolean => {
  if (activeOwner === o && o.intent === 'play' && intent === 'warm') return false;
  if (activeOwner && activeOwner !== o) {
    if (intent === 'warm' && activeOwner.intent === 'play') return false;
    activeOwner.stop();
  }
  o.intent = intent;
  activeOwner = o;
  return true;
};
const unclaim = (o: Owner): void => { if (activeOwner === o) activeOwner = null; };

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
  const urlRef = React.useRef<{ url: string; at: number } | null>(null);
  const inflightRef = React.useRef<Promise<string | null> | null>(null);
  const resumeRef = React.useRef(0);
  const genRef = React.useRef(0);
  const warmTimerRef = React.useRef<number | null>(null);
  const releaseTimerRef = React.useRef<number | null>(null);
  const stopRef = React.useRef<() => void>(() => undefined);
  const ownerRef = React.useRef<Owner>({ key: id, intent: 'warm', stop: () => stopRef.current() });

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

  const clearReleaseTimer = (): void => {
    if (releaseTimerRef.current !== null) { window.clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
  };
  const clearWarmTimer = (): void => {
    if (warmTimerRef.current !== null) { window.clearTimeout(warmTimerRef.current); warmTimerRef.current = null; }
  };

  // Drops the connection and remembers the position; the row keeps its place and resumes on play.
  const dropConnection = (): void => {
    const a = audioRef.current;
    if (!a) return;
    if (a.getAttribute('src')) resumeRef.current = a.currentTime;
    a.pause();
    a.removeAttribute('src');
    a.load();
  };

  // Called when another row claims the slot (and on unmount).
  const hardStop = (): void => {
    genRef.current += 1;
    clearWarmTimer();
    clearReleaseTimer();
    if (abortRef.current) abortRef.current.abort();
    inflightRef.current = null;
    dropConnection();
    setPlaying(false);
    setState((s) => (s === 'loading' ? (resumeRef.current > 0 ? 'ready' : 'idle') : s));
  };
  stopRef.current = hardStop;

  React.useEffect(() => () => {
    genRef.current += 1;
    clearWarmTimer();
    clearReleaseTimer();
    if (abortRef.current) abortRef.current.abort();
    const a = audioRef.current;
    if (a) { a.pause(); a.removeAttribute('src'); a.load(); }
    unclaim(ownerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The minted link is reused for 40 minutes. A request already in flight (for example from hover) is
  // shared by later callers such as the play click, never cancelled by them. Only a forced retry,
  // another row taking over, or unmount cancels it.
  const getUrl = (force = false): Promise<string | null> => {
    const cached = urlRef.current;
    if (!force && cached && Date.now() - cached.at < URL_TTL_MS) return Promise.resolve(cached.url);
    if (!force && inflightRef.current) return inflightRef.current;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const run = async (): Promise<string | null> => {
      try {
        const res = await api.getMediaUrl(id, ctrl.signal);
        if (ctrl.signal.aborted || !res) return null;
        urlRef.current = { url: res.Url, at: Date.now() };
        return res.Url;
      } catch {
        return null;
      }
    };
    const p: Promise<string | null> = run().then((r) => {
      if (inflightRef.current === p) inflightRef.current = null;
      return r;
    });
    inflightRef.current = p;
    return p;
  };

  const scheduleRelease = (ms: number): void => {
    clearReleaseTimer();
    releaseTimerRef.current = window.setTimeout(() => {
      releaseTimerRef.current = null;
      const a = audioRef.current;
      if (a && a.paused && a.getAttribute('src')) {
        dropConnection();
        unclaim(ownerRef.current);
      }
    }, ms);
  };

  // Hovering a player loads the link and the file's index so the first play and seek are quick.
  const prewarm = (): void => {
    const a = audioRef.current;
    if (!a) return;
    if (a.getAttribute('src')) { clearReleaseTimer(); return; }
    if (warmTimerRef.current !== null || state === 'loading') return;
    const gen = genRef.current;
    warmTimerRef.current = window.setTimeout(() => {
      warmTimerRef.current = null;
      if (activeOwner && activeOwner.intent === 'play') return;
      void getUrl().then((url) => {
        const el = audioRef.current;
        if (!url || !el || el.getAttribute('src') || genRef.current !== gen || ownerRef.current.intent === 'play') return;
        if (!claim(ownerRef.current, 'warm')) return;
        el.preload = 'metadata';
        el.src = url;
        scheduleRelease(WARM_RELEASE_MS);
      });
    }, HOVER_DELAY_MS);
  };

  const cancelWarm = (): void => {
    clearWarmTimer();
    const a = audioRef.current;
    if (a && a.paused && a.getAttribute('src')) scheduleRelease(WARM_RELEASE_MS);
  };

  const startPlayback = async (resume: number, force = false): Promise<void> => {
    const a = audioRef.current;
    if (!a) return;
    clearReleaseTimer();
    claim(ownerRef.current, 'play');
    const gen = genRef.current;
    setState('loading');
    const url = await getUrl(force);
    if (genRef.current !== gen) return;
    if (!url) { setState('error'); return; }
    a.volume = volume;
    a.muted = muted;
    a.preload = 'auto';
    if (a.getAttribute('src') !== url) a.src = url;
    if (resume > 0) {
      if (a.readyState >= 1) {
        a.currentTime = resume;
      } else {
        const onMeta = (): void => {
          a.removeEventListener('loadedmetadata', onMeta);
          a.currentTime = resume;
        };
        a.addEventListener('loadedmetadata', onMeta);
      }
    }
    try {
      await a.play();
      if (genRef.current !== gen) return;
      setState('ready');
    } catch {
      if (genRef.current === gen) setState('error');
    }
  };

  const toggle = (): void => {
    const a = audioRef.current;
    if (!a) return;
    if (state === 'loading') return;
    if (state === 'error') { void startPlayback(0, true); return; }
    if (state === 'idle') { void startPlayback(0); return; }
    if (a.paused) {
      if (!a.getAttribute('src')) { void startPlayback(resumeRef.current); return; }
      clearReleaseTimer();
      claim(ownerRef.current, 'play');
      a.play().catch(() => { void startPlayback(a.currentTime, true); });
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
    <div
      data-inline="true"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={prewarm}
      onMouseLeave={cancelWarm}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 230 }}
    >
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => { setPlaying(true); clearReleaseTimer(); ownerRef.current.intent = 'play'; }}
        onPause={() => {
          setPlaying(false);
          ownerRef.current.intent = 'warm';
          if (audioRef.current && audioRef.current.getAttribute('src')) scheduleRelease(PAUSE_RELEASE_MS);
        }}
        onEnded={() => { setPlaying(false); setTime(0); resumeRef.current = 0; }}
        onTimeUpdate={(e) => { if (scrub === null) setTime(e.currentTarget.currentTime); }}
        onLoadedMetadata={(e) => setDuration(isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onDurationChange={(e) => setDuration(isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onPlaying={() => { retriedRef.current = false; }}
        onError={() => {
          const a = audioRef.current;
          if (!a || !a.getAttribute('src')) return;
          if (retriedRef.current) { setState('error'); return; }
          retriedRef.current = true;
          void startPlayback(a.currentTime, true);
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
          <button type="button" onClick={() => void startPlayback(0, true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: tokens.color.blue, fontWeight: 700, fontSize: tokens.font.micro }}>Retry</button>
        </div>
      )}
    </div>
  );
};
