import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  MenuItem,
  Stack,
  Divider,
  Skeleton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import LockIcon from '@mui/icons-material/LockRounded';
import { useSnackbar } from 'notistack';
import {
  placeOrder,
  getOrders,
  cancelOrder,
  getAllMarketData,
  getOrdersByUser,
  forceCancelOrder,
  getAllUsers,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, EmptyState, ConfirmDialog, StatusChip, SymbolChip } from '../components/ui';
import { formatCurrency, formatNumber, normalizeSymbol } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

const FEE_RATE = 0.001;

export default function Trade() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const { enqueueSnackbar } = useSnackbar();

  const [orderType, setOrderType] = useState('BUY');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, marketRes] = await Promise.all([
        isAdmin && selectedUserId ? getOrdersByUser(selectedUserId) : getOrders(),
        getAllMarketData(),
      ]);
      setOrders(ordersRes);
      setMarketData(marketRes);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load trade data'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isAdmin) return;
    getAllUsers()
      .then(setUsers)
      .catch((err) => console.error('Failed to load users', err));
  }, [isAdmin]);

  const normalizedSymbol = normalizeSymbol(symbol);

  // The backend executes at the server-side market price; we look the quote up
  // only to preview cost and validate the symbol before submitting.
  const quote = useMemo(
    () => marketData.find((item) => item.symbol === normalizedSymbol) ?? null,
    [marketData, normalizedSymbol]
  );

  const parsedQuantity = Number(quantity) || 0;
  const estimatedPrice = quote?.currentPrice ?? 0;
  const estimatedTotal = estimatedPrice * parsedQuantity;
  const estimatedFee = estimatedTotal * FEE_RATE;
  const estimatedCost = orderType === 'BUY' ? estimatedTotal + estimatedFee : estimatedTotal - estimatedFee;

  const resetForm = () => {
    setSymbol('');
    setQuantity('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!normalizedSymbol) {
      setError('Enter a symbol.');
      return;
    }
    if (!quote) {
      setError(`Unknown symbol "${normalizedSymbol}". Pick an instrument from the Market page.`);
      return;
    }
    if (parsedQuantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      // Price is intentionally omitted - the server fills at market.
      const order = await placeOrder(orderType, normalizedSymbol, parsedQuantity, estimatedPrice);
      enqueueSnackbar(
        `${orderType} order filled at ${formatCurrency(order.price)} (total ${formatCurrency(order.totalAmount)})`,
        { variant: 'success' }
      );
      resetForm();
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Order failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelOrder(cancelTarget.id);
      enqueueSnackbar(`Order #${cancelTarget.id} cancelled`, { variant: 'success' });
      loadData();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to cancel order'), { variant: 'error' });
    } finally {
      setCancelTarget(null);
    }
  };

  const handleForceCancel = async (orderId) => {
    try {
      await forceCancelOrder(orderId);
      enqueueSnackbar(`Order #${orderId} force cancelled`, { variant: 'success' });
      loadData();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to force cancel order'), { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Trade"
        subtitle="Orders execute at the live market price. Fees are 0.10% per trade."
        breadcrumbs={[{ label: 'Trading' }, { label: 'Trade' }]}
        actions={
          isAdmin && (
            <TextField
              select
              label="View orders for"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">My orders</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username}
                </MenuItem>
              ))}
            </TextField>
          )
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Place order
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <ToggleButtonGroup
                  value={orderType}
                  exclusive
                  fullWidth
                  onChange={(event, value) => value && setOrderType(value)}
                  sx={{ mb: 2.5 }}
                >
                  <ToggleButton
                    value="BUY"
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: 'success.main',
                        color: 'success.contrastText',
                        '&:hover': { bgcolor: 'success.main' },
                      },
                    }}
                  >
                    Buy
                  </ToggleButton>
                  <ToggleButton
                    value="SELL"
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                        '&:hover': { bgcolor: 'error.main' },
                      },
                    }}
                  >
                    Sell
                  </ToggleButton>
                </ToggleButtonGroup>

                <Stack spacing={2}>
                  <TextField
                    label="Symbol"
                    value={symbol}
                    onChange={(event) => setSymbol(normalizeSymbol(event.target.value))}
                    placeholder="AAPL"
                    fullWidth
                    required
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />

                  <TextField
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    fullWidth
                    required
                    inputProps={{ step: '0.00000001', min: '0' }}
                  />

                  {/* Price is server-controlled - make that explicit. */}
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                      <LockIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Executes at market price
                      </Typography>
                    </Box>
                    {normalizedSymbol && !quote && (
                      <Typography variant="body2" color="error.main">
                        Unknown symbol — no market data available.
                      </Typography>
                    )}
                    {quote ? (
                      <Stack spacing={0.75}>
                        <Row label="Market price" value={formatCurrency(estimatedPrice)} />
                        <Row
                          label={`Est. fee (${(FEE_RATE * 100).toFixed(2)}%)`}
                          value={formatCurrency(estimatedFee)}
                        />
                        <Divider sx={{ my: 0.5 }} />
                        <Row
                          label={orderType === 'BUY' ? 'Est. total debit' : 'Est. net credit'}
                          value={formatCurrency(parsedQuantity > 0 ? estimatedCost : 0)}
                          strong
                        />
                      </Stack>
                    ) : (
                      normalizedSymbol && (
                        <Typography variant="caption" color="text.secondary">
                          Enter a valid symbol to preview the cost.
                        </Typography>
                      )
                    )}
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={submitting || !quote || parsedQuantity <= 0}
                    color={orderType === 'BUY' ? 'primary' : 'error'}
                  >
                    {submitting
                      ? 'Placing order…'
                      : `Place ${orderType === 'BUY' ? 'buy' : 'sell'} order`}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
              >
                <Typography variant="h6">
                  {selectedUserId ? 'Orders for selected user' : 'Order history'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {orders.length} order{orders.length === 1 ? '' : 's'}
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Instrument</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Fee</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            {Array.from({ length: 9 }).map((__, colIndex) => (
                              <TableCell key={colIndex}>
                                <Skeleton height={22} />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : orders.slice(0, 25).map((order) => {
                          const cancellable =
                            order.orderStatus === 'PENDING' ||
                            order.orderStatus === 'PARTIALLY_FILLED';
                          return (
                            <TableRow key={order.id} hover>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  #{order.id}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StatusChip status={order.orderType} />
                              </TableCell>
                              <TableCell>
                                <SymbolChip symbol={order.symbol} size="small" />
                              </TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatNumber(order.quantity, 4)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(order.price)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(order.totalAmount)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(order.fee)}
                              </TableCell>
                              <TableCell>
                                <StatusChip status={order.orderStatus} variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                {cancellable &&
                                  (isAdmin && selectedUserId ? (
                                    <Tooltip title="Force cancel">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleForceCancel(order.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => setCancelTarget(order)}
                                    >
                                      Cancel
                                    </Button>
                                  ))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                  </TableBody>
                </Table>
              </TableContainer>

              {!loading && orders.length === 0 && (
                <EmptyState
                  title="No orders yet"
                  description="Place your first order using the form to see it appear here."
                  compact
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel order"
        description={
          cancelTarget
            ? `Order #${cancelTarget.id} for ${cancelTarget.symbol} will be cancelled.`
            : ''
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        danger
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </Box>
  );
}

/** Small label/value row used inside the order preview panel. */
function Row({ label, value, strong = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={strong ? 700 : 500}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

