# Taper — feature plan

Taper is a training planner for people whose week isn't a week. It builds a race plan around a
rotating duty roster (Singapore NS 3-in/3-out, shift work, rotations), re-plans itself when sessions
are missed, swaps runs to the treadmill when the air is bad, and turns each day into a lock-screen
wallpaper.

Built as an installable PWA (works on iPhone via "Add to Home Screen"), so one codebase covers
iOS, Android and desktop. A native wrapper (Capacitor) is a later milestone.

## Problem it solves

Generic plans assume Mon–Sun weeks, a gym that's always the same, and clean air. Reality:

- **Rotating availability.** Days in camp have a full gym 3–5pm on weekdays but only dumbbells on
  weekends; days out have a public gym and roads; book-out and book-in days cut evenings short.
- **Missed sessions.** Life happens. A plan that just marks things "late" stops being useful.
- **Haze.** When 24-hour PSI goes over 100, outdoor quality sessions should move to a treadmill
  with the right speeds.
- **Visibility.** A plan in an app nobody opens doesn't get followed.

## Features

### F1. Profile and constraints (MVP)
- Race date, distance, goal time, current 5 km / 10 km pace.
- Duty cycle: anchor book-in date and time, days in / days out, book-in and book-out times.
- Leave and overrides (e.g. on leave 4–6 Dec covering race day).
- Facilities per context: camp weekday (full gym + treadmill), camp weekend (dumbbells + bench),
  out of camp (public gym + outdoors), preferred session times per context.
- Strength preferences (exercises to exclude, e.g. leg curls / extensions; core on leg days).

### F2. Plan generator (MVP)
- Derives pace zones (easy, tempo, interval, race pace) from goal time and current fitness.
- Periodised long-run ladder with step-back weeks, peak ~2 weeks out, and taper.
- Places sessions cycle by cycle using rules, not a fixed weekly template:
  - long runs only on out-of-camp days (morning, before book-in);
  - quality runs + heavy legs only where there's a treadmill or roads;
  - no two hard days back to back where the cycle allows it;
  - weekend camp days get dumbbell variants (including a dumbbell leg day);
  - last heavy leg day ~18 days out, light legs only in the taper.
- Every run carries an outdoor version and a treadmill version (speeds in km/h at 1% incline).

### F3. Tracker (MVP)
- Today card, countdown, sessions ticked, kilometres run, long-run ladder.
- Tick done, log distance / pace / notes, or mark skipped (skips don't count as "late").
- Filter by to-do / runs / strength.

### F4. Resync engine (MVP)
- "Resync from today": re-plans every future session from the actual history.
- Missed long run → ladder restarts from the last long run actually completed.
- Missed strength session → make-up on the next suitable free day.
- Sessions done on a different day are moved, not duplicated.
- Shows a diff (moved / added / removed) before applying.

### F5. Air quality mode (MVP)
- Live 24-hour PSI from data.gov.sg (by region or highest region).
- Bands: Good ≤50, Moderate 51–100, Unhealthy 101–200, Very unhealthy 201–300, Hazardous >300.
- Over the threshold (default 100), runs show their treadmill version; manual override always wins.

### F6. Daily wallpapers (MVP)
- Canvas renderer: countdown, today's session, haze swap line, a motivational line; layout keeps
  clear of the iOS clock and the flashlight/camera row.
- Export every day to race day as a ZIP of `YYYY-MM-DD.png` for an iOS Shortcuts automation.

### F7. Calendar export (MVP)
- `.ics` export of the plan (titles tagged `[HM]`) for Apple / Google Calendar.

### F8. Offline and data (MVP)
- PWA: manifest, offline cache, home-screen icon.
- Local-first storage; JSON export / import for backup.

### Later
- L1. Google Calendar two-way sync (OAuth) with clash detection against a duty calendar.
- L2. Push reminders for the day's session and PSI alerts.
- L3. Capacitor iOS build; Apple Health / Strava import of completed runs.
- L4. Multi-race support and plan templates (10 km, marathon).

## Architecture

- **Vite + React + TypeScript**, no UI framework; CSS variables for theming.
- **Domain layer is pure TypeScript** (`src/domain`), framework-free and unit-tested with Vitest:
  `dates`, `duty`, `paces`, `workouts`, `generator`, `resync`, `airQuality`, `ics`.
- **State**: a small reducer + context, persisted to `localStorage` behind a storage interface.
- **Wallpapers**: `src/wallpaper` renders to `<canvas>`; JSZip packs the set.

## Commit plan

1. Feature plan and README
2. Scaffold: Vite, React, TS, Vitest, lint config
3. Domain types, date utilities and duty-cycle model (+ tests)
4. Pace zones and workout builders with treadmill conversion (+ tests)
5. Plan generator (+ tests)
6. Resync engine (+ tests)
7. Air quality client and decision logic (+ tests)
8. ICS export (+ tests)
9. App state, persistence and seed profile
10. Today + Plan views with logging and skip
11. Settings view and resync preview
12. Wallpaper renderer and ZIP export
13. PWA manifest, service worker, icons
14. README polish, screenshots, deploy notes
