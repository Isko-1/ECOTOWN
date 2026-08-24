import { MapPin, Wallet, Users, Sparkles, ArrowRight, ArrowDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Публичная статистика на главной странице.
 *
 * Функция приватных меток удалена ещё миграцией 0008_moderation_and_cleanup.sql —
 * колонки is_public больше нет, RLS на spots — "using(true)" (все метки публичны).
 * Раньше здесь оставался .eq("is_public", true) — колонка не существовала, фильтр
 * молча ломал счётчики (показывал 0 меток). Убран.
 */
export async function StatsSection() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [spots, done, volunteers, takenSpotIds, recentlyClosed, donations] = await Promise.all([
    supabase.from("spots").select("*", { count: "exact", head: true }),
    supabase.from("spots").select("*", { count: "exact", head: true }).eq("status", "done"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("spot_volunteers").select("spot_id"),
    supabase.from("spots").select("*", { count: "exact", head: true }).eq("status", "done").gte("closed_at", thirtyDaysAgo),
    supabase.from("spot_donations").select("collected_amount").in("status", ["approved", "completed"]),
  ]);

  const total = spots.count ?? 0;
  const doneCount = done.count ?? 0;
  const takenCount = new Set((takenSpotIds.data ?? []).map((r) => r.spot_id)).size;
  const donatedTotal = (donations.data ?? []).reduce((sum, d) => sum + Number(d.collected_amount ?? 0), 0);

  const takenPercent = total > 0 ? Math.round((takenCount / total) * 100) : 0;
  const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const headline = [
    { icon: MapPin, value: total, label: "Меток на карте" },
    { icon: Users, value: volunteers.count ?? 0, label: "Волонтёров с нами" },
    { icon: Wallet, value: `${donatedTotal.toLocaleString("ru-RU")} ₸`, label: "Собрано на донаты" },
    { icon: Sparkles, value: recentlyClosed.count ?? 0, label: "Уборок за 30 дней" },
  ];

  const funnel = [
    { label: "Создано", value: total, percent: 100 },
    { label: "Взято в работу", value: takenCount, percent: takenPercent },
    { label: "Закрыто", value: doneCount, percent: donePercent },
  ];

  return (
    <section className="border-t border-eco-100 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-2xl font-bold text-eco-900 md:text-3xl">EcoTown в цифрах</h2>

        {/* Ключевые показатели */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {headline.map((s) => (
            <div key={s.label} className="rounded-2xl border border-eco-100 bg-white p-6 text-center">
              <s.icon className="mx-auto text-eco-600" size={28} />
              <p className="mt-3 font-display text-3xl font-bold text-eco-900">{s.value}</p>
              <p className="mt-1 text-sm text-eco-700">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Воронка: путь метки от создания до закрытия */}
        <div className="mt-10 rounded-2xl border border-eco-100 bg-eco-50/50 p-6 md:p-8">
          <h3 className="font-display text-base font-semibold text-eco-900">Путь метки от создания до закрытия</h3>
          <div className="mt-6 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-0">
            {funnel.map((step, i) => (
              <div key={step.label} className="flex flex-1 items-center md:items-stretch">
                <div className="flex-1 rounded-xl border border-eco-100 bg-white p-5 text-center shadow-sm">
                  <p className="font-display text-3xl font-bold text-eco-900">{step.value}</p>
                  <p className="mt-1 text-sm text-eco-700">{step.label}</p>
                  <div className="mx-auto mt-3 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-eco-100">
                    <div className="h-full rounded-full bg-eco-600" style={{ width: `${step.percent}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-eco-500">{step.percent}%</p>
                </div>

                {i < funnel.length - 1 && (
                  <>
                    <ArrowRight className="mx-3 hidden shrink-0 text-eco-300 md:block" size={22} />
                    <div className="flex justify-center py-1 md:hidden">
                      <ArrowDown className="text-eco-300" size={20} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
