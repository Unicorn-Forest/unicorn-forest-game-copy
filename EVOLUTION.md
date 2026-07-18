# Unicorn Forest — Self-Ontogenetic Evolution Cycle
## Composition: /unicorn-dynamics → /ksm-evolve → /autoresearch-ksm → /isometric-pixel-page

### Step 1-2 — Observe the Wholeness (current state, iteration N)

The game already embodies the KSM cycle as its core mechanic: each zone reveal is one
structure-preserving transformation, `wholeness` = discovered/13 centres, `cycles`
counts iterations. The Chatbase oracle is live. The forest's living centres:

| # | Living Centre | Embodiment | Life (0-100) |
|---|---|---|---|
| 1 | Constellation Cartography | ForestMap + 13 zones + trails | 85 |
| 2 | KSM Cycle Engine | OracleDialog 12-step ticker + useForestGame | 70 |
| 3 | Oracle Voice | Chatbase live chat (AskOracle) + static lore | 60 |
| 4 | Memorial Heart | Music Shrine + Kayla's Grove + fireflies | 80 |
| 5 | Expedition Memory | game_saves + field_notes (DB) | 75 |
| 6 | **Self-Ontogenesis** | *absent — the forest cannot record its own evolution* | **15** |
| 7 | **Research Ledger** | *absent — cycles leave no autoresearch trail* | **10** |
| 8 | **Scale Granularity** | *absent — no world→resident hierarchy breadcrumb* | **25** |

### Step 3 — Choose the Critical (Weakest) Centres

**Weakest:** Research Ledger (10) and Self-Ontogenesis (15). The game *performs* KSM
cycles but does not *remember them as experiments*. In autoresearch terms: it trains
but keeps no `results.tsv`; nothing is kept/discarded; the forest never learns.

### Step 4-6 — Bounded Transformations (one coherent mutation per centre)

**T1 — Evolution Ledger (autoresearch-ksm):** New DB table `evolution_cycles` — the
forest's `results.tsv`. Each zone reveal records one experiment row:
`cycle# | centre(zone) | hypothesis (tagline) | mutation (oracle lore) | metric Δwholeness | verdict KEEP`.
Live oracle lore fetched per reveal (cached in the row — one API call per zone ever),
so each cycle is a *real* experiment: hypothesis → live oracle response → keep.

**T2 — KSM Observatory (unicorn-dynamics):** A 12-step cycle wheel showing the
inner/outer loop (steps 1-3, 10-12 outer solution loop in amber; 4-9 inner iteration
loop in cyan), the b9/p9/j9 triads, and the current step animated during reveals.

**T3 — Living Centres panel (ksm-evolve):** All 13 zones scored for "life"
(discovered=100, reachable=latent 40, locked 20, hidden 5) + the weakest-centre
highlight, echoing Alexander step 3. Global wholeness = mean.

**T4 — Scale Granularity breadcrumb (isometric-pixel-page):**
`✦ world · Unicorn Verse → forest · Unicorn Forest → grove → island → shrine → resident`
rendered in the nav / observatory, following the 6-level hierarchy.

### Step 7-9 — Test the Increase of Life

Vitest coverage for the evolution router (record, list, oracle-lore caching,
fallback), visual verification, all existing 40 tests must stay green.

### Step 10-12 — Integrate & Feedback

Repo synced to github.com/Unicorn-Forest as the canonical implementation +
this document records iteration N+1 in the org's autobiographical memory.
