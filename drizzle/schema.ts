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