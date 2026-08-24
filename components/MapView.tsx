"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair } from "lucide-react";
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

function clusterIcon(count: number) {
  return L.divIcon({
    className: "custom-cluster-icon",
    html: `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-eco-600 font-bold text-white text-xs shadow-lg border-2 border-white transform transition-transform hover:scale-110">
      ${count}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function userLocationIcon() {
  return L.divIcon({
    className: "custom-user-location",
    html: `<div class="relative flex h-6 w-6 items-center justify-center">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ target }: { target: FlyToTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.nonce]);
  return null;
}

function LocateMeButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const onLocationFound = (e: L.LocationEvent) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      setUserPos(latlng);
      map.flyTo(latlng, 16, { animate: true });
      setLocating(false);
      setErrorMsg(null);
    };

    const onLocationError = (e: L.ErrorEvent) => {
      console.warn("Leaflet locate error:", e.message);
      // Запасной вариант: обычный navigator.geolocation без требовательного highAccuracy
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserPos(latlng);
            map.flyTo(latlng, 16, { animate: true });
            setLocating(false);
            setErrorMsg(null);
          },
          (err) => {
            setLocating(false);
            let msg = "Не удалось определить местоположение.";
            if (err.code === 1) msg = "Разрешите доступ к геопозиции в настройках браузера.";
            else if (err.code === 2) msg = "Геолокация недоступна на устройстве.";
            else if (err.code === 3) msg = "Превышено время ожидания ответа GPS.";
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 5000);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      } else {
        setLocating(false);
        setErrorMsg("Геолокация не поддерживается вашим браузером.");
        setTimeout(() => setErrorMsg(null), 5000);
      }
    };

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    return () => {
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
    };
  }, [map]);

  const handleLocate = () => {
    setLocating(true);
    setErrorMsg(null);
    // Используем встроенный механизм Leaflet map.locate
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true, timeout: 8000 });
  };

  return (
    <>
      <div className="absolute right-3 top-20 z-[400] flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Где я на карте"
          aria-label="Где я на карте"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-eco-800 shadow-lg border border-eco-100 hover:bg-eco-50 transition-all active:scale-95 disabled:opacity-60"
        >
          <Crosshair size={20} className={locating ? "animate-spin text-eco-600" : "text-eco-700"} />
        </button>

        {errorMsg && (
          <div className="max-w-[200px] rounded-lg bg-eco-900/90 text-white text-[11px] p-2 shadow-xl backdrop-blur-sm animate-in fade-in">
            {errorMsg}
          </div>
        )}
      </div>

      {userPos && <Marker position={userPos} icon={userLocationIcon()} />}
    </>
  );
}

function SpotMarkersWithClustering({
  spots,
  pickMode,
  onSpotClick,
}: {
  spots: Spot[];
  pickMode: boolean;
  onSpotClick: (spot: Spot) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend() {
      setZoom(map.getZoom());
    },
  });

  // Кластеризация при отдаленном зуме (< 13)
  if (zoom < 13 && spots.length > 3) {
    const gridSize = 0.015;
    const clusters: { lat: number; lng: number; spots: Spot[] }[] = [];

    spots.forEach((spot) => {
      const existing = clusters.find(
        (c) => Math.abs(c.lat - spot.lat) < gridSize && Math.abs(c.lng - spot.lng) < gridSize
      );
      if (existing) {
        existing.spots.push(spot);
      } else {
        clusters.push({ lat: spot.lat, lng: spot.lng, spots: [spot] });
      }
    });

    return (
      <>
        {clusters.map((c, i) => {
          if (c.spots.length === 1) {
            const spot = c.spots[0];
            return (
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
            );
          }
          return (
            <Marker
              key={`cluster-${i}-${c.lat}-${c.lng}`}
              position={[c.lat, c.lng]}
              icon={clusterIcon(c.spots.length)}
              eventHandlers={{
                click: () => {
                  map.flyTo([c.lat, c.lng], zoom + 3, { animate: true });
                },
              }}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
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
    </>
  );
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
  onSpotClick: (spot: Spot) => void;
}) {
  return (
    <MapContainer center={URALSK_CENTER} zoom={13} className="h-full w-full" scrollWheelZoom>
      <TileLayer url={CARTO_TILE_URL} attribution={CARTO_ATTRIBUTION} />

      {pickMode && <ClickCatcher onPick={onPick} />}
      <FlyTo target={flyToTarget} />
      <LocateMeButton />

      <SpotMarkersWithClustering spots={spots} pickMode={pickMode} onSpotClick={onSpotClick} />

      {pendingPosition && (
        <Marker position={[pendingPosition.lat, pendingPosition.lng]} icon={pendingSpotIcon()} />
      )}
    </MapContainer>
  );
}
