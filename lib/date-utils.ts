/**
 * Date helpers for the calendar.
 *
 * We don't pull a heavyweight date library for Phase 1C — the calendar
 * math is simple and local. If we later need locale-aware week starts
 * or timezones, swap these for date-fns / luxon equivalents.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Return a new Date with the time zeroed to local midnight. */
export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** True if two dates fall on the same calendar day (local time). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Return a Date at the start of the week containing `d`.
 * Week starts on Monday (runners schedule Mon–Sun, per most training plans).
 */
export function startOfWeek(d: Date): Date {
  const start = startOfDay(d);
  const day = start.getDay(); // 0 = Sunday
  const mondayOffset = (day + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

/** Add N days to a date (returns a new Date). */
export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** Return the 7 dates of the week containing `d`, Mon → Sun. */
export function getWeekDays(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Return the grid of days for a month view: 6 rows × 7 columns, padded
 * with leading/trailing days from the adjacent months so the grid is
 * always complete.
 */
export function getMonthGrid(d: Date): Date[] {
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Format as "YYYY-MM-DD" (matches Postgres `date` column). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a "YYYY-MM-DD" string as a local date (not UTC). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatMonth(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayNum(d: Date): string {
  return String(d.getDate());
}

export function formatWeekdayShort(dayIndex: number): string {
  // dayIndex: 0 = Mon, 6 = Sun (matches our Mon-first week)
  return WEEKDAY_SHORT[dayIndex] ?? "";
}

export function formatLongDate(d: Date): string {
  return `${WEEKDAY_SHORT[(d.getDay() + 6) % 7]}, ${
    MONTH_NAMES[d.getMonth()]
  } ${d.getDate()}`;
}

/** Milliseconds between two dates, unsigned. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / DAY_MS);
}
