import { addDays, addMinutes, diffDays, range } from "./dates";
import { dayInfo, isCamp } from "./duty";
import { zonesFor } from "./paces";
import type { DayInfo, ISODate, LiftKey, Profile, RunSpec, Session } from "./types";
import { LIFTS, workouts } from "./workouts";

/** What the athlete has actually done so far; lets the generator pick up where they are. */
export interface History {
  /** Distance of the most recent long run actually completed. */
  lastLongKm?: number;
  /** Date of that long run. */
  lastLongOn?: ISODate;
  /** Completed tempo and interval sessions, to continue each progression. */
  temposDone?: number;
  repsDone?: number;
}

export interface GenerateOptions {
  /** First date to plan (inclusive). Defaults to the profile's plan start. */
  from?: ISODate;
  history?: History;
}

const TEMPO_KM = [2, 3, 3, 4, 4, 5, 5, 6, 6];
const REPS: Array<["800" | "1k", number]> = [
  ["800", 4], ["800", 5], ["800", 6], ["1k", 4], ["1k", 5], ["800", 6], ["1k", 5],
];

interface Block {
  camp: boolean;
  days: DayInfo[];
}

function blocks(days: DayInfo[]): Block[] {
  const out: Block[] = [];
  for (const d of days) {
    const camp = isCamp(d);
    const last = out[out.length - 1];
    if (last && last.camp === camp) last.days.push(d);
    else out.push({ camp, days: [d] });
  }
  return out;
}

const runMins = (km: number) => Math.ceil((km * 8 + 10) / 5) * 5;

/**
 * Build a periodised plan around the duty roster.
 *
 * Rules, in order of priority:
 * - long runs on the last out-of-camp day of each out block (morning, before book-in);
 * - quality runs with heavy legs on a camp weekday (treadmill), never the day after a long run;
 * - the out block opens with the second quality run plus Upper B, unless the previous day was hard;
 * - weekend camp days get dumbbell variants, including a dumbbell leg day when no weekday is free;
 * - last heavy legs at least 18 days out; taper with race-pace work and light lifting.
 */
