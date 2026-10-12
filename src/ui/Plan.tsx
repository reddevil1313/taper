import { useState } from "react";
import { diffDays, fmtDay, fmtTime } from "../domain/dates";
import { useStore } from "../state/store";
import type { Session } from "../domain/types";
import { isDone, isSkipped, settled, showsTreadmill, useHaze, useToday } from "./helpers";
import { SessionBody } from "./SessionBody";

type Filter = "all" | "todo" | "run" | "lift";

export function Plan() {
  const { state } = useStore();
  const [filter, setFilter] = useState<Filter>("todo");
  const [open, setOpen] = useState<string | null>(null);
  const today = useToday();
  const haze = useHaze();
  const { plan, log, profile } = state;

  const len = profile.duty.daysIn + profile.duty.daysOut;
  const cycleOf = (d: string) => Math.floor(diffDays(d, profile.duty.anchorBookIn) / len);
  const groups = new Map<number, Session[]>();
  for (const s of plan) {
    const c = cycleOf(s.date);
    groups.set(c, [...(groups.get(c) ?? []), s]);
  }
  const show = (s: Session) =>
    filter === "todo" ? !settled(s, log) : filter === "run" ? !!s.run : filter === "lift" ? !!s.lift : true;

  return (
    <>
      <section>
        <h2>All sessions</h2>
        <div className="filters" style={{ marginTop: 10 }}>
          {(["todo", "all", "run", "lift"] as const).map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {{ todo: "To do", all: "All", run: "Runs", lift: "Strength" }[f]}
            </button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 6 }}>Tap a session for the workout and to log distance and pace.</p>
        {[...groups.entries()].map(([c, all]) => {
          const shown = all.filter(show);
          if (!shown.length) return null;
          const live = all.filter((s) => !isSkipped(s, log));
          const first = all[0].date;
          return (
            <div key={c}>
              <div className="cycle">
                <b>Cycle from {fmtDay(first)}</b>
                <span>{live.filter((s) => isDone(s, log)).length} of {live.length} done</span>
              </div>
              <ul>
                {shown.map((s) => (
                  <Row key={s.id} s={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} today={today} haze={haze} />
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}

function Row({ s, open, onToggle, today, haze }: { s: Session; open: boolean; onToggle: () => void; today: string; haze: boolean }) {
  const { state, dispatch } = useStore();
  const e = state.log[s.id] ?? { at: 0 };
  const done = !!e.done;
  const skipped = isSkipped(s, state.log);
  const late = !done && !skipped && !s.optional && s.date < today;
  const [km, setKm] = useState(e.km === undefined ? "" : String(e.km));
  const [pace, setPace] = useState(e.pace ?? "");
  const [note, setNote] = useState(e.note ?? "");

  const meta = [
    skipped && "Skipped",
    s.optional && "Optional",
    s.where === "camp" && "In camp",
    showsTreadmill(s, haze) && "Treadmill",
    `${s.mins} min`,
    done && s.run && (e.km || e.pace) && `logged ${e.km ? `${e.km} km` : ""}${e.km && e.pace ? " at " : ""}${e.pace ? `${e.pace}/km` : ""}`,
  ].filter(Boolean).join(", ");

  const save = () => {
    const v = km.trim().replace(",", ".");
    dispatch({
      type: "log", id: s.id,
      patch: { done: true, skipped: false, km: v === "" || !isFinite(Number(v)) ? "" : Number(v), pace: pace.trim().slice(0, 12), note: note.trim().slice(0, 500) },
    });
  };

  return (
    <li className={`row${done ? " done" : ""}${skipped ? " skipped" : ""}${late ? " late" : ""}${s.date === today ? " today" : ""}`}>
      <button className="tick" aria-pressed={done} aria-label={`${done ? "Untick" : "Mark done"}: ${s.title}`}
        onClick={() => dispatch({ type: "log", id: s.id, patch: { done: !done, skipped: false } })}>
        ✓
      </button>
      <button className="rowmain" aria-expanded={open} onClick={onToggle}>
        <span className="when">{fmtDay(s.date)}, {fmtTime(s.start)}{late ? ", not ticked" : ""}</span>
        <span className="title">{s.title}</span>
        <span className="meta">{meta}</span>
      </button>
      {open && (
        <div className="detail">
          <SessionBody s={s} haze={haze} />
          <div className="form">
            {s.run && (
              <>
                <label>Distance (km)<input id={`km-${s.id}`} inputMode="decimal" value={km} placeholder={String(s.run.km)} onChange={(ev) => setKm(ev.target.value)} /></label>
                <label>Average pace (min/km)<input id={`pace-${s.id}`} value={pace} placeholder="7:00" onChange={(ev) => setPace(ev.target.value)} /></label>
              </>
            )}
            <label className="wide">Notes<textarea id={`note-${s.id}`} value={note} placeholder="How it felt, weights used" onChange={(ev) => setNote(ev.target.value)} /></label>
            <div className="btns">
              <button className="btn" onClick={save}>{done ? "Save log" : "Save log and mark done"}</button>
              {!done && (
                <button className="btn ghost" onClick={() => dispatch({ type: "log", id: s.id, patch: { skipped: !skipped, done: false } })}>
                  {skipped ? "Undo skip" : "Mark skipped"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
