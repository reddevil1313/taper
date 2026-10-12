import { band, parsePsi, useTreadmill } from "./airQuality";

const sample = {
  code: 0,
  data: {
    items: [
      {
        timestamp: "2026-10-11T19:00:00+08:00",
        readings: { psi_twenty_four_hourly: { north: 112, south: 113, west: 155, east: 132, central: 146 } },
      },
    ],
  },
};

describe("air quality", () => {
  it("maps NEA bands", () => {
    expect(band(50)).toBe("good");
    expect(band(101)).toBe("unhealthy");
    expect(band(201)).toBe("very-unhealthy");
    expect(band(301)).toBe("hazardous");
  });
  it("parses a region or the highest region", () => {
    expect(parsePsi(sample, "west")).toMatchObject({ value: 155, region: "west", band: "unhealthy" });
    expect(parsePsi(sample, "max")?.value).toBe(155);
    expect(parsePsi(sample, "north")?.value).toBe(112);
    expect(parsePsi({}, "max")).toBeNull();
  });
  it("decides treadmill vs outdoor", () => {
    const r = parsePsi(sample, "north");
    expect(useTreadmill("auto", r, 100)).toBe(true);
    expect(useTreadmill("auto", r, 150)).toBe(false);
    expect(useTreadmill("outdoor", r, 100)).toBe(false);
    expect(useTreadmill("treadmill", null, 100)).toBe(true);
    expect(useTreadmill("auto", null, 100)).toBe(false);
  });
});
