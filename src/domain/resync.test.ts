import { generatePlan } from "./generator";
import { defaultProfile as p } from "./profile";
import { resync, historyFrom } from "./resync";
import type { Log } from "./types";

const original = generatePlan(p, { from: "2026-10-05" });
const firstQuality = original.find((s) => s.run?.type === "tempo" || s.run?.type === "intervals")!;

describe("resync", () => {
  const firstLong = original.find((s) => s.run?.type === "long")!;
  const log: Log = {
    [firstQuality.id]: { done: true, km: 5, pace: "7:15", at: 1 },
    [firstLong.id]: { skipped: true, at: 2 },
  };

  it("reads history from the log", () => {
    const h = historyFrom(original, log);
    expect(h.lastLongKm).toBeUndefined();
    expect(h.temposDone! + h.repsDone!).toBe(1);
  });

  it("keeps the past and re-plans the future from today", () => {
    const r = resync(p, original, log, "2026-10-12");
    expect(r.from).toBe("2026-10-12");
    expect(r.plan.filter((s) => s.date < "2026-10-12")).toHaveLength(original.filter((s) => s.date < "2026-10-12").length);
    const nextLong = r.plan.find((s) => s.date >= "2026-10-12" && s.run?.type === "long")!;
    expect(nextLong.run!.km).toBe(8);
  });

  it("moves a session done on a different day", () => {
    const upper = original.find((s) => s.date < "2026-10-12" && s.lift)!;
    const moved: Log = { ...log, [upper.id]: { done: true, doneOn: "2026-10-07", at: 3 } };
    const r = resync(p, original, moved, "2026-10-12");
    expect(r.plan.find((s) => s.id === upper.id)!.date).toBe("2026-10-07");
  });

  it("starts tomorrow when today is already settled", () => {
    const today = original.find((s) => s.date >= "2026-10-12")!;
    const r = resync(p, original, { ...log, [today.id]: { done: true, at: 4 } }, today.date);
    expect(r.from > today.date).toBe(true);
    expect(r.plan.some((s) => s.id === today.id)).toBe(true);
  });

  it("reports what changed", () => {
    const r = resync(p, original, log, "2026-10-12");
    expect(r.diff.added.length + r.diff.changed.length + r.diff.removed.length).toBeGreaterThan(0);
    expect(new Set(r.plan.map((s) => s.id)).size).toBe(r.plan.length);
  });
});
