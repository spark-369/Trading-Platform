import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Typography,
  IconButton,
  Stack,
  InputAdornment,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/CloseRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import RemoveIcon from '@mui/icons-material/RemoveRounded';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import LockIcon from '@mui/icons-material/LockRounded';
import { useSnackbar } from 'notistack';
import { getWalletBalance, deposit, withdraw, getTransactionHistory, getAllUsers } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, DataTable, StatusChip, SymbolChip, ErrorState } from '../components/ui';
import { formatCurrency, formatNumber, formatDateTime } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

export default function Wallet() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const { enqueueSnackbar } = useSnackbar();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dialog, setDialog] = useState(null); // 'deposit' | 'withdraw' | null
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Only admins may move money. This mirrors the server-side rule so the UI
  // never offers an action that would be rejected anyway.
  const canManageFunds = isAdmin;
  const requiresUserSelection = canManageFunds && !selectedUserId && users.length > 0;

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetId = isAdmin && selectedUserId ? selectedUserId : undefined;
      const [walletData, txData] = await Promise.all([
        getWalletBalance(targetId),
        getTransactionHistory(targetId),
      ]);
      setWallet(walletData);
      setTransactions(txData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedUserId]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (!isAdmin) return;
    getAllUsers()
      .then(setUsers)
      .catch((err) => console.error('Failed to load users', err));
  }, [isAdmin]);

  const closeDialog = () => {
    setDialog(null);
    setAmount('');
  };

  const handleSubmitFunds = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      enqueueSnackbar('Enter an amount greater than zero.', { variant: 'warning' });
      return;
    }
    if (canManageFunds && !selectedUserId) {
      enqueueSnackbar('Select a user first.', { variant: 'warning' });
      return;
    }

    setProcessing(true);
    try {
      const action = dialog === 'deposit' ? deposit : withdraw;
      await action(value, 'USD', selectedUserId || undefined);
      enqueueSnackbar(dialog === 'deposit' ? 'Funds deposited' : 'Funds withdrawn', {
        variant: 'success',
      });
      closeDialog();
      loadWallet();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Transaction failed'), { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const cards = useMemo(
    () => [
      {
        label: 'Available balance',
        value: formatCurrency(wallet?.availableBalance ?? 0),
        icon: <AccountBalanceWalletIcon />,
        tone: 'success',
      },
      { label: 'Total balance', value: formatCurrency(wallet?.balance ?? 0), tone: 'primary' },
      { label: 'Transactions', value: formatNumber(transactions.length, 0), tone: 'info' },
    ],
    [wallet, transactions.length]
  );

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'Ref',
        width: 80,
        render: (row) => (
          <Typography variant="caption" color="text.secondary">
            #{row.id}
          </Typography>
        ),
      },
      {
        key: 'transactionType',
        label: 'Type',
        render: (row) => <StatusChip status={row.transactionType} />,
      },
      {
        key: 'symbol',
        label: 'Instrument',
        render: (row) => <SymbolChip symbol={row.symbol} size="small" />,
      },
      {
        key: 'quantity',
        label: 'Quantity',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatNumber(row.quantity, 4)}
          </Typography>
        ),
      },
      {
        key: 'totalAmount',
        label: 'Total',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(row.totalAmount)}
          </Typography>
        ),
      },
      {
        key: 'createdAt',
        label: 'Date',
        align: 'right',
        render: (row) => (
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(row.createdAt)}
          </Typography>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Wallet"
        subtitle="Cash balance and funding history."
        breadcrumbs={[{ label: 'Account' }, { label: 'Wallet' }]}
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
                <MenuItem value="">My wallet</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {canManageFunds && (
              <>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDialog('deposit')}
                  disabled={requiresUserSelection}
                >
                  Deposit
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<RemoveIcon />}
                  onClick={() => setDialog('withdraw')}
                  disabled={requiresUserSelection}
                >
                  Withdraw
                </Button>
              </>
            )}
          </Stack>
        }
      />

      {error ? (
        <ErrorState error={error} title="Could not load wallet" onRetry={loadWallet} />
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {cards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 4 }}>
                <StatCard {...card} loading={loading} />
              </Grid>
            ))}
          </Grid>

          {!canManageFunds && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2.5,
                p: 1.5,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Deposits and withdrawals are handled by platform administrators.
              </Typography>
            </Box>
          )}

          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Transaction history
          </Typography>
          <DataTable
            columns={columns}
            rows={transactions}
            loading={loading}
            emptyTitle="No transactions yet"
            emptyDescription="Deposits, withdrawals and trades will appear here."
            getRowKey={(row) => row.id}
          />
        </>
      )}

      <Dialog open={Boolean(dialog)} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {dialog === 'deposit' ? 'Deposit funds' : 'Withdraw funds'}
          <IconButton size="small" onClick={closeDialog}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmitFunds}>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                fullWidth
                autoFocus
                required
                inputProps={{ step: '0.01', min: '0.01' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              {dialog === 'withdraw' && (
                <>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(wallet?.availableBalance ?? 0)}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={dialog === 'withdraw' ? 'error' : 'primary'}
              disabled={processing}
            >
              {processing ? 'Processing…' : dialog === 'deposit' ? 'Deposit' : 'Withdraw'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

