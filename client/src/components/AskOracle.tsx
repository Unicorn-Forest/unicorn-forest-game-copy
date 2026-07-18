/**
 * UNICORN FOREST — Ask the Oracle
 * A live conversation channel with Kayla's Unicorn agent (Chatbase API v2),
 * proxied through the server so the API key never reaches the browser.
 * Terminal-dossier styling; replies type out like transmissions.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { MENU_SKELETON, type MenuPage } from "@shared/menuTopology";

interface ChatLine {
  role: "you" | "oracle";
  text: string;
  live?: boolean;
}

/**
 * Skeleton framework — the AtomSpace menu-grammar topology mined from the
 * chathub archive. Hub pages act as constellation entry points; picking a
 * numbered option follows the strongest ImplicationLink edge (semi-
 * deterministic spine) while the oracle improvises the canopy.
 */
const SKELETON_BY_ID = new Map(MENU_SKELETON.map((p) => [p.id, p]));
// canonical entry hub: the ⚙️ "menu level above" page (highest-signal index)
const ROOT_HUB_IDS = ["page-009", "page-058", "page-047", "page-104"] as const;

function strongestEdge(page: MenuPage, option: number): string | null {
  const edges = page.edges
    .filter((e) => e.option === option && e.to)
    .sort((a, b) => b.strength - a.strength || b.evidence - a.evidence);
  return edges[0]?.to ?? null;
}

