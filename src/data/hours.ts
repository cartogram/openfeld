// Tempelhof Feld opening hours
// Source: https://tempelhofer-feld.berlin.de
// Last verified: 2026-04-03
export type MonthEntry = {
  open: string;
  close: string;
  lateClose?: string;
  splitDay?: number;
};

export const HOURS: Record<number, MonthEntry> = {
  0: { open: "07:30", close: "17:00" }, // January
  1: { open: "07:00", close: "18:00" }, // February
  2: { open: "06:00", close: "19:00" }, // March
  3: { open: "06:00", close: "20:30" }, // April
  4: { open: "06:00", close: "21:30", lateClose: "22:00", splitDay: 16 }, // May: 9:30pm until 15th, 10pm from 16th
  5: { open: "06:00", close: "23:00" }, // June
  6: { open: "06:00", close: "23:00" }, // July
  7: { open: "06:00", close: "22:30" }, // August
  8: { open: "06:30", close: "21:30" }, // September
  9: { open: "07:00", close: "19:00" }, // October
  10: { open: "07:00", close: "18:00" }, // November
  11: { open: "07:30", close: "17:00" }, // December
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getCloseTime(entry: MonthEntry, day: number): string {
  if (entry.splitDay && day >= entry.splitDay && entry.lateClose) {
    return entry.lateClose;
  }
  return entry.close;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isOpen(date: Date): boolean {
  const entry = HOURS[date.getMonth()];
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = timeToMinutes(entry.open);
  const closeMinutes = timeToMinutes(getCloseTime(entry, date.getDate()));
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getTargetTime(
  date: Date,
  open: boolean,
): { target: Date; time: string } {
  const entry = HOURS[date.getMonth()];
  const target = new Date(date);

  if (open) {
    const closeTime = getCloseTime(entry, date.getDate());
    const [h, m] = closeTime.split(":").map(Number);
    target.setHours(h, m, 0, 0);
    return { target, time: closeTime };
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = timeToMinutes(entry.open);

  if (currentMinutes < openMinutes) {
    const [h, m] = entry.open.split(":").map(Number);
    target.setHours(h, m, 0, 0);
    return { target, time: entry.open };
  }

  // After closing — next opening is tomorrow
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEntry = HOURS[tomorrow.getMonth()];
  const [h, m] = tomorrowEntry.open.split(":").map(Number);
  tomorrow.setHours(h, m, 0, 0);
  return { target: tomorrow, time: tomorrowEntry.open };
}
