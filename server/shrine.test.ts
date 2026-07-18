/**
 * Tests for the Music Shrine router — track listing, admin-gated add/remove,
 * and YouTube id extraction from URLs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter, extractYouTubeId } from "./routers";

vi.mock("./db", () => ({
  listMemorialTracks: vi.fn(),
  insertMemorialTrack: vi.fn(),
  deleteMemorialTrack: vi.fn(),
  getGameSave: vi.fn(),
  upsertGameSave: vi.fn(),
  deleteGameSave: vi.fn(),
  listFieldNotes: vi.fn(),
  insertFieldNote: vi.fn(),
  deleteFieldNote: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

const baseUser = {
  id: 1,
  openId: "user-1",
  email: "u@x.dev",
  name: "User",
  loginMethod: "manus",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const adminUser: AuthenticatedUser = { ...baseUser, role: "admin" };
const normalUser: AuthenticatedUser = { ...baseUser, id: 2, openId: "user-2", role: "user" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("extractYouTubeId", () => {
  it("accepts bare 11-char ids", () => {
    expect(extractYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses watch URLs", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s")).toBe(
      "dQw4w9WgXcQ",
    );
  });
  it("parses youtu.be short links", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe("dQw4w9WgXcQ");
  });
  it("parses shorts and embed paths", () => {
    expect(extractYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("rejects garbage", () => {
    expect(extractYouTubeId("not a link")).toBeNull();
    expect(extractYouTubeId("https://vimeo.com/12345")).toBeNull();
  });
});

describe("shrine.tracks", () => {
  it("is publicly readable", async () => {
    vi.mocked(db.listMemorialTracks).mockResolvedValue([]);
    const caller = appRouter.createCaller(createCtx(null));
    const result = await caller.shrine.tracks();
    expect(result).toEqual([]);
  });
});

describe("shrine.addTrack", () => {
  it("allows admin to add a track from a URL", async () => {
    vi.mocked(db.listMemorialTracks).mockResolvedValue([]);
    vi.mocked(db.insertMemorialTrack).mockResolvedValue([
      {
        id: 1,
        videoId: "dQw4w9WgXcQ",
        title: "Kayla's song",
        dedication: "always",
        sortOrder: 0,
        createdAt: new Date(),
      },
    ]);
    const caller = appRouter.createCaller(createCtx(adminUser));
    const result = await caller.shrine.addTrack({
      videoIdOrUrl: "https://youtu.be/dQw4w9WgXcQ",
      title: "Kayla's song",
      dedication: "always",
    });
    expect(db.insertMemorialTrack).toHaveBeenCalledWith({
      videoId: "dQw4w9WgXcQ",
      title: "Kayla's song",
      dedication: "always",
      sortOrder: 0,
    });
    expect(result).toHaveLength(1);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx(normalUser));
    await expect(
      caller.shrine.addTrack({ videoIdOrUrl: "dQw4w9WgXcQ", title: "x" }),
    ).rejects.toThrow(/keeper of the shrine/i);
  });

  it("rejects unparseable video links", async () => {
    const caller = appRouter.createCaller(createCtx(adminUser));
    await expect(
      caller.shrine.addTrack({ videoIdOrUrl: "https://example.com/song", title: "x" }),
    ).rejects.toThrow(/could not read/i);
  });
});

describe("shrine.removeTrack", () => {
  it("allows admin to remove", async () => {
    vi.mocked(db.deleteMemorialTrack).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(adminUser));
    const result = await caller.shrine.removeTrack({ id: 3 });
    expect(result).toEqual({ success: true });
    expect(db.deleteMemorialTrack).toHaveBeenCalledWith(3);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx(normalUser));
    await expect(caller.shrine.removeTrack({ id: 3 })).rejects.toThrow(
      /keeper of the shrine/i,
    );
  });
});
