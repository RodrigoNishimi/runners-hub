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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Encontre sua próxima prova
        </h1>
        <p className="text-zinc-500">
          {result.totalHits === 1
            ? "1 evento futuro de corrida, agregado"
            : `${result.totalHits} eventos futuros de corrida, agregados`}{" "}
          das principais plataformas do Brasil.
        </p>
      </div>
      <SearchFilters facets={result.facets} />
      <EventList initial={result} />
    </div>
  );
}
