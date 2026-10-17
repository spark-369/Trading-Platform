import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Typography, Card, CardContent, Skeleton, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import PieChartIcon from '@mui/icons-material/PieChartRounded';
import ShowChartIcon from '@mui/icons-material/ShowChartRounded';
import SwapHorizIcon from '@mui/icons-material/SwapHorizRounded';
import PeopleIcon from '@mui/icons-material/PeopleAltRounded';
import ReceiptIcon from '@mui/icons-material/ReceiptLongRounded';
import StorefrontIcon from '@mui/icons-material/StorefrontRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded';
import {
  getPortfolioSummary,
  getAllMarketData,
  getOrders,
  getDashboardStats,
  getWalletBalance,
} from '../api';
import { useAuth } from '../context/AuthContext';
import PortfolioChart from '../components/PortfolioChart';
import PortfolioAllocation from '../components/PortfolioAllocation';
import {
  PageHeader,
  StatCard,
  TrendValue,
  StatusChip,
  SymbolChip,
  EmptyState,
  ErrorState,
  ChartSkeleton,
} from '../components/ui';
import { formatCurrency, formatNumber, formatCompact } from '../utils/format';

export default function Dashboard() {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole('ROLE_ADMIN');
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const [statsRes, marketRes] = await Promise.all([getDashboardStats(), getAllMarketData()]);
        setStats(statsRes);
        setMarketData(marketRes);
      } else {
        const [summaryRes, marketRes, ordersRes, walletRes] = await Promise.all([
          getPortfolioSummary(),
          getAllMarketData(),
          getOrders(),
          getWalletBalance(),
        ]);
        setSummary(summaryRes);
        setMarketData(marketRes);
        setOrders(ordersRes);
        setWallet(walletRes);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const movers = useMemo(
    () =>
      [...marketData]
        .filter((item) => item.changePercent !== null && item.changePercent !== undefined)
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 5),
    [marketData]
  );

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).slice(0, 6),
    [orders]
  );

  const activeOrders = orders.filter(
    (order) => order.orderStatus === 'PENDING' || order.orderStatus === 'PARTIALLY_FILLED'
  ).length;

  const firstName = user?.firstName || user?.username || 'there';

  const userStats = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(summary?.totalValue ?? 0),
      icon: <PieChartIcon />,
      tone: 'primary',
    },
    {
      label: 'Total P&L',
      value: formatCurrency(summary?.totalProfitLoss ?? 0),
      delta: summary?.totalProfitLossPercent ?? 0,
      icon: <TrendingUpIcon />,
      tone: (summary?.totalProfitLoss ?? 0) >= 0 ? 'success' : 'error',
    },
    {
      label: 'Available Cash',
      value: formatCurrency(wallet?.availableBalance ?? 0),
      icon: <AccountBalanceWalletIcon />,
      tone: 'info',
    },
    {
      label: 'Open Orders',
      value: formatNumber(activeOrders, 0),
      icon: <SwapHorizIcon />,
      tone: activeOrders > 0 ? 'warning' : 'primary',
    },
  ];

  const adminStats = [
    {
      label: 'Total Users',
      value: formatNumber(stats?.totalUsers ?? 0, 0),
      icon: <PeopleIcon />,
      tone: 'primary',
    },
    {
      label: 'Total Orders',
      value: formatNumber(stats?.totalOrders ?? 0, 0),
      icon: <SwapHorizIcon />,
      tone: 'warning',
    },
    {
      label: 'Transactions',
      value: formatNumber(stats?.totalTransactions ?? 0, 0),
      icon: <ReceiptIcon />,
      tone: 'success',
    },
    {
      label: 'Trading Volume',
      value: formatCurrency(stats?.totalTradingVolume ?? 0),
      icon: <TrendingUpIcon />,
      tone: 'primary',
    },
    {
      label: 'Wallet Balances',
      value: formatCurrency(stats?.totalWalletBalance ?? 0),
      icon: <AccountBalanceWalletIcon />,
      tone: 'info',
    },
    {
      label: 'Instruments',
      value: formatNumber(stats?.totalMarketData ?? 0, 0),
      icon: <StorefrontIcon />,
      tone: 'primary',
    },
    {
      label: 'Watchlists',
      value: formatNumber(stats?.totalWatchlists ?? 0, 0),
      icon: <StarIcon />,
      tone: 'secondary',
    },
    {
      label: 'Portfolios',
      value: formatNumber(stats?.totalPortfolios ?? 0, 0),
      icon: <PieChartIcon />,
      tone: 'info',
    },
  ];

  const cards = isAdmin ? adminStats : userStats;

  return (
    <Box>
      <PageHeader
        title={isAdmin ? 'Platform overview' : `Welcome back, ${firstName}`}
        subtitle={
          isAdmin
            ? 'Aggregate activity across every account on the platform.'
            : 'A snapshot of your positions, cash and latest market moves.'
        }
        actions={
          <>
            <Button variant="outlined" onClick={() => navigate('/market')}>
              Browse market
            </Button>
            {!isAdmin && (
              <Button variant="contained" onClick={() => navigate('/trade')}>
                Place order
              </Button>
            )}
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState error={error} title="Could not load your dashboard" onRetry={loadData} />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {cards.map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard {...card} loading={loading} />
            </Grid>
          ))}

          {!isAdmin && (
            <Grid size={{ xs: 12, lg: 8 }}>
              {loading ? <ChartSkeleton height={300} /> : <PortfolioChart summary={summary} />}
            </Grid>
          )}

          {!isAdmin && (
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              {loading ? <ChartSkeleton height={240} /> : <PortfolioAllocation summary={summary} />}
            </Grid>
          )}

          <Grid size={{ xs: 12, lg: isAdmin ? 7 : 8 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="h6">Recent orders</Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    onClick={() => navigate('/trade')}
                  >
                    View all
                  </Button>
                </Box>

                {loading ? (
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} height={40} />
                    ))}
                  </Stack>
                ) : recentOrders.length === 0 ? (
                  <EmptyState
                    title="No orders yet"
                    description="Your executed trades will appear here once you place your first order."
                    actionLabel={isAdmin ? undefined : 'Place an order'}
                    onAction={isAdmin ? undefined : () => navigate('/trade')}
                    compact
                  />
                ) : (
                  <Box sx={{ mt: 1.5 }}>
                    {recentOrders.map((order) => (
                      <Box
                        key={order.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                          '&:last-of-type': { borderBottom: 0 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <StatusChip status={order.orderType} />
                          <SymbolChip symbol={order.symbol} size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatNumber(order.quantity, 2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(order.price)}
                            </Typography>
                          </Box>
                          <StatusChip status={order.orderStatus} variant="outlined" />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: isAdmin ? 5 : 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
                >
                  <Typography variant="h6">Top movers</Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    onClick={() => navigate('/market')}
                  >
                    Market
                  </Button>
                </Box>

                {loading ? (
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} height={44} />
                    ))}
                  </Stack>
                ) : movers.length === 0 ? (
                  <EmptyState
                    title="No market data"
                    description="Instrument prices will show up here once market data is available."
                    icon={<ShowChartIcon />}
                    compact
                  />
                ) : (
                  <Box sx={{ mt: 1.5 }}>
                    {movers.map((item) => (
                      <Box
                        key={item.symbol}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                          '&:last-of-type': { borderBottom: 0 },
                        }}
                      >
                        <SymbolChip
                          symbol={item.symbol}
                          companyName={item.companyName}
                          size="small"
                        />
                        <TrendValue
                          value={item.currentPrice}
                          changePercent={item.changePercent}
                          size="body2"
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {isAdmin && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    Market snapshot
                  </Typography>
                  {loading ? (
                    <Skeleton height={60} />
                  ) : marketData.length === 0 ? (
                    <EmptyState title="No instruments" compact />
                  ) : (
                    <Grid container spacing={2}>
                      {marketData.slice(0, 4).map((item) => (
                        <Grid key={item.symbol} size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: 1,
                              borderColor: 'divider',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            <SymbolChip symbol={item.symbol} size="small" />
                            <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(item.currentPrice)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Vol {formatCompact(item.volume)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

