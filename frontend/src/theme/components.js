/**
 * Component level overrides shared by every page. Centralising them here is
 * what makes the app feel like one product instead of a collection of screens.
 */
export function buildComponents(mode) {
  const isDark = mode === 'dark';
  const surface = isDark ? '#141a22' : '#ffffff';
  const border = isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)';
  const hover = isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.03)';
  const radius = { sm: 8, md: 12, lg: 16 };

  return {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        'html, body, #root': { height: '100%' },
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::-webkit-scrollbar': { width: 10, height: 10 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: isDark ? 'rgba(148,163,184,0.25)' : 'rgba(15,23,42,0.18)',
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: isDark ? 'rgba(148,163,184,0.4)' : 'rgba(15,23,42,0.3)',
          backgroundClip: 'content-box',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${border}`,
          borderRadius: radius.lg,
          backgroundImage: 'none',
          backgroundColor: surface,
          transition: 'box-shadow 200ms ease, border-color 200ms ease, transform 200ms ease',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: 20, '&:last-child': { paddingBottom: 20 } } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.sm, paddingInline: 16, paddingBlock: 8, fontWeight: 600 },
        sizeSmall: { paddingInline: 12, paddingBlock: 5, fontSize: '0.8125rem' },
        sizeLarge: { paddingInline: 22, paddingBlock: 11, fontSize: '0.9375rem' },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 14px rgba(37,99,235,0.35)' },
        },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          backgroundColor: isDark ? 'rgba(15,23,42,0.35)' : 'rgba(248,250,252,0.7)',
          '& fieldset': { borderColor: border },
          '&:hover fieldset': {
            borderColor: isDark ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.2)',
          },
        },
        input: { fontSize: '0.9375rem' },
      },
    },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.9375rem' } } },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(241,245,249,0.8)',
            borderBottom: `1px solid ${border}`,
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isDark ? '#94a3b8' : '#64748b',
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: `1px solid ${border}`, paddingBlock: 12 } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child .MuiTableCell-root': { borderBottom: 'none' },
          '&.MuiTableRow-hover:hover': { backgroundColor: hover },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: '0.75rem' },
        sizeSmall: { height: 22 },
      },
    },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: radius.sm, marginBottom: 2 } } },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', borderRadius: 6, paddingBlock: 6, paddingInline: 10 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
          border: `1px solid ${border}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.0625rem', fontWeight: 700 } } },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: radius.sm, fontSize: '0.875rem', alignItems: 'center' },
      },
    },
    MuiSkeleton: { styleOverrides: { root: { borderRadius: radius.sm } } },
    MuiDivider: { styleOverrides: { root: { borderColor: border } } },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none', borderBottom: `1px solid ${border}` } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: `1px solid ${border}`, backgroundImage: 'none' } },
    },
    MuiToggleButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: radius.sm } },
    },
    MuiTabs: { styleOverrides: { indicator: { height: 2.5, borderRadius: 2 } } },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 44 },
      },
    },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 6, height: 6 } } },
    MuiAvatar: { styleOverrides: { root: { fontWeight: 700, fontSize: '0.875rem' } } },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          border: `1px solid ${border}`,
          marginTop: 6,
          backgroundImage: 'none',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: '0.875rem', borderRadius: 6, margin: '2px 6px' } },
    },
    MuiSnackbarContent: { styleOverrides: { root: { borderRadius: radius.sm } } },
    MuiBadge: { styleOverrides: { badge: { fontWeight: 700, fontSize: '0.6875rem' } } },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2 } } },
    MuiSwitch: { styleOverrides: { root: { padding: 8 } } },
  };
}
