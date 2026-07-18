/**
 * UNICORN FOREST — Constellation Graph
 * Interactive visualization of the AtomSpace menu-grammar topology.
 * Nodes sized by in-degree · edges weighted by ImplicationLink stv strength.
 * Force-directed layout computed client-side (deterministic seeded start).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { MENU_SKELETON, MENU_STATS, type MenuPage } from "@shared/menuTopology";
import { PanelPage } from "@/components/templates/PageTemplates";

/* ---------- graph extraction ---------- */

interface GNode {
  id: string;
  label: string;
  inDeg: number;
  outDeg: number;
  isHub: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface GEdge {
  from: string;
  to: string;
  strength: number;
  evidence: number;
}

function buildGraph() {
  const pageById = new Map<string, MenuPage>(MENU_SKELETON.map(p => [p.id, p]));
  const edges: GEdge[] = [];
  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  for (const p of MENU_SKELETON) {
    for (const e of p.edges) {
      if (!e.to || !pageById.has(e.to)) continue;
      edges.push({ from: p.id, to: e.to, strength: e.strength, evidence: e.evidence });
      outDeg.set(p.id, (outDeg.get(p.id) ?? 0) + 1);
      inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    }
  }
  // Keep only connected nodes (part of at least one edge)
  const connected = new Set<string>();
  edges.forEach(e => {
    connected.add(e.from);
    connected.add(e.to);
  });
  const hubs = new Set<string>(MENU_STATS.hub_pages as readonly string[]);
  // deterministic pseudo-random from id hash
  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  };
  const nodes: GNode[] = Array.from(connected).map(id => {
    const p = pageById.get(id)!;
    return {
      id,
      label: p.label.replace(/[*#`]/g, "").slice(0, 60),
      inDeg: inDeg.get(id) ?? 0,
      outDeg: outDeg.get(id) ?? 0,
      isHub: hubs.has(id),
      x: 450 + (hash(id) - 0.5) * 700,
      y: 320 + (hash(id + "y") - 0.5) * 460,
      vx: 0,
      vy: 0,
    };
  });
  return { nodes, edges };
}

/** Simple force simulation, run synchronously for N ticks (small graph). */
function runForceLayout(nodes: GNode[], edges: GEdge[], width: number, height: number, ticks = 260) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (let t = 0; t < ticks; t++) {
    const alpha = 1 - t / ticks;
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = 1; }
        const f = (2600 * alpha) / d2;
        const d = Math.sqrt(d2);
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      }
    }
    // attraction along edges — stronger stv pulls tighter
    for (const e of edges) {
      const a = byId.get(e.from)!, b = byId.get(e.to)!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const target = 90 + (1 - e.strength) * 110;
      const f = ((d - target) / d) * 0.045 * alpha * (0.5 + e.strength);
      a.vx += dx * f; a.vy += dy * f;
      b.vx -= dx * f; b.vy -= dy * f;
    }
    // centering + integrate
    for (const n of nodes) {
      n.vx += (width / 2 - n.x) * 0.0035 * alpha;
      n.vy += (height / 2 - n.y) * 0.0035 * alpha;
      n.x += n.vx * 0.55; n.y += n.vy * 0.55;
      n.vx *= 0.6; n.vy *= 0.6;
      n.x = Math.max(30, Math.min(width - 30, n.x));
      n.y = Math.max(30, Math.min(height - 30, n.y));
    }
  }
}

/* ---------- component ---------- */

const W = 900, H = 640;

