import { toICS } from "./ics";
import type { Session } from "./types";

const s: Session = {
  id: "2026-10-16-a", date: "2026-10-16", start: "07:00", mins: 70, title: "Long run 8 km", where: "out",
  run: { type: "long", km: 8, detail: "Easy, 7:30-8:00/km; carry water.", treadmill: "Treadmill at 1% incline: 8 km at 7.5-8.0 km/h." },
};

describe("toICS", () => {
  const ics = toICS([s], { now: new Date("2026-10-12T00:00:00Z") });
  it("writes a valid event", () => {
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART;TZID=Asia/Singapore:20261016T070000");
    expect(ics).toContain("DTEND;TZID=Asia/Singapore:20261016T081000");
    expect(ics).toContain("SUMMARY:[HM] Long run 8 km");
    expect(ics).toContain("UID:2026-10-16-a@taper");
  });
  it("escapes and folds text", () => {
    expect(ics).toContain("7:30-8:00/km\; carry water.");
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });
});
