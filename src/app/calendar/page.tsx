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

  const toggleBase =
    "rounded-full px-4 py-1.5 font-medium transition-colors";
  const toggleActive = "bg-lime-400 text-zinc-950";
  const toggleIdle =
    "border border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-white/25";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex animate-fade-up flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50">
          Meu calendário
        </h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href={`/calendar?view=month&year=${year}&month=${month}`}
            className={`${toggleBase} ${view === "month" ? toggleActive : toggleIdle}`}
          >
            Mês
          </Link>
          <Link
            href="/calendar?view=list"
            className={`${toggleBase} ${view === "list" ? toggleActive : toggleIdle}`}
          >
            Lista
          </Link>
          <a
            href="/api/calendar/ics"
            className={`${toggleBase} ${toggleIdle}`}
          >
            Exportar .ics
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        {Object.values(SAVED_STATUS_STYLES).map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-zinc-900/40 py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
            🗓️
          </span>
          <p className="font-display font-semibold text-zinc-200">
            Seu calendário está vazio
          </p>
          <p className="max-w-sm text-sm text-zinc-500">
            <Link
              href="/events"
              className="font-medium text-lime-300 underline decoration-lime-300/40 underline-offset-4 hover:decoration-lime-300"
            >
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 text-zinc-300 transition-colors hover:border-white/25 hover:text-zinc-50"
              aria-label="Mês anterior"
            >
              ←
            </Link>
            <span className="w-48 text-center font-display text-lg font-semibold capitalize text-zinc-50">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <Link
              href={`/calendar?view=month&year=${next.year}&month=${next.month}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 text-zinc-300 transition-colors hover:border-white/25 hover:text-zinc-50"
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
