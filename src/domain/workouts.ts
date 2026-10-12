import { fmtPace, kmh, paceRange, speedRange, type Zones } from "./paces";
import type { LiftKey, RunSpec } from "./types";

const TM = "Treadmill at 1% incline: ";
const JOG = "6.0 km/h";
const STRIDE = "11-12 km/h";

const r1 = (n: number) => Math.round(n * 10) / 10;

export function workouts(z: Zones) {
  const easyS = speedRange(z.easy);
  const rp = `${fmtPace(z.race)}/km`;
  const rpS = `${kmh(z.race)} km/h`;

  return {
    tempo(k: number): RunSpec {
      return {
        type: "tempo",
        km: 2.5 + k,
        detail: `1.5 km easy, ${k} km tempo at ${paceRange(z.tempo)}, 1 km easy.`,
        treadmill: `${TM}1.5 km at ${easyS}, ${k} km at ${speedRange(z.tempo)}, 1 km at ${easyS}.`,
      };
    },
    reps800(n: number): RunSpec {
      return {
        type: "intervals",
        km: r1(2.5 + n * 0.8 + (n - 1) * 0.4),
        detail: `1.5 km easy, ${n} x 800 m at ${paceRange(z.rep800)} with 400 m walk or jog between, 1 km easy.`,
        treadmill: `${TM}1.5 km at ${easyS}, then ${n} x 800 m at ${speedRange(z.rep800)} with 400 m at ${JOG} between (hop to the side rails while it changes speed), 1 km at ${easyS}.`,
      };
    },
    reps1k(n: number): RunSpec {
      return {
        type: "intervals",
        km: r1(2.5 + n + (n - 1) * 0.4),
        detail: `1.5 km easy, ${n} x 1 km at ${paceRange(z.rep1k)} with 400 m walk or jog between, 1 km easy.`,
        treadmill: `${TM}1.5 km at ${easyS}, then ${n} x 1 km at ${speedRange(z.rep1k)} with 400 m at ${JOG} between, 1 km at ${easyS}.`,
      };
    },
    long(k: number, opts: { extra?: string; finishAtRace?: number; middleAtRace?: number } = {}): RunSpec {
      const parts = [`Easy conversational pace, ${paceRange(z.easy)}. Carry water.`];
      if (k >= 12) parts.push(k >= 16 ? "Gels at about 45 and 90 minutes." : "Practise taking a gel around 45 minutes in.");
      if (opts.finishAtRace) parts.push(`Last ${opts.finishAtRace} km at race pace ${rp}.`);
      if (opts.middleAtRace) parts.push(`Middle ${opts.middleAtRace} km at race pace ${rp}.`);
      if (opts.extra) parts.push(opts.extra);
      let tm = `${TM}${k} km at ${easyS}`;
      if (opts.finishAtRace) tm += `, last ${opts.finishAtRace} km at ${rpS}`;
      if (opts.middleAtRace) tm += `, middle ${opts.middleAtRace} km at ${rpS}`;
      tm += ". Bottle and towel on the console, fan on if there is one.";
      if (k >= 12) tm += " Break it into 2-3 km blocks in your head; if the gym caps machine time at busy hours, go at opening.";
      if (k >= 16) tm += ` Two halves of ${k / 2} km with a short refill break is fine.`;
      return { type: "long", km: k, detail: parts.join(" "), treadmill: tm };
    },
    easy(k: number, strides = false): RunSpec {
      return {
        type: "easy",
        km: k,
        detail: `${k} km very easy at ${paceRange(z.easy)}${strides ? ", then 4 x 20-second strides." : "."}`,
        treadmill: `${TM}${k} km at ${easyS}${strides ? `, then 4 x 20 s at ${STRIDE} with 40 s walking between.` : "."}`,
      };
    },
    racePace(k: number, strides = false): RunSpec {
      return {
        type: "race-pace",
        km: 2.5 + k,
        detail: `1.5 km easy, ${k} km at race pace ${rp}${strides ? ", 4 x 20-second strides" : ""}, 1 km easy.`,
        treadmill: `${TM}1.5 km at ${easyS}, ${k} km at ${rpS}${strides ? `, 4 x 20 s at ${STRIDE}` : ""}, 1 km at ${easyS}.`,
      };
    },
    race(distanceKm: number): RunSpec {
      return {
        type: "race",
        km: distanceKm,
        detail: `Start at ${fmtPace(z.race + 10)}/km for the first 3 km, settle at ${rp}, push from 18 km if you feel good. Drink at every station.`,
      };
    },
  };
}

export const LIFTS: Record<LiftKey, { title: string; detail: string }> = {
  legs: {
    title: "Legs",
    detail:
      "Legs: squat or leg press 3x6-8, RDL 3x8, split squat 2x10 a side, calf raise 3x12. Core, 2 to 3 rounds: plank 40-60 s, side plank 30 s a side, dead bug 10 a side, hanging knee raise or reverse crunch 10-12.",
  },
  legsDb: {
    title: "Legs (dumbbells) + core",
    detail:
      "Legs with dumbbells: goblet squat 3x10, DB Romanian deadlift 3x10, DB split squat 2x10 a side, bench step-up 2x10 a side, single-leg calf raise 3x12. Core, 2 to 3 rounds: plank 40-60 s, side plank 30 s a side, dead bug 10 a side, reverse crunch 12.",
  },
  upperA: {
    title: "Upper A",
    detail:
      "Upper A (pull-biased): pull-ups or lat pulldown 3x8, barbell or dumbbell row 3x8, incline dumbbell press 3x8-10, face pulls 3x12, curls 2x12, core.",
  },
  upperB: {
    title: "Upper B",
    detail:
      "Upper B (push-biased): bench press 3x6-8, overhead press 3x8, cable or dumbbell row 3x10, lateral raises 3x12, triceps 2x12, core.",
  },
  upperAdb: {
    title: "Upper A (dumbbells)",
    detail: "Upper A with dumbbells: row 3x10, incline press 3x10, pullover 3x12, rear-delt fly 3x12, curls 2x12, core.",
  },
  upperAdbLight: {
    title: "Upper A (dumbbells, light)",
    detail: "Light dumbbell session, 2 sets each: row, incline press, rear-delt fly, curls, core.",
  },
  upperAlightLegs: {
    title: "Upper A + light legs",
    detail: "Upper A as usual, then light legs only: goblet squat 2x10, calf raise 2x12. Core, 2 rounds. No heavy squats or RDLs from here.",
  },
  upperBlight: {
    title: "Upper B (light)",
    detail: "Upper B at 2 sets each, well short of failure. No legs.",
  },
};
