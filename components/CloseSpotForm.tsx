"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

async function uploadPhoto(file: File, userId: string) {
  const supabase = createClient();
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("spot-photos").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("spot-photos").getPublicUrl(path).data.publicUrl;
}

/** Форма завершения метки — фото «после» обязательно, статус меняется на done. */
export function CloseSpotForm({
  spotId,
  userId,
  onDone,
  onCancel,
}: {
  spotId: string;
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Фото «после» обязательно — без него метку не закрыть");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const photo_after_url = await uploadPhoto(file, userId);
      const { error: updateError } = await supabase
        .from("spots")
        .update({ status: "done", photo_after_url, closed_at: new Date().toISOString() })
        .eq("id", spotId);
      if (updateError) throw updateError;
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось закрыть метку");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
      <p className="text-eco-700">Загрузи фото убранного места — это подтверждение работы для остальных волонтёров.</p>
      <div>
        <label className="mb-1 block font-medium text-eco-800">Фото «после»</label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? "Сохраняем…" : "Закрыть метку"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
