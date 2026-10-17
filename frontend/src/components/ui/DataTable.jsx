import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Card,
} from '@mui/material';
import EmptyState from './EmptyState';
import { TableSkeleton } from './LoadingState';

/**
 * Single table implementation used by every list screen so columns, loading,
 * empty and pagination behaviour stay consistent.
 *
 * `columns` is a list of:
 *   { key, label, align?, width?, render?(row), sortable? }
 */
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  getRowKey = (row, index) => row.id ?? index,
  onRowClick,
  initialRowsPerPage = 10,
  paginate = true,
  dense = false,
  maxHeight,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const pagedRows = useMemo(() => {
    if (!paginate) return rows;
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage, paginate]);

  if (loading) {
    return (
      <Card>
        <TableSkeleton rows={6} columns={columns.length} />
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
          compact
        />
      </Card>
    );
  }

  return (
    <Card>
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader={Boolean(maxHeight)} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align ?? 'left'}
                  sx={{ width: column.width }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map((row, index) => (
              <TableRow
                key={getRowKey(row, index)}
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align ?? 'left'}>
                    {column.render ? column.render(row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {paginate && rows.length > 5 && (
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(event, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ '.MuiTablePagination-toolbar': { minHeight: 52 } }}
          />
        </Box>
      )}
    </Card>
  );
}
