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
import { createClientIfNotExists, getDb } from "./db";

const AUTH_KEY_PREFIX = "baileys-auth-";

// Give up auto-reconnecting after this many consecutive failures and require
// a manual "Reconectar" click instead. Without this cap, a persistent
// failure (e.g. WhatsApp temporarily blocking this server's connection
// attempts) causes an infinite retry loop that hammers WhatsApp's servers
// non-stop — which itself can prolong or trigger such a block.
const MAX_AUTO_RECONNECT_ATTEMPTS = 3;

// Delay before an ordinary auto-reconnect. This used to be 60s "so the QR had
// time to be scanned", but a close event means the QR is already dead (the
// socket that issued it is gone), so waiting only leaves the panel showing
// "Desconectado" for a minute. The thing that *looked* like the QR refreshing
// too fast was the stale-socket loop fixed below, not this delay.
const RECONNECT_DELAY_MS = 15_000;

// If Baileys has emitted neither a QR nor "open" nor "close" this long after
// the socket was created, consider the attempt hung and tear it down.
const START_WATCHDOG_MS = 90_000;

// While the admin panel is open and polling `status`, allow it to kick a new
// connection attempt at most this often when we are sitting idle/disconnected.
const PANEL_KICKSTART_MIN_INTERVAL_MS = 60_000;

export type ConnectionStatus = "disconnected" | "connecting" | "open";

let sock: WASocket | null = null;
let qrCode: string | null = null;
let connectionStatus: ConnectionStatus = "disconnected";
let statusMessage: string | null = null;
let consecutiveFailures = 0;
let hasStoredSession = false;
let lastDisconnectCode: number | null = null;

// In-flight start, if any. Duplicate callers await/return this instead of
// creating a second socket.
let startPromise: Promise<WASocket | null> | null = null;
// Bumped by every start and by resetBaileysSession(); an in-flight start that
// observes a newer generation after an await aborts instead of finishing.
let startGeneration = 0;
let lastStartAt = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let watchdogTimer: NodeJS.Timeout | null = null;

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

/** Extra detail for the admin panel (shown under the status badge). */
export function getStatusDetails() {
  return {
    message: statusMessage,
    hasStoredSession,
    lastDisconnectCode,
    consecutiveFailures,
  };
}

export function getSocket() {
  return sock;
}

/* ── Auth write serialisation ──────────────────────────────────────────────
 * Baileys fires `creds.update` and `keys.set` from async event handlers, so
 * two upserts of the same row can be in flight at once on different pool
 * connections, with no ordering guarantee — the older write can win. We chain
 * writes per key so they apply in emission order, and keep the set of pending
 * writes so a reconnect can flush them before re-reading creds from MySQL.
 */
const pendingAuthWrites = new Map<string, Promise<void>>();

function enqueueAuthWrite(id: string, fn: () => Promise<void>): Promise<void> {
  const prev = pendingAuthWrites.get(id) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  pendingAuthWrites.set(id, next);
  next.finally(() => {
    if (pendingAuthWrites.get(id) === next) pendingAuthWrites.delete(id);
  }).catch(() => undefined);
  return next;
}

async function flushAuthWrites() {
  // Writes may enqueue more writes while we wait, so loop until drained.
  while (pendingAuthWrites.size > 0) {
    await Promise.allSettled(Array.from(pendingAuthWrites.values()));
  }
}

