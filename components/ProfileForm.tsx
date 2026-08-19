"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import type { Profile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

async function uploadAvatar(file: File, userId: string) {
  const supabase = createClient();
  // аватар всегда круглый и маленький на экране — 512px хватает с запасом
  const compressed = await compressImage(file, 512, 0.85);
  // одно фиксированное имя на пользователя — новая загрузка перезаписывает старую
  const path = `${userId}/avatar-${Date.now()}.${compressed.name.split(".").pop()}`;
  const { error } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [city, setCity] = useState(profile.city ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const previewUrl = avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile, profile.id);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          city: city || null,
          phone: phone || null,
          bio: bio || null,
          avatar_url: newAvatarUrl,
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar displayName={displayName || "?"} avatarUrl={previewUrl} size="lg" />
        <div>
          <label className="inline-block cursor-pointer rounded-full border border-eco-200 px-3 py-1.5 text-sm font-medium text-eco-800 hover:bg-eco-50">
            Сменить фото
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-1 text-xs text-eco-500">JPG или PNG, до пары мегабайт</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-eco-800">Имя</label>
        <Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-eco-800">Город / район</label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Уральск, Ленинский" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-eco-800">Номер телефона (для связи и Kaspi)</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (705) 000-00-00" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-eco-800">О себе</label>
        <Textarea
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Пара слов о себе — почему ты в EcoTown"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-eco-700">Сохранено.</p>}

      <Button type="submit" disabled={busy} className="self-start">
        {busy ? "Сохраняем…" : "Сохранить профиль"}
      </Button>
    </form>
  );
}
