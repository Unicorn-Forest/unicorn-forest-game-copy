/**
 * UNICORN FOREST — Isometric constellation map
 * Floating pixel islands positioned on a void canvas, linked by stardust trails.
 * Latent zones = dark silhouettes; reachable = dashed green "scanning" ring;
 * locked = red warning; discovered = full glow + bob.
 */
import { useMemo } from "react";
import { ISLAND_ART, ZONES, ZONE_MAP, type Zone } from "@/lib/forestData";
import type { ZoneStatus } from "@/hooks/useForestGame";
import { StatusDot } from "./PixelPrimitives";

interface Props {
  statusOf: (id: string) => ZoneStatus;
  onSelect: (zone: Zone) => void;
  selectedId?: string | null;
  justDiscovered?: string | null;
}

const STATUS_COLOR: Record<ZoneStatus, string> = {
  discovered: "#00f0ff",
  reachable: "#00ff00",
  locked: "#ff5566",
  hidden: "#223",
};

export default function ForestMap({ statusOf, onSelect, selectedId, justDiscovered }: Props) {
  /** Edges between zones (dedup) */
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<[Zone, Zone]> = [];
    for (const z of ZONES) {
      for (const a of z.adjacent) {
        const key = [z.id, a].sort().join("|");
        if (!seen.has(key) && ZONE_MAP[a]) {
          seen.add(key);
          list.push([z, ZONE_MAP[a]]);
        }
      }
    }
    return list;
  }, []);

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/12", padding: "2% 4%" }}>
      {/* Stardust trails layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {edges.map(([a, b]) => {
          const sa = statusOf(a.id);
          const sb = statusOf(b.id);
          const bothDiscovered = sa === "discovered" && sb === "discovered";
          const oneDiscovered = sa === "discovered" || sb === "discovered";
          if (!oneDiscovered)
            return (
              <line
                key={`${a.id}-${b.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#334"
                strokeOpacity={0.25}
                strokeWidth={0.15}
                strokeDasharray="0.6 2.2"
              />
            );
          const isNew =
            justDiscovered && (a.id === justDiscovered || b.id === justDiscovered);
          return (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={bothDiscovered ? "#00f0ff" : "#00f0ff44"}
              strokeWidth={bothDiscovered ? 0.35 : 0.25}
              strokeDasharray="1.4 1.6"
              className={
                isNew && bothDiscovered
                  ? "path-draw path-flow"
                  : bothDiscovered
                    ? "path-flow"
                    : undefined
              }
              style={{
                filter: bothDiscovered
                  ? "drop-shadow(0 0 1.2px #00f0ff)"
                  : undefined,
              }}
            />
          );
        })}
      </svg>

      {/* Islands layer */}
      {ZONES.map((zone, i) => {
        const status = statusOf(zone.id);
        if (status === "hidden") {
          // veiled island silhouette — the forest exists beyond the scan
          return (
            <div
              key={zone.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              aria-hidden
            >
              <img
                src={ISLAND_ART[zone.art]}
                alt=""
                draggable={false}
                className="w-14 sm:w-20 md:w-24 h-auto opacity-90"
                style={{
                  imageRendering: "pixelated",
                  filter: "brightness(0.09) saturate(0) blur(0.5px)",
                }}
              />
              <div className="text-center font-pixel text-[8px] text-[#8899ff20] -mt-1">?</div>
            </div>
          );
        }
        const color = STATUS_COLOR[status];
        const discovered = status === "discovered";
        const selected = selectedId === zone.id;
        const isNew = justDiscovered === zone.id;
        return (
          <button
            key={zone.id}
            onClick={() => onSelect(zone)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none ${isNew ? "zone-reveal" : ""}`}
            style={{ left: `${zone.x}%`, top: `${zone.y}%`, zIndex: selected ? 30 : 10 }}
            aria-label={`${zone.name} — ${status}`}
          >
            <div
              className={`island-bob relative ${discovered ? "" : status === "locked" ? "zone-locked" : "zone-latent"}`}
              style={
                {
                  "--bob-duration": `${4.5 + (i % 4) * 0.6}s`,
                  "--bob-delay": `${(i % 5) * 0.4}s`,
                } as React.CSSProperties
              }
            >
              {/* glow aura */}
              {discovered && (
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-30 -z-10"
                  style={{ backgroundColor: zone.danger ? "#c084fc" : "#00f0ff" }}
                />
              )}
              <img
                src={ISLAND_ART[zone.art]}
                alt=""
                draggable={false}
                className={`w-20 sm:w-28 md:w-32 lg:w-36 h-auto select-none transition-transform duration-200 group-hover:scale-105 ${selected ? "scale-105" : ""}`}
                style={{
                  imageRendering: "pixelated",
                  filter: discovered && zone.hue ? `hue-rotate(${zone.hue}deg)` : undefined,
                }}
              />
              {/* scanning ring for reachable */}
              {status === "reachable" && (
                <div className="absolute inset-1 rounded-full border border-dashed border-[#00ff0070] animate-pulse pointer-events-none" />
              )}
              {status === "locked" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-pixel text-[10px] text-[#ff5566] glow-amber">⚠</span>
                </div>
              )}
            </div>
            {/* label */}
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <StatusDot color={color} pulse />
              <span
                className={`font-pixel text-[6px] sm:text-[8px] tracking-wide whitespace-nowrap ${
                  discovered ? "text-[#00f0ff]" : status === "locked" ? "text-[#ff5566aa]" : "text-[#00ff00aa]"
                }`}
              >
                {discovered ? zone.name : status === "locked" ? "SEALED" : "UNKNOWN"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
