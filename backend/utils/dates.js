// Meal plans use calendar dates (no time of day). They travel as "YYYY-MM-DD" strings and are
// stored in DATE columns; Date objects here are always UTC midnight so time zones never shift a day.
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateOnly(text) {
  return new Date(`${text}T00:00:00.000Z`);
}

export function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

// Number of days from start to end, both included.
export function inclusiveDayCount(start, end) {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}
