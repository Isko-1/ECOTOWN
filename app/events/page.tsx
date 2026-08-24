"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Spot } from "@/lib/types";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { IcsExportButton } from "@/components/IcsExportButton";
import { CleanupWeatherWidget } from "@/components/CleanupWeatherWidget";

function getGoogleCalendarUrl(spot: Spot) {
  if (!spot.event_date) return "";
  const startDate = new Date(spot.event_date);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const title = encodeURIComponent(`Субботник EcoTown: ${spot.title}`);
  const details = encodeURIComponent(`${spot.description}\n\nПодробности на сайте EcoTown.`);
  const location = encodeURIComponent(`Координаты: ${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatUtc(startDate)}/${formatUtc(endDate)}&details=${details}&location=${location}`;
}

export default function EventsPage() {
  const supabase = createClient();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data } = await supabase
          .from("spots")
          .select("*")
          .not("event_date", "is", null)
          .order("event_date", { ascending: true });

        setSpots(data ?? []);
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [supabase]);

  // Разделение на предстоящие и прошедшие события
  const now = new Date();
  const upcomingEvents = spots.filter((s) => s.event_date && new Date(s.event_date) >= now);
  const pastEvents = spots.filter((s) => s.event_date && new Date(s.event_date) < now);

  return (
    <div className="min-h-screen bg-eco-50/40 text-eco-950 flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1">
        {/* Шапка страницы */}
        <div className="mb-8 rounded-3xl border border-eco-200/80 bg-gradient-to-br from-eco-600 via-eco-700 to-emerald-700 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Calendar size={14} /> Календарь EcoTown
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">
                Предстоящие субботники Уральска
              </h1>
              <p className="mt-2 text-sm text-eco-100 max-w-xl leading-relaxed">
                Выбирайте дату, экспортируйте событие в календарь своего смартфона и присоединяйтесь к уборке грязных точек города.
              </p>
            </div>

            <div className="shrink-0">
              <Link href="/map">
                <Button size="lg" variant="white" className="shadow-lg">
                  <MapPin size={18} className="text-eco-700" />
                  Открыть карту
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Погодный виджет города */}
        <div className="mb-8">
          <CleanupWeatherWidget />
        </div>

        {/* Секция предстоящих событий */}
        <section className="mb-10">
          <div className="flex items-center justify-between border-b border-eco-200/80 pb-3 mb-6">
            <h2 className="font-display text-xl font-extrabold text-eco-900 flex items-center gap-2">
              <Sparkles size={20} className="text-eco-600" />
              Запланированные уборки ({upcomingEvents.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-eco-500 font-medium animate-pulse">
              Загружаем расписание субботников…
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-eco-200 bg-white p-8 text-center shadow-xs">
              <Calendar size={36} className="mx-auto text-eco-400 mb-2" />
              <h3 className="font-bold text-eco-800 text-base">Пока нет запланированных субботников</h3>
              <p className="text-xs text-eco-600 mt-1 max-w-md mx-auto">
                Вы можете отметить место на карте и указать дату уборки, чтобы пригласить волонтёров!
              </p>
              <Link href="/map" className="inline-block mt-4">
                <Button size="sm">Отметить место на карте</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingEvents.map((spot) => {
                const eventDate = new Date(spot.event_date!);
                return (
                  <div
                    key={spot.id}
                    className="flex flex-col justify-between rounded-2xl border border-eco-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-eco-300"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded-full bg-eco-100 px-2.5 py-1 text-xs font-bold text-eco-800 flex items-center gap-1">
                          <Clock size={13} className="text-eco-600" />
                          {eventDate.toLocaleString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            spot.status === "new"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {spot.status === "new" ? "🔴 Нужна помощь" : "🟡 В работе"}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-eco-900 leading-snug">
                        {spot.title}
                      </h3>
                      <p className="mt-1 text-xs text-eco-600 line-clamp-2 leading-relaxed">
                        {spot.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-eco-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={getGoogleCalendarUrl(spot)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-eco-200 bg-eco-50/70 px-2 py-1 text-xs font-semibold text-eco-800 hover:bg-eco-100"
                        >
                          📅 Google
                        </a>
                        <IcsExportButton spot={spot} />
                      </div>

                      <Link href="/map">
                        <Button size="sm" variant="secondary" className="text-xs gap-1">
                          Перейти <ArrowRight size={13} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Прошедшие уборки */}
        {pastEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between border-b border-eco-200/80 pb-3 mb-4">
              <h2 className="font-display text-lg font-bold text-eco-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-eco-600" />
                Завершенные акции ({pastEvents.length})
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((spot) => (
                <div key={spot.id} className="rounded-xl border border-eco-100 bg-white p-4 text-xs shadow-2xs">
                  <div className="font-bold text-eco-900 truncate">{spot.title}</div>
                  <div className="text-[11px] text-eco-500 mt-0.5">
                    {new Date(spot.event_date!).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
