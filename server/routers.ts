import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  deleteFieldNote,
  deleteGameSave,
  deleteMemorialTrack,
  deleteTribute,
  getGameSave,
  insertFieldNote,
  insertMemorialTrack,
  insertTribute,
  listFieldNotes,
  listMemorialTracks,
  listTributes,
  upsertGameSave,
} from "./db";
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
