import { addDays, diffDays, fmtDay, fmtTime, isWeekend, range, addMinutes } from "./dates";

describe("dates", () => {
  it("adds and diffs days across month ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(diffDays("2026-12-05", "2026-10-12")).toBe(54);
  });
  it("knows weekends", () => {
    expect(isWeekend("2026-10-17")).toBe(true);
    expect(isWeekend("2026-10-12")).toBe(false);
  });
  it("formats", () => {
    expect(fmtDay("2026-10-12")).toBe("Mon 12 Oct");
    expect(fmtTime("15:00")).toBe("3pm");
    expect(fmtTime("07:30")).toBe("7:30am");
    expect(addMinutes("15:00", 90)).toBe("16:30");
  });
  it("builds inclusive ranges", () => {
    expect(range("2026-10-12", "2026-10-14")).toEqual(["2026-10-12", "2026-10-13", "2026-10-14"]);
  });
});
