import Link from "next/link";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarEntry } from "@/lib/calendar";
import { SAVED_STATUS_STYLES } from "@/lib/calendar";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function CalendarMonthView({
  year,
  month,
  entries,
}: {
  year: number;
  month: number; // 1-12
  entries: CalendarEntry[];
}) {
  const monthStart = new Date(year, month - 1, 1);
  const gridStart = startOfWeek(startOfMonth(monthStart));
  const gridEnd = endOfWeek(endOfMonth(monthStart));

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-semibold uppercase text-zinc-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEntries = entries.filter(
            (e) => e.event.startAt && isSameDay(e.event.startAt, day),
          );
          return (
            <div
              key={day.toISOString()}
              className={`min-h-20 border-b border-r border-zinc-100 p-1.5 ${
                isSameMonth(day, monthStart) ? "" : "bg-zinc-50 text-zinc-300"
              }`}
            >
              <span className="text-xs">{format(day, "d")}</span>
              <div className="mt-1 flex flex-col gap-1">
                {dayEntries.map((e) => (
                  <Link
                    key={e.event.id}
                    href={`/events/${e.event.slug}`}
                    title={e.event.name}
                    className={`truncate rounded px-1.5 py-0.5 text-xs font-medium ${SAVED_STATUS_STYLES[e.status].chip}`}
                  >
                    {e.event.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
