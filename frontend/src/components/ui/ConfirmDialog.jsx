import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmberRounded';

/**
 * Replaces window.confirm with an accessible, on-brand confirmation dialog.
 * Destructive actions get an explicit danger colour on the confirm button.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  loading = false,
  danger = false,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pb: 1 }}>
        {danger && (
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              borderRadius: '50%',
              bgcolor: 'error.light',
              color: 'error.main',
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 20 }} />
          </Box>
        )}
        {title}
      </DialogTitle>
      {description && (
        <DialogContent sx={{ pt: 0 }}>
          <DialogContentText variant="body2" color="text.secondary">
            {description}
          </DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={danger ? 'error' : 'primary'}
          disabled={loading}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
