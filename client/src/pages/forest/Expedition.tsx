/**
 * UNICORN FOREST — Expedition (dashboard home)
 * The constellation map play surface with the oracle HUD column.
 */
import { useCallback, useEffect } from "react";
import ForestMap from "@/components/ForestMap";
import OracleDialog from "@/components/OracleDialog";
import QuestJournal from "@/components/QuestJournal";
import MusicShrine from "@/components/MusicShrine";
import { useGame } from "@/contexts/GameContext";
import { ZONES, type Zone } from "@/lib/forestData";

export default function Expedition() {
  const {
    state,
    statusOf,
    wholeness,
    questProgress,
    selected,
    setSelected,
    justDiscovered,
    started,
    runCycle,
    resetAll,
  } = useGame();

  const handleSelect = useCallback(
    (zone: Zone) => setSelected(zone),
    [setSelected],
  );

  // Auto-open Moonwell panel on a fresh expedition to teach the loop
  useEffect(() => {
    if (!selected && state.discovered.length === 1) {
      setSelected(ZONES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedStatus = selected ? statusOf(selected.id) : null;

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
        <div className="w-3 h-3 rounded-sm bg-[#00f0ff] animate-pulse" />
        <h1 className="font-pixel text-[10px] sm:text-xs text-[#00f0ff] glow-cyan tracking-widest">
          CONSTELLATION MAP
        </h1>
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
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 40% 30% at 25% 25%, #c084fc12, transparent), radial-gradient(ellipse 45% 35% at 75% 60%, #00f0ff0d, transparent), radial-gradient(ellipse 30% 25% at 55% 85%, #ffb34708, transparent)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(60deg, #00f0ff 0 1px, transparent 1px 42px), repeating-linear-gradient(-60deg, #00f0ff 0 1px, transparent 1px 42px)",
            }}
          />
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
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 font-mono text-[9px] text-[#ffffff50]">
            <span>
              <span className="text-[#00f0ff]">●</span> awakened centre
            </span>
            <span>
              <span className="text-[#00ff00]">●</span> scanned — cycle ready
            </span>
            <span>
              <span className="text-[#ff5566]">●</span> sealed by enchantment
            </span>
            <span>
              <span className="text-[#ffffff30]">?</span> beyond the stardust veil
            </span>
          </div>
        </div>

        {/* HUD column */}
        <div className="space-y-4">
          {selected && selectedStatus ? (
            <OracleDialog
              zone={selected}
              status={selectedStatus}
              onRunCycle={runCycle}
              onClose={() => setSelected(null)}
              cycleNumber={state.cycles}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-[#00ff0040] bg-[#0a0f1a]/95 p-5 scanlines relative">
              <div className="font-pixel text-[8px] text-[#00ff00] mb-2 tracking-widest">
                ▸ ORACLE CHANNEL · STANDBY
              </div>
              <p className="font-mono text-xs text-[#ffffff60] leading-relaxed">
                The Oracle awaits your bearing, cartographer.
                <br />
                Touch an island on the constellation —{" "}
                <span className="text-[#00ff00]">green scan-rings</span> mark latent
                centres ready for a KSM cycle.
              </p>
            </div>
          )}
          <QuestJournal
            wholeness={wholeness}
            stardust={state.stardust}
            cycles={state.cycles}
            artifacts={state.artifacts}
            quest={questProgress}
            onReset={resetAll}
          />
          <MusicShrine started={started} />
        </div>
      </div>
    </div>
  );
}
