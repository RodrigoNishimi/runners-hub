"use client";

import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Ícone default do Leaflet quebra com bundlers (caminhos relativos a CSS);
// aponta explicitamente para os assets da CDN do pacote.
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Raio aproximado da área destacada quando só conhecemos a cidade. Não
// representa o local do evento — apenas indica "em algum lugar desta cidade".
const CITY_AREA_RADIUS_M = 6000;

export default function EventMapInner({
  lat,
  lng,
  name,
  precise,
}: {
  lat: number;
  lng: number;
  name: string;
  precise: boolean;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      // Local exato: aproxima na largada. Cidade: afasta para enquadrar a
      // cidade inteira, sem sugerir um ponto específico.
      zoom={precise ? 13 : 11}
      scrollWheelZoom={false}
      className="z-0 h-72 w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {precise ? (
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>{name}</Popup>
        </Marker>
      ) : (
        // Sem alfinete: uma área difusa cobrindo a cidade evita que o usuário
        // pense que a corrida acontece no centro geográfico.
        <Circle
          center={[lat, lng]}
          radius={CITY_AREA_RADIUS_M}
          pathOptions={{
            color: "#a3e635",
            weight: 1,
            fillColor: "#a3e635",
            fillOpacity: 0.12,
          }}
        />
      )}
    </MapContainer>
  );
}