export function generatePlan(profile: Profile, opts: GenerateOptions = {}): Session[] {
  const R = profile.race.date;
  const from = opts.from ?? profile.planStart;
  const h = opts.history ?? {};
  const z = zonesFor(profile.race.goal, profile.race.distanceKm);
  const w = workouts(z);
  const t = profile.times;

  const days = range(from, addDays(R, -1)).map((d) => dayInfo(profile, d));
  const info = new Map(days.map((d) => [d.date, d]));
  const out: Session[] = [];
  const counter = new Map<string, number>();
  const busy = new Set<ISODate>();
  const hard = new Set<ISODate>();

  function add(date: ISODate, s: Omit<Session, "id" | "date">) {
    const n = counter.get(date) ?? 0;
    counter.set(date, n + 1);
    const di = info.get(date);
    const note = di?.bookIn && s.where === "out" && !s.kind ? [s.note, `Book-in is ${profile.duty.bookInTime.replace(":00", "")}${Number(profile.duty.bookInTime.slice(0, 2)) >= 12 ? "pm" : "am"}.`].filter(Boolean).join(" ") : s.note;
    out.push({ id: `${date}-${String.fromCharCode(97 + n)}`, date, ...s, note: note || undefined });
    busy.add(date);
  }

  const lift = (k: LiftKey) => ({ lift: k, liftDetail: LIFTS[k].detail });
  const timeFor = (d: DayInfo) =>
    d.context === "camp-weekday" ? t.campWeekday : d.context === "camp-weekend" ? t.campWeekend : t.outGym;
  const where = (d: DayInfo): "camp" | "out" => (isCamp(d) ? "camp" : "out");

  // ---- Long-run ladder -------------------------------------------------------------------
  const bl = blocks(days);
  const longSlots: ISODate[] = bl
    .filter((b) => !b.camp)
    .map((b) => b.days.filter((d) => d.context === "out").pop()?.date)
    .filter((d): d is ISODate => !!d && diffDays(R, d) >= 6);

  const peakTarget = Math.round(profile.race.distanceKm * 0.85);
  const peakIdx = longSlots.reduce((acc, d, i) => (diffDays(R, d) >= 14 ? i : acc), -1);
  const peakDate = peakIdx >= 0 ? longSlots[peakIdx] : undefined;
  const taperDate = longSlots.find((d, i) => i > peakIdx && diffDays(R, d) <= 10);

  const stale = h.lastLongOn ? diffDays(from, h.lastLongOn) > 10 : true;
  let k = h.lastLongKm ? (stale ? Math.max(8, h.lastLongKm - 2) : h.lastLongKm + 2) : 8;
  const ladder = new Map<ISODate, number>();
  for (let i = 0; i <= peakIdx; i++) {
    const isStepBack = i > 0 && i % 4 === 0 && i < peakIdx;
    if (i === peakIdx) ladder.set(longSlots[i], Math.max(Math.min(k, peakTarget), ladder.get(longSlots[i - 1]) ?? 0));
    else if (isStepBack) ladder.set(longSlots[i], Math.round((ladder.get(longSlots[i - 1]) ?? k) * 0.75));
    else {
      ladder.set(longSlots[i], Math.min(k, peakTarget));
      k += 2;
    }
  }

  // ---- Quality progression ---------------------------------------------------------------
  let ti = h.temposDone ?? 0;
  let ri = h.repsDone ?? 0;
  let nextIsTempo = ti <= ri;
  function quality(date: ISODate): { run: RunSpec; label: string } {
    const nearPeak = peakDate ? diffDays(peakDate, date) <= 2 && diffDays(peakDate, date) >= 0 : false;
    if (nextIsTempo) {
      let km = TEMPO_KM[Math.min(ti++, TEMPO_KM.length - 1)];
      if (nearPeak) km = Math.min(km, 4);
      nextIsTempo = false;
      return { run: w.tempo(km), label: `Tempo ${km} km` };
    }
    let [kind, n] = REPS[Math.min(ri++, REPS.length - 1)];
    if (nearPeak) [kind, n] = ["800", 5];
    nextIsTempo = true;
    return { run: kind === "800" ? w.reps800(n) : w.reps1k(n), label: `Intervals ${n}x${kind === "800" ? "800 m" : "1 km"}` };
  }

  const lastHeavyLegs = addDays(R, -18);
  const inBuild = (d: ISODate) => !peakDate || d <= peakDate;

  // Long runs first: everything else is placed around them.
  for (const d of longSlots) {
    const di = info.get(d)!;
    let km = ladder.get(d);
    let run: RunSpec | undefined;
    let title = "";
    if (km !== undefined) {
      const peak = d === peakDate;
      run = peak
        ? w.long(km, { finishAtRace: 3, extra: "Race rehearsal: early start, race-day breakfast, race kit and gels." })
        : w.long(km);
      const prev = longSlots[longSlots.indexOf(d) - 1];
      const stepBack = prev && ladder.get(prev)! > km;
      title = `Long run ${km} km${peak ? " (peak)" : stepBack ? " (step-back)" : ""}`;
      if (stepBack) run.detail = "Step-back week to absorb the build. " + run.detail;
    } else if (d === taperDate) {
      km = Math.round(profile.race.distanceKm * 0.57);
      run = w.long(km, { middleAtRace: 3 });
      title = `Long run ${km} km (taper)`;
    }
    if (!run || km === undefined) continue;
    const start = km >= 16 ? addMinutes(t.outLongRun, -60) : t.outLongRun;
    add(d, { start, mins: runMins(km), title, where: where(di), run });
    hard.add(d);
  }

  // ---- Build phase: camp and out blocks ---------------------------------------------------
  for (const b of bl) {
    const bdays = b.days.filter((d) => inBuild(d.date) && !busy.has(d.date) && d.context !== "leave");
    if (!bdays.length) continue;

    if (b.camp) {
      const prevLong = (d: DayInfo) => hard.has(addDays(d.date, -1)) && longSlots.includes(addDays(d.date, -1));
      const weekdays = bdays.filter((d) => d.context === "camp-weekday" && !prevLong(d));
      // Prefer the middle of the block, then the end, so the session is clear of the long run.
      const qDay = [...weekdays].sort((a, c) => pos(c) - pos(a)).sort((a, c) => score(a) - score(c))[0];
      let tempoToOut = false;
      if (qDay) {
        const q = quality(qDay.date);
        const heavy = qDay.date <= lastHeavyLegs;
        add(qDay.date, {
          start: timeFor(qDay), mins: runMins(q.run.km) + 15 + (heavy ? 45 : 0),
          title: `${q.label}${heavy ? " + Legs" : ""}`, where: "camp", run: q.run,
          ...(heavy ? lift("legs") : {}),
          note: qDay.date === lastHeavyLegsDay(out, lastHeavyLegs, qDay.date) ? "Last heavy leg day." : undefined,
        });
        hard.add(qDay.date);
      } else {
        const wk = bdays.filter((d) => d.context === "camp-weekend" && !prevLong(d));
        const legDay = wk[wk.length > 1 ? 1 : 0];
        if (legDay && legDay.date <= lastHeavyLegs) {
          add(legDay.date, {
            start: timeFor(legDay), mins: 60, title: LIFTS.legsDb.title, where: "camp", ...lift("legsDb"),
            note: "Weekend in camp: dumbbells and bench only, so this cycle's leg day moves here.",
          });
        }
        tempoToOut = true;
      }
      const uaDay = bdays.find((d) => !busy.has(d.date));
      if (uaDay) {
        const key: LiftKey = uaDay.context === "camp-weekend" ? "upperAdb" : "upperA";
        add(uaDay.date, { start: timeFor(uaDay), mins: key === "upperA" ? 75 : 60, title: LIFTS[key].title, where: "camp", ...lift(key) });
      }
      (b as Block & { tempoToOut?: boolean }).tempoToOut = tempoToOut;
      continue;
    }

    // Out block (long run already placed on its last day).
    const prevCamp = bl[bl.indexOf(b) - 1] as (Block & { tempoToOut?: boolean }) | undefined;
    const free = bdays.filter((d) => !busy.has(d.date));
    const o1 = free[0];
    const o2 = free[1];
    const prevHard = o1 ? hard.has(addDays(o1.date, -1)) : false;
    if (o1 && prevCamp?.tempoToOut) {
      nextIsTempo = true;
      const q = quality(o1.date);
      add(o1.date, { start: t.outGym, mins: runMins(q.run.km) + 75, title: `${q.label} + Upper B`, where: "out", run: q.run, ...lift("upperB") });
      hard.add(o1.date);
      if (o2) {
        add(o2.date, { start: t.outGym, mins: 35, title: "Easy 4 km (optional)", where: "out", run: w.easy(4), optional: true, note: "Only if you feel fresh. Skipping it costs nothing." });
      }
    } else if (o1 && prevHard) {
      add(o1.date, { start: t.outGym, mins: 75, title: "Upper B", where: "out", ...lift("upperB"), note: "No run today so your legs recover." });
      if (o2) {
        const q = quality(o2.date);
        add(o2.date, { start: t.outGym, mins: runMins(q.run.km), title: q.label, where: "out", run: q.run });
        hard.add(o2.date);
      }
    } else if (o1) {
      const q = quality(o1.date);
      add(o1.date, { start: t.outGym, mins: runMins(q.run.km) + 75, title: `${q.label} + Upper B`, where: "out", run: q.run, ...lift("upperB") });
      hard.add(o1.date);
    }
  }

  // ---- Taper and race week ----------------------------------------------------------------
  if (peakDate) {
    const after = (d: ISODate) => days.filter((x) => x.date > d && !busy.has(x.date));
    const rp4 = after(addDays(peakDate, 1)).find((d) => d.context === "camp-weekday" || d.context === "out");
    if (rp4 && diffDays(R, rp4.date) > 6) {
      add(rp4.date, { start: timeFor(rp4), mins: 60, title: "Race-pace run 4 km", where: where(rp4), run: w.racePace(4), note: "Taper begins." });
      if (rp4.context === "camp-weekday") {
        add(rp4.date, { start: addMinutes(timeFor(rp4), 60), mins: 60, title: LIFTS.upperAlightLegs.title, where: "camp", ...lift("upperAlightLegs") });
      }
    }
    if (taperDate) {
      const pre = info.get(addDays(taperDate, -2));
      if (pre && pre.context === "out" && !busy.has(pre.date)) {
        add(pre.date, { start: t.outGym, mins: 100, title: "Easy 4 km + Upper B", where: "out", run: w.easy(4), ...lift("upperB") });
      }
      const wk = after(taperDate).find((d) => d.context === "camp-weekend");
      if (wk) add(wk.date, { start: t.campWeekend, mins: 45, title: LIFTS.upperAdbLight.title, where: "camp", ...lift("upperAdbLight") });
    }
    const rw = days.filter((d) => diffDays(R, d.date) <= 5 && !busy.has(d.date) && (d.context === "out" || d.context === "leave"));
    const [d1, d2, ...rest] = rw;
    if (d1) {
      add(d1.date, { start: t.outGym, mins: 50, title: "Race-pace run 3 km + strides", where: "out", run: w.racePace(3, true) });
      add(d1.date, { start: addMinutes(t.outGym, 60), mins: 60, title: LIFTS.upperBlight.title, where: "out", ...lift("upperBlight"), note: "Last strength session before the race." });
    }
    if (d2) add(d2.date, { start: t.outLongRun, mins: 40, title: "Easy 4 km + strides", where: "out", run: w.easy(4, true), note: "Last run before the race." });
    const pack = rest.find((d) => diffDays(R, d.date) >= 1);
    if (pack) add(pack.date, { start: "11:00", mins: 90, title: "Race pack collection", where: "out", kind: "admin", note: "Check the venue and hours on the race website." });
  }

  // Race
  out.push({
    id: `${R}-a`, date: R, start: profile.race.start, mins: 150, title: `Race: ${profile.race.name.toLowerCase()}`,
    where: "out", kind: "race", run: w.race(profile.race.distanceKm),
    note: "If the haze is bad on race week, check the organiser's updates: races can be shortened or called off when PSI is high.",
  });

  return out.sort((a, c) => (a.date + a.start < c.date + c.start ? -1 : 1));

  // Position of a camp day within the full roster block: 1 = first full day after book-in.
  function pos(d: DayInfo) {
    const len = profile.duty.daysIn + profile.duty.daysOut;
    return ((diffDays(d.date, profile.duty.anchorBookIn) % len) + len) % len;
  }
  function score(d: DayInfo) {
    const p = pos(d);
    return p === 2 ? 0 : p === 3 ? 1 : 2;
  }
}

/** Returns `date` when it is the final heavy-leg day on or before the cut-off, so it can be labelled. */
function lastHeavyLegsDay(_placed: Session[], cutoff: ISODate, date: ISODate): ISODate | undefined {
  return diffDays(cutoff, date) < 6 && diffDays(cutoff, date) >= 0 ? date : undefined;
}

export function totalKm(sessions: Session[]): number {
  return Math.round(sessions.reduce((a, s) => a + (s.run?.km ?? 0), 0) * 10) / 10;
}
