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
