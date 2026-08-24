"use client";

import { useState } from "react";
import { Star, Loader2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import type { Spot, SpotStatus } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

async function uploadPhoto(file: File, userId: string) {
  const supabase = createClient();
  const compressed = await compressImage(file);
  const path = `${userId}/${Date.now()}-${compressed.name}`;
  const { error } = await supabase.storage.from("spot-photos").upload(path, compressed);
  if (error) throw error;
  return supabase.storage.from("spot-photos").getPublicUrl(path).data.publicUrl;
}

const STATUS_OPTIONS: { value: SpotStatus; label: string; description: string }[] = [
  { value: "new",         label: "🔴 Новая",    description: "Место отмечено, волонтёры ещё не взяли в работу" },
  { value: "in_progress", label: "🟡 В работе", description: "Волонтёры работают над уборкой" },
  { value: "done",        label: "🟢 Закрыто",  description: "Уборка завершена" },
];

/**
 * Форма редактирования метки.
 *
 * isCreator=true  → полная форма (название, описание, сложность, фото, статус)
 * isCreator=false → только смена статуса (доступна всем залогиненным пользователям)
 */
export function EditSpotForm({
  spot,
  userId,
  isCreator,
  canEditAll,
  onDone,
  onCancel,
}: {
  spot: Spot;
  userId: string;
  isCreator: boolean;
  /** true для модератора/админа — полные права редактирования на ЛЮБУЮ метку, не только на свою */
  canEditAll?: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();

  // редакторские права на все поля — у автора метки ИЛИ у модератора/админа
  const fullAccess = isCreator || !!canEditAll;

  // ── поля только для полного доступа ──
  const [title, setTitle]               = useState(spot.title);
  const [description, setDescription]   = useState(spot.description);
  const [difficulty, setDifficulty]     = useState(spot.difficulty);
  const [eventDate, setEventDate]       = useState(
    spot.event_date ? new Date(spot.event_date).toISOString().slice(0, 16) : ""
  );
  const [beforeFile, setBeforeFile]     = useState<File | null>(null);

  // ── статус — для всех ──
  const [status, setStatus]             = useState<SpotStatus>(spot.status);

  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (fullAccess) {
        // Автор или модератор/админ обновляет всё
        let photo_before_url = spot.photo_before_url;
        if (beforeFile) {
          photo_before_url = await uploadPhoto(beforeFile, userId);
        }

        const { error: updateError } = await supabase
          .from("spots")
          .update({
            title,
            description,
            difficulty,
            status,
            photo_before_url,
            event_date: eventDate ? new Date(eventDate).toISOString() : null,
          })
          .eq("id", spot.id);

        if (updateError) throw updateError;
      } else {
        // Не-создатель — только статус
        const { error: updateError } = await supabase
          .from("spots")
          .update({ status })
          .eq("id", spot.id);

        if (updateError) throw updateError;
      }

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить изменения");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">

      {/* ── Блок: полный доступ (автор метки или модератор/админ) ── */}
      {fullAccess && (
        <>
          <div>
            <label className="mb-1 block font-medium text-eco-800">Название</label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block font-medium text-eco-800">Описание</label>
            <Textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-eco-800">Дата и время субботника</label>
            <Input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block font-medium text-eco-800">Сложность</label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDifficulty(i + 1)}
                  aria-label={`Сложность ${i + 1}`}
                >
                  <Star
                    size={22}
                    className={i < difficulty ? "fill-amber-400 text-amber-400" : "text-eco-200"}
                  />
                </button>
              ))}
              <span className="ml-2 self-center text-xs text-eco-500">{difficulty} из 5</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium text-eco-800">Фото «до» (замена)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
              className="text-xs text-eco-700"
            />
            {spot.photo_before_url && !beforeFile && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={spot.photo_before_url}
                alt="Текущее фото до"
                className="mt-2 h-20 w-auto rounded-lg object-cover"
              />
            )}
          </div>
        </>
      )}

      {/* ── Статус — для всех ── */}
      <div>
        <label className="mb-1.5 block font-medium text-eco-800">Статус метки</label>
        <div className="flex flex-col gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                status === opt.value
                  ? "border-eco-500 bg-eco-50"
                  : "border-eco-100 hover:border-eco-200",
              ].join(" ")}
            >
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={status === opt.value}
                onChange={() => setStatus(opt.value)}
                className="mt-0.5 accent-eco-600"
              />
              <div>
                <p className="font-medium text-eco-900">{opt.label}</p>
                <p className="text-xs text-eco-500">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Инфо: куда уходит заявка ── */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
        <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-xs leading-relaxed text-blue-700">
          Изменения сохраняются на карте сразу. Уведомление о новых метках и запросах на донат
          поступает администратору.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? (
            <><Loader2 size={14} className="animate-spin" /> Сохраняем…</>
          ) : (
            "Сохранить"
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
