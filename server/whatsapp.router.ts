// server/whatsapp.router.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";
import {
  getAllConversations,
  getMessages,
  saveMessage,
  markConversationRead,
  setConversationAi,
  getVillaPrompt,
  setVillaPrompt,
  getVillaKnowledge,
  setVillaKnowledge,
  getAiGlobalEnabled,
  setAiGlobalEnabled,
} from "./whatsapp.db";
import {
  getConnectionStatus,
  getCurrentQR,
  getCurrentQRImage,
  sendManualMessage,
  startBaileys,
} from "./baileys.service";

const adminProcedure = publicProcedure
  .input(z.object({ password: z.string() }).passthrough())
  .use(({ input, next }) => {
    if ((input as any).password !== ENV.adminPassword) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
    }
    return next();
  });

export const whatsappRouter = router({

  // ── Connection status ──────────────────────────────────────────────────────

  status: adminProcedure.query(() => ({
    status: getConnectionStatus(),
    qr: getCurrentQR(),
    qrImage: getCurrentQRImage(),
  })),

  reconnect: adminProcedure.mutation(async () => {
    await startBaileys();
    return { ok: true };
  }),

  // ── Conversations ──────────────────────────────────────────────────────────

  conversations: adminProcedure.query(async () => {
    return getAllConversations();
  }),

  markRead: adminProcedure
    .input(z.object({ password: z.string(), conversationId: z.number() }))
    .mutation(async ({ input }) => {
      await markConversationRead(input.conversationId);
      return { ok: true };
    }),

  setConversationAi: adminProcedure
    .input(z.object({ password: z.string(), conversationId: z.number(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      await setConversationAi(input.conversationId, input.enabled);
      return { ok: true };
    }),

  // ── Messages ───────────────────────────────────────────────────────────────

  messages: adminProcedure
    .input(z.object({ password: z.string(), conversationId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return getMessages(input.conversationId, input.limit);
    }),

  sendMessage: adminProcedure
    .input(z.object({ password: z.string(), jid: z.string(), text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Find conversation id by jid
      const convs = await getAllConversations();
      const conv = convs.find((c) => c.jid === input.jid);
      if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversación no encontrada" });

      await sendManualMessage(input.jid, input.text);
      await saveMessage(conv.id, "outbound_manual", input.text);
      return { ok: true };
    }),

  // ── AI configuration ───────────────────────────────────────────────────────

  getAiConfig: adminProcedure.query(async () => {
    const [prompt, knowledge, globalEnabled] = await Promise.all([
      getVillaPrompt(),
      getVillaKnowledge(),
      getAiGlobalEnabled(),
    ]);
    return { prompt, knowledge, globalEnabled };
  }),

  setPrompt: adminProcedure
    .input(z.object({ password: z.string(), prompt: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await setVillaPrompt(input.prompt);
      return { ok: true };
    }),

  setKnowledge: adminProcedure
    .input(z.object({ password: z.string(), content: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await setVillaKnowledge(input.content);
      return { ok: true };
    }),

  setGlobalAi: adminProcedure
    .input(z.object({ password: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      await setAiGlobalEnabled(input.enabled);
      return { ok: true };
    }),
});
