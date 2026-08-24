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
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/ContactForm";
import { StatsSection } from "@/components/StatsSection";
import { RecentCleanupsSection } from "@/components/RecentCleanupsSection";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { createClient } from "@/lib/supabase/server";

const pillars = [
  {
    icon: MapPin,
    title: "Карта загрязнений Уральска",
    text: "Жители отмечают свалки, замусоренные дворы в Зачаганске, Деркуле и заброшенные места прямо на карте города.",
    tag: "Локации",
    color: "from-emerald-500/10 to-eco-500/5",
  },
  {
    icon: Users,
    title: "Команда волонтёров Орала",
    text: "Любой житель может присоединиться к субботнику, взять метку в работу и собрать единомышленников.",
    tag: "Сообщество",
    color: "from-blue-500/10 to-indigo-500/5",
  },
  {
    icon: ImageIcon,
    title: "Честный результат «До / После»",
    text: "Каждая закрытая метка подтверждается слайдером фотографий. Все уборки прозрачны и наглядны.",
    tag: "Пруфы",
    color: "from-amber-500/10 to-orange-500/5",
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. Hero Section (Сочный дизайнерский 2-колоночный макет) ── */}
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
                Волонтёрское движение Уральска (Орал)
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-eco-950 tracking-tight">
                Чистый город <br />
                начинается с{" "}
                <span className="bg-gradient-to-r from-eco-600 via-eco-700 to-emerald-600 bg-clip-text text-transparent">
                  одной точки
                </span>
              </h1>

              <p className="text-base sm:text-lg text-eco-700 leading-relaxed max-w-xl">
                EcoTown — карта Уральска, где жители отмечают свалки от Зачаганска до Набережной Чагана, а волонтёры объединяются и убирают их с подтверждением «До/После».
              </p>

              {/* Кнопки */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link href="/favorites">
                    <Button size="lg" className="bg-eco-600 hover:bg-eco-700 shadow-lg shadow-eco-600/25 transition-all hover:scale-[1.02]">
                      Личный кабинет
                      <ArrowRight size={18} className="ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button size="lg" className="bg-eco-600 hover:bg-eco-700 shadow-lg shadow-eco-600/25 transition-all hover:scale-[1.02]">
                      Присоединиться к движению
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

              {/* Социальное доказательство (живые волонтёры) */}
              <div className="pt-4 flex items-center gap-4 text-xs text-eco-600">
                <div className="flex -space-x-2">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-eco-600 text-white font-bold text-xs ring-2 ring-white">
                    АА
                  </div>
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs ring-2 ring-white">
                    БМ
                  </div>
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs ring-2 ring-white">
                    ДК
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-eco-900">Уже 100+ неравнодушных жителей</p>
                  <p className="text-eco-500">участвуют в уборках Уральска</p>
                </div>
              </div>
            </div>

            {/* Правая колонка (Интерактивный виджет превью с ползунком До/После) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl border border-eco-200/80 bg-white p-4 shadow-2xl shadow-eco-900/10 backdrop-blur-xl">
                {/* Плашка заголовка превью */}
                <div className="mb-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-eco-500" />
                    <span className="ml-1 text-xs font-semibold text-eco-800">Пример уборки в Уральске</span>
                  </div>
                  <span className="rounded-full bg-eco-100 px-2 py-0.5 text-[10px] font-bold text-eco-700">
                    ✨ Убрано!
                  </span>
                </div>

                {/* Интерактивный слайдер */}
                <BeforeAfterSlider
                  beforeUrl="https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80"
                  afterUrl="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                  beforeLabel="До: Набережная"
                  afterLabel="После: Чистота!"
                />

                {/* Плавающие стеклянные плашки (Glassmorphism Badges) */}
                <div className="absolute -bottom-4 -left-4 z-30 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-xl backdrop-blur-md hidden sm:flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-eco-100 text-eco-700">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-eco-900">14 мешков мусора</p>
                    <p className="text-[10px] text-eco-500">вывезено на переработку</p>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 z-30 rounded-2xl border border-white/80 bg-white/90 p-2.5 shadow-xl backdrop-blur-md hidden sm:flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Heart size={16} />
                  </div>
                  <span className="text-xs font-bold text-eco-900">8 волонтёров</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. О платформе (Обновленные стильные карточки с разным акцентом) ── */}
      <section className="border-t border-eco-100 bg-eco-50/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-eco-600">Наш подход</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-eco-950 md:text-4xl">
              Как EcoTown объединяет Уральск
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

      {/* ── 3. Последние уборки в Орале ── */}
      <RecentCleanupsSection />

      {/* ── 4. Публичная статистика ── */}
      <StatsSection />

      {/* ── 5. Как это работает (4 понятных шага с прогресс-линией) ── */}
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

      {/* ── 6. Финальный сочный призыв (CTA) ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-eco-950 via-eco-900 to-eco-950 py-20 text-white">
        {/* Фоновые круги */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-eco-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 backdrop-blur-md">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-500/20 px-3 py-1 text-xs font-semibold text-eco-300 border border-eco-500/30">
                <Sparkles size={14} /> Включайся прямо сейчас
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-4xl">
                Готов сделать Уральск чище вместе с нами?
              </h2>
              <p className="mt-3 text-sm text-eco-200 leading-relaxed">
                Отметь грязную точку в своём районе или присоединяйся к уже запланированному субботнику. Каждая метка имеет значение!
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              {user ? (
                <Link href="/favorites">
                  <Button size="lg" className="bg-white text-eco-950 hover:bg-eco-50 shadow-xl font-bold">
                    Личный кабинет
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" className="bg-white text-eco-950 hover:bg-eco-50 shadow-xl font-bold">
                    Присоединиться
                  </Button>
                </Link>
              )}
              <Link href="/map">
                <Button size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10">
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
