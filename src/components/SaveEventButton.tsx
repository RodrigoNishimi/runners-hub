"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "registered" | "want" | "maybe";

const OPTIONS: { value: Status; label: string; active: string }[] = [
  {
    value: "registered",
    label: "✅ Inscrito",
    active: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    value: "want",
    label: "⭐ Quero fazer",
    active: "border-sky-600 bg-sky-600 text-white",
  },
  {
    value: "maybe",
    label: "🤔 Talvez",
    active: "border-amber-500 bg-amber-500 text-white",
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
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        No meu calendário
      </span>
      <div className="flex gap-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={busy}
            onClick={() => toggle(o.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              status === o.value
                ? o.active
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
