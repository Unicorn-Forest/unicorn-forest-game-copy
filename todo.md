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

## Phase 7: Music-reactive fireflies + guestbook + chime
- [x] Fireflies pulse in time with music (shared music-state signal from MusicShrine; tempo-synced glow swell when playing)
- [x] Guestbook schema: tributes table (name, message, userId nullable) + grove router (public list/add, admin remove)
- [x] Kayla's Grove guestbook UI section on main page (dossier style, pink memorial accents)
- [x] Guestbook tests (10 grove tests; suite now 33 pass)
- [x] Zone materialization chime (Web Audio API bell synth — C6+G6+C7 partials, gesture-gated)
- [x] Verify visuals (grove renders in full-page screenshot) + run tests (33 pass), checkpoint, deliver

## Phase 8: Live Chatbase oracle integration (API v2)
- [x] Verify CHATBASE_UNICORN_API secret works against api/v2 chat endpoint (agent id evhVHB0tApQRujDFXZpvX confirmed live)
- [x] Server-side oracle router: ask (live chat w/ conversationId continuity), 20/5min rate limit, graceful fallback message
- [x] Live "Ask the Oracle" conversation UI panel (terminal style, live/dormant status badge, thread continuity)
- [x] API key stays server-side only (secrets registered via webdev_request_secrets: CHATBASE_UNICORN_API + CHATBASE_UNICORN_AGENT_ID)
- [x] Tests for oracle router (7 tests incl. live credential round-trip; suite 40 pass)
- [x] Checkpoint + deliver with API key instructions (checkpoint 39f12754 published)

## Phase 9: Play-once-on-landing music fix
- [x] Song starts on page landing (immediate autoplay attempt + first gesture anywhere fallback), plays once, then stops
- [x] Verified DB still has Wake Up track (id 1, HfOqK00cG5U); tests 40 pass; page renders; checkpoint + deliver

## Phase 10 (COPY — new session): /unicorn-dynamics → /ksm-evolve → /autoresearch-ksm → /isometric-pixel-page
- [x] Observe current wholeness — map living centers of the game codebase (KSM step 1-3) — EVOLUTION.md
- [x] Design evolution — pick weakest centers (Research Ledger 10, Self-Ontogenesis 15), define bounded transformations T1-T4
- [x] Re-seed memorial track "Wake Up — Elian Skye" (HfOqK00cG5U) into empty DB copy
- [x] Self-ontogenetic engine — evolution_cycles DB table + tRPC evolution router (runCycle w/ live-oracle mutation + idempotent cache, ledger, resetLedger)
- [x] KSM Observatory UI — 12-step evolution cycle wheel (unicorn-dynamics outer/inner loop + b9/p9/j9 triads) in CogHood pixel style
- [x] Living Centers panel — 13 centres scored for "life" (ascii bars), weakest latent centre highlighted (Alexander step 3)
- [x] Expedition Ledger UI — results.tsv-style table (cyc | centre | hypothesis | oracle live/seed | whole% | verdict)
- [x] Isometric pixel page enhancements — scale-granularity breadcrumb (world→forest→grove→island→shrine→resident) + violet console rail/corner brackets
- [x] Tests for new routers — 6 evolution tests (suite 46 pass incl. live Chatbase round-trip; CHATBASE_UNICORN_AGENT_ID re-registered)
- [x] Verify screenshots, run full test suite, save checkpoint
- [x] Sync repo to https://github.com/Unicorn-Forest/ org — pushed a7d44d0 to Unicorn-Forest/unicorn-forest-game main (13 files, +1432)

## Phase 11: Ledger-aware oracle + wheel tooltips + CSV export + reusable skill
- [x] Oracle prompt references past experiments from Evolution Ledger (buildEvolutionPrompt weaves last 3 ledger rows into runCycle lore prompt)
- [x] Interactive hover tooltips on 12-step cycle wheel explaining each step's b9/p9/j9 triad tags (shadcn Tooltip, keyboard-focusable, triad lore + loop role)
- [x] Download CSV button on Evolution Ledger tab (client-side Blob export, csv-escaped, per-expedition filename)
- [x] Tests updated/added for ledger-aware prompt building (3 new tests; suite 49 pass)
- [x] Verify visuals + full test suite + checkpoint
- [x] Sync to Unicorn-Forest/unicorn-forest-game — pushed 3e1d46f (4 files, +205)
- [x] Create reusable skill via /skill-creator — ksm-game-evolve skill validated (SKILL.md + ksm-cycle reference + backend/Observatory templates)