/** DB-backed auth state adapter for Baileys */
async function makeDbAuthState(logger: unknown, generation: number) {
  const { initAuthCreds, BufferJSON, makeCacheableSignalKeyStore } = await import("@whiskeysockets/baileys");
  const KEY_PREFIX = AUTH_KEY_PREFIX;

  // Without a DB, saveSession() silently drops every write. Pairing can then
  // never complete: WhatsApp forces a reconnect (515) right after the scan,
  // and the fresh socket would come up with brand-new creds the phone has
  // never seen. Better to refuse to start with a clear message.
  if (!(await getDb())) {
    throw new Error("DATABASE_URL no está configurada: no se puede persistir la sesión de WhatsApp");
  }

  // Baileys keys contain Uint8Array/Buffer values (noiseKey.public, etc).
  // Plain JSON.stringify/parse loses that structure, so we must use
  // Baileys' own BufferJSON replacer/reviver to round-trip them correctly.
  const readData = async (id: string) => {
    const row = await getSession(KEY_PREFIX + id);
    if (!row) return null;
    try {
      return JSON.parse(row.data, BufferJSON.reviver);
    } catch (err) {
      console.error(`[Baileys] Stored auth entry "${id}" is corrupt, ignoring:`, err);
      return null;
    }
  };

  const writeData = (id: string, data: unknown) => {
    // A socket that has been superseded (reset / newer start) must not write
    // its state back — it would resurrect creds we just wiped.
    if (generation !== startGeneration) return Promise.resolve();
    const serialized = JSON.stringify(data, BufferJSON.replacer);
    return enqueueAuthWrite(id, () => saveSession(KEY_PREFIX + id, serialized));
  };

  const removeData = (id: string) => {
    if (generation !== startGeneration) return Promise.resolve();
    return enqueueAuthWrite(id, () => deleteSession(KEY_PREFIX + id));
  };

  // If there's no saved session yet (first run), generate fresh initial
  // credentials — Baileys needs a valid creds object, not null.
  const savedCreds = await readData("creds");
  // A partial/corrupt creds row (see saveCreds below for how that used to
  // happen) is worse than none: Baileys would try to log in with an identity
  // the phone doesn't know. Only accept a row that has the core key material.
  const creds =
    savedCreds && savedCreds.noiseKey && savedCreds.signedIdentityKey && savedCreds.signedPreKey
      ? savedCreds
      : initAuthCreds();
  if (savedCreds && creds !== savedCreds) {
    console.warn("[Baileys] Stored creds are incomplete — starting a fresh pairing instead");
  }

  const rawKeyStore = {
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
  };

  return {
    state: {
      creds,
      // Wraps our raw DB-backed store with Baileys' recommended in-memory
      // cache layer — avoids redundant DB round-trips for the same signal
      // key during a single decrypt/encrypt cycle, matching the pattern
      // used by useMultiFileAuthState internally.
      keys: makeCacheableSignalKeyStore(rawKeyStore as any, logger as any),
    },
    // IMPORTANT: `creds.update` carries only the *changed fields* (e.g.
    // `{ me, account, platform }` on pair-success, or `{ nextPreKeyId: 31 }`).
    // Baileys applies that patch to the `creds` object in place before we
    // run, so we must persist the full `creds` object — not the event
    // payload. The previous version saved the payload, which left a partial
    // object in the DB; after the forced reconnect that follows every scan,
    // the socket came up with broken creds and the phone stayed stuck on
    // "Iniciando sesión…".
    saveCreds: () => writeData("creds", creds),
  };
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function clearWatchdog() {
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
}

function scheduleReconnect(delayMs: number) {
  clearReconnectTimer();
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBaileys().catch((err) => console.error("[Baileys] Scheduled reconnect failed:", err));
  }, delayMs);
}

/**
 * Detach our listeners and close a socket we no longer care about. Detaching
 * first matters: `end()` emits a final `connection.update { close }`, and if
 * our handler were still attached it would count a failure and schedule a
 * reconnect that tears down the *new* socket a few seconds later (this was
 * the loop that kept killing fresh QRs / half-finished pairings).
 */
