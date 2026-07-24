// Geracao de .ics (Google/Apple Calendar) a partir de eventos canonicos.
import { createEvents, type EventAttributes } from "ics";
import type { EventDetail } from "./events";

function toIcsEvent(e: EventDetail): EventAttributes | null {
  if (!e.startAt) return null;
  const d = e.startAt;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    title: e.name,
    // Corridas comecam cedo e a duracao varia; dia inteiro e o mais honesto.
    start: [d.getFullYear(), d.getMonth() + 1, d.getDate()],
    duration: { days: 1 },
    description: [
      e.distances.length
        ? `Distâncias: ${e.distances.map((x) => x.label).join(", ")}`
        : null,
      e.officialUrl ? `Inscrição: ${e.officialUrl}` : null,
      `Evento no RunnersHub: ${site}/events/${e.slug}`,
    ]
      .filter(Boolean)
      .join("\n"),
    location:
      [e.address, e.city, e.state].filter(Boolean).join(", ") || undefined,
    // Só fixamos coordenada quando aponta o local real; o centro da cidade
    // cravaria um pino enganoso no calendário do usuário.
    ...(e.locationPrecision === "exact" &&
    e.latitude !== null &&
    e.longitude !== null
      ? { geo: { lat: e.latitude, lon: e.longitude } }
      : {}),
    url: e.officialUrl ?? undefined,
    uid: `event-${e.id}@runnershub`,
    calName: "RunnersHub",
  };
}

export function buildIcs(events: EventDetail[]): string {
  const attrs = events
    .map(toIcsEvent)
    .filter((x): x is EventAttributes => x !== null);
  const { error, value } = createEvents(attrs);
  if (error) throw error;
  return value ?? "";
}

export function icsResponse(content: string, filename: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
