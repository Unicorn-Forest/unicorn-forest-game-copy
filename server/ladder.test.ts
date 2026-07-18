/**
 * System Ladder router tests — verifies the A000081 cosmology registry.
 * sys(N) = a000081(N+1): S1..S9 → 1, 2, 4, 9, 20, 48, 115, 286, 719.
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const A000081_SYS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 9,
  5: 20,
  6: 48,
  7: 115,
  8: 286,
  9: 719,
};

describe("ladder.systems", () => {
  it("returns all nine strata with A000081 term counts", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const systems = await caller.ladder.systems();

    expect(systems).toHaveLength(9);
    for (const s of systems) {
      expect(s.termCount).toBe(A000081_SYS[s.ordinal]);
    }
    // ordered by ordinal ascending
    expect(systems.map((s) => s.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("carries the canonical epithets", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const systems = await caller.ladder.systems();
    const byOrdinal = new Map(systems.map((s) => [s.ordinal, s.epithet]));

    expect(byOrdinal.get(3)).toBe("PHYSIS");
    expect(byOrdinal.get(4)).toBe("BIOS");
    expect(byOrdinal.get(7)).toBe("LUDUS");
    expect(byOrdinal.get(9)).toBe("AXIS MUNDI");
  });
});

describe("ladder.features", () => {
  it("maps every feature to a valid stratum", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const features = await caller.ladder.features();

    expect(features.length).toBeGreaterThanOrEqual(11);
    for (const f of features) {
      expect(f.systemOrdinal).toBeGreaterThanOrEqual(1);
      expect(f.systemOrdinal).toBeLessThanOrEqual(9);
      expect(["live", "planned"]).toContain(f.status);
    }
    // canon anchors: KSM cycle lives at S4, wizard council now live at S6
    const ksm = features.find((f) => f.featureKey === "ksm-cycle");
    expect(ksm?.systemOrdinal).toBe(4);
    const council = features.find((f) => f.featureKey === "wizard-council");
    expect(council?.systemOrdinal).toBe(6);
    expect(council?.status).toBe("live");
  });
});