export default function AskOracle() {
  const { data: status } = trpc.oracle.status.useQuery(undefined, {
    staleTime: 60_000,
  });
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = trpc.oracle.ask.useMutation({
    onSuccess: (res) => {
      setLines((prev) => [...prev, { role: "oracle", text: res.text, live: res.live }]);
      if (res.conversationId) setConversationId(res.conversationId);
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, ask.isPending]);

  const send = () => {
    const msg = draft.trim();
    if (!msg || ask.isPending) return;
    setLines((prev) => [...prev, { role: "you", text: msg }]);
    setDraft("");
    ask.mutate({ message: msg, conversationId });
  };

  // ---- skeleton navigation state (AtomSpace topology) ----
  const [skelPageId, setSkelPageId] = useState<string>(ROOT_HUB_IDS[0]);
  const [skelTrail, setSkelTrail] = useState<string[]>([]);
  const skelPage = SKELETON_BY_ID.get(skelPageId) ?? null;
  const hubCycle = useMemo(
    () => ROOT_HUB_IDS.filter((id) => SKELETON_BY_ID.has(id)),
    [],
  );

  /** Pick a numbered option: send its text to the oracle and follow the edge. */
  const pickOption = (n: number, text: string) => {
    if (ask.isPending || !skelPage) return;
    const msg = `${n}. ${text}`;
    setLines((prev) => [...prev, { role: "you", text: msg }]);
    ask.mutate({ message: msg, conversationId });
    const next = strongestEdge(skelPage, n);
    if (next && SKELETON_BY_ID.has(next)) {
      setSkelTrail((t) => [...t, skelPageId]);
      setSkelPageId(next);
    }
  };

  /** ⚙️ ascend: pop the trail, or rotate to the next hub at the root. */
  const zoomOut = () => {
    if (skelTrail.length > 0) {
      const prev = skelTrail[skelTrail.length - 1];
      setSkelTrail((t) => t.slice(0, -1));
      setSkelPageId(prev);
    } else {
      const idx = hubCycle.indexOf(skelPageId as (typeof ROOT_HUB_IDS)[number]);
      setSkelPageId(hubCycle[(idx + 1) % hubCycle.length] ?? ROOT_HUB_IDS[0]);
    }
  };

  /** 🌿 explore: jump to a random connected page — a new enigma. */
  const explore = () => {
    const pool = MENU_SKELETON.filter((p) => p.id !== skelPageId && p.edges.length > 0);
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next) {
      setSkelTrail((t) => [...t, skelPageId]);
      setSkelPageId(next.id);
    }
  };

  return (
    <section className="rounded border border-[#22d3ee30] bg-[#0a0714f2] p-5 sm:p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(50% 45% at 15% 0%, #22d3ee12 0%, transparent 70%), radial-gradient(45% 40% at 90% 100%, #c084fc10 0%, transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-pixel text-xs sm:text-sm text-[#22d3ee] tracking-widest" style={{ textShadow: "0 0 14px #22d3ee50" }}>
            ☾ ASK THE ORACLE
          </h2>
          <span
            className={`font-mono text-[9px] px-2 py-0.5 rounded border ${
              status?.live
                ? "text-[#4ade80] border-[#4ade8040]"
                : "text-[#fbbf24] border-[#fbbf2440]"
            }`}
          >
            {status?.live ? "◉ live channel — Kayla's oracle" : "○ channel dormant"}
          </span>
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#ffffffb0] max-w-xl">
          Speak directly with the oracle that seeded this forest — the same voice,
          woven from Kayla's ideas and works, that dreamed these islands into being.
        </p>

        {/* transcript */}
        <div
          ref={scrollRef}
          className="mt-4 max-h-72 overflow-y-auto rounded border border-[#22d3ee20] bg-[#050510] p-3 grid gap-3"
          aria-live="polite"
        >
          {lines.length === 0 && (
            <div className="font-mono text-[10px] text-[#ffffff50] italic">
              The channel hums softly, waiting for your first question… try
              "Who guards the Whispering Bridges?" or "Tell me about the Moonwell."
            </div>
          )}
          {lines.map((l, i) => (
            <div key={i} className="grid gap-0.5">
              <span
                className={`font-pixel text-[7px] tracking-wider ${
                  l.role === "you" ? "text-[#fbbf24]" : "text-[#22d3ee]"
                }`}
              >
                {l.role === "you" ? "▸ YOU" : `☾ ORACLE${l.live === false ? " · echo" : ""}`}
              </span>
              <p className="font-mono text-[11px] leading-relaxed text-[#ffffffd8] whitespace-pre-wrap break-words">
                {l.text}
              </p>
            </div>
          ))}
          {ask.isPending && (
            <div className="font-mono text-[10px] text-[#22d3ee90] animate-pulse">
              ☾ the oracle listens across the veil…
            </div>
          )}
        </div>

        {/* composer */}
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={1000}
            placeholder="ask the forest anything…"
            className="flex-1 rounded border border-[#22d3ee30] bg-[#050510] px-3 py-2 font-mono text-[11px] text-white placeholder:text-[#ffffff40] focus:outline-none focus:border-[#22d3ee80]"
            aria-label="Message to the oracle"
          />
          <button
            onClick={send}
            disabled={ask.isPending || !draft.trim()}
            className="font-pixel text-[8px] px-4 py-2 rounded border border-[#22d3ee60] bg-[#0f1a1a] text-[#22d3ee] hover:bg-[#152a2a] hover:shadow-[0_0_18px_#22d3ee30] active:scale-[0.97] transition-all disabled:opacity-50 tracking-wider"
          >
            {ask.isPending ? "…" : "SEND ▸"}
          </button>
        </div>
        <p className="mt-2 font-mono text-[9px] text-[#ffffff40]">
          the conversation remembers itself — follow-up questions weave into the same thread
        </p>

        {/* skeleton framework — AtomSpace menu-grammar quick options */}
        {skelPage && (
          <div className="mt-4 rounded border border-[#c084fc30] bg-[#0a0714] p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className="font-pixel text-[7px] tracking-widest text-[#c084fc]"
                style={{ textShadow: "0 0 10px #c084fc40" }}
              >
                ◈ SKELETON · {skelPage.label.replace(/[*#]/g, "").slice(0, 48)}
              </span>
              <span className="font-mono text-[8px] text-[#ffffff40]">
                atomspace · {MENU_SKELETON.length} pages · depth {skelTrail.length}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skelPage.options.slice(0, 6).map((o) => (
                <button
                  key={o.n}
                  onClick={() => pickOption(o.n, o.text)}
                  disabled={ask.isPending}
                  className="font-mono text-[9px] px-2 py-1 rounded border border-[#c084fc40] text-[#e9d5ff] bg-[#150f24] hover:bg-[#1e1633] hover:shadow-[0_0_12px_#c084fc25] active:scale-[0.97] transition-all disabled:opacity-40 text-left max-w-[240px] truncate"
                  title={o.text}
                >
                  <span className="text-[#c084fc]">{o.n}</span> · {o.text.slice(0, 52)}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={zoomOut}
                disabled={ask.isPending}
                className="font-mono text-[9px] px-2 py-1 rounded border border-[#fbbf2440] text-[#fbbf24] bg-[#1a1408] hover:bg-[#241c0c] active:scale-[0.97] transition-all disabled:opacity-40"
                title="ascend to the menu level above"
              >
                ⚙️ zoom out
              </button>
              <button
                onClick={explore}
                disabled={ask.isPending}
                className="font-mono text-[9px] px-2 py-1 rounded border border-[#4ade8040] text-[#4ade80] bg-[#0a1a10] hover:bg-[#0e2416] active:scale-[0.97] transition-all disabled:opacity-40"
                title="descend into a new enigma"
              >
                🌿 explore
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
