import { addMinutes } from "./dates";
import type { Session } from "./types";

/** RFC 5545 text escaping. */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets are folded with CRLF + space. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

const stamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;

export function describe(s: Session, treadmill = false): string {
  const parts: string[] = [];
  if (s.run) {
    parts.push("Run: " + (treadmill && s.run.treadmill ? s.run.treadmill : s.run.detail));
    if (!treadmill && s.run.treadmill && s.where === "out") parts.push("HAZE (PSI over 100)? " + s.run.treadmill);
  }
  if (s.liftDetail) parts.push((s.run ? "Then " : "") + s.liftDetail);
  if (s.note) parts.push(s.note);
  return parts.join("\n\n");
}

/** Calendar file for Apple or Google Calendar. Times are floating local times in the given zone. */
export function toICS(sessions: Session[], opts: { tz?: string; prefix?: string; now?: Date } = {}): string {
  const tz = opts.tz ?? "Asia/Singapore";
  const prefix = opts.prefix ?? "[HM] ";
  const now = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Taper//Training plan//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc("Training plan")}`];
  for (const s of sessions) {
    const end = addMinutes(s.start, s.mins);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@taper`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${tz}:${stamp(s.date, s.start)}`,
      `DTEND;TZID=${tz}:${stamp(s.date, end)}`,
      fold(`SUMMARY:${esc(prefix + s.title)}`),
      fold(`DESCRIPTION:${esc(describe(s))}`),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
