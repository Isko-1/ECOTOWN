import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDonationsPanel } from "@/components/AdminDonationsPanel";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";
import type { SpotDonation, Spot, Profile, AppSettings, AdminUserRow } from "@/lib/types";

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

  // Доступ только для role='admin' — обычные пользователи сюда не попадают,
  // даже если знают прямой URL.
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

  // RPC сама проверяет role='admin' на сервере — двойная защита поверх редиректа выше
  const { data: users } = await supabase.rpc("admin_list_users");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-eco-900">Админ-панель</h1>
      <p className="mt-1 text-sm text-eco-600">Заявки на донаты, активные сборы и общие настройки платформы.</p>

      <AdminDonationsPanel
        pending={(pending ?? []) as unknown as PendingRow[]}
        active={(active ?? []) as unknown as PendingRow[]}
        settings={(settings ?? null) as AppSettings | null}
      />

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-eco-900">
          Пользователи ({(users ?? []).length})
        </h2>
        <p className="mt-1 text-sm text-eco-600">
          Модератор может редактировать любую метку на карте, админ — ещё и всё, что выше на этой странице.
        </p>
        <div className="mt-3">
          <AdminUsersPanel users={(users ?? []) as AdminUserRow[]} myId={user.id} />
        </div>
      </section>
    </main>
  );
}
