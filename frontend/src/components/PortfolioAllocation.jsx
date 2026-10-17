import { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Tooltip as MuiTooltip } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@mui/material/styles';
import DonutLargeIcon from '@mui/icons-material/DonutLargeRounded';
import EmptyState from './ui/EmptyState';
import { formatCurrency, formatPercent } from '../utils/format';

/** Distinct, colour-blind friendly palette that works in both themes. */
const palette = ['#2563eb', '#0891b2', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0ea5e9', '#65a30d'];

/** Donut chart breaking down portfolio value by symbol. */
export default function PortfolioAllocation({ summary }) {
  const theme = useTheme();

  const slices = useMemo(() => {
    const holdings = summary?.holdings ?? [];
    const total = holdings.reduce((sum, h) => sum + Number(h.currentValue ?? 0), 0);
    if (total <= 0) return [];

    return holdings
      .map((holding, index) => ({
        name: holding.symbol,
        value: Number(holding.currentValue ?? 0),
        percent: (Number(holding.currentValue ?? 0) / total) * 100,
        color: palette[index % palette.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [summary]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6">Allocation</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Share of portfolio value by symbol
        </Typography>

        {slices.length === 0 ? (
          <EmptyState
            title="Nothing to allocate"
            description="Buy an instrument to see how your portfolio is distributed."
            icon={<DonutLargeIcon />}
            compact
          />
        ) : (
          <>
            <Box sx={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 1 }}>
              {slices.slice(0, 5).map((slice) => (
                <Box
                  key={slice.name}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.6 }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '3px',
                      bgcolor: slice.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 52 }}>
                    {slice.name}
                  </Typography>
                  <Box sx={{ flexGrow: 1, borderBottom: 1, borderColor: 'divider', borderStyle: 'dotted' }} />
                  <MuiTooltip title={formatCurrency(slice.value)}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPercent(slice.percent)}
                    </Typography>
                  </MuiTooltip>
                </Box>
              ))}
              {slices.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  +{slices.length - 5} more
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
