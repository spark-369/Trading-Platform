import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { getErrorMessage } from '../../utils/errors';

/**
 * Renders a failed request with a retry affordance instead of a bare alert,
 * so users can recover without reloading the page.
 */
export default function ErrorState({ error, title = 'Could not load this page', onRetry }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 7,
        px: 3,
        gap: 1,
      }}
      role="alert"
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'error.light',
          color: 'error.main',
          mb: 0.5,
          '& svg': { fontSize: 28 },
        }}
      >
        <ErrorOutlineIcon />
      </Box>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
        {typeof error === 'string' ? error : getErrorMessage(error)}
      </Typography>
      {onRetry && (
        <Button variant="outlined" size="small" onClick={onRetry} sx={{ mt: 1.5 }}>
          Try again
        </Button>
      )}
    </Box>
  );
}
