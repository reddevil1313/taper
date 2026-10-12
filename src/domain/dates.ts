import type { ISODate } from "./types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Dates are handled as UTC midnights so arithmetic never trips over time zones. */
export function toDate(d: ISODate): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: ISODate, n: number): ISODate {
  return toISO(new Date(toDate(d).getTime() + n * 864e5));
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / 864e5);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(d: ISODate): number {
  return toDate(d).getUTCDay();
}

export function isWeekend(d: ISODate): boolean {
  const w = weekday(d);
  return w === 0 || w === 6;
}

export function range(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function fmtDay(d: ISODate): string {
  const x = toDate(d);
  return `${DOW[x.getUTCDay()]} ${x.getUTCDate()} ${MON[x.getUTCMonth()]}`;
}

export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h < 12 ? "am" : "pm";
  return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}

export function addMinutes(t: string, mins: number): string {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Today's date in a given IANA time zone. */
export function todayIn(tz = "Asia/Singapore", now = new Date()): ISODate {
  try {
    return now.toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    return toISO(now);
  }
}
