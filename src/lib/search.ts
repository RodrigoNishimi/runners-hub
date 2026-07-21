// Busca facetada direto no Postgres (schema public do ETL) — pg_trgm +
// unaccent para texto, haversine em SQL puro para "perto de mim" (sem
// depender de PostGIS: lat/long ja sao colunas numericas), GROUP BY para
// facets. Requer as extensoes/indice de
// ETL_pipeline_running_events/sql/008_search.sql.
// Roda so no servidor, na mesma conexao do resto do app.
import { sql } from "./db";

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

// Datas/facetas de mes seguem o fuso dos eventos (todos no Brasil).
const TZ = "America/Sao_Paulo";

// Aceite minimo do fuzzy matching (word_similarity): alto o bastante pra
// cortar ruido, baixo o bastante pra tolerar 1-2 letras trocadas.
const FUZZY_THRESHOLD = 0.35;

type Fragment = ReturnType<typeof sql>;

// Mesma expressao do indice GIN event_search_trgm_idx (008_search.sql) —
// mudar aqui exige mudar la, ou a busca volta a seq scan.
function eventHay(): Fragment {
  return sql`f_unaccent(lower(e.name || ' ' || coalesce(e.city, '') || ' ' || coalesce(e.state, '')))`;
}

// Texto completo usado no ranking (inclui organizadora; sem indice — o join
// impede, mas o volume de eventos e pequeno).
function fullHay(): Fragment {
  return sql`f_unaccent(lower(e.name || ' ' || coalesce(e.city, '') || ' ' || coalesce(e.state, '') || ' ' || coalesce(o.name, '')))`;
}

function escapeLike(v: string): string {
  return v.replace(/[\\%_]/g, (m) => `\\${m}`);
}

// Distancia em km ate (lat, lng) por haversine — roda em qualquer Postgres.
// O least(1.0, ...) protege o asin de erro de ponto flutuante quando os
// pontos coincidem.
function distanceKmTo(near: { lat: number; lng: number }): Fragment {
  return sql`(2 * 6371 * asin(sqrt(least(1.0,
      pow(sin(radians((e.latitude::float8 - ${near.lat}) / 2)), 2)
      + cos(radians(${near.lat})) * cos(radians(e.latitude::float8))
        * pow(sin(radians((e.longitude::float8 - ${near.lng}) / 2)), 2)
    ))))`;
}

// WHERE compartilhado entre a query de hits e a de facets. Eventos passados
// ficam fora da busca (mesma semantica do antigo reindex --future-only).
function buildWhere(p: SearchParams): Fragment {
  const q = p.q?.trim();
  return sql`
    WHERE (e.start_at IS NULL OR e.start_at >= now())
    ${p.state ? sql`AND e.state = ${p.state}` : sql``}
    ${p.city ? sql`AND e.city = ${p.city}` : sql``}
    ${p.status ? sql`AND e.registration_status = ${p.status}` : sql``}
    ${p.maxPrice !== undefined ? sql`AND e.price <= ${p.maxPrice}` : sql``}
    ${p.hasPrice ? sql`AND e.price IS NOT NULL` : sql``}
    ${
      p.month !== undefined
        ? sql`AND EXTRACT(MONTH FROM e.start_at AT TIME ZONE ${TZ}) = ${p.month}`
        : sql``
    }
    ${
      p.year !== undefined
        ? sql`AND EXTRACT(YEAR FROM e.start_at AT TIME ZONE ${TZ}) = ${p.year}`
        : sql``
    }
    ${
      p.distanceKm !== undefined
        ? sql`AND EXISTS (SELECT 1 FROM event_distance fd
                          WHERE fd.event_id = e.id AND fd.distance_km = ${p.distanceKm})`
        : sql``
    }
    ${
      p.near
        ? sql`AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
              AND ${distanceKmTo(p.near)} <= ${p.near.radiusKm}`
        : sql``
    }
    ${
      q
        ? sql`AND (
            ${eventHay()} LIKE '%' || f_unaccent(lower(${escapeLike(q)})) || '%'
            OR f_unaccent(lower(coalesce(o.name, ''))) LIKE '%' || f_unaccent(lower(${escapeLike(q)})) || '%'
            OR word_similarity(f_unaccent(lower(${q})), ${fullHay()}) >= ${FUZZY_THRESHOLD}
          )`
        : sql``
    }
  `;
}

// Relevancia textual primeiro (quando ha q), depois o criterio pedido —
// mesma precedencia dos rankingRules do indice antigo.
function buildOrderBy(p: SearchParams): Fragment {
  const q = p.q?.trim();
  const relevance = q
    ? sql`word_similarity(f_unaccent(lower(${q})), ${fullHay()}) DESC,`
    : sql``;
  if (p.sort === "price") {
    return sql`ORDER BY ${relevance} e.price ASC NULLS LAST, e.start_at ASC NULLS LAST`;
  }
  if (p.near && !p.sort) {
    return sql`ORDER BY ${relevance} ${distanceKmTo(p.near)} ASC`;
  }
  return sql`ORDER BY ${relevance} e.start_at ASC NULLS LAST, e.id ASC`;
}

