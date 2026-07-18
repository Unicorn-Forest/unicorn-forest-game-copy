/**
 * UNICORN FOREST — Kayla's Grove
 * A memorial guestbook where friends and family leave tributes and memories.
 * Public: anyone may write (no login needed, so family without accounts can
 * contribute). The keeper (site owner) can quietly remove entries.
 *
 * Styled as a moonlit grove clearing: pink memorial accents, soft glow,
 * dossier-terminal voice consistent with the rest of the forest.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function KaylasGrove() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: tributes, isLoading } = trpc.grove.tributes.useQuery();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const leaveTribute = trpc.grove.leaveTribute.useMutation({
    onSuccess: () => {
      utils.grove.tributes.invalidate();
      setMessage("");
      toast.success("Your tribute rests in the grove. Thank you.");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeTribute = trpc.grove.removeTribute.useMutation({
    onMutate: async ({ id }) => {
      await utils.grove.tributes.cancel();
      const prev = utils.grove.tributes.getData();
      utils.grove.tributes.setData(undefined, (old) => old?.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) utils.grove.tributes.setData(undefined, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => utils.grove.tributes.invalidate(),
  });

  const submit = () => {
    if (!name.trim()) {
      toast.error("Please tell us your name.");
      return;
    }
    if (message.trim().length < 2) {
      toast.error("A tribute needs at least a few words.");
      return;
    }
    leaveTribute.mutate({ authorName: name.trim(), message: message.trim() });
  };

  return (
    <section
      id="kaylas-grove"
      className="relative rounded border border-[#ff9ecf30] bg-[#0a0714f2] p-5 sm:p-7 overflow-hidden"
    >
      {/* soft pink aurora wash */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, #ff9ecf14 0%, transparent 70%), radial-gradient(40% 40% at 85% 90%, #c084fc10 0%, transparent 70%)",
        }}
      />

      <div className="relative">
        <h2 className="font-pixel text-xs sm:text-sm text-[#ff9ecf] tracking-widest glow-pink">
          ✿ KAYLA'S GROVE · GUESTBOOK
        </h2>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#ffffffb0] max-w-xl">
          A quiet clearing kept for Kayla. Leave a memory, a message, or a song of
          words — each tribute becomes part of the forest she imagined.
        </p>

        {/* ---- write a tribute ---- */}
        <div className="mt-4 grid gap-2 max-w-xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="your name…"
            className="w-full rounded border border-[#ff9ecf30] bg-[#050510] px-3 py-2 font-mono text-[11px] text-white placeholder:text-[#ffffff40] focus:outline-none focus:border-[#ff9ecf80]"
            aria-label="Your name"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="a memory of Kayla, a message for her family, a wish for the forest…"
            className="w-full rounded border border-[#ff9ecf30] bg-[#050510] px-3 py-2 font-mono text-[11px] text-white placeholder:text-[#ffffff40] focus:outline-none focus:border-[#ff9ecf80] resize-y"
            aria-label="Your tribute"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[9px] text-[#ffffff50]">
              {message.length}/2000
            </span>
            <button
              onClick={submit}
              disabled={leaveTribute.isPending}
              className="font-pixel text-[8px] px-4 py-2.5 rounded border border-[#ff9ecf60] bg-[#1a0f1a] text-[#ff9ecf] hover:bg-[#2a152a] hover:shadow-[0_0_18px_#ff9ecf30] active:scale-[0.97] transition-all disabled:opacity-50 tracking-wider"
            >
              {leaveTribute.isPending ? "PLANTING…" : "✿ PLANT A TRIBUTE"}
            </button>
          </div>
        </div>

        {/* ---- tributes ---- */}
        <div className="mt-5 grid gap-3">
          {isLoading && (
            <div className="font-mono text-[10px] text-[#ffffff50]">
              listening to the grove…
            </div>
          )}
          {!isLoading && (tributes?.length ?? 0) === 0 && (
            <div className="font-mono text-[10px] text-[#ffffff50] italic">
              The grove is still — be the first to leave a memory for Kayla.
            </div>
          )}
          {tributes?.map((t) => (
            <div
              key={t.id}
              className="rounded border border-[#ff9ecf20] bg-[#05051080] px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-pixel text-[8px] text-[#ff9ecf]">
                  ✿ {t.authorName}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-[#ffffff40]">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => removeTribute.mutate({ id: t.id })}
                      className="font-mono text-[9px] text-[#ffffff40] hover:text-[#ff6b6b] transition-colors"
                      title="Remove tribute (keeper only)"
                    >
                      [remove]
                    </button>
                  )}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-[#ffffffd0] whitespace-pre-wrap break-words">
                {t.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
