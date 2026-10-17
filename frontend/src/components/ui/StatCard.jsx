import { Box, Card, CardContent, Typography, Skeleton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { formatPercent, trendOf } from '../../utils/format';

const trendMeta = {
  up: { color: 'success.main', Icon: TrendingUpIcon },
  down: { color: 'error.main', Icon: TrendingDownIcon },
  flat: { color: 'text.secondary', Icon: TrendingFlatIcon },
};

/**
 * Headline metric tile. `tone` controls the icon bubble colour, and the
 * optional `delta` renders a signed percentage with a direction arrow.
 */
export default function StatCard({
  label,
  value,
  delta,
  deltaLabel = 'vs. cost basis',
  icon,
  tone = 'primary',
  loading = false,
  hint,
}) {
  const trend = trendMeta[trendOf(delta)] ?? trendMeta.flat;
  const toneColor = tone === 'auto' ? null : `${tone}.main`;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton width="45%" height={18} />
          <Skeleton width="70%" height={36} sx={{ mt: 1 }} />
          <Skeleton width="35%" height={16} sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    );
  }

  const content = (
    <Card
      sx={{
        height: '100%',
        '&:hover': {
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
        },
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ lineHeight: 1.4, minHeight: 30 }}
          >
            {label}
          </Typography>
          {icon && (
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 38,
                height: 38,
                flexShrink: 0,
                borderRadius: 2.5,
                color: toneColor ?? 'text.secondary',
                bgcolor: (theme) =>
                  tone === 'auto'
                    ? alpha(theme.palette.text.secondary, 0.1)
                    : alpha(theme.palette[tone]?.main ?? theme.palette.primary.main, 0.12),
                '& svg': { fontSize: 20 },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          sx={{ mt: 1, fontVariantNumeric: 'tabular-nums', wordBreak: 'break-word' }}
        >
          {value}
        </Typography>

        {delta !== undefined && delta !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <trend.Icon sx={{ fontSize: 16, color: trend.color }} />
            <Typography variant="body2" fontWeight={600} color={trend.color}>
              {formatPercent(delta)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {deltaLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return hint ? (
    <Tooltip title={hint} placement="top">
      <Box sx={{ height: '100%' }}>{content}</Box>
    </Tooltip>
  ) : (
    content
  );
}
