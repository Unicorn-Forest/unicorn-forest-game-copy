/**
 * UNICORN FOREST — The Music Shrine
 * In loving memory of Kayla — the forest sings her songs.
 *
 * Uses the official YouTube IFrame Player API (no API key required).
 * The player itself is rendered 1x1 px (audio-only presence); the shrine UI
 * is a pixel-styled deck: track list, play/pause, prev/next, volume.
 * Admin (site owner) can add/remove tracks; visitors can listen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

// ---- YouTube IFrame API types (minimal) ----
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  setVolume: (v: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: unknown) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

interface Track {
  id: number;
  videoId: string;
  title: string;
  dedication: string | null;
}

/** Fallback tracks shown until the keeper adds Kayla's songs (gentle ambient/lofi). */
const PLACEHOLDER_TRACKS: Track[] = [
  { id: -1, videoId: "4xDzrJKXOOY", title: "synthwave radio — placeholder", dedication: null },
  { id: -2, videoId: "jfKfPfyJRdk", title: "lofi hip hop radio — placeholder", dedication: null },
];

export default function MusicShrine({ started }: { started: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";
  const utils = trpc.useUtils();
  const tracksQuery = trpc.shrine.tracks.useQuery();
  const addTrack = trpc.shrine.addTrack.useMutation({
    onSuccess: () => {
      utils.shrine.tracks.invalidate();
      toast.success("Song laid at the shrine ✦");
      setNewUrl("");
      setNewTitle("");
      setNewDedication("");
    },
    onError: (e) => toast.error(e.message),
  });
  const removeTrack = trpc.shrine.removeTrack.useMutation({
    onSuccess: () => utils.shrine.tracks.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const tracks: Track[] =
    tracksQuery.data && tracksQuery.data.length > 0
      ? tracksQuery.data.map((t) => ({
          id: t.id,
          videoId: t.videoId,
          title: t.title,
          dedication: t.dedication,
        }))
      : PLACEHOLDER_TRACKS;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(35);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDedication, setNewDedication] = useState("");

  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const indexRef = useRef(index);
  indexRef.current = index;

  const current = tracks[Math.min(index, tracks.length - 1)];

  // ---- Create the hidden player once ----
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || playerRef.current) return;
      const el = document.createElement("div");
      containerRef.current.appendChild(el);
      playerRef.current = new window.YT!.Player(el, {
        width: 1,
        height: 1,
        videoId: tracksRef.current[0]?.videoId,
        playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: () => {
            playerRef.current?.setVolume(35);
            setReady(true);
          },
          onStateChange: (e: { data: number }) => {
            const YTS = window.YT!.PlayerState;
            if (e.data === YTS.PLAYING) setPlaying(true);
            if (e.data === YTS.PAUSED) setPlaying(false);
            if (e.data === YTS.ENDED) {
              // play-once: the song rests when it finishes — no auto-advance.
              // Visitors can replay or choose another song from the list.
              setPlaying(false);
              playerRef.current?.cueVideoById(tracksRef.current[indexRef.current].videoId);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Volume sync ----
  useEffect(() => {
    if (ready) playerRef.current?.setVolume(volume);
  }, [volume, ready]);

  // ---- Gentle autostart once the visitor enters the forest (user gesture given) ----
  const autostartedRef = useRef(false);
  useEffect(() => {
    if (started && ready && !autostartedRef.current) {
      autostartedRef.current = true;
      playerRef.current?.playVideo();
    }
  }, [started, ready]);

  const playTrack = useCallback(
    (i: number) => {
      const list = tracksRef.current;
      const safe = ((i % list.length) + list.length) % list.length;
      setIndex(safe);
      playerRef.current?.loadVideoById(list[safe].videoId);
      setPlaying(true);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [playing]);

  return (
    <div className="rounded-lg border border-dashed border-[#ff9ecf40] bg-[#0a0f1a]/95 backdrop-blur-sm p-4 sm:p-5">
      {/* hidden 1x1 player mount */}
      <div ref={containerRef} className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none" aria-hidden />

      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-pixel text-[9px] sm:text-[10px] text-[#ff9ecf] tracking-wider" style={{ textShadow: "0 0 12px #ff9ecf60" }}>
          ♪ THE MUSIC SHRINE
        </h3>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="font-mono text-[9px] text-[#ffffff40] hover:text-[#ff9ecf] transition-colors"
          aria-expanded={expanded}
        >
          [{expanded ? "fold" : "songs"}]
        </button>
      </div>
      <p className="font-mono text-[9px] text-[#ffffff45] italic mb-3 leading-relaxed">
        for Kayla — whose vision seeded this forest. her songs keep the islands aloft.
      </p>

      {/* transport deck */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => playTrack(index - 1)}
          disabled={!ready}
          className="font-pixel text-[10px] px-2 py-2 rounded border border-[#ffffff15] text-[#ffffff70] hover:text-[#ff9ecf] hover:border-[#ff9ecf50] active:scale-[0.95] transition-all disabled:opacity-40"
          aria-label="Previous song"
        >
          ◂◂
        </button>
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="font-pixel text-[11px] px-4 py-2 rounded border border-[#ff9ecf60] bg-[#1a0d14] text-[#ff9ecf] hover:shadow-[0_0_16px_#ff9ecf30] active:scale-[0.95] transition-all disabled:opacity-40"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          onClick={() => playTrack(index + 1)}
          disabled={!ready}
          className="font-pixel text-[10px] px-2 py-2 rounded border border-[#ffffff15] text-[#ffffff70] hover:text-[#ff9ecf] hover:border-[#ff9ecf50] active:scale-[0.95] transition-all disabled:opacity-40"
          aria-label="Next song"
        >
          ▸▸
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 accent-[#ff9ecf] h-1"
          aria-label="Volume"
        />
      </div>

      {/* now playing — marquee scrolls when the title is playing */}
      <div className="mt-2 font-mono text-[10px] text-[#ffffffa0] flex items-baseline gap-1 overflow-hidden">
        <span className="text-[#ff9ecf] shrink-0">{playing ? "♪ now singing:" : "♪ resting on:"}</span>
        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <span className={playing ? "inline-block shrine-marquee" : "inline-block truncate max-w-full align-bottom"}>
            {current?.title ?? "—"}
            {playing && <span className="px-6 text-[#ff9ecf50]">✦</span>}
            {playing && (current?.title ?? "—")}
          </span>
        </div>
      </div>
      {current?.dedication && (
        <div className="font-mono text-[9px] text-[#ff9ecf80] italic truncate">
          “{current.dedication}”
        </div>
      )}
      {tracksQuery.data?.length === 0 || (!tracksQuery.data && !tracksQuery.isLoading) ? null : null}
      {tracks === PLACEHOLDER_TRACKS && !tracksQuery.isLoading && (
        <div className="mt-1 font-mono text-[9px] text-[#ffffff35]">
          placeholder ambience — the keeper may lay Kayla's songs below
        </div>
      )}

      {/* track list + admin */}
      {expanded && (
        <div className="mt-3 space-y-2">
          <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {tracks.map((t, i) => (
              <li key={t.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => playTrack(i)}
                  className={`flex-1 text-left font-mono text-[10px] px-2 py-1.5 rounded border transition-all truncate ${
                    i === index
                      ? "border-[#ff9ecf50] text-[#ff9ecf] bg-[#1a0d14]"
                      : "border-[#ffffff10] text-[#ffffff70] hover:border-[#ff9ecf30] hover:text-[#ff9ecf]"
                  }`}
                >
                  {i === index && playing ? "♪ " : "· "}
                  {t.title}
                </button>
                {isAdmin && t.id > 0 && (
                  <button
                    onClick={() => removeTrack.mutate({ id: t.id })}
                    className="font-mono text-[10px] text-[#ffffff25] hover:text-[#ff5566] transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${t.title}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>

          {isAdmin && (
            <div className="pt-2 border-t border-[#ffffff10] space-y-1.5">
              <div className="font-mono text-[9px] text-[#ff9ecf80]">
                keeper's bench — lay a new song (YouTube link)
              </div>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=…"
                className="w-full bg-[#070714] border border-[#ffffff15] rounded px-2 py-1.5 font-mono text-[10px] text-[#ffffffb0] placeholder:text-[#ffffff30] focus:border-[#ff9ecf60] focus:outline-none"
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={255}
                placeholder="song title"
                className="w-full bg-[#070714] border border-[#ffffff15] rounded px-2 py-1.5 font-mono text-[10px] text-[#ffffffb0] placeholder:text-[#ffffff30] focus:border-[#ff9ecf60] focus:outline-none"
              />
              <input
                type="text"
                value={newDedication}
                onChange={(e) => setNewDedication(e.target.value)}
                maxLength={500}
                placeholder="dedication line (optional)…"
                className="w-full bg-[#070714] border border-[#ffffff15] rounded px-2 py-1.5 font-mono text-[10px] text-[#ffffffb0] placeholder:text-[#ffffff30] focus:border-[#ff9ecf60] focus:outline-none"
              />
              <button
                onClick={() => {
                  if (!newUrl.trim() || !newTitle.trim()) {
                    toast.error("A link and a title are needed to lay a song.");
                    return;
                  }
                  addTrack.mutate({
                    videoIdOrUrl: newUrl.trim(),
                    title: newTitle.trim(),
                    dedication: newDedication.trim() || undefined,
                  });
                }}
                disabled={addTrack.isPending}
                className="w-full font-pixel text-[9px] px-3 py-2 rounded border border-[#ff9ecf60] bg-[#1a0d14] text-[#ff9ecf] hover:shadow-[0_0_16px_#ff9ecf30] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {addTrack.isPending ? "⟳ LAYING…" : "♪ LAY SONG AT SHRINE"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
