/**
 * UNICORN FOREST — Game Data
 * Style: CogHood Nocturne (isometric-pixel-page). All lore text sourced from
 * the ✨Unicorn✨🦄✨ chatbase oracle (evhVHB0tApQRujDFXZpvX) across 3 KSM iterations.
 * KSM framing: each zone reveal = one structure-preserving transformation cycle.
 */

export type IslandArt = "water" | "village" | "grove" | "shadow" | "observatory";

export interface Character {
  id: string;
  name: string;
  emoji: string;
  role: string;
  personality: string;
  quote: string;
}

export interface Artifact {
  id: string;
  name: string;
  emoji: string;
  description: string;
  zoneId: string;
}

export interface Zone {
  id: string;
  name: string;
  emoji: string;
  art: IslandArt;
  hue: number; // css hue-rotate deg for variety
  x: number; // % position on map canvas
  y: number;
  adjacent: string[];
  characterId?: string;
  artifactId?: string;
  danger?: boolean;
  finale?: boolean;
  requires?: { ally?: string; artifacts?: number };
  /** Oracle lore revealed during the KSM cycle (real chatbot text, condensed) */
  lore: string;
  /** Short KSM "centre" description shown on the map card */
  tagline: string;
}

export const CHARACTERS: Record<string, Character> = {
  luna: {
    id: "luna",
    name: "Luna",
    emoji: "🌙",
    role: "Eldest Unicorn · Guardian of the Moonwell",
    personality: "ancient · serene · protective · wise",
    quote:
      "My horn touches the Moonwell and sends ripples across time. Every path you awaken strengthens the whole forest.",
  },
  nova: {
    id: "nova",
    name: "Nova",
    emoji: "⭐",
    role: "Youngest Unicorn · Dreamweaver & Stargazer",
    personality: "curious · dreamy · inventive · emotionally vivid",
    quote:
      "My coat turns azure when I'm curious — it has been azure all night! Come see the constellations from my observatory.",
  },
  aurelia: {
    id: "aurelia",
    name: "Aurelia",
    emoji: "📖",
    role: "Storyteller · Keeper of Legends",
    personality: "poetic · reflective · constellatory in manner",
    quote:
      "Beyond the Stardust Veil lie other worlds. Every tale told in this glade keeps the curtain shimmering.",
  },
  caelum: {
    id: "caelum",
    name: "Caelum",
    emoji: "🌀",
    role: "Swift Messenger · Rune-Reader",
    personality: "quick · alert · perceptive",
    quote:
      "The Celestial Runes etched into the ancient trees are older than moonlight. I will read them for you as you travel.",
  },
  moth: {
    id: "moth",
    name: "The Lumina Moth",
    emoji: "🦋",
    role: "Guide Through Darkness",
    personality: "gentle · luminous · brave",
    quote:
      "My wings carry the light of forgotten stars. Stay close — the Shadow Thicket cannot swallow what still shines.",
  },
  weavers: {
    id: "weavers",
    name: "The Nightmare Weavers",
    emoji: "🕸️",
    role: "Antagonistic Shadow-Spinners",
    personality: "eerie · fear-spinning",
    quote: "…the light grows thin here… hidden things stir… strange powers linger…",
  },
};

export const ARTIFACTS: Record<string, Artifact> = {
  sketchbook: {
    id: "sketchbook",
    name: "Moonstone Sketchbook",
    emoji: "📔",
    description:
      "Nova's moonstone-bound sketchbook — comet trails, moonbow dances, and stardust sprites drawn in luminous ink.",
    zoneId: "novas-observatory",
  },
  rune: {
    id: "rune",
    name: "Celestial Rune",
    emoji: "🪬",
    description:
      "A rune copied by Caelum from the ancient trees. It hums with hidden meanings older than the forest paths.",
    zoneId: "wisdom-hollows",
  },
  nectar: {
    id: "nectar",
    name: "Moonlight Nectar",
    emoji: "🍯",
    description:
      "Gathered where moonflowers bloom all year. Unicorns visit the Arboretum for this nectar — and for the stories.",
    zoneId: "moonstone-arboretum",
  },
  echo: {
    id: "echo",
    name: "Echo of Old Conversations",
    emoji: "🔔",
    description:
      "Caught beneath the leaning oaks of the Whispering Bridges. It carries secret wisdom from ages of crossings.",
    zoneId: "whispering-bridges",
  },
  tale: {
    id: "tale",
    name: "Tale of the Stardust Veil",
    emoji: "🌠",
    description:
      "Aurelia's legend of the shimmering curtain leading to other worlds — a memory fragment of the forest itself.",
    zoneId: "whispering-glade",
  },
};

