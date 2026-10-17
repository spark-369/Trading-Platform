/** Shared formatting helpers so numbers look identical everywhere in the app. */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

/** `1234.5` -> `"$1,234.50"`. Returns the fallback for null/NaN input. */
export const formatCurrency = (value, fallback = '—') => {
  const num = toNumber(value);
  return num === null ? fallback : currencyFormatter.format(num);
};

/** `1234.5` -> `"1,234.50"` (no symbol), useful for raw table cells. */
export const formatNumber = (value, decimals = 2, fallback = '—') => {
  const num = toNumber(value);
  if (num === null) return fallback;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/** `1234567` -> `"1.23M"`. Great for volume columns. */
export const formatCompact = (value, fallback = '—') => {
  const num = toNumber(value);
  return num === null ? fallback : compactFormatter.format(num);
};

/** `2.5` -> `"+2.50%"`. Always signed so direction is obvious. */
export const formatPercent = (value, decimals = 2, fallback = '—') => {
  const num = toNumber(value);
  if (num === null) return fallback;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
};

/** `200` -> `"$200.00 (+12.50%)"` style helper used in ticker rows. */
export const formatSignedCurrency = (value, fallback = '—') => {
  const num = toNumber(value);
  if (num === null) return fallback;
  const sign = num > 0 ? '+' : '';
  return `${sign}${currencyFormatter.format(num)}`;
};

/** ISO/epoch -> `"Mar 4, 2026"`. */
export const formatDate = (value, fallback = '—') => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** ISO/epoch -> `"Mar 4, 2026, 2:30 PM"`. */
export const formatDateTime = (value, fallback = '—') => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** `"2026-03-04T14:30:00"` -> `"just now"` / `"3h ago"` / `"Mar 4, 2026"`. */
export const formatRelative = (value, fallback = '—') => {
  const date = toDate(value);
  if (!date) return fallback;
  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 45) return 'just now';
  if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.round(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.round(diffSeconds / 86400)}d ago`;
  return formatDate(value, fallback);
};

/** Trims a float to a fixed number of decimals without a trailing `$`. */
export const formatQuantity = (value, decimals = 4, fallback = '—') => {
  const num = toNumber(value);
  if (num === null) return fallback;
  // Show meaningful precision without noise for whole numbers.
  const trimmed = Number.isInteger(num) ? num : Number(num.toFixed(decimals));
  return trimmed.toLocaleString('en-US', { maximumFractionDigits: decimals });
};

/** Uppercases and strips whitespace from a user entered ticker. */
export const normalizeSymbol = (symbol) => (symbol ?? '').trim().toUpperCase();

/** Direction of a change value: 'up' | 'down' | 'flat'. */
export const trendOf = (value) => {
  const num = toNumber(value);
  if (num === null || num === 0) return 'flat';
  return num > 0 ? 'up' : 'down';
};

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
