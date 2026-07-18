/**
 * Traversal router — live corpus growth from skeleton navigation.
 * Verifies logging validation, stats aggregation, and visited dedup.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const logged: any[] = [];

vi.mock("./db", () => ({
  logTraversal: vi.fn(async (row: any) => {
    logged.push(row);
  }),
  traversalStats: vi.fn(async () => [
    { fromPage: "page-009", toPage: "page-058", kind: "pick", walks: 5 },
    { fromPage: "page-058", toPage: "page-047", kind: "divination", walks: 2 },
  ]),
  visitedPages: vi.fn(async () => ["page-009", "page-058"]),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function ctx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
}

describe("traversal router", () => {
  beforeEach(() => {
    logged.length = 0;
  });

  it("logs a well-formed skeleton step", async () => {
    const caller = appRouter.createCaller(ctx());
    const res = await caller.traversal.log({
      expeditionId: "exp-test-1234",
      fromPage: "page-009",
      toPage: "page-058",
      option: 2,
      kind: "pick",
    });
    expect(res).toMatchObject({ logged: true });
    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({
      expeditionId: "exp-test-1234",
      fromPage: "page-009",
      toPage: "page-058",
      option: 2,
      kind: "pick",
    });
  });

  it("accepts leaf steps with null destination and divination kind", async () => {
    const caller = appRouter.createCaller(ctx());
    const res = await caller.traversal.log({
      expeditionId: "exp-test-1234",
      fromPage: "page-104",
      toPage: null,
      option: null,
      kind: "divination",
    });
    expect(res).toMatchObject({ logged: true });
    expect(logged[0].toPage).toBeNull();
    expect(logged[0].kind).toBe("divination");
  });

  it("rejects malformed page ids", async () => {
    const caller = appRouter.createCaller(ctx());
    await expect(
      caller.traversal.log({
        expeditionId: "exp-test-1234",
        fromPage: "DROP TABLE atoms;",
        toPage: null,
        option: null,
        kind: "explore",
      }),
    ).rejects.toThrow();
  });

  it("returns aggregated edge stats", async () => {
    const caller = appRouter.createCaller(ctx());
    const stats = await caller.traversal.stats();
    expect(stats).toHaveLength(2);
    expect(stats[0]).toMatchObject({ fromPage: "page-009", walks: 5 });
  });

  it("returns visited pages for an expedition", async () => {
    const caller = appRouter.createCaller(ctx());
    const visited = await caller.traversal.visited({ expeditionId: "exp-test-1234" });
    expect(visited).toEqual(["page-009", "page-058"]);
  });
});
