import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDonationsPanel } from "@/components/AdminDonationsPanel";
import type { SpotDonation, Spot, Profile, AppSettings } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  type PendingRow = SpotDonation & { spots: Pick<Spot, "id" | "title"> | null; profiles: Pick<Profile, "display_name"> | null };

  const { data: pending } = await supabase
    .from("spot_donations")
    .select("*, spots(id, title), profiles(display_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: active } = await supabase
    .from("spot_donations")
    .select("*, spots(id, title), profiles(display_name)")
    .in("status", ["approved", "completed"])
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase.from("app_settings").select("*").eq("id", true).single();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-eco-900">Админ-панель</h1>
      <p className="mt-1 text-sm text-eco-600">Заявки на донаты, активные сборы и общие настройки платформы.</p>

      <AdminDonationsPanel
        pending={(pending ?? []) as unknown as PendingRow[]}
        active={(active ?? []) as unknown as PendingRow[]}
        settings={(settings ?? null) as AppSettings | null}
      />
    </main>
  );
}
