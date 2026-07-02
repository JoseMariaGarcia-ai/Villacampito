import { eq, desc, asc, like } from "drizzle-orm";
import { getDb } from "./db";
import {
  whatsappSessions,
  whatsappConversations,
  whatsappMessages,
  villaPrompt,
  villaKnowledge,
  villaSettings,
  type WhatsappConversation,
  type WhatsappMessage,
} from "../drizzle/schema";

/* ── Baileys session persistence ── */

export async function getSession(id: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(whatsappSessions).where(eq(whatsappSessions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function saveSession(id: string, data: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(whatsappSessions)
    .values({ id, data })
    .onDuplicateKeyUpdate({ set: { data } });
}

export async function deleteSession(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(whatsappSessions).where(eq(whatsappSessions.id, id));
}

/** Wipe all persisted Baileys auth data (creds + keys) to force a fresh QR pairing */
export async function deleteAllSessions(prefix: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(whatsappSessions).where(like(whatsappSessions.id, `${prefix}%`));
}

/* ── Conversations ── */

export async function getOrCreateConversation(jid: string, name?: string, phone?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.jid, jid))
    .limit(1);

  if (existing[0]) return existing[0];

  await db.insert(whatsappConversations).values({
    jid,
    name: name ?? null,
    phone: phone ?? null,
  });

  const created = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.jid, jid))
    .limit(1);

  return created[0];
}

export async function getAllConversations(): Promise<WhatsappConversation[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(whatsappConversations)
    .orderBy(desc(whatsappConversations.lastMessageAt));
}

export async function updateConversationPreview(
  conversationId: number,
  preview: string,
  incrementUnread = false
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(whatsappConversations)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: preview.slice(0, 300),
      ...(incrementUnread ? { unreadCount: undefined } : {}),
    })
    .where(eq(whatsappConversations.id, conversationId));

  if (incrementUnread) {
    await db.execute(
      `UPDATE whatsappConversations SET unreadCount = unreadCount + 1 WHERE id = ${conversationId}`
    );
  }
}

export async function markConversationRead(conversationId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(whatsappConversations)
    .set({ unreadCount: 0 })
    .where(eq(whatsappConversations.id, conversationId));
}

export async function setConversationAi(conversationId: number, enabled: boolean) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(whatsappConversations)
    .set({ aiEnabled: enabled })
    .where(eq(whatsappConversations.id, conversationId));
}

/* ── Messages ── */

export async function saveMessage(
  conversationId: number,
  role: WhatsappMessage["role"],
  body: string,
  waMessageId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(whatsappMessages).values({
    conversationId,
    role,
    body,
    waMessageId: waMessageId ?? null,
  });
}

export async function getMessages(
  conversationId: number,
  limit = 50
): Promise<WhatsappMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId))
    .orderBy(asc(whatsappMessages.createdAt))
    .limit(limit);
}

/** Returns last N messages formatted for Claude's messages array. */
export async function getMessagesForClaude(
  conversationId: number,
  limit = 20
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const msgs = await getMessages(conversationId, limit);
  return msgs.map((m) => ({
    role: m.role === "inbound" ? "user" : "assistant",
    content: m.body,
  }));
}

/* ── Villa prompt & knowledge base ── */

const DEFAULT_PROMPT = `Eres el asistente virtual de Villa Campito, una villa de lujo en El Puerto de Santa María (Cádiz). 
Tu objetivo es atender consultas de clientes de forma amable y profesional en español.
Puedes informar sobre disponibilidad, precios, características de la villa y gestionar reservas.
Cuando un cliente quiera reservar, confirma las fechas y recuérdales que el pago se gestiona directamente con el propietario.
Sé conciso, cálido y usa un tono cercano pero profesional.`;

const DEFAULT_KNOWLEDGE = `# Villa Campito — Información general

## Características
- Capacidad: hasta 8 personas
- Piscina privada
- Jacuzzi
- Cabaña de bambú
- Ubicación: El Puerto de Santa María, Cádiz

## Normas
- No se permiten mascotas
- No se permiten fiestas
- Check-in: 17:00h | Check-out: 12:00h

## Contacto
- Para reservas y pagos contactar directamente con el propietario`;

export async function getVillaPrompt(): Promise<string> {
  const db = await getDb();
  if (!db) return DEFAULT_PROMPT;
  const rows = await db.select().from(villaPrompt).where(eq(villaPrompt.id, 1)).limit(1);
  return rows[0]?.prompt ?? DEFAULT_PROMPT;
}

export async function setVillaPrompt(prompt: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(villaPrompt)
    .values({ id: 1, prompt })
    .onDuplicateKeyUpdate({ set: { prompt } });
}

export async function getVillaKnowledge(): Promise<string> {
  const db = await getDb();
  if (!db) return DEFAULT_KNOWLEDGE;
  const rows = await db.select().from(villaKnowledge).where(eq(villaKnowledge.id, 1)).limit(1);
  return rows[0]?.content ?? DEFAULT_KNOWLEDGE;
}

export async function setVillaKnowledge(content: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(villaKnowledge)
    .values({ id: 1, content })
    .onDuplicateKeyUpdate({ set: { content } });
}

/* ── Global AI switch ── */

export async function getAiGlobalEnabled(): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  const rows = await db.select().from(villaSettings).where(eq(villaSettings.id, 1)).limit(1);
  return rows[0]?.aiGlobalEnabled ?? true;
}

export async function setAiGlobalEnabled(enabled: boolean) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(villaSettings)
    .values({ id: 1, aiGlobalEnabled: enabled })
    .onDuplicateKeyUpdate({ set: { aiGlobalEnabled: enabled } });
}
