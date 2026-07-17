/**
 * UNICORN FOREST — CogHood Nocturne primitives
 * Starfield background, ASCII KSM progress bar, oracle typewriter.
 */
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Starfield ---------- */
export function Starfield({ count = 70 }: { count?: number }) {
  const stars = useMemo(() => {
    const colors = ["rgb(255,255,255)", "rgb(0,240,255)", "rgb(255,179,71)"];
    return Array.from({ length: count }, (_, i) => {
      const r = Math.random();
      const color = r < 0.7 ? colors[0] : r < 0.9 ? colors[1] : colors[2];
      return {
        id: i,
        left: `${(Math.random() * 100).toFixed(2)}%`,
        top: `${(Math.random() * 100).toFixed(2)}%`,
        size: (1 + Math.random() * 2).toFixed(2),
        color,
        duration: `${(2 + Math.random() * 4).toFixed(1)}s`,
        delay: `${(Math.random() * 3).toFixed(1)}s`,
      };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full star"
          style={
            {
              left: s.left,
              top: s.top,
              width: `${s.size}px`,
              height: `${s.size}px`,
              backgroundColor: s.color,
              "--duration": s.duration,
              "--delay": s.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ---------- ASCII KSM progress bar (chatbot style) ---------- */
export function KsmBar({
  percent,
  label,
  color = "#00f0ff",
}: {
  percent: number;
  label?: string;
  color?: string;
}) {
  const cells = 10;
  const filled = Math.round((percent / 100) * cells);
  return (
    <div className="font-mono text-[11px] sm:text-xs whitespace-nowrap" style={{ color }}>
      {label && <span className="text-[#ffffff60] mr-2">{label}</span>}
      <span>
        [{"█".repeat(filled)}
        {"░".repeat(cells - filled)}] {percent}%
      </span>
    </div>
  );
}

/* ---------- Typewriter ---------- */
export function Typewriter({
  text,
  speed = 14,
  onDone,
  className = "",
}: {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setShown(0);
    doneRef.current = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text.length);
      return;
    }
    const iv = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          clearInterval(iv);
          return n;
        }
        return n + 1;
      });
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  useEffect(() => {
    if (shown >= text.length && !doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  }, [shown, text.length, onDone]);

  const complete = shown >= text.length;
  return (
    <span className={`${className} ${complete ? "" : "caret"}`}>
      {text.slice(0, shown)}
    </span>
  );
}

/* ---------- Pixel status dot ---------- */
export function StatusDot({ color, pulse = true }: { color: string; pulse?: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${pulse ? "animate-pulse" : ""}`}
      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}
