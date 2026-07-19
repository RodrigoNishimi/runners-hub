import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/events";
import { buildIcs, icsResponse } from "@/lib/ics";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!event.startAt) {
    return NextResponse.json({ error: "no_date" }, { status: 422 });
  }
  return icsResponse(buildIcs([event]), `${event.slug}.ics`);
}
