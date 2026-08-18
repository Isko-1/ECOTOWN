"use client";

import { useState } from "react";
import { Star, Heart, HandHeart } from "lucide-react";
import type { Spot, SpotStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const statusLabel: Record<SpotStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Закрыто",
};

const statusBadgeClass: Record<SpotStatus, string> = {
  new: "bg-red-50 text-red-700",
  in_progress: "bg-amber-50 text-amber-700",
  done: "bg-eco-50 text-eco-700",
};

export function SpotPopup({
  spot,
  userId,
  isFavorite,
  onChanged,
}: {
  spot: Spot;
  userId: string | null;
  isFavorite: boolean;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function joinVolunteers() {
    if (!userId) return;
    setBusy(true);
    await supabase.from("spot_volunteers").insert({ spot_id: spot.id, user_id: userId });
    await supabase.from("spots").update({ status: "in_progress" }).eq("id", spot.id);
    setBusy(false);
    onChanged();
  }

  async function toggleFavorite() {
    if (!userId) return;
    setBusy(true);
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("spot_id", spot.id).eq("user_id", userId);
    } else {
      await supabase.from("favorites").insert({ spot_id: spot.id, user_id: userId });
    }
    setBusy(false);
    onChanged();
  }

  return (
    <div className="w-64 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold text-eco-900">{spot.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[spot.status]}`}>
          {statusLabel[spot.status]}
        </span>
      </div>

      <p className="mt-1 text-eco-700">{spot.description}</p>

      <div className="mt-2 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < spot.difficulty ? "fill-amber-500 text-amber-500" : "text-eco-200"}
          />
        ))}
      </div>

      {spot.difficulty >= 4 && (
        <p className="mt-2 rounded-lg bg-eco-50 px-2 py-1.5 text-xs text-eco-800">
          Сложная уборка — можно поддержать донатом на Kaspi.
        </p>
      )}

      {(spot.photo_before_url || spot.photo_after_url) && (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {spot.photo_before_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={spot.photo_before_url} alt="До" className="h-16 w-full rounded object-cover" />
          )}
          {spot.photo_after_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={spot.photo_after_url} alt="После" className="h-16 w-full rounded object-cover" />
          )}
        </div>
      )}

      {userId && (
        <div className="mt-3 flex gap-2">
          {spot.status === "new" && (
            <Button size="sm" variant="primary" disabled={busy} onClick={joinVolunteers}>
              <HandHeart size={14} /> Взять в работу
            </Button>
          )}
          <Button size="sm" variant="secondary" disabled={busy} onClick={toggleFavorite}>
            <Heart size={14} className={isFavorite ? "fill-eco-700" : ""} />
            {isFavorite ? "В избранном" : "В избранное"}
          </Button>
        </div>
      )}
    </div>
  );
}
