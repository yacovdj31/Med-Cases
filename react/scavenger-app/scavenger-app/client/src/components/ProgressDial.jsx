

// client/src/components/ProgressDial.jsx
import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

export default function ProgressDial({
  percent = 0,
  size = 160,
  stroke = 12,
  glow = 0,            // 0 = no glow (default). Try 0.25 for a subtle dark-mode glow.
  showHead = true,     // toggle the small head dot
  colorsLight = ['#894511ff', '#c7710fff'], // sky-600 → indigo-500
  colorsDark  = ['#188451ff', '#8bfab4ff'], // blue-400 → violet-400
  trackLight = 'rgba(2,132,199,0.15)',  // sky-600 @ 15%
  trackDark  = 'rgba(148,163,184,0.25)' // slate-400 @ 25%
}) {
  const { t } = useTheme();

  // theme-aware palette
  const colors = t(colorsLight, colorsDark);
  const trackColor = t(trackLight, trackDark);

  // math
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  const mid = size / 2;

  // ids
  const uid = (React.useId && React.useId()) || Math.random().toString(36).slice(2);
  const gradId = `grad-${uid}`;
  const glowId = `glow-${uid}`;

  // head "dot"
  const angle = (p / 100) * 2 * Math.PI - Math.PI / 2;
  const hx = mid + r * Math.cos(angle);
  const hy = mid + r * Math.sin(angle);

  // clamp glow → convert to blur radius (nice 0..12 range)
  const glowStd = Math.max(0, Math.min(1, glow)) * 12;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progress ${Math.round(p)} percent`}
      title={`${Math.round(p)}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* Arc gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>

          {/* Optional subtle glow ON THE ARC ONLY */}
          {glowStd > 0 && (
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={glowStd} result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* No background halo anymore */}

        {/* Track */}
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />

        {/* Progress arc (gradient, optional glow) */}
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${mid} ${mid})`}
          style={{ transition: 'stroke-dasharray 300ms ease' }}
          filter={glowStd > 0 ? `url(#${glowId})` : undefined}
        />

        {/* Head dot */}
        {showHead && p > 0 && (
          <circle cx={hx} cy={hy} r={stroke * 0.42} fill={colors[1]} opacity="0.95" />
        )}
      </svg>

      {/* Center label (theme-aware color, no backdrop) */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center select-none">
          <div className={t("text-2xl font-bold text-slate-900", "text-2xl font-bold text-white")}>
            {Math.round(p)}%
          </div>
        </div>
      </div>
    </div>
  );
}