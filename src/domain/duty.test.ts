import { dayInfo } from "./duty";
import { defaultProfile as p } from "./profile";

const ctx = (d: string) => dayInfo(p, d);

describe("duty roster", () => {
  it("puts the three days after book-in in camp", () => {
    expect(ctx("2026-10-11").context).toBe("camp-weekend"); // Sun
    expect(ctx("2026-10-12").context).toBe("camp-weekday");
    expect(ctx("2026-10-13")).toMatchObject({ context: "camp-weekday", bookOut: true });
  });
  it("has three days out, the last booking in", () => {
    expect(ctx("2026-10-14").context).toBe("out");
    expect(ctx("2026-10-15").context).toBe("out");
    expect(ctx("2026-10-16")).toMatchObject({ context: "out", bookIn: true });
  });
  it("repeats the cycle and works backwards", () => {
    expect(ctx("2026-10-17").context).toBe("camp-weekend");
    expect(ctx("2026-11-04").context).toBe("camp-weekday");
    expect(ctx("2026-10-07").context).toBe("camp-weekday");
    expect(ctx("2026-10-08").context).toBe("out");
  });
  it("respects leave covering race day", () => {
    expect(ctx("2026-12-04").context).toBe("camp-weekday");
    expect(ctx("2026-12-05").context).toBe("leave");
  });
});
