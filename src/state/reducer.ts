import type { AirMode, PsiReading } from "../domain/airQuality";
import { generatePlan } from "../domain/generator";
import { defaultProfile } from "../domain/profile";
import type { LogEntry, Profile, Session } from "../domain/types";
import type { AppState } from "./storage";

export type Action =
  | { type: "log"; id: string; patch: Partial<LogEntry> }
  | { type: "airMode"; mode: AirMode }
  | { type: "psi"; reading: PsiReading | null; at: number }
  | { type: "plan"; plan: Session[] }
  | { type: "profile"; profile: Profile }
  | { type: "replace"; state: AppState };

export function initialState(): AppState {
  return {
    version: 1,
    profile: defaultProfile,
    plan: generatePlan(defaultProfile),
    log: {},
    airMode: "auto",
    psi: null,
    psiFetchedAt: null,
  };
}

export function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "log": {
      const prev = state.log[a.id] ?? { at: 0 };
      return { ...state, log: { ...state.log, [a.id]: { ...prev, ...a.patch, at: Date.now() } } };
    }
    case "airMode":
      return { ...state, airMode: a.mode };
    case "psi":
      return { ...state, psi: a.reading, psiFetchedAt: a.at };
    case "plan":
      return { ...state, plan: a.plan };
    case "profile":
      return { ...state, profile: a.profile };
    case "replace":
      return a.state;
  }
}
