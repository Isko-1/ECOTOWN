"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Spot, SpotStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { AddSpotForm } from "@/components/AddSpotForm";
import { MapFilters } from "@/components/MapFilters";
import { MapSearch } from "@/components/MapSearch";
import { SpotSidebar } from "@/components/SpotSidebar";
import type { FlyToTarget } from "@/components/MapView";

// Leaflet трогает window — грузим карту только на клиенте
const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-eco-500">Загружаем карту…</div>,
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

  // ── Sidebar state ──────────────────────────────────────────────────────────
  // selectedSpot — метка, выбранная кликом на маркер
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Загрузка данных ────────────────────────────────────────────────────────

  const loadSpots = useCallback(async () => {
    const { data } = await supabase.from("spots").select("*").order("created_at", { ascending: false });
    const fresh = data ?? [];
    setSpots(fresh);

    // Если sidebar открыт — обновляем данные выбранной метки (статус мог измениться)
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

  // ── Открытие sidebar при клике на маркер ──────────────────────────────────
  function handleSpotClick(spot: Spot) {
    setSelectedSpot(spot);
    setSidebarOpen(true);
  }

  function handleSidebarClose() {
    setSidebarOpen(false);
    // Небольшая задержка, чтобы анимация закрытия успела сыграть
    setTimeout(() => setSelectedSpot(null), 300);
  }

  // ── Фильтрация меток ───────────────────────────────────────────────────────
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

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col">
      {/* ── Шапка страницы ── */}
      <div className="flex items-center justify-between border-b border-eco-100 px-4 py-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-eco-900">Карта волонтёров</h1>
          <p className="text-xs text-eco-500">Меток на карте: {filteredSpots.length} из {spots.length}</p>
        </div>

        {userId ? (
          picking ? (
            <Button size="sm" variant="secondary" onClick={cancelAdd}>
              <X size={14} /> Отменить добавление
            </Button>
          ) : (
            <Button size="sm" onClick={() => setPicking(true)}>
              <MapPin size={14} /> Отметить место
            </Button>
          )
        ) : (
          <p className="text-xs text-eco-500">Войдите, чтобы добавлять метки</p>
        )}
      </div>

      {/* ── Фильтры и поиск ── */}
      <div className="flex flex-col gap-2 border-b border-eco-100 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
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
      <div className="relative flex-1">
        <MapView
          spots={filteredSpots}
          pickMode={picking}
          pendingPosition={pendingPosition}
          flyToTarget={flyToTarget}
          onPick={handlePick}
          onSpotClick={handleSpotClick}
        />

        {/* Подсказка при выборе места */}
        {picking && !pendingPosition && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-eco-800/90 px-3 py-1.5 text-xs text-white">
              Кликните на карту, чтобы выбрать место
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
