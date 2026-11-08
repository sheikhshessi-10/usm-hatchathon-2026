import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  applyEvent,
  seedEpisodes,
  type Actor,
  type Command,
  type Event,
  type State,
} from "./engine";
const KEY = "carebridge-care-episodes-v1";
function restore(): { events: Event[]; warning: boolean } {
  try {
    const raw =
      typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
    if (!raw) return { events: [], warning: false };
    const x = JSON.parse(raw);
    if (x.version !== 1 || !Array.isArray(x.events))
      throw Error("Unsupported episode record");
    let state = seedEpisodes();
    for (const event of x.events) {
      if (
        !event ||
        !event.actor ||
        !event.command ||
        typeof event.command.type !== "string" ||
        event.protocolVersion !== "demo-1.0" ||
        !Number.isFinite(Date.parse(event.at))
      )
        throw Error("Invalid episode event");
      state = applyEvent(state, event);
    }
    return { events: x.events, warning: false };
  } catch {
    return { events: [], warning: true };
  }
}
type ContextValue = {
  state: State;
  warning: string;
  dispatch: (episodeId: string, actor: Actor, command: Command) => void;
  reset: () => void;
};
const Context = createContext<ContextValue | null>(null);
export function EpisodeProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState(restore);
  const [writeFailed, setWriteFailed] = useState(false);
  const state = saved.events.reduce(applyEvent, seedEpisodes());
  useEffect(() => {
    if (saved.warning) return;
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ version: 1, events: saved.events }),
      );
      setWriteFailed(false);
    } catch {
      setWriteFailed(true);
    }
  }, [saved]);
  const dispatch = (episodeId: string, actor: Actor, command: Command) =>
    setSaved((s) => ({
      ...s,
      events: [
        ...s.events,
        {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          episodeId,
          actor,
          command,
          protocolVersion: "demo-1.0",
        },
      ],
    }));
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        warning: saved.warning
          ? "Stored episode events could not be restored. The original browser record is retained; reset explicitly to replace it. New changes are session-only."
          : writeFailed
            ? "Episode changes are session-only because browser storage is unavailable."
            : "",
        reset: () => setSaved({ events: [], warning: false }),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useEpisodes() {
  const value = useContext(Context);
  if (!value) throw Error("EpisodeProvider required");
  return value;
}
