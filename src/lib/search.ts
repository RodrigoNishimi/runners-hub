// Busca facetada via Meilisearch (indice "events", mantido pelo ETL em
// serving/search.py). Roda so no servidor — a chave nunca chega ao client.
import { Meilisearch } from "meilisearch";

export interface EventHit {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  organizer_name: string | null;
  registration_status: string;
  price: number | null;
  has_price: boolean;
  image_url: string | null;
  distances_km: number[];
  distance_labels: string[];
  start_at: string | null;
  start_timestamp: number | null;
  month: number | null;
  year: number | null;
}

export interface SearchParams {
  q?: string;
  state?: string;
  city?: string;
  distanceKm?: number;
  month?: number;
  year?: number;
  status?: string;
  maxPrice?: number;
  hasPrice?: boolean;
  near?: { lat: number; lng: number; radiusKm: number };
  sort?: "date" | "price";
  page?: number;
  hitsPerPage?: number;
}

export interface SearchResult {
  hits: EventHit[];
  totalHits: number;
  page: number;
  totalPages: number;
  facets: Record<string, Record<string, number>>;
}

const client = new Meilisearch({
  host: process.env.MEILI_URL ?? "http://localhost:7700",
  apiKey: process.env.MEILI_SEARCH_KEY,
});

const FACETS = ["state", "city", "distances_km", "month", "registration_status"];

export async function searchEvents(p: SearchParams): Promise<SearchResult> {
  const filter: string[] = [];
  if (p.state) filter.push(`state = "${escapeMeili(p.state)}"`);
  if (p.city) filter.push(`city = "${escapeMeili(p.city)}"`);
  if (p.distanceKm !== undefined) filter.push(`distances_km = ${p.distanceKm}`);
  if (p.month !== undefined) filter.push(`month = ${p.month}`);
  if (p.year !== undefined) filter.push(`year = ${p.year}`);
  if (p.status) filter.push(`registration_status = "${escapeMeili(p.status)}"`);
  if (p.maxPrice !== undefined) filter.push(`price <= ${p.maxPrice}`);
  if (p.hasPrice) filter.push("has_price = true");
  if (p.near) {
    filter.push(
      `_geoRadius(${p.near.lat}, ${p.near.lng}, ${Math.round(p.near.radiusKm * 1000)})`,
    );
  }
  // Eventos passados nao entram no indice: o ETL reindexa diariamente com
  // --future-only (start_timestamp nao e filtravel nas settings do indice).

  const sort: string[] = [];
  if (p.sort === "price") sort.push("price:asc");
  else if (p.near && !p.sort) sort.push(`_geoPoint(${p.near.lat}, ${p.near.lng}):asc`);
  else sort.push("start_timestamp:asc");

  const res = await client.index("events").search(p.q ?? "", {
    filter,
    sort,
    facets: FACETS,
    page: p.page ?? 1,
    hitsPerPage: p.hitsPerPage ?? 24,
  });

  return {
    hits: res.hits as unknown as EventHit[],
    totalHits: res.totalHits ?? 0,
    page: res.page ?? 1,
    totalPages: res.totalPages ?? 1,
    facets: (res.facetDistribution ?? {}) as SearchResult["facets"],
  };
}

function escapeMeili(v: string): string {
  return v.replace(/"/g, '\\"');
}
