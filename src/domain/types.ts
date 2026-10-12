/** Calendar date in local time, `YYYY-MM-DD`. */
export type ISODate = string;
/** Local clock time, `HH:MM` (24h). */
export type HHMM = string;

/** What a day looks like for training, derived from the duty roster. */
export type DayContext = "camp-weekday" | "camp-weekend" | "out" | "leave";

export interface DayInfo {
  date: ISODate;
  context: DayContext;
  /** Books in to camp this evening (out-of-camp morning still usable). */
  bookIn: boolean;
  /** Books out of camp this evening (evening sessions unrealistic). */
  bookOut: boolean;
}

export type RunType = "easy" | "tempo" | "intervals" | "long" | "race-pace" | "race";

export interface RunSpec {
  type: RunType;
  km: number;
  /** Outdoor (or race) instructions. */
  detail: string;
  /** Treadmill version, used in camp and whenever the air is bad. */
  treadmill?: string;
}

export type LiftKey =
  | "legs"
  | "legsDb"
  | "upperA"
  | "upperB"
  | "upperAdb"
  | "upperAdbLight"
  | "upperAlightLegs"
  | "upperBlight";

export interface Session {
  id: string;
  date: ISODate;
  start: HHMM;
  mins: number;
  title: string;
  where: "camp" | "out";
  run?: RunSpec;
  lift?: LiftKey;
  liftDetail?: string;
  note?: string;
  optional?: boolean;
  kind?: "race" | "admin";
}

export interface LogEntry {
  done?: boolean;
  skipped?: boolean;
  km?: number | "";
  pace?: string;
  note?: string;
  /** Date it was actually done, when different from the planned date. */
  doneOn?: ISODate;
  at: number;
}
export type Log = Record<string, LogEntry>;

export interface DutyCycle {
  /** A book-in date that anchors the roster. */
  anchorBookIn: ISODate;
  daysIn: number;
  daysOut: number;
  bookInTime: HHMM;
  bookOutTime: HHMM;
}

export interface Leave {
  /** Local datetime `YYYY-MM-DDTHH:MM`. */
  from: string;
  to: string;
}

export type PsiRegion = "north" | "south" | "east" | "west" | "central" | "max";

export interface Profile {
  name: string;
  race: {
    name: string;
    date: ISODate;
    start: HHMM;
    distanceKm: number;
    /** Goal finish time `H:MM:SS`. */
    goal: string;
    location: string;
  };
  /** Current easy-ish 5 km pace, `M:SS` per km. */
  current5kPace: string;
  planStart: ISODate;
  duty: DutyCycle;
  leaves: Leave[];
  times: {
    campWeekday: HHMM;
    campWeekend: HHMM;
    outGym: HHMM;
    outLongRun: HHMM;
  };
  air: {
    threshold: number;
    region: PsiRegion;
  };
}
