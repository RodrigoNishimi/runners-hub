"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CircleHelpIcon, StarIcon } from "./icons";

type Status = "registered" | "want" | "maybe";

const OPTIONS: {
  value: Status;
  label: string;
  active: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    value: "registered",
    label: "Inscrito",
    active: "border-emerald-400 bg-emerald-400 text-zinc-950",
    Icon: CheckIcon,
  },
  {
    value: "want",
    label: "Quero fazer",
    active: "border-sky-400 bg-sky-400 text-zinc-950",
    Icon: StarIcon,
  },
  {
    value: "maybe",
    label: "Talvez",
    active: "border-amber-400 bg-amber-400 text-zinc-950",
    Icon: CircleHelpIcon,
  },
];

export function SaveEventButton({
  eventId,
  initialStatus,
  isAuthenticated,
}: {
  eventId: number;
  initialStatus: Status | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [busy, setBusy] = useState(false);

  const toggle = async (next: Status) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    const prev = status;
    const target = status === next ? null : next; // clicar de novo desmarca
    setStatus(target);
    try {
      const res = await fetch("/api/saved-events", {
        method: target === null ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          target === null ? { eventId } : { eventId, status: target },
        ),
      });
      if (!res.ok) setStatus(prev);
    } catch {
      setStatus(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        No meu calendário
      </span>
      <div className="flex gap-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={busy}
            onClick={() => toggle(o.value)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-60 ${
              status === o.value
                ? o.active
                : "border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
            }`}
          >
            <o.Icon className="h-3.5 w-3.5" />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
