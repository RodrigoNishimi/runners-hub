import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listSavedEvents } from "@/lib/saved-events";
import { getEventsByIds } from "@/lib/events";
import type { CalendarEntry } from "@/lib/calendar";
import { SAVED_STATUS_STYLES } from "@/lib/calendar";
import { CalendarMonthView } from "@/components/CalendarMonthView";
import { CalendarListView } from "@/components/CalendarListView";
import { MONTH_NAMES } from "@/lib/format";

export const metadata: Metadata = { title: "Meu calendário" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "month";
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const saved = await listSavedEvents(session.user.id);
  const events = await getEventsByIds(saved.map((s) => s.eventId));
  const statusById = new Map(saved.map((s) => [s.eventId, s.status]));
  const entries: CalendarEntry[] = events.map((event) => ({
    event,
    status: statusById.get(event.id)!,
  }));

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Meu calendário</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href={`/calendar?view=month&year=${year}&month=${month}`}
            className={`rounded-lg px-3 py-1.5 font-medium ${view === "month" ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white text-zinc-700"}`}
          >
            Mês
          </Link>
          <Link
            href="/calendar?view=list"
            className={`rounded-lg px-3 py-1.5 font-medium ${view === "list" ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white text-zinc-700"}`}
          >
            Lista
          </Link>
          <a
            href="/api/calendar/ics"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            📅 Exportar .ics
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
        {Object.values(SAVED_STATUS_STYLES).map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
          <p>Seu calendário está vazio.</p>
          <p className="mt-1">
            <Link href="/events" className="text-sky-700 underline">
              Explore os eventos
            </Link>{" "}
            e marque as provas que você quer correr.
          </p>
        </div>
      ) : view === "month" ? (
        <>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={`/calendar?view=month&year=${prev.year}&month=${prev.month}`}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1 hover:bg-zinc-50"
              aria-label="Mês anterior"
            >
              ←
            </Link>
            <span className="w-48 text-center text-lg font-semibold capitalize">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <Link
              href={`/calendar?view=month&year=${next.year}&month=${next.month}`}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1 hover:bg-zinc-50"
              aria-label="Próximo mês"
            >
              →
            </Link>
          </div>
          <CalendarMonthView year={year} month={month} entries={entries} />
        </>
      ) : (
        <CalendarListView entries={entries} />
      )}
    </div>
  );
}
