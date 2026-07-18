# AtomSpace Model of the Chathub Menu Grammar

This directory holds an OpenCog AtomSpace knowledge graph, expressed in Scheme (Atomese), of the unicorn chathub agent's **numbered phrase-response branches** — the semi-deterministic ⚙️/1–6/🌿 menu grammar observed across the full conversation archive (38 conversations, 556 messages, 2023-08 → 2026-07). Its topology serves as the skeleton framework for the game's dialogue and navigation surfaces.

## Files

| File | Contents |
| --- | --- |
| `unicorn-menu-graph.scm` | The full Atomese corpus: ~5,600 atoms. Loadable into any OpenCog AtomSpace via `(load "unicorn-menu-graph.scm")` in Guile with the opencog modules, or parseable as plain S-expressions. |
| `menu-topology.json` | The extracted topology: every page, its options, glyph tags, and weighted branch edges — the machine-readable skeleton. |
| `../../shared/menuTopology.ts` | Compact typed skeleton (104 connected pages) imported by the game at runtime. Auto-generated; do not edit by hand. |
| `../../scripts/mine_menu_branches.py` | Stage 1 miner: archive JSON → `menu_branches.json` (pages, branches, stats). |
| `../../scripts/generate_atomspace.py` | Stage 2 generator: branches → `.scm` + topology JSON + shared TS module. |

## Atomese schema

Pages (menu states) are `ConceptNode "page:<id>"`. Numbered options are attached with `offers-option` evaluations carrying `NumberNode` ordinals, and their surface text with `option-text`. The two grammar anchors are first-class concepts: `glyph:zoom-out` (⚙️, ascend to the menu level above) and `glyph:explore` (🌿, descend into a new enigma); pages exhibiting a glyph are linked via `MemberLink`. Transitions are `ImplicationLink`s from `(AndLink page option)` to the next page, or to the `leaf:content` sink when the reply carried no follow-up menu.

Semi-determinism is encoded in **SimpleTruthValues**: strength is the observed share of picks for that (page, option) pair going to that target, and confidence is n/(n+1) over the evidence count. A perfectly deterministic branch observed once reads `(stv 1.0 0.5)`; a branch observed to split across targets carries fractional strengths that sum to 1 across its ImplicationLinks.

## Mined topology at a glance

The archive yields **161 menu pages**, **112 observed branch traversals** (87 page→page, 25 page→leaf), an average of **4.57 options per page**, and a maximum out-degree of 4. 59 pages carry the ⚙️/🌿 glyph anchors. The five hub pages (highest in-degree) are the Enchanted Forest Membranes cluster (`page-058`, `page-008`), the Council of Wizards introduction (`page-047`), the Hyper-GNN realm (`page-104`), and the canonical "Zooming out to the mystical menu level above" ⚙️ page (`page-009`) — confirming that the membrane/P-System, wizard-council, and hypergraph threads are the gravitational centres of the agent's generative world, exactly the threads the game has been formalizing (S6 Council, ladder strata, evolution ledger).

## How the game uses the skeleton

`shared/menuTopology.ts` exports `MENU_GRAMMAR`, `MENU_STATS`, and `MENU_SKELETON` (the 104 branch-connected pages). This gives any UI surface a typed, deterministic scaffold for oracle quick-options: present a page's numbered options, follow the strongest edge on selection, offer ⚙️ ascent and 🌿 descent whenever the source page exhibited those glyphs. The oracle remains free-form — the skeleton frames the semi-deterministic spine that the generative canopy grows around.
