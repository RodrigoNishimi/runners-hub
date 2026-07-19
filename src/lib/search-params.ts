// Traducao URL <-> SearchParams, usada tanto pela pagina SSR quanto pela
// rota /api/search — os filtros vivem na URL (shareavel e indexavel).
import type { SearchParams } from "./search";

export function parseSearchParams(
  sp: Record<string, string | string[] | undefined>,
): SearchParams {
  const get = (k: string): string | undefined => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string): number | undefined => {
    const v = get(k);
    if (v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const lat = num("lat");
  const lng = num("lng");

  return {
    q: get("q"),
    state: get("state"),
    city: get("city"),
    distanceKm: num("dist"),
    month: num("month"),
    year: num("year"),
    status: get("status"),
    maxPrice: num("maxPrice"),
    near:
      lat !== undefined && lng !== undefined
        ? { lat, lng, radiusKm: num("radius") ?? 50 }
        : undefined,
    sort: get("sort") === "price" ? "price" : undefined,
    page: num("page"),
  };
}
