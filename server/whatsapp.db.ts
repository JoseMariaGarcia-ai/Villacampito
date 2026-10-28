import { eq, desc, asc, like, and, gte, sql as rawSql } from "drizzle-orm";
import { getDb } from "./db";
import {
  whatsappSessions,
  whatsappConversations,
  whatsappMessages,
  villaPrompt,
  villaKnowledge,
  villaSettings,
  campaigns,
  campaignRecipients,
  type WhatsappConversation,
  type WhatsappMessage,
  type Campaign,
  type CampaignRecipient,
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

const DEFAULT_PROMPT = `Eres el asistente virtual de Villa Campito, una villa de alquiler vacacional en El Puerto de Santa María (Cádiz).
Tu objetivo es atender consultas de clientes por WhatsApp de forma amable, cercana y profesional, siempre en español.

Puedes informar con precisión sobre: características de la villa, tarifas por temporada (usa SIEMPRE las tarifas de la base de conocimientos, nunca inventes precios), normas de la casa, disponibilidad general y zonas turísticas de interés.

Importante sobre tarifas: usa EXCLUSIVAMENTE los precios que aparecen literalmente en la base de conocimientos para cada periodo, nunca los deduzcas ni los inventes combinando otros precios. Si para un periodo solo aparece "Fin de semana 2 días" y "3 días" (sin precio de Viernes, Sábado o Domingo por separado), significa que NO se alquila una sola noche suelta en fin de semana: la estancia mínima de fin de semana es de 2 días. No ofrezcas ni calcules un precio de "1 noche" usando el precio de día entre semana ni ningún otro cálculo propio.

Para disponibilidad: en el sistema se te proporciona una sección "Fechas ocupadas" con el calendario real actualizado. Si te preguntan por una fecha concreta, compárala siempre con esa lista: si la fecha está en "Fechas ocupadas", dile claramente al cliente que esa fecha NO está disponible. Si la fecha NO aparece en la lista, dile que a priori está disponible, pero que la confirmación final la hace tu compañero.

Cuando un cliente quiera reservar: pídele fechas y número de personas, indícale la tarifa correspondiente según la base de conocimientos si puedes, y luego dile textualmente algo como "Le paso tu solicitud a mi compañero y te escribe lo antes posible para confirmar la reserva". No confirmes ni bloquees reservas tú mismo.

Si te preguntan algo que no está en la base de conocimientos ni en las fechas ocupadas (por ejemplo dirección exacta, precio de un festivo especial, o cualquier otro dato que no tengas), no inventes la respuesta: dile que le pasas la consulta a tu compañero y que le escribirá lo antes posible.

Sé conciso (evita respuestas muy largas en WhatsApp), cálido y resolutivo.`;

const DEFAULT_KNOWLEDGE = `# Villa Campito — El Puerto de Santa María, Cádiz

## Resumen
Villa de alquiler vacacional situada en El Puerto de Santa María (Cádiz), en la zona de Cantarranas. Cuenta con piscina de 3 alturas, jacuzzi, chozo de bambú africano y jardín privado. Capacidad hasta 8 personas durmiendo (hasta 15 personas disfrutando de las instalaciones en eventos de día).

## Características exteriores
- Piscina con 3 alturas
- Jacuzzi de agua fría
- Bar integrado en la piscina
- Cama balinesa
- Chozo de bambú africano
- Zona de barbacoa
- Equipo de música exterior
- Iluminación con domótica
- Jardín con palmeras

## Características interiores
- 3 habitaciones (una con cama de matrimonio, otra con literas, otra con dos camas)
- Sofá cama en el salón
- 1 baño completo + 2 aseos
- Aire acondicionado y calefacción
- Ventiladores en todas las habitaciones
- Wifi
- TV de 55 pulgadas
- Garaje privado
- Cocina completamente equipada
- Cuna y trona para bebés disponibles
- Se admiten mascotas

## Check-in / Check-out
- Check-in: 14:00h
- Check-out: 10:00h (consultar posibilidad de otros horarios)

## Tarifas 2026 (en euros, por estancia salvo que se indique otra cosa)

### Enero — Febrero — Marzo / Octubre — Noviembre — Diciembre
- Día entre semana: 250€ (más de 1 día: consultar)
- Viernes: 350€ | Sábado: 350€ | Domingo: 250€
- Fin de semana 2 días: 550€ | 3 días: 650€
- Semanas y quincenas: consultar

### Abril
- Día entre semana: 250€ (más de 1 día: consultar)
- Viernes: 450€ | Sábado: 450€ | Domingo: 300€
- Fin de semana 2 días: 650€ | 3 días: 750€
- Semanas y quincenas: consultar

### 1 Mayo — 11 Junio
- Día entre semana: 350€ (más de 1 día: consultar)
- Fin de semana 2 días: 1.050€ | 3 días: 1.250€
- Semana (lunes a lunes): 2.050€
- Quincenas: consultar

### 12 Junio — 3 Agosto
- Día entre semana: 450€ (más de 1 día: consultar)
- Fin de semana 2 días: 1.550€ | 3 días: 1.850€
- Semana (lunes a lunes): 3.050€
- Quincenas: consultar

### Agosto (todo el mes)
- Día entre semana: 450€ (más de 1 día: consultar)
- Fin de semana 2 días: 1.650€ | 3 días: 2.050€
- Semana (lunes a lunes): 3.500€
- Quincenas: consultar

### 1 — 15 Septiembre
- Día entre semana: 350€ (más de 1 día: consultar)
- Fin de semana 2 días: 1.250€ | 3 días: 1.550€
- Semana (lunes a lunes): 2.050€
- Quincenas: consultar

### 15 — 30 Septiembre
- Día entre semana: 250€ (más de 1 día: consultar)
- Fin de semana 2 días: 1.050€ | 3 días: 1.250€
- Semana (lunes a lunes): 1.550€
- Quincenas: consultar

## Tarifas 2027
Mismas tarifas que 2026 con estas fechas ajustadas: 1 Mayo–13 Junio (como 1 Mayo–11 Junio 2026), 14 Junio–30 Julio (como 12 Junio–3 Agosto 2026), 1–12 Septiembre (como 1–15 Septiembre 2026), 13–30 Septiembre (como 15–30 Septiembre 2026). Enero-Marzo, Abril, Agosto y Octubre-Diciembre son iguales que 2026.

## Fechas especiales
Puentes, Navidad, Fin de Año, Festivos, Mundial de Motociclismo, Puro Latino y Feria tienen precios especiales — siempre hay que consultar con el propietario, no dar un precio de las tablas normales para esas fechas.

## Contacto
- WhatsApp / reservas: +34 640 723 374 (este mismo número)
- El pago y la confirmación definitiva de la reserva se gestionan directamente con el propietario.

## Zona — El Puerto de Santa María (información turística para huéspedes)
### Qué ver
- Castillo de San Marcos (fortaleza del s. XIII)
- Ribera del Marisco (paseo de bares de pescaíto frito y marisco)
- Plaza de Toros (una de las más grandes y antiguas de España)
- Bodegas Fundador (bodega de brandy más antigua de España)
- Parque Calderón (jardín junto al río)
- Iglesia Mayor Prioral

### Playas
- Playa de Valdelagrana (la más popular, urbana, con todos los servicios)
- Playa de La Puntilla (junto al puerto pesquero, ambiente familiar)
- Playa de Santa Catalina — Fuentebravía (más salvaje, buena para surf)

### Dónde comer
- Romerijo (icónico desde 1954, marisco y pescaíto frito)
- El Faro del Puerto (alta cocina gaditana)
- Casa Flores (pescados y mariscos en la Ribera del Marisco)
- Los Portales (cocina tradicional gaditana)

### Emergencias (información general, siempre recomendar llamar al 112 ante cualquier duda)
- Emergencias generales: 112
- Emergencias sanitarias: 061
- Policía Nacional: 091
- Policía Local: 092
- Guardia Civil: 062
- Bomberos: 080
- Hospital de referencia de la zona: Hospital de Jerez de la Frontera (SAS)

## Normas de la villa
- Normativa de ruidos: debe cumplirse en todo momento la normativa municipal de ruidos y emisiones acústicas
- Aparatos de sonido: prohibido introducir aparatos de sonido propios; la villa cuenta con uno propio limitado en volumen
- Reuniones familiares: se permiten reuniones familiares y de amigos para disfrutar de piscina, solárium, barbacoas e instalaciones
- Fiestas: totalmente prohibido cualquier tipo de fiesta que perturbe la convivencia vecinal
- Capacidad: hasta 8 personas durmiendo; hasta 15 personas disfrutando de las instalaciones
- Horarios: check-in 14:00h, check-out 10:00h (consultar otros horarios)
- Limpieza a la salida: la propiedad debe dejarse recogida y sin basura
- Fianza: inquilinos menores de 30 años deben dejar 500€ de fianza para garantizar el cumplimiento de las normas y posibles deterioros
- El incumplimiento de las normas puede suponer la pérdida total o parcial de la fianza`;

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

/* ── Bulk campaigns ── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Creates a campaign and its recipients in randomized order (anti-ban: no predictable send pattern). */
export async function createCampaign(
  message: string,
  recipients: { name: string; phone: string }[],
  imageUrl?: string | null
) {
  const db = await getDb();
  if (!db) return null;
  const shuffled = shuffle(recipients);
  const result = await db.insert(campaigns).values({
    message,
    imageUrl: imageUrl ?? null,
    totalRecipients: shuffled.length,
  });
  const campaignId = (result[0] as any).insertId;
  if (shuffled.length > 0) {
    await db.insert(campaignRecipients).values(
      shuffled.map((r) => ({ campaignId, name: r.name, phone: r.phone }))
    );
  }
  const rows = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  return rows[0] ?? null;
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignRecipients(campaignId: number): Promise<CampaignRecipient[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaignRecipients).where(eq(campaignRecipients.campaignId, campaignId)).orderBy(asc(campaignRecipients.id));
}

export async function setCampaignStatus(id: number, status: Campaign["status"]) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaigns).set({ status }).where(eq(campaigns.id, id));
}

