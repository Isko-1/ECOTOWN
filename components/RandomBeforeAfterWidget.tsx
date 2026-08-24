import { createClient } from "@/lib/supabase/server";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

export async function RandomBeforeAfterWidget() {
  const supabase = await createClient();

  const { data: spots } = await supabase
    .from("spots")
    .select("id, title, photo_before_url, photo_after_url")
    .eq("status", "done")
    .not("photo_before_url", "is", null)
    .not("photo_after_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (!spots || spots.length === 0) return null;

  const spot = spots[Math.floor(Math.random() * spots.length)];

  return (
    <div className="relative rounded-3xl border border-eco-200/80 bg-white p-4 shadow-2xl shadow-eco-900/10">
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-eco-800 truncate">
          {spot.title}
        </span>
        <span className="rounded-full bg-eco-100 px-2 py-0.5 text-[10px] font-bold text-eco-700 shrink-0">
          Результат уборки
        </span>
      </div>

      <BeforeAfterSlider
        beforeUrl={spot.photo_before_url!}
        afterUrl={spot.photo_after_url!}
      />
    </div>
  );
}
