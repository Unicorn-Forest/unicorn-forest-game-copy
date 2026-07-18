/**
 * UNICORN FOREST — Main game page
 * Style: CogHood Nocturne — void #050510, starfield, floating pixel islands,
 * Press Start 2P + Space Mono, cyan/amber/violet glow.
 * Layout: hero landing → asymmetric play surface (map left ~2/3, HUD column right).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import FieldNotes from "@/components/FieldNotes";
import ForestMap from "@/components/ForestMap";
import MusicShrine from "@/components/MusicShrine";
import OracleDialog from "@/components/OracleDialog";
import QuestJournal from "@/components/QuestJournal";
import { startLogin } from "@/const";
import { KsmBar, Starfield, Typewriter } from "@/components/PixelPrimitives";
import { useForestGame } from "@/hooks/useForestGame";
import { HERO_ART, LOGO_ART, ORACLE_INTRO, ZONES, type Zone } from "@/lib/forestData";

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const { user, isAuthenticated, logout } = useAuth();

  const { state, statusOf, discover, reset, wholeness, questProgress, syncStatus } =
    useForestGame();
  const [selected, setSelected] = useState<Zone | null>(null);
  const [justDiscovered, setJustDiscovered] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const playRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((zone: Zone) => {
    setSelected(zone);
  }, []);

  const handleRunCycle = useCallback(
    (zoneId: string) => {
      discover(zoneId);
      setJustDiscovered(zoneId);
    },
    [discover],
  );

  const handleReset = useCallback(() => {
    reset();
    setSelected(null);
    setJustDiscovered(null);
  }, [reset]);

  const enterForest = () => {
    setStarted(true);
    setTimeout(() => playRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  // Auto-open Moonwell panel on first visit to teach the loop
  useEffect(() => {
    if (started && !selected && state.discovered.length === 1) {
      setSelected(ZONES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const selectedStatus = selected ? statusOf(selected.id) : null;

  return (
    <div className="min-h-screen bg-[#050510] text-white relative overflow-x-hidden">
      <Starfield />

      {/* ======= NAV ======= */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 px-4 py-2 rounded border border-[#00f0ff20] bg-[#050510ee] backdrop-blur-sm">
          <img src={LOGO_ART} alt="Unicorn Forest logo" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
          <span className="font-pixel text-[8px] sm:text-[9px] text-[#00f0ff] tracking-wider">UNICORN FOREST</span>
          <span className="hidden sm:inline font-mono text-[9px] text-[#ffb347]">✦ KSM EXPEDITION</span>
          <div className="hidden md:block">
            <KsmBar percent={wholeness} />
          </div>
          {/* sync badge + auth */}
          <span
            className="font-mono text-[8px] px-1.5 py-0.5 rounded border"
            style={{
              color: syncStatus === "local" ? "#ffffff50" : "#00f0ff",
              borderColor: syncStatus === "local" ? "#ffffff20" : "#00f0ff40",
            }}
            title={
              syncStatus === "local"
                ? "Progress saved in this browser only — sign in to sync"
                : "Progress synced to the expedition database"
            }
          >
            {syncStatus === "local"
              ? "○ local"
              : syncStatus === "saving" || syncStatus === "loading"
                ? "⟳ sync…"
                : "◉ synced"}
          </span>
          {isAuthenticated ? (
            <button
              onClick={() => logout()}
              className="font-mono text-[9px] text-[#ffffff50] hover:text-[#ff5566] transition-colors"
              title={`Signed in as ${user?.name ?? "cartographer"}`}
            >
              [{(user?.name ?? "cartographer").split(" ")[0]}] out
            </button>
          ) : (
            <button
              onClick={() => startLogin()}
              className="font-mono text-[9px] text-[#00f0ff] hover:text-white transition-colors"
            >
              [sign in]
            </button>
          )}
        </div>
      </nav>

      {/* ======= HERO ======= */}
      <section className="relative pt-24 pb-4 px-4">
        {/* Brand lockup */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-3">
            <img
              src={LOGO_ART}
              alt="Pixel unicorn glyph"
              className="w-14 h-14 sm:w-20 sm:h-20 drop-shadow-[0_0_18px_#00f0ff50]"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="text-left">
              <h1 className="font-pixel text-xl sm:text-3xl md:text-4xl text-[#00f0ff] glow-cyan tracking-wider leading-none">
                UNICORN
                <br />
                FOREST
              </h1>
              <div className="font-mono text-[10px] sm:text-xs text-[#ffb347] glow-amber mt-2 tracking-[0.3em]">
                ✦ KSM EXPEDITION
              </div>
            </div>
          </div>
          <p className="mt-5 font-pixel text-[9px] sm:text-[11px] text-[#ffffffd0] tracking-wider">
            THE FOREST ANSWERS — AND ITS WORDS BECOME TERRAIN
          </p>
          <p className="mt-3 font-mono text-xs sm:text-sm text-[#ffffff80] max-w-xl mx-auto leading-relaxed">
            Awaken all <span className="text-[#ffb347]">{ZONES.length} centres</span> of
            the forest, one KSM cycle at a time.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 rounded-xl blur-3xl opacity-15 -z-10 bg-gradient-to-r from-[#ffb34740] via-transparent to-[#00f0ff40]" />
          <div className="relative rounded-xl overflow-hidden border border-[#ffffff08]">
            <img
              src={HERO_ART}
              alt="Two floating pixel islands of the Unicorn Forest joined by a stardust bridge"
              className="w-full h-auto"
              loading="eager"
              style={{ imageRendering: "pixelated" }}
            />
            {/* floating labels */}
            <div className="absolute top-[12%] left-[8%] px-2 py-1 rounded bg-[#050510cc] border border-[#ffb34740] font-pixel text-[7px] sm:text-[8px] text-[#ffb347]">
              🏘️ THE VILLAGES
            </div>
            <div className="absolute top-[18%] right-[7%] px-2 py-1 rounded bg-[#050510cc] border border-[#00f0ff40] font-pixel text-[7px] sm:text-[8px] text-[#00f0ff]">
              🔭 THE OBSERVATORY
            </div>
            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2">
              <button
                onClick={enterForest}
                className="font-pixel text-[10px] sm:text-xs px-6 py-4 rounded border border-[#00f0ff90] bg-[#050510ee] text-[#00f0ff] glow-cyan hover:bg-[#071a22] hover:shadow-[0_0_32px_#00f0ff40] active:scale-[0.97] transition-all tracking-widest shadow-[0_0_24px_#00f0ff25]"
              >
                ▶ ENTER THE FOREST
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 font-mono text-xs text-[#ffffff60] max-w-2xl mx-auto leading-relaxed">
          <span className="text-[#ffb347]">✦ THE ORACLE:</span>{" "}
          {started ? ORACLE_INTRO : <Typewriter text={ORACLE_INTRO} speed={22} />}
        </p>
      </section>

      {/* ======= PLAY SURFACE (primary composition) ======= */}
      <section ref={playRef} className="relative px-3 sm:px-6 pb-16 max-w-[1400px] mx-auto">
        {/* console rail connecting hero → map */}
        <div className="flex justify-center mb-2" aria-hidden>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-[#00f0ff60] to-[#00f0ff]" />
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
          <div className="w-3 h-3 rounded-sm bg-[#00f0ff] animate-pulse" />
          <h2 className="font-pixel text-[10px] sm:text-xs text-[#00f0ff] glow-cyan tracking-widest">
            CONSTELLATION MAP
          </h2>
          <span className="font-mono text-[10px] text-[#ffb347]">
            ✦ {state.discovered.length}/{ZONES.length} centres awakened
          </span>
          <span className="font-mono text-[10px] text-[#ffffff40] hidden sm:inline">
            · select a scanned island · the oracle does the rest
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map canvas */}
          <div className="lg:col-span-2 relative rounded-xl border border-[#00f0ff25] bg-[#070714]/60 overflow-hidden shadow-[inset_0_0_60px_#00f0ff08]">
            {/* nebula washes */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 40% 30% at 25% 25%, #c084fc12, transparent), radial-gradient(ellipse 45% 35% at 75% 60%, #00f0ff0d, transparent), radial-gradient(ellipse 30% 25% at 55% 85%, #ffb34708, transparent)",
              }}
            />
            {/* isometric cartography grid */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(60deg, #00f0ff 0 1px, transparent 1px 42px), repeating-linear-gradient(-60deg, #00f0ff 0 1px, transparent 1px 42px)",
              }}
            />
            {/* corner brackets — console frame */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#00f0ff50] pointer-events-none" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#00f0ff50] pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#00f0ff50] pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#00f0ff50] pointer-events-none" />
            <div className="p-3 sm:p-6">
              <ForestMap
                statusOf={statusOf}
                onSelect={handleSelect}
                selectedId={selected?.id}
                justDiscovered={justDiscovered}
              />
            </div>
            {/* map legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 font-mono text-[9px] text-[#ffffff50]">
              <span><span className="text-[#00f0ff]">●</span> awakened centre</span>
              <span><span className="text-[#00ff00]">●</span> scanned — cycle ready</span>
              <span><span className="text-[#ff5566]">●</span> sealed by enchantment</span>
              <span><span className="text-[#ffffff30]">?</span> beyond the stardust veil</span>
            </div>
          </div>

          {/* HUD column */}
          <div className="space-y-4">
            {selected && selectedStatus ? (
              <OracleDialog
                zone={selected}
                status={selectedStatus}
                onRunCycle={handleRunCycle}
                onClose={() => setSelected(null)}
                cycleNumber={state.cycles}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-[#00ff0040] bg-[#0a0f1a]/95 p-5 scanlines relative">
                <div className="font-pixel text-[8px] text-[#00ff00] mb-2 tracking-widest">▸ ORACLE CHANNEL · STANDBY</div>
                <p className="font-mono text-xs text-[#ffffff60] leading-relaxed">
                  The Oracle awaits your bearing, cartographer.
                  <br />
                  Touch an island on the constellation — <span className="text-[#00ff00]">green scan-rings</span> mark
                  latent centres ready for a KSM cycle.
                </p>
              </div>
            )}
            <QuestJournal
              wholeness={wholeness}
              stardust={state.stardust}
              cycles={state.cycles}
              artifacts={state.artifacts}
              quest={questProgress}
              onReset={handleReset}
            />
            <MusicShrine started={started} />
            <FieldNotes discovered={state.discovered} />
          </div>
        </div>
      </section>

      {/* ======= MEMORIAL ======= */}
      <section className="relative px-4 pb-8">
        <div className="max-w-2xl mx-auto text-center rounded-lg border border-[#ff9ecf25] bg-[#0a0f1a]/80 px-6 py-6">
          <div className="font-pixel text-[9px] text-[#ff9ecf] tracking-widest mb-3" style={{ textShadow: "0 0 14px #ff9ecf50" }}>
            ✦ IN LOVING MEMORY OF KAYLA ✦
          </div>
          <p className="font-mono text-[11px] text-[#ffffff60] leading-relaxed">
            The Unicorn Forest was Kayla's vision. Her ideas and works seeded the oracle
            that dreamed these islands into being. Every centre awakened here keeps her
            imagination alive — a forest that answers, because she spoke first.
          </p>
          <p className="font-mono text-[10px] text-[#ff9ecf70] italic mt-3">
            13 July 2023 · forever in the constellation
          </p>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="relative pb-10 text-center px-4">
        <p className="font-mono text-xs text-[#ffffff40]">
          every cycle strengthens a centre · every centre strengthens the whole
        </p>
        <p className="font-mono text-[10px] text-[#ffffff25] mt-2">
          lore woven from the ✨Unicorn✨🦄✨ oracle · unicorn-dynamics KSM × isometric-pixel-page · for Kayla
        </p>
      </footer>
    </div>
  );
}
