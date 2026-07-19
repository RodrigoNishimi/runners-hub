"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MONTH_NAMES, distanceLabel, statusLabel } from "@/lib/format";

interface Props {
  facets: Record<string, Record<string, number>>;
}

// Ordena chaves de faceta numericas ("5", "21.0975") crescente.
function numericKeys(facet: Record<string, number> | undefined): number[] {
  return Object.keys(facet ?? {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

export function SearchFilters({ facets }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [geoError, setGeoError] = useState<string | null>(null);

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      next.delete("page"); // qualquer mudanca de filtro volta pra pagina 1
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  // Busca textual com debounce.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => setParams({ q }), 350);
    return () => clearTimeout(t);
  }, [q, searchParams, setParams]);

  const nearActive = searchParams.has("lat");

  const toggleNear = () => {
    setGeoError(null);
    if (nearActive) {
      setParams({ lat: null, lng: null, radius: null });
      return;
    }
    if (!navigator.geolocation) {
      setGeoError("Geolocalização não suportada neste navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setParams({
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
          radius: "50",
        }),
      () => setGeoError("Não foi possível obter sua localização."),
    );
  };

  const select = (
    name: string,
    label: string,
    entries: { value: string; label: string; count?: number }[],
  ) => (
    <select
      aria-label={label}
      value={searchParams.get(name) ?? ""}
      onChange={(e) => setParams({ [name]: e.target.value || null })}
      className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700"
    >
      <option value="">{label}</option>
      {entries.map((e) => (
        <option key={e.value} value={e.value}>
          {e.label}
          {e.count !== undefined ? ` (${e.count})` : ""}
        </option>
      ))}
    </select>
  );

  const states = Object.entries(facets.state ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const cities = Object.entries(facets.city ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const months = numericKeys(facets.month);
  const distances = numericKeys(facets.distances_km);
  const statuses = Object.entries(facets.registration_status ?? {});

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome, cidade ou organizadora…"
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400"
      />
      <div className="flex flex-wrap items-center gap-2">
        {select(
          "state",
          "Estado",
          states.map(([v, c]) => ({ value: v, label: v, count: c })),
        )}
        {select(
          "city",
          "Cidade",
          cities.map(([v, c]) => ({ value: v, label: v, count: c })),
        )}
        {select(
          "dist",
          "Distância",
          distances.map((km) => ({
            value: String(km),
            label: distanceLabel(km),
            count: facets.distances_km?.[String(km)],
          })),
        )}
        {select(
          "month",
          "Mês",
          months.map((m) => ({
            value: String(m),
            label: MONTH_NAMES[m - 1] ?? String(m),
            count: facets.month?.[String(m)],
          })),
        )}
        {select(
          "status",
          "Inscrições",
          statuses.map(([v, c]) => ({
            value: v,
            label: statusLabel(v),
            count: c,
          })),
        )}
        <select
          aria-label="Preço máximo"
          value={searchParams.get("maxPrice") ?? ""}
          onChange={(e) => setParams({ maxPrice: e.target.value || null })}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700"
        >
          <option value="">Preço até…</option>
          {[50, 100, 150, 200, 300, 500].map((v) => (
            <option key={v} value={v}>
              R$ {v}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={toggleNear}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            nearActive
              ? "border-sky-600 bg-sky-600 text-white"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          📍 Perto de mim
        </button>
        <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
        <select
          aria-label="Ordenar por"
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => setParams({ sort: e.target.value || null })}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700"
        >
          <option value="">Ordenar: data</option>
          <option value="price">Ordenar: preço</option>
        </select>
      </div>
      {geoError && <p className="text-sm text-rose-600">{geoError}</p>}
    </div>
  );
}
