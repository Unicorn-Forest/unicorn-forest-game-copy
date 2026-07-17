/**
 * UNICORN FOREST — Oracle KSM Cycle panel
 * When the player runs a KSM cycle on a reachable zone, the oracle speaks
 * (typewriter lore from the real chatbot), KSM steps tick by, and the zone
 * materializes. Also serves as zone inspector for discovered zones.
 */
import { useEffect, useState } from "react";
import {
  ARTIFACTS,
  CHARACTERS,
  KSM_STEPS,
  type Zone,
} from "@/lib/forestData";
import type { ZoneStatus } from "@/hooks/useForestGame";
import { KsmBar, Typewriter } from "./PixelPrimitives";

interface Props {
  zone: Zone;
  status: ZoneStatus;
  onRunCycle: (zoneId: string) => void;
  onClose: () => void;
  cycleNumber: number;
}

export default function OracleDialog({ zone, status, onRunCycle, onClose, cycleNumber }: Props) {
  const [phase, setPhase] = useState<"idle" | "cycling" | "revealed">("idle");
  const [step, setStep] = useState(0);

  // Reset when zone changes
  useEffect(() => {
    setPhase("idle");
    setStep(0);
  }, [zone.id]);

  // KSM step ticker during cycle
  useEffect(() => {
    if (phase !== "cycling") return;
    const iv = setInterval(() => {
      setStep((s) => {
        if (s >= KSM_STEPS.length - 1) {
          clearInterval(iv);
          return s;
        }
        return s + 1;
      });
    }, 380);
    return () => clearInterval(iv);
  }, [phase]);

  const character = zone.characterId ? CHARACTERS[zone.characterId] : null;
  const artifact = zone.artifactId ? ARTIFACTS[zone.artifactId] : null;
  const discovered = status === "discovered";
  const showLore = discovered || phase === "cycling" || phase === "revealed";

  const startCycle = () => {
    setPhase("cycling");
  };

  const handleLoreDone = () => {
    if (phase === "cycling") {
      setPhase("revealed");
      onRunCycle(zone.id);
    }
  };

  return (
    <div className="relative rounded-lg border border-dashed border-[#00ff0060] bg-[#0a0f1a]/95 backdrop-blur-sm p-4 sm:p-5 scanlines overflow-hidden">
      {/* header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{zone.emoji}</span>
          <div>
            <h3 className="font-pixel text-[10px] sm:text-xs text-[#00f0ff] glow-cyan tracking-wider">
              {zone.name.toUpperCase()}
            </h3>
            <p className="font-mono text-[10px] text-[#ffffff50] mt-1">{zone.tagline}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="font-pixel text-[10px] text-[#ffffff40] hover:text-[#00f0ff] transition-colors px-1"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* status line */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        {discovered ? (
          <KsmBar percent={100} label="CENTRE" color="#00f0ff" />
        ) : phase === "cycling" || phase === "revealed" ? (
          <KsmBar
            percent={Math.round(((step + 1) / KSM_STEPS.length) * 100)}
            label={`KSM CYCLE ${String(cycleNumber).padStart(2, "0")}`}
            color="#ffb347"
          />
        ) : (
          <KsmBar percent={0} label="LATENT CENTRE" color="#00ff00" />
        )}
        {(phase === "cycling" || phase === "revealed") && (
          <span className="font-mono text-[10px] text-[#ffb347] glow-amber">
            {KSM_STEPS[step]}
          </span>
        )}
      </div>

      {/* body */}
      {status === "locked" ? (
        <div className="font-mono text-xs text-[#ff8899] leading-relaxed">
          {zone.requires?.ally ? (
            <>⚠ The Nightmare Weavers spin fear across this path. You need a guide whose wings carry light — cross the <b>Whispering Bridges</b> to befriend the <b>Lumina Moth</b> first.</>
          ) : (
            <>⚠ An ancient stone door bars the way. It opens only for one who holds all <b>5 memory artifacts</b> and can speak the name of the Moonflower.</>
          )}
        </div>
      ) : showLore ? (
        <div className="space-y-3">
          <p className="font-mono text-xs sm:text-[13px] text-[#ffffffb0] leading-relaxed min-h-[3.5rem]">
            <span className="text-[#ffb347]">✦ THE ORACLE: </span>
            {discovered ? (
              zone.lore
            ) : (
              <Typewriter text={zone.lore} onDone={handleLoreDone} />
            )}
          </p>

          {(discovered || phase === "revealed") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 zone-reveal">
              {character && (
                <div className="p-3 rounded border border-dashed border-[#c084fc50] bg-[#0d0a1a]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{character.emoji}</span>
                    <div>
                      <div className="font-pixel text-[8px] text-[#c084fc] glow-violet">
                        {character.name.toUpperCase()}
                      </div>
                      <div className="font-mono text-[9px] text-[#ffffff40]">{character.role}</div>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] italic text-[#ffffff70] leading-relaxed">
                    “{character.quote}”
                  </p>
                </div>
              )}
              {artifact && (
                <div className="p-3 rounded border border-dashed border-[#ffb34750] bg-[#141008]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{artifact.emoji}</span>
                    <div className="font-pixel text-[8px] text-[#ffb347] glow-amber">
                      {artifact.name.toUpperCase()}
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-[#ffffff70] leading-relaxed">
                    {artifact.description}
                  </p>
                  <div className="font-mono text-[9px] text-[#00ff00] mt-1.5">+ artifact acquired</div>
                </div>
              )}
              {zone.id === "whispering-bridges" && (
                <div className="p-3 rounded border border-dashed border-[#00f0ff50] bg-[#081018] sm:col-span-2">
                  <span className="font-pixel text-[8px] text-[#00f0ff]">🦋 THE LUMINA MOTH JOINS YOUR EXPEDITION</span>
                  <p className="font-mono text-[10px] text-[#ffffff70] mt-1">Its wings carry the light of forgotten stars — the Shadow Thicket is now survivable.</p>
                </div>
              )}
              {zone.finale && (
                <div className="p-3 rounded border border-[#ffb347] bg-[#141008] sm:col-span-2 text-center">
                  <div className="font-pixel text-[10px] text-[#ffb347] glow-amber mb-1">🎉 EXPEDITION COMPLETE 🎉</div>
                  <p className="font-mono text-[10px] text-[#ffffff80]">The Prophecy of the Cosmic Order is fulfilled — every KSM cycle contributed to the whole.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-xs text-[#ffffff70] leading-relaxed">
            A latent centre shimmers here, adjacent to the awakened forest. Run a{" "}
            <span className="text-[#00ff00]">KSM cycle</span> to strengthen it — the
            Oracle will speak, and the island will materialize on the map.
          </p>
          <button
            onClick={startCycle}
            className="font-pixel text-[9px] sm:text-[10px] px-4 py-3 rounded border border-dashed border-[#00ff0080] bg-[#061206] text-[#00ff00] hover:bg-[#0a1f0a] hover:border-[#00ff00] active:scale-[0.97] transition-all tracking-wider"
          >
            ▶ RUN KSM CYCLE {String(cycleNumber).padStart(2, "0")}
          </button>
        </div>
      )}
    </div>
  );
}
