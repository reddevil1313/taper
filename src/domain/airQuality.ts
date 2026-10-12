import type { PsiRegion } from "./types";

export const PSI_URL = "https://api-open.data.gov.sg/v2/real-time/api/psi";

export type PsiBand = "good" | "moderate" | "unhealthy" | "very-unhealthy" | "hazardous";

export interface PsiReading {
  value: number;
  region: Exclude<PsiRegion, "max">;
  band: PsiBand;
  /** When the reading was taken (ISO with offset). */
  at: string;
}

/** NEA 24-hour PSI bands. */
export function band(psi: number): PsiBand {
  if (psi <= 50) return "good";
  if (psi <= 100) return "moderate";
  if (psi <= 200) return "unhealthy";
  if (psi <= 300) return "very-unhealthy";
  return "hazardous";
}

export const BAND_LABEL: Record<PsiBand, string> = {
  good: "Good",
  moderate: "Moderate",
  unhealthy: "Unhealthy",
  "very-unhealthy": "Very unhealthy",
  hazardous: "Hazardous",
};

type Regions = Partial<Record<Exclude<PsiRegion, "max">, number>>;

/** Parse the data.gov.sg v2 PSI response. Returns null when the shape is not what we expect. */
export function parsePsi(json: unknown, region: PsiRegion): PsiReading | null {
  const item = (json as { data?: { items?: Array<{ timestamp?: string; readings?: { psi_twenty_four_hourly?: Regions } }> } })
    ?.data?.items?.[0];
  const r = item?.readings?.psi_twenty_four_hourly;
  if (!r) return null;
  const entries = Object.entries(r).filter(([, v]) => typeof v === "number") as Array<[Exclude<PsiRegion, "max">, number]>;
  if (!entries.length) return null;
  const pick = region === "max" ? entries.reduce((a, b) => (b[1] > a[1] ? b : a)) : entries.find(([k]) => k === region);
  if (!pick) return null;
  return { value: pick[1], region: pick[0], band: band(pick[1]), at: item?.timestamp ?? "" };
}

export async function fetchPsi(region: PsiRegion, fetcher: typeof fetch = fetch): Promise<PsiReading | null> {
  const res = await fetcher(PSI_URL, { headers: { accept: "application/json" } });
  if (!res.ok) return null;
  return parsePsi(await res.json(), region);
}

export type AirMode = "auto" | "outdoor" | "treadmill";

/** Whether runs should show their treadmill version. A manual choice always wins. */
export function useTreadmill(mode: AirMode, reading: PsiReading | null, threshold: number): boolean {
  if (mode === "outdoor") return false;
  if (mode === "treadmill") return true;
  return !!reading && reading.value > threshold;
}
