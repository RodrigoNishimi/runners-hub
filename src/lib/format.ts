const STATUS_LABELS: Record<string, string> = {
  open: "Inscrições abertas",
  closed: "Inscrições encerradas",
  coming_soon: "Em breve",
  sold_out: "Esgotado",
  unknown: "Consulte o site oficial",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30",
  closed: "bg-white/10 text-zinc-400 ring-1 ring-inset ring-white/15",
  coming_soon: "bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/30",
  sold_out: "bg-rose-400/15 text-rose-300 ring-1 ring-inset ring-rose-400/30",
  unknown: "bg-white/5 text-zinc-400 ring-1 ring-inset ring-white/10",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusStyle(status: string): string {
  return STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
}

export function formatPrice(price: number | null | undefined): string | null {
  if (price === null || price === undefined) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function formatDate(iso: string | Date | null | undefined): string | null {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export function formatDateLong(iso: string | Date | null | undefined): string | null {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

// Dia e mês separados, para badges de data (ex.: "14" / "set").
export function formatDayMonth(
  iso: string | Date | null | undefined,
): { day: string; month: string } | null {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(
    ".",
    "",
  );
  return { day, month };
}

export function distanceLabel(km: number): string {
  if (km === 42.195) return "Maratona";
  if (km === 21.0975) return "Meia";
  return Number.isInteger(km) ? `${km}k` : `${Math.round(km)}k`;
}

export function locationLabel(e: {
  city: string | null;
  state: string | null;
  country: string;
}): string {
  const parts = [e.city, e.country === "BR" ? e.state : e.country].filter(
    Boolean,
  );
  return parts.join(" · ") || "Local a confirmar";
}

export const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
