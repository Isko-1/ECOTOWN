"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Spot } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { AddSpotForm } from "@/components/AddSpotForm";

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
  const [picking, setPicking] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);

  const loadSpots = useCallback(async () => {
    // Без .eq()-фильтров по умолчанию — рендерим маркер на каждую строку (исправление бага №4)
    const { data } = await supabase.from("spots").select("*").order("created_at", { ascending: false });
    setSpots(data ?? []);
  }, [supabase]);

  const loadFavorites = useCallback(
    async (uid: string) => {
      const { data } = await supabase.from("favorites").select("spot_id").eq("user_id", uid);
      setFavoriteSpotIds(new Set((data ?? []).map((f) => f.spot_id)));
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) loadFavorites(uid);
    });
    loadSpots();
  }, [supabase, loadSpots, loadFavorites]);

  function handleChanged() {
    loadSpots();
    if (userId) loadFavorites(userId);
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

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b border-eco-100 px-4 py-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-eco-900">Карта волонтёров</h1>
          <p className="text-xs text-eco-500">Меток на карте: {spots.length}</p>
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

      <div className="relative flex-1">
        <MapView
          spots={spots}
          userId={userId}
          favoriteSpotIds={favoriteSpotIds}
          pickMode={picking}
          pendingPosition={pendingPosition}
          onPick={handlePick}
          onChanged={handleChanged}
        />

        {picking && !pendingPosition && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-eco-800/90 px-3 py-1.5 text-xs text-white">
              Кликните на карту, чтобы выбрать место
            </span>
          </div>
        )}

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
      </div>
    </main>
  );
}
