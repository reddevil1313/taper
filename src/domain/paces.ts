/** Pace helpers. Paces are seconds per km. */

export function parsePace(p: string): number {
  const [m, s] = p.split(":").map(Number);
  return m * 60 + (s || 0);
}

export function fmtPace(sec: number): string {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function parseDuration(t: string): number {
  return t.split(":").map(Number).reduce((acc, v) => acc * 60 + v, 0);
}

/** Treadmill speed in km/h for a pace, to one decimal. */
export function kmh(secPerKm: number): string {
  return (Math.round((3600 / secPerKm) * 10) / 10).toFixed(1);
}

export interface Band {
  fast: number;
  slow: number;
}

export interface Zones {
  race: number;
  easy: Band;
  tempo: Band;
  rep800: Band;
  rep1k: Band;
}

/**
 * Training zones anchored on race pace. Race pace is the goal pace with a ~5 s/km buffer,
 * rounded to 5 s, so the plan rehearses slightly quicker than the goal needs.
 */
export function zonesFor(goal: string, distanceKm: number): Zones {
  const goalPace = parseDuration(goal) / distanceKm;
  const race = Math.floor((goalPace - 5) / 5) * 5;
  return {
    race,
    easy: { fast: race + 30, slow: race + 60 },
    tempo: { fast: race - 25, slow: race - 15 },
    rep800: { fast: race - 60, slow: race - 50 },
    rep1k: { fast: race - 50, slow: race - 45 },
  };
}

export const paceRange = (b: Band) => `${fmtPace(b.fast)}-${fmtPace(b.slow)}/km`;
export const speedRange = (b: Band) => `${kmh(b.slow)}-${kmh(b.fast)} km/h`;
