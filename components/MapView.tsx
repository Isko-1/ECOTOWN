"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import type { Spot } from "@/lib/types";
import { spotIcon, pendingSpotIcon } from "@/components/SpotMarker";
import { SpotPopup } from "@/components/SpotPopup";

const URALSK_CENTER: [number, number] = [51.2333, 51.3667];

const CARTO_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapView({
  spots,
  userId,
  favoriteSpotIds,
  pickMode,
  pendingPosition,
  onPick,
  onChanged,
}: {
  spots: Spot[];
  userId: string | null;
  favoriteSpotIds: Set<string>;
  pickMode: boolean;
  pendingPosition: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  onChanged: () => void;
}) {
  return (
    <MapContainer center={URALSK_CENTER} zoom={13} className="h-full w-full" scrollWheelZoom>
      <TileLayer url={CARTO_TILE_URL} attribution={CARTO_ATTRIBUTION} />

      {pickMode && <ClickCatcher onPick={onPick} />}

      {/* Рендерим маркер на каждую строку из spots — без скрытых фильтров (исправление бага №4) */}
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={spotIcon(spot.status)}>
          <Popup minWidth={260}>
            <SpotPopup
              spot={spot}
              userId={userId}
              isFavorite={favoriteSpotIds.has(spot.id)}
              onChanged={onChanged}
            />
          </Popup>
        </Marker>
      ))}

      {pendingPosition && (
        <Marker position={[pendingPosition.lat, pendingPosition.lng]} icon={pendingSpotIcon()} />
      )}
    </MapContainer>
  );
}
