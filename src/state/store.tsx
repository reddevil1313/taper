import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { fetchPsi } from "../domain/airQuality";
import { initialState, reducer, type Action } from "./reducer";
import { localStore, type AppState, type Storage } from "./storage";

const Ctx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

const PSI_REFRESH_MS = 30 * 60 * 1000;

export function StoreProvider({ children, storage = localStore }: { children: ReactNode; storage?: Storage }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => storage.load() ?? initialState());

  useEffect(() => storage.save(state), [state, storage]);

  // PSI updates hourly upstream; refresh on open and every 30 minutes while open.
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchPsi(state.profile.air.region)
        .then((reading) => alive && dispatch({ type: "psi", reading, at: Date.now() }))
        .catch(() => alive && dispatch({ type: "psi", reading: null, at: Date.now() }));
    if (!state.psiFetchedAt || Date.now() - state.psiFetchedAt > PSI_REFRESH_MS) load();
    const t = setInterval(load, PSI_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.profile.air.region]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
