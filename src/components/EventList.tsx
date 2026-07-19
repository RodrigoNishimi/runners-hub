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
      <p className="py-16 text-center text-zinc-500">
        Nenhum evento encontrado com esses filtros.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hits.map((hit) => (
          <EventCard key={hit.id} event={hit} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-px" />
      {loading && (
        <p className="py-6 text-center text-sm text-zinc-400">Carregando…</p>
      )}
      {page >= totalPages && hits.length > 12 && (
        <p className="py-6 text-center text-sm text-zinc-400">
          Fim dos resultados.
        </p>
      )}
    </>
  );
}
