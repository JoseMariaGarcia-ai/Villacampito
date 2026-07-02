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
} from "./whatsapp.db";
import { generateReply } from "./claude.service";

// Lazy import to avoid loading Baileys until the service starts
let sock: WASocket | null = null;
let qrCode: string | null = null;
let qrCodeDataUrl: string | null = null;
let connectionStatus: "disconnected" | "connecting" | "open" = "disconnected";
let isStarting = false;

export function getConnectionStatus() {
  return connectionStatus;
}

export function getCurrentQR() {
  return qrCode;
}

/** QR code rendered as a PNG data URL (data:image/png;base64,...), large and scannable */
export function getCurrentQRImage() {
  return qrCodeDataUrl;
}

export function getSocket() {
  return sock;
}

/** DB-backed auth state adapter for Baileys */
async function makeDbAuthState() {
  const { initAuthCreds } = await import("@whiskeysockets/baileys");
  const KEY_PREFIX = "baileys-auth-";

  const readData = async (id: string) => {
    const row = await getSession(KEY_PREFIX + id);
    if (!row) return null;
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  };

  const writeData = async (id: string, data: unknown) => {
    await saveSession(KEY_PREFIX + id, JSON.stringify(data));
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
  qrCodeDataUrl = null;

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await makeDbAuthState();

  sock = makeWASocket({
    version,
    auth: state,
    logger: (await import("pino")).default({ level: "silent" }),
    browser: ["Villa Campito", "Chrome", "1.0.0"],
  });
  isStarting = false;

  // Persist credentials on every update
  sock.ev.on("creds.update", saveCreds);

  // Handle connection state changes
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionStatus = "connecting";
      try {
        const QRCode = (await import("qrcode")).default;
        qrCodeDataUrl = await QRCode.toDataURL(qr, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        });
      } catch (err) {
        console.error("[Baileys] Failed to render QR image:", err);
        qrCodeDataUrl = null;
      }
      console.log("[Baileys] QR code ready — scan with WhatsApp");
    }

    if (connection === "open") {
      qrCode = null;
      qrCodeDataUrl = null;
      connectionStatus = "open";
      console.log("[Baileys] Connected to WhatsApp");
    }

    if (connection === "close") {
      connectionStatus = "disconnected";
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[Baileys] Disconnected (${statusCode}). Reconnect: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(() => startBaileys(), 5000);
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
