/**
 * UNICORN FOREST — Fireflies
 * A gentle, magical particle layer for the memorial atmosphere.
 * Soft glowing motes drift and pulse over the page like fireflies at dusk.
 *
 * Canvas-based (GPU-friendly, no layout thrash), fixed full-viewport,
 * pointer-events none. Respects prefers-reduced-motion (renders static
 * faint glows without drift). Density scales with viewport area, capped.
 */
import { useEffect, useRef } from "react";
import { getMusicState } from "@/lib/ambient";

interface Mote {
  x: number;
  y: number;
  /** base radius in px */
  r: number;
  /** drift velocity */
  vx: number;
  vy: number;
  /** pulse phase + speed for the glow breathing */
  phase: number;
  pulse: number;
  /** wander angle for organic curving flight */
  angle: number;
  turn: number;
  /** color: pink (memorial) / cyan / violet */
  hue: string;
}

const HUES = [
  "255, 158, 207", // memorial pink — matches shrine accent #ff9ecf
  "0, 240, 255", // cyan
  "192, 132, 252", // violet
  "255, 179, 71", // warm amber (rare)
];

function spawnMote(w: number, h: number): Mote {
  const speed = 0.08 + Math.random() * 0.18;
  const angle = Math.random() * Math.PI * 2;
  // hue weighting: pink most common, amber rare
  const roll = Math.random();
  const hue = roll < 0.4 ? HUES[0] : roll < 0.65 ? HUES[1] : roll < 0.92 ? HUES[2] : HUES[3];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.8 + Math.random() * 1.8,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    phase: Math.random() * Math.PI * 2,
    pulse: 0.004 + Math.random() * 0.01,
    angle,
    turn: (Math.random() - 0.5) * 0.002,
    hue,
  };
}

export default function Fireflies() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let motes: Mote[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // density: ~1 mote per 28k px², capped for perf
      const target = Math.min(48, Math.round((w * h) / 28000));
      if (motes.length > target) motes = motes.slice(0, target);
      while (motes.length < target) motes.push(spawnMote(w, h));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // music-reactive beat: when the song plays, all motes share a gentle
      // tempo-synced swell layered over their individual breathing.
      const music = getMusicState();
      let beat = 0;
      if (music.playing) {
        const beatPeriod = 60000 / music.bpm;
        const t = ((Date.now() - music.startedAt) % beatPeriod) / beatPeriod;
        // soft heartbeat curve — quick bloom, slow release
        beat = Math.pow(Math.max(0, Math.cos(t * Math.PI * 2)), 3) * 0.5;
      }
      for (const m of motes) {
        m.phase += m.pulse * 16 * (music.playing ? 1.6 : 1);
        // breathing glow 0.25..1, lifted by the beat while the song plays
        const glow = Math.min(1, 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(m.phase)) + beat);

        if (!reduced) {
          // organic wander: slowly turning drift
          m.angle += m.turn * 16;
          const speed = Math.hypot(m.vx, m.vy);
          m.vx = Math.cos(m.angle) * speed;
          m.vy = Math.sin(m.angle) * speed;
          m.x += m.vx * 16;
          m.y += m.vy * 16 - 0.02; // faint upward lift, like embers
          // wrap softly at edges
          if (m.x < -20) m.x = w + 20;
          if (m.x > w + 20) m.x = -20;
          if (m.y < -20) m.y = h + 20;
          if (m.y > h + 20) m.y = -20;
        }

        // outer halo
        const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 7);
        halo.addColorStop(0, `rgba(${m.hue}, ${0.35 * glow})`);
        halo.addColorStop(1, `rgba(${m.hue}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 7, 0, Math.PI * 2);
        ctx.fill();
        // bright core
        ctx.fillStyle = `rgba(${m.hue}, ${0.9 * glow})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      draw(); // single static frame of faint glows
    } else {
      raf = requestAnimationFrame(draw);
    }

    // pause when tab hidden to save battery
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[5] pointer-events-none"
      aria-hidden
    />
  );
}
