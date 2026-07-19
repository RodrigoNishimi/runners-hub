import type { Metadata } from "next";
import { searchEvents } from "@/lib/search";
import { parseSearchParams } from "@/lib/search-params";
import { SearchFilters } from "@/components/SearchFilters";
import { EventList } from "@/components/EventList";

export const metadata: Metadata = {
  title: "Explorar eventos",
  description:
    "Busque corridas de rua por cidade, distância, data e preço, e monte seu calendário de provas.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const result = await searchEvents(parseSearchParams(sp));

  return (
    <div className="flex flex-col gap-8">
      <header className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">
          Corridas de rua no Brasil
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Encontre sua{" "}
          <span className="bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-transparent">
            próxima prova
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          <span className="font-semibold text-zinc-200">
            {result.totalHits === 1
              ? "1 evento futuro"
              : `${result.totalHits} eventos futuros`}
          </span>{" "}
          de corrida, agregados das principais plataformas do Brasil — busque
          por cidade, distância, data e preço.
        </p>
      </header>
      <div className="flex flex-col gap-6">
        <SearchFilters facets={result.facets} />
        <EventList initial={result} />
      </div>
    </div>
  );
}
