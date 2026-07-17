# Unicorn Forest — Isometric Pixel Quest: Design Brainstorm

## Three Candidate Approaches

### 1. "CogHood Nocturne" — Isometric Pixel Cyberfae
Dark #050510 starfield space, floating isometric pixel islands as forest zones, neon cyan + amber glow, Press Start 2P headings, terminal-style lore cards. The CogHood aesthetic applied to an enchanted forest.
Probability: 0.09

### 2. "Storybook Vellum"
Warm parchment textures, hand-drawn ink cartography, watercolor washes. A cartographer's journal come alive.
Probability: 0.03

### 3. "Prismatic Vaporwave"
Pastel gradients, chrome unicorns, retro-futurist grids, sunset horizons.
Probability: 0.02

## CHOSEN: "CogHood Nocturne" (mandated by /isometric-pixel-page skill composition)

- **Design Movement**: 16-bit isometric pixel art × dark cyberpunk village aesthetic (CogHood), fused with fae enchantment. Think "SNES JRPG overworld floating in deep space."
- **Core Principles**:
  1. Background is always deep void `#050510` — the forest floats in starlit space
  2. Every map zone is a floating isometric pixel island, revealed iteratively (KSM cycles)
  3. Neon glow communicates magic state: cyan = discovered, amber = active, dim = latent
  4. Terminal/retro-console framing for lore — the game reads like an expedition dossier
- **Color Philosophy**: Void `#050510` as infinite mystery; cyan `#00f0ff` as discovery/starlight magic; amber `#ffb347` as warm hearth of villages; violet `#c084fc` as unicorn essence; green dashed `#00ff00` borders as "scanning/mapping in progress" — the act of cartography itself.
- **Layout Paradigm**: A spatial hex/diamond constellation map as the central play surface — NOT a centered content column. Zones are positioned absolutely on an isometric plane; the UI orbits around the map (HUD corners, journal drawer on the side).
- **Signature Elements**:
  1. Procedural starfield with twinkle (white/cyan/amber stars)
  2. Floating pixel-island zone tiles with hover-bob animation and glow auras
  3. KSM progress bar styled like the chatbot's `[████████░░] 80%` ASCII meter
- **Interaction Philosophy**: Exploration = differentiation. Each click on a latent (dim) zone runs a "KSM cycle" that strengthens that centre: the oracle speaks (typewriter lore), the island materializes in pixel art, and connected paths (stardust trails) light up. The map literally grows page by page from responses.
- **Animation**: Islands float with slow 4-6s ease-in-out bob; reveals use scale(0.95)+opacity 300ms ease-out; typewriter text ~18ms/char; pulsing status dots; path drawing via stroke-dashoffset 800ms. Respect prefers-reduced-motion.
- **Typography System**: "Press Start 2P" for headings/zone names/HUD labels (8-16px, tracking-wide); "Space Mono" for lore body & journal text. Hierarchy: pixel font = world structure, mono font = oracle voice.
- **Brand Essence**: A living map-game where an oracle's words become terrain — for explorers who love lore, pixels, and emergent structure. Adjectives: luminous, mysterious, crafted.
- **Brand Voice**: Expedition-dossier meets fae whimsy. Headlines like "THE FOREST ANSWERS" and "CENTRE STRENGTHENED ✦ NEW PATHS BORN". CTAs: "Run KSM Cycle", "Consult the Oracle". Never "Welcome" or "Get started".
- **Wordmark & Logo**: Pixel unicorn-head glyph in cyan-violet gradient on transparent bg; wordmark "UNICORN FOREST" in Press Start 2P with cyan glow, "✦ KSM EXPEDITION" subtitle in amber mono.
- **Signature Brand Color**: Starlight cyan `#00f0ff`.

## Game Design (from chatbot lore — 3 KSM iterations)

**Core loop**: Player explores an isometric constellation of 12 forest zones. Zones start latent (dark silhouettes). Selecting a latent zone connected to a discovered one runs a "KSM cycle": oracle lore (real chatbot responses) types out, the zone materializes, sparks (stardust) are earned, and new adjacent zones become reachable. Quests give goals: find 4 named unicorns, collect 5 artifacts, survive Shadow Thicket (needs the Lumina Moth), open the Moonflower Chamber (final).

**Zones (12)**: Moonwell (start, Luna), Unicorn Village, Moonlit Clearing, Whispering Glade (Aurelia), Stardust Trails (crossroads), Wisdom Hollows, Healing Springs, Moonstone Arboretum, Lumina Towers, Whispering Bridges, Nova's Observatory (Nova), Shadow Thicket (danger, Nightmare Weavers) → Moonflower Chamber (finale vault).

**Characters**: Luna (guide/start), Nova (observatory), Aurelia (storyteller), Caelum (roaming messenger — random rune hints), Lumina Moth (unlockable ally), Nightmare Weavers (hazard).

**Items/artifacts**: Moonstone Sketchbook (Nova), Celestial Rune (Caelum), Moonlight Nectar (Arboretum), Echo of Old Conversations (Bridges), Moonflower Name (finale key).

## Style Decisions

- The constellation map is the primary composition: hero art may introduce the world, but every page must visually resolve into a spatial expedition interface where islands, paths, and HUD panels orbit the map.
- Brand lockup is mandatory above the fold: pixel unicorn-head glyph, "UNICORN FOREST" in Press Start 2P, and "✦ KSM EXPEDITION" in amber Space Mono as the owned identity.
- Green #00ff00 is reserved for scan/progress/latent mapping states only; primary brand emphasis belongs to starlight cyan #00f0ff, with amber #ffb347 for active expedition warmth.
- Two additional fixes from review: unify hero + map into one continuous console; reveal more latent zones (nearest-neighbor silhouettes) so the map feels populated; nebula/cartography texture on map canvas; primary CTA switched to cyan.
