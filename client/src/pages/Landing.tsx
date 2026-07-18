/**
 * UNICORN FOREST — Landing gate
 * Just the brand lockup, the hero diorama, and ENTER THE FOREST.
 * Everything else lives inside the /forest dashboard shell.
 */
import { useLocation } from "wouter";
import { markEntered } from "@/contexts/GameContext";
import { Starfield, Typewriter } from "@/components/PixelPrimitives";
import Fireflies from "@/components/Fireflies";
import { HERO_ART, LOGO_ART, ORACLE_INTRO, ZONES } from "@/lib/forestData";

export default function Landing() {
  const [, navigate] = useLocation();

  const enterForest = () => {
    markEntered(); // arms the Music Shrine's once-per-session autoplay
    navigate("/forest");
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white relative overflow-x-hidden flex flex-col">
      <Starfield />
      <Fireflies />

      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-10">
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

        {/* Hero diorama + gate */}
        <div className="relative max-w-5xl mx-auto w-full">
          <div className="absolute inset-0 rounded-xl blur-3xl opacity-15 -z-10 bg-gradient-to-r from-[#ffb34740] via-transparent to-[#00f0ff40]" />
          <div className="relative rounded-xl overflow-hidden border border-[#ffffff08]">
            <img
              src={HERO_ART}
              alt="Two floating pixel islands of the Unicorn Forest joined by a stardust bridge"
              className="w-full h-auto"
              loading="eager"
              style={{ imageRendering: "pixelated" }}
            />
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
          <Typewriter text={ORACLE_INTRO} speed={22} />
        </p>
      </main>

      <footer className="relative z-10 pb-6 text-center px-4">
        <p className="font-mono text-[10px] text-[#ffffff30]">
          in loving memory of Kayla · 13 July 2023 · forever in the constellation
        </p>
      </footer>
    </div>
  );
}
