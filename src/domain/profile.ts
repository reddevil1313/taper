import type { Profile } from "./types";

/** Default profile: BYD Half Marathon 2026, NS 3-in/3-out roster. */
export const defaultProfile: Profile = {
  name: "Samay",
  race: {
    name: "Half marathon",
    date: "2026-12-05",
    start: "04:30",
    distanceKm: 21.1,
    goal: "2:30:00",
    location: "F1 Pit Building",
  },
  current5kPace: "6:30",
  planStart: "2026-10-05",
  duty: {
    anchorBookIn: "2026-10-10",
    daysIn: 3,
    daysOut: 3,
    bookInTime: "19:00",
    bookOutTime: "21:00",
  },
  leaves: [{ from: "2026-12-04T20:00", to: "2026-12-06T20:00" }],
  times: {
    campWeekday: "15:00",
    campWeekend: "19:30",
    outGym: "08:00",
    outLongRun: "07:00",
  },
  air: { threshold: 100, region: "max" },
};
