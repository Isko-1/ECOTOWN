"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import type { Spot } from "@/lib/types";
import { spotIcon, pendingSpotIcon } from "@/components/SpotMarker";

export interface FlyToTarget {
  lat: number;
  lng: number;
  nonce: number;
}

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

// nonce нужен, чтобы повторный поиск того же места тоже вызывал перелёт
function FlyTo({ target }: { target: FlyToTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.nonce]);
  return null;
}

export function MapView({
  spots,
  pickMode,
  pendingPosition,
  flyToTarget,
  onPick,
  onSpotClick,
}: {
  spots: Spot[];
  pickMode: boolean;
  pendingPosition: { lat: number; lng: number } | null;
  flyToTarget: FlyToTarget | null;
  onPick: (lat: number, lng: number) => void;
  // Новый пропс: вместо рендеринга Popup внутри карты — сигнализируем родителю о выборе метки
  onSpotClick: (spot: Spot) => void;
}) {
  return (
    <MapContainer center={URALSK_CENTER} zoom={13} className="h-full w-full" scrollWheelZoom>
      <TileLayer url={CARTO_TILE_URL} attribution={CARTO_ATTRIBUTION} />

      {pickMode && <ClickCatcher onPick={onPick} />}
      <FlyTo target={flyToTarget} />

      {/* При клике на маркер — открываем sidebar через onSpotClick (не Leaflet Popup) */}
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={spotIcon(spot.status)}
          eventHandlers={{
            click: () => {
              if (!pickMode) onSpotClick(spot);
            },
          }}
        />
      ))}

      {pendingPosition && (
        <Marker position={[pendingPosition.lat, pendingPosition.lng]} icon={pendingSpotIcon()} />
      )}
    </MapContainer>
  );
}
