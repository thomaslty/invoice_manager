/**
 * Invoice dates are entered through a calendar picker, which always writes the
 * display format `d MMMM, yyyy` (e.g. "30 September, 2022") into json_data.
 * That string is what the PDF and preview render, so it stays untouched.
 *
 * The indexed `invoices.date` column is a separate, derived sort key and holds
 * ISO `YYYY-MM-DD` so SQLite orders and range-filters it correctly. This module
 * is the single place that converts one into the other — both at save time and
 * in the backfill migration.
 *
 * The extra accepted spellings exist only for invoices saved before the picker
 * replaced the free-text field.
 */

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DAY_FIRST = /^(\d{1,2})\s+([a-z]+)\s*,?\s*(\d{4})$/;
const MONTH_FIRST = /^([a-z]+)\s+(\d{1,2})\s*,?\s*(\d{4})$/;

/** Format y/m/d as ISO, or null if it is not a real calendar date. */
function iso(year, month, day) {
  if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  // Rejects 31 February and friends: Date rolls them over to the next month.
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  const pad = (n, width) => String(n).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/**
 * Convert a displayed invoice date to an ISO sort key.
 *
 * Returns null when the value is empty or cannot be read without guessing.
 * Purely numeric dates such as "01/02/2026" are deliberately rejected — there
 * is no way to tell 1 February from 2 January, and a wrong date is worse than
 * no date. Passing an ISO date back in returns it unchanged, so callers can run
 * this over the same data repeatedly.
 */
export function toIsoDate(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!text) return null;

  const isoMatch = text.match(ISO);
  if (isoMatch) {
    return iso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const dayFirst = text.match(DAY_FIRST);
  if (dayFirst) {
    const month = MONTHS[dayFirst[2]];
    if (!month) return null;
    return iso(Number(dayFirst[3]), month, Number(dayFirst[1]));
  }

  const monthFirst = text.match(MONTH_FIRST);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1]];
    if (!month) return null;
    return iso(Number(monthFirst[3]), month, Number(monthFirst[2]));
  }

  return null;
}
