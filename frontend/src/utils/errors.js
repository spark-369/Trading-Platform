/**
 * Turns anything thrown by the API layer into a message that is safe to show.
 * The backend error contract is: { status, error, message, path, fieldErrors }.
 */

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  const data = error.response?.data;

  // Field level validation errors take priority: they are the most actionable.
  if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
    const entries = Object.entries(data.fieldErrors);
    if (entries.length > 0) {
      return entries.map(([field, message]) => `${humanize(field)}: ${message}`).join(' · ');
    }
  }

  if (data?.message) return data.message;
  if (error.message) return error.message;
  return fallback;
}

/** Maps field names to a friendlier label for error messages. */
function humanize(field) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** True when the failure was a network/offline problem rather than a 4xx/5xx. */
export function isNetworkError(error) {
  return Boolean(error) && !error.response && Boolean(error.request);
}

/** Status code of the failure, or null if there was no HTTP response. */
export function getStatus(error) {
  return error?.response?.status ?? null;
}
