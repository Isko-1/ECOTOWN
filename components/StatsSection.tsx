import { MapPin, CheckCircle2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function StatsSection() {
  const supabase = await createClient();

  const [spots, done, volunteers] = await Promise.all([
    supabase.from("spots").select("*", { count: "exact", head: true }).eq("is_public", true),
    supabase.from("spots").select("*", { count: "exact", head: true }).eq("is_public", true).eq("status", "done"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { icon: MapPin, value: spots.count ?? 0, label: "Меток на карте" },
    { icon: CheckCircle2, value: done.count ?? 0, label: "Уборок завершено" },
    { icon: Users, value: volunteers.count ?? 0, label: "Волонтёров с нами" },
  ];

  return (
    <section className="border-t border-eco-100 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-2xl font-bold text-eco-900 md:text-3xl">EcoTown в цифрах</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-eco-100 bg-white p-6 text-center">
              <s.icon className="mx-auto text-eco-600" size={28} />
              <p className="mt-3 font-display text-3xl font-bold text-eco-900">{s.value}</p>
              <p className="mt-1 text-sm text-eco-700">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
