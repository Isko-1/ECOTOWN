import { Clock, Timer, Repeat, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const hours = seconds / 3600;
  if (hours < 24) return `${hours.toFixed(1)} ч`;
  return `${(hours / 24).toFixed(1)} дн`;
}

/**
 * Статистика для админки: скорость обработки и вовлечённость — вещи, которые
 * не показываются публично (воронка конверсии — на главной странице, см. StatsSection.tsx).
 * Данные считаются одним SQL-вызовом на сервере (см. admin_dashboard_stats() в
 * supabase/migrations/0009_admin_dashboard_stats.sql) — здесь только форматирование.
 */
export async function AdminStatsPanel() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-medium">Не удалось загрузить статистику.</p>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
        <p className="mt-2 text-xs text-red-500">
          Скорее всего функция admin_dashboard_stats() ещё не выполнена в Supabase SQL Editor —
          см. supabase/migrations/0009_admin_dashboard_stats.sql.
        </p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-red-600">Не удалось загрузить статистику.</p>;
  }

  const s = data;
  const retention = s.total_volunteers > 0 ? Math.round((s.repeat_volunteers / s.total_volunteers) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Скорость обработки */}
      <section>
        <h3 className="font-display text-sm font-semibold text-eco-900 uppercase tracking-wide">
          Скорость обработки
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <StatCard
            icon={Clock}
            label="Среднее время реакции"
            value={formatDuration(s.avg_response_seconds)}
            hint="От создания метки до взятия в работу"
          />
          <StatCard
            icon={Timer}
            label="Время до очистки (MTTR)"
            value={formatDuration(s.avg_mttr_seconds)}
            hint="От создания метки до фото «после»"
          />
        </div>
      </section>

      {/* Вовлечённость */}
      <section>
        <h3 className="font-display text-sm font-semibold text-eco-900 uppercase tracking-wide">
          Вовлечённость
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatCard icon={Activity} label="DAU" value={String(s.dau)} hint="Активных пользователей за 24ч" />
          <StatCard icon={Activity} label="MAU" value={String(s.mau)} hint="Активных пользователей за 30 дней" />
          <StatCard
            icon={Repeat}
            label="Retention волонтёров"
            value={`${retention}%`}
            hint={`${s.repeat_volunteers} из ${s.total_volunteers} брали метку повторно`}
          />
        </div>
        <p className="mt-2 text-xs text-eco-500">
          DAU/MAU считаются по факту действия (создание метки, взятие в работу, сообщение в чате) —
          отдельного трекинга визитов/сессий в системе нет. Воронка конверсии — на главной странице
          сайта (она публичная, здесь дублировать её не нужно).
        </p>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-eco-100 bg-white p-4">
      <div className="flex items-center gap-2 text-eco-600">
        <Icon size={16} />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 font-display text-xl font-bold text-eco-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-eco-500">{hint}</p>
    </div>
  );
}
