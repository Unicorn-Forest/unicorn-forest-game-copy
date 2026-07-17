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
