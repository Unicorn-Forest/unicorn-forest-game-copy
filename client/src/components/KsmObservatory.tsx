/**
 * UNICORN FOREST — KSM Observatory
 * The self-ontogenetic instrument panel of the forest, composing:
 *  · /unicorn-dynamics  — 12-step inner/outer loop wheel + b9/p9/j9 triads
 *  · /ksm-evolve        — living centres scored for life, weakest highlighted
 *  · /autoresearch-ksm  — evolution ledger (the forest's results.tsv)
 *  · /isometric-pixel-page — scale-granularity breadcrumb + terminal cards
 * Style: CogHood Nocturne — void #050510, cyan/amber/violet glow, pixel type.
 */
import { useCallback, useMemo, useState } from "react";
import { KSM_STEPS, ZONES, ZONE_MAP } from "@/lib/forestData";
import type { ZoneStatus } from "@/hooks/useForestGame";
import { trpc } from "@/lib/trpc";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  expeditionId: string;
  statusOf: (zoneId: string) => ZoneStatus;
  wholeness: number;
  cycles: number;
  /** step currently animating in OracleDialog (-1 when idle) */
  activeStep?: number;
}

/** Alexander life score per zone status (ksm-evolve center scoring) */
const LIFE: Record<ZoneStatus, number> = {
  discovered: 100,
  reachable: 40,
  locked: 20,
  hidden: 5,
};

/** unicorn-dynamics triads: outer solution loop (1-3, 10-12) vs inner iteration loop (4-9) */
const isOuterStep = (i: number) => i < 3 || i > 8;

/** b9/p9/j9 triad for a step index (Form/Void/Pole rotation) */
const TRIAD = ["b9·form", "p9·void", "j9·pole"];

/** tooltip lore for each triad tag — the Agent-Arena-Relation core explained */
const TRIAD_LORE: Record<string, { title: string; body: string; color: string }> = {
  "b9·form": {
    title: "b9 · FORM — rooted trees (structure)",
    body: "The body architecture of the step: what shape the work takes. b9 steps grow branching structure — differentiating wholes into parts, like a rooted tree unfolding. Ask here: what is the skeleton of this move?",
    color: "#ffb347",
  },
  "p9·void": {
    title: "p9 · VOID — membrane pools (process)",
    body: "The process medium of the step: the open space where change flows. p9 steps work the void between structures — pooling, dissolving, constraining — like membranes deciding what passes. Ask here: what must flow, and what must not?",
    color: "#00f0ff",
  },
  "j9·pole": {
    title: "j9 · POLE — resonant echoes (relation)",
    body: "The relational axis of the step: how it binds to its neighbours. j9 steps set up poles that echo across the cycle — comparisons, feedbacks, resonances — like a tuning fork answering another. Ask here: what does this step call back to?",
    color: "#c084fc",
  },
};

/** build and download the expedition ledger as CSV (client-side, no server round-trip) */
function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const SCALE_TRAIL = [
  { level: "world", name: "unicorn verse" },
  { level: "forest", name: "unicorn forest" },
  { level: "grove", name: "kayla's grove" },
  { level: "island", name: "13 centres" },
  { level: "shrine", name: "music shrine" },
  { level: "resident", name: "cartographer" },
];

