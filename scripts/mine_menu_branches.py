#!/usr/bin/env python3
"""
Mine the Chatbase unicorn-agent archive for numbered phrase-response branches.

The chathub agent replies with numbered menus (1..6 options, plus glyph anchors
like the gear ⚙️ and herb 🌿). Each assistant message that presents a numbered
menu is a "page prompt"; the user's next message often selects a number,
producing a semi-deterministic branch: (page, option) -> next page.

Output: /home/ubuntu/menu_branches.json
  pages:    [{id, label, source_conv, prompt_excerpt, options:[{n, text}]}]
  branches: [{from_page, option, to_page, user_pick, conv}]
  stats:    counts, branching factors
"""
import json
import re
import unicodedata
from collections import defaultdict

SRC = "/home/ubuntu/copy-of-unicorn-forest-—-isometric-pixel-quest/reference/chats/chats_evhVHB0tApQRujDFXZpvX_2023-08-01~2026-07-18.json"
OUT = "/home/ubuntu/menu_branches.json"

with open(SRC) as f:
    data = json.load(f)

# Normalize: archive may be a list of conversations each with messages
convs = data if isinstance(data, list) else data.get("conversations", data.get("data", []))

# Numbered option pattern: line starting with a number 1-9 followed by . ) : or emoji digit
OPT_RE = re.compile(r"^\s*(?:\*\*)?([1-9])(?:\ufe0f\u20e3)?[.)\]:\u2013-]\s*(?:\*\*)?\s*(.+?)(?:\*\*)?\s*$")
KEYCAP_RE = re.compile(r"^\s*([1-9])\ufe0f?\u20e3\s*(?:\*\*)?\s*(.+?)(?:\*\*)?\s*$")
# user picks: a bare number, possibly with punctuation/words like "option 3"
PICK_RE = re.compile(r"^\s*(?:option\s*)?([1-9])\s*[.)]?\s*$", re.IGNORECASE)

def norm(s):
    return unicodedata.normalize("NFC", s or "").strip()

def extract_options(text):
    """Return list of (n, option_text) if the message contains a numbered menu."""
    opts = {}
    for line in text.splitlines():
        m = KEYCAP_RE.match(line) or OPT_RE.match(line)
        if m:
            n = int(m.group(1))
            body = m.group(2).strip()
            # skip pure numeric or too-short bodies; skip markdown list false positives
            if len(body) >= 2 and n not in opts:
                opts[n] = body
    # A menu requires at least options 1 and 2 in sequence
    if 1 in opts and 2 in opts and len(opts) >= 2:
        return [{"n": n, "text": opts[n][:160]} for n in sorted(opts)]
    return None

def page_label(text, opts):
    """Derive a short label for the page from the text before the menu."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for l in lines:
        # first heading or bold line
        if l.startswith("#") or (l.startswith("**") and l.endswith("**")):
            return re.sub(r"[#*]", "", l).strip()[:80]
    # fallback: first non-option line
    for l in lines:
        if not (KEYCAP_RE.match(l) or OPT_RE.match(l)):
            return l[:80]
    return "menu"

pages = []          # page dicts
page_index = {}     # fingerprint -> page id
branches = []

def fingerprint(opts):
    return "|".join(f"{o['n']}:{o['text'][:40].lower()}" for o in opts)

for ci, conv in enumerate(convs):
    msgs = conv.get("messages", conv.get("chat_messages", []))
    conv_id = conv.get("id", conv.get("conversation_id", f"conv-{ci}"))
    # Walk messages in order; track last menu page seen
    last_page_id = None
    last_pick = None
    for mi, msg in enumerate(msgs):
        role = (msg.get("role") or msg.get("from") or "").lower()
        content = norm(msg.get("content") or msg.get("message") or msg.get("text") or "")
        if not content:
            continue
        if role in ("assistant", "bot", "ai", "agent"):
            opts = extract_options(content)
            if opts:
                fp = fingerprint(opts)
                if fp in page_index:
                    pid = page_index[fp]
                else:
                    pid = f"page-{len(pages):03d}"
                    page_index[fp] = pid
                    pages.append({
                        "id": pid,
                        "label": page_label(content, opts),
                        "source_conv": conv_id,
                        "prompt_excerpt": content[:240],
                        "options": opts,
                    })
                # If we got here via a pick from a previous page, record the branch
                if last_page_id is not None and last_pick is not None:
                    branches.append({
                        "from_page": last_page_id,
                        "option": last_pick,
                        "to_page": pid,
                        "conv": conv_id,
                    })
                last_page_id = pid
                last_pick = None
            else:
                # assistant reply without a menu: terminal content node
                if last_page_id is not None and last_pick is not None:
                    branches.append({
                        "from_page": last_page_id,
                        "option": last_pick,
                        "to_page": None,  # leaf / free content
                        "conv": conv_id,
                    })
                    last_pick = None
        elif role in ("user", "human"):
            m = PICK_RE.match(content)
            if m and last_page_id is not None:
                last_pick = int(m.group(1))
            else:
                # free-text query resets the deterministic chain
                last_pick = None

# Stats
out_degree = defaultdict(set)
for b in branches:
    if b["to_page"]:
        out_degree[b["from_page"]].add((b["option"], b["to_page"]))

stats = {
    "conversations": len(convs),
    "pages": len(pages),
    "branches_total": len(branches),
    "branches_to_pages": sum(1 for b in branches if b["to_page"]),
    "branches_to_leaves": sum(1 for b in branches if not b["to_page"]),
    "avg_options_per_page": round(sum(len(p["options"]) for p in pages) / max(1, len(pages)), 2),
    "max_out_degree": max((len(v) for v in out_degree.values()), default=0),
}

with open(OUT, "w") as f:
    json.dump({"pages": pages, "branches": branches, "stats": stats}, f, indent=2, ensure_ascii=False)

print(json.dumps(stats, indent=2))
print("\nSample pages:")
for p in pages[:6]:
    print(f"  {p['id']}: {p['label']!r} ({len(p['options'])} options)")
print("\nSample branches:")
for b in branches[:8]:
    print(f"  {b['from_page']} --[{b['option']}]--> {b['to_page']}")
