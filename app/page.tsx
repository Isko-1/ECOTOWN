import Link from "next/link";
import {
  MapPin,
  Users,
  ImageIcon,
  UserPlus,
  PenLine,
  HandHeart,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ContactForm } from "@/components/ContactForm";
import { StatsSection } from "@/components/StatsSection";
import { RecentCleanupsSection } from "@/components/RecentCleanupsSection";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { createClient } from "@/lib/supabase/server";

const pillars = [
  {
    icon: MapPin,
    title: "Карта загрязнений Уральска",
    text: "Отмечайте свалки, замусоренные дворы и заброшенные территории прямо на карте города.",
    tag: "Локации",
  },
  {
    icon: Users,
    title: "Команда волонтёров Орала",
    text: "Присоединяйтесь к субботникам, берите метки в работу и объединяйтесь с соседями.",
    tag: "Сообщество",
  },
  {
    icon: ImageIcon,
    title: "Результаты «До / После»",
    text: "Каждая закрытая метка подтверждается реальными фотографиями проведения уборки.",
    tag: "Пруфы",
  },
];

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Зарегистрируйся",
    text: "Заведи аккаунт волонтёра за 30 секунд через Google или почту.",
  },
  {
    icon: PenLine,
    step: "02",
    title: "Отметь точку",
    text: "Укажи место на карте Уральска, сфотографируй мусор и опиши проблему.",
  },
  {
    icon: HandHeart,
    step: "03",
    title: "Выйди на субботник",
    text: "Присоединяйся к команде или собирай соседей на уборку своего двора.",
  },
  {
    icon: CheckCircle2,
    step: "04",
    title: "Закрой метку",
    text: "Загрузи фото «После» — и точка получит статус «Закрыто» с наградой!",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: { user } }, { data: realProfiles, count: profileCount }, { data: latestSpot }, { count: totalSpotsCount }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url", { count: "exact" })
        .not("display_name", "is", null)
        .limit(4),
      supabase
        .from("spots")
        .select("*")
        .eq("status", "done")
        .not("photo_before_url", "is", null)
        .not("photo_after_url", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("spots").select("*", { count: "exact", head: true }),
    ]);

  const totalSpots = totalSpotsCount ?? 0;
  const profiles = realProfiles ?? [];
  const realCount = profileCount ?? 0;

  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. Hero Section ── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-eco-50/70 via-white to-transparent">
        {/* Фоновое эко-свечение */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-eco-300/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Левая колонка (Текст и действия) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-eco-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-eco-800 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eco-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-eco-600"></span>
                </span>
                Волонтёрская платформа Уральска (Орал)
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-eco-950 tracking-tight">
                Чистый город <br />
                начинается с{" "}
                <span className="bg-gradient-to-r from-eco-600 via-eco-700 to-emerald-600 bg-clip-text text-transparent">
                  одной точки
                </span>
              </h1>

              <p className="text-base sm:text-lg text-eco-700 leading-relaxed max-w-xl">
                EcoTown — платформа, где жители Уральска отмечают загрязнённые территории, а волонтёры объединяются и проводят уборку с фотографиями результата.
              </p>

              {/* Кнопки */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link href="/profile">
                    <Button size="lg" className="bg-eco-600 hover:bg-eco-700 shadow-lg shadow-eco-600/25 transition-all hover:scale-[1.02]">
                      Личный кабинет
                      <ArrowRight size={18} className="ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button size="lg" className="bg-eco-600 hover:bg-eco-700 shadow-lg shadow-eco-600/25 transition-all hover:scale-[1.02]">
                      Присоединиться
                      <ArrowRight size={18} className="ml-1" />
                    </Button>
                  </Link>
                )}
                <Link href="/map">
                  <Button size="lg" variant="secondary" className="border border-eco-200 bg-white hover:bg-eco-50 text-eco-900 shadow-sm">
                    <MapPin size={18} className="mr-1 text-eco-600" />
                    Открыть карту Уральска
                  </Button>
                </Link>
              </div>

              {/* Социальное доказательство — ТОЛЬКО если есть РЕАЛЬНЫЕ пользователи */}
              {realCount > 0 && (
                <div className="pt-4 flex items-center gap-3 text-xs text-eco-600">
                  <div className="flex -space-x-2 overflow-hidden">
                    {profiles.map((p) => (
                      <Avatar
                        key={p.id}
                        displayName={p.display_name ?? "?"}
                        avatarUrl={p.avatar_url}
                        size="sm"
                        className="border-2 border-white"
                      />
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-eco-900">
                      {realCount} {realCount === 1 ? "зарегистрированный волонтёр" : "зарегистрированных жителей"}
                    </p>
                    <p className="text-eco-500">уже в системе EcoTown</p>
                  </div>
                </div>
              )}
            </div>

            {/* Правая колонка (Виджет — ТОЛЬКО реальные данные или карта) */}
            <div className="lg:col-span-5 relative">
              {latestSpot && latestSpot.photo_before_url && latestSpot.photo_after_url ? (
                <div className="relative rounded-3xl border border-eco-200/80 bg-white p-4 shadow-2xl shadow-eco-900/10 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <span className="text-xs font-semibold text-eco-800 truncate">
                      {latestSpot.title}
                    </span>
                    <span className="rounded-full bg-eco-100 px-2 py-0.5 text-[10px] font-bold text-eco-700 shrink-0">
                      ✨ Последняя уборка
                    </span>
                  </div>

                  <BeforeAfterSlider
                    beforeUrl={latestSpot.photo_before_url}
                    afterUrl={latestSpot.photo_after_url}
                  />
                </div>
              ) : (
                /* Если реальной закрытой метки с фото еще нет — показываем плашку интерактивной карты */
                <div className="relative rounded-3xl border border-eco-200 bg-eco-50/60 p-8 text-center shadow-lg backdrop-blur-xl space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-eco-600 text-white shadow-md">
                    <Compass size={28} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-eco-950">Карта Уральска ready</h3>
                    <p className="mt-1 text-xs text-eco-600 leading-relaxed">
                      {totalSpots > 0
                        ? `На карте отмечено ${totalSpots} точек. Откройте карту, чтобы взять метку в работу.`
                        : "Будьте первым! Отметьте загрязненное место на карте города."}
                    </p>
                  </div>
                  <Link href="/map" className="inline-block">
                    <Button variant="primary" size="sm" className="w-full">
                      Перейти к карте →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. О платформе ── */}
      <section className="border-t border-eco-100 bg-eco-50/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-eco-600">Наш подход</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-eco-950 md:text-4xl">
              Как EcoTown помогает городу
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="group relative flex flex-col justify-between rounded-3xl border border-eco-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-eco-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-50 text-eco-600 group-hover:bg-eco-600 group-hover:text-white transition-colors duration-300">
                      <p.icon size={24} />
                    </div>
                    <span className="rounded-full bg-eco-50 px-3 py-1 text-[11px] font-semibold text-eco-700">
                      {p.tag}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-eco-950 mb-2">{p.title}</h3>
                  <p className="text-sm text-eco-700 leading-relaxed">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Последние уборки в Орале (ТОЛЬКО если есть РЕАЛЬНЫЕ закрытые метки с фото) ── */}
      <RecentCleanupsSection />

      {/* ── 4. Публичная статистика ── */}
      <StatsSection />

      {/* ── 5. Как это работает ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-eco-600">Простой процесс</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-eco-950 md:text-4xl">
              Четыре шага к чистому двору
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {steps.map((s) => (
              <div
                key={s.title}
                className="relative rounded-3xl border border-eco-100 bg-eco-50/30 p-6 transition-all hover:bg-white hover:shadow-lg hover:border-eco-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-eco-700 shadow-sm border border-eco-100">
                    <s.icon size={20} />
                  </div>
                  <span className="font-display text-2xl font-black text-eco-300">{s.step}</span>
                </div>
                <h3 className="font-display text-base font-bold text-eco-950">{s.title}</h3>
                <p className="mt-2 text-xs text-eco-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Чёткий финальный призыв (Исправлен контраст шрифта: белый текст на тёмно-зелёном фоне!) ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl bg-eco-900 p-8 md:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-left space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-800 px-3 py-1 text-xs font-semibold text-eco-200 border border-eco-700">
                <Sparkles size={14} className="text-eco-400" /> Включайтесь прямо сейчас
              </span>
              <h2 className="font-display text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Готов сделать Уральск чище вместе с нами?
              </h2>
              <p className="text-sm md:text-base text-eco-100 leading-relaxed">
                Отметьте грязную точку в своём районе или присоединяйтесь к уже запланированному субботнику. Каждая метка имеет значение!
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              {user ? (
                <Link href="/profile">
                  <Button size="lg" variant="white">
                    Личный кабинет
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" variant="white">
                    Присоединиться
                  </Button>
                </Link>
              )}
              <Link href="/map">
                <Button size="lg" variant="ghost" className="border border-white/40 text-white hover:bg-white/10 font-medium">
                  Посмотреть карту
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Контакты ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-eco-900 md:text-3xl">Свяжитесь с нами</h2>
          <p className="mt-2 text-sm text-eco-600">Есть вопросы или хотите стать спонсором субботников в Орале? Пишите!</p>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
