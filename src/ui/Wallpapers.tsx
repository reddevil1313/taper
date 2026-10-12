import JSZip from "jszip";
import { useEffect, useRef, useState } from "react";
import { addDays, fmtDay } from "../domain/dates";
import { useStore } from "../state/store";
import { canvasToBlob, drawWallpaper, loadFonts, SIZES } from "../wallpaper/render";
import { wallpaperContent, wallpaperDays } from "../wallpaper/content";
import { download } from "./download";
import { useToday } from "./helpers";

type SizeKey = keyof typeof SIZES;

export function Wallpapers() {
  const { state } = useStore();
  const today = useToday();
  const [day, setDay] = useState(today);
  const [size, setSize] = useState<SizeKey>("iPhone 14/15/16");
  const [busy, setBusy] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);
  const days = wallpaperDays(today <= state.profile.race.date ? today : state.profile.race.date, state.profile.race.date);

  useEffect(() => {
    let alive = true;
    loadFonts().then(() => {
      if (!alive || !preview.current) return;
      drawWallpaper(preview.current, wallpaperContent(day, state.plan, state.profile, Math.max(0, days.indexOf(day))), SIZES[size]);
    });
    return () => { alive = false; };
  }, [day, size, state.plan, state.profile, days]);

  const exportAll = async () => {
    setBusy("Rendering…");
    await loadFonts();
    const zip = new JSZip();
    const folder = zip.folder("Taper wallpapers")!;
    const canvas = document.createElement("canvas");
    for (const [i, d] of days.entries()) {
      setBusy(`Rendering ${i + 1} of ${days.length}`);
      drawWallpaper(canvas, wallpaperContent(d, state.plan, state.profile, i), SIZES[size]);
      folder.file(`${d}.png`, await canvasToBlob(canvas));
    }
    setBusy("Zipping…");
    download(`wallpapers-${days[0]}-to-${days[days.length - 1]}.zip`, await zip.generateAsync({ type: "blob" }), "application/zip");
    setBusy("");
  };

  return (
    <>
      <section>
        <h2>Daily wallpapers</h2>
        <p className="hint" style={{ marginTop: 6 }}>One lock-screen image per day to race day: countdown, the day's session and its haze swap. Each file is named by date so a Shortcuts automation can set today's.</p>
      </section>
      <section className="panel">
        <div className="grid2">
          <label className="field">Day
            <select id="wp-day" value={day} onChange={(e) => setDay(e.target.value)}>
              {days.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
            </select>
          </label>
          <label className="field">Phone
            <select id="wp-size" value={size} onChange={(e) => setSize(e.target.value as SizeKey)}>
              {Object.keys(SIZES).map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="btns">
          <button className="btn ghost" onClick={() => setDay(addDays(day, -1) >= days[0] ? addDays(day, -1) : day)}>Previous day</button>
          <button className="btn ghost" onClick={() => setDay(addDays(day, 1) <= days[days.length - 1] ? addDays(day, 1) : day)}>Next day</button>
          <button className="btn" disabled={!!busy} onClick={exportAll}>{busy || `Download all ${days.length} (.zip)`}</button>
        </div>
        <canvas ref={preview} aria-label={`Wallpaper for ${fmtDay(day)}`} style={{ width: "min(100%, 300px)", height: "auto", borderRadius: 24, justifySelf: "center", border: "1.5px solid var(--line)" }} />
      </section>
      <section className="panel">
        <h2>Set it up on iPhone</h2>
        <ol className="hint" style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
          <li>Unzip the download into a Files folder, e.g. iCloud Drive › Wallpapers.</li>
          <li>In Shortcuts, make an automation: Time of Day, 12:01am, daily, run immediately.</li>
          <li>Actions: Current Date → Format Date (custom, yyyy-MM-dd) → Get File from Wallpapers named "Formatted Date.png" → Set Wallpaper (lock screen).</li>
          <li>Re-export after a resync, since sessions are baked into the images.</li>
        </ol>
      </section>
    </>
  );
}
