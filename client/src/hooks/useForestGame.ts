/**
 * UNICORN FOREST — Game State (KSM engine) with full-stack persistence
 * Guests: localStorage. Signed-in cartographers: database via tRPC, with
 * one-time migration of any local progress on first login.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ARTIFACTS, ZONES, ZONE_MAP } from "@/lib/forestData";
import { trpc } from "@/lib/trpc";

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

function loadLocal(): GameState {
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
export type SyncStatus = "local" | "loading" | "synced" | "saving";

export function useForestGame() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<GameState>(loadLocal);
  /** Tracks whether we've merged the server save after login */
  const hydratedRef = useRef(false);

  const utils = trpc.useUtils();
  const remoteSave = trpc.expedition.load.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const saveMutation = trpc.expedition.save.useMutation();
  const resetMutation = trpc.expedition.reset.useMutation();

  // ---- Hydrate from DB on login (server wins unless local has more progress) ----
  useEffect(() => {
    if (!isAuthenticated) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current || remoteSave.isLoading) return;
    const remote = remoteSave.data;
    const local = loadLocal();
    if (remote && remote.discovered.length >= local.discovered.length) {
      // Server save is at least as advanced — adopt it
      setState({
        discovered: remote.discovered,
        artifacts: remote.artifacts,
        allies: remote.allies,
        stardust: remote.stardust,
        cycles: remote.cycles,
        finaleReached: remote.finaleReached,
      });
    } else {
      // No server save (or local is ahead) — push local progress up
      setState(local);
      saveMutation.mutate({
        discovered: local.discovered,
        artifacts: local.artifacts,
        allies: local.allies,
        stardust: local.stardust,
        cycles: local.cycles,
        finaleReached: local.finaleReached,
      });
    }
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, remoteSave.isLoading, remoteSave.data]);

  // ---- Persist every state change: localStorage always, DB when signed in ----
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const persistRemote = useCallback(
    (next: GameState) => {
      if (!isAuthenticated) return;
      saveMutation.mutate(
        {
          discovered: next.discovered,
          artifacts: next.artifacts,
          allies: next.allies,
          stardust: next.stardust,
          cycles: next.cycles,
          finaleReached: next.finaleReached,
        },
        { onSuccess: () => utils.expedition.load.invalidate() },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated],
  );

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
  const discover = useCallback(
    (zoneId: string) => {
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
        const next: GameState = {
          ...prev,
          discovered: [...prev.discovered, zoneId],
          artifacts,
          allies,
          stardust: prev.stardust + (zone.danger ? 5 : zone.finale ? 13 : 2),
          cycles: prev.cycles + 1,
          finaleReached: prev.finaleReached || !!zone.finale,
        };
        persistRemote(next);
        return next;
      });
    },
    [persistRemote],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL);
    if (isAuthenticated) {
      resetMutation.mutate(undefined, {
        onSuccess: () => utils.expedition.load.invalidate(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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

  const syncStatus: SyncStatus = !isAuthenticated
    ? "local"
    : remoteSave.isLoading
      ? "loading"
      : saveMutation.isPending
        ? "saving"
        : "synced";

  return { state, statusOf, discover, reset, wholeness, questProgress, syncStatus };
}