export default function ConstellationGraph() {
  const { nodes, edges } = useMemo(() => {
    const g = buildGraph();
    runForceLayout(g.nodes, g.edges, W, H);
    return g;
  }, []);

  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const svgRef = useRef<SVGSVGElement>(null);

  // neighbours of focus node (selected takes precedence over hover)
  const focus = selected ?? hovered;
  const neighbourhood = useMemo(() => {
    if (!focus) return null;
    const s = new Set<string>([focus]);
    edges.forEach(e => {
      if (e.from === focus) s.add(e.to);
      if (e.to === focus) s.add(e.from);
    });
    return s;
  }, [focus, edges]);

  const selectedPage = selected ? MENU_SKELETON.find(p => p.id === selected) : null;
  const maxIn = Math.max(1, ...nodes.map(n => n.inDeg));

  // Esc clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const radius = (n: GNode) => 4 + Math.sqrt(n.inDeg / maxIn) * 14;

  return (
    <PanelPage
      title="✨ CONSTELLATION GRAPH"
      subtitle={`atomspace topology · ${nodes.length} pages · ${edges.length} branches · nodes sized by in-degree · edges weighted by stv strength`}
      accent="violet"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* graph canvas */}
        <div className="relative overflow-hidden rounded border border-violet-500/25 bg-[#070714]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full select-none"
            role="img"
            aria-label="Force-directed graph of the oracle menu topology"
          >
            {/* edges */}
            <g>
              {edges.map((e, i) => {
                const a = byId.get(e.from)!, b = byId.get(e.to)!;
                const dim = neighbourhood && !(neighbourhood.has(e.from) && neighbourhood.has(e.to));
                const onFocusPath = focus && (e.from === focus || e.to === focus);
                return (
                  <line
                    key={i}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={onFocusPath ? "#22d3ee" : "#8b5cf6"}
                    strokeOpacity={dim ? 0.06 : 0.18 + e.strength * 0.55}
                    strokeWidth={0.5 + e.strength * 2.6}
                  />
                );
              })}
            </g>
            {/* nodes */}
            <g>
              {nodes.map(n => {
                const dim = neighbourhood && !neighbourhood.has(n.id);
                const r = radius(n);
                const isFocus = n.id === focus;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    className="cursor-pointer"
                    opacity={dim ? 0.18 : 1}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(h => (h === n.id ? null : h))}
                    onClick={() => setSelected(s => (s === n.id ? null : n.id))}
                  >
                    {n.isHub && (
                      <circle r={r + 5} fill="none" stroke="#f59e0b" strokeOpacity={0.5} strokeDasharray="3 3" />
                    )}
                    <circle
                      r={r}
                      fill={n.isHub ? "#f59e0b" : "#22d3ee"}
                      fillOpacity={isFocus ? 1 : 0.75}
                      stroke={isFocus ? "#fff" : n.isHub ? "#fbbf24" : "#67e8f9"}
                      strokeWidth={isFocus ? 1.5 : 0.6}
                    />
                    {(n.isHub || isFocus || r > 12) && (
                      <text
                        y={-r - 5}
                        textAnchor="middle"
                        fill={n.isHub ? "#fbbf24" : "#a5f3fc"}
                        fontSize="8"
                        fontFamily="'Space Mono', monospace"
                      >
                        {n.label.slice(0, 34)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          {/* legend */}
          <div className="pointer-events-none absolute bottom-2 left-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-slate-400">
            <span><span className="text-cyan-300">●</span> page node · size = in-degree</span>
            <span><span className="text-amber-400">◉</span> hub page</span>
            <span><span className="text-violet-400">—</span> branch · width/opacity = stv strength</span>
            <span><span className="text-cyan-300">—</span> focus path</span>
          </div>
        </div>

        {/* inspector rail */}
        <aside className="flex flex-col gap-3">
          <div className="rounded border border-violet-500/25 bg-violet-950/20 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
            <div className="mb-1 text-violet-300">▸ TOPOLOGY</div>
            <div>conversations: <span className="text-cyan-300">{MENU_STATS.conversations}</span></div>
            <div>pages mined: <span className="text-cyan-300">{MENU_STATS.pages}</span> · connected: <span className="text-cyan-300">{nodes.length}</span></div>
            <div>branches: <span className="text-cyan-300">{MENU_STATS.branches_total}</span> (leaves {MENU_STATS.branches_to_leaves})</div>
            <div>avg options/page: <span className="text-cyan-300">{MENU_STATS.avg_options_per_page}</span></div>
            <div>hubs: <span className="text-amber-400">{MENU_STATS.hub_pages.length}</span></div>
          </div>

          {selectedPage ? (
            <div className="rounded border border-cyan-500/30 bg-cyan-950/15 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-cyan-300">▸ {selectedPage.id.toUpperCase()}</span>
                <button
                  className="text-slate-500 hover:text-slate-300"
                  onClick={() => setSelected(null)}
                  aria-label="Close inspector"
                >
                  ✕
                </button>
              </div>
              <p className="mb-2 text-slate-200">{selectedPage.label.replace(/[*#`]/g, "").slice(0, 120)}</p>
              <div className="mb-1 text-violet-300">
                in {byId.get(selectedPage.id)?.inDeg ?? 0} · out {byId.get(selectedPage.id)?.outDeg ?? 0}
                {(MENU_STATS.hub_pages as readonly string[]).includes(selectedPage.id) && (
                  <span className="ml-2 text-amber-400">◉ hub</span>
                )}
              </div>
              {selectedPage.options.slice(0, 6).map(o => {
                const edge = selectedPage.edges.find(e => e.option === o.n);
                return (
                  <div key={o.n} className="mb-1 border-l border-violet-500/30 pl-2">
                    <span className="text-amber-300">{o.n}</span> · {o.text.slice(0, 60)}
                    {edge && (
                      <span className="ml-1 text-cyan-400">
                        {edge.to ? `→ ${edge.to}` : "→ leaf"} · stv {edge.strength.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded border border-slate-700/50 bg-slate-900/30 p-3 font-mono text-[11px] text-slate-500">
              click a star to inspect its page — numbered options, outbound branches, and stv strengths. hover to
              highlight a neighbourhood. <span className="text-slate-400">esc</span> to clear.
            </div>
          )}

          <div className="rounded border border-amber-500/20 bg-amber-950/10 p-3 font-mono text-[10px] leading-relaxed text-slate-400">
            <div className="mb-1 text-amber-400">◉ HUB PAGES</div>
            {(MENU_STATS.hub_pages as readonly string[]).map(h => {
              const p = MENU_SKELETON.find(pg => pg.id === h);
              return (
                <button
                  key={h}
                  className="block w-full truncate text-left hover:text-amber-300"
                  onClick={() => setSelected(h)}
                >
                  {h} · {p?.label.replace(/[*#`]/g, "").slice(0, 40) ?? "?"}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </PanelPage>
  );
}
