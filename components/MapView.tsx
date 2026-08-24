"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair, Maximize2, Minimize2, Layers, RotateCcw } from "lucide-react";
import type { Spot } from "@/lib/types";
import { spotIcon, pendingSpotIcon } from "@/components/SpotMarker";

export interface FlyToTarget {
  lat: number;
  lng: number;
  nonce: number;
}

export type MapTileStyle = "carto" | "satellite" | "osm";

const URALSK_CENTER: [number, number] = [51.2333, 51.3667];

const TILE_PROVIDERS: Record<MapTileStyle, { url: string; attribution: string; label: string }> = {
  carto: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    label: "Светлая",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Спутник",
  },
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors',
    label: "Схема",
  },
};

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

/** Авто-обновление тайлов при изменениях размера (например, во весь экран) */
function MapResizer({ isFullscreen }: { isFullscreen?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map, isFullscreen]);
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
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true, timeout: 8000 });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLocate}
        disabled={locating}
        title="Где я на карте"
        aria-label="Где я на карте"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-eco-800 shadow-md border border-eco-100 hover:bg-eco-50 transition-all active:scale-95 disabled:opacity-60"
      >
        <Crosshair size={18} className={locating ? "animate-spin text-eco-600" : "text-eco-700"} />
      </button>

      {errorMsg && (
        <div className="absolute right-0 top-12 z-[500] max-w-[200px] rounded-lg bg-eco-900/90 text-white text-[11px] p-2 shadow-xl backdrop-blur-sm animate-in fade-in">
          {errorMsg}
        </div>
      )}

      {userPos && <Marker position={userPos} icon={userLocationIcon()} />}
    </>
  );
}

function ResetCenterButton() {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.flyTo(URALSK_CENTER, 13, { animate: true })}
      title="Центрировать карту на Уральск"
      aria-label="Центрировать карту на Уральск"
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-eco-800 shadow-md border border-eco-100 hover:bg-eco-50 transition-all active:scale-95"
    >
      <RotateCcw size={17} className="text-eco-700" />
    </button>
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

  const getStatusLabel = (status: string) => {
    if (status === "new") return "🔴 Требует уборки";
    if (status === "in_progress") return "🟡 В работе";
    return "🟢 Убрано";
  };

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
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div className="font-semibold text-xs text-eco-900">{spot.title}</div>
                  <div className="text-[11px] text-eco-700">{getStatusLabel(spot.status)}</div>
                </Tooltip>
              </Marker>
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
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
            <div className="font-semibold text-xs text-eco-900">{spot.title}</div>
            <div className="text-[11px] text-eco-700">{getStatusLabel(spot.status)}</div>
          </Tooltip>
        </Marker>
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
  isFullscreen = false,
  onToggleFullscreen,
}: {
  spots: Spot[];
  pickMode: boolean;
  pendingPosition: { lat: number; lng: number } | null;
  flyToTarget: FlyToTarget | null;
  onPick: (lat: number, lng: number) => void;
  onSpotClick: (spot: Spot) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const [tileStyle, setTileStyle] = useState<MapTileStyle>("carto");
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const activeProvider = TILE_PROVIDERS[tileStyle];

  return (
    <div className="relative h-full w-full">
      <MapContainer center={URALSK_CENTER} zoom={13} className="h-full w-full" scrollWheelZoom>
        <TileLayer url={activeProvider.url} attribution={activeProvider.attribution} />

        {pickMode && <ClickCatcher onPick={onPick} />}
        <FlyTo target={flyToTarget} />
        <MapResizer isFullscreen={isFullscreen} />

        <SpotMarkersWithClustering spots={spots} pickMode={pickMode} onSpotClick={onSpotClick} />

        {pendingPosition && (
          <Marker position={[pendingPosition.lat, pendingPosition.lng]} icon={pendingSpotIcon()} />
        )}

        {/* ── Панель элементов управления картой (Справа сверху) ── */}
        <div className="absolute right-3 top-3 z-[400] flex flex-col gap-2">
          {/* Кнопка разворачивания во весь экран */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Свернуть карту" : "Развернуть карту во весь экран"}
              aria-label={isFullscreen ? "Свернуть карту" : "Развернуть карту во весь экран"}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-eco-800 shadow-md border border-eco-100 hover:bg-eco-50 transition-all active:scale-95"
            >
              {isFullscreen ? <Minimize2 size={18} className="text-eco-700" /> : <Maximize2 size={18} className="text-eco-700" />}
            </button>
          )}

          {/* Переключатель слоев карты (Спутник / Схема / Светлая) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu((v) => !v)}
              title="Режим карты (Спутник / Схема)"
              aria-label="Режим карты"
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md border border-eco-100 transition-all active:scale-95 ${
                showLayerMenu ? "bg-eco-100 text-eco-900 border-eco-400" : "text-eco-800 hover:bg-eco-50"
              }`}
            >
              <Layers size={18} className="text-eco-700" />
            </button>

            {showLayerMenu && (
              <div className="absolute right-11 top-0 z-[500] flex flex-col gap-1 rounded-xl border border-eco-100 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-right-2">
                {(Object.keys(TILE_PROVIDERS) as MapTileStyle[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTileStyle(key);
                      setShowLayerMenu(false);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors text-left ${
                      tileStyle === key
                        ? "bg-eco-600 text-white"
                        : "text-eco-800 hover:bg-eco-50"
                    }`}
                  >
                    {TILE_PROVIDERS[key].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Сброс центрирования */}
          <ResetCenterButton />

          {/* Кнопка "Где я" */}
          <LocateMeButton />
        </div>
      </MapContainer>
    </div>
  );
}
