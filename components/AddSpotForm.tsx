"use client";

import { useState } from "react";
import { Star, HandCoins } from "lucide-react";
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
  const [wantsDonation, setWantsDonation] = useState(false);
  const [donationGoal, setDonationGoal] = useState("");
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

      const { data: inserted, error: insertError } = await supabase
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
          donation_goal: wantsDonation ? donationGoal : null,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      if (wantsDonation && donationGoal.trim()) {
        // Письмо модератору — ошибка отправки не должна ломать создание метки
        fetch("/api/donation-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spotId: inserted.id, spotTitle: title, goal: donationGoal }),
        }).catch(() => {});
      }

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
          <div className="mt-2 rounded-lg bg-eco-50 p-2">
            {!wantsDonation ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setWantsDonation(true)}>
                <HandCoins size={14} /> Добавить донат
              </Button>
            ) : (
              <div>
                <label className="mb-1 block font-medium text-eco-800">На что нужны деньги</label>
                <Textarea
                  required
                  rows={2}
                  value={donationGoal}
                  onChange={(e) => setDonationGoal(e.target.value)}
                  placeholder="Например: перчатки и мешки для мусора, на 5000⁄9000 ₸"
                />
                <p className="mt-1 text-[11px] text-eco-500">
                  После сохранения мы отправим заявку модератору — он подключит номер для перевода, это может занять время.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWantsDonation(false);
                    setDonationGoal("");
                  }}
                  className="mt-1 text-[11px] text-eco-500 underline"
                >
                  Отменить
                </button>
              </div>
            )}
          </div>
        )}
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
