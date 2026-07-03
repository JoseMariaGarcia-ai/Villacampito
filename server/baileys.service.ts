// server/baileys.service.ts
// WhatsApp connection via Baileys.
// Auth state is persisted in MySQL so Railway deploys don't need a QR rescan.
// When a message arrives:
//   1. Save it to DB
//   2. If AI is enabled (global + per-conversation), call Claude Sonnet
//   3. Send Claude's reply back via WhatsApp and save it to DB

import type { WASocket } from "@whiskeysockets/baileys";
import {
  getOrCreateConversation,
  saveMessage,
  updateConversationPreview,
  getAiGlobalEnabled,
  getSession,
  saveSession,
  deleteSession,
  deleteAllSessions,
} from "./whatsapp.db";
import { generateReply } from "./claude.service";
import { createClientIfNotExists } from "./db";

const AUTH_KEY_PREFIX = "baileys-auth-";

// Lazy import to avoid loading Baileys until the service starts
let sock: WASocket | null = null;
let qrCode: string | null = null;
let connectionStatus: "disconnected" | "connecting" | "open" = "disconnected";
let isStarting = false;

export function getConnectionStatus() {
  return connectionStatus;
}

export function getCurrentQR() {
  return qrCode;
}

/** @deprecated kept for router compatibility — QR image is now rendered client-side */
export function getCurrentQRImage() {
  return null;
}

export function getSocket() {
  return sock;
}

/** Wipe stored Baileys credentials so the next startBaileys() gets a fresh QR pairing */
export async function resetBaileysSession() {
  if (sock) {
    try {
      sock.end(undefined);
    } catch {
      // ignore errors closing a stale socket
    }
    sock = null;
  }
  await deleteAllSessions(AUTH_KEY_PREFIX);
  connectionStatus = "disconnected";
  qrCode = null;
  console.log("[Baileys] Session reset — credentials wiped");
}

/** DB-backed auth state adapter for Baileys */
async function makeDbAuthState() {
  const { initAuthCreds, BufferJSON } = await import("@whiskeysockets/baileys");
  const KEY_PREFIX = AUTH_KEY_PREFIX;

  // Baileys keys contain Uint8Array/Buffer values (noiseKey.public, etc).
  // Plain JSON.stringify/parse loses that structure, so we must use
  // Baileys' own BufferJSON replacer/reviver to round-trip them correctly.
  const readData = async (id: string) => {
    const row = await getSession(KEY_PREFIX + id);
    if (!row) return null;
    try {
      return JSON.parse(row.data, BufferJSON.reviver);
    } catch {
      return null;
    }
  };

  const writeData = async (id: string, data: unknown) => {
    await saveSession(KEY_PREFIX + id, JSON.stringify(data, BufferJSON.replacer));
  };

  const removeData = async (id: string) => {
    await deleteSession(KEY_PREFIX + id);
  };

  // Baileys useMultiFileAuthState interface implemented over DB.
  // If there's no saved session yet (first run), generate fresh initial
  // credentials — Baileys needs a valid creds object, not null.
  const savedCreds = await readData("creds");
  const creds = savedCreds ?? initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: Record<string, unknown> = {};
          await Promise.all(
            ids.map(async (id) => {
              const val = await readData(`${type}-${id}`);
              if (val) data[id] = val;
            })
          );
          return data;
        },
        set: async (data: Record<string, Record<string, unknown>>) => {
          await Promise.all(
            Object.entries(data).flatMap(([type, ids]) =>
              Object.entries(ids).map(([id, val]) =>
                val ? writeData(`${type}-${id}`, val) : removeData(`${type}-${id}`)
              )
            )
          );
        },
      },
    },
    saveCreds: async (creds: unknown) => {
      await writeData("creds", creds);
    },
  };
}

