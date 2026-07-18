/**
 * Oracle router tests — validates the Chatbase secret against the real API
 * (one lightweight live call) and unit-tests the router glue with mocks.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { isOracleConfigured } from "./chatbase";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(user: Partial<AuthenticatedUser> | null, ip = "1.2.3.4"): TrpcContext {
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

describe("chatbase credentials (live)", () => {
  it("has the oracle configured via env secrets", () => {
    expect(isOracleConfigured()).toBe(true);
  });

  it(
    "answers a live chat round-trip with the CHATBASE_UNICORN_API key",
    { timeout: 60_000 },
    async () => {
      const { askOracle } = await import("./chatbase");
      const reply = await askOracle("Reply with exactly one short greeting sentence.");
      expect(reply.text.length).toBeGreaterThan(0);
      expect(typeof reply.conversationId).toBe("string");
    },
  );
});

describe("oracle.ask router (mocked)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the oracle text and conversationId on success", async () => {
    vi.doMock("./chatbase", () => ({
      isOracleConfigured: () => true,
      askOracle: vi.fn(async () => ({
        text: "Welcome, traveler.",
        conversationId: "conv-1",
        credits: 1,
      })),
    }));
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "9.9.9.1"));
    const res = await caller.oracle.ask({ message: "hello" });
    expect(res.live).toBe(true);
    expect(res.text).toBe("Welcome, traveler.");
    expect(res.conversationId).toBe("conv-1");
    vi.doUnmock("./chatbase");
  });

  it("falls back gracefully when the live call fails", async () => {
    vi.doMock("./chatbase", () => ({
      isOracleConfigured: () => true,
      askOracle: vi.fn(async () => {
        throw new Error("boom");
      }),
    }));
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "9.9.9.2"));
    const res = await caller.oracle.ask({ message: "hello" });
    expect(res.live).toBe(false);
    expect(res.text).toMatch(/veil|faint/i);
    vi.doUnmock("./chatbase");
  });

  it("rejects empty messages", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "9.9.9.3"));
    await expect(caller.oracle.ask({ message: "   " })).rejects.toThrow();
  });

  it("rate-limits after 20 asks in the window", async () => {
    vi.doMock("./chatbase", () => ({
      isOracleConfigured: () => true,
      askOracle: vi.fn(async () => ({ text: "ok", conversationId: "c", credits: 1 })),
    }));
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeCtx(null, "9.9.9.4"));
    for (let i = 0; i < 20; i++) {
      await caller.oracle.ask({ message: `q${i}` });
    }
    await expect(caller.oracle.ask({ message: "one too many" })).rejects.toThrow(/stillness/i);
    vi.doUnmock("./chatbase");
  });
});

describe("allowOracleAsk", () => {
  it("permits under the limit and blocks over it", async () => {
    const { allowOracleAsk } = await import("./routers");
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 5; i++) expect(allowOracleAsk(key, 5, 1000)).toBe(true);
    expect(allowOracleAsk(key, 5, 1000)).toBe(false);
  });
});
