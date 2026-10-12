import { initialState, reducer } from "./reducer";
import { parseBackup } from "./storage";

describe("reducer", () => {
  it("seeds a full plan", () => {
    const s = initialState();
    expect(s.plan.length).toBeGreaterThan(30);
    expect(s.plan[s.plan.length - 1].kind).toBe("race");
  });
  it("merges log patches", () => {
    let s = initialState();
    const id = s.plan[0].id;
    s = reducer(s, { type: "log", id, patch: { done: true, km: 5 } });
    s = reducer(s, { type: "log", id, patch: { note: "felt good" } });
    expect(s.log[id]).toMatchObject({ done: true, km: 5, note: "felt good" });
  });
  it("round-trips a backup and rejects junk", () => {
    const s = initialState();
    expect(parseBackup(JSON.stringify(s)).plan).toHaveLength(s.plan.length);
    expect(() => parseBackup("nope")).toThrow(/valid JSON/);
    expect(() => parseBackup("{}")).toThrow(/Taper backup/);
  });
});
