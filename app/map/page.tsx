"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, X, Maximize2, Minimize2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Spot, SpotStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { AddSpotForm } from "@/components/AddSpotForm";
import { MapFilters } from "@/components/MapFilters";
import { MapSearch } from "@/components/MapSearch";
import { SpotSidebar } from "@/components/SpotSidebar";
import { CleanupWeatherWidget } from "@/components/CleanupWeatherWidget";
import type { FlyToTarget } from "@/components/MapView";

// Leaflet трогает window — грузим карту только на клиенте
const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-eco-500 font-medium">Загружаем карту…</div>,
});

export default function MapPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [favoriteSpotIds, setFavoriteSpotIds] = useState<Set<string>>(new Set());
  const [myVolunteerSpotIds, setMyVolunteerSpotIds] = useState<Set<string>>(new Set());
  const [picking, setPicking] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<SpotStatus>>(
    new Set(["new", "in_progress", "done"])
  );
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(5);
  const [flyToTarget, setFlyToTarget] = useState<FlyToTarget | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Sidebar state ──────────────────────────────────────────────────────────
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Закрытие полноэкранного режима по клавише Escape ────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // ── Загрузка данных ────────────────────────────────────────────────────────
  const loadSpots = useCallback(async () => {
    const { data } = await supabase.from("spots").select("*").order("created_at", { ascending: false });
    const fresh = data ?? [];
    setSpots(fresh);

    setSelectedSpot((prev) => {
      if (!prev) return null;
      return fresh.find((s) => s.id === prev.id) ?? prev;
    });
  }, [supabase]);

  const loadFavorites = useCallback(
    async (uid: string) => {
      const { data } = await supabase.from("favorites").select("spot_id").eq("user_id", uid);
      setFavoriteSpotIds(new Set((data ?? []).map((f) => f.spot_id)));
    },
    [supabase]
  );

  const loadMyVolunteering = useCallback(
    async (uid: string) => {
      const { data } = await supabase.from("spot_volunteers").select("spot_id").eq("user_id", uid);
      setMyVolunteerSpotIds(new Set((data ?? []).map((v) => v.spot_id)));
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadFavorites(uid);
        loadMyVolunteering(uid);
      }
    });
    loadSpots();
  }, [supabase, loadSpots, loadFavorites, loadMyVolunteering]);

  function handleChanged() {
    loadSpots();
    if (userId) {
      loadFavorites(userId);
      loadMyVolunteering(userId);
    }
  }

  function handlePick(lat: number, lng: number) {
    setPendingPosition({ lat, lng });
  }

  function cancelAdd() {
    setPicking(false);
    setPendingPosition(null);
  }

  function finishAdd() {
    setPicking(false);
    setPendingPosition(null);
    handleChanged();
  }

  function handleSpotClick(spot: Spot) {
    setSelectedSpot(spot);
    setSidebarOpen(true);
  }

  function handleSidebarClose() {
    setSidebarOpen(false);
    setTimeout(() => setSelectedSpot(null), 300);
  }

  const filteredSpots = useMemo(
    () =>
      spots.filter(
        (s) => statusFilter.has(s.status) && s.difficulty >= minDifficulty && s.difficulty <= maxDifficulty
      ),
    [spots, statusFilter, minDifficulty, maxDifficulty]
  );

  function handleLocationFound(lat: number, lng: number) {
    setFlyToTarget({ lat, lng, nonce: Date.now() });
  }

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  return (
    <main
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex h-screen w-screen flex-col bg-white"
          : "flex h-[calc(100vh-4rem)] flex-col"
      }
    >
      {/* ── Шапка страницы ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-eco-100 bg-white px-4 py-2.5 shadow-sm gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display text-lg font-bold text-eco-900 leading-snug flex items-center gap-2">
              Карта волонтёров
            </h1>
            <p className="text-xs text-eco-600 font-medium">
              Меток: <span className="font-bold text-eco-800">{filteredSpots.length}</span> из {spots.length}
            </p>
          </div>

          <div className="hidden md:block">
            <CleanupWeatherWidget compact />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="border-eco-200 text-eco-800 hover:bg-eco-50 gap-1.5"
            title={isFullscreen ? "Свернуть карту (Esc)" : "Развернуть карту во весь экран"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden sm:inline">
              {isFullscreen ? "Свернуть" : "Во весь экран"}
            </span>
          </Button>

          {userId ? (
            picking ? (
              <Button size="sm" variant="secondary" onClick={cancelAdd} className="gap-1.5">
                <X size={15} /> Отменить
              </Button>
            ) : (
              <Button size="sm" onClick={() => setPicking(true)} className="gap-1.5 bg-eco-600 hover:bg-eco-700">
                <MapPin size={15} /> Отметить место
              </Button>
            )
          ) : (
            <p className="text-xs text-eco-500 hidden sm:block">Войдите, чтобы добавлять метки</p>
          )}
        </div>
      </div>

      {/* ── Фильтры и поиск ── */}
      <div className="flex flex-col gap-2 border-b border-eco-100 bg-eco-50/50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <MapFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          minDifficulty={minDifficulty}
          onMinDifficultyChange={setMinDifficulty}
          maxDifficulty={maxDifficulty}
          onMaxDifficultyChange={setMaxDifficulty}
        />
        <MapSearch onFound={handleLocationFound} />
      </div>

      {/* ── Карта + sidebar ── */}
      <div className="relative flex-1 overflow-hidden">
        <MapView
          spots={filteredSpots}
          pickMode={picking}
          pendingPosition={pendingPosition}
          flyToTarget={flyToTarget}
          onPick={handlePick}
          onSpotClick={handleSpotClick}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Плавающая Легенда меток */}
        <div className="pointer-events-none absolute bottom-5 left-3 z-[400] flex flex-col gap-1 rounded-xl bg-white/90 p-2 shadow-md border border-eco-100 backdrop-blur text-[11px] text-eco-800">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 shadow-sm inline-block"></span>
            <span>Требует уборки</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm inline-block"></span>
            <span>В процессе</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-eco-600 shadow-sm inline-block"></span>
            <span>Убрано</span>
          </div>
        </div>

        {/* Подсказка при выборе места */}
        {picking && !pendingPosition && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[450] flex justify-center">
            <span className="rounded-full bg-eco-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg animate-pulse">
              📍 Кликните по карте в месте загрязнения
            </span>
          </div>
        )}

        {/* Форма добавления метки */}
        {pendingPosition && userId && (
          <div className="absolute right-3 top-3 z-[1000] max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border border-eco-100 bg-white p-4 shadow-xl">
            <AddSpotForm
              lat={pendingPosition.lat}
              lng={pendingPosition.lng}
              userId={userId}
              onCreated={finishAdd}
              onCancel={cancelAdd}
            />
          </div>
        )}

        {/* ── SpotSidebar — главный компонент просмотра метки ── */}
        <SpotSidebar
          spot={selectedSpot}
          userId={userId}
          isFavorite={selectedSpot ? favoriteSpotIds.has(selectedSpot.id) : false}
          isVolunteer={selectedSpot ? myVolunteerSpotIds.has(selectedSpot.id) : false}
          open={sidebarOpen}
          onClose={handleSidebarClose}
          onChanged={handleChanged}
        />
      </div>
    </main>
  );
}
