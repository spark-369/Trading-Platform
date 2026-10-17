import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Stack,
  MenuItem,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import { useSnackbar } from 'notistack';
import {
  getWatchlists,
  createWatchlist,
  deleteWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
  getMarketData,
  getWatchlistsByUser,
  getAllUsers,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, EmptyState, ConfirmDialog, ErrorState } from '../components/ui';
import { formatDate, normalizeSymbol } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

export default function Watchlist() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const { enqueueSnackbar } = useSnackbar();

  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [symbolDrafts, setSymbolDrafts] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const readOnly = Boolean(isAdmin && selectedUserId);

  const loadWatchlists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        isAdmin && selectedUserId
          ? await getWatchlistsByUser(selectedUserId)
          : await getWatchlists();
      setWatchlists(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedUserId]);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  useEffect(() => {
    if (!isAdmin) return;
    getAllUsers()
      .then(setUsers)
      .catch((err) => console.error('Failed to load users', err));
  }, [isAdmin]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createWatchlist(newName.trim());
      enqueueSnackbar('Watchlist created', { variant: 'success' });
      setNewName('');
      setCreateOpen(false);
      loadWatchlists();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to create watchlist'), { variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWatchlist(deleteTarget.id);
      enqueueSnackbar(`"${deleteTarget.name}" deleted`, { variant: 'success' });
      loadWatchlists();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to delete watchlist'), { variant: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleAddItem = async (watchlistId) => {
    const symbol = normalizeSymbol(symbolDrafts[watchlistId] ?? '');
    if (!symbol) return;
    try {
      const quote = await getMarketData(symbol);
      await addWatchlistItem(watchlistId, symbol, quote.companyName);
      setSymbolDrafts((prev) => ({ ...prev, [watchlistId]: '' }));
      enqueueSnackbar(`${symbol} added`, { variant: 'success' });
      loadWatchlists();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to add symbol'), { variant: 'error' });
    }
  };

  const handleRemoveItem = async (watchlistId, symbol) => {
    try {
      await removeWatchlistItem(watchlistId, symbol);
      enqueueSnackbar(`${symbol} removed`, { variant: 'success' });
      loadWatchlists();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to remove symbol'), { variant: 'error' });
    }
  };


  return (
    <Box>
      <PageHeader
        title="Watchlists"
        subtitle="Track the instruments you care about most."
        breadcrumbs={[{ label: 'Trading' }, { label: 'Watchlist' }]}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isAdmin && (
              <TextField
                select
                label="Viewing"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                sx={{ minWidth: 190 }}
              >
                <MenuItem value="">My watchlists</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {!readOnly && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
              >
                New watchlist
              </Button>
            )}
          </Stack>
        }
      />

      {error ? (
        <ErrorState error={error} title="Could not load watchlists" onRetry={loadWatchlists} />
      ) : watchlists.length === 0 ? (
        <Card>
          <EmptyState
            title="No watchlists yet"
            description="Create a watchlist to group instruments you want to monitor."
            icon={<StarIcon />}
            actionLabel={readOnly ? undefined : 'Create watchlist'}
            onAction={readOnly ? undefined : () => setCreateOpen(true)}
          />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {watchlists.map((watchlist) => (
            <Grid key={watchlist.id} size={{ xs: 12, lg: 6 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      mb: 1.5,
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{watchlist.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {watchlist.items?.length ?? 0} instrument
                        {(watchlist.items?.length ?? 0) === 1 ? '' : 's'} · created{' '}
                        {formatDate(watchlist.createdAt)}
                      </Typography>
                    </Box>
                    {!readOnly && (
                      <Tooltip title="Delete watchlist">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(watchlist)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Divider sx={{ mb: 1.5 }} />

                  {!watchlist.items?.length ? (
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 2, textAlign: 'center' }}
                      >
                        No symbols yet — add one below.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={0} sx={{ flexGrow: 1 }}>
                      {watchlist.items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1,
                            borderBottom: 1,
                            borderColor: 'divider',
                            '&:last-of-type': { borderBottom: 0 },
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} sx={{ minWidth: 56 }}>
                            {item.symbol}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ flexGrow: 1, minWidth: 0 }}
                          >
                            {item.companyName || '—'}
                          </Typography>
                          {!readOnly && (
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(watchlist.id, item.symbol)}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {!readOnly && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <TextField
                        size="small"
                        placeholder="Add symbol (e.g. AAPL)"
                        value={symbolDrafts[watchlist.id] ?? ''}
                        onChange={(event) =>
                          setSymbolDrafts((prev) => ({
                            ...prev,
                            [watchlist.id]: normalizeSymbol(event.target.value),
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleAddItem(watchlist.id);
                          }
                        }}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => handleAddItem(watchlist.id)}
                        disabled={!symbolDrafts[watchlist.id]}
                      >
                        Add
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          New watchlist
          <IconButton size="small" onClick={() => setCreateOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent dividers>
            <TextField
              label="Name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              fullWidth
              autoFocus
              required
              placeholder="Tech leaders"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCreateOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !newName.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete watchlist"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" and all of its tracked symbols will be removed.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}

