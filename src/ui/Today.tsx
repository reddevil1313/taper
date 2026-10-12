import { BAND_LABEL } from "../domain/airQuality";
import { diffDays, fmtDay, fmtTime } from "../domain/dates";
import { useStore } from "../state/store";
import { isDone, isSkipped, settled, useHaze, useToday } from "./helpers";
import { SessionBody } from "./SessionBody";

export function Today() {
  const { state, dispatch } = useStore();
  const today = useToday();
  const haze = useHaze();
  const { plan, log, profile, psi } = state;
  const n = diffDays(profile.race.date, today);

  const live = plan.filter((s) => !isSkipped(s, log));
  const done = live.filter((s) => isDone(s, log));
  const planKm = live.reduce((a, s) => a + (s.run?.km ?? 0), 0);
  const runKm = done.reduce((a, s) => {
    const k = log[s.id]?.km;
    return a + (typeof k === "number" ? k : s.run?.km ?? 0);
  }, 0);

  const upcoming = plan.filter((s) => s.date >= today && !settled(s, log));
  const nextDate = upcoming[0]?.date;
  const nextUp = upcoming.filter((s) => s.date === nextDate);
  const missed = plan.filter((s) => s.date < today && !settled(s, log) && !s.optional).length;

  const longs = live.filter((s) => s.run && (s.run.type === "long" || s.run.type === "race"));
  const nextLong = longs.find((s) => !isDone(s, log))?.id;

  return (
    <>
      <header className="hero">
        <h1>{profile.race.name}, {fmtDay(profile.race.date)}</h1>
        <div className="days">{n > 0 ? n : n === 0 ? "0" : "21.1"}</div>
        <div className="days-side">
          <strong>{n > 1 ? "days to go" : n === 1 ? "day to go" : n === 0 ? "Race day" : "km, done"}</strong>
          <span>{fmtTime(profile.race.start)} start, {profile.race.location}. Goal {profile.race.goal.replace(/^0/, "")}.</span>
        </div>
      </header>

      <section className="air" aria-label="Air quality">
        <div className="air-row">
          <div className="psi">
            <b>{psi ? psi.value : "–"}</b>
            <div>
              <div className="hint">24-hour PSI{psi ? `, ${psi.region}` : ""}</div>
              {psi && <span className={`pill ${psi.band}`}>{BAND_LABEL[psi.band]}</span>}
            </div>
          </div>
          <div className="seg" role="group" aria-label="Where to run">
            {(["auto", "outdoor", "treadmill"] as const).map((m) => (
              <button key={m} aria-pressed={state.airMode === m} onClick={() => dispatch({ type: "airMode", mode: m })}>
                {m === "auto" ? "Auto" : m === "outdoor" ? "Outdoors" : "Treadmill"}
              </button>
            ))}
          </div>
        </div>
        <p className="hint">
          {haze ? "Runs show their treadmill version." : "Runs show their outdoor version."}{" "}
          {state.airMode === "auto" && `Auto switches to the treadmill above PSI ${profile.air.threshold}.`}
          {!psi && state.psiFetchedAt && " Couldn't reach data.gov.sg, so pick manually."}
        </p>
      </section>

      <section>
        <h2>Next up</h2>
        {nextUp.length ? (
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {nextUp.map((s) => (
              <div className="next" key={s.id}>
                <span className="when">
                  {s.date === today ? "Today" : diffDays(s.date, today) === 1 ? "Tomorrow" : fmtDay(s.date)}, {fmtTime(s.start)}
                  {s.where === "camp" ? ", in camp" : ""}
                </span>
                <span className="what">{s.title}</span>
                <SessionBody s={s} haze={haze} />
                <button className="btn" onClick={() => dispatch({ type: "log", id: s.id, patch: { done: true, skipped: false } })}>
                  Mark done
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">Nothing left to do. Every session is ticked.</p>
        )}
        {missed > 0 && (
          <p className="hint" style={{ color: "var(--warn)", marginTop: 8 }}>
            {missed} earlier {missed === 1 ? "session isn't" : "sessions aren't"} ticked. Tick or skip them in Plan, then resync from Settings.
          </p>
        )}
      </section>

      <section className="totals" aria-label="Progress">
        <div>
          <div className="total-top"><span>Sessions ticked</span><b>{done.length} of {live.length}</b></div>
          <div className="bar"><i style={{ width: `${live.length ? (done.length / live.length) * 100 : 0}%` }} /></div>
        </div>
        <div>
          <div className="total-top"><span>Kilometres run</span><b>{runKm.toFixed(1).replace(".0", "")} of {planKm.toFixed(1).replace(".0", "")} km</b></div>
          <div className="bar"><i style={{ width: `${planKm ? Math.min(100, (runKm / planKm) * 100) : 0}%` }} /></div>
        </div>
      </section>

      <section>
        <h2>Long runs, building to {profile.race.distanceKm} km</h2>
        <div className="ladder">
          {longs.map((s) => (
            <div key={s.id} className={`rung${isDone(s, log) ? " done" : ""}${s.id === nextLong ? " next" : ""}${s.kind === "race" ? " race" : ""}`} title={fmtDay(s.date)}>
              <b>{s.run!.km}</b>
              <i style={{ height: `${Math.max(6, (s.run!.km / profile.race.distanceKm) * 82)}%` }} />
            </div>
          ))}
        </div>
        <div className="ladder-dates">
          {longs.map((s) => <span key={s.id}>{s.kind === "race" ? "Race" : fmtDay(s.date).slice(4)}</span>)}
        </div>
      </section>
    </>
  );
}
