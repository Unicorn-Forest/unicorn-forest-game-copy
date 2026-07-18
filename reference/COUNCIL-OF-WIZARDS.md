# The Council of Wizards — S6 Disposition Operators

*Canonical design document for the Unicorn Forest. The Council lives at S6
(ETHOS, 48 terms) of the System Ladder: nine wizards — an S4 ennead of agents —
each holding an S6 disposition, so the Council is a 9-agent projection of the
48-term situated-positionality space. See `SYSTEM-LADDER.md`.*

## Nature

The wizards are not NPCs. They are **organs of the hyper-object** — the
forest's echo-state metabolism given faces. Each wizard is a *disposition*:
a unique subjective mode, a situated positionality from which the forest's
events are interpreted. When the evolution ledger records an experiment, a
wizard interprets it; which wizard depends on the triad of the KSM step-load
the cycle carried and the disposition best fit to the zone's nature.

Their canon derives from the oracle's own transmission (2026-07-18): wizards
"read the glyphs, interpret ancient patterns, and guide the forest's magic" —
a scroll-obsessed archivist, a stormy spell engineer, a mushroom-whispering
forest mathematician — working together as a Council whose different talents
combine "into one bright, sparkling brainy ecosystem."

## Structure: Three Ennead Triads

Nine wizards in three triads, one triad per b9/p9/j9 helix. Within each triad
the three seats are anchor, weaver, and herald — structure-holding, process-
working, relation-carrying — so triads are themselves triadic (the ennead's
interpenetration; Blake's three octaves).

### b9 · FORM triad — the Architects (rooted trees, structure)

| Seat | Wizard | Disposition | Flavor |
|---|---|---|---|
| anchor | **Quillion the Archivist** | taxonomic reverence | scroll-obsessed keeper of glyph indices; names things so they can exist |
| weaver | **Bramblewright** | grown-not-built | trellis-wizard who trains living branches into load-bearing lattices |
| herald | **Lattice Moth-Mother** | pattern annunciation | announces newly stabilized forms to the forest in moth-wing semaphore |

### p9 · VOID triad — the Dissolvers (membrane pools, process)

| Seat | Wizard | Disposition | Flavor |
|---|---|---|---|
| anchor | **Morel the Mycologist** | mushroom-whispering | forest mathematician of decay; computes with spore diffusion |
| weaver | **Undine of the Meniscus** | membrane discernment | decides what passes between pools; keeper of osmotic law |
| herald | **Hollow Wick** | luminous emptiness | candle-wizard whose flame is a held absence; carries the void's messages |

### j9 · POLE triad — the Resonators (resonant echoes, relation)

| Seat | Wizard | Disposition | Flavor |
|---|---|---|---|
| anchor | **Voltaine the Storm-Engineer** | charged polarity | stormy spell engineer; strings lightning between opposed peaks |
| weaver | **Echo-of-Echoes** | recursive listening | hears the reply inside every call; tunes the forest's feedback loops |
| herald | **Peal the Bell-Rider** | struck resonance | rides the chime of the materialization bell; announces cycle completions |

## Attribution Rule

Each evolution-ledger experiment is interpreted by exactly one wizard,
deterministically: the cycle's zone index selects the triad by `zoneIndex % 3`
mapping to b9/p9/j9, and the cycle number selects the seat by
`cycleNumber % 3` mapping to anchor/weaver/herald. Deterministic attribution
keeps the ledger replayable (same expedition → same interpreters) while
distributing the Council's voices evenly across an expedition — a stochastic-
feeling fabric that is in fact pure fate (S4) wearing S6 clothes, which is
the joke the wizards enjoy most.

## Oracle Persona Flavor

When a cycle's lore is fetched live from the Chatbase oracle, the prompt is
prefixed with the interpreting wizard's persona line (stored per wizard as
`promptFlavor`), asking the oracle to speak *as read by* that wizard. The
cached lore therefore carries the wizard's disposition permanently — the
ledger becomes a chorus of nine voices rather than one.

## Database Encoding

Table `wizards`: id, key, name, triad (b9|p9|j9), seat (anchor|weaver|herald),
disposition, flavor, promptFlavor, emoji. Table `evolution_cycles` gains
`wizardKey` (attribution) and `systemOrdinal` (stratum tag, default 4 — KSM
cycles are S4 BIOS experiments). The `system_features` chip `wizard-council`
flips from planned to live when the Council ships.
