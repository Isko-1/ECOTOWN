"use client";

import { useEffect, useState } from "react";
import { Star, Heart, HandHeart, MessageCircle, Users, LogOut, CheckCircle2 } from "lucide-react";
import type { Spot, SpotStatus, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { SpotChat } from "@/components/SpotChat";
import { Modal } from "@/components/ui/Modal";
import { CloseSpotForm } from "@/components/CloseSpotForm";
import { DonationRequestForm } from "@/components/DonationRequestForm";
import { DonationProgress } from "@/components/DonationProgress";
import type { SpotDonation } from "@/lib/types";

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
  isVolunteer,
  onChanged,
}: {
  spot: Spot;
  userId: string | null;
  isFavorite: boolean;
  isVolunteer: boolean;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [volunteers, setVolunteers] = useState<Pick<Profile, "id" | "display_name" | "avatar_url">[]>([]);
  const [donation, setDonation] = useState<SpotDonation | null>(null);
  const [kaspiNumber, setKaspiNumber] = useState<string | null>(null);
  const [commissionPercent, setCommissionPercent] = useState(5);
  const [myName, setMyName] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("spot_volunteers")
      .select("profiles(id, display_name, avatar_url)")
      .eq("spot_id", spot.id)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data ?? [])
          .map((r) => r.profiles as unknown as Pick<Profile, "id" | "display_name" | "avatar_url">)
          .filter(Boolean);
        setVolunteers(rows);
      });
    return () => {
      cancelled = true;
    };
    // onChanged меняется на каждый ререндер родителя, поэтому в зависимостях — только spot.id и статус
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot.id, spot.status]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single()
      .then(({ data }) => setMyName(data?.display_name ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (spot.difficulty < 4) return;
    let cancelled = false;

    supabase
      .from("spot_donations")
      .select("*")
      .eq("spot_id", spot.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setDonation(data ?? null);
      });

    supabase
      .from("app_settings")
      .select("kaspi_number, commission_percent")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setKaspiNumber(data?.kaspi_number ?? null);
        setCommissionPercent(data?.commission_percent ?? 5);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot.id, spot.difficulty]);

  async function joinVolunteers() {
    if (!userId) return;
    setBusy(true);
    await supabase.from("spot_volunteers").insert({ spot_id: spot.id, user_id: userId });
    await supabase.from("spots").update({ status: "in_progress" }).eq("id", spot.id);
    setBusy(false);
    onChanged();
  }

  async function leaveVolunteers() {
    if (!userId) return;
    setBusy(true);

    // Считаем участников ДО удаления, чтобы понять, останется ли кто-то ещё
    const { count } = await supabase
      .from("spot_volunteers")
      .select("*", { count: "exact", head: true })
      .eq("spot_id", spot.id);

    // Если уходящий — последний, статус меняем, пока RLS ещё считает нас волонтёром
    if (count === 1) {
      await supabase.from("spots").update({ status: "new" }).eq("id", spot.id);
    }

    await supabase.from("spot_volunteers").delete().eq("spot_id", spot.id).eq("user_id", userId);

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

      {spot.difficulty >= 4 && donation && donation.status !== "rejected" && (
        <DonationProgress donation={donation} kaspiNumber={kaspiNumber} commissionPercent={commissionPercent} />
      )}
      {/* Запросить донат может ТОЛЬКО волонтёр, уже взявший метку в работу —
          автор метки часто не знает, что реально нужно для уборки. RLS на базе это же
          и проверяет, здесь — просто отражаем то же условие в UI. */}
      {spot.difficulty >= 4 &&
        isVolunteer &&
        userId &&
        (!donation || donation.status === "rejected") && (
          <DonationRequestForm
            spotId={spot.id}
            spotTitle={spot.title}
            userId={userId}
            requesterName={myName}
            onDone={() => {
              onChanged();
              supabase
                .from("spot_donations")
                .select("*")
                .eq("spot_id", spot.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
                .then(({ data }) => setDonation(data ?? null));
            }}
          />
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

      {/* Этап 2: волонтёры на метке */}
      {volunteers.length > 0 && (
        <div className="mt-3 border-t border-eco-100 pt-2">
          <p className="flex items-center gap-1 text-xs font-medium text-eco-600">
            <Users size={13} /> В работе: {volunteers.length} чел.
          </p>
          <ul className="mt-1 flex flex-wrap gap-1">
            {volunteers.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-1 rounded-full bg-eco-50 px-2 py-0.5 text-xs text-eco-800"
              >
                <Avatar displayName={v.display_name} avatarUrl={v.avatar_url} size="sm" className="h-4 w-4 text-[9px]" />
                {v.display_name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {userId && (
        <div className="mt-3 flex flex-wrap gap-2">
          {spot.status !== "done" && !isVolunteer && (
            <Button size="sm" variant="primary" disabled={busy} onClick={joinVolunteers}>
              <HandHeart size={14} /> Взять в работу
            </Button>
          )}

          {isVolunteer && spot.status === "in_progress" && (
            <>
              <Button size="sm" variant="secondary" disabled={busy} onClick={leaveVolunteers}>
                <LogOut size={14} /> Отказаться
              </Button>
              <Button size="sm" variant="primary" disabled={busy} onClick={() => setCloseOpen(true)}>
                <CheckCircle2 size={14} /> Закрыть метку
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="secondary"
            className={isFavorite ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold" : ""}
            disabled={busy}
            onClick={toggleFavorite}
          >
            <Heart size={14} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
            {isFavorite ? "В избранном" : "В избранное"}
          </Button>
        </div>
      )}

      <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setChatOpen(true)}>
        <MessageCircle size={14} />
        Обсуждение
      </Button>

      <SpotChat
        spotId={spot.id}
        spotTitle={spot.title}
        userId={userId}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />

      {userId && (
        <Modal open={closeOpen} onOpenChange={setCloseOpen} title="Закрыть метку">
          <CloseSpotForm
            spotId={spot.id}
            userId={userId}
            onDone={() => {
              setCloseOpen(false);
              onChanged();
            }}
            onCancel={() => setCloseOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
