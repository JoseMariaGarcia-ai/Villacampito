import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Legacy user table from the original Manus OAuth template.
 * Not used anywhere in this project anymore (the /admin panel uses a
 * password from ADMIN_PASSWORD, not user accounts). Kept as-is to avoid an
 * extra migration; safe to remove in the future if you don't need it.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Former OAuth identifier (openId). Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Occupied dates for the availability calendar.
 * Each row represents a single occupied date.
 */
export const occupiedDates = mysqlTable("occupiedDates", {
  id: int("id").autoincrement().primaryKey(),
  /** Date string in YYYY-MM-DD format */
  date: varchar("date", { length: 10 }).notNull().unique(),
  /** Optional note about the reservation */
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccupiedDate = typeof occupiedDates.$inferSelect;
export type InsertOccupiedDate = typeof occupiedDates.$inferInsert;

/**
 * Offers/promotions that can be displayed as popups on the public website.
 * Only one offer should be active at a time.
 */
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  /** Offer title (e.g., "Oferta Especial Verano") */
  title: varchar("title", { length: 200 }).notNull(),
  /** Offer description / details */
  description: text("description").notNull(),
  /** Discount text (e.g., "20% descuento", "50€ menos") */
  discount: varchar("discount", { length: 100 }),
  /** Optional image URL (stored in S3) */
  imageUrl: text("imageUrl"),
  /** Whether this offer is currently active and shown as popup */
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

/* ── WhatsApp / Baileys ── */

/**
 * Baileys auth state persisted in DB so Railway deploys don't require
 * re-scanning the QR code.
 */
export const whatsappSessions = mysqlTable("whatsappSessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  data: text("data").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * One row per WhatsApp contact/group conversation.
 */
export const whatsappConversations = mysqlTable("whatsappConversations", {
  id: int("id").autoincrement().primaryKey(),
  /** WhatsApp JID, e.g. "34600000000@s.whatsapp.net" */
  jid: varchar("jid", { length: 64 }).notNull().unique(),
  /** Contact display name */
  name: varchar("name", { length: 200 }),
  /** Phone number in international format */
  phone: varchar("phone", { length: 30 }),
  /** Whether AI auto-reply is enabled for this conversation */
  aiEnabled: boolean("aiEnabled").default(true).notNull(),
  /** Number of unread messages */
  unreadCount: int("unreadCount").default(0).notNull(),
  /** Timestamp of the last message in this conversation */
  lastMessageAt: timestamp("lastMessageAt"),
  /** Preview of the last message */
  lastMessagePreview: varchar("lastMessagePreview", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;

/**
 * Individual messages within a conversation.
 */
export const whatsappMessages = mysqlTable("whatsappMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  /** "inbound" = received from client, "outbound_manual" = sent by admin,
   *  "outbound_ai" = sent by Claude */
  role: mysqlEnum("role", ["inbound", "outbound_manual", "outbound_ai"]).notNull(),
  body: text("body").notNull(),
  /** WhatsApp message ID for deduplication */
  waMessageId: varchar("waMessageId", { length: 128 }).unique(),
  /** Whether the message was delivered/read */
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;

/* ── Claude AI configuration ── */

/**
 * System prompt for Claude. Single row, always id=1.
 * Editable from /admin.
 */
export const villaPrompt = mysqlTable("villaPrompt", {
  id: int("id").primaryKey().default(1),
  prompt: text("prompt").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Villa knowledge base — shown to Claude as context in every conversation.
 * Single row, always id=1. Editable from /admin.
 */
export const villaKnowledge = mysqlTable("villaKnowledge", {
  id: int("id").primaryKey().default(1),
  content: text("content").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Global AI on/off switch. Single row, always id=1.
 */
export const villaSettings = mysqlTable("villaSettings", {
  id: int("id").primaryKey().default(1),
  /** Master switch: if false, AI won't reply to any conversation */
  aiGlobalEnabled: boolean("aiGlobalEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});