export async function startBaileys() {
  const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = await import("@whiskeysockets/baileys");

  // Prevent overlapping connection attempts (e.g. multiple reconnect clicks,
  // or a redeploy racing with an in-flight connection). Each unclosed
  // socket consumes a WhatsApp linked-device slot even if never fully
  // authenticated, so we always tear down any previous socket first.
  if (isStarting) {
    console.log("[Baileys] Start already in progress, skipping duplicate call");
    return sock;
  }
  isStarting = true;

  if (sock) {
    try {
      sock.end(undefined);
    } catch {
      // ignore errors closing a stale socket
    }
    sock = null;
  }

  connectionStatus = "connecting";
  qrCode = null;

  let saveCreds: (creds: unknown) => Promise<void>;

  try {
    console.log("[Baileys] Fetching WA version...");
    let version: [number, number, number];
    try {
      const result = await fetchLatestBaileysVersion();
      version = result.version;
      console.log("[Baileys] WA version:", version);
    } catch (err) {
      console.warn("[Baileys] fetchLatestBaileysVersion failed, using fallback:", err);
      version = [2, 3000, 1023456789];
    }

    console.log("[Baileys] Loading auth state...");
    const authState = await makeDbAuthState();
    saveCreds = authState.saveCreds;

    console.log("[Baileys] Creating socket...");
    sock = makeWASocket({
      version,
      auth: authState.state,
      logger: (await import("pino")).default({ level: "silent" }),
      browser: ["Villa Campito", "Chrome", "1.0.0"],
    });
    console.log("[Baileys] Socket created, waiting for QR or connection...");
  } catch (err) {
    console.error("[Baileys] Failed to start:", err);
    connectionStatus = "disconnected";
    isStarting = false;
    return null;
  }
  isStarting = false;

  // Persist credentials on every update
  sock.ev.on("creds.update", saveCreds);

  // Handle connection state changes
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionStatus = "connecting";
      console.log("[Baileys] QR code ready — scan with WhatsApp");
    }

    if (connection === "open") {
      qrCode = null;
      connectionStatus = "open";
      console.log("[Baileys] Connected to WhatsApp");
    }

    if (connection === "close") {
      connectionStatus = "disconnected";
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[Baileys] Disconnected. statusCode=${statusCode} error=${lastDisconnect?.error?.message} reconnect=${shouldReconnect}`);
      if (shouldReconnect) {
        // Wait long enough that a QR just shown to the user has a real chance
        // to be scanned before we tear it down and issue a new one. A short
        // delay here was causing the QR to refresh every few seconds if the
        // socket kept closing right after pairing began.
        setTimeout(() => startBaileys(), 60_000);
      }
    }
  });

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
    if (type !== "notify") return;

    for (const msg of msgs) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid) continue;

      // Extract text from various message types
      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.buttonsResponseMessage?.selectedDisplayText ||
        msg.message.listResponseMessage?.title ||
        "";

      if (!body) continue;

      // Derive phone and name
      const phone = jid.split("@")[0];
      const pushName = msg.pushName ?? phone;

      try {
        // Persist conversation + message
        const conversation = await getOrCreateConversation(jid, pushName, phone);
        await saveMessage(conversation.id, "inbound", body, msg.key.id ?? undefined);
        await updateConversationPreview(conversation.id, body, true);

        // Auto-register the sender in the clients directory (skipped if phone already exists)
        await createClientIfNotExists({ name: pushName, phone });

        // Check AI switches
        const globalEnabled = await getAiGlobalEnabled();
        if (!globalEnabled || !conversation.aiEnabled) continue;

        // Generate and send AI reply
        const reply = await generateReply(conversation.id, body);
        await sock!.sendMessage(jid, { text: reply });
        await saveMessage(conversation.id, "outbound_ai", reply);
        await updateConversationPreview(conversation.id, reply, false);
      } catch (err) {
        console.error("[Baileys] Error processing message:", err);
      }
    }
  });

  return sock;
}

/** Send a manual message from the /admin panel */
export async function sendManualMessage(jid: string, text: string) {
  if (!sock || connectionStatus !== "open") {
    throw new Error("WhatsApp not connected");
  }
  await sock.sendMessage(jid, { text });
}

/**
 * Sends a one-off test message (optionally with an image) to a single phone
 * number, bypassing the campaign queue/pacing entirely — used from the
 * Campaigns panel to verify a message looks right before a bulk send.
 */
export async function sendTestMessage(phone: string, text: string, imageUrl?: string) {
  if (!sock || connectionStatus !== "open") {
    throw new Error("WhatsApp no está conectado");
  }
  const jid = `${phone}@s.whatsapp.net`;
  if (imageUrl) {
    const { readStoredFile } = await import("./storage");
    const imageBuffer = await readStoredFile(imageUrl);
    await sock.sendMessage(jid, { image: imageBuffer, caption: text });
  } else {
    await sock.sendMessage(jid, { text });
  }
}

/* ── Bulk campaign processor ──────────────────────────────────────────────
 * Anti-ban strategy for mass sends:
 *   1. Randomized delay between messages, centered on ~2 minutes (90-150s),
 *      instead of a fixed interval that looks robotic to WhatsApp.
 *   2. Recipients are shuffled at campaign creation (see whatsapp.db.ts),
 *      so sends don't follow a predictable list order.
 *   3. Extra "batch pause" of 5-10 minutes every 25 messages, mimicking a
 *      human taking a break rather than a script running non-stop.
 *   4. Daily send cap — refuses to send once DAILY_CAMPAIGN_LIMIT is hit
 *      in a rolling 24h window, resuming automatically the next day.
 *   5. Only sends within business hours (9:00-22:00, Europe/Madrid) —
 *      outside that window sends are held and retried on the next tick.
 *   6. Only sends while the WhatsApp socket is actually connected.
 */

const CAMPAIGN_MIN_GAP_MS = 90_000;
const CAMPAIGN_MAX_GAP_MS = 150_000;
const CAMPAIGN_BATCH_SIZE = 25;
const CAMPAIGN_BATCH_PAUSE_MIN_MS = 5 * 60_000;
const CAMPAIGN_BATCH_PAUSE_MAX_MS = 10 * 60_000;
const DAILY_CAMPAIGN_LIMIT = 300;
const SENDING_HOUR_START = 9;
const SENDING_HOUR_END = 22;
const CAMPAIGN_TIMEZONE = "Europe/Madrid";

let campaignNextAllowedAt = 0;
let campaignSentSinceBatch = 0;
let campaignProcessorStarted = false;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function isWithinSendingHours(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: CAMPAIGN_TIMEZONE }).format(new Date())
  );
  return hour >= SENDING_HOUR_START && hour < SENDING_HOUR_END;
}

async function processCampaignQueue() {
  try {
    if (Date.now() < campaignNextAllowedAt) return;
    if (!sock || connectionStatus !== "open") return;
    if (!isWithinSendingHours()) return;

    const { getNextPendingRecipient, markRecipientSent, markRecipientFailed, getCampaignSentCountLast24h } =
      await import("./whatsapp.db");

    const sentToday = await getCampaignSentCountLast24h();
    if (sentToday >= DAILY_CAMPAIGN_LIMIT) return;

    const recipient = await getNextPendingRecipient();
    if (!recipient) return;

    const jid = `${recipient.phone}@s.whatsapp.net`;
    try {
      if (recipient.campaignImageUrl) {
        // Read the actual image bytes and send them embedded in the message
        // (not a URL) so it arrives as a photo, not a download link.
        const { readStoredFile } = await import("./storage");
        const imageBuffer = await readStoredFile(recipient.campaignImageUrl);
        await sock.sendMessage(jid, { image: imageBuffer, caption: recipient.campaignMessage });
      } else {
        await sock.sendMessage(jid, { text: recipient.campaignMessage });
      }
      await markRecipientSent(recipient.id, recipient.campaignId);
      console.log(`[Campaign] Sent to ${recipient.phone} (campaign ${recipient.campaignId})`);
    } catch (err) {
      console.error(`[Campaign] Failed to send to ${recipient.phone}:`, err);
      await markRecipientFailed(recipient.id);
    }

    campaignSentSinceBatch++;
    if (campaignSentSinceBatch >= CAMPAIGN_BATCH_SIZE) {
      campaignSentSinceBatch = 0;
      campaignNextAllowedAt = Date.now() + randomBetween(CAMPAIGN_BATCH_PAUSE_MIN_MS, CAMPAIGN_BATCH_PAUSE_MAX_MS);
      console.log("[Campaign] Batch pause triggered to mimic human sending pattern");
    } else {
      campaignNextAllowedAt = Date.now() + randomBetween(CAMPAIGN_MIN_GAP_MS, CAMPAIGN_MAX_GAP_MS);
    }
  } catch (err) {
    console.error("[Campaign] Processor error:", err);
  }
}

/** Starts the interval that paces campaign sends. Safe to call once at server startup. */
export function startCampaignProcessor() {
  if (campaignProcessorStarted) return;
  campaignProcessorStarted = true;
  setInterval(processCampaignQueue, 15_000);
  console.log("[Campaign] Processor started");
}
