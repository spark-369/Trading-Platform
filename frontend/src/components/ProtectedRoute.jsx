import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';
import InsightsIcon from '@mui/icons-material/InsightsRounded';
import { useAuth } from '../context/AuthContext';

/**
 * Full-screen boot state shown while the stored session is being restored.
 * Keeps the brand visible instead of flashing a blank page.
 */
export function SessionLoader() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        bgcolor: 'background.default',
      }}
    >
      <Stack alignItems="center" spacing={1.5}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 52,
            height: 52,
            borderRadius: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <InsightsIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700}>
          Trading Platform
        </Typography>
      </Stack>
      <CircularProgress size={26} />
    </Box>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

