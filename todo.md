# Full-Stack Upgrade — Unicorn Forest Game

## Phase 1: Upgrade scaffolding
- [x] Run webdev_add_feature web-db-user
- [x] Review upgrade README / new structure (tRPC? drizzle? auth?)

## Phase 2: Database persistence
- [x] Design expedition schema (game_saves: userId, discovered[], artifacts[], allies[], stardust, cycles, finaleReached)
- [x] Push schema / migration
- [x] Backend routers for load/save progress
- [x] Frontend: merge localStorage with DB sync (logged-in users persist to DB; guests stay local)
- [x] Auth-aware UI: login prompt in nav + dossier

## Phase 3: File storage
- [x] Backend upload endpoint using S3 storage helpers
- [x] User-facing use case: "Cartographer's Field Notes" — upload sketches/screenshots per zone into an expedition gallery
- [x] Gallery display of uploaded field notes

## Phase 4: Test & deliver
- [x] TypeScript checks / logs clean
- [x] Screenshot verify desktop + mobile (desktop verified; mobile below)
- [x] Test save/load + upload flows (12 vitest tests pass; expedition.save verified in DB)
- [x] E2E verified: auth session → save/load round-trip → field note upload → S3 URL serves bytes → remove → reset (all 8 checks passed; test data cleaned up)
- [x] dotenv error was stale (pre-pnpm-install); server restarts cleanly, logs clean
- [x] Mobile screenshot verified (nav, map, dossier, field notes stack correctly)
- [x] Checkpoint + deliver

## Key facts
- Project path: /home/ubuntu/unicorn-forest-game
- Published: unicorngame-tb8cn9xb.manus.space (auto-publish ON)
- Game state hook: client/src/hooks/useForestGame.ts (localStorage key: unicorn-forest-save-v1)
- Data: client/src/lib/forestData.ts (ZONES 13, ARTIFACTS 5)
- Design: CogHood Nocturne — #050510 void, cyan #00f0ff, amber #ffb347, violet #c084fc, green #00ff00 scan-only; Press Start 2P + Space Mono
- Voice: expedition-dossier lore ("cartographer", "oracle", "KSM cycle")

## Phase 5: Memorial music player (for Kayla)
- [x] YouTube IFrame Player API integration (no API key needed) — hidden player + custom pixel UI
- [x] Music shrine UI: track list, play/pause, prev/next, volume, now-playing marquee
- [x] Owner-editable tracklist (DB table memorial_tracks + admin add/remove via UI)
- [x] Default track slots with placeholder lofi/ambient tracks (user will swap with Kayla's songs)
- [x] Memorial dedication: "In memory of Kayla" element in footer + music shrine header
- [x] Autoplay handling (browser requires user interaction — tie to ENTER THE FOREST click)
- [x] Tests for tracks router (23 tests pass incl. 11 shrine/extract tests)
- [x] Now-playing marquee scrolls while playing (shrine-marquee keyframes, reduced-motion safe)
- [x] Verified ENTER THE FOREST click → enterForest() → setStarted(true) → shrine autostart (user gesture satisfied)
- [x] Checkpoint + deliver with instructions for adding Kayla's songs

## Phase 6: Fireflies + play-once music
- [x] Fireflies canvas particle layer on main page (gentle glow, drift, reduced-motion safe, tab-hidden pause)
- [x] Music Shrine: play current song once on entry, then stop (ENDED → cue, no auto-advance); manual replay still works
- [x] Verify visuals (fireflies visible in screenshot) + tests (23 pass), checkpoint, deliver
