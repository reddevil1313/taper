import { addDays, diffDays } from "./dates";
import { dayInfo } from "./duty";
import { generatePlan } from "./generator";
import { defaultProfile as p } from "./profile";

const plan = generatePlan(p, { from: "2026-10-12", history: { lastLongKm: 10, lastLongOn: "2026-09-05", temposDone: 1 } });
const ctx = (d: string) => dayInfo(p, d).context;
const longs = plan.filter((s) => s.run?.type === "long");

describe("generatePlan", () => {
  it("ends with the race", () => {
    const last = plan[plan.length - 1];
    expect(last).toMatchObject({ date: "2026-12-05", kind: "race" });
  });

  it("puts long runs only on out-of-camp days", () => {
    for (const s of longs) expect(ctx(s.date)).toBe("out");
  });

  it("restarts a stale ladder at 8 km and builds to a peak two to three weeks out", () => {
    expect(longs.map((s) => s.run!.km)).toEqual([8, 10, 12, 14, 11, 16, 18, 12]);
    const peak = longs.find((s) => s.title.includes("peak"))!;
    expect(diffDays(p.race.date, peak.date)).toBeGreaterThanOrEqual(14);
    expect(diffDays(p.race.date, peak.date)).toBeLessThanOrEqual(20);
  });

  it("continues a fresh ladder from the last long run", () => {
    const fresh = generatePlan(p, { from: "2026-10-12", history: { lastLongKm: 8, lastLongOn: "2026-10-09" } });
    expect(fresh.find((s) => s.run?.type === "long")!.run!.km).toBe(10);
  });

  it("never schedules a run on a weekend camp day", () => {
    for (const s of plan) if (ctx(s.date) === "camp-weekend") expect(s.run).toBeUndefined();
  });

  it("keeps quality and heavy legs off the day after a long run", () => {
    const longDates = new Set(longs.map((s) => s.date));
    for (const s of plan) {
      if (s.run?.type === "tempo" || s.run?.type === "intervals" || s.lift === "legs") {
        expect(longDates.has(addDays(s.date, -1))).toBe(false);
      }
    }
  });

  it("stops heavy legs 18 days out and tapers", () => {
    const cutoff = addDays(p.race.date, -18);
    for (const s of plan) if (s.lift === "legs") expect(s.date <= cutoff).toBe(true);
    const lastWeek = plan.filter((s) => diffDays(p.race.date, s.date) <= 7 && s.run && s.kind !== "race");
    for (const s of lastWeek) expect(["race-pace", "easy", "long"]).toContain(s.run!.type);
  });

  it("gives every outdoor training run a treadmill alternative", () => {
    for (const s of plan) if (s.run && s.kind !== "race") expect(s.run.treadmill).toBeTruthy();
  });

  it("uses unique ids", () => {
    expect(new Set(plan.map((s) => s.id)).size).toBe(plan.length);
  });
});
