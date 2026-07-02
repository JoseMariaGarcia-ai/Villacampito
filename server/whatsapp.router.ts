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
  createCampaign,
  getAllCampaigns,
  getCampaignRecipients,
  setCampaignStatus,
  cancelCampaign,
} from "./whatsapp.db";
import { getAllClients } from "./db";
import {
  getConnectionStatus,
  getCurrentQR,
  getCurrentQRImage,
  sendManualMessage,
  startBaileys,
  resetBaileysSession,
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

  resetSession: adminProcedure.mutation(async () => {
    await resetBaileysSession();
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

  // ── Bulk campaigns ──────────────────────────────────────────────────────────

  campaigns: router({
    getAll: adminProcedure.query(async () => {
      return getAllCampaigns();
    }),

    recipients: adminProcedure
      .input(z.object({ password: z.string(), campaignId: z.number() }))
      .query(async ({ input }) => {
        return getCampaignRecipients(input.campaignId);
      }),

    /** Creates and immediately starts a campaign for the given clients (all-clients or a filtered subset) */
    create: adminProcedure
      .input(z.object({
        password: z.string(),
        message: z.string().min(1, "El mensaje es obligatorio"),
        clientIds: z.array(z.number()).min(1, "Selecciona al menos un cliente"),
      }))
      .mutation(async ({ input }) => {
        const all = await getAllClients();
        const selected = all.filter((c) => input.clientIds.includes(c.id));
        if (selected.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No se encontraron los clientes seleccionados" });
        }
        const campaign = await createCampaign(
          input.message,
          selected.map((c) => ({ name: c.name, phone: c.phone }))
        );
        return { campaign };
      }),

    pause: adminProcedure
      .input(z.object({ password: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        await setCampaignStatus(input.id, "paused");
        return { ok: true };
      }),

    resume: adminProcedure
      .input(z.object({ password: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        await setCampaignStatus(input.id, "running");
        return { ok: true };
      }),

    cancel: adminProcedure
      .input(z.object({ password: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        await cancelCampaign(input.id);
        return { ok: true };
      }),
  }),
});
