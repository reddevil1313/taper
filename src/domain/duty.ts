import { diffDays, isWeekend } from "./dates";
import type { DayInfo, ISODate, Profile } from "./types";

/**
 * Where a day falls in the roster.
 *
 * The cycle starts on a book-in day (offset 0): out of camp until book-in in the evening.
 * Offsets 1..daysIn are in camp, the last of them booking out in the evening.
 * The remaining offsets are out of camp, and the next cycle's offset 0 is the next book-in.
 */
export function dayInfo(profile: Profile, date: ISODate): DayInfo {
  const { anchorBookIn, daysIn, daysOut } = profile.duty;
  const len = daysIn + daysOut;
  const off = ((diffDays(date, anchorBookIn) % len) + len) % len;

  if (onLeave(profile, date)) return { date, context: "leave", bookIn: false, bookOut: false };

  const inCamp = off >= 1 && off <= daysIn;
  if (inCamp) {
    return {
      date,
      context: isWeekend(date) ? "camp-weekend" : "camp-weekday",
      bookIn: false,
      bookOut: off === daysIn,
    };
  }
  return { date, context: "out", bookIn: off === 0, bookOut: false };
}

/** A day counts as leave when leave covers the usable part of it (06:00 to 20:00). */
export function onLeave(profile: Profile, date: ISODate): boolean {
  return profile.leaves.some((l) => l.from <= `${date}T06:00` && l.to >= `${date}T20:00`);
}

export function isCamp(info: DayInfo): boolean {
  return info.context === "camp-weekday" || info.context === "camp-weekend";
}

/** Has a treadmill or roads available for a run. */
export function canRun(info: DayInfo): boolean {
  return info.context !== "camp-weekend";
}

/** Has a full gym (barbells, machines). */
export function hasFullGym(info: DayInfo): boolean {
  return info.context === "camp-weekday" || info.context === "out" || info.context === "leave";
}
