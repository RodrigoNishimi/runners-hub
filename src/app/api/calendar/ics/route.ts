import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listSavedEvents } from "@/lib/saved-events";
import { getEventsByIds } from "@/lib/events";
import { buildIcs, icsResponse } from "@/lib/ics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const saved = await listSavedEvents(session.user.id);
  const events = await getEventsByIds(saved.map((s) => s.eventId));
  return icsResponse(buildIcs(events), "runnershub-calendario.ics");
}