interface HitRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  organizer_name: string | null;
  registration_status: string;
  price: number | null;
  image_url: string | null;
  distances_km: number[] | null;
  start_at: Date | string | null;
  start_ts: string | number | null;
  month: string | number | null;
  year: string | number | null;
}

interface FacetRow {
  total: number;
  state: Record<string, number>;
  city: Record<string, number>;
  month: Record<string, number>;
  registration_status: Record<string, number>;
  distances_km: Record<string, number>;
}

function toHit(row: HitRow): EventHit {
  const distances = (row.distances_km ?? []).map(Number);
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    city: row.city,
    state: row.state,
    country: row.country,
    organizer_name: row.organizer_name,
    registration_status: row.registration_status,
    price: row.price !== null ? Number(row.price) : null,
    has_price: row.price !== null,
    image_url: row.image_url,
    distances_km: distances,
    distance_labels: distances.map((km) => `${Math.round(km)}k`),
    // Dependendo do build do driver, timestamptz chega como Date ou string.
    start_at: row.start_at ? new Date(row.start_at).toISOString() : null,
    start_timestamp: row.start_ts !== null ? Number(row.start_ts) : null,
    month: row.month !== null ? Number(row.month) : null,
    year: row.year !== null ? Number(row.year) : null,
  };
}

export async function searchEvents(p: SearchParams): Promise<SearchResult> {
  const page = Math.max(1, p.page ?? 1);
  const hitsPerPage = p.hitsPerPage ?? 24;
  const where = buildWhere(p);

  const hitsQuery = sql<HitRow[]>`
    SELECT e.id, e.slug, e.name, e.city, e.state,
           coalesce(e.country, 'BR') AS country,
           o.name AS organizer_name,
           e.registration_status,
           e.price::float8 AS price,
           e.image_url,
           e.start_at,
           EXTRACT(EPOCH FROM e.start_at)::bigint AS start_ts,
           EXTRACT(MONTH FROM e.start_at AT TIME ZONE ${TZ})::int AS month,
           EXTRACT(YEAR FROM e.start_at AT TIME ZONE ${TZ})::int AS year,
           coalesce((SELECT array_agg(DISTINCT d.distance_km::float8
                                      ORDER BY d.distance_km::float8)
                     FROM event_distance d
                     WHERE d.event_id = e.id AND d.distance_km IS NOT NULL),
                    '{}') AS distances_km
    FROM event e
    LEFT JOIN organizer o ON o.id = e.organizer_id
    ${where}
    ${buildOrderBy(p)}
    LIMIT ${hitsPerPage} OFFSET ${(page - 1) * hitsPerPage}
  `;

  // Facets calculadas sobre o MESMO conjunto filtrado — os selects de
  // filtro da UI esperam contagens do resultado atual.
  const facetsQuery = sql<FacetRow[]>`
    WITH filtered AS (
      SELECT e.id, e.city, e.state, e.registration_status,
             EXTRACT(MONTH FROM e.start_at AT TIME ZONE ${TZ})::int AS month
      FROM event e
      LEFT JOIN organizer o ON o.id = e.organizer_id
      ${where}
    )
    SELECT
      (SELECT count(*) FROM filtered)::int AS total,
      (SELECT coalesce(jsonb_object_agg(state, n), '{}'::jsonb)
       FROM (SELECT state, count(*) AS n FROM filtered
             WHERE state IS NOT NULL GROUP BY state) t) AS state,
      (SELECT coalesce(jsonb_object_agg(city, n), '{}'::jsonb)
       FROM (SELECT city, count(*) AS n FROM filtered
             WHERE city IS NOT NULL GROUP BY city) t) AS city,
      (SELECT coalesce(jsonb_object_agg(month::text, n), '{}'::jsonb)
       FROM (SELECT month, count(*) AS n FROM filtered
             WHERE month IS NOT NULL GROUP BY month) t) AS month,
      (SELECT coalesce(jsonb_object_agg(registration_status, n), '{}'::jsonb)
       FROM (SELECT registration_status, count(*) AS n FROM filtered
             GROUP BY registration_status) t) AS registration_status,
      (SELECT coalesce(jsonb_object_agg(km, n), '{}'::jsonb)
       FROM (SELECT (d.distance_km::float8)::text AS km,
                    count(DISTINCT d.event_id) AS n
             FROM event_distance d
             JOIN filtered f ON f.id = d.event_id
             WHERE d.distance_km IS NOT NULL GROUP BY 1) t) AS distances_km
  `;

  const [rows, [facetRow]] = await Promise.all([hitsQuery, facetsQuery]);

  const totalHits = facetRow?.total ?? 0;
  return {
    hits: rows.map(toHit),
    totalHits,
    page,
    totalPages: Math.max(1, Math.ceil(totalHits / hitsPerPage)),
    facets: {
      state: facetRow?.state ?? {},
      city: facetRow?.city ?? {},
      month: facetRow?.month ?? {},
      registration_status: facetRow?.registration_status ?? {},
      distances_km: facetRow?.distances_km ?? {},
    },
  };
}
