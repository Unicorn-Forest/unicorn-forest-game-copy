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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvolutionCycle = typeof evolutionCycles.$inferSelect;
export type InsertEvolutionCycle = typeof evolutionCycles.$inferInsert;