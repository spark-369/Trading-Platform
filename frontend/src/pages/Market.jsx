import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchRounded';
import StarBorderIcon from '@mui/icons-material/StarBorderRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import { useSnackbar } from 'notistack';
import {
  getAllMarketData,
  searchMarketData,
  getWatchlists,
  addWatchlistItem,
  createMarketData,
  updateMarketData,
  deleteMarketData,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, DataTable, TrendValue, SymbolChip, ConfirmDialog } from '../components/ui';
import { formatCurrency, formatCompact, normalizeSymbol } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

const emptyForm = {
  symbol: '',
  companyName: '',
  currentPrice: '',
  openPrice: '',
  highPrice: '',
  lowPrice: '',
  previousClose: '',
  volume: '',
  change: '',
  changePercent: '',
};

export default function Market() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const { enqueueSnackbar } = useSnackbar();

  const [marketData, setMarketData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchlists, setWatchlists] = useState([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadMarketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllMarketData();
      setMarketData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWatchlists = useCallback(async () => {
    try {
      const data = await getWatchlists();
      setWatchlists(data);
      if (data.length > 0) {
        setSelectedWatchlist((prev) => prev || String(data[0].id));
      }
    } catch (err) {
      // Non fatal: the page still works without a watchlist selected.
      console.error('Failed to load watchlists', err);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
    loadWatchlists();
  }, [loadMarketData, loadWatchlists]);

  const handleSearch = async (event) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      loadMarketData();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchMarketData(query);
      setMarketData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (item) => {
    if (!selectedWatchlist) {
      enqueueSnackbar('Select a watchlist first.', { variant: 'warning' });
      return;
    }
    try {
      await addWatchlistItem(selectedWatchlist, item.symbol, item.companyName);
      enqueueSnackbar(`${item.symbol} added to watchlist`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to add to watchlist'), { variant: 'error' });
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      symbol: item.symbol ?? '',
      companyName: item.companyName ?? '',
      currentPrice: item.currentPrice?.toString() ?? '',
      openPrice: item.openPrice?.toString() ?? '',
      highPrice: item.highPrice?.toString() ?? '',
      lowPrice: item.lowPrice?.toString() ?? '',
      previousClose: item.previousClose?.toString() ?? '',
      volume: item.volume?.toString() ?? '',
      change: item.change?.toString() ?? '',
      changePercent: item.changePercent?.toString() ?? '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      symbol: normalizeSymbol(form.symbol),
      companyName: form.companyName,
      currentPrice: Number(form.currentPrice),
      openPrice: Number(form.openPrice),
      highPrice: Number(form.highPrice),
      lowPrice: Number(form.lowPrice),
      previousClose: Number(form.previousClose),
      volume: parseInt(form.volume, 10),
      change: Number(form.change),
      changePercent: Number(form.changePercent),
    };

    try {
      if (editingItem) {
        await updateMarketData(editingItem.symbol, payload);
        enqueueSnackbar(`${payload.symbol} updated`, { variant: 'success' });
      } else {
        await createMarketData(payload);
        enqueueSnackbar(`${payload.symbol} created`, { variant: 'success' });
      }
      setFormOpen(false);
      loadMarketData();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to save market data'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMarketData(deleteTarget.symbol);
      enqueueSnackbar(`${deleteTarget.symbol} removed`, { variant: 'success' });
      loadMarketData();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to delete market data'), { variant: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };


  const columns = useMemo(
    () => [
      {
        key: 'symbol',
        label: 'Instrument',
        width: 230,
        render: (row) => <SymbolChip symbol={row.symbol} companyName={row.companyName} />,
      },
      {
        key: 'currentPrice',
        label: 'Price',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(row.currentPrice)}
          </Typography>
        ),
      },
      {
        key: 'change',
        label: 'Change',
        align: 'right',
        render: (row) => (
          <TrendValue value={row.change} changePercent={row.changePercent} size="body2" />
        ),
      },
      { key: 'openPrice', label: 'Open', align: 'right', render: (row) => formatCurrency(row.openPrice) },
      { key: 'highPrice', label: 'High', align: 'right', render: (row) => formatCurrency(row.highPrice) },
      { key: 'lowPrice', label: 'Low', align: 'right', render: (row) => formatCurrency(row.lowPrice) },
      {
        key: 'previousClose',
        label: 'Prev close',
        align: 'right',
        render: (row) => formatCurrency(row.previousClose),
      },
      { key: 'volume', label: 'Volume', align: 'right', render: (row) => formatCompact(row.volume) },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        width: isAdmin ? 132 : 64,
        render: (row) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title={selectedWatchlist ? 'Add to watchlist' : 'Select a watchlist first'}>
              <span>
                <IconButton
                  size="small"
                  disabled={!selectedWatchlist}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddToWatchlist(row);
                  }}
                >
                  <StarBorderIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {isAdmin && (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(row);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTarget(row);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdmin, selectedWatchlist]
  );

  return (
    <Box>
      <PageHeader
        title="Market"
        subtitle="Browse instruments, track quotes and build your watchlists."
        actions={
          isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Add instrument
            </Button>
          )
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              placeholder="Search by symbol or company"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="outlined" sx={{ flexShrink: 0 }}>
              Search
            </Button>
            <Button
              variant="text"
              color="inherit"
              sx={{ flexShrink: 0 }}
              onClick={() => {
                setSearchQuery('');
                loadMarketData();
              }}
            >
              Reset
            </Button>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            label="Watchlist"
            value={selectedWatchlist}
            onChange={(event) => setSelectedWatchlist(event.target.value)}
            slotProps={{ select: { native: true } }}
            helperText={watchlists.length === 0 ? 'Create a watchlist to save instruments' : undefined}
          >
            <option value="">Select watchlist</option>
            {watchlists.map((watchlist) => (
              <option key={watchlist.id} value={watchlist.id}>
                {watchlist.name}
              </option>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={marketData}
        loading={loading}
        emptyTitle={error ? 'Could not load market data' : 'No instruments found'}
        emptyDescription={
          error
            ? getErrorMessage(error)
            : isAdmin
              ? 'Add an instrument to start populating the market.'
              : 'Try a different search term.'
        }
        getRowKey={(row) => row.symbol}
        initialRowsPerPage={10}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingItem ? `Edit ${editingItem.symbol}` : 'Add instrument'}
          <IconButton size="small" onClick={() => setFormOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Symbol"
                fullWidth
                required
                value={form.symbol}
                disabled={Boolean(editingItem)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, symbol: normalizeSymbol(event.target.value) }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Company name"
                fullWidth
                value={form.companyName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, companyName: event.target.value }))
                }
              />
            </Grid>
            {[
              ['currentPrice', 'Current price'],
              ['openPrice', 'Open'],
              ['highPrice', 'High'],
              ['lowPrice', 'Low'],
              ['previousClose', 'Previous close'],
              ['volume', 'Volume'],
              ['change', 'Change'],
              ['changePercent', 'Change %'],
            ].map(([field, label]) => (
              <Grid key={field} size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={label}
                  type="number"
                  fullWidth
                  value={form[field]}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                  inputProps={field === 'volume' ? { step: 1 } : { step: '0.01' }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.symbol}>
            {saving ? 'Saving…' : editingItem ? 'Save changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete instrument"
        description={
          deleteTarget
            ? `Market data for ${deleteTarget.symbol} will be permanently removed. Orders already placed are not affected.`
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

