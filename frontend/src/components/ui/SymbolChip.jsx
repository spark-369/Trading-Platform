import { Box, Typography, Tooltip } from '@mui/material';

/**
 * Ticker badge: a strong symbol label with an optional company name beneath.
 * Keeps the symbol visually distinct from surrounding text in dense tables.
 */
export default function SymbolChip({ symbol, companyName, size = 'medium' }) {
  const isSmall = size === 'small';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          minWidth: isSmall ? 44 : 52,
          height: isSmall ? 26 : 30,
          px: 0.75,
          borderRadius: 1.5,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.16)' : 'rgba(37,99,235,0.1)',
          color: 'primary.main',
          fontWeight: 700,
          fontSize: isSmall ? '0.6875rem' : '0.75rem',
          letterSpacing: '0.03em',
          flexShrink: 0,
        }}
      >
        {symbol}
      </Box>
      {companyName && (
        <Tooltip title={companyName}>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {companyName}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
