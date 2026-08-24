"use client";

import { useState, useEffect } from "react";
import {
  X,
  Star,
  Heart,
  HandHeart,
  MessageCircle,
  Users,
  LogOut,
  CheckCircle2,
  Info,
  AlertCircle,
  Loader2,
  Calendar,
  Pencil,
} from "lucide-react";
import type { Spot, SpotStatus, Profile, SpotDonation } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { SpotChat } from "@/components/SpotChat";
import { Modal } from "@/components/ui/Modal";
import { CloseSpotForm } from "@/components/CloseSpotForm";
import { EditSpotForm } from "@/components/EditSpotForm";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ShareButton } from "@/components/ShareButton";
import { DonationRequestForm } from "@/components/DonationRequestForm";
import { DonationProgress } from "@/components/DonationProgress";
import { IcsExportButton } from "@/components/IcsExportButton";
import { CleanupWeatherWidget } from "@/components/CleanupWeatherWidget";

// ─── Вспомогательные данные ───────────────────────────────────────────────────

const statusLabel: Record<SpotStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Закрыто",
};

const statusBadgeClass: Record<SpotStatus, string> = {
  new: "bg-red-50 text-red-700 border border-red-100",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-100",
  done: "bg-eco-50 text-eco-700 border border-eco-100",
};

type Tab = "info" | "chat";

