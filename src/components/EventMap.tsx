"use client";

import dynamic from "next/dynamic";

// Leaflet acessa `window` — só pode montar no client.
const InnerMap = dynamic(() => import("./EventMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-xl bg-zinc-100" aria-hidden />
  ),
});

export function EventMap(props: { lat: number; lng: number; name: string }) {
  return <InnerMap {...props} />;
}
