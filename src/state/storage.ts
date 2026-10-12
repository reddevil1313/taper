import type { AirMode, PsiReading } from "../domain/airQuality";
import type { Log, Profile, Session } from "../domain/types";

export interface AppState {
  version: 1;
  profile: Profile;
  plan: Session[];
  log: Log;
  airMode: AirMode;
  psi: PsiReading | null;
  psiFetchedAt: number | null;
}

const KEY = "taper:v1";

export interface Storage {
  load(): AppState | null;
  save(state: AppState): void;
}

export const localStore: Storage = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as AppState;
      return s.version === 1 && Array.isArray(s.plan) ? s : null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the app keeps working in memory */
    }
  },
};

/** Validates an imported backup. Throws with a readable message when it isn't one. */
export function parseBackup(text: string): AppState {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const s = data as Partial<AppState>;
  if (s.version !== 1 || !s.profile || !Array.isArray(s.plan) || typeof s.log !== "object") {
    throw new Error("That file isn't a Taper backup.");
  }
  return { airMode: "auto", psi: null, psiFetchedAt: null, ...s } as AppState;
}
