# SITEMAP — Unicorn Forest App Shell (Phase 16)

> The forest grows rooms. The landing is the threshold; the dashboard is the canopy;
> every instrument is a chamber grown from the same living tree.

## Route map

| Route | Page | Access | Template | Contents |
|---|---|---|---|---|
| `/` | Landing | public | (bespoke) | Brand lockup, hero diorama (Villages ↔ Observatory), ORACLE_INTRO typewriter, **ENTER THE FOREST** → `/forest`, memorial footer line |
| `/forest` | Expedition (dashboard home) | public, save-sync when signed in | FullBleed-ish play frame | Constellation map (13 illustrated islands) + HUD column: Oracle Channel/Dialog, Expedition Dossier, Music Shrine mini, Field Notes vault card |
| `/forest/oracle` | Ask the Oracle | public | PanelPage | Live Chatbase channel, SKELETON quick-options, **Deep Divination toggle** |
| `/forest/observatory` | KSM Observatory | public | PanelPage | 5 tabs: cycle wheel, living centres, evolution ledger, system ladder, wizard council |
| `/forest/constellation` | AtomSpace Constellation | public | FullBleedPage | Interactive menu-topology graph: nodes sized by in-degree, edges weighted by stv strength, pan/zoom, node inspector |
| `/forest/world-tree` | World Tree | public | FullBleedPage | Exploded S9→S1 strata diagram (redirect kept from legacy `/world-tree`) |
| `/forest/grove` | Kayla's Grove | public | DocPage | Memorial section + guestbook tributes |
| `/forest/shrine` | Music Shrine | public | PanelPage | Full player + tracklist (admin manage) |
| `/forest/notes` | Field Notes | signed-in | PanelPage | Cartographer's vault: sketches, screenshots, scroll fragments |
| `/404` | Not Found | public | — | Lost-in-the-thicket page |

Legacy redirects: `/world-tree` → `/forest/world-tree`.

## Navigation model

**Top bar (pervasive, fixed):** logo + UNICORN FOREST wordmark (→ `/forest`), KSM
wholeness bar, sync badge, auth control. On `/` (landing) the top bar is minimal:
logo + sign-in only — the threshold stays quiet.

**Side nav (dashboard only, collapsible; mobile = drawer):**

```
◆ PLAY
   ▸ Expedition        /forest
   ▸ Ask the Oracle    /forest/oracle
◆ INSTRUMENTS
   ▸ KSM Observatory   /forest/observatory
   ▸ Constellation     /forest/constellation
   ▸ World Tree        /forest/world-tree
◆ MEMORIAL
   ▸ Kayla's Grove     /forest/grove
   ▸ Music Shrine      /forest/shrine
◆ VAULT
   ▸ Field Notes       /forest/notes   (sign-in gated)
```

Grouping mirrors the System Ladder: PLAY = S4 BIOS (agent in arena), INSTRUMENTS =
S5–S7 (subjectivity, dispositions, lenses), MEMORIAL = S8 CIVITAS (community), VAULT =
personal record. The scale breadcrumb (world→…→resident) stays in the Observatory.

## Page templates (`client/src/components/templates/`)

- **PanelPage** — framed console panel: pixel title bar (`§ TITLE` + corner brackets),
  max-width container, scanline backdrop. For oracle/observatory/shrine/notes.
- **FullBleedPage** — edge-to-edge canvas with floating title chip and back affordance.
  For constellation graph and world tree.
- **DocPage** — centered prose column with pixel headings and generous leading.
  For grove/memorial and future lore docs.

All templates render inside **ForestShell** (top bar + side nav + starfield +
fireflies), which owns a **GameProvider** context lifting `useForestGame` so the map,
observatory, oracle, and dossier share one expedition state.

## State & data flow

- `GameProvider` (context) at ForestShell level: discovered/stardust/cycles/artifacts,
  wholeness, expeditionId, syncStatus. Landing does not mount game state.
- Music Shrine autoplay-once behaviour stays tied to the landing→forest entry
  (plays once when the forest is first entered per session).
- AtomSpace topology from `shared/menuTopology.ts`; live traversal counts overlay
  from `menu_traversals` table (Phase 16.4) distinguish archive edges vs live-grown edges.

## Frame philosophy

Each page is a "frame" the dashboard loads — consistent chrome, swappable content,
so future chambers (e.g. an S6 wizard workshop, an S8 civic plaza) are one route +
one template instantiation away.
