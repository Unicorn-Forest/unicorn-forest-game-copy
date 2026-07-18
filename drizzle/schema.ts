import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Expedition save state — one row per user (cartographer).
 * Arrays are stored as JSON strings for simplicity; the game state is small.
 */
export const gameSaves = mysqlTable("game_saves", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id; unique so each cartographer has exactly one expedition */
  userId: int("userId").notNull().unique(),
  /** JSON array of discovered zone ids */
  discovered: text("discovered").notNull(),
  /** JSON array of artifact ids */
  artifacts: text("artifacts").notNull(),
  /** JSON array of ally ids */
  allies: text("allies").notNull(),
  stardust: int("stardust").notNull().default(3),
  cycles: int("cycles").notNull().default(1),
  finaleReached: int("finaleReached").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameSave = typeof gameSaves.$inferSelect;
export type InsertGameSave = typeof gameSaves.$inferInsert;

/**
 * Cartographer's Field Notes — files uploaded to S3, one row per note.
 * Bytes live in S3; we store the key + url + metadata only.
 */
export const fieldNotes = mysqlTable("field_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Zone the note is attached to (zone id from forestData, e.g. "moonwell") */
  zoneId: varchar("zoneId", { length: 64 }).notNull(),
  fileKey: text("fileKey").notNull(),
  url: text("url").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 127 }).notNull(),
  /** Optional caption in the dossier voice */
  caption: text("caption"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FieldNote = typeof fieldNotes.$inferSelect;
export type InsertFieldNote = typeof fieldNotes.$inferInsert;

/**
 * Memorial music tracks — YouTube videos that play in the Music Shrine.
 * Managed by the site owner (admin); visible to everyone.
 */
export const memorialTracks = mysqlTable("memorial_tracks", {
  id: int("id").autoincrement().primaryKey(),
  /** 11-char YouTube video id */
  videoId: varchar("videoId", { length: 16 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  /** Optional dedication line shown while the track plays */
  dedication: text("dedication"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemorialTrack = typeof memorialTracks.$inferSelect;
export type InsertMemorialTrack = typeof memorialTracks.$inferInsert;

/**
 * Kayla's Grove — memorial guestbook tributes from friends and family.
 * Public: anyone can leave a tribute (name + message, no login required so
 * family without accounts can contribute). Admin can remove entries.
 */
export const tributes = mysqlTable("tributes", {
  id: int("id").autoincrement().primaryKey(),
  /** display name of the friend/family member */
  authorName: varchar("authorName", { length: 80 }).notNull(),
  message: text("message").notNull(),
  /** optional link to the logged-in user who wrote it */
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tribute = typeof tributes.$inferSelect;
export type InsertTribute = typeof tributes.$inferInsert;

/**
 * Evolution Cycles — the forest's autoresearch ledger (its results.tsv).
 * One row per KSM cycle experiment: the zone (centre) strengthened, the
 * hypothesis (its latent tagline), the mutation (live oracle lore — cached so
 * each zone costs at most one oracle call ever per expedition), the metric
 * delta (wholeness gained), and the verdict.
 * Guests contribute anonymous rows (userId null) keyed by a client expedition id.
 */
export const evolutionCycles = mysqlTable("evolution_cycles", {
  id: int("id").autoincrement().primaryKey(),
  /** optional FK → users.id (null for guest expeditions) */
  userId: int("userId"),
  /** anonymous per-browser expedition id (nanoid) so guests keep a ledger too */
  expeditionId: varchar("expeditionId", { length: 32 }).notNull(),
  /** cycle number within the expedition (1-based) */
  cycleNumber: int("cycleNumber").notNull(),
  /** the living centre (zone id) this cycle strengthened */
  zoneId: varchar("zoneId", { length: 64 }).notNull(),
  /** hypothesis — the latent centre's tagline at the moment of the cycle */
  hypothesis: text("hypothesis").notNull(),
  /** mutation — the oracle's response (live if available, else seed lore) */
  mutation: text("mutation").notNull(),
  /** whether the mutation text came live from the Chatbase oracle */
  liveOracle: int("liveOracle").notNull().default(0),
  /** metric — wholeness (%) after this cycle completed */
  wholenessAfter: int("wholenessAfter").notNull(),
  /** verdict — autoresearch keep/discard; reveals are always structure-preserving */
  verdict: mysqlEnum("verdict", ["keep", "discard"]).default("keep").notNull(),
  /** System Ladder stratum this experiment exercised (1..9); KSM cycles are S4 BIOS */
  systemOrdinal: int("systemOrdinal").notNull().default(4),
  /** Council of Wizards interpreter (FK → wizards.key); null for pre-Council rows */
  wizardKey: varchar("wizardKey", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvolutionCycle = typeof evolutionCycles.$inferSelect;
export type InsertEvolutionCycle = typeof evolutionCycles.$inferInsert;

/**
 * Cosmic Systems — Campbell's System Ladder registry, indexed by OEIS A000081
 * (rooted trees), with the convention sys(N) = a(N+1). Each row is one System
 * stratum of the Unicorn Forest cosmology (see reference/SYSTEM-LADDER.md).
 * Seeded from canon; admin-editable, publicly readable.
 */
export const cosmicSystems = mysqlTable("cosmic_systems", {
  id: int("id").autoincrement().primaryKey(),
  /** system ordinal N (1..9) */
  ordinal: int("ordinal").notNull().unique(),
  /** term count = A000081(N+1): 1,2,4,9,20,48,115,286,719 */
  termCount: int("termCount").notNull(),
  /** canonical arithmetic decomposition, e.g. "48 = 2+2(23) = 4+4(11) = 8+8(5)" */
  factorization: varchar("factorization", { length: 160 }).notNull(),
  /** epithet, e.g. PHYSIS, BIOS, PSYCHE, ETHOS, LUDUS, POLIS, AXIS MUNDI */
  epithet: varchar("epithet", { length: 40 }).notNull(),
  /** one-paragraph character of the stratum */
  character: text("character").notNull(),
  /** aligned knowledge base, e.g. "Pattern Dynamics 49 = 1+6+42" */
  knowledgeBase: text("knowledgeBase").notNull(),
  /** how the stratum expresses in the Unicorn Forest */
  forestExpression: text("forestExpression").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CosmicSystem = typeof cosmicSystems.$inferSelect;
export type InsertCosmicSystem = typeof cosmicSystems.$inferInsert;

/**
 * System Features — mapping of concrete game mechanics to their System stratum,
 * so the codebase knows which cosmological layer each feature inhabits.
 */
export const systemFeatures = mysqlTable("system_features", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → cosmicSystems.ordinal (1..9) */
  systemOrdinal: int("systemOrdinal").notNull(),
  /** short feature key, e.g. "ksm-cycle", "evolution-ledger", "wizard-council" */
  featureKey: varchar("featureKey", { length: 64 }).notNull().unique(),
  /** display name */
  name: varchar("name", { length: 120 }).notNull(),
  /** how this feature embodies its stratum */
  description: text("description").notNull(),
  status: mysqlEnum("status", ["live", "planned"]).default("live").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SystemFeature = typeof systemFeatures.$inferSelect;
export type InsertSystemFeature = typeof systemFeatures.$inferInsert;

/**
 * The Council of Wizards — nine S6 disposition operators in three ennead
 * triads (b9/p9/j9), each triad holding anchor/weaver/herald seats.
 * They interpret evolution-ledger experiments and flavor live oracle lore.
 * See reference/COUNCIL-OF-WIZARDS.md.
 */
export const wizards = mysqlTable("wizards", {
  id: int("id").autoincrement().primaryKey(),
  /** stable key, e.g. "quillion" */
  key: varchar("key", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  /** ennead triad the wizard belongs to */
  triad: mysqlEnum("triad", ["b9", "p9", "j9"]).notNull(),
  /** seat within the triad */
  seat: mysqlEnum("seat", ["anchor", "weaver", "herald"]).notNull(),
  /** the S6 disposition — the wizard's situated positionality */
  disposition: varchar("disposition", { length: 120 }).notNull(),
  /** flavor line for UI cards */
  flavor: text("flavor").notNull(),
  /** persona prefix injected into live oracle lore prompts */
  promptFlavor: text("promptFlavor").notNull(),
  emoji: varchar("emoji", { length: 8 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Wizard = typeof wizards.$inferSelect;
export type InsertWizard = typeof wizards.$inferInsert;

/**
 * Skeleton traversals — every player step through the AtomSpace menu-grammar
 * skeleton (pick / zoom-out / explore / divination) is logged here, so live
 * play continuously grows the knowledge-graph corpus beyond the mined archive.
 * Aggregated per-edge counts feed the Evolution Ledger and Deep Divination.
 */
export const skeletonTraversals = mysqlTable("skeleton_traversals", {
  id: int("id").autoincrement().primaryKey(),
  /** anonymous expedition id (localStorage nanoid) — same id as evolution_cycles */
  expeditionId: varchar("expeditionId", { length: 64 }).notNull(),
  /** page id the step started from, e.g. "page-009" */
  fromPage: varchar("fromPage", { length: 24 }).notNull(),
  /** destination page id (null for leaf picks) */
  toPage: varchar("toPage", { length: 24 }),
  /** numbered option picked (null for glyph moves) */
  option: int("option"),
  /** kind of traversal step */
  kind: mysqlEnum("kind", ["pick", "zoomOut", "explore", "divination"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SkeletonTraversal = typeof skeletonTraversals.$inferSelect;
export type InsertSkeletonTraversal = typeof skeletonTraversals.$inferInsert;