function discardSocket(s: WASocket) {
  try {
    s.ev.removeAllListeners("connection.update");
    s.ev.removeAllListeners("creds.update");
    s.ev.removeAllListeners("messages.upsert");
  } catch {
    // ignore
  }
  try {
    s.end(undefined);
  } catch {
    // ignore errors closing a stale socket
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/** Wipe stored Baileys credentials so the next startBaileys() gets a fresh QR pairing */
export async function resetBaileysSession() {
  // Invalidate any in-flight start first, and wait for it to notice, so it
  // can't finish after we wipe the DB and write the old creds straight back.
  startGeneration++;
  clearReconnectTimer();
  clearWatchdog();
  if (startPromise) await startPromise.catch(() => undefined);

  const old = sock;
  sock = null;
  if (old) {
    if (connectionStatus === "open") {
      // Properly unlink from the phone when we can, so the dead session does
      // not linger in "Dispositivos vinculados" (each one takes up a slot).
      try {
        await withTimeout(old.logout(), 5_000, "logout");
      } catch {
        // not connected / already closed — fall through to a plain close
      }
    }
    discardSocket(old);
  }
  await flushAuthWrites();
  await deleteAllSessions(AUTH_KEY_PREFIX);
  connectionStatus = "disconnected";
  statusMessage = "Sesión reseteada";
  qrCode = null;
  consecutiveFailures = 0;
  hasStoredSession = false;
  lastDisconnectCode = null;
  console.log("[Baileys] Session reset — credentials wiped");
}

export async function startBaileys(isManual = false): Promise<WASocket | null> {
  // Prevent overlapping connection attempts (startup racing with a panel
  // click, two clicks, a reconnect timer firing during a manual start…).
  // Each unclosed socket consumes a WhatsApp linked-device slot even if never
  // fully authenticated, so there must only ever be one in flight.
  if (startPromise) {
    console.log("[Baileys] Start already in progress, joining it");
    return startPromise;
  }

  // A manual click (from the admin panel) always resets the failure count —
  // the user is explicitly asking us to try again.
  if (isManual) consecutiveFailures = 0;

  if (consecutiveFailures >= MAX_AUTO_RECONNECT_ATTEMPTS) {
    console.log(
      `[Baileys] ${consecutiveFailures} consecutive failures reached — pausing auto-reconnect. ` +
      `Use "Reconectar" or "Resetear sesión" in the admin panel to try again.`
    );
    connectionStatus = "disconnected";
    statusMessage = "Reconexión automática en pausa tras varios fallos — pulsa Reconectar";
    return sock;
  }

  startPromise = doStart().finally(() => {
    startPromise = null;
  });
  return startPromise;
}

async function doStart(): Promise<WASocket | null> {
  const gen = ++startGeneration;
  lastStartAt = Date.now();
  clearReconnectTimer();
  clearWatchdog();

  // Tear down any previous socket *before* anything else so it can't keep
  // feeding events into module state while we build the new one.
  if (sock) {
    const old = sock;
    sock = null;
    discardSocket(old);
  }

  connectionStatus = "connecting";
  statusMessage = "Iniciando conexión…";
  qrCode = null;

  try {
    const {
      default: makeWASocket,
      fetchLatestBaileysVersion,
    } = await import("@whiskeysockets/baileys");

    // Make sure every pending creds/keys write from the previous socket has
    // landed before we read creds back. Right after a QR scan WhatsApp forces
    // a reconnect (515) within milliseconds of emitting the new creds; reading
    // the DB before that write completes would restart with stale creds.
    await flushAuthWrites();
    if (gen !== startGeneration) return null;

    let version: [number, number, number] | undefined;
    try {
      // Never let this hang the whole start: it's a plain HTTPS fetch of a
      // JSON file on GitHub and previously had no timeout at all.
      const result = await fetchLatestBaileysVersion({ timeout: 10_000 });
      version = result.version;
      console.log("[Baileys] WA version:", version, result.isLatest ? "(latest)" : "(fallback)");
    } catch (err) {
      // Fall back to the version baked into the library rather than a
      // hard-coded one that will silently go stale.
      console.warn("[Baileys] fetchLatestBaileysVersion failed, using library default:", (err as Error)?.message);
    }
    if (gen !== startGeneration) return null;

    const pinoLogger = (await import("pino")).default({
      level: process.env.BAILEYS_LOG_LEVEL || "warn",
    });

    console.log("[Baileys] Loading auth state...");
    const authState = await makeDbAuthState(pinoLogger, gen);
    if (gen !== startGeneration) return null;

    const creds: any = authState.state.creds;
    hasStoredSession = !!(creds?.registered || creds?.me?.id);
    console.log(`[Baileys] Auth loaded — ${hasStoredSession ? "restoring saved session" : "no session, will request QR"}`);

    console.log("[Baileys] Creating socket...");
    const s = makeWASocket({
      ...(version ? { version } : {}),
      auth: authState.state,
      logger: pinoLogger as any,
      // [os, browser, version] — "Chrome" maps to a known platform type;
      // the os string is free text and is what shows up on the phone.
      browser: ["Villa Campito", "Chrome", "1.0.0"],
      connectTimeoutMs: 30_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 20_000,
      // We don't need the chat history on the server, and the initial
      // app-state/history sync is the phase most prone to stalling right
      // after pairing. Skip it entirely.
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      // If the linked device reports itself "online", WhatsApp stops sending
      // push notifications to the owner's phone. Keep the phone behaving
      // normally.
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
    });
    sock = s;
    attachHandlers(s, authState.saveCreds);

    watchdogTimer = setTimeout(() => {
      watchdogTimer = null;
      if (s !== sock || connectionStatus !== "connecting" || qrCode) return;
      console.error(`[Baileys] No QR/open/close within ${START_WATCHDOG_MS}ms — treating attempt as hung`);
      sock = null;
      discardSocket(s);
      connectionStatus = "disconnected";
      statusMessage = "La conexión se quedó colgada sin generar QR";
      consecutiveFailures++;
      if (consecutiveFailures < MAX_AUTO_RECONNECT_ATTEMPTS) scheduleReconnect(RECONNECT_DELAY_MS);
    }, START_WATCHDOG_MS);

    console.log("[Baileys] Socket created, waiting for QR or connection...");
    return s;
  } catch (err) {
    console.error("[Baileys] Failed to start:", err);
    connectionStatus = "disconnected";
    statusMessage = `Error al iniciar: ${(err as Error)?.message ?? err}`;
    consecutiveFailures++;
    return null;
  }
}

function attachHandlers(s: WASocket, saveCreds: () => Promise<void>) {
  // Persist credentials on every update. (Errors must not become unhandled
  // rejections inside Baileys' event loop.)
  s.ev.on("creds.update", () => {
    if (s !== sock) return;
    saveCreds().catch((err) => console.error("[Baileys] Failed to persist creds:", err));
  });

  s.ev.on("connection.update", async (update) => {
    // Events from a socket we already replaced must not touch shared state.
    if (s !== sock) return;

    const { connection, lastDisconnect, qr, isNewLogin, isOnline, receivedPendingNotifications } = update;

    console.log(
      `[Baileys] connection.update: connection=${connection} qr=${qr ? "present" : "none"} ` +
      `isNewLogin=${isNewLogin} isOnline=${isOnline} receivedPendingNotifications=${receivedPendingNotifications}`
    );

    if (qr) {
      clearWatchdog();
      qrCode = qr;
      connectionStatus = "connecting";
      statusMessage = "Escanea el código QR";
      console.log("[Baileys] QR code ready — scan with WhatsApp");
    }

    if (connection === "connecting") {
      connectionStatus = "connecting";
    }

    if (isNewLogin) {
      // Phone scanned the QR and pairing succeeded; WhatsApp will now close
      // the socket with 515 and expect an immediate reconnect. Hide the QR
      // so nobody scans a code that is already consumed.
      qrCode = null;
      hasStoredSession = true;
      statusMessage = "QR escaneado — completando vinculación…";
      console.log("[Baileys] Pairing succeeded, expecting restart from WhatsApp");
    }

    if (connection === "open") {
      clearWatchdog();
      qrCode = null;
      connectionStatus = "open";
      statusMessage = null;
      consecutiveFailures = 0;
      hasStoredSession = true;
      lastDisconnectCode = null;
      console.log("[Baileys] Connected to WhatsApp");
    }

    if (connection === "close") {
      clearWatchdog();
      // The QR belonged to this (now dead) socket — never leave it on screen.
      qrCode = null;
      connectionStatus = "disconnected";
      const err: any = lastDisconnect?.error;
      const statusCode: number | undefined = err?.output?.statusCode;
      lastDisconnectCode = statusCode ?? null;
      console.log(`[Baileys] Disconnected. statusCode=${statusCode} error=${err?.message}`);

      const { DisconnectReason } = await import("@whiskeysockets/baileys");
      if (s !== sock) return; // replaced while we awaited

      switch (statusCode) {
        case DisconnectReason.restartRequired: {
          // Expected, normal step right after a successful QR scan: not a
          // failure, and it must be answered *immediately* — the phone shows
          // "Iniciando sesión…" and gives up if the device doesn't come back
          // within a short window. Waiting 60s here is exactly what made the
          // pairing fail after scanning.
          statusMessage = "Reiniciando conexión tras vincular…";
          consecutiveFailures = 0; // pairing worked — this is progress, not a failure
          await flushAuthWrites();
          scheduleReconnect(500);
          break;
        }
        case DisconnectReason.loggedOut:
        case DisconnectReason.badSession:
        case DisconnectReason.multideviceMismatch: {
          // The stored credentials are dead (device unlinked from the phone,
          // or corrupt). Reconnecting with them would just fail again, so
          // wipe them and come back up asking for a fresh QR.
          console.warn(`[Baileys] Session invalid (${statusCode}) — wiping stored credentials`);
          statusMessage = "Sesión caducada en el teléfono — generando nuevo QR…";
          await flushAuthWrites();
          await deleteAllSessions(AUTH_KEY_PREFIX);
          hasStoredSession = false;
          consecutiveFailures = 0;
          scheduleReconnect(2_000);
          break;
        }
        case DisconnectReason.forbidden: {
          // WhatsApp refused this account/IP outright. Retrying automatically
          // only makes a temporary block longer.
          statusMessage = "WhatsApp ha rechazado la conexión (403). No se reintentará automáticamente.";
          console.error("[Baileys] 403 forbidden from WhatsApp — not retrying automatically");
          break;
        }
        case DisconnectReason.connectionReplaced: {
          // Another process is using the same credentials — typically the
          // previous Railway container still running during a deploy, or a
          // second replica. Back off generously; if we retry at once the two
          // instances keep kicking each other out.
          consecutiveFailures++;
          statusMessage = "Otra instancia del servidor está usando esta sesión de WhatsApp (440)";
          console.error("[Baileys] 440 connection replaced — another instance has this session");
          if (consecutiveFailures < MAX_AUTO_RECONNECT_ATTEMPTS) scheduleReconnect(120_000);
          break;
        }
        default: {
          consecutiveFailures++;
          const qrExpired = !hasStoredSession && statusCode === DisconnectReason.timedOut;
          const base = qrExpired
            ? "El QR caducó sin escanearse"
            : `Desconectado (${statusCode ?? "sin código"})`;
          if (consecutiveFailures < MAX_AUTO_RECONNECT_ATTEMPTS) {
            statusMessage = base;
            scheduleReconnect(RECONNECT_DELAY_MS);
          } else {
            console.log(
              `[Baileys] Giving up auto-reconnect after ${consecutiveFailures} consecutive failures. ` +
              `Click "Reconectar" or "Resetear sesión" in the admin panel to try again manually.`
            );
            statusMessage = `${base} — reconexión automática en pausa, pulsa Reconectar`;
          }
        }
      }
    }
  });

  // Handle incoming messages
  s.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
    if (s !== sock) return;
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
        if (s !== sock) continue; // socket replaced while Claude was thinking
        await s.sendMessage(jid, { text: reply });
        await saveMessage(conversation.id, "outbound_ai", reply);
        await updateConversationPreview(conversation.id, reply, false);
      } catch (err) {
        console.error("[Baileys] Error processing message:", err);
      }
    }
  });
}

