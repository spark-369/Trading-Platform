import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { formatCurrency, formatPercent, trendOf } from '../../utils/format';

const meta = {
  up: { color: 'success.main', Icon: TrendingUpIcon },
  down: { color: 'error.main', Icon: TrendingDownIcon },
  flat: { color: 'text.secondary', Icon: TrendingFlatIcon },
};

/**
 * Renders a market value together with its directional change.
 * Green/red plus an arrow icon keeps it readable for colour-blind users.
 */
export default function TrendValue({
  value,
  change,
  changePercent,
  currency = true,
  showIcon = true,
  align = 'right',
  stacked = true,
  size = 'body2',
}) {
  const direction = trendOf(changePercent ?? change);
  const { color, Icon } = meta[direction];

  const primaryText = currency ? formatCurrency(value) : formatPercent(value);
  const secondaryText =
    changePercent !== undefined
      ? formatPercent(changePercent)
      : change !== undefined
        ? currency
          ? formatCurrency(change)
          : formatPercent(change)
        : null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        gap: stacked ? 0 : 0.5,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <Typography variant={size} fontWeight={600}>
        {primaryText}
      </Typography>
      {secondaryText && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          {showIcon && <Icon sx={{ fontSize: 14, color }} />}
          <Typography variant="caption" fontWeight={600} color={color}>
            {secondaryText}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
