import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listSavedEvents,
  removeSavedEvent,
  upsertSavedEvent,
} from "@/lib/saved-events";

const VALID_STATUS = new Set(["registered", "want", "maybe"]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listSavedEvents(session.user.id));
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const eventId = Number(body?.eventId);
  const status = body?.status;
  if (!Number.isInteger(eventId) || !VALID_STATUS.has(status)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    await upsertSavedEvent(session.user.id, eventId, status);
  } catch {
    // FK violada -> evento nao existe no canonico.
    return NextResponse.json({ error: "unknown_event" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const eventId = Number(body?.eventId);
  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  await removeSavedEvent(session.user.id, eventId);
  return NextResponse.json({ ok: true });
}
