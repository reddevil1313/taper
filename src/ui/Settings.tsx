import { useRef, useState } from "react";
import { fmtDay, fmtTime } from "../domain/dates";
import { toICS } from "../domain/ics";
import { resync, type ResyncResult } from "../domain/resync";
import type { Profile, PsiRegion } from "../domain/types";
import { useStore } from "../state/store";
import { parseBackup } from "../state/storage";
import { download } from "./download";
import { useToday } from "./helpers";

export function Settings() {
  const { state, dispatch } = useStore();
  const today = useToday();
  const [draft, setDraft] = useState<Profile>(state.profile);
  const [preview, setPreview] = useState<ResyncResult | null>(null);
  const [msg, setMsg] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft({ ...draft, [k]: v });
  const changed = JSON.stringify(draft) !== JSON.stringify(state.profile);

  const runPreview = () => {
    setPreview(resync(draft, state.plan, state.log, today));
    setMsg("");
  };
  const apply = () => {
    if (!preview) return;
    dispatch({ type: "profile", profile: draft });
    dispatch({ type: "plan", plan: preview.plan });
    setPreview(null);
    setMsg(`Plan updated from ${fmtDay(preview.from)}.`);
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const s = parseBackup(await f.text());
      dispatch({ type: "replace", state: s });
      setDraft(s.profile);
      setMsg("Backup restored.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <>
      <section className="panel">
        <h2>Resync plan</h2>
        <p className="hint">Re-plans every session from today using what you've ticked, skipped or moved. Missed long runs pull the ladder back; missed lifts get made up.</p>
        <div className="btns">
          <button className="btn" onClick={runPreview}>Preview changes</button>
        </div>
        {preview && (
          <div style={{ display: "grid", gap: 8 }}>
            <p><b>{preview.diff.changed.length}</b> changed, <b>{preview.diff.added.length}</b> added, <b>{preview.diff.removed.length}</b> removed, starting {fmtDay(preview.from)}.</p>
            <ul className="hint" style={{ display: "grid", gap: 2 }}>
              {preview.diff.changed.slice(0, 8).map(({ before, after }) => (
                <li key={after.id}>{fmtDay(after.date)}: {before.title} → {after.title}</li>
              ))}
              {preview.diff.added.slice(0, 6).map((s) => <li key={s.id}>{fmtDay(s.date)}: add {s.title}, {fmtTime(s.start)}</li>)}
              {preview.diff.removed.slice(0, 6).map((s) => <li key={s.id}>{fmtDay(s.date)}: remove {s.title}</li>)}
            </ul>
            <div className="btns">
              <button className="btn" onClick={apply}>Apply</button>
              <button className="btn ghost" onClick={() => setPreview(null)}>Cancel</button>
            </div>
          </div>
        )}
        {msg && <p className="status" role="status">{msg}</p>}
      </section>

      <section className="panel">
        <h2>Race</h2>
        <div className="grid2">
          <label className="field">Race date<input id="race-date" type="date" value={draft.race.date} onChange={(e) => set("race", { ...draft.race, date: e.target.value })} /></label>
          <label className="field">Start time<input id="race-start" type="time" value={draft.race.start} onChange={(e) => set("race", { ...draft.race, start: e.target.value })} /></label>
          <label className="field">Goal (h:mm:ss)<input id="race-goal" value={draft.race.goal} onChange={(e) => set("race", { ...draft.race, goal: e.target.value })} /></label>
          <label className="field">Current 5 km pace (m:ss/km)<input id="pace5k" value={draft.current5kPace} onChange={(e) => set("current5kPace", e.target.value)} /></label>
        </div>
      </section>

      <section className="panel">
        <h2>Duty roster</h2>
        <div className="grid2">
          <label className="field">A book-in date<input id="anchor" type="date" value={draft.duty.anchorBookIn} onChange={(e) => set("duty", { ...draft.duty, anchorBookIn: e.target.value })} /></label>
          <label className="field">Days in<input id="days-in" type="number" min={1} max={14} value={draft.duty.daysIn} onChange={(e) => set("duty", { ...draft.duty, daysIn: Number(e.target.value) })} /></label>
          <label className="field">Days out<input id="days-out" type="number" min={1} max={14} value={draft.duty.daysOut} onChange={(e) => set("duty", { ...draft.duty, daysOut: Number(e.target.value) })} /></label>
          <label className="field">Book-in time<input id="book-in" type="time" value={draft.duty.bookInTime} onChange={(e) => set("duty", { ...draft.duty, bookInTime: e.target.value })} /></label>
          <label className="field">Leave from<input id="leave-from" type="datetime-local" value={draft.leaves[0]?.from ?? ""} onChange={(e) => set("leaves", [{ from: e.target.value, to: draft.leaves[0]?.to ?? e.target.value }])} /></label>
          <label className="field">Leave until<input id="leave-to" type="datetime-local" value={draft.leaves[0]?.to ?? ""} onChange={(e) => set("leaves", [{ from: draft.leaves[0]?.from ?? e.target.value, to: e.target.value }])} /></label>
        </div>
        <h3 className="hint">Session times</h3>
        <div className="grid2">
          <label className="field">Camp, weekday<input id="t-cw" type="time" value={draft.times.campWeekday} onChange={(e) => set("times", { ...draft.times, campWeekday: e.target.value })} /></label>
          <label className="field">Camp, weekend<input id="t-ce" type="time" value={draft.times.campWeekend} onChange={(e) => set("times", { ...draft.times, campWeekend: e.target.value })} /></label>
          <label className="field">Out, gym<input id="t-og" type="time" value={draft.times.outGym} onChange={(e) => set("times", { ...draft.times, outGym: e.target.value })} /></label>
          <label className="field">Out, long run<input id="t-ol" type="time" value={draft.times.outLongRun} onChange={(e) => set("times", { ...draft.times, outLongRun: e.target.value })} /></label>
        </div>
      </section>

      <section className="panel">
        <h2>Air quality</h2>
        <div className="grid2">
          <label className="field">Treadmill above PSI<input id="psi-th" type="number" min={50} max={300} step={10} value={draft.air.threshold} onChange={(e) => set("air", { ...draft.air, threshold: Number(e.target.value) })} /></label>
          <label className="field">Region
            <select id="psi-region" value={draft.air.region} onChange={(e) => set("air", { ...draft.air, region: e.target.value as PsiRegion })}>
              {["max", "north", "south", "east", "west", "central"].map((r) => <option key={r} value={r}>{r === "max" ? "Highest region" : r[0].toUpperCase() + r.slice(1)}</option>)}
            </select>
          </label>
        </div>
        {changed && <p className="hint">Preview and apply a resync above to rebuild the plan with these settings.</p>}
      </section>

      <section className="panel">
        <h2>Export</h2>
        <div className="btns">
          <button className="btn" onClick={() => download("training-plan.ics", toICS(state.plan.filter((s) => s.date >= today)), "text/calendar")}>Calendar file (.ics)</button>
          <button className="btn ghost" onClick={() => download(`taper-backup-${today}.json`, JSON.stringify(state, null, 1), "application/json")}>Back up data</button>
          <button className="btn ghost" onClick={() => file.current?.click()}>Restore backup</button>
          <input ref={file} id="restore" type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        </div>
      </section>
    </>
  );
}
