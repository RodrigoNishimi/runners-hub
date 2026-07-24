"use client";

import dynamic from "next/dynamic";

// Leaflet acessa `window` — só pode montar no client.
const InnerMap = dynamic(() => import("./EventMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-72 animate-pulse rounded-xl bg-zinc-900" aria-hidden />
  ),
});

export function EventMap(props: {
  lat: number;
  lng: number;
  name: string;
  // false => coordenada e apenas o centro da cidade; mostra a cidade como um
  // todo (sem alfinete), para nao sugerir que o evento ocorre naquele ponto.
  precise: boolean;
}) {
  return <InnerMap {...props} />;
}
