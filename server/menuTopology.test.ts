/**
 * Skeleton framework integrity tests — the AtomSpace menu-grammar topology
 * mined from the chathub archive (shared/menuTopology.ts).
 */
import { describe, expect, it } from "vitest";
import { MENU_GRAMMAR, MENU_SKELETON, MENU_STATS } from "../shared/menuTopology";

describe("menu topology skeleton", () => {
  it("declares the canonical menu grammar anchors", () => {
    expect(MENU_GRAMMAR.zoomOut).toContain("⚙️");
    expect(MENU_GRAMMAR.explore).toContain("🌿");
    expect(MENU_GRAMMAR.options).toContain("1–6");
  });

  it("contains only branch-connected pages with well-formed options", () => {
    expect(MENU_SKELETON.length).toBeGreaterThan(50);
    const ids = new Set(MENU_SKELETON.map((p) => p.id));
    expect(ids.size).toBe(MENU_SKELETON.length); // unique ids
    for (const page of MENU_SKELETON) {
      expect(page.id).toMatch(/^page-\d{3}$/);
      expect(page.label.length).toBeGreaterThan(0);
      // menus require at least options 1 and 2
      const ns = page.options.map((o) => o.n);
      expect(ns).toContain(1);
      expect(ns).toContain(2);
      // options are unique and within 1..9
      expect(new Set(ns).size).toBe(ns.length);
      for (const n of ns) expect(n).toBeGreaterThanOrEqual(1);
      for (const n of ns) expect(n).toBeLessThanOrEqual(9);
    }
  });

  it("edge strengths are valid probabilities that sum to 1 per (page, option)", () => {
    for (const page of MENU_SKELETON) {
      const byOption = new Map<number, number>();
      for (const e of page.edges) {
        expect(e.strength).toBeGreaterThan(0);
        expect(e.strength).toBeLessThanOrEqual(1);
        expect(e.evidence).toBeGreaterThanOrEqual(1);
        byOption.set(e.option, (byOption.get(e.option) ?? 0) + e.strength);
      }
      for (const [, sum] of byOption) {
        expect(sum).toBeGreaterThan(0.99);
        expect(sum).toBeLessThanOrEqual(1.001);
      }
    }
  });

  it("edges point at pages inside the skeleton (closed spine) or leaves", () => {
    const ids = new Set(MENU_SKELETON.map((p) => p.id));
    for (const page of MENU_SKELETON) {
      for (const e of page.edges) {
        if (e.to !== null) expect(ids.has(e.to)).toBe(true);
      }
    }
  });

  it("hub pages from the mined stats are present in the skeleton", () => {
    const ids = new Set(MENU_SKELETON.map((p) => p.id));
    for (const hub of MENU_STATS.hub_pages) {
      expect(ids.has(hub)).toBe(true);
    }
  });
});
