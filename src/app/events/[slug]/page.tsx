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
      ...(event.latitude !== null && event.longitude !== null
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
      {event.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt=""
          className="mb-6 max-h-80 w-full rounded-2xl object-cover"
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(event.registrationStatus)}`}
          >
            {statusLabel(event.registrationStatus)}
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {event.name}
          </h1>
          <p className="mt-1 text-lg text-zinc-600">
            {date ?? "Data a confirmar"} · {locationLabel(event)}
          </p>
          {event.organizerName && (
            <p className="mt-1 text-sm text-zinc-500">
              Organização:{" "}
              {event.organizerWebsite ? (
                <a
                  href={event.organizerWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-zinc-700"
                >
                  {event.organizerName}
                </a>
              ) : (
                event.organizerName
              )}
            </p>
          )}
        </div>
        <SaveEventButton
          eventId={event.id}
          initialStatus={saved}
          isAuthenticated={Boolean(session?.user)}
        />
      </div>

      {event.distances.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Distâncias
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {event.distances.map((d) => (
              <span
                key={d.label}
                className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700"
              >
                {d.label}
                {d.distanceKm !== null && ` · ${d.distanceKm} km`}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="mr-auto">
          {price ? (
            <p className="text-lg">
              Inscrições <span className="font-bold">a partir de {price}</span>
            </p>
          ) : (
            <p className="text-lg text-zinc-600">
              Valores no site oficial do evento
            </p>
          )}
          <p className="text-xs text-zinc-500">
            O RunnersHub é um agregador — a inscrição acontece no site oficial
            do evento.
          </p>
        </div>
        {event.officialUrl && (
          <a
            href={event.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Inscrever-se no site oficial ↗
          </a>
        )}
        <a
          href={`/api/events/${event.slug}/ics`}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          📅 Adicionar à agenda (.ics)
        </a>
      </section>

      {event.description && (
        <section className="prose prose-zinc mt-8 max-w-none">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Sobre o evento
          </h2>
          <p className="whitespace-pre-line text-zinc-700">
            {event.description}
          </p>
        </section>
      )}

      {event.latitude !== null && event.longitude !== null && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Local {event.address ? `— ${event.address}` : ""}
          </h2>
          <EventMap
            lat={event.latitude}
            lng={event.longitude}
            name={event.name}
          />
        </section>
      )}

      <p className="mt-8">
        <Link href="/events" className="text-sm text-sky-700 hover:underline">
          ← Voltar para a busca
        </Link>
      </p>
    </article>
  );
}
