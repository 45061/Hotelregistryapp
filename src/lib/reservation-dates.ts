const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function createLocalDateFromDayString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return new Date(value);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

export function parseReservationDate(value: string | Date) {
  return startOfDay(value instanceof Date ? value : createLocalDateFromDayString(value));
}

export function normalizeStoredReservationDate(value: string | Date) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return startOfDay(createLocalDateFromDayString(value));
  }

  const date = value instanceof Date ? value : new Date(value);
  return startOfDay(
    new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function formatReservationDateInput(value: Date | string) {
  const date = startOfDay(value instanceof Date ? value : createLocalDateFromDayString(value));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDayKey(date: Date) {
  return formatReservationDateInput(date);
}

export function getDayDiff(startDate: Date, endDate: Date) {
  return Math.max(
    1,
    Math.ceil(
      (startOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / DAY_IN_MS
    )
  );
}

export function getDayOffset(startDate: Date, targetDate: Date) {
  return Math.max(
    0,
    Math.floor(
      (startOfDay(targetDate).getTime() - startOfDay(startDate).getTime()) / DAY_IN_MS
    )
  );
}

export function overlapsRange(
  checkIn: Date,
  checkOut: Date,
  rangeStart: Date,
  rangeEnd: Date
) {
  return checkIn < rangeEnd && checkOut > rangeStart;
}

export { DAY_IN_MS };
