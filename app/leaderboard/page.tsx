"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Award, Medal, Users, MapPin, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface VolunteerRank {
  id: string;
  display_name: string;
  avatar_url: string | null;
  createdCount: number;
  volunteeredCount: number;
  totalScore: number;
  badgeTitle: string;
}

export default function LeaderboardPage() {
  const supabase = createClient();
  const [leaderboard, setLeaderboard] = useState<VolunteerRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        // Загрузка пользователей
        const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url");
        if (!profiles) return;

        // Загрузка статистики созданных меток
        const { data: spots } = await supabase.from("spots").select("created_by");
        // Загрузка статистики участия в субботниках
        const { data: volunteers } = await supabase.from("spot_volunteers").select("user_id");

        const spotCounts: Record<string, number> = {};
        (spots ?? []).forEach((s) => {
          if (s.created_by) {
            spotCounts[s.created_by] = (spotCounts[s.created_by] || 0) + 1;
          }
        });

        const volunteerCounts: Record<string, number> = {};
        (volunteers ?? []).forEach((v) => {
          volunteerCounts[v.user_id] = (volunteerCounts[v.user_id] || 0) + 1;
        });

        const ranks: VolunteerRank[] = profiles.map((p) => {
          const createdCount = spotCounts[p.id] || 0;
          const volunteeredCount = volunteerCounts[p.id] || 0;
          // Очки: каждый субботник = 10 очков, каждая отмеченная точка = 5 очков
          const totalScore = volunteeredCount * 10 + createdCount * 5;

          let badgeTitle = "🌱 Начинающий Волонтёр";
          if (totalScore >= 50) badgeTitle = "👑 Легенда Чистоты";
          else if (totalScore >= 30) badgeTitle = "🏆 Мастер EcoTown";
          else if (totalScore >= 15) badgeTitle = "🌿 Эко-Активист";

          return {
            id: p.id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            createdCount,
            volunteeredCount,
            totalScore,
            badgeTitle,
          };
        });

        // Сортировка по очкам
        ranks.sort((a, b) => b.totalScore - a.totalScore);
        setLeaderboard(ranks.filter((r) => r.totalScore > 0));
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-eco-50/40 text-eco-950 flex flex-col">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 flex-1">
        {/* Заголовок */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-xs">
            <Trophy size={14} className="text-amber-600" /> Таблица Лидеров
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-eco-900 sm:text-4xl">
            Топ Эко-Волонтёров Уральска
          </h1>
          <p className="mt-2 text-sm text-eco-600 max-w-lg mx-auto leading-relaxed">
            Самые активные жители, делающие наш город чище. Набирайте баллы за добавление точек и участие в субботниках!
          </p>
        </div>

        {/* Сетка лидеров */}
        {loading ? (
          <div className="py-16 text-center text-eco-500 font-medium animate-pulse">
            Считаем эко-баллы и звания…
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-eco-200 bg-white p-8 text-center shadow-xs">
            <Users size={36} className="mx-auto text-eco-400 mb-2" />
            <h3 className="font-bold text-eco-800 text-base">Лидерборд пока пуст</h3>
            <p className="text-xs text-eco-600 mt-1">
              Будьте первым, кто организует субботник в Уральске!
            </p>
            <Link href="/map" className="inline-block mt-4">
              <Button size="sm">Перейти к карте</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user, index) => {
              const place = index + 1;
              let medalIcon = null;
              if (place === 1) medalIcon = <Trophy size={20} className="text-amber-500" />;
              else if (place === 2) medalIcon = <Medal size={20} className="text-gray-400" />;
              else if (place === 3) medalIcon = <Award size={20} className="text-amber-700" />;

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-xs transition-all ${
                    place === 1
                      ? "border-amber-200 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/20 shadow-sm"
                      : "border-eco-100 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center font-display font-extrabold text-sm text-eco-800">
                      {medalIcon ?? `#${place}`}
                    </div>

                    <Avatar
                      displayName={user.display_name}
                      avatarUrl={user.avatar_url}
                      size="md"
                    />

                    <div className="min-w-0">
                      <div className="font-display font-bold text-eco-900 text-sm truncate flex items-center gap-2">
                        {user.display_name}
                      </div>
                      <div className="text-xs font-semibold text-eco-600 mt-0.5">
                        {user.badgeTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div className="hidden sm:block text-xs text-eco-600">
                      <div>Субботников: <span className="font-bold text-eco-900">{user.volunteeredCount}</span></div>
                      <div>Точек: <span className="font-bold text-eco-900">{user.createdCount}</span></div>
                    </div>

                    <div className="rounded-xl bg-eco-50 border border-eco-200 px-3 py-1.5">
                      <div className="font-display font-extrabold text-eco-800 text-base leading-none">
                        {user.totalScore}
                      </div>
                      <div className="text-[10px] text-eco-500 font-semibold mt-0.5">БАЛЛОВ</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
