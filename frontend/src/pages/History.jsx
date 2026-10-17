import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { getTransactionHistory, getAllUsers } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, DataTable, StatusChip, SymbolChip, ErrorState } from '../components/ui';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format';

export default function History() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactionHistory(
        isAdmin && selectedUserId ? selectedUserId : undefined
      );
      setTransactions(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedUserId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!isAdmin) return;
    getAllUsers()
      .then(setUsers)
      .catch((err) => console.error('Failed to load users', err));
  }, [isAdmin]);

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
        key: 'price',
        label: 'Price',
        align: 'right',
        render: (row) => formatCurrency(row.price),
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
        key: 'fee',
        label: 'Fee',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(row.fee)}
          </Typography>
        ),
      },
      {
        key: 'createdAt',
        label: 'Executed',
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
        title="Transaction history"
        subtitle={
          selectedUserId
            ? 'Transactions for the selected account.'
            : 'Every execution on your account, newest first.'
        }
        breadcrumbs={[{ label: 'Account' }, { label: 'History' }]}
        actions={
          isAdmin && (
            <TextField
              select
              label="Viewing"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">My transactions</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username}
                </MenuItem>
              ))}
            </TextField>
          )
        }
      />

      {error ? (
        <ErrorState error={error} title="Could not load transactions" onRetry={loadTransactions} />
      ) : (
        <DataTable
          columns={columns}
          rows={transactions}
          loading={loading}
          emptyTitle="No transactions yet"
          emptyDescription="Completed trades will be listed here with their fees and totals."
          getRowKey={(row) => row.id}
          initialRowsPerPage={15}
        />
      )}
    </Box>
  );
}

