import { useEffect, useState } from "react";
import { Plan } from "./ui/Plan";
import { Settings } from "./ui/Settings";
import { Today } from "./ui/Today";
import { Wallpapers } from "./ui/Wallpapers";

export type Tab = "today" | "plan" | "wallpapers" | "settings";
const TABS: Array<[Tab, string]> = [["today", "Today"], ["plan", "Plan"], ["wallpapers", "Wallpapers"], ["settings", "Settings"]];

export function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const t = location.hash.slice(1) as Tab;
    return TABS.some(([id]) => id === t) ? t : "today";
  });
  useEffect(() => {
    const onHash = () => {
      const t = location.hash.slice(1) as Tab;
      if (TABS.some(([id]) => id === t)) setTab(t);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    history.replaceState(null, "", `#${tab}`);
    window.scrollTo(0, 0);
  }, [tab]);
  return (
    <>
      <main className="wrap">
        {tab === "today" && <Today />}
        {tab === "plan" && <Plan />}
        {tab === "wallpapers" && <Wallpapers />}
        {tab === "settings" && <Settings />}
      </main>
      <nav className="tabs" aria-label="Sections">
        {TABS.map(([id, label]) => (
          <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
    </>
  );
}
