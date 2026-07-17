/**
 * UNICORN FOREST — Cartographer's Field Notes
 * S3-backed uploads pinned to zones: sketches, screenshots, scroll fragments.
 * Signed-in feature; guests see a login invitation in dossier voice.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ZONES, ZONE_MAP } from "@/lib/forestData";
import { trpc } from "@/lib/trpc";

const MAX_BYTES = 8 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function FieldNotes({ discovered }: { discovered: string[] }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const notes = trpc.fieldNotes.list.useQuery(undefined, { enabled: isAuthenticated });
  const upload = trpc.fieldNotes.upload.useMutation({
    onSuccess: () => {
      utils.fieldNotes.list.invalidate();
      toast.success("Field note archived in the expedition vault ✦");
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.fieldNotes.remove.useMutation({
    onMutate: async ({ id }) => {
      await utils.fieldNotes.list.cancel();
      const prev = utils.fieldNotes.list.getData();
      utils.fieldNotes.list.setData(undefined, (old) => old?.filter((n) => n.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.fieldNotes.list.setData(undefined, ctx.prev);
      toast.error("The vault refused to release that note.");
    },
    onSettled: () => utils.fieldNotes.list.invalidate(),
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [zoneId, setZoneId] = useState<string>("moonwell");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("Field note exceeds 8 MB — the moths cannot carry it.");
      return;
    }
    setBusy(true);
    try {
      const dataBase64 = await fileToBase64(file);
      await upload.mutateAsync({
        zoneId,
        fileName: file.name,
        mimeType: file.type || "text/plain",
        dataBase64,
        caption: caption.trim() || undefined,
      });
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      /* handled by onError */
    } finally {
      setBusy(false);
    }
  };

  const discoveredZones = ZONES.filter((z) => discovered.includes(z.id));

  return (
    <div className="rounded-lg border border-dashed border-[#c084fc40] bg-[#0a0f1a]/95 backdrop-blur-sm p-4 sm:p-5">
      <h3 className="font-pixel text-[9px] sm:text-[10px] text-[#c084fc] glow-violet tracking-wider mb-3">
        ✦ CARTOGRAPHER'S FIELD NOTES
      </h3>

      {!isAuthenticated ? (
        <div className="space-y-3">
          <p className="font-mono text-[11px] text-[#ffffff60] leading-relaxed">
            The expedition vault opens only to registered cartographers. Sign in to pin
            sketches, screenshots, and scroll fragments to the islands you awaken —
            preserved across every device.
          </p>
          <button
            onClick={() => startLogin()}
            className="font-pixel text-[9px] px-4 py-2.5 rounded border border-[#c084fc80] bg-[#12081a] text-[#c084fc] hover:bg-[#1a0d24] hover:shadow-[0_0_20px_#c084fc30] active:scale-[0.97] transition-all tracking-wider"
          >
            ▶ SIGN IN TO THE VAULT
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* uploader */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="flex-1 bg-[#070714] border border-[#ffffff15] rounded px-2 py-2 font-mono text-[11px] text-[#ffffffb0] focus:border-[#c084fc60] focus:outline-none"
                aria-label="Pin note to zone"
              >
                {discoveredZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.emoji} {z.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="caption for the archive (optional)…"
              className="w-full bg-[#070714] border border-[#ffffff15] rounded px-2 py-2 font-mono text-[11px] text-[#ffffffb0] placeholder:text-[#ffffff30] focus:border-[#c084fc60] focus:outline-none"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy || upload.isPending}
              className="w-full font-pixel text-[9px] px-4 py-3 rounded border border-dashed border-[#c084fc60] bg-[#12081a] text-[#c084fc] hover:bg-[#1a0d24] active:scale-[0.98] transition-all tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy || upload.isPending ? "⟳ ARCHIVING…" : "⬆ UPLOAD FIELD NOTE"}
            </button>
            <p className="font-mono text-[9px] text-[#ffffff35]">
              images · pdf scrolls · text fragments — max 8 MB, stored in the S3 vault
            </p>
          </div>

          {/* gallery */}
          {notes.isLoading ? (
            <p className="font-mono text-[10px] text-[#ffffff40] animate-pulse">
              ⟳ consulting the vault…
            </p>
          ) : !notes.data || notes.data.length === 0 ? (
            <p className="font-mono text-[10px] text-[#ffffff35] italic">
              The vault is empty — no field notes archived yet.
            </p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notes.data.map((n) => {
                const zone = ZONE_MAP[n.zoneId];
                const isImage = n.mimeType.startsWith("image/");
                return (
                  <li
                    key={n.id}
                    className="flex gap-3 p-2 rounded border border-[#ffffff10] bg-[#070714] group"
                  >
                    {isImage ? (
                      <a href={n.url} target="_blank" rel="noreferrer" className="shrink-0">
                        <img
                          src={n.url}
                          alt={n.caption ?? n.fileName}
                          className="w-14 h-14 object-cover rounded border border-[#ffffff10]"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 w-14 h-14 rounded border border-[#ffffff10] flex items-center justify-center text-xl bg-[#0d0a1a]"
                      >
                        📜
                      </a>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] text-[#ffffffb0] truncate">
                        {n.fileName}
                      </div>
                      <div className="font-mono text-[9px] text-[#c084fc90]">
                        {zone ? `${zone.emoji} ${zone.name}` : n.zoneId}
                      </div>
                      {n.caption && (
                        <div className="font-mono text-[9px] text-[#ffffff50] italic truncate">
                          “{n.caption}”
                        </div>
                      )}
                      <div className="font-mono text-[8px] text-[#ffffff30]">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => remove.mutate({ id: n.id })}
                      className="self-start font-mono text-[10px] text-[#ffffff25] hover:text-[#ff5566] transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Delete ${n.fileName}`}
                      title="Release from the vault"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
