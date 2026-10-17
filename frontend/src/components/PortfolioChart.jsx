import { useMemo } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import ShowChartIcon from '@mui/icons-material/ShowChartRounded';
import EmptyState from './ui/EmptyState';
import { formatCurrency } from '../utils/format';

/**
 * Portfolio value across the current holdings.
 *
 * The API exposes current positions (quantity, average buy price, market value)
 * but no historical series, so this plots each holding's cumulative contribution
 * to total value rather than fabricating a fake time series. Every point is
 * derived from real data.
 */
export default function PortfolioChart({ summary }) {
  const theme = useTheme();

  const { data, totalValue, isPositive } = useMemo(() => {
    const holdings = summary?.holdings ?? [];
    let running = 0;

    const points = holdings.map((holding) => {
      running += Number(holding.currentValue ?? 0);
      return {
        label: holding.symbol,
        value: Number(running.toFixed(2)),
      };
    });

    return {
      data: points,
      totalValue: Number(summary?.totalValue ?? 0),
      isPositive: Number(summary?.totalProfitLoss ?? 0) >= 0,
    };
  }, [summary]);

  const stroke = isPositive ? theme.palette.success.main : theme.palette.error.main;
  const gradientId = isPositive ? 'plGradientUp' : 'plGradientDown';

  if (data.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6">Portfolio value</Typography>
          <EmptyState
            title="No holdings yet"
            description="Once you buy your first instrument, its contribution to your portfolio value will be charted here."
            icon={<ShowChartIcon />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography variant="h6">Portfolio value</Typography>
            <Typography variant="body2" color="text.secondary">
              Cumulative market value across your holdings
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(totalValue)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.length} holding{data.length === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%', height: 300, mt: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
                width={76}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [formatCurrency(value), 'Cumulative value']}
                labelFormatter={(label) => `Symbol: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, strokeWidth: 0, fill: stroke }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

