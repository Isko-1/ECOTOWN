"use client";

import { useState } from "react";
import { Star, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import type { SpotStatus } from "@/lib/types";
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

export function AddSpotForm({
  lat,
  lng,
  userId,
  onCreated,
  onCancel,
}: {
  lat: number;
  lng: number;
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SpotStatus>("new");
  const [difficulty, setDifficulty] = useState(1);
  const [isPublic, setIsPublic] = useState(true);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const [photo_before_url, photo_after_url] = await Promise.all([
        beforeFile ? uploadPhoto(beforeFile, userId) : Promise.resolve(null),
        afterFile ? uploadPhoto(afterFile, userId) : Promise.resolve(null),
      ]);

      const { data: insertData, error: insertError } = await supabase
        .from("spots")
        .insert({
          created_by: userId,
          title,
          description,
          lat,
          lng,
          status,
          difficulty,
          is_public: isPublic,
          photo_before_url,
          photo_after_url,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // Получаем имя создателя для письма
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      // Уведомляем администратора — ошибка отправки не блокирует создание метки
      fetch("/api/notify-spot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId: insertData?.id ?? "",
          spotTitle: title,
          description,
          difficulty,
          lat,
          lng,
          creatorName: profileData?.display_name ?? "",
        }),
      }).catch(() => {});

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить метку");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-72 flex-col gap-3 text-sm">
      <p className="text-xs text-eco-500">
        Координаты: {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>

      <div>
        <label className="mb-1 block font-medium text-eco-800">Название</label>
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Свалка у реки" />
      </div>

      <div>
        <label className="mb-1 block font-medium text-eco-800">Описание</label>
        <Textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Что нужно убрать, сколько там мусора"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-eco-800">Статус</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SpotStatus)}
          className="h-10 w-full rounded-lg border border-eco-200 bg-white px-3 text-sm"
        >
          <option value="new">Новая</option>
          <option value="in_progress">В работе</option>
          <option value="done">Закрыто</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block font-medium text-eco-800">Сложность</label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setDifficulty(i + 1)}
              aria-label={`Сложность ${i + 1}`}
            >
              <Star size={20} className={i < difficulty ? "fill-amber-500 text-amber-500" : "text-eco-200"} />
            </button>
          ))}
        </div>
        {difficulty >= 4 && (
          <p className="mt-2 text-[11px] leading-snug text-eco-500">
            Метки высокой сложности можно поддержать донатом — но заявку на него сможет отправить
            только волонтёр, который возьмёт метку в работу (кнопка появится в карточке метки на карте).
          </p>
        )}
      </div>

      {/* ── Куда уходит заявка ── */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
        <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-xs leading-relaxed text-blue-700">
          Метка появится на публичной карте EcoTown. Администратор получит уведомление
          на почту <strong>iskair12@gmail.com</strong> и при необходимости свяжется с вами.
        </p>
      </div>

      <div>
        <label className="mb-1 block font-medium text-eco-800">Фото «до»</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-eco-800">Фото «после» (если уже убрано)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </div>

      <label className="flex items-center gap-2 text-eco-800">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Публичная метка
      </label>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? "Сохраняем…" : "Сохранить метку"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
