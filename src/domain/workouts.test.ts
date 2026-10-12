import { zonesFor, kmh, parsePace, speedRange } from "./paces";
import { workouts } from "./workouts";

describe("paces", () => {
  const z = zonesFor("2:30:00", 21.1);
  it("anchors race pace slightly under goal pace", () => {
    expect(z.race).toBe(parsePace("7:00"));
  });
  it("derives the plan's zones", () => {
    expect(speedRange(z.easy)).toBe("7.5-8.0 km/h");
    expect(speedRange(z.tempo)).toBe("8.9-9.1 km/h");
    expect(speedRange(z.rep800)).toBe("9.7-10.0 km/h");
    expect(kmh(z.race)).toBe("8.6");
  });
});

describe("workouts", () => {
  const w = workouts(zonesFor("2:30:00", 21.1));
  it("counts interval distance including recoveries", () => {
    expect(w.reps800(5).km).toBe(8.1);
    expect(w.reps1k(4).km).toBe(7.7);
  });
  it("gives every training run a treadmill version", () => {
    for (const r of [w.tempo(3), w.reps800(4), w.long(8), w.easy(4, true), w.racePace(3)]) {
      expect(r.treadmill).toMatch(/km\/h/);
    }
  });
  it("adds fuelling to longer long runs", () => {
    expect(w.long(10).detail).not.toMatch(/gel/i);
    expect(w.long(12).detail).toMatch(/gel/i);
  });
});
