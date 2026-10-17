/**
 * Design tokens for the trading platform.
 *
 * Keeping the raw values in one place means the light and dark palettes stay
 * in sync and every component picks up sensible defaults automatically.
 */
export const tokens = {
  fontFamily: [
    '"Inter"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  monoFamily: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'].join(','),
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  up: '#16a34a',
  down: '#dc2626',
  neutral: '#64748b',
};

export const typography = {
  fontFamily: tokens.fontFamily,
  h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
  h2: { fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em' },
  h3: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.01em' },
  h4: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' },
  h5: { fontSize: '1.125rem', fontWeight: 600 },
  h6: { fontSize: '1rem', fontWeight: 600 },
  subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
  subtitle2: { fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.01em' },
  body1: { fontSize: '0.9375rem' },
  body2: { fontSize: '0.875rem' },
  caption: { fontSize: '0.75rem' },
  button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
  overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em' },
};

/** Values consumed by charts so they follow the active colour mode. */
export const chartTokens = {
  grid: 'rgba(148,163,184,0.2)',
  accent: '#2563eb',
  up: tokens.up,
  down: tokens.down,
  upFill: 'rgba(22,163,74,0.16)',
  downFill: 'rgba(220,38,38,0.16)',
  mono: tokens.monoFamily,
  axis: '#94a3b8',
};
