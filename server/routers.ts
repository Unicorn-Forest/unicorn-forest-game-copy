import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  deleteFieldNote,
  deleteGameSave,
  getGameSave,
  insertFieldNote,
  listFieldNotes,
  upsertGameSave,
} from "./db";
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
