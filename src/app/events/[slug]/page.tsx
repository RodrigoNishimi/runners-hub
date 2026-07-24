import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events";
import { auth } from "@/lib/auth";
import { getSavedEvent } from "@/lib/saved-events";
import { EventMap } from "@/components/EventMap";
import { SaveEventButton } from "@/components/SaveEventButton";
import {
  formatDateLong,
  formatPrice,
  locationLabel,
  statusLabel,
  statusStyle,
} from "@/lib/format";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  DownloadIcon,
  FlagIcon,
  MapPinIcon,
} from "@/components/icons";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return {
    title: event.name,
    description:
      event.description?.slice(0, 160) ??
      `${event.name} — ${locationLabel(event)}. Datas, distâncias e inscrição no RunnersHub.`,
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const session = await auth();
  const saved = session?.user?.id
    ? await getSavedEvent(session.user.id, event.id)
    : null;

  const price = formatPrice(event.price);
  const date = formatDateLong(event.startAt);

  // Só temos o ponto exato da largada quando a localização é precisa. Caso
  // contrário, as coordenadas são apenas o centro da cidade (geocoding por
  // cidade/UF) — não marcamos um ponto específico no mapa.
  const hasCoords = event.latitude !== null && event.longitude !== null;
  const preciseLocation = hasCoords && event.locationPrecision === "exact";

  // SEO: dados estruturados schema.org/Event (indexacao rica no Google).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.name,
    startDate: event.startAt?.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.address ?? event.city ?? undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city ?? undefined,
        addressRegion: event.state ?? undefined,
        addressCountry: event.country,
      },
      // Só publicamos coordenadas nos dados estruturados quando apontam o local
      // real — o centroide da cidade enganaria buscadores tanto quanto o mapa.
      ...(preciseLocation
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.latitude,
              longitude: event.longitude,
            },
          }
        : {}),
    },
    ...(event.imageUrl ? { image: [event.imageUrl] } : {}),
    ...(event.organizerName
      ? {
          organizer: {
            "@type": "Organization",
            name: event.organizerName,
            ...(event.organizerWebsite ? { url: event.organizerWebsite } : {}),
          },
        }
      : {}),
    ...(event.officialUrl ? { url: event.officialUrl } : {}),
  };

  return (
    <article className="mx-auto max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="mb-5 animate-fade-up">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-lime-300"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar para a busca
        </Link>
      </p>

      {/* Hero com imagem (ou gradiente) e título sobreposto. */}
      <div className="relative animate-fade-up overflow-hidden rounded-3xl border border-white/10">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt=""
            className="h-72 w-full object-cover sm:h-96"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/60 sm:h-72">
            <FlagIcon className="h-16 w-16 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${statusStyle(event.registrationStatus)}`}
          >
            {statusLabel(event.registrationStatus)}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {event.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300 sm:text-base">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-lime-300" />
              <span className="inline-block first-letter:uppercase">
                {date ?? "Data a confirmar"}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4 text-lime-300" />
              {locationLabel(event)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {event.organizerName ? (
          <p className="text-sm text-zinc-500">
            Organização:{" "}
            {event.organizerWebsite ? (
              <a
                href={event.organizerWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-lime-300 hover:decoration-lime-300"
              >
                {event.organizerName}
              </a>
            ) : (
              <span className="font-medium text-zinc-300">
                {event.organizerName}
              </span>
            )}
          </p>
        ) : (
          <span />
        )}
        <SaveEventButton
          eventId={event.id}
          initialStatus={saved}
          isAuthenticated={Boolean(session?.user)}
        />
      </div>

      {event.distances.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Distâncias
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {event.distances.map((d) => (
              <span
                key={d.label}
                className="flex items-baseline gap-1.5 rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2.5"
              >
                <span className="font-display text-base font-bold text-zinc-50">
                  {d.label}
                </span>
                {d.distanceKm !== null && (
                  <span className="text-xs text-zinc-500">
                    {d.distanceKm} km
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-lime-300/20 bg-gradient-to-r from-lime-400/10 via-zinc-900/60 to-zinc-900/60 p-5 sm:p-6">
        <div className="mr-auto">
          {price ? (
            <p className="text-lg text-zinc-300">
              Inscrições{" "}
              <span className="font-display font-bold text-lime-300">
                a partir de {price}
              </span>
            </p>
          ) : (
            <p className="text-lg text-zinc-300">
              Valores no site oficial do evento
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            O RunnersHub é um agregador — a inscrição acontece no site oficial
            do evento.
          </p>
        </div>
        {event.officialUrl && (
          <a
            href={event.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 font-semibold text-zinc-950 shadow-[0_8px_30px_-8px_rgba(163,230,53,0.5)] transition-all hover:-translate-y-0.5 hover:bg-lime-300"
          >
            Inscrever-se no site oficial
            <ArrowUpRightIcon className="h-4 w-4" />
          </a>
        )}
        <a
          href={`/api/events/${event.slug}/ics`}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/25 hover:text-zinc-100"
        >
          <DownloadIcon className="h-4 w-4" />
          Adicionar à agenda (.ics)
        </a>
      </section>

      {event.description && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Sobre o evento
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-zinc-300">
            {event.description}
          </p>
        </section>
      )}

      {hasCoords && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Local{" "}
            {preciseLocation && event.address ? `— ${event.address}` : ""}
          </h2>
          {!preciseLocation && (
            <p className="mt-2 text-sm text-zinc-400">
              Localização aproximada: mostramos a cidade
              {event.city ? ` de ${locationLabel(event)}` : ""}. O ponto exato
              da largada ainda não foi divulgado.
            </p>
          )}
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
            <EventMap
              lat={event.latitude!}
              lng={event.longitude!}
              name={event.name}
              precise={preciseLocation}
            />
          </div>
        </section>
      )}
    </article>
  );
}
