import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Grid, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import PeopleIcon from '@mui/icons-material/PeopleAltRounded';
import SwapHorizIcon from '@mui/icons-material/SwapHorizRounded';
import ReceiptIcon from '@mui/icons-material/ReceiptLongRounded';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import { useSnackbar } from 'notistack';
import { getAllUsers, deleteUser, getDashboardStats } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, DataTable, ConfirmDialog, ErrorState } from '../components/ui';
import { formatCurrency, formatNumber, formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

export default function Users() {
  const { hasRole, user: currentUser } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const { enqueueSnackbar } = useSnackbar();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, statsData] = await Promise.all([getAllUsers(), getDashboardStats()]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      enqueueSnackbar(`${deleteTarget.username} deleted`, { variant: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to delete user'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const cards = useMemo(
    () => [
      { label: 'Total users', value: formatNumber(stats?.totalUsers ?? 0, 0), icon: <PeopleIcon />, tone: 'primary' },
      { label: 'Total orders', value: formatNumber(stats?.totalOrders ?? 0, 0), icon: <SwapHorizIcon />, tone: 'warning' },
      { label: 'Transactions', value: formatNumber(stats?.totalTransactions ?? 0, 0), icon: <ReceiptIcon />, tone: 'success' },
      {
        label: 'Aggregate balance',
        value: formatCurrency(stats?.totalWalletBalance ?? 0),
        icon: <AccountBalanceWalletIcon />,
        tone: 'info',
      },
    ],
    [stats]
  );

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        width: 70,
        render: (row) => (
          <Typography variant="caption" color="text.secondary">
            #{row.id}
          </Typography>
        ),
      },
      {
        key: 'username',
        label: 'User',
        render: (row) => (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {[row.firstName, row.lastName].filter(Boolean).join(' ') || row.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.username}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        render: (row) => (
          <Typography variant="body2" color="text.secondary">
            {row.email}
          </Typography>
        ),
      },
      {
        key: 'roles',
        label: 'Roles',
        render: (row) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(row.roles ?? []).map((role) => (
              <Chip
                key={role}
                size="small"
                label={role === 'ROLE_ADMIN' ? 'Admin' : 'Trader'}
                color={role === 'ROLE_ADMIN' ? 'secondary' : 'default'}
                variant={role === 'ROLE_ADMIN' ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        ),
      },
      {
        key: 'enabled',
        label: 'Status',
        render: (row) => (
          <Chip
            size="small"
            label={row.enabled ? 'Active' : 'Disabled'}
            color={row.enabled ? 'success' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        key: 'createdAt',
        label: 'Joined',
        align: 'right',
        render: (row) => (
          <Typography variant="caption" color="text.secondary">
            {formatDate(row.createdAt)}
          </Typography>
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        width: 60,
        render: (row) => {
          const isSelf = row.id === currentUser?.userId;
          return (
            <Tooltip title={isSelf ? 'You cannot delete your own account' : 'Delete user'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isSelf}
                  onClick={() => setDeleteTarget(row)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [currentUser?.userId]
  );

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage accounts, roles and platform activity."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Users' }]}
      />

      {error ? (
        <ErrorState error={error} title="Could not load users" onRetry={loadData} />
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {cards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard {...card} loading={loading} />
              </Grid>
            ))}
          </Grid>

          <DataTable
            columns={columns}
            rows={users}
            loading={loading}
            emptyTitle="No users found"
            getRowKey={(row) => row.id}
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        description={
          deleteTarget
            ? `${deleteTarget.username} and all of their wallets, orders, transactions, portfolios and watchlists will be permanently removed.`
            : ''
        }
        confirmLabel="Delete user"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}