/** Cancel a campaign: stop future sends, keep history of what was already sent. */
export async function cancelCampaign(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaigns).set({ status: "cancelled" }).where(eq(campaigns.id, id));
}

/**
 * Picks the single next recipient due to receive a campaign message, oldest
 * running campaign first (FIFO), oldest pending recipient within it.
 * Only one recipient is ever returned so the caller can pace sends globally.
 */
export async function getNextPendingRecipient(): Promise<
  (CampaignRecipient & { campaignMessage: string; campaignImageUrl: string | null }) | null
> {
  const db = await getDb();
  if (!db) return null;
  const runningCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, "running"))
    .orderBy(asc(campaigns.createdAt));

  for (const campaign of runningCampaigns) {
    const pending = await db
      .select()
      .from(campaignRecipients)
      .where(and(eq(campaignRecipients.campaignId, campaign.id), eq(campaignRecipients.status, "pending")))
      .orderBy(asc(campaignRecipients.id))
      .limit(1);
    if (pending[0]) {
      return { ...pending[0], campaignMessage: campaign.message, campaignImageUrl: campaign.imageUrl };
    }
    // No pending recipients left in this running campaign — mark it completed.
    await db.update(campaigns).set({ status: "completed" }).where(eq(campaigns.id, campaign.id));
  }
  return null;
}

export async function markRecipientSent(recipientId: number, campaignId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaignRecipients).set({ status: "sent", sentAt: new Date() }).where(eq(campaignRecipients.id, recipientId));
  await db.update(campaigns).set({ sentCount: rawSql`${campaigns.sentCount} + 1` }).where(eq(campaigns.id, campaignId));
}

export async function markRecipientFailed(recipientId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaignRecipients).set({ status: "failed" }).where(eq(campaignRecipients.id, recipientId));
}

/** Anti-ban daily cap: counts how many campaign messages were sent in the last 24h. */
export async function getCampaignSentCountLast24h(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ count: rawSql<number>`count(*)` })
    .from(campaignRecipients)
    .where(and(eq(campaignRecipients.status, "sent"), gte(campaignRecipients.sentAt, since)));
  return Number(rows[0]?.count ?? 0);
}