/**
 * Called by the admin panel's `status` poll. If we're idle (disconnected, no
 * attempt in flight, no reconnect scheduled) start one, so that opening the
 * panel always produces a QR / reconnect attempt without needing a click —
 * previously, once the auto-reconnect cap was hit (which happens ~7 minutes
 * after boot if nobody scans), the panel just showed "Desconectado" forever.
 * Rate-limited, and never after an explicit 403 from WhatsApp.
 */
export function kickstartIfIdle() {
  if (connectionStatus !== "disconnected") return;
  if (startPromise || reconnectTimer) return;
  if (lastDisconnectCode === 403) return;
  if (Date.now() - lastStartAt < PANEL_KICKSTART_MIN_INTERVAL_MS) return;
  console.log("[Baileys] Admin panel is open and we are idle — starting connection");
  startBaileys(true).catch((err) => console.error("[Baileys] Kickstart failed:", err));
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
let campaignTickRunning = false;

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
  // A slow send (large image, flaky link) can outlast the 15s interval; don't
  // let two ticks pick the same pending recipient and double-send.
  if (campaignTickRunning) return;
  campaignTickRunning = true;
  try {
    if (Date.now() < campaignNextAllowedAt) return;
    const s = sock;
    if (!s || connectionStatus !== "open") return;
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
        await s.sendMessage(jid, { image: imageBuffer, caption: recipient.campaignMessage });
      } else {
        await s.sendMessage(jid, { text: recipient.campaignMessage });
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
  } finally {
    campaignTickRunning = false;
  }
}

/** Starts the interval that paces campaign sends. Safe to call once at server startup. */
export function startCampaignProcessor() {
  if (campaignProcessorStarted) return;
  campaignProcessorStarted = true;
  setInterval(processCampaignQueue, 15_000);
  console.log("[Campaign] Processor started");
}
