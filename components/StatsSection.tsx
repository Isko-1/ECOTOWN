import { MapPin, Wallet, Users, Sparkles, PenLine, HandHeart, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function StatsSection() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [spots, spotsNew, spotsInProgress, spotsDone, volunteers, recentlyClosed, donations] = await Promise.all([
    supabase.from("spots").select("id", { count: "exact", head: true }),
    supabase.from("spots").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("spots").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("spots").select("id", { count: "exact", head: true }).eq("status", "done"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("spots").select("id", { count: "exact", head: true }).eq("status", "done").gte("closed_at", thirtyDaysAgo),
    supabase.from("spot_donations").select("collected_amount").in("status", ["approved", "completed"]),
  ]);

  const total        = spots.count         ?? 0;
  const newCount     = spotsNew.count      ?? 0;
  const inProgCount  = spotsInProgress.count ?? 0;
  const doneCount    = spotsDone.count     ?? 0;
  const donatedTotal = (donations.data ?? []).reduce((s, d) => s + Number(d.collected_amount ?? 0), 0);

  // Воронка: процент на каждом шаге считается от предыдущего (конверсия шаг-к-шагу)
  // Шаг 1: все метки → сколько взято в работу или уже закрыто
  const takenOrDone   = inProgCount + doneCount;
  const step1Percent  = total > 0 ? Math.round((takenOrDone / total) * 100) : 0;
  // Шаг 2: из взятых в работу → сколько закрыто
  const step2Percent  = takenOrDone > 0 ? Math.round((doneCount / takenOrDone) * 100) : 0;

  const headline = [
    { icon: MapPin,     value: total,                                              label: "Меток на карте"      },
    { icon: Users,      value: volunteers.count ?? 0,                              label: "Волонтёров с нами"   },
    { icon: Wallet,     value: `${donatedTotal.toLocaleString("ru-RU")} ₸`,        label: "Собрано на донаты"   },
    { icon: Sparkles,   value: recentlyClosed.count ?? 0,                          label: "Уборок за 30 дней"   },
  ];

  const funnel = [
    {
      icon: PenLine,
      label: "Создано меток",
      value: total,
      subLabel: "100% — отправная точка",
      barWidth: 100,
      color: "eco" as const,
    },
    {
      icon: HandHeart,
      label: "Взято в работу",
      value: takenOrDone,
      subLabel: `${step1Percent}% от всех меток`,
      barWidth: step1Percent,
      color: "amber" as const,
    },
    {
      icon: CheckCircle2,
      label: "Убрано",
      value: doneCount,
      subLabel: `${step2Percent}% из взятых в работу`,
      barWidth: step2Percent,
      color: "eco" as const,
    },
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

        {/* Воронка: путь метки */}
        <div className="mt-10 rounded-2xl border border-eco-100 bg-white p-6 md:p-10">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-eco-900">Путь метки от создания до закрытия</h3>
            <span className="text-xs text-eco-400">{newCount} ещё ждут уборки</span>
          </div>
          <p className="mb-8 text-xs text-eco-500">
            Конверсия считается пошагово: каждый уровень — доля от предыдущего.
          </p>

          <div className="relative grid grid-cols-3 gap-3 sm:gap-6">
            {/* Соединительная линия */}
            <div className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-7 h-0.5 bg-eco-100" />

            {funnel.map((step) => {
              const iconBg  = step.color === "amber" ? "bg-amber-500" : "bg-eco-600";
              const barColor = step.color === "amber" ? "bg-amber-500" : "bg-eco-600";
              return (
                <div key={step.label} className="relative flex flex-col items-center text-center">
                  <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full ${iconBg} text-white shadow-sm`}>
                    <step.icon size={24} />
                  </div>

                  <p className="mt-4 font-display text-3xl font-bold text-eco-900 sm:text-4xl">{step.value}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-eco-500 sm:text-sm">
                    {step.label}
                  </p>

                  <div className="mt-3 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full border border-eco-100 bg-eco-50">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${step.barWidth}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-eco-400">{step.subLabel}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


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

  const [spots, done, volunteers, takenSpotIds, recentlyClosed, donations, newSpots] = await Promise.all([
    supabase.from("spots").select("*", { count: "exact", head: true }),
    supabase.from("spots").select("*", { count: "exact", head: true }).eq("status", "done"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("spot_volunteers").select("spot_id"),
    supabase.from("spots").select("*", { count: "exact", head: true }).eq("status", "done").gte("closed_at", thirtyDaysAgo),
    supabase.from("spot_donations").select("collected_amount").in("status", ["approved", "completed"]),
    supabase.from("spots").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const total = spots.count ?? 0;
  const doneCount = done.count ?? 0;
  const newCount = newSpots.count ?? 0;
  const takenCount = new Set((takenSpotIds.data ?? []).map((r) => r.spot_id)).size;
  const donatedTotal = (donations.data ?? []).reduce((sum, d) => sum + Number(d.collected_amount ?? 0), 0);

  const newPercent = total > 0 ? Math.round((newCount / total) * 100) : 0;
  const takenPercent = total > 0 ? Math.round((takenCount / total) * 100) : 0;
  const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const headline = [
    { icon: MapPin, value: total, label: "Меток на карте" },
    { icon: Users, value: volunteers.count ?? 0, label: "Волонтёров с нами" },
    { icon: Wallet, value: `${donatedTotal.toLocaleString("ru-RU")} ₸`, label: "Собрано на донаты" },
    { icon: Sparkles, value: recentlyClosed.count ?? 0, label: "Уборок за 30 дней" },
  ];

  const funnel = [
    { icon: PenLine, label: "Новые", value: newCount, percent: newPercent, color: "eco" as const },
    { icon: HandHeart, label: "Взято в работу", value: takenCount, percent: takenPercent, color: "amber" as const },
    { icon: CheckCircle2, label: "Закрыто", value: doneCount, percent: donePercent, color: "eco" as const },
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
        <div className="mt-10 rounded-2xl border border-eco-100 bg-white p-6 md:p-10">
          <h3 className="font-display text-base font-semibold text-eco-900">Путь метки от создания до закрытия</h3>

          <div className="relative mt-10 grid grid-cols-3 gap-3 sm:gap-6">
            {/* Соединительная линия за иконками — рисуется один раз под всей строкой */}
            <div className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-7 h-0.5 bg-eco-100" />

            {funnel.map((step) => {
              const iconBg = step.color === "amber" ? "bg-amber-500" : "bg-eco-600";
              const barColor = step.color === "amber" ? "bg-amber-500" : "bg-eco-600";
              return (
                <div key={step.label} className="relative flex flex-col items-center text-center">
                  <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full ${iconBg} text-white shadow-sm`}>
                    <step.icon size={24} />
                  </div>

                  <p className="mt-4 font-display text-3xl font-bold text-eco-900 sm:text-4xl">{step.value}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-eco-500 sm:text-sm">
                    {step.label}
                  </p>

                  <div className="mt-3 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full border border-eco-100 bg-eco-50">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${step.percent}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-eco-400">{step.percent}% от общего числа</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
