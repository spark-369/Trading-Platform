import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Grid, TextField, MenuItem, Typography } from '@mui/material';
import {
  getPortfolioSummary,
  getPortfolio,
  getPortfolioSummaryByUser,
  getPortfolioByUser,
  getAllUsers,
} from '../api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader,
  StatCard,
  DataTable,
  TrendValue,
  SymbolChip,
  ErrorState,
} from '../components/ui';
import { formatCurrency, formatNumber } from '../utils/format';

export default function Portfolio() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin && selectedUserId) {
        const [summaryData, holdingsData] = await Promise.all([
          getPortfolioSummaryByUser(selectedUserId),
          getPortfolioByUser(selectedUserId),
        ]);
        setSummary(summaryData);
        setHoldings(holdingsData);
      } else {
        const [summaryData, holdingsData] = await Promise.all([
          getPortfolioSummary(),
          getPortfolio(),
        ]);
        setSummary(summaryData);
        setHoldings(holdingsData);
      }
    } catch (err) {
      setError(err);
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

  const stats = useMemo(
    () => [
      {
        label: 'Market value',
        value: formatCurrency(summary?.totalValue ?? 0),
        tone: 'primary',
      },
      {
        label: 'Cost basis',
        value: formatCurrency(summary?.totalCost ?? 0),
        tone: 'info',
      },
      {
        label: 'Unrealised P&L',
        value: formatCurrency(summary?.totalProfitLoss ?? 0),
        delta: summary?.totalProfitLossPercent ?? 0,
        tone: (summary?.totalProfitLoss ?? 0) >= 0 ? 'success' : 'error',
      },
      {
        label: 'Positions',
        value: formatNumber(holdings.length, 0),
        tone: 'primary',
      },
    ],
    [summary, holdings.length]
  );

  const columns = useMemo(
    () => [
      {
        key: 'symbol',
        label: 'Instrument',
        width: 200,
        render: (row) => <SymbolChip symbol={row.symbol} />,
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
        key: 'avgBuyPrice',
        label: 'Avg cost',
        align: 'right',
        render: (row) => formatCurrency(row.avgBuyPrice),
      },
      {
        key: 'currentValue',
        label: 'Market value',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(row.currentValue)}
          </Typography>
        ),
      },
      {
        key: 'profitLoss',
        label: 'P&L',
        align: 'right',
        render: (row) => (
          <TrendValue value={row.profitLoss} changePercent={row.profitLossPercent} size="body2" />
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Portfolio"
        subtitle={
          selectedUserId
            ? 'Holdings for the selected account.'
            : 'Your current positions, cost basis and unrealised profit or loss.'
        }
        actions={
          isAdmin && (
            <TextField
              select
              label="View portfolio for"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">My portfolio</MenuItem>
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
        <ErrorState error={error} title="Could not load portfolio" onRetry={loadData} />
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {stats.map((stat) => (
              <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard {...stat} loading={loading} />
              </Grid>
            ))}
          </Grid>

          <DataTable
            columns={columns}
            rows={holdings}
            loading={loading}
            emptyTitle="No holdings yet"
            emptyDescription="Buy an instrument from the Trade page and it will show up here."
            getRowKey={(row) => row.symbol}
          />
        </>
      )}
    </Box>
  );
}

