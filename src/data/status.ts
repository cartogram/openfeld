import { isOpen, getTargetTime } from "./hours.js";

function padTime(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDurationFromMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${padTime(h)}:${padTime(m)}:${padTime(s)}`;
}

export interface StatusResult {
  status: "open" | "closed";
  closes_at?: string;
  opens_at?: string;
  time_remaining: string;
}

export function getStatus(date: Date): StatusResult {
  // Convert to Berlin timezone (Europe/Berlin)
  const berlinTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Europe/Berlin" }),
  );
  const open = isOpen(berlinTime);
  const { target, time } = getTargetTime(berlinTime, open);

  if (open) {
    return {
      status: "open",
      closes_at: time,
      time_remaining: formatDurationFromMs(target.getTime() - date.getTime()),
    };
  }

  return {
    status: "closed",
    opens_at: time,
    time_remaining: formatDurationFromMs(target.getTime() - date.getTime()),
  };
}
