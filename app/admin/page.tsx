import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDonationsPanel, DonationWithDetails } from "@/components/AdminDonationsPanel";
import type { AppSettings } from "@/lib/types";

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

  // Загружаем все заявки со всеми связями (метка, профиль заявителя с телефоном, транзакции)
  const { data: rawDonations } = await supabase
    .from("spot_donations")
    .select("*, spots(id, title), profiles(id, display_name, phone, avatar_url), donation_transactions(*)")
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase.from("app_settings").select("*").eq("id", true).single();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-eco-900">⚙️ Админ-панель модерации</h1>
        <p className="mt-1 text-sm text-eco-600">
          Управление заявками на донаты, номерами телефонов Kaspi, просмотр перечисляемых средств и истории.
        </p>
      </div>

      <AdminDonationsPanel
        initialDonations={(rawDonations ?? []) as unknown as DonationWithDetails[]}
        initialSettings={(settings ?? null) as AppSettings | null}
        currentUserId={user.id}
      />
    </main>
  );
}
