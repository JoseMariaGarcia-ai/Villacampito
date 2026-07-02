import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/* ── Occupied Dates helpers ── */

import { occupiedDates } from "../drizzle/schema";
import { asc } from "drizzle-orm";

export async function getAllOccupiedDates(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ date: occupiedDates.date }).from(occupiedDates).orderBy(asc(occupiedDates.date));
  return rows.map(r => r.date);
}

export async function addOccupiedDates(dates: string[]): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  let added = 0;
  for (const date of dates) {
    try {
      await db.insert(occupiedDates).values({ date }).onDuplicateKeyUpdate({ set: { date } });
      added++;
    } catch (e) {
      console.warn(`[DB] Could not add date ${date}:`, e);
    }
  }
  return added;
}

export async function removeOccupiedDates(dates: string[]): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  let removed = 0;
  for (const date of dates) {
    try {
      const result = await db.delete(occupiedDates).where(eq(occupiedDates.date, date));
      if (result[0] && (result[0] as any).affectedRows > 0) removed++;
    } catch (e) {
      console.warn(`[DB] Could not remove date ${date}:`, e);
    }
  }
  return removed;
}

/* ── Offers helpers ── */

import { offers, type InsertOffer } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export async function getAllOffers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offers).orderBy(desc(offers.updatedAt));
}

export async function getActiveOffer() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(offers).where(eq(offers.active, true)).limit(1);
  return rows.length > 0 ? rows[0] : null;
}

export async function createOffer(data: { title: string; description: string; discount?: string; imageUrl?: string }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(offers).values({
    title: data.title,
    description: data.description,
    discount: data.discount ?? null,
    imageUrl: data.imageUrl ?? null,
    active: false,
  });
  const id = (result[0] as any).insertId;
  const rows = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateOffer(id: number, data: { title?: string; description?: string; discount?: string; imageUrl?: string | null }) {
  const db = await getDb();
  if (!db) return null;
  const updateSet: Record<string, unknown> = {};
  if (data.title !== undefined) updateSet.title = data.title;
  if (data.description !== undefined) updateSet.description = data.description;
  if (data.discount !== undefined) updateSet.discount = data.discount;
  if (data.imageUrl !== undefined) updateSet.imageUrl = data.imageUrl;
  if (Object.keys(updateSet).length > 0) {
    await db.update(offers).set(updateSet).where(eq(offers.id, id));
  }
  const rows = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function toggleOfferActive(id: number, active: boolean) {
  const db = await getDb();
  if (!db) return null;
  // If activating, deactivate all others first
  if (active) {
    await db.update(offers).set({ active: false }).where(eq(offers.active, true));
  }
  await db.update(offers).set({ active }).where(eq(offers.id, id));
  const rows = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteOffer(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(offers).where(eq(offers.id, id));
  return (result[0] as any).affectedRows > 0;
}

/* ── Clients helpers ── */

import { clients } from "../drizzle/schema";
import { like, or } from "drizzle-orm";

export async function getAllClients(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db.select().from(clients)
      .where(or(like(clients.name, term), like(clients.phone, term)))
      .orderBy(desc(clients.createdAt));
  }
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function createClient(data: { name: string; phone: string }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(clients).values({ name: data.name, phone: data.phone });
  const id = (result[0] as any).insertId;
  const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(clients).where(eq(clients.id, id));
  return (result[0] as any).affectedRows > 0;
}
