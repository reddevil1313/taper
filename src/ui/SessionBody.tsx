import type { Session } from "../domain/types";
import { showsTreadmill } from "./helpers";

export function SessionBody({ s, haze }: { s: Session; haze: boolean }) {
  const tm = showsTreadmill(s, haze);
  const alt = s.run?.treadmill && s.where === "out"
    ? tm ? `Outdoor version, if the air clears: ${s.run.detail}` : `Haze version: ${s.run.treadmill}`
    : null;
  return (
    <>
      {s.run && (
        <p>
          {tm && <span className="tag tm">Treadmill</span>}
          {tm ? s.run.treadmill : s.run.detail}
        </p>
      )}
      {alt && <p className="alt">{alt}</p>}
      {s.liftDetail && <p>{s.liftDetail}</p>}
      {s.note && <p>{s.note}</p>}
    </>
  );
}
