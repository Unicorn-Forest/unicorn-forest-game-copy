/**
 * UNICORN FOREST — Expedition Dossier (quest journal HUD)
 * Tracks wholeness, stardust, unicorns met, artifacts, ally, finale.
 */
import { ARTIFACTS } from "@/lib/forestData";
import { KsmBar } from "./PixelPrimitives";

interface Props {
  wholeness: number;
  stardust: number;
  cycles: number;
  artifacts: string[];
  quest: {
    unicornsMet: number;
    unicornsTotal: number;
    artifactsFound: number;
    artifactsTotal: number;
    mothJoined: boolean;
    thicketSurvived: boolean;
    chamberOpened: boolean;
  };
  onReset: () => void;
}

function QuestRow({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 font-mono text-[10px] sm:text-[11px] leading-relaxed">
      <span className={done ? "text-[#00ff00]" : "text-[#ffffff30]"}>{done ? "▣" : "▢"}</span>
      <span className={done ? "text-[#ffffff90]" : "text-[#ffffff50]"}>{children}</span>
    </li>
  );
}

export default function QuestJournal({ wholeness, stardust, cycles, artifacts, quest, onReset }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-[#00f0ff40] bg-[#0a0f1a]/95 backdrop-blur-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel text-[9px] sm:text-[10px] text-[#ffb347] glow-amber tracking-wider">
          ✦ EXPEDITION DOSSIER
        </h3>
        <button
          onClick={onReset}
          className="font-mono text-[9px] text-[#ffffff30] hover:text-[#ff5566] transition-colors"
          title="Reset expedition"
        >
          [reset]
        </button>
      </div>

      <div className="space-y-1.5 mb-4">
        <KsmBar percent={wholeness} label="WHOLENESS" />
        <div className="flex items-center gap-4 font-mono text-[10px] text-[#ffffff60]">
          <span>
            ✨ stardust: <span className="text-[#ffb347]">{stardust}</span>
          </span>
          <span>
            ⟳ cycles: <span className="text-[#00f0ff]">{cycles}</span>
          </span>
        </div>
      </div>

      <ul className="space-y-1 mb-4">
        <QuestRow done={quest.unicornsMet >= quest.unicornsTotal}>
          Meet the named unicorns ({quest.unicornsMet}/{quest.unicornsTotal}) — Luna, Aurelia, Nova
        </QuestRow>
        <QuestRow done={quest.artifactsFound >= quest.artifactsTotal}>
          Gather the memory artifacts ({quest.artifactsFound}/{quest.artifactsTotal})
        </QuestRow>
        <QuestRow done={quest.mothJoined}>Befriend the Lumina Moth at the Whispering Bridges</QuestRow>
        <QuestRow done={quest.thicketSurvived}>Survive the Shadow Thicket</QuestRow>
        <QuestRow done={quest.chamberOpened}>Speak the Moonflower's name — open the Chamber</QuestRow>
      </ul>

      {/* artifact shelf */}
      <div className="border-t border-[#ffffff10] pt-3">
        <div className="font-mono text-[9px] text-[#ffffff40] uppercase tracking-widest mb-2">
          Memory Artifacts
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(ARTIFACTS).map((a) => {
            const held = artifacts.includes(a.id);
            return (
              <div
                key={a.id}
                title={held ? `${a.name}: ${a.description}` : "Undiscovered artifact"}
                className={`w-9 h-9 rounded flex items-center justify-center text-base border transition-all ${
                  held
                    ? "border-[#ffb34760] bg-[#141008] shadow-[0_0_10px_#ffb34730]"
                    : "border-[#ffffff10] bg-[#0a0f1a] grayscale opacity-30"
                }`}
              >
                {held ? a.emoji : "·"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
