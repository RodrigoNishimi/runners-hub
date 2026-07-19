import Link from "next/link";
import type { EventHit } from "@/lib/search";
import {
  distanceLabel,
  formatDate,
  formatPrice,
  locationLabel,
  statusLabel,
  statusStyle,
} from "@/lib/format";

export function EventCard({ event }: { event: EventHit }) {
  const price = formatPrice(event.price);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative h-36 bg-zinc-100">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- fontes externas variadas; otimizar depois com remotePatterns
          <img
            src={event.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            🏃
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(event.registration_status)}`}
        >
          {statusLabel(event.registration_status)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-semibold text-zinc-900 group-hover:underline">
          {event.name}
        </h3>
        <p className="text-sm text-zinc-500">
          {formatDate(event.start_at) ?? "Data a confirmar"} ·{" "}
          {locationLabel({
            city: event.city,
            state: event.state,
            country: event.country,
          })}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
          {event.distances_km.slice(0, 4).map((km) => (
            <span
              key={km}
              className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700"
            >
              {distanceLabel(km)}
            </span>
          ))}
          {price && (
            <span className="ml-auto text-sm font-semibold text-zinc-700">
              a partir de {price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
