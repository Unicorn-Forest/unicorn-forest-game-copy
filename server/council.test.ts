/**
 * Council of Wizards tests — verifies the S6 registry (nine disposition-wizards
 * in three ennead triads) and the deterministic wizard attribution used by the
 * evolution ledger (triad by zone, seat by cycle).
 */
import { describe, expect, it } from "vitest";
import { appRouter, attributeWizard } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("council.wizards", () => {
  it("returns nine wizards in three triads of three seats", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const wizards = await caller.council.wizards();
    expect(wizards).toHaveLength(9);

    const triads = ["b9", "p9", "j9"] as const;
    const seats = ["anchor", "weaver", "herald"] as const;
    for (const triad of triads) {
      const members = wizards.filter((w) => w.triad === triad);
      expect(members).toHaveLength(3);
      expect(new Set(members.map((w) => w.seat))).toEqual(new Set(seats));
    }

    // every wizard carries a disposition and persona flavor (S6 operators)
    for (const w of wizards) {
      expect(w.key.length).toBeGreaterThan(0);
      expect(w.name.length).toBeGreaterThan(0);
      expect(w.disposition.length).toBeGreaterThan(0);
      expect(w.flavor.length).toBeGreaterThan(0);
    }
  });
});

describe("attributeWizard", () => {
  it("is deterministic — same zone and cycle always meet the same interpreter", () => {
    const a = attributeWizard("moonwell", 1);
    const b = attributeWizard("moonwell", 1);
    expect(a).toBe(b);
  });

  it("rotates the seat with the cycle number (cycle % 3)", () => {
    const c1 = attributeWizard("moonwell", 1);
    const c2 = attributeWizard("moonwell", 2);
    const c3 = attributeWizard("moonwell", 3);
    const c4 = attributeWizard("moonwell", 4);
    // three distinct seats within one triad, then the wheel returns
    expect(new Set([c1, c2, c3]).size).toBe(3);
    expect(c4).toBe(c1);
  });

  it("assigns every attribution to a wizard registered in the council", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const wizards = await caller.council.wizards();
    const keys = new Set(wizards.map((w) => w.key));
    for (const zone of ["moonwell", "whispering-glade", "lumina-towers"]) {
      for (let cycle = 1; cycle <= 3; cycle++) {
        expect(keys.has(attributeWizard(zone, cycle))).toBe(true);
      }
    }
  });
});
