import * as React from 'react';
import { tokens } from '../../../shared/tokens';

function initials(s: string): string {
  return (s || '?')
    .replace(/[^A-Za-z ]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

export interface IPersonAvatarProps {
  name: string;
  email?: string;
  webUrl: string;
  size?: number;
  color?: string;
}

export const PersonAvatar: React.FC<IPersonAvatarProps> = ({ name, email, webUrl, size = 40, color = tokens.color.blue }) => {
  const [err, setErr] = React.useState(false);
  const src = email
    ? `${webUrl.replace(/\/$/, '')}/_layouts/15/userphoto.aspx?size=L&username=${encodeURIComponent(email)}`
    : undefined;

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  };

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        style={{ ...base, objectFit: 'cover' }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <span
      style={{
        ...base,
        background: `${color}1A`,
        color,
        fontWeight: 800,
        fontSize: Math.max(11, size * 0.4)
      }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
};
