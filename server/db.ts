import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  cosmicSystems,
  evolutionCycles,
  fieldNotes,
  gameSaves,
  InsertEvolutionCycle,
  InsertFieldNote,
  InsertMemorialTrack,
  InsertTribute,
  InsertUser,
  memorialTracks,
  systemFeatures,
  tributes,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Game Saves (expedition state) ============

export async function getGameSave(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(gameSaves)
    .where(eq(gameSaves.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertGameSave(save: {
  userId: number;
  discovered: string;
  artifacts: string;
  allies: string;
  stardust: number;
  cycles: number;
  finaleReached: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(gameSaves)
    .values(save)
    .onDuplicateKeyUpdate({
      set: {
        discovered: save.discovered,
        artifacts: save.artifacts,
        allies: save.allies,
        stardust: save.stardust,
        cycles: save.cycles,
        finaleReached: save.finaleReached,
      },
    });
  return getGameSave(save.userId);
}

export async function deleteGameSave(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(gameSaves).where(eq(gameSaves.userId, userId));
}

// ============ Field Notes (S3-backed uploads) ============

export async function listFieldNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(fieldNotes)
    .where(eq(fieldNotes.userId, userId))
    .orderBy(desc(fieldNotes.createdAt));
}

export async function getFieldNote(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(fieldNotes)
    .where(and(eq(fieldNotes.id, id), eq(fieldNotes.userId, userId)))
    .limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function insertFieldNote(note: InsertFieldNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fieldNotes).values(note);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  if (insertId) {
    const rows = await db
      .select()
      .from(fieldNotes)
      .where(eq(fieldNotes.id, insertId))
      .limit(1);
    return rows[0];
  }
  return undefined;
}

export async function deleteFieldNote(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(fieldNotes)
    .where(and(eq(fieldNotes.id, id), eq(fieldNotes.userId, userId)));
}

// ============ Memorial Tracks (Music Shrine) ============

export async function listMemorialTracks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memorialTracks).orderBy(memorialTracks.sortOrder, memorialTracks.id);
}

export async function insertMemorialTrack(track: InsertMemorialTrack) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(memorialTracks).values(track);
  return listMemorialTracks();
}

export async function deleteMemorialTrack(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(memorialTracks).where(eq(memorialTracks.id, id));
}

// ============ Tributes (Kayla's Grove guestbook) ============
export async function listTributes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tributes).orderBy(desc(tributes.createdAt), desc(tributes.id));
}

export async function insertTribute(tribute: InsertTribute) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tributes).values(tribute);
  return listTributes();
}

export async function deleteTribute(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tributes).where(eq(tributes.id, id));
}

// ============ Evolution Cycles (autoresearch ledger) ============

/** Ledger rows for one expedition, oldest first (results.tsv order) */
export async function listEvolutionCycles(expeditionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(evolutionCycles)
    .where(eq(evolutionCycles.expeditionId, expeditionId))
    .orderBy(evolutionCycles.cycleNumber, evolutionCycles.id);
}

/** Cached oracle mutation for a zone within an expedition (one oracle call per zone ever) */
export async function getCycleForZone(expeditionId: string, zoneId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(evolutionCycles)
    .where(
      and(
        eq(evolutionCycles.expeditionId, expeditionId),
        eq(evolutionCycles.zoneId, zoneId),
      ),
    )
    .limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function insertEvolutionCycle(cycle: InsertEvolutionCycle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evolutionCycles).values(cycle);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  if (insertId) {
    const rows = await db
      .select()
      .from(evolutionCycles)
      .where(eq(evolutionCycles.id, insertId))
      .limit(1);
    return rows[0];
  }
  return undefined;
}

/** Clear an expedition's ledger (used on expedition reset) */
export async function deleteEvolutionCycles(expeditionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(evolutionCycles).where(eq(evolutionCycles.expeditionId, expeditionId));
}

// ---------------------------------------------------------------------------
// Cosmic System Ladder (see reference/SYSTEM-LADDER.md)
// ---------------------------------------------------------------------------

/** All System strata S1..S9, ordered by ordinal. */
export async function listCosmicSystems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cosmicSystems).orderBy(cosmicSystems.ordinal);
}

/** All feature→system mappings, ordered by system then name. */
export async function listSystemFeatures() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(systemFeatures)
    .orderBy(systemFeatures.systemOrdinal, systemFeatures.name);
}
