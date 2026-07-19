// Leitura das tabelas canonicas do ETL (schema public) — somente SELECT.
// O schema dessas tabelas e definido e mantido pelo pipeline
// (ETL_pipeline_running_events/sql/001_schema.sql).
import { sql } from "./db";

export type RegistrationStatus =
  | "open"
  | "closed"
  | "coming_soon"
  | "sold_out"
  | "unknown";

export interface EventDetail {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  startAt: Date | null;
  registrationStatus: RegistrationStatus;
  officialUrl: string | null;
  imageUrl: string | null;
  city: string | null;
  state: string | null;
  country: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  organizerName: string | null;
  organizerWebsite: string | null;
  distances: { label: string; distanceKm: number | null }[];
}

interface EventRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  start_at: Date | string | null;
  registration_status: RegistrationStatus;
  official_url: string | null;
  image_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  price: string | null;
  organizer_name: string | null;
  organizer_website: string | null;
  distances: { label: string; distance_km: string | null }[] | null;
}

function toDetail(row: EventRow): EventDetail {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description,
    // Dependendo do build do driver, timestamptz chega como Date ou string.
    startAt: row.start_at ? new Date(row.start_at) : null,
    registrationStatus: row.registration_status,
    officialUrl: row.official_url,
    imageUrl: row.image_url,
    city: row.city,
    state: row.state,
    country: row.country ?? "BR",
    address: row.address,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    price: row.price !== null ? Number(row.price) : null,
    organizerName: row.organizer_name,
    organizerWebsite: row.organizer_website,
    distances: (row.distances ?? []).map((d) => ({
      label: d.label,
      distanceKm: d.distance_km !== null ? Number(d.distance_km) : null,
    })),
  };
}

const EVENT_SELECT = sql`
  SELECT e.id, e.slug, e.name, e.description, e.start_at,
         e.registration_status, e.official_url, e.image_url,
         e.city, e.state, e.country, e.address,
         e.latitude, e.longitude, e.price,
         o.name AS organizer_name, o.website AS organizer_website,
         (SELECT json_agg(json_build_object('label', d.label,
                                            'distance_km', d.distance_km)
                          ORDER BY d.distance_km NULLS LAST)
          FROM event_distance d WHERE d.event_id = e.id) AS distances
  FROM event e
  LEFT JOIN organizer o ON o.id = e.organizer_id
`;

export async function getEventBySlug(
  slug: string,
): Promise<EventDetail | null> {
  const rows = await sql<EventRow[]>`${EVENT_SELECT} WHERE e.slug = ${slug}`;
  return rows.length ? toDetail(rows[0]) : null;
}

export async function getEventsByIds(ids: number[]): Promise<EventDetail[]> {
  if (!ids.length) return [];
  const rows = await sql<EventRow[]>`
    ${EVENT_SELECT} WHERE e.id = ANY(${ids})
  `;
  return rows.map(toDetail);
}
