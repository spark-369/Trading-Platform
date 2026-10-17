import { Chip } from '@mui/material';

const statusStyles = {
  FILLED: { label: 'Filled', color: 'success' },
  PENDING: { label: 'Pending', color: 'warning' },
  PARTIALLY_FILLED: { label: 'Partial', color: 'info' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
  REJECTED: { label: 'Rejected', color: 'error' },
  FAILED: { label: 'Failed', color: 'error' },
  BUY: { label: 'Buy', color: 'success' },
  SELL: { label: 'Sell', color: 'error' },
};

/** Maps backend enums to a consistent colour-coded chip. */
export default function StatusChip({ status, size = 'small', variant = 'filled' }) {
  const meta = statusStyles[status] ?? { label: status, color: 'default' };
  return (
    <Chip
      size={size}
      label={meta.label}
      color={meta.color}
      variant={variant}
      sx={
        variant === 'filled'
          ? undefined
          : { borderColor: 'divider', color: `${meta.color}.main` }
      }
    />
  );
}
