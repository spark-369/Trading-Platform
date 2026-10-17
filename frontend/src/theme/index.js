import { createTheme } from '@mui/material/styles';
import { tokens, typography } from './tokens';
import { buildComponents } from './components';

const { radius } = tokens;

/** Build a complete MUI theme for the requested colour mode. */
export function buildTheme(mode = 'light') {
  const isDark = mode === 'dark';
  return createTheme({
    cssVariables: false,
    palette: {
      mode,
      primary: {
        main: isDark ? '#3b82f6' : '#2563eb',
        light: isDark ? '#60a5fa' : '#3b82f6',
        dark: isDark ? '#1d4ed8' : '#1e40af',
        contrastText: '#ffffff',
      },
      secondary: { main: isDark ? '#a78bfa' : '#7c3aed', contrastText: '#ffffff' },
      success: { main: tokens.up, contrastText: '#ffffff' },
      error: { main: tokens.down, contrastText: '#ffffff' },
      warning: { main: '#d97706', contrastText: '#ffffff' },
      info: { main: '#0891b2', contrastText: '#ffffff' },
      background: {
        default: isDark ? '#0b0f14' : '#f6f8fb',
        paper: isDark ? '#141a22' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e8eef7' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
        disabled: isDark ? '#475569' : '#94a3b8',
      },
      divider: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)',
      up: tokens.up,
      down: tokens.down,
      neutral: tokens.neutral,
    },
    shape: { borderRadius: radius.md },
    typography,
    components: buildComponents(mode),
    transitions: { duration: { shortest: 120, shorter: 160, short: 200, standard: 260 } },
  });
}

export default buildTheme;
