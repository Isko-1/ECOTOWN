"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { CheckCircle2, Lock } from "lucide-react";

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  current: number;
  max: number;
};

export function UserAchievements({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        // 1. Созданные метки пользователя
        const { count: spotsCreated } = await supabase
          .from("spots")
          .select("*", { count: "exact", head: true })
          .eq("created_by", profile.id);

        // 2. Метки, где у пользователя загружено хотя бы одно фото
        const { data: userSpots } = await supabase
          .from("spots")
          .select("photo_before_url, photo_after_url")
          .eq("created_by", profile.id);

        const photosCount = (userSpots ?? []).filter(
          (s) => Boolean(s.photo_before_url) || Boolean(s.photo_after_url)
        ).length;

        // 3. Метки, в которые записался как волонтёр
        const { count: spotsJoined } = await supabase
          .from("spot_volunteers")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id);

        // 4. Закрытые метки (где статус done и пользователь либо автор, либо волонтёр)
        const { count: doneCreated } = await supabase
          .from("spots")
          .select("*", { count: "exact", head: true })
          .eq("created_by", profile.id)
          .eq("status", "done");

        if (cancelled) return;

        const created = spotsCreated ?? 0;
        const joined = spotsJoined ?? 0;
        const closed = doneCreated ?? 0;
        const hasPhone = Boolean(profile.phone && profile.phone.trim().length > 3);

        const list: Achievement[] = [
          {
            id: "welcome",
            icon: "🚀",
            title: "«В деле!»",
            description: "Зарегистрировался в EcoTown и заполнил свой профиль",
            unlocked: true,
            current: 1,
            max: 1,
          },
          {
            id: "created_spot",
            icon: "👁️",
            title: "«Заметил непорядок»",
            description: "Отметил первую загрязнённую точку на карте города",
            unlocked: created >= 1,
            current: Math.min(created, 1),
            max: 1,
          },
          {
            id: "joined_volunteer",
            icon: "🧤",
            title: "«На субботнике»",
            description: "Присоединился к команде уборки хотя бы одной метки",
            unlocked: joined >= 1,
            current: Math.min(joined, 1),
            max: 1,
          },
          {
            id: "photo_uploader",
            icon: "📸",
            title: "«Я СНИМАЮ!»",
            description: "Загрузил наглядные снимки До или После уборки",
            unlocked: photosCount >= 1,
            current: Math.min(photosCount, 1),
            max: 1,
          },
          {
            id: "team_player",
            icon: "💪",
            title: "«Своих не бросаем»",
            description: "Поучаствовал в 3+ уборках вместе с другими волонтёрами",
            unlocked: joined >= 3,
            current: Math.min(joined, 3),
            max: 3,
          },
          {
            id: "eco_hero",
            icon: "🏆",
            title: "«Орал скажет спасибо»",
            description: "Успешно довел до конца или убрал 5+ меток в городе",
            unlocked: closed >= 5,
            current: Math.min(closed, 5),
            max: 5,
          },
          {
            id: "phone_added",
            icon: "🤝",
            title: "«Человек слова»",
            description: "Указал контактный номер телефона для оперативной связи",
            unlocked: hasPhone,
            current: hasPhone ? 1 : 0,
            max: 1,
          },
        ];

        setAchievements(list);
      } catch (err) {
        console.error("Error loading achievements:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [profile.id, profile.phone]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-eco-900">Мои ачивки и награды</h2>
        <div className="mt-4 flex gap-2 text-sm text-eco-500 animate-pulse">
          Считаем ваши эко-подвиги…
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="rounded-2xl border border-eco-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-eco-100 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-eco-900">Мои достижения</h2>
          <p className="text-xs text-eco-500">За каждый вклад в чистоту Уральска вы получаете значки</p>
        </div>
        <div className="rounded-full bg-eco-50 px-3 py-1 text-xs font-semibold text-eco-700">
          Разблокировано {unlockedCount} из {achievements.length}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {achievements.map((item) => (
          <div
            key={item.id}
            className={[
              "relative flex items-start gap-3 rounded-xl border p-3.5 transition-all",
              item.unlocked
                ? "border-eco-200 bg-eco-50/50 shadow-sm"
                : "border-eco-100 bg-gray-50/60 opacity-65",
            ].join(" ")}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border border-eco-100">
              {item.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-display text-sm font-semibold text-eco-900 truncate">
                  {item.title}
                </h3>
                {item.unlocked ? (
                  <CheckCircle2 size={16} className="shrink-0 text-eco-600" />
                ) : (
                  <Lock size={14} className="shrink-0 text-gray-400" />
                )}
              </div>

              <p className="mt-0.5 text-xs leading-relaxed text-eco-600">
                {item.description}
              </p>

              {/* Прогресс бар для накопительных ачивок */}
              {item.max > 1 && (
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] font-medium text-eco-500 mb-1">
                    <span>Прогресс</span>
                    <span>
                      {item.current} / {item.max}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-eco-100 overflow-hidden">
                    <div
                      className="h-full bg-eco-600 rounded-full transition-all duration-500"
                      style={{ width: `${(item.current / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
