import { Box, Skeleton, Card, CardContent, Stack } from '@mui/material';

/** Skeleton shown while a full page's initial data is loading. */
export function PageSkeleton() {
  return (
    <Box>
      <Skeleton width={180} height={38} />
      <Skeleton width={280} height={20} sx={{ mb: 3 }} />
      <CardGridSkeleton count={4} />
    </Box>
  );
}

/** Responsive grid of stat-card shaped skeletons. */
export function CardGridSkeleton({ count = 4 }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: `repeat(${Math.min(count, 4)}, minmax(0, 1fr))`,
        },
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Skeleton width="45%" height={18} />
            <Skeleton width="75%" height={36} sx={{ mt: 1 }} />
            <Skeleton width="35%" height={16} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

/** Placeholder rows that mimic a data table while it loads. */
export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <Stack spacing={1.25} sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              height={22}
              sx={{ flex: colIndex === 0 ? 1.4 : 1 }}
            />
          ))}
        </Box>
      ))}
    </Stack>
  );
}

/** Single card placeholder, used for charts and detail panels. */
export function ChartSkeleton({ height = 300 }) {
  return (
    <Card>
      <CardContent>
        <Skeleton width={160} height={22} />
        <Skeleton variant="rounded" height={height} sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );
}

export default PageSkeleton;
