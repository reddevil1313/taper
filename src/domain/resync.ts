import { addDays } from "./dates";
import { generatePlan, type History } from "./generator";
import type { ISODate, Log, Profile, Session } from "./types";

export interface PlanDiff {
  added: Session[];
  removed: Session[];
  changed: Array<{ before: Session; after: Session }>;
}

export interface ResyncResult {
  plan: Session[];
  diff: PlanDiff;
  history: History;
  from: ISODate;
}

const isLong = (s: Session) => s.run?.type === "long";
const doneDate = (s: Session, log: Log) => log[s.id]?.doneOn ?? s.date;

/** What the log says has actually been done. */
export function historyFrom(sessions: Session[], log: Log): History {
  const done = sessions.filter((s) => log[s.id]?.done);
  const longs = done.filter(isLong).sort((a, b) => (doneDate(a, log) < doneDate(b, log) ? -1 : 1));
  const last = longs[longs.length - 1];
  const km = last ? log[last.id]?.km : undefined;
  return {
    lastLongKm: last ? (typeof km === "number" && km > 0 ? km : last.run!.km) : undefined,
    lastLongOn: last ? doneDate(last, log) : undefined,
    temposDone: done.filter((s) => s.run?.type === "tempo").length,
    repsDone: done.filter((s) => s.run?.type === "intervals").length,
  };
}

/**
 * Re-plan everything from today using what was actually done.
 *
 * - Past sessions stay as a record; ones done on another day move to that day.
 * - If everything planned for today is already ticked or skipped, planning starts tomorrow.
 * - Missed long runs pull the ladder back (see generatePlan's stale-ladder rule);
 *   missed lifts are simply re-placed by the generator's block rules.
 */
export function resync(profile: Profile, plan: Session[], log: Log, today: ISODate): ResyncResult {
  const todays = plan.filter((s) => s.date === today);
  const todaySettled = todays.length > 0 && todays.every((s) => log[s.id]?.done || log[s.id]?.skipped);
  const from = todaySettled ? addDays(today, 1) : today;

  const past = plan
    .filter((s) => s.date < from)
    .map((s) => (log[s.id]?.doneOn && log[s.id].doneOn !== s.date ? { ...s, date: log[s.id].doneOn! } : s));

  const history = historyFrom(plan, log);
  const future = generatePlan(profile, { from, history }).filter((s) => s.date >= from);

  // Keep ids unique against the record we are keeping.
  const taken = new Set(past.map((s) => s.id));
  const fresh = future.map((s) => {
    let id = s.id;
    let n = 0;
    while (taken.has(id)) id = `${s.date}-${String.fromCharCode(98 + n++)}`;
    taken.add(id);
    return id === s.id ? s : { ...s, id };
  });

  const before = plan.filter((s) => s.date >= from);
  const byId = new Map(before.map((s) => [s.id, s]));
  const diff: PlanDiff = { added: [], removed: [], changed: [] };
  for (const s of fresh) {
    const old = byId.get(s.id);
    if (!old) diff.added.push(s);
    else if (old.title !== s.title || old.start !== s.start) diff.changed.push({ before: old, after: s });
    byId.delete(s.id);
  }
  diff.removed = [...byId.values()];

  const next = [...past, ...fresh].sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1));
  return { plan: next, diff, history, from };
}
