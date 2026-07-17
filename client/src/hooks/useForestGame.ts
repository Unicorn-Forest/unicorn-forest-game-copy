/**
 * UNICORN FOREST — Game State (KSM engine)
 * Zones start latent; running a KSM cycle on a reachable zone discovers it,
 * granting stardust, artifacts, allies. Wholeness = discovered/total.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ARTIFACTS, ZONES, ZONE_MAP } from "@/lib/forestData";

export interface GameState {
  discovered: string[];
  artifacts: string[];
  allies: string[]; // "moth"
  stardust: number;
  cycles: number; // KSM cycles run
  finaleReached: boolean;
}

const STORAGE_KEY = "unicorn-forest-save-v1";

const INITIAL: GameState = {
  discovered: ["moonwell"],
  artifacts: [],
  allies: [],
  stardust: 3,
  cycles: 1,
  finaleReached: false,
};

function load(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.discovered) && parsed.discovered.includes("moonwell"))
        return { ...INITIAL, ...parsed };
    }
  } catch {
    /* corrupted save — start fresh */
  }
  return INITIAL;
}

export type ZoneStatus = "discovered" | "reachable" | "locked" | "hidden";

export function useForestGame() {
  const [state, setState] = useState<GameState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const statusOf = useCallback(
    (zoneId: string): ZoneStatus => {
      const zone = ZONE_MAP[zoneId];
      if (state.discovered.includes(zoneId)) return "discovered";
      const adjacentDiscovered = zone.adjacent.some((a) =>
        state.discovered.includes(a),
      );
      if (!adjacentDiscovered) return "hidden";
      // reachable — but check requirements
      if (zone.requires?.ally && !state.allies.includes(zone.requires.ally))
        return "locked";
      if (
        zone.requires?.artifacts &&
        state.artifacts.length < zone.requires.artifacts
      )
        return "locked";
      return "reachable";
    },
    [state.discovered, state.allies, state.artifacts],
  );

  /** Discover a zone (call after the KSM cycle animation completes) */
  const discover = useCallback((zoneId: string) => {
    setState((prev) => {
      if (prev.discovered.includes(zoneId)) return prev;
      const zone = ZONE_MAP[zoneId];
      const artifacts = zone.artifactId
        ? [...prev.artifacts, zone.artifactId]
        : prev.artifacts;
      const allies =
        zoneId === "whispering-bridges" && !prev.allies.includes("moth")
          ? [...prev.allies, "moth"]
          : prev.allies;
      return {
        ...prev,
        discovered: [...prev.discovered, zoneId],
        artifacts,
        allies,
        stardust: prev.stardust + (zone.danger ? 5 : zone.finale ? 13 : 2),
        cycles: prev.cycles + 1,
        finaleReached: prev.finaleReached || !!zone.finale,
      };
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL);
  }, []);

  const wholeness = Math.round((state.discovered.length / ZONES.length) * 100);

  const questProgress = useMemo(() => {
    const unicornsMet = state.discovered.filter(
      (id) => ZONE_MAP[id]?.characterId && ZONE_MAP[id].characterId !== "weavers",
    ).length;
    return {
      unicornsMet,
      unicornsTotal: 3, // luna, aurelia, nova
      artifactsFound: state.artifacts.length,
      artifactsTotal: Object.keys(ARTIFACTS).length,
      mothJoined: state.allies.includes("moth"),
      thicketSurvived: state.discovered.includes("shadow-thicket"),
      chamberOpened: state.finaleReached,
    };
  }, [state]);

  return { state, statusOf, discover, reset, wholeness, questProgress };
}
