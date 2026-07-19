"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EventHit, SearchResult } from "@/lib/search";
import { EventCard } from "./EventCard";

interface Props {
  initial: SearchResult;
}

// Lista com infinite scroll: a 1ª pagina vem do servidor (SSR, indexavel);
// as seguintes via /api/search conforme o sentinel entra na viewport.
export function EventList({ initial }: Props) {
  const searchParams = useSearchParams();
  const [hits, setHits] = useState<EventHit[]>(initial.hits);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filtros mudaram (novo payload SSR) -> reseta a lista durante o render
  // (padrao recomendado em react.dev/you-might-not-need-an-effect).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setHits(initial.hits);
    setPage(initial.page);
    setTotalPages(initial.totalPages);
  }

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page + 1));
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) return;
      const data: SearchResult = await res.json();
      setHits((prev) => [...prev, ...data.hits]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [loading, page, totalPages, searchParams]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!hits.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-zinc-900/40 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
          🏃
        </span>
        <p className="font-display font-semibold text-zinc-200">
          Nenhum evento encontrado
        </p>
        <p className="max-w-sm text-sm text-zinc-500">
          Tente remover algum filtro ou buscar por outra cidade ou distância.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hits.map((hit) => (
          <EventCard key={hit.id} event={hit} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-px" />
      {loading && (
        <div className="flex justify-center py-8" role="status" aria-label="Carregando mais eventos">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-lime-400" />
        </div>
      )}
      {page >= totalPages && hits.length > 12 && (
        <p className="py-8 text-center text-sm text-zinc-600">
          🏁 Você chegou ao fim dos resultados.
        </p>
      )}
    </>
  );
}
