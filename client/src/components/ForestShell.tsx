/**
 * UNICORN FOREST — Dashboard shell (pervasive top bar + side navigation)
 * Wraps every /forest/* page. CogHood Nocturne styling: void background,
 * starfield, console-frame side rail with grouped nav, mobile drawer.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useGame } from "@/contexts/GameContext";
import { HERO_ART, LOGO_ART } from "@/lib/forestData";
import { KsmBar, Starfield } from "@/components/PixelPrimitives";
import Fireflies from "@/components/Fireflies";
import { Menu, X } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  glyph: string;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "PLAY",
    items: [
      { path: "/forest", label: "Expedition", glyph: "🗺" },
      { path: "/forest/oracle", label: "Ask the Oracle", glyph: "🔮" },
    ],
  },
  {
    title: "INSTRUMENTS",
    items: [
      { path: "/forest/observatory", label: "KSM Observatory", glyph: "🔭" },
      { path: "/forest/constellation", label: "Constellation Graph", glyph: "✨" },
      { path: "/forest/world-tree", label: "World Tree", glyph: "🌳" },
    ],
  },
  {
    title: "MEMORIAL",
    items: [
      { path: "/forest/grove", label: "Kayla's Grove", glyph: "🌸" },
      { path: "/forest/shrine", label: "Music Shrine", glyph: "🎵" },
    ],
  },
  {
    title: "VAULT",
    items: [{ path: "/forest/notes", label: "Field Notes", glyph: "📜" }],
  },
];

const SIDENAV_KEY = "unicorn-forest-sidenav-collapsed";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="font-pixel text-[8px] text-[#ffffff35] mb-2 px-2 tracking-widest">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-2 py-1.5 border font-mono text-xs transition-colors ${
                    active
                      ? "border-[#00f0ff55] bg-[#00f0ff0d] text-[#00f0ff] glow-cyan"
                      : "border-transparent text-[#ffffff80] hover:text-[#00f0ff] hover:bg-[#ffffff08]"
                  }`}
                >
                  <span className="w-4 text-center" aria-hidden>
                    {item.glyph}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {active && <span className="ml-auto text-[#00f0ff]">▸</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function ForestShell({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { wholeness, state, syncStatus } = useGame();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDENAV_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(SIDENAV_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-[#050510] text-white relative">
      <Starfield />
      <Fireflies />

      {/* ======= PERVASIVE TOP BAR ======= */}
      <header className="sticky top-0 z-40 border-b border-[#00f0ff22] bg-[#050510e6] backdrop-blur-sm">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-12">
          {/* Mobile drawer toggle */}
          <button
            className="lg:hidden text-[#00f0ff] p-1"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
          >
            {drawerOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <Link href="/forest" className="flex items-center gap-2 shrink-0">
            <img
              src={LOGO_ART}
              alt=""
              className="w-6 h-6 pixelated"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="font-pixel text-[9px] text-[#00f0ff] glow-cyan hidden sm:inline">
              UNICORN FOREST
            </span>
          </Link>

          <span className="font-mono text-[10px] text-[#ffffff40] hidden md:inline">
            KSM EXPEDITION
          </span>

          {/* Wholeness bar */}
          <div className="flex-1 max-w-[220px] mx-auto hidden sm:block">
            <KsmBar percent={wholeness} label="WHOLENESS" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#ffb347] hidden sm:inline">
              ✦ {state.stardust}
            </span>
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 border ${
                syncStatus === "synced"
                  ? "border-[#00ff0044] text-[#00ff00]"
                  : syncStatus === "saving" || syncStatus === "loading"
                    ? "border-[#ffb34744] text-[#ffb347]"
                    : "border-[#ffffff22] text-[#ffffff50]"
              }`}
              title={
                syncStatus === "local"
                  ? "Progress saved in this browser only — sign in to sync"
                  : "Expedition sync status"
              }
            >
              {syncStatus === "local" ? "LOCAL" : syncStatus.toUpperCase()}
            </span>
            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="font-mono text-[10px] text-[#ffffff60] hover:text-[#ff9ecf] transition-colors"
                title={`Signed in as ${user?.name ?? "cartographer"}`}
              >
                {(user?.name ?? "cartographer").split(" ")[0]} · out
              </button>
            ) : (
              <button
                onClick={() => startLogin()}
                className="font-mono text-[10px] text-[#00f0ff] hover:glow-cyan transition-colors border border-[#00f0ff44] px-2 py-0.5"
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex">
        {/* ======= SIDE NAV (desktop) ======= */}
        <aside
          className={`hidden lg:block shrink-0 border-r border-[#00f0ff18] bg-[#0a0f1a66] transition-all duration-200 ${
            collapsed ? "w-0 overflow-hidden border-r-0" : "w-56"
          }`}
        >
          <div className="sticky top-12 p-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <NavLinks />
            <div className="mt-6 pt-3 border-t border-[#ffffff10]">
              <Link
                href="/"
                className="flex items-center gap-2 px-2 py-1.5 font-mono text-[10px] text-[#ffffff40] hover:text-[#ffb347] transition-colors"
              >
                <span aria-hidden>⟵</span> Landing gate
              </Link>
            </div>
          </div>
        </aside>

        {/* Collapse rail */}
        <button
          className="hidden lg:flex w-4 shrink-0 items-center justify-center text-[#ffffff30] hover:text-[#00f0ff] transition-colors"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          <span className="font-mono text-[10px]">{collapsed ? "▸" : "◂"}</span>
        </button>

        {/* ======= MOBILE DRAWER ======= */}
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-30 pt-12">
            <div
              className="absolute inset-0 bg-[#050510cc]"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="relative w-64 h-full bg-[#0a0f1a] border-r border-[#00f0ff33] p-4 overflow-y-auto">
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
              <div className="mt-6 pt-3 border-t border-[#ffffff10]">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-2 py-1.5 font-mono text-[10px] text-[#ffffff40]"
                >
                  <span aria-hidden>⟵</span> Landing gate
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ======= MAIN FRAME ======= */}
        <main className="flex-1 min-h-[calc(100vh-3rem)] px-3 sm:px-6 py-6">
          {children}
        </main>
      </div>

      {/* Hidden hero art preload so the map page feels instant */}
      <img src={HERO_ART} alt="" className="hidden" aria-hidden />
    </div>
  );
}
