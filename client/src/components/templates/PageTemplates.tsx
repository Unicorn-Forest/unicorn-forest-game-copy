/**
 * UNICORN FOREST — Page-type templates for dashboard frames
 * Three canonical frame types per reference/SITEMAP.md:
 *  - PanelPage: console-framed content w/ corner brackets + title rail (default)
 *  - FullBleedPage: edge-to-edge for immersive pages (map, world tree, graph)
 *  - DocPage: narrow reading column for lore/notes/memorial text
 */
import type { ReactNode } from "react";

/** Corner brackets shared by console frames */
export function CornerBrackets({ color = "#00f0ff" }: { color?: string }) {
  const c = { borderColor: `${color}66` };
  return (
    <>
      <span
        className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 pointer-events-none"
        style={c}
      />
      <span
        className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 pointer-events-none"
        style={c}
      />
      <span
        className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 pointer-events-none"
        style={c}
      />
      <span
        className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 pointer-events-none"
        style={c}
      />
    </>
  );
}

interface PanelPageProps {
  title: string;
  subtitle?: string;
  /** accent hue for the rail + brackets (default cyan) */
  accent?: "cyan" | "amber" | "violet" | "pink" | "green";
  actions?: ReactNode;
  children: ReactNode;
  /** max content width utility class (default max-w-5xl) */
  maxWidth?: string;
}

const ACCENTS: Record<
  NonNullable<PanelPageProps["accent"]>,
  { hex: string; glow: string }
> = {
  cyan: { hex: "#00f0ff", glow: "glow-cyan" },
  amber: { hex: "#ffb347", glow: "glow-amber" },
  violet: { hex: "#c084fc", glow: "glow-violet" },
  pink: { hex: "#ff9ecf", glow: "" },
  green: { hex: "#00ff00", glow: "" },
};

/** Standard instrument frame: title rail + console border + brackets */
export function PanelPage({
  title,
  subtitle,
  accent = "cyan",
  actions,
  children,
  maxWidth = "max-w-5xl",
}: PanelPageProps) {
  const a = ACCENTS[accent];
  return (
    <div className={`${maxWidth} mx-auto`}>
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1
            className={`font-pixel text-sm sm:text-base ${a.glow}`}
            style={{ color: a.hex }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="font-mono text-[11px] text-[#ffffff50] mt-1.5">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div
        className="relative border bg-[#0a0f1a80] p-4 sm:p-6"
        style={{ borderColor: `${a.hex}30` }}
      >
        <CornerBrackets color={a.hex} />
        {children}
      </div>
    </div>
  );
}

/** Edge-to-edge immersive frame with optional floating title */
export function FullBleedPage({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="-mx-3 sm:-mx-6 -my-6">
      {title && (
        <div className="sticky top-12 z-20 px-4 py-2 bg-[#050510cc] backdrop-blur-sm border-b border-[#ffffff10]">
          <h1 className="font-pixel text-[10px] text-[#00f0ff] glow-cyan">
            {title}
          </h1>
        </div>
      )}
      {children}
    </div>
  );
}

/** Narrow reading column for lore, notes, and memorial text */
export function DocPage({
  title,
  subtitle,
  accent = "pink",
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: PanelPageProps["accent"];
  children: ReactNode;
}) {
  const a = ACCENTS[accent ?? "pink"];
  return (
    <div className="max-w-2xl mx-auto">
      <header className="text-center mb-6">
        <h1
          className={`font-pixel text-sm ${a.glow}`}
          style={{ color: a.hex }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="font-mono text-[11px] text-[#ffffff50] mt-2">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
