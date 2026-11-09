import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import {
  applyEvent,
  eventValidationError,
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
    if (raw === null) return { events: [], warning: false };
    const x = JSON.parse(raw);
    if (x.version !== 1 || !Array.isArray(x.events))
      throw Error("Unsupported episode record");
    const ids = new Set<string>();
    for (const event of x.events) {
      if (eventValidationError(event) || ids.has(event.id))
        throw Error("Invalid episode event");
      ids.add(event.id);
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
  const state = useMemo(() => saved.events.reduce(applyEvent, seedEpisodes()), [saved.events]);
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
