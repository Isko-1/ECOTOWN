import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import { UserAchievements } from "@/components/UserAchievements";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // На случай, если триггер handle_new_user почему-то не создал строку профиля
  const safeProfile: Profile =
    profile ?? {
      id: user.id,
      display_name: user.email?.split("@")[0] ?? "Волонтёр",
      avatar_url: null,
      bio: null,
      city: null,
      phone: null,
      role: "user",
      created_at: new Date().toISOString(),
    };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-eco-900">Мой профиль</h1>
      <p className="mt-1 text-sm text-eco-500">Имя и фото видят другие волонтёры в списке участников метки.</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div>
          <ProfileForm profile={safeProfile} />
        </div>
        <div>
          <UserAchievements profile={safeProfile} />
        </div>
      </div>
    </main>
  );
}