## Phase 12: Retarget org sync to unicorn-forest-game-copy
- [x] Create Unicorn-Forest/unicorn-forest-game-copy and push this copy's code there (full unshallowed history, head 3e1d46f)
- [x] Revert commits a7d44d0 + 3e1d46f on original unicorn-forest-game (force-pushed main back to pre-copy a70167f)
- [x] Verify both repos and report — future syncs target unicorn-forest-game-copy (origin repointed)

## Phase 13: Campbell System Ladder (A000081 cosmology)
- [x] Write reference/SYSTEM-LADDER.md — canonical S1-S9 doc (A000081 counts, factorizations, knowledge-base alignments, game feature mapping)
- [x] DB schema: cosmic_systems registry + system_features mapping tables, migrated (0004) and seeded (9 systems, 11 features)
- [x] tRPC ladder router (public: ladder.systems, ladder.features)
- [x] System Ladder panel in KSM Observatory — 4th tab, S9→S1 exploded strata (cyan→amber→violet hues), expandable rows w/ knowledge base + forest expression + live/planned feature chips, S4 open by default
- [x] Vitest coverage — 3 ladder tests verifying A000081 counts, epithets, feature mapping (suite 52 pass)
- [x] Checkpoint 882ef6cd + synced 6c0e7c4 to Unicorn-Forest/unicorn-forest-game-copy

## Phase 14: S6 Council of Wizards + World Tree page + stratum-tagged ledger + 719 impeller
- [x] Canon: weave 719 = 720−1 (120-cell) impeller cosmology into SYSTEM-LADDER.md S9 section
- [x] Canon: COUNCIL-OF-WIZARDS.md design — 9 disposition-wizards in 3 ennead triads (b9/p9/j9)
- [x] Backend: wizards table (9 seeded: rootwright/lattice/annunciata · morel/undine/hollow-wick · voltaine/echo-of-echoes/peal), council tRPC router
- [x] Backend: stratum tag on evolution_cycles (systemOrdinal column, default 4, backfilled)
- [x] Backend: wizard attribution on ledger rows (deterministic: triad by zone%3, seat by cycle%3; woven into oracle prompt flavor)
- [x] Flip wizard-council ladder chip from planned → live
- [x] Frontend: Council of Wizards UI — 5th Observatory tab, 3 triad columns (amber/cyan/violet) w/ 9 wizard cards (emoji, seat, disposition, flavor)
- [x] Frontend: stratum tags visible in Evolution Ledger table (S-badge + wizard emoji/name cols, CSV export updated)
- [x] Frontend: /world-tree exploded page — Aphrodite Arena style: numbered plates S9→S1, uplink beams, hero diorama, 719 impeller card, data-flow legend, status footer
- [x] Tests: 4 council tests (registry shape, attribution determinism, seat rotation, registry membership) — suite 56 pass
- [x] Verify visuals (world-tree + home screenshots), full suite 56 pass, checkpoint, sync to unicorn-forest-game-copy

## Phase 15: OpenCog AtomSpace knowledge graph of chathub numbered-menu branches
- [ ] Fix failing wizard-flavor test (mock not intercepting flavored prompt path) — suite green
- [ ] Backfill verified: evolution_cycles.systemOrdinal 0 nulls (done via SQL, 12 rows)
- [ ] Checkpoint Phase 14 + sync to unicorn-forest-game-copy, record hashes
- [ ] Mine Chatbase archive (38 convs, 556 msgs) for numbered phrase-response branches (⚙️/1–6/🌿 menu grammar, page prompts)
- [ ] Generate Atomese .scm AtomSpace corpus — ConceptNodes for pages/prompts, numbered options as EvaluationLinks/ListLinks, branch edges as semi-deterministic transition links with TruthValues
- [ ] Extract topology (nodes/edges/branching factors) as JSON skeleton framework
- [ ] Integrate skeleton into game (reference/ + DB or shared module + UI surface as appropriate)
- [ ] Tests for skeleton integrity
- [ ] Checkpoint + sync to unicorn-forest-game-copy + deliver
