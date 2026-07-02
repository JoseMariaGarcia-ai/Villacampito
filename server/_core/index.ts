import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";
import { storagePut, UPLOADS_DIR } from "../storage";
import { startBaileys, startCampaignProcessor } from "../baileys.service";
import multer from "multer";
import mysql, { type Connection } from "mysql2/promise";

async function runMigrations() {
  if (!process.env.DATABASE_URL) return;
  let conn: Connection | null = null;
  try {
    console.log("[DB] Running migrations...");
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    const stmts = [
      `CREATE TABLE IF NOT EXISTS \`whatsappSessions\` (
        \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
        \`data\` TEXT NOT NULL,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`whatsappConversations\` (
        \`id\` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`jid\` VARCHAR(64) NOT NULL UNIQUE,
        \`name\` VARCHAR(200),
        \`phone\` VARCHAR(30),
        \`aiEnabled\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`unreadCount\` INT NOT NULL DEFAULT 0,
        \`lastMessageAt\` TIMESTAMP NULL,
        \`lastMessagePreview\` VARCHAR(300),
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`whatsappMessages\` (
        \`id\` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`conversationId\` INT NOT NULL,
        \`role\` ENUM('inbound','outbound_manual','outbound_ai') NOT NULL,
        \`body\` TEXT NOT NULL,
        \`waMessageId\` VARCHAR(128) UNIQUE,
        \`status\` ENUM('sent','delivered','read','failed') DEFAULT 'sent',
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`villaPrompt\` (
        \`id\` INT NOT NULL DEFAULT 1 PRIMARY KEY,
        \`prompt\` TEXT NOT NULL,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`villaKnowledge\` (
        \`id\` INT NOT NULL DEFAULT 1 PRIMARY KEY,
        \`content\` TEXT NOT NULL,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`villaSettings\` (
        \`id\` INT NOT NULL DEFAULT 1 PRIMARY KEY,
        \`aiGlobalEnabled\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`occupiedDates\` (
        \`id\` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`date\` VARCHAR(10) NOT NULL UNIQUE,
        \`note\` TEXT,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`offers\` (
        \`id\` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`title\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`discount\` VARCHAR(100),
        \`imageUrl\` TEXT,
        \`active\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`clients\` (
        \`id\` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(200) NOT NULL,
        \`phone\` VARCHAR(30) NOT NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`campaigns\` (
        \`id\` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`message\` TEXT NOT NULL,
        \`status\` ENUM('running','paused','completed','cancelled') NOT NULL DEFAULT 'running',
        \`totalRecipients\` INT NOT NULL,
        \`sentCount\` INT NOT NULL DEFAULT 0,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS \`campaignRecipients\` (
        \`id\` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`campaignId\` INT NOT NULL,
        \`name\` VARCHAR(200),
        \`phone\` VARCHAR(30) NOT NULL,
        \`status\` ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
        \`sentAt\` TIMESTAMP NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    ];
    for (const sql of stmts) {
      await conn.execute(sql);
    }
    console.log("[DB] Migrations complete.");
  } catch (err) {
    console.error("[DB] Migration error:", err);
  } finally {
    await conn?.end();
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve locally-stored uploads (offer images, etc.)
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Image upload endpoint for offers
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post("/api/upload/offer-image", upload.single("image"), async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ENV.adminPassword) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }
      const suffix = Math.random().toString(36).substring(2, 10);
      const ext = req.file.originalname.split(".").pop() || "jpg";
      const key = `offers/offer-${Date.now()}-${suffix}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch (err) {
      console.error("[Upload] Error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start WhatsApp connection (non-blocking)
    startBaileys().catch((err) =>
      console.error("[Baileys] Failed to start:", err)
    );
    startCampaignProcessor();
  });
}

runMigrations().then(() => startServer()).catch(console.error);
