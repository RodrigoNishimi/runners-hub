import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { savedEvents, type SavedEventStatus } from "./db/schema";

export async function getSavedEvent(
  userId: string,
  eventId: number,
): Promise<SavedEventStatus | null> {
  const rows = await db
    .select({ status: savedEvents.status })
    .from(savedEvents)
    .where(
      and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)),
    );
  return rows[0]?.status ?? null;
}

export async function listSavedEvents(userId: string) {
  return db
    .select({
      eventId: savedEvents.eventId,
      status: savedEvents.status,
    })
    .from(savedEvents)
    .where(eq(savedEvents.userId, userId));
}

export async function upsertSavedEvent(
  userId: string,
  eventId: number,
  status: SavedEventStatus,
) {
  await db
    .insert(savedEvents)
    .values({ userId, eventId, status })
    .onConflictDoUpdate({
      target: [savedEvents.userId, savedEvents.eventId],
      set: { status, updatedAt: new Date() },
    });
}

export async function removeSavedEvent(userId: string, eventId: number) {
  await db
    .delete(savedEvents)
    .where(
      and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)),
    );
}
