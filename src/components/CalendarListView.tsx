import Link from "next/link";
import type { CalendarEntry } from "@/lib/calendar";
import { SAVED_STATUS_STYLES } from "@/lib/calendar";
import { MONTH_NAMES, formatDate, locationLabel } from "@/lib/format";

export function CalendarListView({ entries }: { entries: CalendarEntry[] }) {
  const dated = entries
    .filter((e) => e.event.startAt)
    .sort((a, b) => a.event.startAt!.getTime() - b.event.startAt!.getTime());
  const undated = entries.filter((e) => !e.event.startAt);

  const byMonth = new Map<string, CalendarEntry[]>();
  for (const entry of dated) {
    const d = entry.event.startAt!;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    byMonth.set(key, [...(byMonth.get(key) ?? []), entry]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...byMonth.entries()].map(([key, group]) => {
        const [year, monthIdx] = key.split("-").map(Number);
        return (
          <section key={key}>
            <h2 className="mb-3 font-display font-semibold capitalize text-zinc-200">
              {MONTH_NAMES[monthIdx]} {year}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.map((e) => (
                <EntryRow key={e.event.id} entry={e} />
              ))}
            </ul>
          </section>
        );
      })}
      {undated.length > 0 && (
        <section>
          <h2 className="mb-3 font-display font-semibold text-zinc-200">
            Sem data definida
          </h2>
          <ul className="flex flex-col gap-2">
            {undated.map((e) => (
              <EntryRow key={e.event.id} entry={e} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: CalendarEntry }) {
  const s = SAVED_STATUS_STYLES[entry.status];
  return (
    <li>
      <Link
        href={`/events/${entry.event.slug}`}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-lime-300/40"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-100">
            {entry.event.name}
          </p>
          <p className="text-sm text-zinc-500">
            {formatDate(entry.event.startAt) ?? "Data a confirmar"} ·{" "}
            {locationLabel(entry.event)}
          </p>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium text-zinc-500">
          {s.label}
        </span>
      </Link>
    </li>
  );
}
