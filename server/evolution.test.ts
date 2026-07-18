/**
 * Evolution router tests — the forest's autoresearch ledger.
 * Covers: cycle recording with live oracle lore, seed-lore fallback,
 * idempotency caching per (expedition, zone), ledger listing, and reset.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(user: Partial<AuthenticatedUser> | null, ip = "5.6.7.8"): TrpcContext {
  return {
    user: user
      ? ({
          id: 7,
          openId: "tester",
          email: "x@example.com",
          name: "Tester",
          loginMethod: "manus",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
          ...user,
        } as AuthenticatedUser)
      : null,
    req: { protocol: "https", headers: {}, ip } as unknown as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

/** Build a db mock; individual tests override pieces as needed. */
function dbMockFactory(overrides: Record<string, unknown> = {}) {
  return {
    // evolution ledger
    listEvolutionCycles: vi.fn(async () => []),
    getCycleForZone: vi.fn(async () => undefined),
    insertEvolutionCycle: vi.fn(async (c: Record<string, unknown>) => ({
      id: 1,
      createdAt: new Date(),
      ...c,
    })),
    deleteEvolutionCycles: vi.fn(async () => undefined),
    // everything else routers.ts imports
    deleteFieldNote: vi.fn(),
    deleteGameSave: vi.fn(),
    deleteMemorialTrack: vi.fn(),
    deleteTribute: vi.fn(),
    getGameSave: vi.fn(),
    insertFieldNote: vi.fn(),
    insertMemorialTrack: vi.fn(),
    insertTribute: vi.fn(),
    listFieldNotes: vi.fn(async () => []),
    listMemorialTracks: vi.fn(async () => []),
    listTributes: vi.fn(async () => []),
    upsertGameSave: vi.fn(),
    ...overrides,
  };
}

describe("evolution.runCycle", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("records a cycle with live oracle lore when the oracle answers", async () => {
    const dbMock = dbMockFactory();
    vi.doMock("./db", () => dbMock);
    vi.doMock("./chatbase", () => ({
      isOracleConfigured: () => true,
      askOracle: vi.fn(async () => ({
        text: "A silver pool opens its eye and the forest remembers your name.",
        conversationId: "conv-evo",
        credits: 1,
      })),
    }));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "10.0.0.1"));
    const res = await caller.evolution.runCycle({
      expeditionId: "exp-test0001",
      zoneId: "moonwell",
      cycleNumber: 1,
      wholenessAfter: 8,
    });

    expect(res.cached).toBe(false);
    expect(res.cycle?.liveOracle).toBe(1);
    expect(res.cycle?.mutation).toContain("silver pool");
    expect(res.cycle?.hypothesis).toContain("sacred");
    expect(res.cycle?.verdict).toBe("keep");
    expect(dbMock.insertEvolutionCycle).toHaveBeenCalledOnce();

    vi.doUnmock("./db");
    vi.doUnmock("./chatbase");
  });

  it("falls back to seed lore when the oracle call fails", async () => {
    const dbMock = dbMockFactory();
    vi.doMock("./db", () => dbMock);
    vi.doMock("./chatbase", () => ({
      isOracleConfigured: () => true,
      askOracle: vi.fn(async () => {
        throw new Error("oracle sleeping");
      }),
    }));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "10.0.0.2"));
    const res = await caller.evolution.runCycle({
      expeditionId: "exp-test0002",
      zoneId: "unicorn-village",
      cycleNumber: 2,
      wholenessAfter: 15,
    });

    expect(res.cached).toBe(false);
    expect(res.cycle?.liveOracle).toBe(0);
    // seed lore from shared/forestSeed.ts
    expect(res.cycle?.mutation).toContain("Treeborne Chambers");

    vi.doUnmock("./db");
    vi.doUnmock("./chatbase");
  });

  it("is idempotent — returns the cached experiment for a repeated zone", async () => {
    const cached = {
      id: 42,
      userId: null,
      expeditionId: "exp-test0003",
      cycleNumber: 3,
      zoneId: "moonwell",
      hypothesis: "cached hypothesis",
      mutation: "cached mutation",
      liveOracle: 1,
      wholenessAfter: 23,
      verdict: "keep" as const,
      createdAt: new Date(),
    };
    const dbMock = dbMockFactory({ getCycleForZone: vi.fn(async () => cached) });
    const oracleSpy = vi.fn();
    vi.doMock("./db", () => dbMock);
    vi.doMock("./chatbase", () => ({
      isOracleConfigured: () => true,
      askOracle: oracleSpy,
    }));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "10.0.0.3"));
    const res = await caller.evolution.runCycle({
      expeditionId: "exp-test0003",
      zoneId: "moonwell",
      cycleNumber: 9,
      wholenessAfter: 99,
    });

    expect(res.cached).toBe(true);
    expect(res.cycle).toEqual(cached);
    expect(oracleSpy).not.toHaveBeenCalled();
    expect(dbMock.insertEvolutionCycle).not.toHaveBeenCalled();

    vi.doUnmock("./db");
    vi.doUnmock("./chatbase");
  });

  it("rejects unknown zone ids", async () => {
    vi.doMock("./db", () => dbMockFactory());
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "10.0.0.4"));
    await expect(
      caller.evolution.runCycle({
        expeditionId: "exp-test0004",
        zoneId: "not-a-zone",
        cycleNumber: 1,
        wholenessAfter: 0,
      }),
    ).rejects.toThrow();
    vi.doUnmock("./db");
  });
});

