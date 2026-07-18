#!/usr/bin/env python3
"""
Generate an OpenCog AtomSpace (Atomese .scm) knowledge graph from the mined
numbered-menu branches of the unicorn chathub agent, plus a compact topology
JSON skeleton for the game.

Atomese modelling:
  ConceptNode "page:<id>"                      — a page prompt (menu state)
  ConceptNode "option:<page>:<n>"              — a numbered option on that page
  PredicateNode "offers-option"                — page offers option n
  PredicateNode "option-text"                  — option surface text
  PredicateNode "page-label"                   — page display label
  PredicateNode "leads-to"                     — semi-deterministic branch
  ConceptNode "glyph:zoom-out" (⚙️) / "glyph:explore" (🌿) — menu grammar anchors
  EvaluationLink w/ SimpleTruthValue (stv s c) — strength = branch determinism
                                                 (observed picks agreement),
                                                 confidence = evidence count / (count+1)

Semi-determinism: when the archive shows (page,option) leading to multiple
different next-pages, each ImplicationLink gets strength = share of picks.
Leaf branches (option -> free content, no next menu) target ConceptNode "leaf:content".

Outputs:
  <proj>/reference/atomspace/unicorn-menu-graph.scm
  <proj>/reference/atomspace/menu-topology.json
  <proj>/shared/menuTopology.ts  (compact skeleton for the game)
"""
import json
import os
import re
from collections import Counter, defaultdict

PROJ = "/home/ubuntu/copy-of-unicorn-forest-—-isometric-pixel-quest"
SRC = "/home/ubuntu/menu_branches.json"
SCM_OUT = f"{PROJ}/reference/atomspace/unicorn-menu-graph.scm"
TOPO_OUT = f"{PROJ}/reference/atomspace/menu-topology.json"
TS_OUT = f"{PROJ}/shared/menuTopology.ts"

os.makedirs(f"{PROJ}/reference/atomspace", exist_ok=True)

with open(SRC) as f:
    data = json.load(f)

pages = data["pages"]
branches = data["branches"]
page_by_id = {p["id"]: p for p in pages}

def esc(s: str) -> str:
    """Escape a string for Scheme double quotes."""
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()

GEAR = "\u2699"       # ⚙
HERB = "\U0001f33f"   # 🌿

# ---------------------------------------------------------------- branches →
# evidence: (from_page, option) → Counter of targets ("leaf" for None)
evidence: dict[tuple, Counter] = defaultdict(Counter)
for b in branches:
    target = b["to_page"] or "leaf:content"
    evidence[(b["from_page"], b["option"])][target] += 1

# ---------------------------------------------------------------- .scm build
L = []
L.append(";; ============================================================")
L.append(";; unicorn-menu-graph.scm — AtomSpace model of the chathub agent's")
L.append(";; numbered phrase-response branches (semi-deterministic menu grammar).")
L.append(";; Mined from 38 conversations / 556 messages (2023-08 → 2026-07).")
L.append(";;")
L.append(";; Menu grammar anchors:")
L.append(";;   ⚙️  glyph:zoom-out  — ascend to the menu level above")
L.append(";;   🌿 glyph:explore   — descend / explore another enigma")
L.append(";;   1–6 numbered options — semi-deterministic transitions")
L.append(";;")
L.append(";; TruthValues: (stv strength confidence)")
L.append(";;   strength   = observed share of picks (page,option) → target")
L.append(";;   confidence = n/(n+1) where n = evidence count")
L.append(";; ============================================================")
L.append("")
L.append(";; ---- menu grammar anchor glyphs ----")
L.append('(ConceptNode "glyph:zoom-out" (stv 1 0.9)) ; ⚙️ ascend')
L.append('(ConceptNode "glyph:explore" (stv 1 0.9))  ; 🌿 descend')
L.append("")
L.append('(EvaluationLink (stv 1 0.9)')
L.append('  (PredicateNode "glyph-action")')
L.append('  (ListLink (ConceptNode "glyph:zoom-out") (ConceptNode "action:ascend-menu-level")))')
L.append('(EvaluationLink (stv 1 0.9)')
L.append('  (PredicateNode "glyph-action")')
L.append('  (ListLink (ConceptNode "glyph:explore") (ConceptNode "action:descend-new-enigma")))')
L.append("")
L.append(";; ---- leaf sink: free-content responses (no follow-up menu) ----")
L.append('(ConceptNode "leaf:content" (stv 1 0.9))')
L.append("")

# pages + options
L.append(";; ============ PAGES (menu states) ============")
for p in pages:
    pid = p["id"]
    label = esc(p["label"])[:100]
    L.append(f';; --- {pid}: {label} ---')
    L.append(f'(ConceptNode "page:{pid}")')
    L.append(f'(EvaluationLink (stv 1 0.9)')
    L.append(f'  (PredicateNode "page-label")')
    L.append(f'  (ListLink (ConceptNode "page:{pid}") (ConceptNode "label:{label}")))')
    # glyph tagging
    excerpt = p.get("prompt_excerpt", "")
    if GEAR in excerpt:
        L.append(f'(MemberLink (ConceptNode "page:{pid}") (ConceptNode "glyph:zoom-out"))')
    if HERB in excerpt:
        L.append(f'(MemberLink (ConceptNode "page:{pid}") (ConceptNode "glyph:explore"))')
    for o in p["options"]:
        n, text = o["n"], esc(o["text"])[:120]
        L.append(f'(EvaluationLink (stv 1 0.9)')
        L.append(f'  (PredicateNode "offers-option")')
        L.append(f'  (ListLink (ConceptNode "page:{pid}") (NumberNode {n})))')
        L.append(f'(EvaluationLink (stv 1 0.9)')
        L.append(f'  (PredicateNode "option-text")')
        L.append(f'  (ListLink (ConceptNode "option:{pid}:{n}") (ConceptNode "text:{text}")))')
    L.append("")