export const ZONES: Zone[] = [
  {
    id: "moonwell",
    name: "The Moonwell",
    emoji: "🌙",
    art: "water",
    hue: 0,
    x: 50,
    y: 78,
    adjacent: ["unicorn-village"],
    characterId: "luna",
    tagline: "sacred · reflective — memory, dreams, wishes, cosmic insight",
    lore: "The glimmering pool at the heart of the forest. Luna, the eldest unicorn, watches over it — her horn touches the water and sends ripples across time. The whole forest hums with laughter, whispers, and ancient enchantment around this steady center.",
  },
  {
    id: "unicorn-village",
    name: "Unicorn Village",
    emoji: "🏘️",
    art: "village",
    hue: 0,
    x: 50,
    y: 58,
    adjacent: ["moonwell", "moonlit-clearing", "stardust-trails"],
    tagline: "backbone of communal life — live, share magic, raise young",
    lore: "The unicorn communities are like towns or settlements — Treeborne Chambers grown from living trees, Crystalline Caverns, Starlight Canopies of woven vines, and Lunar Workshops where craft and magic mingle. Silver-maned, star-kissed, rainbow-coated — young and old alike live here.",
  },
  {
    id: "moonlit-clearing",
    name: "Moonlit Clearing",
    emoji: "🌕",
    art: "grove",
    hue: 40,
    x: 30,
    y: 64,
    adjacent: ["unicorn-village", "whispering-glade"],
    tagline: "open social heart — meetings, festivals, dancing in moonlight",
    lore: "Open spaces where unicorns gather socially — meetings, festivals, dancing in moonlight. Blossom Butterflies add color and motion in spring; Moonbeam Fireflies drift through summer air like tiny lanterns.",
  },
  {
    id: "whispering-glade",
    name: "Whispering Glade",
    emoji: "🌸",
    art: "grove",
    hue: 300,
    x: 13,
    y: 52,
    adjacent: ["moonlit-clearing"],
    characterId: "aurelia",
    artifactId: "tale",
    tagline: "where unicorns gather to share tales — Aurelia's home",
    lore: "Where unicorns gather to share tales. Aurelia the storyteller recounts the legend of the Stardust Veil — the shimmering curtain leading to other worlds. Whispering Owlets glide silently overhead, keeping every secret they hear.",
  },
  {
    id: "stardust-trails",
    name: "Stardust Trails",
    emoji: "✨",
    art: "grove",
    hue: 180,
    x: 68,
    y: 47,
    adjacent: ["unicorn-village", "wisdom-hollows", "healing-springs", "lumina-towers"],
    tagline: "the luminous web of forest paths — main travel network",
    lore: "Luminous pathways that connect different parts of the forest — villages, glades, hidden landmarks, resource spots, learning areas. The main travel routes feel like they're made of glowing dust. These paths make exploration possible and link the whole forest together.",
  },
  {
    id: "wisdom-hollows",
    name: "Wisdom Hollows",
    emoji: "📚",
    art: "grove",
    hue: 90,
    x: 88,
    y: 55,
    adjacent: ["stardust-trails", "moonstone-arboretum"],
    artifactId: "rune",
    tagline: "the forest's schools & archives — elders teach the young",
    lore: "Quiet learning areas where elder unicorns teach the young — the forest's schools and archives. Caelum the swift messenger passes through often, reading the Celestial Runes etched into the ancient trees. He copies one for you.",
  },
  {
    id: "healing-springs",
    name: "Healing Springs",
    emoji: "💧",
    art: "water",
    hue: 120,
    x: 33,
    y: 40,
    adjacent: ["stardust-trails"],
    tagline: "restorative magic pools — rest, recover, regain energy",
    lore: "Natural pools with restorative magic. Unicorns come here to rest, recover, and regain energy. Water Sprites fill the soundscape with playful laughter, and Rejuvenating Alcoves nestle between the pools. Your courage is restored for the dark paths ahead.",
  },
  {
    id: "moonstone-arboretum",
    name: "Moonstone Arboretum",
    emoji: "🌼",
    art: "grove",
    hue: 220,
    x: 97,
    y: 38,
    adjacent: ["wisdom-hollows"],
    artifactId: "nectar",
    tagline: "celestial greenhouse — moonflowers bloom all year",
    lore: "A celestial greenhouse where moonflowers bloom all year. Rare plants grow in colors unknown to botanists, and unicorns visit for moonlight nectar and stories. Remember the moonflowers — their name is said to open ancient doors.",
  },
  {
    id: "lumina-towers",
    name: "Lumina Towers",
    emoji: "🏰",
    art: "village",
    hue: 180,
    x: 68,
    y: 27,
    adjacent: ["stardust-trails", "whispering-bridges", "novas-observatory"],
    tagline: "moonbeam-woven spires — glimpse other realms",
    lore: "Moonbeam-woven spires used for meetings and observation. From the top, unicorns can glimpse other realms and distant skies. Fae-Wrought Portals — ornate enchanted entrances — stand at the towers' feet.",
  },
  {
    id: "whispering-bridges",
    name: "Whispering Bridges",
    emoji: "🌉",
    art: "grove",
    hue: 150,
    x: 42,
    y: 20,
    adjacent: ["lumina-towers", "shadow-thicket"],
    artifactId: "echo",
    tagline: "leaning ancient oaks — echoes of old conversations",
    lore: "Natural bridges formed by leaning ancient oaks. They carry echoes of old conversations and secret wisdom. As you cross, a gentle light lands on your shoulder — the Lumina Moth, whose wings carry the light of forgotten stars, joins your expedition.",
  },
  {
    id: "novas-observatory",
    name: "Nova's Observatory",
    emoji: "🔭",
    art: "observatory",
    hue: 0,
    x: 90,
    y: 12,
    adjacent: ["lumina-towers"],
    characterId: "nova",
    artifactId: "sketchbook",
    tagline: "hilltop stargazing — crystal panes reflect the constellations",
    lore: "A hilltop observatory built by the young unicorn Nova — crystal-clear panes reflecting the constellations. She watches stars, shooting lights, and moon phases, and keeps whispered wishes. Her coat shifts azure with curiosity as she gifts you her moonstone-bound sketchbook.",
  },
  {
    id: "shadow-thicket",
    name: "Shadow Thicket",
    emoji: "🕸️",
    art: "shadow",
    hue: 0,
    x: 18,
    y: 10,
    adjacent: ["whispering-bridges", "moonflower-chamber"],
    characterId: "weavers",
    danger: true,
    requires: { ally: "moth" },
    tagline: "⚠ dangerous zone — fear, hidden paths, Nightmare Weavers",
    lore: "A dark, twisted part of the forest where the light grows thin, hidden things stir, and strange powers linger. The Nightmare Weavers spin fear between the gnarled trunks. But the Lumina Moth leads you through — its wings carrying the light of forgotten stars along the hidden path.",
  },
  {
    id: "moonflower-chamber",
    name: "Moonflower Chamber",
    emoji: "🌺",
    art: "observatory",
    hue: 280,
    x: 5,
    y: 22,
    adjacent: ["shadow-thicket"],
    finale: true,
    requires: { artifacts: 5 },
    tagline: "secret vault — treasure and revelation",
    lore: "Past the Fairy Ring and down the hidden staircase — a labyrinth of roots and starlight — stands an ancient stone door. You speak the name of the Moonflower, and it opens. Behind it lies treasure and more mystery: the memory fragments of the forest itself, the origin, the resilience, the cosmic order, the forgotten songs. The Prophecy of the Cosmic Order is fulfilled — every action contributed to the whole.",
  },
];

