import * as React from 'react';
import { AadHttpClient, AadHttpClientFactory, HttpClientResponse } from '@microsoft/sp-http';
import { tokens } from '../../../shared/tokens';
import { Icon } from '../../../shared/Icon';
import { Shimmer, Underline } from '../../../shared/LoadingFX';

export interface IBinusZoomBotProps {
  heading: string;
  eyebrow: string;
  subheading: string;
  apiBaseUrl: string;
  apiResourceUri: string;
  defaultHostEmail: string;
  defaultTimezone: string;
  aadClientFactory: AadHttpClientFactory;
}

interface IMeeting {
  meetingId: string;
  type: string;
  hostEmail: string;
  title: string;
  startTime: string;
  duration: number;
  joinUrl: string;
  createdAt: string;
  timezone?: string;
}

interface ICreateResp {
  meetingId: string;
  joinUrl: string;
  startUrl?: string;
  password?: string;
  topic: string;
  startTime: string;
  duration: number;
}

type MeetingType = 'meeting' | 'webinar';

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Bangkok',
  'Australia/Sydney',
  'Europe/London',
  'America/Los_Angeles',
  'America/New_York',
  'UTC'
];

const styles: { [k: string]: React.CSSProperties } = {
  root: {
    padding: '0',
    background: tokens.color.bgSoft,
    fontFamily: tokens.font.family,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  hero: {
    position: 'relative',
    padding: '40px 32px 48px',
    background: `linear-gradient(135deg, ${tokens.color.blueDark} 0%, ${tokens.color.blue} 100%)`,
    color: '#fff',
    overflow: 'hidden'
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: 800,
    color: tokens.color.orange,
    marginBottom: 10
  },
  heroTitle: { fontSize: 30, lineHeight: 1.15, color: '#fff', fontWeight: 800, margin: '0 0 8px' },
  heroSub: { fontSize: 14, opacity: 0.88, margin: 0, maxWidth: 540 },
  steps: { display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 26 },
  step: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#dbe7f5' },
  stepBubble: {
    width: 26, height: 26, borderRadius: '50%',
    background: tokens.color.orange, color: tokens.color.blueDark,
    fontWeight: 800, fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  body: {
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '28px 24px 40px',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
    gap: 20,
    flex: 1
  },
  card: {
    background: tokens.color.bg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    padding: '20px 22px'
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: tokens.color.orange,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: `1px solid ${tokens.color.borderSoft}`
  },
  field: { marginBottom: 14 },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: tokens.color.blueDark,
    marginBottom: 6,
    letterSpacing: 0.3
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: `1.5px solid ${tokens.color.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: tokens.color.textDark,
    background: tokens.color.bgSoft,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: tokens.font.family
  },
  err: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  submit: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '11px 22px',
    background: tokens.color.orange,
    border: 'none',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    borderRadius: tokens.radius.pill,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(243,147,27,.30)'
  },
  result: {
    marginTop: 14,
    padding: '14px 16px',
    border: `1px solid ${tokens.color.blue}`,
    background: `${tokens.color.blue}0F`,
    borderRadius: tokens.radius.sm,
    fontSize: 13,
    color: tokens.color.textDark,
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  meetingRow: {
    display: 'flex',
    gap: 12,
    padding: '12px 14px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  meetingTitle: { fontSize: 14, fontWeight: 700, color: tokens.color.textDark, marginBottom: 2 },
  meetingMeta: { fontSize: 11, color: tokens.color.text },
  joinBtn: {
    padding: '6px 12px',
    background: tokens.color.blue,
    color: '#fff',
    borderRadius: tokens.radius.sm,
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap'
  }
};

function fmt(iso: string, timeZone = 'Asia/Jakarta'): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dateStr = d.toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone
    });
    return `${dateStr} · ${timeZone}`;
  } catch { return iso; }
}

function computeEnd(startIsoLocal: string, durationMin: number): string {
  if (!startIsoLocal) return '';
  try {
    const d = new Date(startIsoLocal);
    if (isNaN(d.getTime())) return '';
    const end = new Date(d.getTime() + durationMin * 60_000);
    return end.toLocaleString(undefined, {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
}

const CopyRow: React.FC<{ label: string; value: string; mask?: boolean }> = ({ label, value, mask }) => {
  const [flash, setFlash] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const copy = (): void => {
    try {
      void navigator.clipboard.writeText(value);
      setFlash(true);
      setTimeout(() => setFlash(false), 1400);
    } catch { /* clipboard blocked */ }
  };
  const display = mask && !shown ? '•'.repeat(Math.max(6, value.length)) : value;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      background: tokens.color.bg,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: 8,
      marginTop: 8
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: tokens.color.text, letterSpacing: 0.6, textTransform: 'uppercase', minWidth: 78 }}>{label}</span>
      <span style={{
        flex: 1,
        fontFamily: 'SFMono-Regular,Consolas,monospace',
        fontSize: 13,
        color: tokens.color.textDark,
        wordBreak: 'break-all',
        letterSpacing: mask && !shown ? 2 : 0
      }}>{display}</span>
      {mask && (
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          style={{
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.bg,
            borderRadius: 6,
            padding: '5px 9px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            color: tokens.color.textDark
          }}
        >{shown ? 'Hide' : 'Show'}</button>
      )}
      <button
        type="button"
        onClick={copy}
        style={{
          border: 'none',
          background: flash ? tokens.color.blue : tokens.color.orange,
          color: '#fff',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background .15s'
        }}
      >{flash ? 'Copied' : 'Copy'}</button>
    </div>
  );
};

const JoinButtonWithCopy: React.FC<{ url: string; label: string; bg: string }> = ({ url, label, bg }) => {
  const [flash, setFlash] = React.useState(false);
  const copy = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    try {
      void navigator.clipboard.writeText(url);
      setFlash(true);
      setTimeout(() => setFlash(false), 1400);
    } catch { /* clipboard blocked */ }
  };
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      alignItems: 'stretch',
      marginTop: 10
    }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px 18px',
          background: bg,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          borderRadius: 8,
          textDecoration: 'none'
        }}
      >
        {label}
      </a>
      <button
        type="button"
        onClick={copy}
        title="Copy link"
        style={{
          flex: '0 0 auto',
          padding: '0 16px',
          background: flash ? tokens.color.blue : tokens.color.bg,
          color: flash ? '#fff' : tokens.color.textDark,
          border: `1px solid ${flash ? tokens.color.blue : tokens.color.border}`,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background .15s, color .15s, border-color .15s'
        }}
      >{flash ? 'Copied' : 'Copy link'}</button>
    </div>
  );
};

const CreatedResult: React.FC<{ result: ICreateResp }> = ({ result }) => (
  <div style={{
    marginTop: 16,
    padding: '16px 18px',
    border: `1px solid ${tokens.color.blue}`,
    background: `${tokens.color.blue}0F`,
    borderRadius: 8
  }}>
    <div style={{ fontWeight: 800, color: tokens.color.blueDark, marginBottom: 4 }}>
      Scheduled: {result.topic}
    </div>
    <CopyRow label="Meeting ID" value={result.meetingId} />
    <JoinButtonWithCopy url={result.joinUrl} label="Join Meeting (Participants)" bg={tokens.color.orange} />
    {result.startUrl && (
      <JoinButtonWithCopy url={result.startUrl} label="Start as Host" bg="#7c2d12" />
    )}
    {result.password && <CopyRow label="Passcode" value={result.password} mask />}
  </div>
);


export const BinusZoomBot: React.FC<IBinusZoomBotProps> = (p) => {
  const clientRef = React.useRef<Promise<AadHttpClient> | null>(null);
  const getClient = React.useCallback((): Promise<AadHttpClient> => {
    if (!clientRef.current) clientRef.current = p.aadClientFactory.getClient(p.apiResourceUri);
    return clientRef.current;
  }, [p.aadClientFactory, p.apiResourceUri]);

  const [type, setType] = React.useState<MeetingType>('meeting');
  const [title, setTitle] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [startClock, setStartClock] = React.useState('');
  const [duration, setDuration] = React.useState(60);
  const [timezone, setTimezone] = React.useState(p.defaultTimezone || 'Asia/Jakarta');
  const [hostEmail, setHostEmail] = React.useState(p.defaultHostEmail || '');

  const startTime = startDate && startClock ? `${startDate}T${startClock}` : '';

  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ [k: string]: string }>({});
  const [submitErr, setSubmitErr] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ICreateResp | null>(null);

  const [meetings, setMeetings] = React.useState<IMeeting[] | null>(null);
  const sortedMeetings = React.useMemo(() => {
    if (!meetings) return null;
    return [...meetings].sort((a, b) => {
      const ta = a.startTime ? new Date(a.startTime).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.startTime ? new Date(b.startTime).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  }, [meetings]);
  const [meetingsErr, setMeetingsErr] = React.useState<string | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);

  const loadList = React.useCallback(async (): Promise<void> => {
    setLoadingList(true);
    setMeetingsErr(null);
    try {
      const c = await getClient();
      const url = `${p.apiBaseUrl.replace(/\/$/, '')}/Zoom?t=${Date.now()}`;
      const r: HttpClientResponse = await c.get(url, AadHttpClient.configurations.v1);
      if (!r.ok) {
        setMeetingsErr(`HTTP ${r.status}`);
        setMeetings([]);
      } else {
        setMeetings((await r.json()) as IMeeting[]);
      }
    } catch (e) {
      setMeetingsErr(String((e as Error).message || e));
      setMeetings([]);
    }
    setLoadingList(false);
  }, [getClient, p.apiBaseUrl]);

  React.useEffect(() => { void loadList(); }, [loadList]);

  function validate(): boolean {
    const e: { [k: string]: string } = {};
    if (!title.trim()) e.title = 'Title required';
    if (!startDate) e.startTime = 'Date required';
    else if (!startClock) e.startTime = 'Time required';
    if (!hostEmail.trim()) e.hostEmail = 'Host email required';
    else if (!/^\S+@\S+\.\S+$/.test(hostEmail)) e.hostEmail = 'Invalid email';
    if (duration < 1 || duration > 600) e.duration = '1-600 minutes';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent): Promise<void> {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitErr(null);
    setResult(null);
    try {
      const c = await getClient();
      const url = `${p.apiBaseUrl.replace(/\/$/, '')}/Zoom`;
      const payload = {
        title: title.trim(),
        startTime: startTime.length === 16 ? `${startTime}:00` : startTime,
        duration,
        timezone,
        type,
        hostEmail: hostEmail.trim()
      };
      const r: HttpClientResponse = await c.post(url, AadHttpClient.configurations.v1, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const txt = await r.text();
      if (!r.ok) {
        setSubmitErr(txt || `HTTP ${r.status}`);
      } else {
        setResult(JSON.parse(txt));
        setTitle('');
        setStartDate('');
        setStartClock('');
        setTimeout(() => { void loadList(); }, 1200);
      }
    } catch (e) {
      setSubmitErr(String((e as Error).message || e));
    }
    setSubmitting(false);
  }

  return (
    <section className="bp-root" style={styles.root}>
      <div style={styles.hero}>
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
          <div style={styles.eyebrow}>{p.eyebrow || 'DAMS'} · Zoom</div>
          <h1 style={styles.heroTitle}><Underline>{p.heading}</Underline></h1>
          <p style={styles.heroSub}>{p.subheading}</p>
          <div style={styles.steps}>
            {[
              { n: '1', t: 'Fill the form' },
              { n: '2', t: 'Join your meeting' },
              { n: '3', t: 'Recording auto-saved' },
              { n: '4', t: 'Email notification' }
            ].map((s) => (
              <span key={s.n} style={styles.step}>
                <span style={styles.stepBubble}>{s.n}</span>
                <span>{s.t}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.body}>
        <form style={styles.card} onSubmit={onSubmit}>
          <div style={styles.sectionEyebrow}>Schedule</div>

          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly research sync"
            />
            {errors.title && <div style={styles.err}>{errors.title}</div>}
          </div>

          <div style={styles.row2}>
            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <select style={styles.input} value={type} onChange={(e) => setType(e.target.value as MeetingType)}>
                <option value="meeting">Meeting</option>
                <option value="webinar">Webinar</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Timezone</label>
              <select style={styles.input} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .9fr .8fr', gap: 12 }}>
            <div style={styles.field}>
              <label style={styles.label}>Date</label>
              <input
                style={styles.input}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Time</label>
              <input
                style={{ ...styles.input, fontVariantNumeric: 'tabular-nums' }}
                type="time"
                step={300}
                value={startClock}
                onChange={(e) => setStartClock(e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Duration (min)</label>
              <input
                style={styles.input}
                type="number"
                min={1}
                max={600}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            {(errors.startTime || errors.duration) && (
              <div style={{ ...styles.err, gridColumn: '1 / -1' }}>
                {errors.startTime || errors.duration}
              </div>
            )}
          </div>

          {startTime && duration > 0 && (
            <div style={{
              ...styles.field,
              padding: '8px 12px',
              background: `${tokens.color.blue}0F`,
              borderRadius: 6,
              border: `1px solid ${tokens.color.blue}33`,
              fontSize: 12,
              color: tokens.color.text
            }}>
              Ends approximately <strong style={{ color: tokens.color.textDark }}>{computeEnd(startTime, duration)}</strong>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Host email</label>
            <input
              style={styles.input}
              type="email"
              value={hostEmail}
              onChange={(e) => setHostEmail(e.target.value)}
              placeholder="you@binus.edu"
            />
            {errors.hostEmail && <div style={styles.err}>{errors.hostEmail}</div>}
          </div>

          <button type="submit" disabled={submitting} style={{ ...styles.submit, opacity: submitting ? 0.6 : 1 }}>
            <Icon name="sparkles" size={16} strokeWidth={2.25} />
            {submitting ? 'Scheduling…' : 'Schedule'}
          </button>

          {submitErr && (
            <div style={{ ...styles.result, borderColor: '#dc2626', background: '#fee2e2', color: '#991b1b' }}>
              {submitErr}
            </div>
          )}

          {result && <CreatedResult result={result} />}
        </form>

        <div style={styles.card}>
          <div style={styles.sectionEyebrow}>Upcoming</div>
          {loadingList && (
            <div>
              {Array.from({ length: 3 }).map((_, i) => <Shimmer key={i} height={64} style={{ marginBottom: 8 }} />)}
            </div>
          )}
          {meetingsErr && <div style={styles.err}>Failed to load: {meetingsErr}</div>}
          {!loadingList && sortedMeetings && sortedMeetings.length === 0 && !meetingsErr && (
            <div style={{ color: tokens.color.text, fontSize: 13, padding: '16px 0' }}>No upcoming sessions.</div>
          )}
          {!loadingList && sortedMeetings && sortedMeetings.length > 0 && sortedMeetings.map((m) => (
            <div key={m.meetingId} style={styles.meetingRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.meetingTitle}>{m.title}</div>
                <div style={styles.meetingMeta}>{fmt(m.startTime, m.timezone || timezone)} · {m.duration} min · {m.hostEmail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
