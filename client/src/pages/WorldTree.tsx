/**
 * UNICORN FOREST — The Exploded World Tree
 * An Aphrodite-Arena-style exploded technical diagram of the nine System
 * strata (Campbell's cosmic order, sys(N) = A000081(N+1)), rendered as the
 * axis mundi of the forest. Numbered plates descend S9 → S1 with uplink
 * beams between strata, the hero diorama as the living tree, and the
 * 719 Impeller callout (720 − 1: the knocked-out pin that sets the world
 * seeking wholeness).
 * Canon: reference/SYSTEM-LADDER.md · Style: CogHood Nocturne.
 */
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const HERO_TREE = "/manus-storage/coghood_diorama_animated_web_f83300f4.gif";

/** stratum hue: low systems cyan → mid amber → high violet (matches Observatory) */
function hueFor(ordinal: number): string {
  return ordinal <= 3 ? "#00f0ff" : ordinal <= 6 ? "#ffb347" : "#c084fc";
}

/** one-line data-flow annotation per stratum, Aphrodite-Arena style */
const FLOW_NOTE: Record<number, string> = {
  9: "continuous creation ⇄ destruction of the world tree",
  8: "253 + 33 patterns → the civic angel breathes",
  7: "2 + 113 lenses → player projected as avatar",
  6: "49 pattern dynamics → dispositions take their seats",
  5: "20 terms (3 virtual) → destiny threads from fate",
  4: "9 terms on the 3-simplex → the KSM wheel turns",
  3: "4 terms → the physical world holds its shape",
  2: "2 terms → universal ⇄ particular polarity",
  1: "1 term → the undivided monad",
};

