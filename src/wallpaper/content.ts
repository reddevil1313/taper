import { diffDays, fmtDay, fmtTime, range } from "../domain/dates";
import type { ISODate, Profile, Session } from "../domain/types";

export const LINES = [
  "Missed days don't count against you. Today does.",
  "Easy days easy, so hard days can be hard.",
  "The haze is temporary. The base you build isn't.",
  "Treadmill kilometres are still kilometres.",
  "Show up for the next session, not the last one.",
  "Rest is part of the plan, not a break from it.",
  "One block at a time. Then the next.",
  "Your legs remember every run you finish.",
  "Discipline is choosing the plan over the mood.",
  "Strong legs, strong core, strong finish.",
  "Run the mile you're in.",
  "Small, boring, consistent. That's the secret.",
  "Fuel, sleep, hydrate. Repeat.",
  "Hard sessions build fitness. Easy ones let it stick.",
  "The start line is earned on days like this.",
];

export interface WallBlock {
  title: string;
  where: string;
  lines: Array<{ text: string; haze?: boolean }>;
  race?: boolean;
}

export interface WallContent {
  date: ISODate;
  daysToGo: number;
  progress: number;
  dateLabel: string;
  blocks: WallBlock[];
  quote: string;
}

const strip = (s: string) => s.replace("Treadmill at 1% incline: ", "");

function blockFor(s: Session): WallBlock {
  const where =
    s.kind === "race" ? `${fmtTime(s.start)} start` :
    s.kind === "admin" ? "Admin" :
    `${s.where === "camp" ? "In camp" : s.run ? "Gym or outdoors" : "Gym"}, ${fmtTime(s.start)}`;
  const lines: WallBlock["lines"] = [];
  if (s.run) {
    if (s.kind === "race") lines.push({ text: s.run.detail });
    else if (s.where === "camp" && s.run.treadmill) lines.push({ text: "Treadmill, 1% incline: " + strip(s.run.treadmill) });
    else {
      lines.push({ text: s.run.detail });
      if (s.run.treadmill) lines.push({ text: "HAZE? Treadmill: " + strip(s.run.treadmill), haze: true });
    }
    if (s.liftDetail) lines.push({ text: `Then ${s.liftDetail.split(":")[0].split(" (")[0]}.` });
  } else if (s.liftDetail) {
    lines.push({ text: s.liftDetail.split(". Core")[0] });
  } else if (s.note) {
    lines.push({ text: s.note });
  }
  if (s.optional) lines.push({ text: "Optional. Skip if tired." });
  return { title: s.title, where, lines, race: s.kind === "race" };
}

export function wallpaperContent(date: ISODate, plan: Session[], profile: Profile, index = 0): WallContent {
  const R = profile.race.date;
  const todays = plan.filter((s) => s.date === date);
  let blocks = todays.map(blockFor);
  if (!blocks.length) {
    const next = plan.find((s) => s.date > date);
    blocks = [{ title: "Rest day", where: "Sleep, eat well, walk.", lines: next ? [{ text: `Next: ${fmtDay(next.date).slice(0, 3)} ${next.title}` }] : [] }];
  }
  const total = Math.max(1, diffDays(R, profile.planStart));
  return {
    date,
    daysToGo: diffDays(R, date),
    progress: Math.min(1, Math.max(0, diffDays(date, profile.planStart) / total)),
    dateLabel: fmtDay(date).toUpperCase(),
    blocks,
    quote: date === R ? "Race day. Trust the work." : LINES[index % LINES.length],
  };
}

export function wallpaperDays(from: ISODate, race: ISODate): ISODate[] {
  return range(from, race);
}
