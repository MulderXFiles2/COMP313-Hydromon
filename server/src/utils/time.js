/**
 * time.js
 *
 * Utility functions for working with timestamps and time ranges.
 * Shared helpers for parsing, formatting, and comparing dates.
 */
export function getCurrentHHMMInZone(now = new Date(), timeZone = "UTC") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

export function getCurrentDayOfWeekInZone(now = new Date(), timeZone = "UTC") {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(now);

  const map = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday];
}