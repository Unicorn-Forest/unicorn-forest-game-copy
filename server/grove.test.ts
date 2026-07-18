/**
 * Kayla's Grove guestbook router tests.
 * DB helpers are mocked; we verify validation, auth gating, and pass-through.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listTributes: vi.fn(async () => [
    { id: 1, authorName: "Nova", message: "We miss you.", userId: null, createdAt: new Date() },
  ]),
  insertTribute: vi.fn(async () => [
    { id: 2, authorName: "Luna", message: "Forever in the constellation.", userId: null, createdAt: new Date() },
  ]),
  deleteTribute: vi.fn(async () => undefined),
  // unused by these tests but imported by routers.ts
  getGameSave: vi.fn(),
  upsertGameSave: vi.fn(),
  deleteGameSave: vi.fn(),
  listFieldNotes: vi.fn(),
  insertFieldNote: vi.fn(),
  deleteFieldNote: vi.fn(),
  listMemorialTracks: vi.fn(async () => []),
  insertMemorialTrack: vi.fn(),
  deleteMemorialTrack: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(user: Partial<AuthenticatedUser> | null): TrpcContext {
  return {
    user: user
      ? ({
          id: 7,
          openId: "guest-or-admin",
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("grove.tributes", () => {
  it("is public — returns tributes without auth", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const rows = await caller.grove.tributes();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.authorName).toBe("Nova");
  });
});

describe("grove.leaveTribute", () => {
  it("accepts anonymous tributes (no login required)", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const rows = await caller.grove.leaveTribute({
      authorName: "Luna",
      message: "Forever in the constellation.",
    });
    expect(db.insertTribute).toHaveBeenCalledWith({
      authorName: "Luna",
      message: "Forever in the constellation.",
      userId: null,
    });
    expect(rows).toHaveLength(1);
  });

  it("links the tribute to the logged-in user when present", async () => {
    const caller = appRouter.createCaller(makeCtx({ id: 42 }));
    await caller.grove.leaveTribute({ authorName: "Dan", message: "For Kayla, always." });
    expect(db.insertTribute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42 }),
    );
  });

  it("rejects an empty name", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.grove.leaveTribute({ authorName: "   ", message: "hello there" }),
    ).rejects.toThrow();
  });

  it("rejects a too-short message", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.grove.leaveTribute({ authorName: "Luna", message: "x" }),
    ).rejects.toThrow();
  });

  it("rejects a message over 2000 chars", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.grove.leaveTribute({ authorName: "Luna", message: "y".repeat(2001) }),
    ).rejects.toThrow();
  });

  it("trims whitespace from name and message", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await caller.grove.leaveTribute({ authorName: "  Luna  ", message: "  a memory  " });
    expect(db.insertTribute).toHaveBeenCalledWith(
      expect.objectContaining({ authorName: "Luna", message: "a memory" }),
    );
  });
});

describe("grove.removeTribute", () => {
  it("requires login", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.grove.removeTribute({ id: 1 })).rejects.toThrow();
    expect(db.deleteTribute).not.toHaveBeenCalled();
  });

  it("forbids non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx({ role: "user" }));
    await expect(caller.grove.removeTribute({ id: 1 })).rejects.toThrow(/keeper/i);
    expect(db.deleteTribute).not.toHaveBeenCalled();
  });

  it("allows the admin keeper to remove a tribute", async () => {
    const caller = appRouter.createCaller(makeCtx({ role: "admin" }));
    const res = await caller.grove.removeTribute({ id: 1 });
    expect(db.deleteTribute).toHaveBeenCalledWith(1);
    expect(res).toEqual({ success: true });
  });
});
