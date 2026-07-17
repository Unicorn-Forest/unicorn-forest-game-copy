/**
 * Tests for the expedition (game save) and fieldNotes routers.
 * DB and storage layers are mocked; we verify router logic, validation,
 * serialization, and auth gating.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

// ---- Mock db helpers ----
vi.mock("./db", () => ({
  getGameSave: vi.fn(),
  upsertGameSave: vi.fn(),
  deleteGameSave: vi.fn(),
  listFieldNotes: vi.fn(),
  insertFieldNote: vi.fn(),
  deleteFieldNote: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

// ---- Mock storage ----
vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({
    key,
    url: `/manus-storage/${key}`,
  })),
}));

import * as db from "./db";
import { storagePut } from "./storage";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as unknown as TrpcContext["res"],
  };
}

const sampleUser: AuthenticatedUser = {
  id: 42,
  openId: "cartographer-42",
  email: "luna@forest.dev",
  name: "Luna Cartographer",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("expedition.load", () => {
  it("returns null when no save exists", async () => {
    vi.mocked(db.getGameSave).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(sampleUser));
    const result = await caller.expedition.load();
    expect(result).toBeNull();
    expect(db.getGameSave).toHaveBeenCalledWith(42);
  });

  it("deserializes JSON columns into arrays and booleans", async () => {
    vi.mocked(db.getGameSave).mockResolvedValue({
      id: 1,
      userId: 42,
      discovered: JSON.stringify(["moonwell", "unicorn-village"]),
      artifacts: JSON.stringify(["rune"]),
      allies: JSON.stringify(["moth"]),
      stardust: 12,
      cycles: 4,
      finaleReached: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(createCtx(sampleUser));
    const result = await caller.expedition.load();
    expect(result).toMatchObject({
      discovered: ["moonwell", "unicorn-village"],
      artifacts: ["rune"],
      allies: ["moth"],
      stardust: 12,
      cycles: 4,
      finaleReached: true,
    });
  });

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.expedition.load()).rejects.toThrow();
  });
});

describe("expedition.save", () => {
  it("serializes arrays to JSON strings and stores finale as int", async () => {
    vi.mocked(db.upsertGameSave).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(sampleUser));
    const result = await caller.expedition.save({
      discovered: ["moonwell", "stardust-trails"],
      artifacts: [],
      allies: [],
      stardust: 5,
      cycles: 2,
      finaleReached: false,
    });
    expect(result).toEqual({ success: true });
    expect(db.upsertGameSave).toHaveBeenCalledWith({
      userId: 42,
      discovered: JSON.stringify(["moonwell", "stardust-trails"]),
      artifacts: "[]",
      allies: "[]",
      stardust: 5,
      cycles: 2,
      finaleReached: 0,
    });
  });

  it("rejects an empty discovered list", async () => {
    const caller = appRouter.createCaller(createCtx(sampleUser));
    await expect(
      caller.expedition.save({
        discovered: [],
        artifacts: [],
        allies: [],
        stardust: 0,
        cycles: 1,
        finaleReached: false,
      }),
    ).rejects.toThrow();
  });
});

describe("expedition.reset", () => {
  it("deletes the user's save row", async () => {
    vi.mocked(db.deleteGameSave).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(sampleUser));
    const result = await caller.expedition.reset();
    expect(result).toEqual({ success: true });
    expect(db.deleteGameSave).toHaveBeenCalledWith(42);
  });
});

describe("fieldNotes.upload", () => {
  const pngBase64 = Buffer.from("fake-png-bytes").toString("base64");

  it("uploads to storage and records metadata in the db", async () => {
    vi.mocked(db.insertFieldNote).mockResolvedValue({
      id: 7,
      userId: 42,
      zoneId: "moonwell",
      fileKey: "field-notes/42/moonwell/x.png",
      url: "/manus-storage/field-notes/42/moonwell/x.png",
      fileName: "sketch.png",
      mimeType: "image/png",
      caption: "the well at night",
      createdAt: new Date(),
    });
    const caller = appRouter.createCaller(createCtx(sampleUser));
    const result = await caller.fieldNotes.upload({
      zoneId: "moonwell",
      fileName: "sketch.png",
      mimeType: "image/png",
      dataBase64: pngBase64,
      caption: "the well at night",
    });
    expect(storagePut).toHaveBeenCalledOnce();
    const [keyArg, bufArg, mimeArg] = vi.mocked(storagePut).mock.calls[0];
    expect(keyArg).toMatch(/^field-notes\/42\/moonwell\/\d+-sketch\.png$/);
    expect(Buffer.isBuffer(bufArg)).toBe(true);
    expect(mimeArg).toBe("image/png");
    expect(db.insertFieldNote).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        zoneId: "moonwell",
        fileName: "sketch.png",
        mimeType: "image/png",
        caption: "the well at night",
      }),
    );
    expect(result).toMatchObject({ id: 7, zoneId: "moonwell" });
  });

  it("rejects disallowed mime types", async () => {
    const caller = appRouter.createCaller(createCtx(sampleUser));
    await expect(
      caller.fieldNotes.upload({
        zoneId: "moonwell",
        fileName: "virus.exe",
        mimeType: "application/x-msdownload",
        dataBase64: pngBase64,
      }),
    ).rejects.toThrow(/oracle only accepts/i);
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("sanitizes unsafe filenames in the storage key", async () => {
    vi.mocked(db.insertFieldNote).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(sampleUser));
    await caller.fieldNotes.upload({
      zoneId: "moonwell",
      fileName: "../../etc/pass wd.png",
      mimeType: "image/png",
      dataBase64: pngBase64,
    });
    const [keyArg] = vi.mocked(storagePut).mock.calls[0];
    expect(keyArg).not.toContain("..");
    expect(keyArg).not.toContain(" ");
  });

  it("rejects unauthenticated uploads", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(
      caller.fieldNotes.upload({
        zoneId: "moonwell",
        fileName: "sketch.png",
        mimeType: "image/png",
        dataBase64: pngBase64,
      }),
    ).rejects.toThrow();
  });
});

describe("fieldNotes.remove", () => {
  it("scopes deletion to the calling user", async () => {
    vi.mocked(db.deleteFieldNote).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(sampleUser));
    const result = await caller.fieldNotes.remove({ id: 9 });
    expect(result).toEqual({ success: true });
    expect(db.deleteFieldNote).toHaveBeenCalledWith(9, 42);
  });
});
