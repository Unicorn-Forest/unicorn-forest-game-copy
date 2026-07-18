/**
 * UNICORN FOREST — shared zone seed (server-safe subset of forestData).
 * The server evolution router uses this for hypothesis taglines and fallback
 * lore when the live oracle is unavailable. Kept in shared/ so both the
 * client game data and the server ledger speak the same centre language.
 */

export interface ZoneSeed {
  name: string;
  tagline: string;
  lore: string;
}

export const ZONE_SEED: Record<string, ZoneSeed> = {
  moonwell: {
    name: "The Moonwell",
    tagline: "sacred · reflective — memory, dreams, wishes, cosmic insight",
    lore: "The glimmering pool at the heart of the forest. Luna, the eldest unicorn, watches over it — her horn touches the water and sends ripples across time. The whole forest hums with laughter, whispers, and ancient enchantment around this steady center.",
  },
  "unicorn-village": {
    name: "Unicorn Village",
    tagline: "backbone of communal life — live, share magic, raise young",
    lore: "The unicorn communities are like towns or settlements — Treeborne Chambers grown from living trees, Crystalline Caverns, Starlight Canopies of woven vines, and Lunar Workshops where craft and magic mingle. Silver-maned, star-kissed, rainbow-coated — young and old alike live here.",
  },
  "moonlit-clearing": {
    name: "Moonlit Clearing",
    tagline: "open social heart — meetings, festivals, dancing in moonlight",
    lore: "Open spaces where unicorns gather socially — meetings, festivals, dancing in moonlight. Blossom Butterflies add color and motion in spring; Moonbeam Fireflies drift through summer air like tiny lanterns.",
  },
  "whispering-glade": {
    name: "Whispering Glade",
    tagline: "where unicorns gather to share tales — Aurelia's home",
    lore: "Where unicorns gather to share tales. Aurelia the storyteller recounts the legend of the Stardust Veil — the shimmering curtain leading to other worlds. Whispering Owlets glide silently overhead, keeping every secret they hear.",
  },
  "stardust-trails": {
    name: "Stardust Trails",
    tagline: "the luminous web of forest paths — main travel network",
    lore: "Luminous pathways that connect different parts of the forest — villages, glades, hidden landmarks, resource spots, learning areas. The main travel routes feel like they're made of glowing dust. These paths make exploration possible and link the whole forest together.",
  },
  "wisdom-hollows": {
    name: "Wisdom Hollows",
    tagline: "the forest's schools & archives — elders teach the young",
    lore: "Quiet learning areas where elder unicorns teach the young — the forest's schools and archives. Caelum the swift messenger passes through often, reading the Celestial Runes etched into the ancient trees. He copies one for you.",
  },
  "healing-springs": {
    name: "Healing Springs",
    tagline: "restorative magic pools — rest, recover, regain energy",
    lore: "Natural pools with restorative magic. Unicorns come here to rest, recover, and regain energy. Water Sprites fill the soundscape with playful laughter, and Rejuvenating Alcoves nestle between the pools. Your courage is restored for the dark paths ahead.",
  },
  "moonstone-arboretum": {
    name: "Moonstone Arboretum",
    tagline: "celestial greenhouse — moonflowers bloom all year",
    lore: "A celestial greenhouse where moonflowers bloom all year. Rare plants grow in colors unknown to botanists, and unicorns visit for moonlight nectar and stories. Remember the moonflowers — their name is said to open ancient doors.",
  },
  "lumina-towers": {
    name: "Lumina Towers",
    tagline: "moonbeam-woven spires — glimpse other realms",
    lore: "Moonbeam-woven spires used for meetings and observation. From the top, unicorns can glimpse other realms and distant skies. Fae-Wrought Portals — ornate enchanted entrances — stand at the towers' feet.",
  },
  "whispering-bridges": {
    name: "Whispering Bridges",
    tagline: "leaning ancient oaks — echoes of old conversations",
    lore: "Natural bridges formed by leaning ancient oaks. They carry echoes of old conversations and secret wisdom. As you cross, a gentle light lands on your shoulder — the Lumina Moth, whose wings carry the light of forgotten stars, joins your expedition.",
  },
  "novas-observatory": {
    name: "Nova's Observatory",
    tagline: "hilltop stargazing — crystal panes reflect the constellations",
    lore: "A hilltop observatory built by the young unicorn Nova — crystal-clear panes reflecting the constellations. She watches stars, shooting lights, and moon phases, and keeps whispered wishes. Her coat shifts azure with curiosity as she gifts you her moonstone-bound sketchbook.",
  },
  "shadow-thicket": {
    name: "Shadow Thicket",
    tagline: "⚠ dangerous zone — fear, hidden paths, Nightmare Weavers",
    lore: "A dark, twisted part of the forest where the light grows thin, hidden things stir, and strange powers linger. The Nightmare Weavers spin fear between the gnarled trunks. But the Lumina Moth leads you through — its wings carrying the light of forgotten stars along the hidden path.",
  },
  "moonflower-chamber": {
    name: "Moonflower Chamber",
    tagline: "secret vault — treasure and revelation",
    lore: "Past the Fairy Ring and down the hidden staircase — a labyrinth of roots and starlight — stands an ancient stone door. You speak the name of the Moonflower, and it opens. Behind it lies treasure and more mystery: the memory fragments of the forest itself, the origin, the resilience, the cosmic order, the forgotten songs. The Prophecy of the Cosmic Order is fulfilled — every action contributed to the whole.",
  },
};