export default function KsmObservatory({
  expeditionId,
  statusOf,
  wholeness,
  cycles,
  activeStep = -1,
}: Props) {
  const [tab, setTab] = useState<"cycle" | "centres" | "ledger" | "ladder">("cycle");
  const ledger = trpc.evolution.ledger.useQuery(
    { expeditionId },
    { staleTime: 10_000 },
  );
  const ladderSystems = trpc.ladder.systems.useQuery(undefined, {
    staleTime: 5 * 60_000,
    enabled: tab === "ladder",
  });
  const ladderFeatures = trpc.ladder.features.useQuery(undefined, {
    staleTime: 5 * 60_000,
    enabled: tab === "ladder",
  });
  const [openSystem, setOpenSystem] = useState<number | null>(4);

  /** export the personal expedition ledger as results.csv */
  const downloadCsv = useCallback(() => {
    const rows = ledger.data ?? [];
    if (rows.length === 0) return;
    const header = ["cycle", "centre", "zone_id", "hypothesis", "mutation", "oracle", "wholeness_after", "verdict", "recorded_at"];
    const lines = rows.map((r) =>
      [
        String(r.cycleNumber),
        ZONE_MAP[r.zoneId]?.name ?? r.zoneId,
        r.zoneId,
        r.hypothesis,
        r.mutation,
        r.liveOracle ? "live" : "seed",
        String(r.wholenessAfter),
        r.verdict,
        new Date(r.createdAt).toISOString(),
      ]
        .map(csvEscape)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unicorn-forest-ledger-${expeditionId.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [ledger.data, expeditionId]);

  const centres = useMemo(
    () =>
      ZONES.map((z) => {
        const status = statusOf(z.id);
        return { zone: z, status, life: LIFE[status] };
      }),
    [statusOf],
  );

  /** the weakest *visible* latent centre — Alexander step 3 */
  const weakest = useMemo(() => {
    const latent = centres.filter((c) => c.status === "reachable" || c.status === "locked");
    if (latent.length === 0) return null;
    return latent.reduce((a, b) => (a.life <= b.life ? a : b));
  }, [centres]);

  const meanLife = Math.round(
    centres.reduce((sum, c) => sum + c.life, 0) / centres.length,
  );

  return (
    <section className="relative rounded-xl border border-[#c084fc30] bg-[#0a0714]/90 overflow-hidden shadow-[inset_0_0_60px_#c084fc0a]">
      {/* corner brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#c084fc50] pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#c084fc50] pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#c084fc50] pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#c084fc50] pointer-events-none" />

      <div className="p-4 sm:p-6">
        {/* header + scale-granularity breadcrumb (isometric-pixel-page) */}
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <div className="w-3 h-3 rounded-sm bg-[#c084fc] animate-pulse" />
          <h2 className="font-pixel text-[10px] sm:text-xs text-[#c084fc] glow-violet tracking-widest">
            KSM OBSERVATORY
          </h2>
          <span className="font-mono text-[10px] text-[#ffb347]">
            ✦ self-ontogenetic loop · iteration {String(cycles).padStart(2, "0")}
          </span>
        </div>
        <div className="font-mono text-[9px] text-[#ffffff35] mb-4 flex flex-wrap items-center gap-1" aria-label="scale granularity">
          {SCALE_TRAIL.map((s, i) => (
            <span key={s.level}>
              <span className="text-[#ffffff50]">{s.level}</span>
              <span className="text-[#00f0ff70]">·{s.name}</span>
              {i < SCALE_TRAIL.length - 1 && <span className="text-[#c084fc60]"> → </span>}
            </span>
          ))}
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-4">
          {(
            [
              ["cycle", "◔ 12-STEP CYCLE"],
              ["centres", "◈ LIVING CENTRES"],
              ["ledger", "☰ EVOLUTION LEDGER"],
              ["ladder", "⧐ SYSTEM LADDER"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`font-pixel text-[8px] px-3 py-2 rounded border transition-all active:scale-[0.97] ${
                tab === key
                  ? "border-[#c084fc] text-[#c084fc] bg-[#150a24] glow-violet"
                  : "border-[#ffffff15] text-[#ffffff45] hover:text-[#c084fc] hover:border-[#c084fc40]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== TAB: 12-step cycle wheel (unicorn-dynamics) ===== */}
        {tab === "cycle" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-1.5">
              {KSM_STEPS.map((label, i) => {
                const outer = isOuterStep(i);
                const active = i === activeStep;
                const triad = TRIAD[i % 3];
                const lore = TRIAD_LORE[triad];
                return (
                  <Tooltip key={label} delayDuration={150}>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        className={`px-2 py-1.5 rounded border font-mono text-[9px] leading-tight transition-all cursor-help focus:outline-none focus:ring-1 focus:ring-[#c084fc60] ${
                          active
                            ? "border-[#ffb347] text-[#ffb347] bg-[#141008] shadow-[0_0_14px_#ffb34740]"
                            : outer
                              ? "border-[#ffb34725] text-[#ffb34780] hover:border-[#ffb34760]"
                              : "border-[#00f0ff25] text-[#00f0ff80] hover:border-[#00f0ff60]"
                        }`}
                      >
                        <span className="text-[#ffffff30] mr-1">{triad}</span>
                        {label}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[260px] border border-[#c084fc40] bg-[#0a0714] text-[#ffffffcc] font-mono text-[10px] leading-relaxed p-3"
                    >
                      <div className="font-pixel text-[8px] mb-1.5" style={{ color: lore.color }}>
                        {lore.title}
                      </div>
                      <p className="mb-1.5">{lore.body}</p>
                      <p className="text-[#ffffff45]">
                        step {String(i + 1).padStart(2, "0")} ·{" "}
                        {outer ? "outer solution loop — sees the whole" : "inner iteration loop — works the centre"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <div className="font-mono text-[10px] text-[#ffffff55] leading-relaxed space-y-2">
              <p>
                <span className="text-[#ffb347]">■ outer loop</span> (steps 1-3 · 10-12)
                — the <i>solution vision</i>: analyze the whole, differentiate tasks to
                centres, choose the critical centre; then integrate, simplify, feed back.
              </p>
              <p>
                <span className="text-[#00f0ff]">■ inner loop</span> (steps 4-9) — the{" "}
                <i>iteration vision</i>: constrain, differentiate sub-tasks, strengthen
                the centre, compare, simplify, feed back.
              </p>
              <p>
                <span className="text-[#c084fc]">b9·form / p9·void / j9·pole</span> —
                each step carries one triad of the Agent-Arena-Relation core: rooted
                trees (structure), membrane pools (process), resonant echoes (relation).
              </p>
              <p className="text-[#ffffff35]">
                every zone reveal executes one full wheel — a structure-preserving
                transformation of the forest's wholeness.
              </p>
            </div>
          </div>
        )}

        {/* ===== TAB: living centres (ksm-evolve) ===== */}
        {tab === "centres" && (
          <div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-3 font-mono text-[10px]">
              <span className="text-[#ffffff60]">
                mean life <span className="text-[#00f0ff]">{meanLife}</span>/100
              </span>
              <span className="text-[#ffffff60]">
                wholeness <span className="text-[#00f0ff]">{wholeness}%</span>
              </span>
              {weakest && (
                <span className="text-[#ff8899]">
                  weakest latent centre → {weakest.zone.emoji} {weakest.zone.name}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {centres.map(({ zone, status, life }) => {
                const isWeakest = weakest?.zone.id === zone.id;
                const color =
                  status === "discovered"
                    ? "#00f0ff"
                    : status === "reachable"
                      ? "#00ff00"
                      : status === "locked"
                        ? "#ff5566"
                        : "#ffffff30";
                return (
                  <div
                    key={zone.id}
                    className={`px-2.5 py-2 rounded border font-mono text-[10px] flex items-center gap-2 ${
                      isWeakest
                        ? "border-dashed border-[#ff8899] bg-[#1a0a10]"
                        : "border-[#ffffff10] bg-[#0d0a1a]/60"
                    }`}
                  >
                    <span>{status === "hidden" ? "❓" : zone.emoji}</span>
                    <span className="flex-1 truncate" style={{ color: status === "hidden" ? "#ffffff35" : "#ffffffa0" }}>
                      {status === "hidden" ? "beyond the veil" : zone.name}
                    </span>
                    {/* ascii life bar */}
                    <span style={{ color }} className="whitespace-nowrap">
                      {"█".repeat(Math.round(life / 20)).padEnd(5, "░")} {life}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="font-mono text-[9px] text-[#ffffff35] mt-3">
              alexander step 3 — <i>identify the sense in which the structure is weakest
              as a whole</i> · the dashed centre is where the next cycle wants to go
            </p>
          </div>
        )}

        {/* ===== TAB: evolution ledger (autoresearch-ksm) ===== */}
        {tab === "ledger" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="font-mono text-[9px] text-[#ffffff40]">
                results.tsv · one row per KSM experiment · hypothesis → mutation → metric → verdict
              </div>
              <button
                onClick={downloadCsv}
                disabled={!ledger.data || ledger.data.length === 0}
                className="font-pixel text-[7px] px-2.5 py-1.5 rounded border border-[#00f0ff40] text-[#00f0ff] hover:bg-[#001a1f] hover:border-[#00f0ff] transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                title="export your expedition's research history as CSV"
              >
                ⤓ DOWNLOAD CSV
              </button>
            </div>
            {ledger.isLoading ? (
              <div className="font-mono text-[10px] text-[#ffffff40] animate-pulse py-4">
                reading the ledger stones…
              </div>
            ) : !ledger.data || ledger.data.length === 0 ? (
              <div className="font-mono text-[10px] text-[#ffffff40] py-4 border border-dashed border-[#ffffff15] rounded px-3">
                the ledger is empty — run a KSM cycle on a{" "}
                <span className="text-[#00ff00]">scanned island</span> and the forest
                will record its first experiment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[9.5px] text-left border-collapse">
                  <thead>
                    <tr className="text-[#c084fc] border-b border-[#c084fc30]">
                      <th className="py-1.5 pr-3">cyc</th>
                      <th className="py-1.5 pr-3">centre</th>
                      <th className="py-1.5 pr-3 hidden sm:table-cell">hypothesis</th>
                      <th className="py-1.5 pr-3">oracle</th>
                      <th className="py-1.5 pr-3">whole%</th>
                      <th className="py-1.5">verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.data.map((row) => {
                      const zone = ZONE_MAP[row.zoneId];
                      return (
                        <tr key={row.id} className="border-b border-[#ffffff08] text-[#ffffff70] align-top">
                          <td className="py-1.5 pr-3 text-[#ffb347]">{String(row.cycleNumber).padStart(2, "0")}</td>
                          <td className="py-1.5 pr-3 whitespace-nowrap">
                            {zone?.emoji} {zone?.name ?? row.zoneId}
                          </td>
                          <td className="py-1.5 pr-3 hidden sm:table-cell text-[#ffffff45] max-w-[220px] truncate" title={row.hypothesis}>
                            {row.hypothesis}
                          </td>
                          <td className="py-1.5 pr-3">
                            {row.liveOracle ? (
                              <span className="text-[#00f0ff]" title="mutation text spoken live by the Chatbase oracle">◉ live</span>
                            ) : (
                              <span className="text-[#ffffff35]" title="seed lore (oracle resting)">○ seed</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-3 text-[#00f0ff]">{row.wholenessAfter}</td>
                          <td className="py-1.5 text-[#00ff00]">✓ {row.verdict}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="font-mono text-[9px] text-[#ffffff35] mt-3">
              every reveal asks the live oracle for fresh lore once, then carves it into
              the ledger — the forest remembers how it grew itself.
            </p>
          </div>
        )}

        {/* ===== TAB: system ladder (Campbell cosmic order · OEIS A000081) ===== */}
        {tab === "ladder" && (
          <div>
            <div className="font-mono text-[9px] text-[#ffffff40] mb-3">
              campbell's systems of the cosmic order · sys(N) = A000081(N+1) · rooted
              trees: 1 1 2 4 <span className="text-[#ffb347]">9</span> 20 48 115 286 719 …
              · the forest climbs all nine strata
            </div>
            {ladderSystems.isLoading || ladderFeatures.isLoading ? (
              <div className="font-mono text-[10px] text-[#ffffff40] animate-pulse py-4">
                surveying the world tree…
              </div>
            ) : (
              <div className="space-y-1.5">
                {(ladderSystems.data ?? [])
                  .slice()
                  .reverse()
                  .map((s) => {
                    const open = openSystem === s.ordinal;
                    const feats = (ladderFeatures.data ?? []).filter(
                      (f) => f.systemOrdinal === s.ordinal,
                    );
                    // stratum hue: low systems cyan → mid amber → high violet
                    const hue =
                      s.ordinal <= 3 ? "#00f0ff" : s.ordinal <= 6 ? "#ffb347" : "#c084fc";
                    return (
                      <div
                        key={s.ordinal}
                        className={`rounded border transition-all ${
                          open
                            ? "border-[#c084fc50] bg-[#100a1e]"
                            : "border-[#ffffff10] bg-[#0d0a1a]/60 hover:border-[#c084fc30]"
                        }`}
                      >
                        <button
                          onClick={() => setOpenSystem(open ? null : s.ordinal)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left font-mono text-[10px] active:scale-[0.99] transition-transform"
                          aria-expanded={open}
                        >
                          <span className="font-pixel text-[8px] w-7" style={{ color: hue }}>
                            S{s.ordinal}
                          </span>
                          <span className="text-[#ffffff85] w-24 shrink-0 font-pixel text-[7px] tracking-wider">
                            {s.epithet}
                          </span>
                          <span style={{ color: hue }} className="w-12 shrink-0 text-right">
                            {s.termCount}
                          </span>
                          <span className="text-[#ffffff35] flex-1 truncate hidden sm:inline">
                            {s.factorization}
                          </span>
                          <span className="text-[#ffffff40]">{open ? "▾" : "▸"}</span>
                        </button>
                        {open && (
                          <div className="px-3 pb-3 font-mono text-[10px] leading-relaxed space-y-2 border-t border-[#ffffff08] pt-2">
                            <p className="text-[#ffffff70]">{s.character}</p>
                            <p className="text-[#ffffff45]">
                              <span style={{ color: hue }}>knowledge base · </span>
                              {s.knowledgeBase}
                            </p>
                            <p className="text-[#ffffff45]">
                              <span style={{ color: hue }}>in the forest · </span>
                              {s.forestExpression}
                            </p>
                            {feats.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {feats.map((f) => (
                                  <span
                                    key={f.featureKey}
                                    title={f.description}
                                    className={`px-2 py-0.5 rounded border text-[9px] cursor-help ${
                                      f.status === "live"
                                        ? "border-[#00ff0030] text-[#00ff00b0]"
                                        : "border-[#ffb34730] text-[#ffb347a0] border-dashed"
                                    }`}
                                  >
                                    {f.status === "live" ? "◉" : "◌"} {f.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
            <p className="font-mono text-[9px] text-[#ffffff35] mt-3">
              S4·BIOS holds fate (agent→arena), S5·PSYCHE births destiny, S7·LUDUS
              projects you here as avatar, S9·AXIS MUNDI regrinds the world tree —
              the forest is the entelechy of the open future.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
