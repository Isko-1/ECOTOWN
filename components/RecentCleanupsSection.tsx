import Link from "next/link";
import { Sparkles, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ShareButton } from "@/components/ShareButton";
import type { Spot } from "@/lib/types";

// Демо-данные для Уральска на случай, если в БД ещё нет закрытых меток с фото
const MOCK_CLEANUPS: Partial<Spot>[] = [
  {
    id: "demo-1",
    title: "Набережная реки Чаган",
    description: "Собрали 14 мешков пластика и сухостоя вдоль прогулочной зоны.",
    photo_before_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    photo_after_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    status: "done",
    difficulty: 3,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "demo-2",
    title: "Зачаганск, ул. Монкеулы",
    description: "Ликвидировали стихийную свалку строительных отходов во дворе.",
    photo_before_url: "https://images.unsplash.com/photo-1611284446314-60a55ac7deab?auto=format&fit=crop&w=800&q=80",
    photo_after_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    status: "done",
    difficulty: 4,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export async function RecentCleanupsSection() {
  const supabase = await createClient();

  const { data: dbSpots } = await supabase
    .from("spots")
    .select("*")
    .eq("status", "done")
    .not("photo_before_url", "is", null)
    .not("photo_after_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(2);

  const cleanups = (dbSpots && dbSpots.length > 0 ? dbSpots : MOCK_CLEANUPS) as Spot[];

  return (
    <section className="py-20 bg-gradient-to-b from-eco-50/40 via-white to-eco-50/20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-eco-100/80 px-3 py-1 text-xs font-semibold text-eco-800">
              <Sparkles size={14} className="text-eco-600" />
              Живой результат в Орале
            </div>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-eco-950 md:text-4xl tracking-tight">
              Смотрите, как меняется город
            </h2>
            <p className="mt-2 text-eco-700 max-w-lg">
              Результаты уборок наших волонтёров в Уральске. Потяните ползунок на фото, чтобы увидеть разницу!
            </p>
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 text-sm font-bold text-eco-700 hover:text-eco-900 transition-colors group"
          >
            Все метки на карте
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {cleanups.map((spot) => (
            <div
              key={spot.id}
              className="group relative flex flex-col rounded-3xl border border-eco-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-eco-200"
            >
              {/* Слайдер до/после */}
              <div className="mb-4">
                <BeforeAfterSlider
                  beforeUrl={spot.photo_before_url!}
                  afterUrl={spot.photo_after_url!}
                />
              </div>

              {/* Инфо по метке */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-eco-600">
                      <MapPin size={13} /> Уральск
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-eco-50 px-2.5 py-0.5 text-xs font-semibold text-eco-700 border border-eco-100">
                      <CheckCircle2 size={13} /> Закрыто
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-lg font-bold text-eco-950 group-hover:text-eco-700 transition-colors">
                    {spot.title}
                  </h3>
                  <p className="mt-1 text-sm text-eco-600 line-clamp-2 leading-relaxed">
                    {spot.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-eco-100/80 flex items-center justify-between">
                  <span className="text-xs text-eco-400">
                    {new Date(spot.created_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <ShareButton spotId={spot.id} spotTitle={spot.title} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
