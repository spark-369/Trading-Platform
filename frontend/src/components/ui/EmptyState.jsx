import { Box, Typography, Button, Stack } from '@mui/material';
import InboxIcon from '@mui/icons-material/InboxOutlined';

/**
 * Friendly placeholder for "no data yet" situations. A good empty state always
 * explains what is missing and (optionally) offers the next action.
 */
export default function EmptyState({
  title = 'Nothing here yet',
  description,
  icon,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: compact ? 4 : 7,
        px: 3,
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          color: 'text.secondary',
          mb: 0.5,
          '& svg': { fontSize: compact ? 22 : 28 },
        }}
      >
        {icon ?? <InboxIcon />}
      </Box>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button variant="contained" size="small" onClick={onAction}>
            {actionLabel}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
