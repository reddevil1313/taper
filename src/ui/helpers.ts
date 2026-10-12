import { useStore } from "../state/store";
import { useTreadmill } from "../domain/airQuality";
import { todayIn } from "../domain/dates";
import type { Log, Session } from "../domain/types";

export const isDone = (s: Session, log: Log) => !!log[s.id]?.done;
export const isSkipped = (s: Session, log: Log) => !log[s.id]?.done && !!log[s.id]?.skipped;
export const settled = (s: Session, log: Log) => isDone(s, log) || isSkipped(s, log);

export function useToday() {
  return todayIn("Asia/Singapore");
}

/** True when out-of-camp runs should show their treadmill version right now. */
export function useHaze() {
  const { state } = useStore();
  return useTreadmill(state.airMode, state.psi, state.profile.air.threshold);
}

/** Camp runs are always on the treadmill; out-of-camp runs follow the air. */
export function showsTreadmill(s: Session, haze: boolean) {
  return !!s.run?.treadmill && (s.where === "camp" || haze);
}
