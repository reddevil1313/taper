import { generatePlan } from "../domain/generator";
import { defaultProfile as p } from "../domain/profile";
import { wallpaperContent, wallpaperDays } from "./content";

const plan = generatePlan(p, { from: "2026-10-12" });

describe("wallpaper content", () => {
  it("covers every day to the race", () => {
    expect(wallpaperDays("2026-10-12", p.race.date)).toHaveLength(55);
  });
  it("shows the haze swap for outdoor runs", () => {
    const long = plan.find((s) => s.run?.type === "long")!;
    const c = wallpaperContent(long.date, plan, p);
    expect(c.blocks[0].lines.some((l) => l.haze)).toBe(true);
  });
  it("points to the next session on rest days", () => {
    const busy = new Set(plan.map((s) => s.date));
    const rest = wallpaperDays("2026-10-12", p.race.date).find((d) => !busy.has(d))!;
    const c = wallpaperContent(rest, plan, p);
    expect(c.blocks[0].title).toBe("Rest day");
    expect(c.blocks[0].lines[0].text).toMatch(/^Next:/);
  });
  it("marks race day", () => {
    const c = wallpaperContent(p.race.date, plan, p);
    expect(c.daysToGo).toBe(0);
    expect(c.blocks[0].race).toBe(true);
  });
});
