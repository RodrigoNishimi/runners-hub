import Link from "next/link";
import type { EventHit } from "@/lib/search";
import {
  distanceLabel,
  formatDayMonth,
  formatPrice,
  locationLabel,
  statusLabel,
  statusStyle,
} from "@/lib/format";
import { FlagIcon, MapPinIcon } from "./icons";

export function EventCard({ event }: { event: EventHit }) {
  const price = formatPrice(event.price);
  const dayMonth = formatDayMonth(event.start_at);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 transition-all duration-300 hover:-translate-y-1 hover:border-lime-300/40 hover:shadow-[0_24px_48px_-20px_rgba(163,230,53,0.25)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- fontes externas variadas; otimizar depois com remotePatterns
          <img
            src={event.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/60">
            <FlagIcon className="h-10 w-10 text-zinc-700 transition-colors duration-300 group-hover:text-lime-400/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/20" />

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${statusStyle(event.registration_status)}`}
        >
          {statusLabel(event.registration_status)}
        </span>

        {dayMonth && (
          <div className="absolute bottom-3 left-3 flex flex-col items-center rounded-xl border border-white/10 bg-zinc-950/70 px-2.5 py-1.5 backdrop-blur-md">
            <span className="font-display text-lg font-bold leading-none text-zinc-50">
              {dayMonth.day}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-lime-300">
              {dayMonth.month}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-zinc-50 transition-colors group-hover:text-lime-300">
          {event.name}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-zinc-400">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <span className="truncate">
            {locationLabel({
              city: event.city,
              state: event.state,
              country: event.country,
            })}
            {!dayMonth && " · Data a confirmar"}
          </span>
        </p>

        <div className="mt-auto flex flex-wrap items-end gap-1.5 pt-3">
          {event.distances_km.slice(0, 4).map((km) => (
            <span
              key={km}
              className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-white/10"
            >
              {distanceLabel(km)}
            </span>
          ))}
          {price && (
            <span className="ml-auto text-right leading-tight">
              <span className="block text-[10px] uppercase tracking-wide text-zinc-500">
                a partir de
              </span>
              <span className="font-display text-sm font-bold text-lime-300">
                {price}
              </span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
