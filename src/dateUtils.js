// Meal plans work with calendar dates written as "YYYY-MM-DD". Everything here is done in UTC
// on purpose, so a date never shifts by a day because of the viewer's time zone.
const pad = (number) => String(number).padStart(2, "0");

// Today's date in the viewer's own calendar.
export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Every date from start to end, both included (capped, in case of bad data).
export function eachDay(startIso, endIso, cap = 62) {
  const days = [];
  for (let day = startIso; day <= endIso && days.length < cap; day = addDays(day, 1)) days.push(day);
  return days;
}

export function formatDay(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatRange(startIso, endIso) {
  return `${formatDay(startIso)} – ${formatDay(endIso)}`;
}
