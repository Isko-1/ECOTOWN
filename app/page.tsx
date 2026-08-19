import Link from "next/link";
import { MapPin, Users, ImageIcon, UserPlus, PenLine, HandHeart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/ContactForm";
import { StatsSection } from "@/components/StatsSection";
import { createClient } from "@/lib/supabase/server";

const pillars = [
  {
    icon: MapPin,
    title: "Карта города",
    text: "Жители отмечают загрязнённые места прямо на карте — свалки, замусоренные дворы, заброшенные территории.",
  },
  {
    icon: Users,
    title: "Волонтёры",
    text: "Любой может взять метку в работу и организовать уборку вместе с другими волонтёрами Орала.",
  },
  {
    icon: ImageIcon,
    title: "До / После",
    text: "Каждая закрытая метка подтверждается фотографиями до и после уборки — прозрачно и наглядно.",
  },
];

const steps = [
  { icon: UserPlus, title: "Зарегистрируйся", text: "Заведи аккаунт волонтёра — это займёт меньше минуты." },
  { icon: PenLine, title: "Отметь место", text: "Укажи точку на карте, опиши проблему и оцени сложность уборки." },
  { icon: HandHeart, title: "Возьми в работу", text: "Присоединись к уже отмеченной метке или собери команду на свою." },
  { icon: CheckCircle2, title: "Закрой метку", text: "Загрузи фото до/после — метка получит статус «Закрыто»." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-eco-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-eco-700">
            Волонтёрская платформа Орала
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-eco-900 md:text-5xl lg:text-6xl">
            Чистый город начинается с одной отмеченной точки на карте
          </h1>
          <p className="mt-5 text-base text-eco-700 md:text-lg">
            EcoTown — это карта, на которую жители отмечают загрязнённые места, а волонтёры берут их в работу и закрывают, подтверждая уборку фото до/после.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link href="/favorites"><Button size="lg">Личный кабинет</Button></Link>
            ) : (
              <Link href="/register"><Button size="lg">Зарегистрироваться</Button></Link>
            )}
            <Link href="/map"><Button size="lg" variant="secondary">Открыть карту</Button></Link>
          </div>
        </div>
      </section>

      {/* О платформе */}
      <section className="border-t border-eco-100 bg-eco-50/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold text-eco-900 md:text-3xl">О платформе</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-eco-100 bg-white p-6">
                <p.icon className="text-eco-600" size={28} />
                <h3 className="mt-4 font-display text-lg font-semibold text-eco-900">{p.title}</h3>
                <p className="mt-2 text-sm text-eco-700">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Статистика */}
      <StatsSection />

      {/* Как это работает */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold text-eco-900 md:text-3xl">Как это работает</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-eco-100 p-6">
                <span className="text-sm font-semibold text-eco-400">{String(i + 1).padStart(2, "0")}</span>
                <s.icon className="mt-3 text-eco-600" size={24} />
                <h3 className="mt-3 font-display text-base font-semibold text-eco-900">{s.title}</h3>
                <p className="mt-1 text-sm text-eco-700">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + донаты */}
      <section className="border-t border-eco-100 bg-eco-800 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Готов сделать город чище?</h2>
            <p className="mt-2 max-w-md text-eco-100">
              {user
                ? "Открой карту и возьми метку в работу — или поддержи сложные уборки донатом."
                : "Присоединяйся к волонтёрам EcoTown или поддержи сложные уборки донатом."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link href="/favorites">
                <Button size="lg" className="bg-white text-eco-900 hover:bg-eco-50">Личный кабинет</Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button size="lg" className="bg-white text-eco-900 hover:bg-eco-50">Присоединиться</Button>
              </Link>
            )}
            <Link href="/map">
              <Button size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10">
                Посмотреть карту
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Контакты */}
      <ContactSection />
    </main>
  );
}

function ContactSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="font-display text-2xl font-bold text-eco-900 md:text-3xl">Свяжитесь с нами</h2>
        <p className="mt-2 text-eco-700">Вопросы, предложения по партнёрству или спонсорству — пишите.</p>
        <ContactForm />
      </div>
    </section>
  );
}