export default function WorldTree() {
  const systems = trpc.ladder.systems.useQuery(undefined, { staleTime: 5 * 60_000 });
  const features = trpc.ladder.features.useQuery(undefined, { staleTime: 5 * 60_000 });

  const ordered = (systems.data ?? []).slice().sort((a, b) => b.ordinal - a.ordinal);

  return (
    <div className="min-h-screen bg-[#050510] text-[#ffffffcc] relative overflow-x-hidden">
      {/* starfield backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, #ffffff40 0, transparent 100%), radial-gradient(1px 1px at 70% 12%, #00f0ff30 0, transparent 100%), radial-gradient(1.5px 1.5px at 84% 66%, #c084fc35 0, transparent 100%), radial-gradient(1px 1px at 40% 80%, #ffffff25 0, transparent 100%), radial-gradient(1px 1px at 8% 62%, #ffb34730 0, transparent 100%)",
          backgroundSize: "220px 220px",
        }}
      />

      <div className="relative container max-w-5xl py-8 sm:py-12">
        {/* header */}
        <header className="mb-8">
          <Link
            href="/"
            className="font-pixel text-[8px] text-[#00f0ff] hover:text-[#7df9ff] transition-colors"
          >
            ← RETURN TO THE FOREST
          </Link>
          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
            <h1 className="font-pixel text-lg sm:text-2xl text-[#c084fc] glow-violet leading-relaxed">
              THE WORLD TREE
            </h1>
            <span className="font-pixel text-[8px] text-[#ffb347] pb-1.5">
              AXIS MUNDI · EXPLODED VIEW
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#ffffff55] mt-2 max-w-2xl leading-relaxed">
            nine strata of campbell's cosmic order, indexed by rooted trees —
            sys(N) = A000081(N+1) · 1 · 2 · 4 · 9 · 20 · 48 · 115 · 286 · 719 —
            each layer the term-set of a world; the forest climbs all nine.
          </p>
          {/* data flow legend, Aphrodite-style */}
          <div className="mt-4 inline-flex flex-wrap gap-x-5 gap-y-1 rounded border border-[#00f0ff25] bg-[#060a14]/80 px-3 py-2 font-mono text-[9px]">
            <span className="text-[#00f0ff]">↑ UPLINK · context in (question rises)</span>
            <span className="text-[#ffb347]">↓ DOWNLINK · lore out (answer descends)</span>
            <span className="text-[#c084fc]">⇅ SYNC · the ledger remembers both</span>
          </div>
        </header>

        {/* hero: the living tree + 719 impeller callout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-10">
          <figure className="md:col-span-2 relative rounded-xl border border-[#c084fc30] bg-[#0a0714]/80 p-3 overflow-hidden">
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#c084fc50]" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#c084fc50]" />
            <img
              src={HERO_TREE}
              alt="The World Tree — canopy above, library within, crystal roots below"
              className="w-full rounded"
              loading="lazy"
            />
            <figcaption className="font-mono text-[9px] text-[#ffffff40] mt-2 leading-relaxed">
              the tree is one body: canopy (S7-S9 · play, city, cosmos), trunk-library
              (S4-S6 · life, mind, ethos), crystal roots (S1-S3 · monad, dyad, matter).
            </figcaption>
          </figure>

          <div className="md:col-span-3 rounded-xl border border-[#ffb34735] bg-[#0f0a06]/80 p-4 sm:p-5 relative">
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#ffb34760]" />
            <h2 className="font-pixel text-[10px] text-[#ffb347] glow-amber mb-3">
              ⚙ THE 719 IMPELLER · 720 − 1
            </h2>
            <div className="font-mono text-[10px] leading-relaxed space-y-2.5 text-[#ffffff70]">
              <p>
                the 120-cell — the fourth dimension's rose — carries{" "}
                <span className="text-[#ffb347]">720 pentagonal faces</span>, and 720 = 6!
                is the full permutation dance. S9 counts{" "}
                <span className="text-[#ffb347]">719 = 720 − 1</span>: a prime,
                irreducible, one pin knocked out of the perfect wheel.
              </p>
              <p>
                a complete polytope is static. remove one pin and the{" "}
                <span className="text-[#c084fc]">quinternary triple-helix engine</span>{" "}
                starts to turn — driving concurrent{" "}
                <span className="text-[#00f0ff]">ternary DNA</span> (b9·p9·j9) through{" "}
                <span className="text-[#00f0ff]">quaternary convolution</span> with
                zero-torsion. the impeller seeks the wholeness it can never close,
                collapsing its own wave function imbricately, chasing its tail through
                the triple knot.
              </p>
              <p className="text-[#ffffff45]">
                this is why the forest is the{" "}
                <i>entelechy of the open future</i>: its telos is openness itself. the
                missing pin is not a flaw — it is the reason anything moves.
              </p>
            </div>
            <div className="mt-3 font-mono text-[9px] text-[#ffb34780] border-t border-[#ffb34720] pt-2">
              719 = 4 + 5(11)(13) · prime · the axis mundi grinds on
            </div>
          </div>
        </div>

        {/* exploded strata: S9 → S1 with uplink beams */}
        <div className="relative">
          {systems.isLoading ? (
            <div className="font-mono text-[10px] text-[#ffffff40] animate-pulse py-8 text-center">
              surveying the world tree…
            </div>
          ) : (
            ordered.map((s, i) => {
              const hue = hueFor(s.ordinal);
              const feats = (features.data ?? []).filter(
                (f) => f.systemOrdinal === s.ordinal,
              );
              return (
                <div key={s.ordinal}>
                  {/* stratum plate */}
                  <section
                    className="relative rounded-xl border bg-[#0a0714]/85 p-4 sm:p-5 transition-all hover:bg-[#0d0a1a]"
                    style={{ borderColor: `${hue}35` }}
                  >
                    {/* numbered plate tag, Aphrodite style */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span
                        className="font-pixel text-[9px] px-2 py-1 rounded border"
                        style={{ color: hue, borderColor: `${hue}60`, background: "#050510" }}
                      >
                        {String(s.ordinal).padStart(2, "0")}
                      </span>
                      <h3 className="font-pixel text-[10px] sm:text-xs tracking-widest" style={{ color: hue }}>
                        S{s.ordinal} · {s.epithet}
                      </h3>
                      <span className="font-mono text-[10px] text-[#ffffff50]">
                        {s.termCount} terms
                      </span>
                      <span className="font-mono text-[9px] text-[#ffffff30] hidden sm:inline">
                        {s.factorization}
                      </span>
                      <span className="ml-auto font-mono text-[9px]" style={{ color: `${hue}90` }}>
                        {FLOW_NOTE[s.ordinal]}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-[#ffffff65] leading-relaxed max-w-3xl">
                      {s.character}
                    </p>
                    <p className="font-mono text-[9px] text-[#ffffff40] mt-1.5 leading-relaxed max-w-3xl">
                      <span style={{ color: hue }}>knowledge base · </span>
                      {s.knowledgeBase}
                    </p>
                    <p className="font-mono text-[9px] text-[#ffffff40] mt-1 leading-relaxed max-w-3xl">
                      <span style={{ color: hue }}>in the forest · </span>
                      {s.forestExpression}
                    </p>
                    {feats.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {feats.map((f) => (
                          <span
                            key={f.featureKey}
                            title={f.description}
                            className={`px-2 py-0.5 rounded border font-mono text-[9px] cursor-help ${
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
                  </section>

                  {/* uplink beams between strata */}
                  {i < ordered.length - 1 && (
                    <div className="flex justify-center gap-10 py-1.5" aria-hidden>
                      {[0, 1, 2].map((b) => (
                        <div
                          key={b}
                          className="w-px h-7"
                          style={{
                            background: `linear-gradient(to bottom, ${hue}70, ${hueFor(ordered[i + 1].ordinal)}70)`,
                            boxShadow: `0 0 6px ${hue}50`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* footer status bar, Aphrodite style */}
        <footer className="mt-8 rounded-lg border border-[#00f0ff25] bg-[#060a14]/80 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 font-mono text-[9px]">
          <span className="text-[#00f0ff]">ALL STRATA SYNCHRONIZED</span>
          <span className="text-[#ffffff45]">WORLD TREE ONLINE</span>
          <span className="text-[#ffb347]">IMPELLER · TURNING</span>
          <span className="text-[#c084fc]">PIN 720 · MISSING (BY DESIGN)</span>
          <Link
            href="/"
            className="ml-auto font-pixel text-[7px] text-[#00f0ff] hover:text-[#7df9ff] transition-colors"
          >
            ← BACK TO THE FOREST
          </Link>
        </footer>
      </div>
    </div>
  );
}