describe("evolution.ledger & resetLedger", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("lists the expedition ledger in cycle order", async () => {
    const rows = [
      { id: 1, cycleNumber: 1, zoneId: "moonwell" },
      { id: 2, cycleNumber: 2, zoneId: "unicorn-village" },
    ];
    const dbMock = dbMockFactory({ listEvolutionCycles: vi.fn(async () => rows) });
    vi.doMock("./db", () => dbMock);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null));
    const res = await caller.evolution.ledger({ expeditionId: "exp-test0005" });

    expect(res).toEqual(rows);
    expect(dbMock.listEvolutionCycles).toHaveBeenCalledWith("exp-test0005");
    vi.doUnmock("./db");
  });

  it("clears the ledger on reset", async () => {
    const dbMock = dbMockFactory();
    vi.doMock("./db", () => dbMock);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null));
    const res = await caller.evolution.resetLedger({ expeditionId: "exp-test0006" });

    expect(res).toEqual({ success: true });
    expect(dbMock.deleteEvolutionCycles).toHaveBeenCalledWith("exp-test0006");
    vi.doUnmock("./db");
  });
});

describe("buildEvolutionPrompt (ledger-aware lore)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses the plain prompt when the ledger is empty", async () => {
    const { buildEvolutionPrompt } = await import("./routers");
    const prompt = buildEvolutionPrompt(
      { name: "The Moonwell", tagline: "a silver pool that remembers" },
      [],
    );
    expect(prompt).toContain("The Moonwell");
    expect(prompt).not.toContain("ledger already records");
  });

  it("weaves the three most recent experiments into the prompt", async () => {
    const { buildEvolutionPrompt } = await import("./routers");
    const prior = [
      { zoneId: "moonwell", hypothesis: "h1", cycleNumber: 1 },
      { zoneId: "unicorn-village", hypothesis: "h2", cycleNumber: 2 },
      { zoneId: "moonwell", hypothesis: "h3", cycleNumber: 3 },
      { zoneId: "unicorn-village", hypothesis: "h4", cycleNumber: 4 },
    ];
    const prompt = buildEvolutionPrompt(
      { name: "Whispering Bridges", tagline: "spans that speak" },
      prior,
    );
    expect(prompt).toContain("ledger already records");
    // only the last 3 cycles appear
    expect(prompt).not.toContain("cycle 1:");
    expect(prompt).toContain("cycle 2:");
    expect(prompt).toContain("cycle 3:");
    expect(prompt).toContain("cycle 4:");
    expect(prompt).toContain("echo or answer");
  });

  it("runCycle passes prior ledger context to the oracle", async () => {
    const prior = [
      { id: 1, zoneId: "moonwell", hypothesis: "a silver pool", cycleNumber: 1 },
    ];
    const dbMock = dbMockFactory({ listEvolutionCycles: vi.fn(async () => prior) });
    const oracleSpy = vi.fn(async () => ({
      text: "The bridges answer the pool that came before them, singing across the dark.",
      conversationId: "conv-mem",
      credits: 1,
    }));
    vi.doMock("./db", () => dbMock);
    vi.doMock("./chatbase", () => ({
      isOracleConfigured: () => true,
      askOracle: oracleSpy,
    }));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "10.0.0.9"));
    await caller.evolution.runCycle({
      expeditionId: "exp-test0009",
      zoneId: "unicorn-village",
      cycleNumber: 2,
      wholenessAfter: 16,
    });

    expect(oracleSpy).toHaveBeenCalledOnce();
    const promptArg = oracleSpy.mock.calls[0][0] as string;
    expect(promptArg).toContain("ledger already records");
    expect(promptArg).toContain("cycle 1:");

    vi.doUnmock("./db");
    vi.doUnmock("./chatbase");
  });
});
