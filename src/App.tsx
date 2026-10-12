import { useEffect, useState } from "react";
import { Plan } from "./ui/Plan";
import { Today } from "./ui/Today";

export type Tab = "today" | "plan" | "wallpapers" | "settings";
const TABS: Array<[Tab, string]> = [["today", "Today"], ["plan", "Plan"], ["wallpapers", "Wallpapers"], ["settings", "Settings"]];

export function App() {
  const [tab, setTab] = useState<Tab>(() => (location.hash.slice(1) as Tab) || "today");
  useEffect(() => {
    history.replaceState(null, "", `#${tab}`);
    window.scrollTo(0, 0);
  }, [tab]);
  return (
    <>
      <main className="wrap">
        {tab === "today" && <Today />}
        {tab === "plan" && <Plan />}
        {tab === "wallpapers" && <p className="hint">Wallpapers are coming in the next commit.</p>}
        {tab === "settings" && <p className="hint">Settings are coming in the next commit.</p>}
      </main>
      <nav className="tabs" aria-label="Sections">
        {TABS.map(([id, label]) => (
          <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
    </>
  );
}
