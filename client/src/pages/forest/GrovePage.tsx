/**
 * UNICORN FOREST — Kayla's Grove page
 * The memorial dedication and public guestbook.
 */
import KaylasGrove from "@/components/KaylasGrove";
import { DocPage } from "@/components/templates/PageTemplates";

export default function GrovePage() {
  return (
    <DocPage
      title="✦ KAYLA'S GROVE ✦"
      subtitle="a quiet clearing in the forest, kept in her memory"
      accent="pink"
    >
      <div className="text-center rounded-lg border border-[#ff9ecf25] bg-[#0a0f1a]/80 px-6 py-6 mb-6">
        <div
          className="font-pixel text-[9px] text-[#ff9ecf] tracking-widest mb-3"
          style={{ textShadow: "0 0 14px #ff9ecf50" }}
        >
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
      <KaylasGrove />
    </DocPage>
  );
}
