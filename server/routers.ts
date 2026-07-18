import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  deleteEvolutionCycles,
  deleteFieldNote,
  deleteGameSave,
  deleteMemorialTrack,
  deleteTribute,
  getCycleForZone,
  getGameSave,
  insertEvolutionCycle,
  insertFieldNote,
  insertMemorialTrack,
  insertTribute,
  listCosmicSystems,
  listEvolutionCycles,
  listFieldNotes,
  listMemorialTracks,
  listSystemFeatures,
  listTributes,
  upsertGameSave,
} from "./db";
import { ZONE_SEED } from "../shared/forestSeed";
import { askOracle, isOracleConfigured } from "./chatbase";
import { storagePut } from "./storage";

/** Valid zone ids come from the shared forest data; keep a lightweight guard here. */
const zoneIdSchema = z.string().min(1).max(64);

const saveSchema = z.object({
  discovered: z.array(zoneIdSchema).min(1),
  artifacts: z.array(z.string().max(64)),
  allies: z.array(z.string().max(64)),
  stardust: z.number().int().min(0).max(100000),
  cycles: z.number().int().min(1).max(100000),
  finaleReached: z.boolean(),
});

/** ~8 MB cap for field note uploads (base64 inflates ~4/3) */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Extract an 11-char YouTube video id from a URL or bare id. */
export function extractYouTubeId(input: string): string | null {
  const bare = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(bare)) return bare;
  try {
    const url = new URL(bare);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      // shorts or embed paths
      const m = url.pathname.match(/\/(shorts|embed)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/** naive in-memory rate limiter for oracle asks (per process) */
const oracleAskLog = new Map<string, number[]>();
export function allowOracleAsk(key: string, limit = 20, windowMs = 5 * 60_000): boolean {
  const now = Date.now();
  const hits = (oracleAskLog.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    oracleAskLog.set(key, hits);
    return false;
  }
  hits.push(now);
  oracleAskLog.set(key, hits);
  return true;
}

/**
 * Build the ledger-aware evolution prompt. Past experiments (up to the three
 * most recent) become memory the oracle weaves into the new centre's lore, so
 * each cycle's mutation grows from the expedition's own research history.
 */
export function buildEvolutionPrompt(
  seed: { name: string; tagline: string },
  priorCycles: Array<{ zoneId: string; hypothesis: string; cycleNumber: number }>,
): string {
  const base = `In one short poetic paragraph (max 90 words), as the Unicorn Forest oracle, describe what awakens when the "${seed.name}" is revealed — ${seed.tagline}. Stay in-world; no preamble.`;
  if (priorCycles.length === 0) return base;
  const recent = priorCycles.slice(-3);
  const memory = recent
    .map((c) => `cycle ${c.cycleNumber}: ${ZONE_SEED[c.zoneId]?.name ?? c.zoneId} (${c.hypothesis})`)
    .join("; ");
  return `${base} The expedition's ledger already records these awakened centres — ${memory}. Let the new lore echo or answer at least one of them, as one growing whole.`;
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /** Expedition save state — persisted per cartographer */
  expedition: router({
    load: protectedProcedure.query(async ({ ctx }) => {
      const save = await getGameSave(ctx.user.id);
      if (!save) return null;
      return {
        discovered: JSON.parse(save.discovered) as string[],
        artifacts: JSON.parse(save.artifacts) as string[],
        allies: JSON.parse(save.allies) as string[],
        stardust: save.stardust,
        cycles: save.cycles,
        finaleReached: save.finaleReached === 1,
        updatedAt: save.updatedAt,
      };
    }),

    save: protectedProcedure.input(saveSchema).mutation(async ({ ctx, input }) => {
      await upsertGameSave({
        userId: ctx.user.id,
        discovered: JSON.stringify(input.discovered),
        artifacts: JSON.stringify(input.artifacts),
        allies: JSON.stringify(input.allies),
        stardust: input.stardust,
        cycles: input.cycles,
        finaleReached: input.finaleReached ? 1 : 0,
      });
      return { success: true } as const;
    }),

    reset: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteGameSave(ctx.user.id);
      return { success: true } as const;
    }),
  }),

  /** Music Shrine — memorial YouTube tracks (public read, admin write) */
  shrine: router({
    tracks: publicProcedure.query(() => listMemorialTracks()),

    addTrack: protectedProcedure
      .input(
        z.object({
          /** Accepts a full YouTube URL or a bare 11-char video id */
          videoIdOrUrl: z.string().min(5).max(500),
          title: z.string().min(1).max(255),
          dedication: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the keeper of the shrine may add songs.",
          });
        }
        const videoId = extractYouTubeId(input.videoIdOrUrl);
        if (!videoId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not read a YouTube video id from that link.",
          });
        }
        const existing = await listMemorialTracks();
        return insertMemorialTrack({
          videoId,
          title: input.title,
          dedication: input.dedication ?? null,
          sortOrder: existing.length,
        });
      }),

    removeTrack: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the keeper of the shrine may remove songs.",
          });
        }
        await deleteMemorialTrack(input.id);
        return { success: true } as const;
      }),
  }),

  /** The living oracle — live Chatbase conversation with Kayla's Unicorn agent */
  oracle: router({
    status: publicProcedure.query(() => ({ live: isOracleConfigured() })),

    ask: publicProcedure
      .input(
        z.object({
          message: z.string().trim().min(1).max(1000),
          conversationId: z.string().max(128).nullish(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // simple per-process rate limit: 20 asks per 5 minutes per ip/user
        const key = ctx.user ? `u:${ctx.user.id}` : `ip:${ctx.req.ip ?? "anon"}`;
        if (!allowOracleAsk(key)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "The oracle needs a moment of stillness. Try again shortly.",
          });
        }
        try {
          const reply = await askOracle(input.message, input.conversationId);
          return { text: reply.text, conversationId: reply.conversationId, live: true as const };
        } catch (err) {
          console.error("[Oracle] live ask failed:", err);
          return {
            text: "…the stardust veil flickers — the oracle's voice is faint right now. Wander the constellation a while and ask again.",
            conversationId: input.conversationId ?? null,
            live: false as const,
          };
        }
      }),
  }),

  /**
   * Evolution — the forest's self-ontogenetic autoresearch loop.
   * Each KSM cycle (zone reveal) is one experiment: hypothesis (latent tagline)
   * → mutation (live oracle lore, cached forever per zone per expedition)
   * → metric (wholeness) → verdict (keep). The ledger is the forest's results.tsv.
   */
  evolution: router({
    /** Full ledger for an expedition, oldest cycle first */
    ledger: publicProcedure
      .input(z.object({ expeditionId: z.string().min(4).max(32) }))
      .query(({ input }) => listEvolutionCycles(input.expeditionId)),

    /**
     * Run one evolution cycle for a zone reveal. Fetches live oracle lore the
     * first time (rate-limit-aware), caches it in the ledger row, and returns
     * the recorded experiment. Idempotent per (expeditionId, zoneId).
     */
    runCycle: publicProcedure
      .input(
        z.object({
          expeditionId: z.string().min(4).max(32),
          zoneId: zoneIdSchema,
          cycleNumber: z.number().int().min(1).max(1000),
          wholenessAfter: z.number().int().min(0).max(100),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const seed = ZONE_SEED[input.zoneId];
        if (!seed) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown centre." });
        }

        // Idempotency: the same zone never runs two experiments in one expedition
        const existing = await getCycleForZone(input.expeditionId, input.zoneId);
        if (existing) return { cycle: existing, cached: true as const };

        // Mutation text: try the live oracle once; fall back to seed lore.
        let mutation = seed.lore;
        let liveOracle = 0;
        const rlKey = ctx.user ? `u:${ctx.user.id}` : `ip:${ctx.req.ip ?? "anon"}`;
        if (isOracleConfigured() && allowOracleAsk(`evo:${rlKey}`, 13, 5 * 60_000)) {
          try {
            // Ledger-aware prompt: past experiments become memory the oracle weaves from.
            const priorCycles = await listEvolutionCycles(input.expeditionId);
            const reply = await askOracle(
              buildEvolutionPrompt(seed, priorCycles),
              null,
              20_000,
            );
            if (reply.text.length > 20) {
              mutation = reply.text;
              liveOracle = 1;
            }
          } catch (err) {
            console.warn("[Evolution] live lore failed, using seed lore:", err);
          }
        }

        const cycle = await insertEvolutionCycle({
          userId: ctx.user?.id ?? null,
          expeditionId: input.expeditionId,
          cycleNumber: input.cycleNumber,
          zoneId: input.zoneId,
          hypothesis: seed.tagline,
          mutation,
          liveOracle,
          wholenessAfter: input.wholenessAfter,
          verdict: "keep",
        });
        return { cycle, cached: false as const };
      }),

    /** Reset the ledger when an expedition restarts */
    resetLedger: publicProcedure
      .input(z.object({ expeditionId: z.string().min(4).max(32) }))
      .mutation(async ({ input }) => {
        await deleteEvolutionCycles(input.expeditionId);
        return { success: true } as const;
      }),
  }),

  /** Kayla's Grove — memorial guestbook (public read/write, admin remove) */
  grove: router({
    tributes: publicProcedure.query(() => listTributes()),

    leaveTribute: publicProcedure
      .input(
        z.object({
          authorName: z.string().trim().min(1, "Please tell us your name.").max(80),
          message: z
            .string()
            .trim()
            .min(2, "A tribute needs at least a few words.")
            .max(2000, "Tributes are limited to 2000 characters."),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return insertTribute({
          authorName: input.authorName,
          message: input.message,
          userId: ctx.user?.id ?? null,
        });
      }),

    removeTribute: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the keeper of the grove may remove tributes.",
          });
        }
        await deleteTribute(input.id);
        return { success: true } as const;
      }),
  }),

  /**
   * The System Ladder — Campbell's Systems of the Cosmic Order indexed by
   * OEIS A000081 with sys(N) = a(N+1). Public registry of the nine strata
   * plus the mapping of game features to their stratum.
   * Canon: reference/SYSTEM-LADDER.md
   */
  ladder: router({
    systems: publicProcedure.query(() => listCosmicSystems()),
    features: publicProcedure.query(() => listSystemFeatures()),
  }),

  /** Cartographer's Field Notes — S3-backed uploads pinned to zones */
  fieldNotes: router({
    list: protectedProcedure.query(({ ctx }) => listFieldNotes(ctx.user.id)),

    upload: protectedProcedure
      .input(
        z.object({
          zoneId: zoneIdSchema,
          fileName: z.string().min(1).max(255),
          mimeType: z.string().min(3).max(127),
          /** base64-encoded file content */
          dataBase64: z.string().min(1),
          caption: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ALLOWED_MIME.has(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The oracle only accepts images, PDF scrolls, or plain-text notes.",
          });
        }
        const buffer = Buffer.from(input.dataBase64, "base64");
        if (buffer.byteLength === 0 || buffer.byteLength > MAX_UPLOAD_BYTES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Field note must be between 1 byte and 8 MB.",
          });
        }
        const safeName = input.fileName
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/\.{2,}/g, "_")
          .replace(/^[._]+/, "");
        const fileKey = `field-notes/${ctx.user.id}/${input.zoneId}/${Date.now()}-${safeName}`;
        const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
        const note = await insertFieldNote({
          userId: ctx.user.id,
          zoneId: input.zoneId,
          fileKey: key,
          url,
          fileName: input.fileName,
          mimeType: input.mimeType,
          caption: input.caption ?? null,
        });
        return note ?? { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await deleteFieldNote(input.id, ctx.user.id);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