# branch implications
L.append(";; ============ BRANCHES (semi-deterministic transitions) ============")
for (from_page, option), targets in sorted(evidence.items()):
    total = sum(targets.values())
    for target, count in targets.most_common():
        strength = round(count / total, 3)
        confidence = round(count / (count + 1), 3)
        tnode = f"page:{target}" if target != "leaf:content" else "leaf:content"
        L.append(f'(ImplicationLink (stv {strength} {confidence})')
        L.append(f'  (AndLink (ConceptNode "page:{from_page}") (NumberNode {option}))')
        L.append(f'  (ConceptNode "{tnode}"))')
L.append("")
L.append(";; end of unicorn-menu-graph.scm")

with open(SCM_OUT, "w") as f:
    f.write("\n".join(L) + "\n")

# ---------------------------------------------------------------- topology
out_edges = defaultdict(list)
for (from_page, option), targets in evidence.items():
    total = sum(targets.values())
    for target, count in targets.most_common():
        out_edges[from_page].append({
            "option": option,
            "to": None if target == "leaf:content" else target,
            "strength": round(count / total, 3),
            "evidence": count,
        })

topo_pages = []
for p in pages:
    excerpt = p.get("prompt_excerpt", "")
    topo_pages.append({
        "id": p["id"],
        "label": p["label"][:80],
        "options": [{"n": o["n"], "text": o["text"][:100]} for o in p["options"]],
        "glyphs": {
            "zoomOut": GEAR in excerpt,
            "explore": HERB in excerpt,
        },
        "edges": sorted(out_edges.get(p["id"], []), key=lambda e: e["option"]),
    })

# hub metrics
in_degree = Counter()
for edges in out_edges.values():
    for e in edges:
        if e["to"]:
            in_degree[e["to"]] += 1

stats = data["stats"] | {
    "hub_pages": [pid for pid, _ in in_degree.most_common(5)],
    "pages_with_zoom_out": sum(1 for tp in topo_pages if tp["glyphs"]["zoomOut"]),
    "pages_with_explore": sum(1 for tp in topo_pages if tp["glyphs"]["explore"]),
}

topology = {"grammar": {"zoomOut": "⚙️ ascend to menu level above", "explore": "🌿 descend into a new enigma", "options": "1–6 semi-deterministic numbered transitions"}, "stats": stats, "pages": topo_pages}
with open(TOPO_OUT, "w") as f:
    json.dump(topology, f, indent=2, ensure_ascii=False)

# ---------------------------------------------------------------- shared TS
# Compact skeleton: only pages that participate in branches (as source or target),
# to keep the in-game module lean.
connected = set(out_edges.keys()) | set(in_degree.keys())
skeleton_pages = [tp for tp in topo_pages if tp["id"] in connected]

ts = []
ts.append("/**")
ts.append(" * menuTopology.ts — skeleton framework distilled from the AtomSpace model")
ts.append(" * of the chathub agent's numbered-menu grammar (see reference/atomspace/).")
ts.append(" *")
ts.append(" * Grammar: ⚙️ zoomOut (ascend) · 🌿 explore (descend) · 1–6 numbered options.")
ts.append(" * Each edge carries the observed semi-deterministic strength (share of picks)")
ts.append(" * and evidence count from the 38-conversation archive.")
ts.append(" * Auto-generated by generate_atomspace.py — do not edit by hand.")
ts.append(" */")
ts.append("")
ts.append("export interface MenuOption { n: number; text: string }")
ts.append("export interface MenuEdge { option: number; to: string | null; strength: number; evidence: number }")
ts.append("export interface MenuPage {")
ts.append("  id: string;")
ts.append("  label: string;")
ts.append("  options: MenuOption[];")
ts.append("  glyphs: { zoomOut: boolean; explore: boolean };")
ts.append("  edges: MenuEdge[];")
ts.append("}")
ts.append("")
ts.append("export const MENU_GRAMMAR = {")
ts.append('  zoomOut: "⚙️ ascend to menu level above",')
ts.append('  explore: "🌿 descend into a new enigma",')
ts.append('  options: "1–6 semi-deterministic numbered transitions",')
ts.append("} as const;")
ts.append("")
ts.append(f"export const MENU_STATS = {json.dumps(stats, ensure_ascii=False)} as const;")
ts.append("")
ts.append(f"export const MENU_SKELETON: MenuPage[] = {json.dumps(skeleton_pages, ensure_ascii=False, indent=2)};")
ts.append("")

with open(TS_OUT, "w") as f:
    f.write("\n".join(ts))

print(f".scm atoms file: {SCM_OUT} ({os.path.getsize(SCM_OUT)//1024} KB)")
print(f"topology JSON:   {TOPO_OUT} ({os.path.getsize(TOPO_OUT)//1024} KB)")
print(f"shared TS:       {TS_OUT} ({os.path.getsize(TS_OUT)//1024} KB)")
print(f"skeleton pages:  {len(skeleton_pages)} of {len(pages)} (connected via branches)")
print(f"hub pages:       {stats['hub_pages']}")