export const ZONE_MAP: Record<string, Zone> = Object.fromEntries(
  ZONES.map((z) => [z.id, z]),
);

/** KSM 12-step cycle labels (unicorn-dynamics), shown during zone reveals */
export const KSM_STEPS = [
  "01 · Desired End-State",
  "02 · Transform Tasks → Centers",
  "03 · Choose Critical Centre",
  "04 · Focus Attention",
  "05 · Strengthen the Centre",
  "06 · Local Symmetry",
  "07 · Deepen Boundaries",
  "08 · Echo the Pattern",
  "09 · Test Wholeness",
  "10 · Integrate with Vision",
  "11 · Preserve Structure",
  "12 · Celebrate the Glow",
];

export const ORACLE_INTRO =
  "The Unicorn Forest is a magical place where imagination and reality blur together — moonlight bark, flowers in colors unknown to botanists, luminescent mushrooms, and paths that glow softly under stardust. The whole forest hums with laughter, whispers, and ancient enchantment.";

/** Island archetype art URLs (generated pixel assets) */
export const ISLAND_ART: Record<IslandArt, string> = {
  water: "/manus-storage/island_water_3d06c0c4_f71c9fe5.png",
  village: "/manus-storage/island_village_8f4fa3d3_c7dc0897.png",
  grove: "/manus-storage/island_grove_284ae788_a69071d3.png",
  shadow: "/manus-storage/island_shadow_ede3d33d_fc31588c.png",
  observatory: "/manus-storage/island_observatory_80001b2b_436534ea.png",
};

export const HERO_ART = "/manus-storage/hero_unicorn_forest_8874ad29_16d761bb.png";
export const LOGO_ART = "/manus-storage/logo_unicorn_283175d9_22d68a90.png";
