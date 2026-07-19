import { NextRequest, NextResponse } from "next/server";
import { searchEvents } from "@/lib/search";
import { parseSearchParams } from "@/lib/search-params";

export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  try {
    const result = await searchEvents(parseSearchParams(sp));
    return NextResponse.json(result);
  } catch (err) {
    console.error("search failed", err);
    return NextResponse.json({ error: "search_failed" }, { status: 502 });
  }
}
