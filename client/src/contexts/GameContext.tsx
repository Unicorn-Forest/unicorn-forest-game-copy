/**
 * UNICORN FOREST — Shared game context
 * Lifts useForestGame (which owns mutations + localStorage persistence and
 * must run exactly once) plus cross-page UI state (selected zone, started
 * flag for the Music Shrine autoplay) into a provider that wraps every
 * /forest/* page in the dashboard shell.
 */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { playMaterializeChime } from "@/lib/ambient";
import { useForestGame } from "@/hooks/useForestGame";
import type { Zone } from "@/lib/forestData";

/** sessionStorage flag set by the landing page's ENTER THE FOREST button */
const ENTERED_KEY = "unicorn-forest-entered";

export function markEntered() {
  try {
    sessionStorage.setItem(ENTERED_KEY, "1");
  } catch {
    /* private mode — shrine simply stays quiet */
  }
}

function hasEntered(): boolean {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === "1";
  } catch {
    return false;
  }
}

type ForestGame = ReturnType<typeof useForestGame>;

interface GameContextValue extends ForestGame {
  selected: Zone | null;
  setSelected: (z: Zone | null) => void;
  justDiscovered: string | null;
  /** true once the player entered via the landing gate this session */
  started: boolean;
  runCycle: (zoneId: string) => void;
  resetAll: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useForestGame();
  const [selected, setSelected] = useState<Zone | null>(null);
  const [justDiscovered, setJustDiscovered] = useState<string | null>(null);
  // "started" gates the Music Shrine autoplay — set when arriving through
  // the landing page's ENTER THE FOREST button (once per browser session).
  const [started] = useState<boolean>(hasEntered);

  const runCycle = useCallback(
    (zoneId: string) => {
      game.discover(zoneId);
      setJustDiscovered(zoneId);
      playMaterializeChime();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game.discover],
  );

  const resetAll = useCallback(() => {
    game.reset();
    setSelected(null);
    setJustDiscovered(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.reset]);

  return (
    <GameContext.Provider
      value={{
        ...game,
        selected,
        setSelected,
        justDiscovered,
        started,
        runCycle,
        resetAll,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