function getGoogleCalendarUrl(spot: Spot) {
  if (!spot.event_date) return "";
  const startDate = new Date(spot.event_date);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const title = encodeURIComponent(`Субботник EcoTown: ${spot.title}`);
  const details = encodeURIComponent(`${spot.description}\n\nПодробности на сайте EcoTown.`);
  const location = encodeURIComponent(`Координаты: ${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatUtc(startDate)}/${formatUtc(endDate)}&details=${details}&location=${location}`;
}

function getEventCountdown(eventDateIso: string) {
  const diffMs = new Date(eventDateIso).getTime() - Date.now();
  if (diffMs < 0) return "Субботник уже начался или прошёл";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `До уборки осталось ${diffDays} дн.`;
  return `До уборки осталось ${diffHours} ч.`;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export function SpotSidebar({
  spot,
  userId,
  isFavorite,
  isVolunteer,
  open,
  onClose,
  onChanged,
}: {
  spot: Spot | null;
  userId: string | null;
  isFavorite: boolean;
  isVolunteer: boolean;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const supabase = createClient();

  // ── состояния загрузки ──
  const [joinBusy, setJoinBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── данные ──
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [closeOpen, setCloseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [myRole, setMyRole] = useState<"user" | "moderator" | "admin">("user");
  const [volunteers, setVolunteers] = useState<Pick<Profile, "id" | "display_name" | "avatar_url">[]>([]);
  const [donation, setDonation] = useState<SpotDonation | null>(null);
  const [kaspiNumber, setKaspiNumber] = useState<string | null>(null);
  const [commissionPercent, setCommissionPercent] = useState(5);
  const [myName, setMyName] = useState("");

  // Сбрасываем таб и ошибку при открытии другой метки
  useEffect(() => {
    setActiveTab("info");
    setError(null);
  }, [spot?.id]);

  useEffect(() => {
    if (!spot) return;
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

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.id, spot?.status]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setMyName(data?.display_name ?? "");
        setMyRole((data?.role as "user" | "moderator" | "admin") ?? "user");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!spot || spot.difficulty < 4) return;
    let cancelled = false;

    supabase
      .from("spot_donations")
      .select("*")
      .eq("spot_id", spot.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setDonation(data ?? null); });

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

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.id, spot?.difficulty]);

  // ── действия ────────────────────────────────────────────────────────────────

  async function joinVolunteers() {
    if (!userId || !spot) return;
    setJoinBusy(true);
    setError(null);
    try {
      const { error: e1 } = await supabase.from("spot_volunteers").insert({ spot_id: spot.id, user_id: userId });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("spots").update({ status: "in_progress" }).eq("id", spot.id);
      if (e2) throw e2;
      onChanged();
    } catch {
      setError("Не удалось взять метку в работу. Попробуйте ещё раз.");
    } finally {
      setJoinBusy(false);
    }
  }

  async function leaveVolunteers() {
    if (!userId || !spot) return;
    setLeaveBusy(true);
    setError(null);
    try {
      const { count } = await supabase
        .from("spot_volunteers")
        .select("*", { count: "exact", head: true })
        .eq("spot_id", spot.id);

      if (count === 1) {
        await supabase.from("spots").update({ status: "new" }).eq("id", spot.id);
      }
      const { error: e } = await supabase
        .from("spot_volunteers")
        .delete()
        .eq("spot_id", spot.id)
        .eq("user_id", userId);
      if (e) throw e;
      onChanged();
    } catch {
      setError("Не удалось отказаться. Попробуйте ещё раз.");
    } finally {
      setLeaveBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!userId || !spot) return;
    setFavBusy(true);
    setError(null);
    try {
      if (isFavorite) {
        const { error: e } = await supabase.from("favorites").delete().eq("spot_id", spot.id).eq("user_id", userId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("favorites").insert({ spot_id: spot.id, user_id: userId });
        if (e) throw e;
      }
      onChanged();
    } catch {
      setError("Не удалось обновить избранное. Попробуйте ещё раз.");
    } finally {
      setFavBusy(false);
    }
  }

  // ── рендер ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Оверлей — только на мобилках (на десктопе sidebar не перекрывает всё) */}
      {open && (
        <div
          className="fixed inset-0 z-[900] bg-black/30 animate-fade-in md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/*
        Sidebar:
        - На десктопе (md+): фиксированная правая панель, не перекрывает карту полностью
        - На мобилках: bottom-sheet, выезжает снизу
        Анимация через Tailwind animate-* классы (tailwindcss-animate)
      */}
      <div
        role="complementary"
        aria-label={`Информация о метке${spot ? ": " + spot.title : ""}`}
        className={[
          // Базовые стили
          "fixed z-[1000] bg-white shadow-2xl flex flex-col",
          // ── Мобильный: bottom sheet ──
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh]",
          "md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:rounded-none md:max-h-full",
          // ── Ширина десктоп ──
          "md:w-[400px]",
          // ── Анимация появления/скрытия ──
          open
            ? "animate-slide-in-bottom md:animate-slide-in-right"
            : "translate-y-full md:translate-x-full pointer-events-none",
          // Плавный переход при закрытии без tailwindcss-animate
          !open ? "transition-transform duration-300" : "",
        ].join(" ")}
      >
        {/* ─── Хедер ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 border-b border-eco-100 px-5 pt-5 pb-4">
          {/* Drag-handle для мобилок */}
          <div className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-eco-200 md:hidden" />

          <div className="min-w-0 flex-1">
            {spot ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base font-semibold text-eco-900 leading-tight">
                    {spot.title}
                  </h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[spot.status]}`}>
                    {statusLabel[spot.status]}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-eco-400">
                  <Calendar size={10} />
                  {new Date(spot.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </>
            ) : (
              <div className="h-5 w-32 animate-pulse rounded bg-eco-100" />
            )}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-eco-500 hover:bg-eco-100 hover:text-eco-800 transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Табы ───────────────────────────────────────────── */}
        <div className="flex border-b border-eco-100">
          <TabButton
            icon={<Info size={14} />}
            label="Информация"
            active={activeTab === "info"}
            onClick={() => setActiveTab("info")}
          />
          <TabButton
            icon={<MessageCircle size={14} />}
            label="Обсуждение"
            active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          />
        </div>

        {/* ─── Контент табов ──────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          {/* Таб "Информация" */}
          {activeTab === "info" && spot && (
            <div className="h-full overflow-y-auto px-5 py-4 space-y-4">
              {/* Описание */}
              <p className="text-sm text-eco-700 leading-relaxed">{spot.description}</p>

              {/* Дата и время субботника */}
              {spot.event_date && (
                <div className="rounded-xl border border-eco-200 bg-eco-50/70 p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-eco-800 flex items-center gap-1.5">
                      <Calendar size={14} className="text-eco-600" /> Дата и время субботника
                    </p>
                    <span className="rounded-full bg-eco-100 px-2 py-0.5 text-[11px] font-medium text-eco-700">
                      {getEventCountdown(spot.event_date)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-eco-900">
                    {new Date(spot.event_date).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-eco-200/60">
                    <a
                      href={getGoogleCalendarUrl(spot)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-eco-200 bg-white px-2.5 py-1 text-xs font-semibold text-eco-700 hover:bg-eco-50 shadow-xs"
                    >
                      📅 Google Календарь
                    </a>
                    <IcsExportButton spot={spot} />
                  </div>
                </div>
              )}

              {/* Виджет погоды в Уральске */}
              <CleanupWeatherWidget />

              {/* Сложность */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-eco-500 uppercase tracking-wide">Сложность уборки</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < spot.difficulty ? "fill-amber-400 text-amber-400" : "text-eco-200"}
                    />
                  ))}
                  <span className="ml-2 text-xs text-eco-500">{spot.difficulty} из 5</span>
                </div>
              </div>

              {/* Донат прогресс */}
              {spot.difficulty >= 4 && donation && donation.status !== "rejected" && (
                <DonationProgress
                  donation={donation}
                  kaspiNumber={kaspiNumber}
                  commissionPercent={commissionPercent}
                />
              )}

              {/* Форма запроса доната */}
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

              {/* Фото до/после — если есть обе фото, показываем интерактивный слайдер */}
              {spot.photo_before_url && spot.photo_after_url ? (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-eco-500 uppercase tracking-wide">
                    Результат уборки (тяни ползунок)
                  </p>
                  <BeforeAfterSlider
                    beforeUrl={spot.photo_before_url}
                    afterUrl={spot.photo_after_url}
                  />
                </div>
              ) : (spot.photo_before_url || spot.photo_after_url) ? (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-eco-500 uppercase tracking-wide">Фотографии</p>
                  <div className="grid grid-cols-2 gap-2">
                    {spot.photo_before_url && (
                      <div>
                        <p className="mb-1 text-xs text-eco-400">До</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={spot.photo_before_url}
                          alt="Фото до уборки"
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      </div>
                    )}
                    {spot.photo_after_url && (
                      <div>
                        <p className="mb-1 text-xs text-eco-400">После</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={spot.photo_after_url}
                          alt="Фото после уборки"
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Волонтёры */}
              {volunteers.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-eco-500 uppercase tracking-wide">
                    <Users size={12} /> В работе: {volunteers.length} чел.
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {volunteers.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center gap-1.5 rounded-full bg-eco-50 px-2.5 py-1 text-xs text-eco-800"
                      >
                        <Avatar
                          displayName={v.display_name}
                          avatarUrl={v.avatar_url}
                          size="sm"
                          className="h-4 w-4 text-[9px]"
                        />
                        {v.display_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Сообщение об ошибке */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Кнопки действий */}
              {userId && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {spot.status !== "done" && !isVolunteer && (
                    <Button size="sm" variant="primary" disabled={joinBusy} onClick={joinVolunteers}>
                      {joinBusy ? <Loader2 size={14} className="animate-spin" /> : <HandHeart size={14} />}
                      Взять в работу
                    </Button>
                  )}

                  {isVolunteer && spot.status === "in_progress" && (
                    <>
                      <Button size="sm" variant="secondary" disabled={leaveBusy} onClick={leaveVolunteers}>
                        {leaveBusy ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                        Отказаться
                      </Button>
                      <Button size="sm" variant="primary" disabled={leaveBusy} onClick={() => setCloseOpen(true)}>
                        <CheckCircle2 size={14} /> Закрыть метку
                      </Button>
                    </>
                  )}

                  <Button size="sm" variant="secondary" disabled={favBusy} onClick={toggleFavorite}>
                    {favBusy
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Heart size={14} className={isFavorite ? "fill-eco-700" : ""} />
                    }
                    {isFavorite ? "В избранном" : "В избранное"}
                  </Button>

                  <ShareButton spotId={spot.id} spotTitle={spot.title} />

                  <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
                    <Pencil size={14} /> Редактировать
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Таб "Обсуждение" — SpotChat теперь встроен, не Dialog */}
          {activeTab === "chat" && spot && (
            <SpotChat
              spotId={spot.id}
              spotTitle={spot.title}
              userId={userId}
              // Встроенный режим — чат рендерится внутри sidebar, не как Dialog
              inline
            />
          )}
        </div>
      </div>

      {/* Modal закрытия метки — z-index выше sidebar */}
      {userId && spot && (
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

      {/* Modal редактирования метки — модератор/админ получает полный доступ к ЛЮБОЙ метке */}
      {userId && spot && (
        <Modal open={editOpen} onOpenChange={setEditOpen} title="Редактировать метку">
          <EditSpotForm
            spot={spot}
            userId={userId}
            isCreator={userId === spot.created_by}
            canEditAll={myRole === "moderator" || myRole === "admin"}
            onDone={() => {
              setEditOpen(false);
              onChanged();
            }}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}

// ─── Вспомогательный компонент TabButton ─────────────────────────────────────

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors",
        "border-b-2",
        active
          ? "border-eco-600 text-eco-800 bg-eco-50/50"
          : "border-transparent text-eco-500 hover:text-eco-700 hover:bg-eco-50",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
